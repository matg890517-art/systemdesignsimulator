import { blastRadius } from './blast.ts'
import { requestConservationHolds } from './conservation.ts'
import { createRng } from './rng.ts'
import { sampleDistribution } from './values.ts'
import { offeredAt } from './workload.ts'
import type {
  BreakerState,
  Component,
  DiscreteFault,
  DiscreteRunResult,
  Edge,
  RequestClassId,
  SimEvent,
  SimRequest,
  Topology,
  Workload,
} from './types.ts'

type HeapItem = { t: number; seq: number; event: InternalEvent }

type InternalEvent =
  | { type: 'generate'; at: string; classId: RequestClassId }
  | { type: 'arrive'; req: SimRequest; at: string; edgeId?: string }
  | { type: 'finish'; req: SimRequest; at: string }
  | { type: 'fault'; fault: DiscreteFault }

type BreakerRuntime = {
  state: BreakerState
  openUntil: number
  probesLeft: number
  window: { t: number; error: boolean }[]
}

type CompRuntime = {
  busy: number
  crashed: boolean
  queue: { req: SimRequest; arrivedAtMs: number }[]
  finishAt: Map<string, number>
}

function less(a: HeapItem, b: HeapItem): boolean {
  return a.t < b.t || (a.t === b.t && a.seq < b.seq)
}

class MinHeap {
  data: HeapItem[] = []

  get size() {
    return this.data.length
  }

  peek(): HeapItem | undefined {
    return this.data[0]
  }

  push(item: HeapItem) {
    this.data.push(item)
    this.up(this.data.length - 1)
  }

  pop(): HeapItem | undefined {
    if (this.data.length === 0) return undefined
    const top = this.data[0]
    const last = this.data.pop()
    if (last === undefined) return top
    if (this.data.length) {
      this.data[0] = last
      this.down(0)
    }
    return top
  }

  private up(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!less(this.data[i]!, this.data[p]!)) break
      ;[this.data[i], this.data[p]] = [this.data[p]!, this.data[i]!]
      i = p
    }
  }

  private down(i: number) {
    const n = this.data.length
    for (;;) {
      const l = i * 2 + 1
      const r = l + 1
      let m = i
      if (l < n && less(this.data[l]!, this.data[m]!)) m = l
      if (r < n && less(this.data[r]!, this.data[m]!)) m = r
      if (m === i) break
      ;[this.data[i], this.data[m]] = [this.data[m]!, this.data[i]!]
      i = m
    }
  }
}

function serversOf(component: Component): number {
  const value = component.behavior.servers
  return value.state === 'set' ? value.value : Number.POSITIVE_INFINITY
}

function failProbOf(component: Component): number {
  const value = component.behavior.failProb
  if (!value || value.state !== 'set') return 0
  return value.value
}

function queueCapOf(component: Component): number | 'unbounded' {
  const value = component.behavior.queueCapacity
  return value.state === 'set' ? value.value : 'unbounded'
}

function hitRateOf(component: Component): number | undefined {
  const value = component.behavior.cacheHitRate
  if (!value || value.state !== 'set') return undefined
  return value.value
}

function backoffMs(edge: Edge, attempt: number): number {
  const retry = edge.retry
  if (!retry) return 0
  if (retry.backoff === 'exponential') return retry.baseMs * 2 ** Math.max(0, attempt - 1)
  return retry.baseMs
}

function pickOutgoing(
  edges: Edge[],
  classId: RequestClassId,
  rng: () => number,
): Edge[] {
  const matching = edges.filter((edge) => {
    if (edge.routing.mode === 'conditional') return edge.routing.classes.includes(classId)
    return classId in edge.classes || Object.keys(edge.classes).length === 0
  })
  if (matching.length === 0) return []
  if (matching.some((edge) => edge.routing.mode === 'broadcast')) {
    return matching.filter((edge) => edge.routing.mode === 'broadcast')
  }
  const weighted = matching.filter((edge) => edge.routing.mode === 'weighted')
  if (weighted.length) {
    const sum = weighted.reduce(
      (acc, edge) => acc + (edge.routing.mode === 'weighted' ? edge.routing.weight : 0),
      0,
    )
    let roll = rng() * sum
    for (const edge of weighted) {
      const w = edge.routing.mode === 'weighted' ? edge.routing.weight : 0
      roll -= w
      if (roll <= 0) return [edge]
    }
    return [weighted[weighted.length - 1]!]
  }
  return matching.slice(0, 1)
}

function cloneReq(req: SimRequest, patch: Partial<SimRequest>): SimRequest {
  return {
    ...req,
    ...patch,
    path: patch.path ?? [...req.path],
  }
}

export function runDiscrete(topology: Topology, workload: Workload): DiscreteRunResult {
  const rng = createRng(workload.seed)
  const heap = new MinHeap()
  let seq = 0
  const endMs = workload.durationSec * 1000
  const events: SimEvent[] = []

  const byId = new Map(topology.components.map((component) => [component.id, component]))
  const comps = new Map<string, CompRuntime>()
  for (const component of topology.components) {
    comps.set(component.id, {
      busy: 0,
      crashed: false,
      queue: [],
      finishAt: new Map(),
    })
  }

  const lossOf = new Map<string, number>()
  const latencyOf = new Map<string, number>()
  const breakers = new Map<string, BreakerRuntime>()
  for (const edge of topology.edges) {
    lossOf.set(edge.id, edge.network.lossProb)
    latencyOf.set(edge.id, edge.network.latencyMs)
    if (edge.breaker) {
      breakers.set(edge.id, {
        state: 'closed',
        openUntil: 0,
        probesLeft: 0,
        window: [],
      })
    }
  }

  const counts = {
    created: 0,
    completed: 0,
    rejected: 0,
    dropped: 0,
    expired: 0,
    inFlight: 0,
    breakerRejected: 0,
    attempts: 0,
  }
  const cacheLookups = new Map<string, { lookups: number; hits: number }>()
  const live = new Set<string>()
  const waits: number[] = []
  const networkMs: number[] = []
  const affected = new Set<string>()
  let nextId = 1

  function log(event: SimEvent) {
    events.push(event)
  }

  function schedule(t: number, event: InternalEvent) {
    seq += 1
    heap.push({ t, seq, event })
  }

  function retire(kind: 'completed' | 'rejected' | 'dropped' | 'expired' | 'breaker') {
    counts[kind === 'breaker' ? 'rejected' : kind] += 1
    if (kind === 'breaker') counts.breakerRejected += 1
  }

  function markLive(id: string) {
    live.add(id)
  }

  function markDone(id: string) {
    live.delete(id)
  }

  function newRequest(
    t: number,
    classId: RequestClassId,
    edge: Edge | undefined,
    parent?: SimRequest,
  ): SimRequest {
    const spec = edge?.classes[classId]
    const id = `r${nextId++}`
    const req: SimRequest = {
      id,
      traceId: parent?.traceId ?? id,
      classId,
      requestBytes: spec?.requestBytes ?? 0,
      responseBytes: spec?.responseBytes ?? 0,
      createdAtMs: parent?.createdAtMs ?? t,
      attempt: parent ? parent.attempt : 1,
      path: parent ? [...parent.path] : [],
      edgeId: edge?.id,
      deadlineMs: edge?.call.deadlineMs !== undefined ? t + edge.call.deadlineMs : parent?.deadlineMs,
    }
    return req
  }

  function breakerAdmit(edge: Edge, t: number): boolean {
    const runtime = breakers.get(edge.id)
    const spec = edge.breaker
    if (!runtime || !spec) return true
    if (runtime.state === 'open') {
      if (t >= runtime.openUntil) {
        runtime.state = 'half_open'
        runtime.probesLeft = spec.probes
        seq += 1
        log({ t, seq, type: 'breaker-change', edge: edge.id, to: 'half_open' })
      } else {
        return false
      }
    }
    if (runtime.state === 'half_open') {
      if (runtime.probesLeft <= 0) return false
      runtime.probesLeft -= 1
    }
    return true
  }

  function breakerObserve(edge: Edge, t: number, error: boolean) {
    const runtime = breakers.get(edge.id)
    const spec = edge.breaker
    if (!runtime || !spec) return
    runtime.window.push({ t, error })
    runtime.window = runtime.window.filter((row) => t - row.t <= spec.windowMs)
    if (runtime.state === 'half_open') {
      if (error) {
        runtime.state = 'open'
        runtime.openUntil = t + spec.openMs
        seq += 1
        log({ t, seq, type: 'breaker-change', edge: edge.id, to: 'open' })
      } else if (runtime.probesLeft === 0) {
        runtime.state = 'closed'
        seq += 1
        log({ t, seq, type: 'breaker-change', edge: edge.id, to: 'closed' })
      }
      return
    }
    if (runtime.state !== 'closed') return
    const total = runtime.window.length
    const errors = runtime.window.filter((row) => row.error).length
    if (total >= spec.minRequests && errors / total >= spec.errorThreshold) {
      runtime.state = 'open'
      runtime.openUntil = t + spec.openMs
      seq += 1
      log({ t, seq, type: 'breaker-change', edge: edge.id, to: 'open' })
    }
  }

  function send(req: SimRequest, edge: Edge, t: number, asRetry = false) {
    if (req.deadlineMs !== undefined && t > req.deadlineMs) {
      retire('expired')
      markDone(req.id)
      log({ t, seq, type: 'timeout', req, edge: edge.id })
      return
    }
    if (!breakerAdmit(edge, t)) {
      retire('breaker')
      markDone(req.id)
      return
    }
    const p = lossOf.get(edge.id) ?? edge.network.lossProb
    if (rng() < p) {
      retire('dropped')
      markDone(req.id)
      breakerObserve(edge, t, true)
      return
    }
    let delay = latencyOf.get(edge.id) ?? edge.network.latencyMs
    const bps = edge.network.bandwidthBps
    if (edge.network.serialization && bps !== undefined && bps > 0) {
      const bytes =
        edge.network.bandwidthApplies === 'response'
          ? req.responseBytes
          : edge.network.bandwidthApplies === 'request'
            ? req.requestBytes
            : req.requestBytes + req.responseBytes
      delay += (bytes * 8 * 1000) / bps
    }
    networkMs.push(delay)
    const copy = cloneReq(req, { edgeId: edge.id })
    if (asRetry) {
      log({ t, seq, type: 'retry', req: copy, edge: edge.id })
    }
    schedule(t + delay, { type: 'arrive', req: copy, at: edge.to, edgeId: edge.id })
  }

  function retryOrReject(req: SimRequest, componentId: string, t: number, error: boolean) {
    const edge = topology.edges.find((item) => item.id === req.edgeId)
    if (edge) breakerObserve(edge, t, error)
    const retry = edge?.retry
    const maxRetries = retry ? Math.min(retry.max, retry.budget) : 0
    if (edge && retry && req.attempt <= maxRetries) {
      const next = cloneReq(req, { attempt: req.attempt + 1, arrivedAtMs: undefined })
      schedule(t + backoffMs(edge, next.attempt), {
        type: 'arrive',
        req: next,
        at: componentId,
        edgeId: edge.id,
      })
      log({ t, seq, type: 'retry', req: next, edge: edge.id })
      return
    }
    retire('rejected')
    markDone(req.id)
  }

  function startService(component: Component, runtime: CompRuntime, req: SimRequest, t: number) {
    runtime.busy += 1
    counts.attempts += 1
    const dist = component.behavior.serviceTime[req.classId]
    const serviceMs = dist && dist.state === 'set' ? sampleDistribution(dist.value, rng) : 0
    runtime.finishAt.set(req.id, t + serviceMs)
    schedule(t + serviceMs, { type: 'finish', req, at: component.id })
  }

  function tryAdmit(component: Component, runtime: CompRuntime, req: SimRequest, t: number) {
    if (req.deadlineMs !== undefined && t > req.deadlineMs) {
      retire('expired')
      markDone(req.id)
      if (req.edgeId) log({ t, seq, type: 'timeout', req, edge: req.edgeId })
      return
    }
    const servers = runtime.crashed ? 0 : serversOf(component)
    const cap = queueCapOf(component)
    if (servers <= 0) {
      retryOrReject(req, component.id, t, true)
      return
    }
    if (runtime.busy < servers) {
      if (t >= endMs * 0.3) {
        waits.push(req.arrivedAtMs !== undefined ? t - req.arrivedAtMs : 0)
      }
      startService(component, runtime, req, t)
      return
    }
    if (cap !== 'unbounded' && runtime.queue.length >= cap) {
      retryOrReject(req, component.id, t, true)
      return
    }
    runtime.queue.push({ req, arrivedAtMs: t })
  }

  function route(component: Component, req: SimRequest, t: number) {
    const outgoing = topology.edges.filter((edge) => edge.from === component.id)
    const chosen = pickOutgoing(outgoing, req.classId, rng)
    if (chosen.length === 0) {
      retire('completed')
      markDone(req.id)
      return
    }
    const oneHop = chosen.length === 1 && Math.max(1, chosen[0]!.fanOut) === 1
    for (const edge of chosen) {
      const copies = Math.max(1, edge.fanOut)
      for (let i = 0; i < copies; i++) {
        const child = oneHop ? req : cloneReq(req, { id: `r${nextId++}`, attempt: 1 })
        if (child.id !== req.id) {
          markLive(child.id)
          counts.created += 1
        }
        send(child, edge, t)
      }
    }
    if (!oneHop) {
      markDone(req.id)
      retire('completed')
    }
  }

  function onArrive(req: SimRequest, at: string, t: number, edgeId?: string) {
    const component = byId.get(at)
    const runtime = comps.get(at)
    if (!component || !runtime) return
    const arrived = cloneReq(req, {
      edgeId: edgeId ?? req.edgeId,
      arrivedAtMs: t,
      path: [...req.path, at],
    })
    log({ t, seq, type: 'arrive', req: arrived, at })
    if (component.kind === 'traffic_generator') {
      route(component, arrived, t)
      return
    }
    tryAdmit(component, runtime, arrived, t)
  }

  function onFinish(req: SimRequest, at: string, t: number) {
    const component = byId.get(at)
    const runtime = comps.get(at)
    if (!component || !runtime) return
    runtime.busy = Math.max(0, runtime.busy - 1)
    runtime.finishAt.delete(req.id)
    log({ t, seq, type: 'finish-service', req, at })
    if (runtime.crashed) {
      retryOrReject(req, at, t, true)
    } else if (rng() < failProbOf(component)) {
      retryOrReject(req, at, t, true)
    } else {
      if (req.edgeId) {
        const edge = topology.edges.find((item) => item.id === req.edgeId)
        if (edge) breakerObserve(edge, t, false)
      }
      const hitRate = hitRateOf(component)
      if (hitRate !== undefined) {
        const row = cacheLookups.get(component.id) ?? { lookups: 0, hits: 0 }
        row.lookups += 1
        if (rng() < hitRate) {
          row.hits += 1
          cacheLookups.set(component.id, row)
          retire('completed')
          markDone(req.id)
        } else {
          cacheLookups.set(component.id, row)
          route(component, req, t)
        }
      } else {
        route(component, req, t)
      }
    }
    const next = runtime.queue.shift()
    if (next && !runtime.crashed && serversOf(component) > runtime.busy) {
      if (t >= endMs * 0.3) waits.push(t - next.arrivedAtMs)
      startService(component, runtime, next.req, t)
    }
  }

  function onFault(fault: DiscreteFault, t: number) {
    log({ t, seq, type: 'fault', fault })
    if (fault.kind === 'crash') {
      const runtime = comps.get(fault.componentId)
      if (!runtime) return
      runtime.crashed = true
      for (const id of blastRadius(topology, fault.componentId)) affected.add(id)
      while (runtime.queue.length) {
        const row = runtime.queue.shift()
        if (row) retryOrReject(row.req, fault.componentId, t, true)
      }
      runtime.busy = 0
      return
    }
    if (fault.kind === 'link-cut') {
      lossOf.set(fault.edgeId, 1)
      return
    }
    if (fault.kind === 'packet-loss') {
      lossOf.set(fault.edgeId, fault.lossProb)
      return
    }
    latencyOf.set(fault.edgeId, (latencyOf.get(fault.edgeId) ?? 0) + fault.addMs)
  }

  for (const component of topology.components) {
    if (component.kind !== 'traffic_generator') continue
    const rates = workload.offered[component.id] ?? {}
    for (const classId of Object.keys(rates)) {
      const rps = offeredAt(workload, component.id, classId, 0)
      if (rps <= 0) continue
      const first = -Math.log(1 - rng()) * (1000 / rps)
      schedule(first, { type: 'generate', at: component.id, classId })
    }
  }
  for (const fault of workload.faults ?? []) {
    schedule(fault.tSec * 1000, { type: 'fault', fault })
  }

  while (heap.size) {
    const item = heap.pop()
    if (!item) break
    if (item.t > endMs) {
      heap.push(item)
      break
    }
    const { t, event } = item
    if (event.type === 'generate') {
      const rps = offeredAt(workload, event.at, event.classId, t / 1000)
      if (rps > 0) {
        const req = newRequest(t, event.classId, undefined)
        counts.created += 1
        markLive(req.id)
        onArrive(req, event.at, t)
        const gap = -Math.log(1 - rng()) * (1000 / rps)
        const nextT = t + gap
        if (nextT <= endMs) schedule(nextT, event)
      }
      continue
    }
    if (event.type === 'arrive') {
      onArrive(event.req, event.at, t, event.edgeId)
      continue
    }
    if (event.type === 'finish') {
      onFinish(event.req, event.at, t)
      continue
    }
    onFault(event.fault, t)
  }

  counts.inFlight = live.size
  if (!requestConservationHolds(counts)) {
    throw new Error(
      `J2 conservation failed: created=${counts.created} completed=${counts.completed} rejected=${counts.rejected} dropped=${counts.dropped} expired=${counts.expired} inFlight=${counts.inFlight}`,
    )
  }

  const meanWaitMs = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0
  const meanNetworkMs = networkMs.length
    ? networkMs.reduce((a, b) => a + b, 0) / networkMs.length
    : 0
  const sent = counts.created
  const measuredLoss = sent === 0 ? 0 : counts.dropped / sent
  const meanAttempts = counts.created === 0 ? 0 : counts.attempts / counts.created

  const cacheStats: DiscreteRunResult['cacheStats'] = {}
  for (const [id, row] of cacheLookups) {
    cacheStats[id] = {
      lookups: row.lookups,
      hits: row.hits,
      measuredHitRate: row.lookups === 0 ? 0 : row.hits / row.lookups,
    }
  }

  return {
    seed: workload.seed,
    events,
    counts,
    meanWaitMs,
    meanAttempts,
    measuredLoss,
    meanNetworkMs,
    affectedComponentIds: [...affected],
    cacheStats,
  }
}

export function replayDiscreteLog(result: DiscreteRunResult): string {
  return JSON.stringify(result.events)
}

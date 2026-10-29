import { zipfCdf } from '../analytic/zipf.ts'
import { meanMsFromDist } from '../analytic/queue.ts'
import { serverCount } from '../schema/scenario.ts'
import type { CompiledModel } from '../compile/compile.ts'
import type { EngineResult, NodeResult, SimTick } from '../schema/result.ts'
import type { WorkloadRow } from '../schema/scenario.ts'
import { tickEveryUs } from './ticks.ts'
import { ENGINE_VERSION, SCHEMA_VERSION } from '../schema/version.ts'
import { weakestEvidence, type Evidence } from '../schema/evidence.ts'
import { EventHeap, EventKind } from './heap.ts'
import { LatencyHist } from './histogram.ts'
import { sampleExponential, sampleServiceMs, sampleZipfKey } from './dist.ts'
import { createStreamRng, type EngineRng } from './rng.ts'
import { checkConservation, checkLittle, checkUtilization } from '../verify/checks.ts'

const US = 1_000_000

type NodeRt = {
  busy: number
  servers: number
  K: number | null
  queue: number[]
  arrived: number
  completed: number
  dropped: number
  timedOut: number
  busyUs: number
  queueUs: number
  lastT: number
  hist: LatencyHist
  waitHist: LatencyHist
  zipf?: Float64Array
  cacheSize: number
  hitRatio: number
  hits: number
  lookups: number
  allArrived: number
  allCompleted: number
  allBusyUs: number
}

function emptyNode(status: NodeResult['status']): NodeResult {
  return {
    lambda: 0,
    rho: 0,
    status,
    Wq_ms: 0,
    W_ms: 0,
    p50: Number.NaN,
    p95: Number.NaN,
    p99: Number.NaN,
    L: 0,
    Lq: 0,
    throughput: 0,
    dropRate: 0,
    timeoutRate: 0,
    waitUnknown: true,
  }
}

export const WORKER_SLICE_MS = 8

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export type SimHooks = {
  cancelled?: () => boolean
  onProgress?: (info: { events: number; t_s: number; fraction: number; tick?: SimTick }) => void
  sliceMs?: number
  now?: () => number
  /** Simulated seconds per wall second. 1 = live clock. Unset = run as fast as the worker can. */
  pace?: number
  sleep?: (ms: number) => Promise<void>
}

function offeredAt(row: WorkloadRow, tUs: number): number {
  if (row.rate_rps <= 0) return 0
  if (row.profile !== 'ramp' || !row.ramp_s || row.ramp_s <= 0) return row.rate_rps
  return row.rate_rps * Math.min(1, tUs / US / row.ramp_s)
}

export function simulateOnce(compiled: CompiledModel, seed: number, hooks?: SimHooks): EngineResult {
  return buildSim(compiled, seed, hooks).runSync()
}

export async function simulateWithSlices(
  compiled: CompiledModel,
  seed: number,
  hooks?: SimHooks,
): Promise<EngineResult> {
  return buildSim(compiled, seed, hooks).runAsync()
}

function buildSim(compiled: CompiledModel, seed: number, hooks?: SimHooks) {
  const warnings = compiled.warnings.map((w) => w.message)
  if (compiled.invalid) {
    const result = invalidResult(compiled, seed, compiled.invalid, warnings)
    return { runSync: () => result, runAsync: async () => result }
  }
  const { scenario, nodes, edges } = compiled
  const durationUs = scenario.run.duration_s * US
  const warmupUs = scenario.run.warmup_s * US
  const budget = scenario.run.eventBudget
  const index = compiled.index
  const classList = [...new Set(scenario.workload.map((row) => row.classId))]
  const classIndex = new Map(classList.map((id, i) => [id, i]))

  const rng: Record<string, EngineRng> = {}
  const stream = (id: string, purpose: string) => {
    const key = `${id}:${purpose}`
    rng[key] ??= createStreamRng(seed, id, purpose)
    return rng[key]!
  }

  const rt: NodeRt[] = nodes.map((node) => ({
    busy: 0,
    servers: Math.max(1, serverCount(node)),
    K: node.buffer.K,
    queue: [],
    arrived: 0,
    completed: 0,
    dropped: 0,
    timedOut: 0,
    busyUs: 0,
    queueUs: 0,
    lastT: 0,
    hist: new LatencyHist(),
    waitHist: new LatencyHist(),
    zipf: node.cache ? zipfCdf(node.cache.workingSet, node.cache.zipfS) : undefined,
    cacheSize: node.cache?.cacheSize ?? 0,
    hitRatio: compiled.hitRatio.get(node.id) ?? node.hitRatio ?? 0,
    hits: 0,
    lookups: 0,
    allArrived: 0,
    allCompleted: 0,
    allBusyUs: 0,
  }))

  type Req = { classId: string; birth: number; arrived: number; deadline: number; serviceAt: number }
  const reqs: Req[] = []
  const heap = new EventHeap()
  let seq = 1
  let events = 0
  let inFlight = 0
  let created = 0
  let systemDone = 0

  const schedule = (t: number, kind: number, a: number, b: number) => {
    heap.push(Math.round(t), seq++, kind, a, b)
  }

  for (const row of scenario.workload) {
    if ((row.profile !== 'constant' && row.profile !== 'ramp') || row.rate_rps <= 0) continue
    const ni = index.get(row.clientId)
    const ci = classIndex.get(row.classId)
    if (ni === undefined || ci === undefined) continue
    const rngA = stream(row.clientId, 'arrivals')
    const ia = sampleExponential(rngA, 1 / row.rate_rps) * US
    schedule(ia, EventKind.generate, ni, ci)
  }

  const outgoing = (from: string, classId: string) =>
    edges.filter((edge) => edge.from === from && edge.perClass[classId])

  const pickTargets = (from: string, classId: string): { to: number; latencyUs: number; kind: string }[] => {
    const group = outgoing(from, classId)
    if (!group.length) return []
    const hop0 = group[0]!.perClass[classId]!
    if (hop0.routing === 'broadcast') {
      return group.flatMap((edge) => {
        const hop = edge.perClass[classId]!
        const to = index.get(edge.to)
        if (to === undefined) return []
        const copies = Math.max(1, hop.calls)
        return Array.from({ length: copies }, () => ({
          to,
          latencyUs: hop.latency.mean_ms * 1000,
          kind: hop.kind,
        }))
      })
    }
    if (hop0.routing === 'weighted') {
      const sum = group.reduce((s, edge) => s + (edge.perClass[classId]?.weight ?? 0), 0)
      const u = stream(from, 'routing').next() * sum
      let acc = 0
      let chosen = group[0]!
      for (const edge of group) {
        acc += edge.perClass[classId]!.weight
        if (u <= acc) {
          chosen = edge
          break
        }
      }
      const hop = chosen.perClass[classId]!
      const to = index.get(chosen.to)
      if (to === undefined) return []
      return Array.from({ length: Math.max(1, hop.calls) }, () => ({
        to,
        latencyUs: hop.latency.mean_ms * 1000,
        kind: hop.kind,
      }))
    }
    const out: { to: number; latencyUs: number; kind: string }[] = []
    for (const edge of group) {
      const hop = edge.perClass[classId]!
      const to = index.get(edge.to)
      if (to === undefined) continue
      for (let c = 0; c < Math.max(1, hop.calls); c++) {
        out.push({ to, latencyUs: hop.latency.mean_ms * 1000, kind: hop.kind })
      }
    }
    return out
  }

  const record = (t: number) => t >= warmupUs

  const hopKey = (from: string, to: string, classId: string) => `${from}\0${to}\0${classId}`
  const edgeIdByHop = new Map<string, string>()
  for (const edge of edges) {
    for (const classId of Object.keys(edge.perClass)) {
      edgeIdByHop.set(hopKey(edge.from, edge.to, classId), edge.id)
    }
  }
  const edgeHits: Record<string, Record<string, number>> = {}
  for (const edge of edges) {
    edgeHits[edge.id] = {}
    for (const classId of Object.keys(edge.perClass)) {
      edgeHits[edge.id]![classId] = 0
    }
  }
  const series: SimTick[] = []
  const dtUs = scenario.run.dt_s && scenario.run.dt_s > 0 ? scenario.run.dt_s * US : undefined
  const tickStepUs = tickEveryUs(durationUs, dtUs)
  let lastSnapUs = 0
  const lastArrived = rt.map(() => 0)
  const lastCompleted = rt.map(() => 0)
  const lastBusyUs = rt.map(() => 0)
  const lastHits: Record<string, Record<string, number>> = {}
  for (const edge of edges) {
    lastHits[edge.id] = {}
    for (const classId of Object.keys(edge.perClass)) lastHits[edge.id]![classId] = 0
  }
  let prevNow: SimTick | undefined

  const stampBusy = (ni: number, t: number) => {
    const node = rt[ni]!
    const dt = t - node.lastT
    if (dt > 0) {
      node.allBusyUs += node.busy * dt
      if (record(node.lastT)) {
        node.busyUs += node.busy * dt
        node.queueUs += node.queue.length * dt
      }
      node.lastT = t
    }
  }

  const snapshot = (tUs: number): SimTick => {
    const elapsed = tUs / US
    const windowUs = Math.max(0, tUs - lastSnapUs)
    const window = windowUs / US
    const nodeOut: SimTick['nodes'] = {}
    for (let i = 0; i < nodes.length; i++) {
      stampBusy(i, tUs)
      const node = nodes[i]!
      const r = rt[i]!
      const serviceMs = meanMsFromDist(node.service) ?? 0
      const prev = prevNow?.nodes[node.id]
      const dArr = r.allArrived - lastArrived[i]!
      const dDone = r.allCompleted - lastCompleted[i]!
      const dBusy = r.allBusyUs - lastBusyUs[i]!
      nodeOut[node.id] = {
        lambda: elapsed > 0 ? r.allArrived / elapsed : 0,
        rho: elapsed > 0 && r.servers > 0 ? r.allBusyUs / (r.servers * tUs) : 0,
        throughput: elapsed > 0 ? r.allCompleted / elapsed : 0,
        lambda_now: window > 0 ? dArr / window : (prev?.lambda_now ?? 0),
        rho_now:
          window > 0 && r.servers > 0
            ? dBusy / (r.servers * windowUs)
            : r.servers > 0
              ? r.busy / r.servers
              : 0,
        throughput_now: window > 0 ? dDone / window : (prev?.throughput_now ?? 0),
        Lq: r.queue.length,
        p99: r.waitHist.percentileMs(0.99),
        waitUnknown: serviceMs <= 0,
      }
      lastArrived[i] = r.allArrived
      lastCompleted[i] = r.allCompleted
      lastBusyUs[i] = r.allBusyUs
    }
    const edgeOut: SimTick['edges'] = {}
    for (const edge of edges) {
      const flow: Record<string, number> = {}
      const flowNow: Record<string, number> = {}
      for (const classId of Object.keys(edge.perClass)) {
        const hits = edgeHits[edge.id]?.[classId] ?? 0
        const prevHits = lastHits[edge.id]?.[classId] ?? 0
        const prevNowRate = prevNow?.edges[edge.id]?.flow_rps_now[classId] ?? 0
        flow[classId] = elapsed > 0 ? hits / elapsed : 0
        flowNow[classId] = window > 0 ? (hits - prevHits) / window : prevNowRate
        lastHits[edge.id]![classId] = hits
      }
      edgeOut[edge.id] = { flow_rps: flow, flow_rps_now: flowNow }
    }
    lastSnapUs = tUs
    const tick = { t_s: elapsed, nodes: nodeOut, edges: edgeOut }
    prevNow = tick
    return tick
  }

  const emitTickAt = (tUs: number) => {
    const tick = snapshot(tUs)
    series.push(tick)
    hooks?.onProgress?.({
      events,
      t_s: tick.t_s,
      fraction: Math.min(1, tick.t_s / Math.max(scenario.run.duration_s, 1e-9)),
      tick,
    })
  }

  const startService = (ni: number, reqIndex: number, t: number) => {
    const node = nodes[ni]!
    const rtN = rt[ni]!
    const req = reqs[reqIndex]!
    rtN.busy++
    req.serviceAt = t
    const serviceMs = sampleServiceMs(stream(node.id, 'service'), node.service)
    const finish = t + Math.max(1, Math.round(serviceMs * 1000))
    schedule(finish, EventKind.depart, ni, reqIndex)
    void req
  }

  const arriveAt = (ni: number, reqIndex: number, t: number) => {
    const node = nodes[ni]!
    const rtN = rt[ni]!
    const req = reqs[reqIndex]!
    stampBusy(ni, t)
    rtN.allArrived++
    if (record(t)) rtN.arrived++
    req.arrived = t
    if (node.kind === 'client') {
      route(ni, reqIndex, t)
      return
    }
    if (rtN.zipf) {
      rtN.lookups++
      const key = sampleZipfKey(stream(node.id, 'cache'), rtN.zipf)
      const hit = key <= rtN.cacheSize
      if (hit) {
        rtN.hits++
        finishAt(ni, reqIndex, t)
        systemDone++
        inFlight--
        return
      }
    } else if ((node.kind === 'cache' || node.kind === 'cdn') && rtN.hitRatio > 0) {
      rtN.lookups++
      if (stream(node.id, 'cache').next() < rtN.hitRatio) {
        rtN.hits++
        finishAt(ni, reqIndex, t)
        systemDone++
        inFlight--
        return
      }
    }
    if (rtN.busy < rtN.servers) {
      startService(ni, reqIndex, t)
      return
    }
    const cap = rtN.K
    if (cap !== null && rtN.queue.length >= Math.max(0, cap - rtN.servers)) {
      if (record(t)) rtN.dropped++
      inFlight--
      return
    }
    rtN.queue.push(reqIndex)
  }

  const finishAt = (ni: number, reqIndex: number, t: number) => {
    const rtN = rt[ni]!
    const req = reqs[reqIndex]!
    rtN.allCompleted++
    if (record(t)) {
      rtN.completed++
      const start = req.arrived || req.birth
      const dwell = Math.max(0, t - start)
      const wait = req.serviceAt ? Math.max(0, req.serviceAt - start) : 0
      rtN.hist.addUs(dwell)
      rtN.waitHist.addUs(wait)
      if (req.deadline > 0 && t > req.deadline) rtN.timedOut++
    }
  }

  const completeReq = (ni: number, reqIndex: number, t: number) => {
    finishAt(ni, reqIndex, t)
    route(ni, reqIndex, t)
  }

  const route = (ni: number, reqIndex: number, t: number) => {
    const req = reqs[reqIndex]!
    const from = nodes[ni]!.id
    const targets = pickTargets(from, req.classId)
    if (!targets.length) {
      systemDone++
      inFlight--
      return
    }
    for (const target of targets) {
      const toId = nodes[target.to]?.id
      if (toId) {
        const id = edgeIdByHop.get(hopKey(from, toId, req.classId))
        if (id) edgeHits[id]![req.classId] = (edgeHits[id]![req.classId] ?? 0) + 1
      }
      const child: Req = {
        classId: req.classId,
        birth: req.birth,
        arrived: 0,
        deadline: req.deadline,
        serviceAt: 0,
      }
      reqs.push(child)
      inFlight++
      const delay = Math.max(0, Math.round(target.latencyUs))
      const jitter = sampleExponential(stream(from, 'network'), Math.max(1, delay * 0.01))
      schedule(t + delay + jitter, EventKind.arrive, target.to, reqs.length - 1)
    }
    if (targets.length > 1) created += targets.length - 1
    inFlight--
  }

  const handle = (ev: NonNullable<ReturnType<EventHeap['pop']>>): 'ok' | 'stop' => {
    events++
    if (events > budget) {
      warnings.push(`event budget ${budget} reached`)
      return 'stop'
    }
    if (ev.t > durationUs) return 'stop'
    if ((events & 511) === 0) {
      if (hooks?.cancelled?.()) {
        warnings.push('cancelled')
        return 'stop'
      }
      const t_s = ev.t / US
      hooks?.onProgress?.({
        events,
        t_s,
        fraction: Math.min(1, t_s / Math.max(scenario.run.duration_s, 1e-9)),
      })
    }
    if (ev.kind === EventKind.generate) {
      const ni = ev.a
      const ci = ev.b
      const classId = classList[ci]
      const node = nodes[ni]
      if (!classId || !node) return 'ok'
      const row = scenario.workload.find((w) => w.clientId === node.id && w.classId === classId)
      if (row && row.rate_rps > 0) {
        const ia = sampleExponential(stream(node.id, 'arrivals'), 1 / row.rate_rps) * US
        schedule(ev.t + Math.max(1, Math.round(ia)), EventKind.generate, ni, ci)
        if (row.profile === 'ramp') {
          const accept = offeredAt(row, ev.t) / row.rate_rps
          if (stream(node.id, 'thin').next() > accept) return 'ok'
        }
      }
      const req: Req = {
        classId,
        birth: ev.t,
        arrived: 0,
        deadline: node.timeout_ms ? ev.t + node.timeout_ms * 1000 : 0,
        serviceAt: 0,
      }
      reqs.push(req)
      created++
      inFlight++
      arriveAt(ni, reqs.length - 1, ev.t)
    } else if (ev.kind === EventKind.arrive) {
      arriveAt(ev.a, ev.b, ev.t)
    } else if (ev.kind === EventKind.depart) {
      const ni = ev.a
      const reqIndex = ev.b
      stampBusy(ni, ev.t)
      const rtN = rt[ni]!
      rtN.busy = Math.max(0, rtN.busy - 1)
      completeReq(ni, reqIndex, ev.t)
      const next = rtN.queue.shift()
      if (next !== undefined) startService(ni, next, ev.t)
    }
    return 'ok'
  }

  const advanceTo = (untilUs: number): 'ok' | 'stop' => {
    while (heap.size) {
      const next = heap.peek()
      if (!next || next.t > untilUs) break
      const ev = heap.pop()
      if (!ev) break
      if (handle(ev) === 'stop') return 'stop'
    }
    return 'ok'
  }

  const nextSampleUs = (tUs: number) => {
    if (tUs >= durationUs) return durationUs
    const next = tUs + tickStepUs
    return next >= durationUs ? durationUs : next
  }

  const finish = (): EngineResult => {
  const T = Math.max(1e-9, (durationUs - warmupUs) / US)
  const nodeResults: Record<string, NodeResult> = {}
  const evidence: Evidence[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const r = rt[i]!
    stampBusy(i, durationUs)
    evidence.push(node.evidence)
    if (compiled.notWired.includes(node.id)) {
      nodeResults[node.id] = emptyNode('not_wired')
      continue
    }
    if (node.kind === 'client') {
      nodeResults[node.id] = {
        ...emptyNode('healthy'),
        lambda: r.arrived / T,
        throughput: r.arrived / T,
      }
      continue
    }
    const lambda = r.arrived / T
    const throughput = r.completed / T
    const serviceMs = meanMsFromDist(node.service) ?? 0
    const rho = r.servers * T > 0 ? r.busyUs / US / (r.servers * T) : 0
    const W_ms = r.hist.meanMs()
    const Wq_ms = r.waitHist.meanMs()
    nodeResults[node.id] = {
      lambda,
      rho,
      status: rho >= 1 ? 'unstable' : rho >= 0.85 ? 'critical' : rho >= 0.7 ? 'warning' : 'healthy',
      Wq_ms,
      W_ms,
      p50: r.waitHist.percentileMs(0.5),
      p95: r.waitHist.percentileMs(0.95),
      p99: r.waitHist.percentileMs(0.99),
      L: lambda * (W_ms / 1000),
      Lq: lambda * (Wq_ms / 1000),
      throughput,
      dropRate: r.dropped / T,
      timeoutRate: r.timedOut / T,
      waitUnknown: serviceMs <= 0,
    }
  }

  let dropped = 0
  let timedOut = 0
  for (const r of rt) {
    dropped += r.dropped
    timedOut += r.timedOut
  }

  const checks = {
    little: checkLittle(nodeResults),
    conservation: checkConservation({
      created,
      completed: systemDone,
      dropped,
      timedOut,
      inFlight: Math.max(0, inFlight),
    }),
    utilization: checkUtilization(nodeResults),
  }
  const invalid = checks.conservation.ok ? undefined : `self-check failed: ${checks.conservation.detail}`

  const edgesOut: EngineResult['edges'] = {}
  const elapsed = durationUs / US
  for (const edge of edges) {
    const flow: Record<string, number> = {}
    for (const classId of Object.keys(edge.perClass)) {
      const hits = edgeHits[edge.id]?.[classId] ?? 0
      flow[classId] = elapsed > 0 ? hits / elapsed : 0
    }
    edgesOut[edge.id] = { flow_rps: flow }
  }

  let bottleneck: string | undefined
  let worst = -1
  for (const [id, row] of Object.entries(nodeResults)) {
    if (row.rho > worst) {
      worst = row.rho
      bottleneck = id
    }
  }

  return {
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    seed,
    mode: 'simulated',
    evidence: weakestEvidence(...evidence, 'estimated'),
    warnings,
    nodes: nodeResults,
    edges: edgesOut,
    classes: {},
    system: {
      stability:
        Object.values(nodeResults).some((n) => n.status === 'unstable')
          ? 'unstable'
          : Object.values(nodeResults).some((n) => n.status === 'warning' || n.status === 'critical')
            ? 'saturating'
            : 'stable',
      bottleneck,
      sensitivity: [],
      nPlusOne: [],
    },
    checks,
    invalid,
    ticks:
      series.length === 0 || series.at(-1)!.t_s < durationUs / US - 1e-9
        ? [...series, snapshot(durationUs)]
        : series,
  }
  }

  return {
    runSync() {
      let tUs = 0
      for (;;) {
        if (hooks?.cancelled?.()) {
          warnings.push('cancelled')
          break
        }
        if (advanceTo(tUs) === 'stop') break
        emitTickAt(tUs)
        if (tUs >= durationUs) break
        tUs = nextSampleUs(tUs)
      }
      return finish()
    },
    async runAsync() {
      const now = hooks?.now ?? Date.now
      const slice = hooks?.sliceMs ?? WORKER_SLICE_MS
      const sleep = hooks?.sleep ?? defaultSleep
      const pace = hooks?.pace
      const origin = now()
      let last = origin
      let tUs = 0
      for (;;) {
        if (hooks?.cancelled?.()) {
          warnings.push('cancelled')
          break
        }
        if (advanceTo(tUs) === 'stop') break
        emitTickAt(tUs)
        if (pace && pace > 0) {
          const wait = origin + (tUs / US / pace) * 1000 - now()
          if (wait > 1) await sleep(wait)
        } else if (now() - last >= slice) {
          await sleep(0)
          last = now()
        }
        if (tUs >= durationUs) break
        tUs = nextSampleUs(tUs)
      }
      return finish()
    },
  }
}

function invalidResult(
  compiled: CompiledModel,
  seed: number,
  message: string,
  warnings: string[],
): EngineResult {
  return {
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    seed,
    mode: 'simulated',
    evidence: 'estimated',
    warnings,
    nodes: {},
    edges: {},
    classes: {},
    system: { stability: 'unstable', sensitivity: [], nPlusOne: [] },
    invalid: message,
  }
}

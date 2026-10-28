import { zipfCdf } from '../analytic/zipf.ts'
import { meanMsFromDist } from '../analytic/queue.ts'
import { serverCount } from '../schema/scenario.ts'
import type { CompiledModel } from '../compile/compile.ts'
import type { EngineResult, NodeResult } from '../schema/result.ts'
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
}

function emptyNode(status: NodeResult['status']): NodeResult {
  return {
    lambda: 0,
    rho: 0,
    status,
    Wq_ms: 0,
    W_ms: 0,
    p50: 0,
    p95: 0,
    p99: 0,
    L: 0,
    Lq: 0,
    throughput: 0,
    dropRate: 0,
    timeoutRate: 0,
    waitUnknown: false,
  }
}

export function simulateOnce(compiled: CompiledModel, seed: number): EngineResult {
  const warnings = compiled.warnings.map((w) => w.message)
  if (compiled.invalid) {
    return invalidResult(compiled, seed, compiled.invalid, warnings)
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
  }))

  type Req = { classId: string; birth: number; arrived: number; deadline: number }
  const reqs: Req[] = []
  const heap = new EventHeap()
  let seq = 1
  let events = 0
  let inFlight = 0
  let created = 0

  const schedule = (t: number, kind: number, a: number, b: number) => {
    heap.push(Math.round(t), seq++, kind, a, b)
  }

  for (const row of scenario.workload) {
    if (row.profile !== 'constant' || row.rate_rps <= 0) continue
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

  const stampBusy = (ni: number, t: number) => {
    const node = rt[ni]!
    const dt = t - node.lastT
    if (dt > 0) {
      if (record(node.lastT)) {
        node.busyUs += node.busy * dt
        node.queueUs += node.queue.length * dt
      }
      node.lastT = t
    }
  }

  const startService = (ni: number, reqIndex: number, t: number) => {
    const node = nodes[ni]!
    const rtN = rt[ni]!
    const req = reqs[reqIndex]!
    rtN.busy++
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
        completeReq(ni, reqIndex, t)
        return
      }
    } else if ((node.kind === 'cache' || node.kind === 'cdn') && rtN.hitRatio > 0) {
      rtN.lookups++
      if (stream(node.id, 'cache').next() < rtN.hitRatio) {
        rtN.hits++
        completeReq(ni, reqIndex, t)
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

  const completeReq = (ni: number, reqIndex: number, t: number) => {
    const rtN = rt[ni]!
    const req = reqs[reqIndex]!
    if (record(t)) {
      rtN.completed++
      rtN.hist.addUs(t - req.birth)
      rtN.waitHist.addUs(Math.max(0, req.arrived ? t - req.arrived : 0))
      if (req.deadline > 0 && t > req.deadline) rtN.timedOut++
    }
    route(ni, reqIndex, t)
  }

  const route = (ni: number, reqIndex: number, t: number) => {
    const req = reqs[reqIndex]!
    const from = nodes[ni]!.id
    const targets = pickTargets(from, req.classId)
    if (!targets.length) {
      inFlight--
      return
    }
    for (const target of targets) {
      const child: Req = {
        classId: req.classId,
        birth: req.birth,
        arrived: 0,
        deadline: req.deadline,
      }
      reqs.push(child)
      inFlight++
      created++
      const delay = Math.max(0, Math.round(target.latencyUs))
      const jitter = sampleExponential(stream(from, 'network'), Math.max(1, delay * 0.01))
      schedule(t + delay + jitter, EventKind.arrive, target.to, reqs.length - 1)
    }
    inFlight--
  }

  while (heap.size) {
    const ev = heap.pop()
    if (!ev) break
    events++
    if (events > budget) {
      warnings.push(`event budget ${budget} reached`)
      break
    }
    if (ev.t > durationUs) break
    if (ev.kind === EventKind.generate) {
      const ni = ev.a
      const ci = ev.b
      const classId = classList[ci]
      const node = nodes[ni]
      if (!classId || !node) continue
      const row = scenario.workload.find((w) => w.clientId === node.id && w.classId === classId)
      if (row) {
        const ia = sampleExponential(stream(node.id, 'arrivals'), 1 / row.rate_rps) * US
        schedule(ev.t + Math.max(1, Math.round(ia)), EventKind.generate, ni, ci)
      }
      const req: Req = {
        classId,
        birth: ev.t,
        arrived: 0,
        deadline: node.timeout_ms ? ev.t + node.timeout_ms * 1000 : 0,
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
  }

  const T = Math.max(1e-9, (Math.min(durationUs, durationUs) - warmupUs) / US)
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
      p50: r.hist.percentileMs(0.5),
      p95: r.hist.percentileMs(0.95),
      p99: r.hist.percentileMs(0.99),
      L: lambda * (W_ms / 1000),
      Lq: lambda * (Wq_ms / 1000),
      throughput,
      dropRate: r.dropped / T,
      timeoutRate: r.timedOut / T,
      waitUnknown: serviceMs <= 0,
    }
  }

  let dropped = 0
  let completed = 0
  let timedOut = 0
  for (const r of rt) {
    dropped += r.dropped
    completed += r.completed
    timedOut += r.timedOut
  }

  const checks = {
    little: checkLittle(nodeResults),
    conservation: checkConservation({
      created,
      completed,
      dropped,
      timedOut,
      inFlight: Math.max(0, inFlight),
    }),
    utilization: checkUtilization(nodeResults),
  }
  const invalid = checks.conservation.ok ? undefined : `self-check failed: ${checks.conservation.detail}`

  const edgesOut: EngineResult['edges'] = {}
  for (const edge of edges) {
    const flow: Record<string, number> = {}
    for (const classId of Object.keys(edge.perClass)) {
      const src = nodeResults[edge.from]
      flow[classId] = src?.throughput ?? 0
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

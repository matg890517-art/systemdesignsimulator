import { hockeyStickTopology, workloadAt } from './fixtures.ts'
import { offeredRate } from './routing.ts'
import {
  allenCunneenWaitMs,
  mmcWaitQuantileMs,
  statusFromRho,
  utilizationRho,
  type StabilityStatus,
} from './queueing.ts'
import { meanMs } from './values.ts'
import type { Component, Edge, RequestClassId, Topology, Workload } from './types.ts'

const UTIL_CEILING = 0.7
const JACKSON_EPS = 1e-9
const JACKSON_ITERS = 64

export type ResultLabel = 'analytic' | 'simulated'

export type AnalyticComponentReport = {
  id: string
  lambda: number
  rho: number
  waitMs: number
  sojournMs: number
  p50WaitMs: number
  p95WaitMs: number
  p99WaitMs: number
  queueLength: number
  throughput: number
  status: StabilityStatus
  /** Unknown service time or servers: wait stays unknown. */
  waitUnknown: boolean
}

export type AnalyticRunResult = {
  label: ResultLabel
  totals: Record<RequestClassId, number>
  components: Record<string, AnalyticComponentReport>
  bottleneckId?: string
  status: StabilityStatus
}

function classIds(workload: Workload, topology: Topology): RequestClassId[] {
  const ids = new Set<RequestClassId>()
  for (const rates of Object.values(workload.offered)) {
    for (const id of Object.keys(rates)) ids.add(id)
  }
  for (const edge of topology.edges) {
    for (const id of Object.keys(edge.classes)) ids.add(id)
  }
  return [...ids]
}

function gamma(workload: Workload, componentId: string, classId: RequestClassId): number {
  return workload.offered[componentId]?.[classId] ?? 0
}

function hitRate(component: Component): number {
  const value = component.behavior.cacheHitRate
  return value?.state === 'set' ? value.value : 0
}

function serversOf(component: Component): number | undefined {
  return component.behavior.servers.state === 'set' ? component.behavior.servers.value : undefined
}

function meanServiceMs(component: Component): number | undefined {
  const value = Object.values(component.behavior.serviceTime)[0]
  if (!value || value.state !== 'set') return undefined
  return meanMs(value.value)
}

function carriesClass(edge: Edge, classId: RequestClassId): boolean {
  if (edge.routing.mode === 'conditional') return edge.routing.classes.includes(classId)
  return classId in edge.classes
}

function siblingWeights(edges: Edge[], fromId: string): number[] {
  return edges
    .filter((edge) => edge.from === fromId && edge.routing.mode === 'weighted')
    .map((edge) => (edge.routing.mode === 'weighted' ? edge.routing.weight : 0))
}

function sourceOut(component: Component, lambda: number, workload: Workload, classId: RequestClassId): number {
  if (component.kind === 'traffic_generator') return gamma(workload, component.id, classId)
  if (component.kind === 'cache' || component.kind === 'cdn') return lambda * (1 - hitRate(component))
  return lambda
}

function jacksonRates(
  topology: Topology,
  workload: Workload,
  classId: RequestClassId,
): Record<string, number> {
  const byId = new Map(topology.components.map((component) => [component.id, component]))
  const lambda: Record<string, number> = {}
  for (const component of topology.components) lambda[component.id] = 0

  for (let iter = 0; iter < JACKSON_ITERS; iter++) {
    let maxDelta = 0
    const next: Record<string, number> = {}
    for (const component of topology.components) {
      if (component.kind === 'traffic_generator') {
        next[component.id] = gamma(workload, component.id, classId)
      } else {
        let incoming = 0
        for (const edge of topology.edges) {
          if (edge.to !== component.id || !carriesClass(edge, classId)) continue
          const source = byId.get(edge.from)
          if (!source) continue
          const outgoing = topology.edges.filter(
            (item) => item.from === source.id && carriesClass(item, classId),
          )
          const output = sourceOut(source, lambda[source.id] ?? 0, workload, classId)
          incoming += offeredRate(edge.routing, edge.fanOut, output, siblingWeights(outgoing, source.id))
        }
        next[component.id] = incoming
      }
      maxDelta = Math.max(maxDelta, Math.abs((next[component.id] ?? 0) - (lambda[component.id] ?? 0)))
    }
    for (const component of topology.components) lambda[component.id] = next[component.id] ?? 0
    if (maxDelta < JACKSON_EPS) break
  }
  return lambda
}

function reportFor(
  component: Component,
  lambda: number,
  arrivalScv: number,
  serviceScv: number,
): AnalyticComponentReport {
  if (component.kind === 'traffic_generator') {
    return {
      id: component.id,
      lambda,
      rho: 0,
      waitMs: 0,
      sojournMs: 0,
      p50WaitMs: 0,
      p95WaitMs: 0,
      p99WaitMs: 0,
      queueLength: 0,
      throughput: lambda,
      status: 'stable',
      waitUnknown: false,
    }
  }
  const servers = serversOf(component)
  const serviceMs = meanServiceMs(component)
  if (servers === undefined || serviceMs === undefined || serviceMs <= 0) {
    return {
      id: component.id,
      lambda,
      rho: 0,
      waitMs: Number.NaN,
      sojournMs: Number.NaN,
      p50WaitMs: Number.NaN,
      p95WaitMs: Number.NaN,
      p99WaitMs: Number.NaN,
      queueLength: Number.NaN,
      throughput: lambda,
      status: 'stable',
      waitUnknown: true,
    }
  }
  const mu = 1000 / serviceMs
  const rho = utilizationRho(lambda, mu, servers)
  const waitMs = allenCunneenWaitMs(lambda, mu, servers, arrivalScv, serviceScv)
  const sojournMs = Number.isFinite(waitMs) ? waitMs + serviceMs : waitMs
  const p50WaitMs = mmcWaitQuantileMs(0.5, lambda, mu, servers)
  const p95WaitMs = mmcWaitQuantileMs(0.95, lambda, mu, servers)
  const p99WaitMs = mmcWaitQuantileMs(0.99, lambda, mu, servers)
  const waitSec = Number.isFinite(waitMs) ? waitMs / 1000 : Number.POSITIVE_INFINITY
  const queueLength = Number.isFinite(waitSec) ? lambda * waitSec : Number.POSITIVE_INFINITY
  const status = statusFromRho(rho, UTIL_CEILING)
  const throughput = status === 'unstable' ? servers * mu : lambda
  return {
    id: component.id,
    lambda,
    rho,
    waitMs,
    sojournMs,
    p50WaitMs,
    p95WaitMs,
    p99WaitMs,
    queueLength,
    throughput,
    status,
    waitUnknown: false,
  }
}

/** Closed-form steady state. Same topology and workload as discrete-event. Label Analytic. */
export function runAnalytic(
  topology: Topology,
  workload: Workload,
  opts?: { arrivalScv?: number; serviceScv?: number },
): AnalyticRunResult {
  const arrivalScv = opts?.arrivalScv ?? 1
  const serviceScv = opts?.serviceScv ?? 1
  const ids = classIds(workload, topology)
  const lambdaTotal: Record<string, number> = {}
  const totals: Record<RequestClassId, number> = {}
  for (const component of topology.components) lambdaTotal[component.id] = 0

  for (const classId of ids) {
    const rates = jacksonRates(topology, workload, classId)
    totals[classId] = 0
    for (const component of topology.components) {
      lambdaTotal[component.id] = (lambdaTotal[component.id] ?? 0) + (rates[component.id] ?? 0)
      if (component.kind === 'traffic_generator') {
        totals[classId] += gamma(workload, component.id, classId)
      }
    }
  }

  const components: Record<string, AnalyticComponentReport> = {}
  let bottleneckId: string | undefined
  let worst = -1
  let status: StabilityStatus = 'stable'
  for (const component of topology.components) {
    const row = reportFor(component, lambdaTotal[component.id] ?? 0, arrivalScv, serviceScv)
    components[component.id] = row
    if (row.waitUnknown || component.kind === 'traffic_generator') continue
    if (row.rho > worst) {
      worst = row.rho
      bottleneckId = component.id
    }
    if (row.status === 'unstable') status = 'unstable'
    else if (row.status === 'saturating' && status === 'stable') status = 'saturating'
  }

  return { label: 'analytic', totals, components, bottleneckId, status }
}

/** Hockey-stick acceptance: 290 rps, S = 20 ms, μ = 50 /s. */
export function hockeyStickRow(servers: number): AnalyticComponentReport {
  const result = runAnalytic(hockeyStickTopology(servers), workloadAt(290, { durationSec: 60 }))
  return result.components.pool!
}

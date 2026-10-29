import type { Evidence } from './evidence.ts'
import { DEFAULT_EVENT_BUDGET, UTIL_CEILING, WARMUP_FRACTION } from './version.ts'

export type NodeKind =
  | 'client'
  | 'service'
  | 'worker'
  | 'load_balancer'
  | 'cache'
  | 'cdn'
  | 'database'
  | 'queue'
  | 'external'

export type DistKind = 'lognormal' | 'exp' | 'det' | 'gamma' | 'empirical'

export type EngineLimitType = 'hard' | 'quota' | 'best-effort' | 'guidance'

export type RoutingMode = 'single' | 'weighted' | 'broadcast'

export type CallKind = 'sync' | 'async'

export type WorkloadProfile = 'constant' | 'ramp'

export type NumberWithEvidence = {
  value: number
  evidence: Evidence
  source?: string
  readOn?: string
}

export type ServiceDist = {
  dist: DistKind
  mean_ms?: number
  p50_ms?: number
  p95_ms?: number
  scv?: number
  shape?: number
  empiricalMs?: number[]
  evidence: Evidence
}

export type NodeLimit = {
  type: EngineLimitType
  value: number
  unit: string
  source?: string
  readOn?: string
}

export type ScenarioNode = {
  id: string
  kind: NodeKind
  catalogId?: string
  provider?: string
  name?: string
  servers: { instances: number; concurrencyPerInstance: number }
  service: ServiceDist
  serviceByClass?: Record<string, ServiceDist>
  limits: NodeLimit[]
  buffer: { K: number | null }
  timeout_ms?: number
  cache?: { workingSet: number; cacheSize: number; zipfS: number }
  /** Legacy aggregate hit ratio when Zipf parameters are absent. */
  hitRatio?: number
  lb?: { imbalance: number }
  queue?: { consumers: number }
  evidence: Evidence
}

export type ClassHop = {
  routing: RoutingMode
  weight: number
  calls: number
  kind: CallKind
  parallel: boolean
  latency: { dist: DistKind; mean_ms: number; evidence: Evidence }
}

export type ScenarioEdge = {
  id: string
  from: string
  to: string
  perClass: Record<string, ClassHop>
}

export type WorkloadRow = {
  clientId: string
  classId: string
  profile: WorkloadProfile
  rate_rps: number
  /** Simulated Ramp only. λ(t) = rate_rps * min(1, t / ramp_s). Analytic ignores this. */
  ramp_s?: number
}

export type ScenarioClass = { id: string; name: string }

export type Scenario = {
  schemaVersion: number
  seed: number
  run: {
    duration_s: number
    warmup_s: number
    replications: number
    eventBudget: number
    /** Workload dt. Simulated ticks use this as the Instantaneous window, capped by the 48-frame budget. */
    dt_s?: number
  }
  classes: ScenarioClass[]
  nodes: ScenarioNode[]
  edges: ScenarioEdge[]
  workload: WorkloadRow[]
  targets: { sloP99_ms?: number; utilizationCeiling: number }
}

export function defaultRun(seed = 4821, duration_s = 60): Scenario['run'] {
  return {
    duration_s,
    warmup_s: duration_s * WARMUP_FRACTION,
    replications: 1,
    eventBudget: DEFAULT_EVENT_BUDGET,
  }
}

export function defaultTargets(): Scenario['targets'] {
  return { utilizationCeiling: UTIL_CEILING }
}

export function serverCount(node: ScenarioNode): number {
  if (node.kind === 'queue' && node.queue) return Math.max(1, node.queue.consumers)
  return Math.max(0, node.servers.instances * node.servers.concurrencyPerInstance)
}

export function limitMayCap(type: EngineLimitType): boolean {
  return type === 'hard' || type === 'quota'
}

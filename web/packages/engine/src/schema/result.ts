import type { Evidence } from './evidence.ts'

export type EngineMode = 'analytic' | 'simulated'

export type NodeStatus =
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'unstable'
  | 'not_wired'
  | 'unknown'

export type SystemStability = 'stable' | 'saturating' | 'unstable'

export type NodeResult = {
  lambda: number
  rho: number
  status: NodeStatus
  Wq_ms: number
  W_ms: number
  p50: number
  p95: number
  p99: number
  L: number
  Lq: number
  throughput: number
  dropRate: number
  timeoutRate: number
  waitUnknown: boolean
}

export type EdgeResult = {
  flow_rps: Record<string, number>
}

export type SimTickNode = {
  lambda: number
  rho: number
  throughput: number
  lambda_now: number
  rho_now: number
  throughput_now: number
  Lq: number
  p99: number
  waitUnknown: boolean
}

export type SimTickEdge = {
  flow_rps: Record<string, number>
  flow_rps_now: Record<string, number>
}

/** One DES canvas sample. `_now` is the last 1 s of simulated time; plain fields are 0→t. Lq is the live queue. N7 stays post-warm-up. */
export type SimTick = {
  t_s: number
  nodes: Record<string, SimTickNode>
  edges: Record<string, SimTickEdge>
}

export type ClassResult = {
  pathLatency: { mean: number; p50: number; p95: number; p99: number }
  errorRate: number
  asyncLatency?: { mean: number; p50: number; p95: number; p99: number }
}

export type CheckResult = { ok: boolean; detail: string }

export type EngineResult = {
  engineVersion: string
  schemaVersion: number
  seed: number
  mode: EngineMode
  evidence: Evidence
  warnings: string[]
  nodes: Record<string, NodeResult>
  edges: Record<string, EdgeResult>
  classes: Record<string, ClassResult>
  system: {
    stability: SystemStability
    bottleneck?: string
    headroom_rps?: number
    firstFailing?: string
    sensitivity: { id: string; deltaP99_ms: number }[]
    nPlusOne: { id: string; fails: boolean }[]
  }
  interval?: { replications: number; ci95: Record<string, { mean: number; half: number }> }
  checks?: { little: CheckResult; conservation: CheckResult; utilization: CheckResult }
  invalid?: string
  /** Simulated time series for the canvas. Analytic omits this. */
  ticks?: SimTick[]
}

export function planStatus(status: NodeStatus): SystemStability {
  if (status === 'unstable') return 'unstable'
  if (status === 'warning' || status === 'critical') return 'saturating'
  return 'stable'
}

export function systemFromNodes(nodes: Record<string, NodeResult>): SystemStability {
  let saturating = false
  for (const row of Object.values(nodes)) {
    if (row.status === 'unstable') return 'unstable'
    if (row.status === 'warning' || row.status === 'critical') saturating = true
  }
  return saturating ? 'saturating' : 'stable'
}

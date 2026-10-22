export type RequestClassId = string

export type Confidence = 'measured' | 'vendor' | 'estimated'

/** Set (with evidence), unknown, or not applicable. Never silently defaulted. */
export type Value<T> =
  | { state: 'set'; value: T; confidence: Confidence; sourceId?: string }
  | { state: 'unknown' }
  | { state: 'not_applicable' }

export type FieldRole =
  | 'servers'
  | 'serviceMs'
  | 'queue'
  | 'lossProb'
  | 'bandwidthBps'
  | 'latencyP95Ms'
  | 'cacheHitRate'
  | 'costUsdPerHour'

export type CalibrationField = {
  id: string
  label: string
  unit: string
  role: FieldRole
  value: Value<number>
}

export type CalibrationProfile = {
  id: string
  name: string
  bindsTo?: string
  notes: string
  /** Official or lab URL. A link labels Vendor figure (F28). */
  source?: string
  retrievedOn?: string
  version?: string
  tier?: string
  region?: string
  fields: CalibrationField[]
}

export type Distribution =
  | { kind: 'constant'; ms: number }
  | { kind: 'exponential'; meanMs: number }
  | { kind: 'lognormal'; medianMs: number; sigma: number }

export type CanonicalKind =
  | 'traffic_generator'
  | 'gateway'
  | 'load_balancer'
  | 'service'
  | 'worker'
  | 'queue'
  | 'event_bus'
  | 'cache'
  | 'relational_db'
  | 'nosql_db'
  | 'object_storage'
  | 'cdn'

export type Routing =
  | { mode: 'single' }
  | { mode: 'weighted'; weight: number }
  | { mode: 'broadcast' }
  | { mode: 'conditional'; classes: RequestClassId[] }

export interface ComponentBehavior {
  servers: Value<number>
  serviceTime: Record<RequestClassId, Value<Distribution>>
  queueCapacity: Value<number | 'unbounded'>
  throughputLimitRps: Value<number>
  scaling: Value<{ min: number; max: number; delaySec: number } | 'fixed'>
  cacheHitRate?: Value<number>
  /** Application fail probability. Absent means the component does not fail itself. */
  failProb?: Value<number>
}

export interface ProviderBinding {
  provider: 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'self_hosted'
  service: string
  sku?: string
  region?: string
  quotas: { name: string; value: number; sourceUrl: string; readOn: string }[]
}

export interface Component {
  id: string
  name: string
  kind: CanonicalKind
  behavior: ComponentBehavior
  providerBinding?: ProviderBinding
  calibrationProfileIds: string[]
}

export interface EdgeClass {
  requestBytes: number
  responseBytes: number
}

export interface Edge {
  id: string
  from: string
  to: string
  routing: Routing
  /** Calls per routed request, default 1. Not a probability. */
  fanOut: number
  classes: Record<RequestClassId, EdgeClass>
  network: {
    latencyMs: number
    bandwidthBps?: number
    bandwidthApplies: 'request' | 'response' | 'both'
    lossProb: number
    serialization: boolean
  }
  call: { kind: 'sync' | 'async'; timeoutMs?: number; deadlineMs?: number }
  retry?: {
    max: number
    backoff: 'fixed' | 'exponential'
    baseMs: number
    budget: number
    onlyIdempotent: boolean
  }
  breaker?: {
    errorThreshold: number
    windowMs: number
    openMs: number
    probes: number
    minRequests: number
  }
}

export interface Topology {
  components: Component[]
  edges: Edge[]
}

export type DiscreteFault =
  | { tSec: number; kind: 'crash'; componentId: string }
  | { tSec: number; kind: 'link-cut'; edgeId: string }
  | { tSec: number; kind: 'packet-loss'; edgeId: string; lossProb: number }
  | { tSec: number; kind: 'latency-spike'; edgeId: string; addMs: number }

export type LoadShape =
  | { kind: 'constant' }
  | { kind: 'poisson' }
  | { kind: 'step'; atSec: number; factor: number }
  | { kind: 'spike'; atSec: number; durationSec: number; factor: number }

export interface Workload {
  durationSec: number
  dtSec: number
  seed: number
  /** Baseline offered rps at each traffic generator, per request class. */
  offered: Record<string, Record<RequestClassId, number>>
  shape?: LoadShape
  faults?: DiscreteFault[]
}

/** Fluid mode: rates per second, one record per edge and class. */
export interface FluidEdgeState {
  offered: number
  delivered: number
  admitted: number
  completed: number
  retried: number
}

export interface FluidComponentClassState {
  incomingOffered: number
  networkDrop: number
  admitted: number
  rejected: number
  completed: number
  backlog: number
}

export interface FluidState {
  t: number
  seed: number
  edges: Record<string, Record<RequestClassId, FluidEdgeState>>
  components: Record<string, Record<RequestClassId, FluidComponentClassState>>
}

export interface FluidRunResult {
  seed: number
  dtSec: number
  steps: FluidState[]
}

/** Discrete-event mode. */
export interface SimRequest {
  id: string
  traceId: string
  classId: RequestClassId
  requestBytes: number
  responseBytes: number
  createdAtMs: number
  deadlineMs?: number
  attempt: number
  path: string[]
  edgeId?: string
  arrivedAtMs?: number
}

export type BreakerState = 'closed' | 'open' | 'half_open'

export type SimEvent =
  | { t: number; seq: number; type: 'arrive'; req: SimRequest; at: string }
  | { t: number; seq: number; type: 'finish-service'; req: SimRequest; at: string }
  | { t: number; seq: number; type: 'timeout'; req: SimRequest; edge: string }
  | { t: number; seq: number; type: 'retry'; req: SimRequest; edge: string }
  | { t: number; seq: number; type: 'breaker-change'; edge: string; to: BreakerState }
  | { t: number; seq: number; type: 'fault'; fault: DiscreteFault }

export interface DiscreteCounts {
  created: number
  completed: number
  rejected: number
  dropped: number
  expired: number
  inFlight: number
  breakerRejected: number
  attempts: number
}

export interface DiscreteRunResult {
  seed: number
  events: SimEvent[]
  counts: DiscreteCounts
  meanWaitMs: number
  meanAttempts: number
  measuredLoss: number
  meanNetworkMs: number
  affectedComponentIds: string[]
  /** Lookups and hits per cache/CDN. Absent when the component has no hit rate. */
  cacheStats: Record<string, { lookups: number; hits: number; measuredHitRate: number }>
}

export type LimitType =
  | 'hard_limit'
  | 'adjustable_quota'
  | 'best_effort_target'
  | 'performance_guidance'
  | 'configurable_setting'
  | 'documented_behavior'
  | 'quota_adjustability_unknown'

export type CatalogValueStatus = 'documented' | 'measured' | 'estimated' | 'unknown'

export type CatalogValueScope =
  | 'function'
  | 'account'
  | 'region'
  | 'distribution'
  | 'queue'
  | 'message'
  | 'prefix'
  | 'invocation'
  | 'service'
  | 'cluster'
  | 'target'

export type CatalogValueCap = 'throughputRps' | 'servers' | 'bandwidthBps'

/** Sourced catalog figure. Only hard_limit and adjustable_quota may cap the engine. */
export interface CatalogValue {
  /** Omitted when the plan did not state a number (status unknown or prose-only). */
  value?: number
  unit: string
  scope: CatalogValueScope
  limitType: LimitType
  conditions: Record<string, string>
  sourceUrl: string
  retrievedOn: string
  status: CatalogValueStatus
  caps?: CatalogValueCap
  /** Plan prose when there is no number, or a qualifier such as "about" / "usually under". */
  note?: string
}

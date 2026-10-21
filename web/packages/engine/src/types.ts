export type RequestClassId = string

export type Confidence = 'measured' | 'vendor' | 'estimated'

/** Set (with evidence), unknown, or not applicable. Never silently defaulted. */
export type Value<T> =
  | { state: 'set'; value: T; confidence: Confidence; sourceId?: string }
  | { state: 'unknown' }
  | { state: 'not_applicable' }

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
}

export interface Topology {
  components: Component[]
  edges: Edge[]
}

export interface Workload {
  durationSec: number
  dtSec: number
  seed: number
  /** Offered rps at each traffic generator, per request class. */
  offered: Record<string, Record<RequestClassId, number>>
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

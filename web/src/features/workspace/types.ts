import type { Node } from '@xyflow/react'

export type ProviderId = 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'generic'
export type NodeHealth = 'default' | 'watch' | 'bottleneck'

export type ServiceNodeData = {
  title: string
  util: number
  p99: string
  meta: string
  provider: ProviderId
  engineId?: string
  catalogId?: string
  inBlast?: boolean
  blastOrigin?: boolean
  queueDepth?: string
  loss?: string
  /** Numbers come from a run still in progress on the worker, or from playback. */
  live?: boolean
}

export type ZoneNodeData = {
  label: string
  provider: ProviderId
  nested?: boolean
}

export type WorkspaceNode = Node<ServiceNodeData | ZoneNodeData>

export type CanvasSelection = {
  id: string
  title: string
  catalogId?: string
  kind?: 'service' | 'zone'
  provider?: ProviderId
  parentId?: string
}

export type Bottleneck = {
  id: string
  title: string
  util: number
  summary: string
  suggestion: string
  fromEngine: boolean
  citation?: string
  cause?: string
  wait?: string
}

export type KpiState = {
  load: string
  loadHint: string
  latency: string
  latencyHint: string
  errors: string
  bottlenecks: string
  bottleneckHint: string
  cost: string
  costHint: string
}

export type RankSource = 'engine' | 'estimated'

export type RankRow = {
  id: string
  title: string
  provider: string
  util: number
  p99: string
  source: RankSource
  citation?: string
  /** Typed $/hr on this node. Absent means unknown, not $0. */
  usdPerHour?: number
}

export type FluidPoint = {
  t: number
  completed: number
  admitted: number
  rejected: number
  backlog: number
  util: number
}

export type AksRun = {
  servers: number
  serviceMs: number
  offered: number
  mu: number
  util: number
  backlog: number
  rejected: number
  completed: number
  series: FluidPoint[]
}

export type ResultsReport = {
  baseline: AksRun
  raised: AksRun
  suggestedSlots: number
  ranking: RankRow[]
  bottlenecks: Bottleneck[]
  kpis: KpiState
}

export type NodeRunStat = {
  util: number
  completed: number
  rejected: number
  offered: number
  mu: number
  capped: boolean
  p99: string
  meta: string
  citation?: string
  backlog: number
  loss: number
  servers?: number
  serviceMs?: number
}

export type TickRates = {
  nodeStats: Record<string, NodeRunStat>
  classStats: Record<string, Record<string, NodeRunStat>>
  edgeOffered: Record<string, number>
  edgeClassOffered: Record<string, Record<string, number>>
}

/** One sampled engine tick. Playback and edge motion read this; they do not re-run the math. */
export type RunTick = TickRates & {
  t: number
  /** Instantaneous window (last dt). Average fields on the tick are 0→t. */
  instant?: TickRates
}

export type HockeyStickSeries = {
  rps: number[]
  lines: { id: string; title: string; waitMs: number[] }[]
}

export type WorkspaceRun = {
  mode: 'fluid' | 'discrete' | 'analytic' | 'simulated'
  kpis: KpiState
  bottlenecks: Bottleneck[]
  nodeStats: Record<string, NodeRunStat>
  classStats: Record<string, Record<string, NodeRunStat>>
  edgeOffered: Record<string, number>
  edgeClassOffered: Record<string, Record<string, number>>
  ticks: RunTick[]
  durationSec: number
  hint: string
  affectedComponentIds: string[]
  blastOriginId?: string
  breakerOpenEdges: string[]
  evidence?: string
  stability?: 'stable' | 'saturating' | 'unstable'
  headroomRps?: number
  firstFailing?: string
  hockeyStick?: HockeyStickSeries
}

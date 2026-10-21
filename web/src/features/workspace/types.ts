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
}

export type ZoneNodeData = {
  label: string
  provider: Exclude<ProviderId, 'generic'>
}

export type Bottleneck = {
  id: string
  title: string
  util: number
  summary: string
  suggestion: string
  fromEngine: boolean
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

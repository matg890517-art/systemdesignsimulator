import { edge, generator, runFluid, worker } from '@sds/engine'
import { aksRunPlan, getFault, lossProbForFault } from '../calibration/library.ts'
import { initialNodes } from './graph.ts'
import type {
  AksRun,
  Bottleneck,
  FluidPoint,
  KpiState,
  NodeHealth,
  RankRow,
  ResultsReport,
  ServiceNodeData,
} from './types.ts'

export const aksScenario = {
  servers: 84,
  serviceMs: 40_000,
  offered: 2,
  queue: 200,
  durationSec: 8,
  dtSec: 0.1,
  seed: 4821,
  targetUtil: 0.83,
} as const

const providerLabel = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  kubernetes: 'Kubernetes',
  generic: 'Traffic',
} as const

function healthFor(util: number): NodeHealth {
  if (util >= 0.85) return 'bottleneck'
  if (util >= 0.7) return 'watch'
  return 'default'
}

export function nodeHealth(data: ServiceNodeData): NodeHealth {
  return healthFor(data.util)
}

export function formatPct(util: number): string {
  if (util <= 0) return '—'
  return `${Math.round(util * 100)}%`
}

export function suggestedAksSlots(
  offered: number = aksScenario.offered,
  serviceMs: number = aksScenario.serviceMs,
  targetUtil: number = aksScenario.targetUtil,
): number {
  const serviceSec = serviceMs / 1000
  return Math.ceil(offered / targetUtil / (1 / serviceSec))
}

export const idleKpis: KpiState = {
  load: '51,200 rps',
  loadHint: 'R 50,000 · W 1,200 · A 2,600 · B 2/s',
  latency: '62 / 840 ms',
  latencyHint: 'P50 / P99 · Estimated',
  errors: '0.9%',
  bottlenecks: '2',
  bottleneckHint: 'Transcode workers, Azure to AWS link',
  cost: '$6,480/hr',
  costHint: 'estimate, three providers',
}

function aksTopology(
  servers: number,
  serviceMs: number,
  queue: number,
  lossProb: number,
) {
  return {
    components: [
      generator('uploaders'),
      worker('aks', { servers, serviceMs, queue }),
    ],
    edges: [
      edge('up-aks', 'uploaders', 'aks', {
        network: {
          latencyMs: 0,
          bandwidthApplies: 'both',
          lossProb,
          serialization: false,
        },
      }),
    ],
  }
}

export function runAksFluid(
  servers: number,
  extra?: { serviceMs?: number; queue?: number; lossProb?: number },
): AksRun {
  const { offered, durationSec, dtSec, seed } = aksScenario
  const serviceMs = extra?.serviceMs ?? aksScenario.serviceMs
  const queue = extra?.queue ?? aksScenario.queue
  const lossProb = extra?.lossProb ?? 0
  const result = runFluid(aksTopology(servers, serviceMs, queue, lossProb), {
    durationSec,
    dtSec,
    seed,
    offered: { uploaders: { read: offered } },
  })
  const mu = servers > 0 ? servers / (serviceMs / 1000) : 0
  const series: FluidPoint[] = result.steps
    .filter((step) => step.t > 0)
    .map((step) => {
      const row = step.components.aks.read
      return {
        t: step.t,
        completed: row.completed,
        admitted: row.admitted,
        rejected: row.rejected,
        backlog: row.backlog,
        util: mu > 0 ? row.completed / mu : row.completed > 0 || offered > 0 ? 1 : 0,
      }
    })
  const last = series.at(-1)
  if (!last) throw new Error('simulation produced no steps')
  return {
    servers,
    serviceMs,
    offered,
    mu,
    util: last.util,
    backlog: last.backlog,
    rejected: last.rejected,
    completed: last.completed,
    series,
  }
}

export function resolveAksRun(serversOverride?: number) {
  const plan = aksRunPlan()
  if (!plan.ok) return plan
  const fault = getFault()
  const servers = fault === 'crash' ? 0 : (serversOverride ?? plan.servers)
  const run = runAksFluid(servers, {
    serviceMs: plan.serviceMs,
    queue: plan.queue,
    lossProb: lossProbForFault(fault),
  })
  return { ok: true as const, plan, fault, run }
}

export function utilizationRanking(engineAks?: {
  util: number
  p99: string
}): RankRow[] {
  const rows: RankRow[] = initialNodes
    .filter((node) => node.type === 'service')
    .map((node) => {
      const data = node.data as ServiceNodeData
      const fromEngine = node.id === 'aks' && engineAks !== undefined
      return {
        id: node.id,
        title: data.title,
        provider: providerLabel[data.provider],
        util: fromEngine ? engineAks.util : data.util,
        p99: fromEngine ? engineAks.p99 : data.p99,
        source: fromEngine ? 'engine' : 'estimated',
      }
    })
  rows.push({
    id: 'copy-link',
    title: 'Azure to AWS copy link',
    provider: 'Cross-cloud',
    util: 0.91,
    p99: '0.8 GB/s',
    source: 'estimated',
  })
  return rows.filter((row) => row.util > 0).sort((a, b) => b.util - a.util)
}

function aksBottleneck(run: AksRun, suggestedSlots: number): Bottleneck {
  return {
    id: 'aks',
    title: 'Transcode workers (AKS)',
    util: run.util,
    summary: `${run.offered} uploads/s. ${run.servers} slots at ${run.serviceMs / 1000} s serve ${run.mu.toFixed(1)} uploads/s.`,
    suggestion: `Raise slots from ${run.servers} to ${suggestedSlots}. Utilization falls toward 83%.`,
    fromEngine: true,
  }
}

function copyLinkBottleneck(): Bottleneck {
  return {
    id: 'copy-link',
    title: 'Azure to AWS copy link',
    util: 0.91,
    summary: '0.8 GB/s copies vs 0.88 GB/s on the link. Capacity is Estimated.',
    suggestion: 'Measure this cross-provider link in Calibration. Unknown bandwidth does not cap the engine.',
    fromEngine: false,
  }
}

function kpisFromRun(run: AksRun, hint: string): KpiState {
  const hot = run.util >= 0.85 || run.completed < run.offered * 0.5
  return {
    ...idleKpis,
    bottlenecks: hot ? '1+' : '0',
    bottleneckHint: hot ? hint : 'none at the 83% target',
    latencyHint: 'P50 / P99 still Estimated — fluid mode has no tails yet',
  }
}

export function simulateAksBottleneck() {
  const resolved = resolveAksRun()
  if (!resolved.ok) {
    throw new Error(resolved.reason)
  }
  const { run, plan, fault } = resolved
  const slots = suggestedAksSlots(plan.servers > 0 ? aksScenario.offered : aksScenario.offered, run.serviceMs)
  let bottleneck = aksBottleneck(run, slots)
  if (fault === 'link-cut') {
    bottleneck = {
      id: 'up-aks',
      title: 'Upload link cut',
      util: 1,
      summary: 'lossProb = 1. AKS completed 0 /s. Calibration slots are unchanged.',
      suggestion: 'Clear the fault on the Faults tab and run again.',
      fromEngine: true,
    }
  } else if (fault === 'packet-drop') {
    bottleneck = {
      ...bottleneck,
      summary: `lossProb = 0.1. Completed ${run.completed.toFixed(2)} /s of ${run.offered} offered.`,
    }
  } else if (fault === 'crash') {
    bottleneck = {
      id: 'aks',
      title: 'AKS crash',
      util: 1,
      summary: 'Run used 0 slots. The calibration profile still holds the configured slot count.',
      suggestion: 'Clear the crash fault to restore calibrated slots on the next run.',
      fromEngine: true,
    }
  }
  return {
    util: run.util,
    backlog: run.backlog,
    rejected: run.rejected,
    completed: run.completed,
    mu: run.mu,
    bottleneck,
    kpis: kpisFromRun(run, bottleneck.title + ' from engine'),
  }
}

export function buildResultsReport(): ResultsReport {
  const resolved = resolveAksRun()
  if (!resolved.ok) {
    throw new Error(resolved.reason)
  }
  const baseline = resolved.run
  const slots = suggestedAksSlots(aksScenario.offered, baseline.serviceMs)
  const raised = runAksFluid(slots, {
    serviceMs: baseline.serviceMs,
    queue: resolved.plan.queue,
    lossProb: lossProbForFault(resolved.fault),
  })
  return {
    baseline,
    raised,
    suggestedSlots: slots,
    ranking: utilizationRanking({
      util: baseline.util,
      p99: `${baseline.mu.toFixed(1)} /s`,
    }),
    bottlenecks: [aksBottleneck(baseline, slots), copyLinkBottleneck()],
    kpis: kpisFromRun(baseline, 'Transcode workers (AKS) from engine'),
  }
}

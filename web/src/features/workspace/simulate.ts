import {
  expectedArrivals,
  meanMs,
  runDiscrete,
  runFluid,
  unwrap,
  edge,
  generator,
  worker,
  type CalibrationProfile,
  type Component,
  type DiscreteRunResult,
  type FluidState,
  type Topology,
} from '@sds/engine'
import { aksRunPlan, getFault, lossProbForFault } from '../calibration/library.ts'
import {
  compileCanvas,
  DISCRETE_EVENT_GUARD,
  type WorkloadDraft,
} from './compile.ts'
import { initialNodes } from './graph.ts'
import type { FaultMode } from '../calibration/types.ts'
import type {
  AksRun,
  Bottleneck,
  FluidPoint,
  KpiState,
  NodeHealth,
  NodeRunStat,
  RankRow,
  ResultsReport,
  ServiceNodeData,
  WorkspaceRun,
  ZoneNodeData,
} from './types.ts'
import type { Edge as RfEdge, Node } from '@xyflow/react'

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

function formatRps(n: number): string {
  if (n >= 1000) return `${Math.round(n).toLocaleString('en-US')} rps`
  if (n >= 10) return `${n.toFixed(1)} rps`
  return `${n.toFixed(2)} /s`
}

function muOf(component: Component, classIds: string[]): number {
  const servers =
    component.behavior.servers.state === 'set' ? unwrap(component.behavior.servers) : Number.POSITIVE_INFINITY
  let serviceSec = 0
  for (const classId of classIds) {
    const service = component.behavior.serviceTime[classId]
    if (service?.state === 'set') {
      serviceSec = Math.max(serviceSec, meanMs(unwrap(service)) / 1000)
    }
  }
  if (serviceSec <= 0) return Number.POSITIVE_INFINITY
  return servers / serviceSec
}

function classTotals(row: Record<string, { incomingOffered: number; completed: number; rejected: number }>) {
  let offered = 0
  let completed = 0
  let rejected = 0
  for (const item of Object.values(row)) {
    offered += item.incomingOffered
    completed += item.completed
    rejected += item.rejected
  }
  return { offered, completed, rejected }
}

function statFor(
  component: Component,
  offered: number,
  completed: number,
  rejected: number,
  mode: 'fluid' | 'discrete',
): NodeRunStat {
  const mu = muOf(component, Object.keys(component.behavior.serviceTime))
  const capped = Number.isFinite(mu)
  const util =
    component.kind === 'traffic_generator'
      ? 0
      : !capped
        ? rejected > 0
          ? 1
          : 0
        : mu > 0
          ? Math.min(1, completed / mu)
          : rejected > 0 || offered > 0
            ? 1
            : 0
  const meta =
    component.kind === 'traffic_generator'
      ? `${mode} · generator`
      : capped
        ? `${mode} · μ ${mu.toFixed(1)} /s`
        : `${mode} · unknown capacity (no cap)`
  return {
    util,
    completed,
    rejected,
    offered,
    mu,
    capped,
    p99: component.kind === 'traffic_generator' ? formatRps(offered) : `${completed.toFixed(1)} /s`,
    meta,
  }
}

function kpisFromStats(
  stats: Record<string, NodeRunStat>,
  topology: Topology,
  draft: WorkloadDraft,
  mode: 'fluid' | 'discrete',
  extra: { errors: number; latency: string; latencyHint: string },
): { kpis: KpiState; bottlenecks: Bottleneck[] } {
  const bottlenecks: Bottleneck[] = []
  for (const component of topology.components) {
    if (component.kind === 'traffic_generator') continue
    const row = stats[component.id]
    if (!row) continue
    if (row.util < 0.85 && row.rejected <= Math.max(0.01, row.offered * 0.01)) continue
    bottlenecks.push({
      id: component.id,
      title: component.name,
      util: row.util,
      summary: `${formatRps(row.offered)} offered, ${row.completed.toFixed(1)} completed/s, ${row.rejected.toFixed(1)} rejected/s.`,
      suggestion: row.capped
        ? 'Raise calibrated servers or service rate, then run again.'
        : 'Capacity is unknown, so this is not a hard engine cap. Set servers and service time in Calibration to measure utilization.',
      fromEngine: true,
    })
  }
  const load = Object.values(draft.classes).reduce((sum, rps) => sum + rps, 0)
  const hint = `R ${draft.classes.read.toLocaleString('en-US')} · W ${draft.classes.write.toLocaleString('en-US')} · A ${draft.classes.async.toLocaleString('en-US')} · B ${draft.classes.bulk}/s`
  return {
    bottlenecks,
    kpis: {
      ...idleKpis,
      load: formatRps(load),
      loadHint: hint,
      latency: extra.latency,
      latencyHint: extra.latencyHint,
      errors: `${(extra.errors * 100).toFixed(1)}%`,
      bottlenecks: String(bottlenecks.length),
      bottleneckHint: bottlenecks.length
        ? bottlenecks.map((item) => item.title).join(', ')
        : `none at 85% in ${mode} mode`,
    },
  }
}

function statsFromFluid(topology: Topology, last: FluidState, mode: 'fluid' | 'discrete') {
  const stats: Record<string, NodeRunStat> = {}
  for (const component of topology.components) {
    const row = last.components[component.id] ?? {}
    const totals = classTotals(row)
    stats[component.id] = statFor(component, totals.offered, totals.completed, totals.rejected, mode)
  }
  return stats
}

function statsFromDiscrete(topology: Topology, result: DiscreteRunResult, durationSec: number) {
  const completed: Record<string, number> = {}
  const arrived: Record<string, number> = {}
  for (const event of result.events) {
    if (event.type === 'finish-service') {
      completed[event.at] = (completed[event.at] ?? 0) + 1
    }
    if (event.type === 'arrive') {
      arrived[event.at] = (arrived[event.at] ?? 0) + 1
    }
  }
  const stats: Record<string, NodeRunStat> = {}
  for (const component of topology.components) {
    const done = (completed[component.id] ?? 0) / durationSec
    const offered = (arrived[component.id] ?? 0) / durationSec
    const rejected = Math.max(0, offered - done)
    stats[component.id] = statFor(component, offered, done, rejected, 'discrete')
  }
  return stats
}

export function runWorkspace(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  rfEdges: RfEdge[],
  draft: WorkloadDraft,
  profiles: CalibrationProfile[],
  fault: FaultMode,
): { ok: true; run: WorkspaceRun } | { ok: false; reason: string } {
  const { topology, workload } = compileCanvas(nodes, rfEdges, draft, profiles, fault)
  if (topology.components.length === 0) {
    return { ok: false, reason: 'Canvas has no service nodes to compile.' }
  }
  const arrivals = expectedArrivals(workload)
  if (draft.mode === 'discrete' && arrivals > DISCRETE_EVENT_GUARD) {
    return {
      ok: false,
      reason: `Discrete mode would schedule about ${Math.round(arrivals).toLocaleString('en-US')} arrivals. Guard is ${DISCRETE_EVENT_GUARD.toLocaleString('en-US')} so the tab does not freeze. Use fluid, or lower rate / duration.`,
    }
  }

  if (draft.mode === 'discrete') {
    const result = runDiscrete(topology, workload)
    const stats = statsFromDiscrete(topology, result, workload.durationSec)
    const sent = result.counts.created
    const errors = sent === 0 ? 0 : (result.counts.rejected + result.counts.dropped) / sent
    const { kpis, bottlenecks } = kpisFromStats(stats, topology, draft, 'discrete', {
      errors,
      latency: `${result.meanWaitMs.toFixed(0)} ms`,
      latencyHint: 'Mean wait from discrete-event. P99 needs more samples.',
    })
    return {
      ok: true,
      run: {
        mode: 'discrete',
        kpis,
        bottlenecks,
        nodeStats: stats,
        hint: `discrete · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
      },
    }
  }

  const result = runFluid(topology, workload)
  const last = result.steps.at(-1)
  if (!last) return { ok: false, reason: 'Fluid run produced no steps.' }
  const stats = statsFromFluid(topology, last, 'fluid')
  let offered = 0
  let rejected = 0
  for (const component of topology.components) {
    if (component.kind === 'traffic_generator') continue
    const row = stats[component.id]
    if (!row) continue
    offered += row.offered
    rejected += row.rejected
  }
  const { kpis, bottlenecks } = kpisFromStats(stats, topology, draft, 'fluid', {
    errors: offered > 0 ? rejected / offered : 0,
    latency: idleKpis.latency,
    latencyHint: 'P50 / P99 still Estimated — fluid mode has no tails',
  })
  return {
    ok: true,
    run: {
      mode: 'fluid',
      kpis,
      bottlenecks,
      nodeStats: stats,
      hint: `fluid · ${workload.durationSec}s · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
    },
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

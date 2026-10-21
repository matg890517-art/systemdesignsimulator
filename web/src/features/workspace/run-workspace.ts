import {
  expectedArrivals,
  meanMs,
  runDiscrete,
  runFluid,
  unwrap,
  type CalibrationProfile,
  type Component,
  type DiscreteRunResult,
  type FluidState,
  type Topology,
} from '@sds/engine'
import {
  compileCanvas,
  DISCRETE_EVENT_GUARD,
  type ClassFilter,
  type WorkloadDraft,
} from './compile.ts'
import type { FaultMode } from '../calibration/types.ts'
import type {
  Bottleneck,
  KpiState,
  NodeRunStat,
  ServiceNodeData,
  WorkspaceRun,
  ZoneNodeData,
} from './types.ts'
import type { Edge as RfEdge, Node } from '@xyflow/react'

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

export type RunProgress = {
  t: number
  fraction: number
  nodeStats: Record<string, NodeRunStat>
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
  classIds?: string[],
): NodeRunStat {
  const mu = muOf(component, classIds ?? Object.keys(component.behavior.serviceTime))
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
  const classStats: Record<string, Record<string, NodeRunStat>> = {}
  for (const component of topology.components) {
    const row = last.components[component.id] ?? {}
    const totals = classTotals(row)
    stats[component.id] = statFor(component, totals.offered, totals.completed, totals.rejected, mode)
    classStats[component.id] = {}
    for (const [classId, item] of Object.entries(row)) {
      classStats[component.id][classId] = statFor(
        component,
        item.incomingOffered,
        item.completed,
        item.rejected,
        mode,
        [classId],
      )
    }
  }
  return { stats, classStats }
}

function statsFromDiscrete(topology: Topology, result: DiscreteRunResult, durationSec: number) {
  const completed: Record<string, number> = {}
  const arrived: Record<string, number> = {}
  const completedClass: Record<string, Record<string, number>> = {}
  const arrivedClass: Record<string, Record<string, number>> = {}
  for (const event of result.events) {
    if (event.type === 'finish-service') {
      completed[event.at] = (completed[event.at] ?? 0) + 1
      const byClass = (completedClass[event.at] ??= {})
      byClass[event.req.classId] = (byClass[event.req.classId] ?? 0) + 1
    }
    if (event.type === 'arrive') {
      arrived[event.at] = (arrived[event.at] ?? 0) + 1
      const byClass = (arrivedClass[event.at] ??= {})
      byClass[event.req.classId] = (byClass[event.req.classId] ?? 0) + 1
    }
  }
  const stats: Record<string, NodeRunStat> = {}
  const classStats: Record<string, Record<string, NodeRunStat>> = {}
  for (const component of topology.components) {
    const done = (completed[component.id] ?? 0) / durationSec
    const offered = (arrived[component.id] ?? 0) / durationSec
    const rejected = Math.max(0, offered - done)
    stats[component.id] = statFor(component, offered, done, rejected, 'discrete')
    classStats[component.id] = {}
    const classIds = new Set([
      ...Object.keys(completedClass[component.id] ?? {}),
      ...Object.keys(arrivedClass[component.id] ?? {}),
    ])
    for (const classId of classIds) {
      const classDone = (completedClass[component.id]?.[classId] ?? 0) / durationSec
      const classOffered = (arrivedClass[component.id]?.[classId] ?? 0) / durationSec
      classStats[component.id][classId] = statFor(
        component,
        classOffered,
        classDone,
        Math.max(0, classOffered - classDone),
        'discrete',
        [classId],
      )
    }
  }
  return { stats, classStats }
}

export function pickNodeStat(
  run: WorkspaceRun,
  nodeId: string,
  filter: ClassFilter,
): NodeRunStat | undefined {
  if (filter === 'all') return run.nodeStats[nodeId]
  return run.classStats[nodeId]?.[filter]
}

export function runWorkspace(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  rfEdges: RfEdge[],
  draft: WorkloadDraft,
  profiles: CalibrationProfile[],
  fault: FaultMode,
  onProgress?: (progress: RunProgress) => void,
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
    const { stats, classStats } = statsFromDiscrete(topology, result, workload.durationSec)
    const sent = result.counts.created
    const errors = sent === 0 ? 0 : (result.counts.rejected + result.counts.dropped) / sent
    const { kpis, bottlenecks } = kpisFromStats(stats, topology, draft, 'discrete', {
      errors,
      latency: `${result.meanWaitMs.toFixed(0)} ms`,
      latencyHint: 'Mean wait from discrete-event. P99 needs more samples.',
    })
    onProgress?.({ t: workload.durationSec, fraction: 1, nodeStats: stats })
    return {
      ok: true,
      run: {
        mode: 'discrete',
        kpis,
        bottlenecks,
        nodeStats: stats,
        classStats,
        hint: `discrete · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
      },
    }
  }

  const stepCount = Math.max(1, Math.round(workload.durationSec / workload.dtSec))
  const emitEvery = Math.max(1, Math.floor(stepCount / 24))
  const result = runFluid(topology, workload, {
    record: false,
    onStep: (state, stepIndex, total) => {
      if (!onProgress) return
      if (stepIndex !== total && stepIndex % emitEvery !== 0) return
      const { stats } = statsFromFluid(topology, state, 'fluid')
      onProgress({ t: state.t, fraction: stepIndex / total, nodeStats: stats })
    },
  })
  const last = result.steps.at(-1)
  if (!last) return { ok: false, reason: 'Fluid run produced no steps.' }
  const { stats, classStats } = statsFromFluid(topology, last, 'fluid')
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
      classStats,
      hint: `fluid · ${workload.durationSec}s · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
    },
  }
}

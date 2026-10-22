import {
  blastRadius,
  expectedArrivals,
  meanMs,
  runDiscrete,
  runFluid,
  unwrap,
  costFromProfiles,
  type CalibrationProfile,
  type Component,
  type DiscreteRunResult,
  type FluidState,
  type SimEvent,
  type Topology,
} from '@sds/engine'
import { explainFromModel } from './explain.ts'
import { profileCitation } from '../calibration/citation.ts'
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

export function kpisFromDraft(draft: WorkloadDraft, profiles: CalibrationProfile[] = []): KpiState {
  const load = Object.values(draft.classes).reduce((sum, rps) => sum + rps, 0)
  const cost = costFromProfiles(profiles)
  return {
    load: formatRps(load),
    loadHint: `R ${draft.classes.read.toLocaleString('en-US')} · W ${draft.classes.write.toLocaleString('en-US')} · A ${draft.classes.async.toLocaleString('en-US')} · B ${draft.classes.bulk}/s`,
    latency: 'unknown',
    latencyHint: 'P50 / P90 / P99 unknown until discrete samples tails. Fluid has rates, not tails.',
    errors: 'unknown',
    bottlenecks: '—',
    bottleneckHint: 'Run to rank from the engine',
    cost: cost.value,
    costHint: cost.hint,
  }
}

export const idleKpis: KpiState = kpisFromDraft({
  durationSec: 60,
  dtSec: 0.1,
  seed: 4821,
  mode: 'fluid',
  shapeKind: 'constant',
  stepAtSec: 20,
  stepFactor: 2,
  spikeAtSec: 20,
  spikeDurationSec: 5,
  spikeFactor: 5,
  classes: { read: 50_000, write: 1_200, async: 2_600, bulk: 2 },
})

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

function classTotals(row: Record<string, { incomingOffered: number; completed: number; rejected: number; backlog?: number }>) {
  let offered = 0
  let completed = 0
  let rejected = 0
  let backlog = 0
  for (const item of Object.values(row)) {
    offered += item.incomingOffered
    completed += item.completed
    rejected += item.rejected
    backlog += item.backlog ?? 0
  }
  return { offered, completed, rejected, backlog }
}

function statFor(
  component: Component,
  offered: number,
  completed: number,
  rejected: number,
  mode: 'fluid' | 'discrete',
  classIds?: string[],
  profiles: CalibrationProfile[] = [],
  backlog = 0,
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
  const profile = profiles.find((item) => component.calibrationProfileIds.includes(item.id))
  const citation = profileCitation(profile)
  const servers = component.behavior.servers.state === 'set' ? unwrap(component.behavior.servers) : undefined
  let serviceMs: number | undefined
  for (const service of Object.values(component.behavior.serviceTime)) {
    if (service?.state === 'set') serviceMs = Math.max(serviceMs ?? 0, meanMs(unwrap(service)))
  }
  const loss = offered > 0 ? rejected / offered : 0
  const meta =
    component.kind === 'traffic_generator'
      ? `${mode} · generator`
      : capped
        ? `${mode} · μ ${mu.toFixed(1)} /s · q ${backlog.toFixed(1)} · ${citation}`
        : `${mode} · unknown capacity (no cap) · ${citation}`
  return {
    util,
    completed,
    rejected,
    offered,
    mu,
    capped,
    p99:
      component.kind === 'traffic_generator'
        ? formatRps(offered)
        : `${completed.toFixed(1)} /s`,
    meta,
    citation,
    backlog,
    loss,
    servers,
    serviceMs,
  }
}

function kpisFromStats(
  stats: Record<string, NodeRunStat>,
  topology: Topology,
  draft: WorkloadDraft,
  mode: 'fluid' | 'discrete',
  extra: { errors: number; latency: string; latencyHint: string },
  profiles: CalibrationProfile[],
): { kpis: KpiState; bottlenecks: Bottleneck[] } {
  const bottlenecks: Bottleneck[] = []
  for (const component of topology.components) {
    if (component.kind === 'traffic_generator') continue
    const row = stats[component.id]
    if (!row) continue
    if (row.util < 0.85 && row.rejected <= Math.max(0.01, row.offered * 0.01)) continue
    const profile = profiles.find((item) => component.calibrationProfileIds.includes(item.id))
    const explained = explainFromModel({
      name: component.name,
      offered: row.offered,
      completed: row.completed,
      rejected: row.rejected,
      backlog: row.backlog,
      util: row.util,
      servers: row.servers,
      serviceMs: row.serviceMs,
      capped: row.capped,
    })
    bottlenecks.push({
      id: component.id,
      title: component.name,
      util: row.util,
      summary: explained.numbers,
      suggestion: explained.fix,
      fromEngine: true,
      citation: profileCitation(profile),
      cause: explained.cause,
      wait: explained.wait,
    })
  }
  const load = Object.values(draft.classes).reduce((sum, rps) => sum + rps, 0)
  const hint = `R ${draft.classes.read.toLocaleString('en-US')} · W ${draft.classes.write.toLocaleString('en-US')} · A ${draft.classes.async.toLocaleString('en-US')} · B ${draft.classes.bulk}/s`
  return {
    bottlenecks,
    kpis: {
      load: formatRps(load),
      loadHint: hint,
      latency: extra.latency,
      latencyHint: extra.latencyHint,
      errors: `${(extra.errors * 100).toFixed(1)}%`,
      bottlenecks: String(bottlenecks.length),
      bottleneckHint: bottlenecks.length
        ? bottlenecks.map((item) => item.title).join(', ')
        : `none at 85% in ${mode} mode`,
      cost: costFromProfiles(profiles).value,
      costHint: costFromProfiles(profiles).hint,
    },
  }
}

function statsFromFluid(
  topology: Topology,
  last: FluidState,
  mode: 'fluid' | 'discrete',
  profiles: CalibrationProfile[] = [],
) {
  const stats: Record<string, NodeRunStat> = {}
  const classStats: Record<string, Record<string, NodeRunStat>> = {}
  for (const component of topology.components) {
    const row = last.components[component.id] ?? {}
    const totals = classTotals(row)
    stats[component.id] = statFor(
      component,
      totals.offered,
      totals.completed,
      totals.rejected,
      mode,
      undefined,
      profiles,
      totals.backlog,
    )
    classStats[component.id] = {}
    for (const [classId, item] of Object.entries(row)) {
      classStats[component.id][classId] = statFor(
        component,
        item.incomingOffered,
        item.completed,
        item.rejected,
        mode,
        [classId],
        profiles,
        item.backlog,
      )
    }
  }
  const { offered: edgeOffered, byClass: edgeClassOffered } = edgeOfferedFromFluid(last)
  return { stats, classStats, edgeOffered, edgeClassOffered }
}

function edgeOfferedFromFluid(last: FluidState) {
  const offered: Record<string, number> = {}
  const byClass: Record<string, Record<string, number>> = {}
  for (const [id, classes] of Object.entries(last.edges)) {
    let sum = 0
    const row: Record<string, number> = {}
    for (const [classId, state] of Object.entries(classes)) {
      row[classId] = state.offered
      sum += state.offered
    }
    offered[id] = sum
    byClass[id] = row
  }
  return { offered, byClass }
}

function statsFromDiscrete(
  topology: Topology,
  result: DiscreteRunResult,
  durationSec: number,
  profiles: CalibrationProfile[] = [],
) {
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
    const offered = (arrived[component.id] ?? 0) / durationSec
    const isGenerator = component.kind === 'traffic_generator'
    const done = isGenerator ? offered : (completed[component.id] ?? 0) / durationSec
    const rejected = isGenerator ? 0 : Math.max(0, offered - done)
    stats[component.id] = statFor(component, offered, done, rejected, 'discrete', undefined, profiles)
    classStats[component.id] = {}
    const classIds = new Set([
      ...Object.keys(completedClass[component.id] ?? {}),
      ...Object.keys(arrivedClass[component.id] ?? {}),
    ])
    for (const classId of classIds) {
      const classOffered = (arrivedClass[component.id]?.[classId] ?? 0) / durationSec
      const classDone = isGenerator
        ? classOffered
        : (completedClass[component.id]?.[classId] ?? 0) / durationSec
      classStats[component.id][classId] = statFor(
        component,
        classOffered,
        classDone,
        isGenerator ? 0 : Math.max(0, classOffered - classDone),
        'discrete',
        [classId],
        profiles,
      )
    }
  }
  const { offered: edgeOffered, byClass: edgeClassOffered } = edgeOfferedFromDiscrete(result, durationSec)
  return { stats, classStats, edgeOffered, edgeClassOffered }
}

function edgeOfferedFromDiscrete(result: DiscreteRunResult, durationSec: number) {
  const counts: Record<string, number> = {}
  const classCounts: Record<string, Record<string, number>> = {}
  for (const event of result.events) {
    if (event.type !== 'arrive') continue
    const id = event.edgeId ?? event.req.edgeId
    if (!id) continue
    counts[id] = (counts[id] ?? 0) + 1
    const row = (classCounts[id] ??= {})
    row[event.req.classId] = (row[event.req.classId] ?? 0) + 1
  }
  const offered: Record<string, number> = {}
  const byClass: Record<string, Record<string, number>> = {}
  for (const [id, n] of Object.entries(counts)) {
    offered[id] = n / durationSec
  }
  for (const [id, row] of Object.entries(classCounts)) {
    byClass[id] = {}
    for (const [classId, n] of Object.entries(row)) {
      byClass[id][classId] = n / durationSec
    }
  }
  return { offered, byClass }
}

export function blastFromRun(
  topology: Topology,
  fault: FaultMode,
  discrete?: DiscreteRunResult,
): { affectedComponentIds: string[]; blastOriginId?: string; breakerOpenEdges: string[] } {
  const origin =
    fault === 'crash'
      ? topology.components.find((item) => item.id === 'aks')?.id ??
        topology.components.find((item) => item.kind === 'worker')?.id
      : undefined
  const affectedComponentIds =
    discrete?.affectedComponentIds ??
    (origin ? blastRadius(topology, origin) : [])
  const breakerOpenEdges = discrete
    ? [
        ...new Set(
          discrete.events
            .filter(
              (event): event is Extract<SimEvent, { type: 'breaker-change' }> =>
                event.type === 'breaker-change' && event.to === 'open',
            )
            .map((event) => event.edge),
        ),
      ]
    : []
  return { affectedComponentIds, blastOriginId: origin, breakerOpenEdges }
}

export function pickNodeStat(
  run: WorkspaceRun,
  nodeId: string,
  filter: ClassFilter,
): NodeRunStat | undefined {
  if (filter === 'all') return run.nodeStats[nodeId]
  return run.classStats[nodeId]?.[filter]
}

export function pickEdgeOffered(
  run: WorkspaceRun,
  edgeId: string,
  filter: ClassFilter,
): number | undefined {
  if (filter === 'all') return run.edgeOffered[edgeId]
  return run.edgeClassOffered[edgeId]?.[filter]
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
    const { stats, classStats, edgeOffered, edgeClassOffered } = statsFromDiscrete(
      topology,
      result,
      workload.durationSec,
      profiles,
    )
    const sent = result.counts.created
    const errors = sent === 0 ? 0 : (result.counts.rejected + result.counts.dropped) / sent
    const { kpis, bottlenecks } = kpisFromStats(stats, topology, draft, 'discrete', {
      errors,
      latency: `${result.meanWaitMs.toFixed(0)} ms`,
      latencyHint: 'Mean wait from discrete-event. P99 needs more samples.',
    }, profiles)
    onProgress?.({ t: workload.durationSec, fraction: 1, nodeStats: stats })
    const blast = blastFromRun(topology, fault, result)
    return {
      ok: true,
      run: {
        mode: 'discrete',
        kpis,
        bottlenecks,
        nodeStats: stats,
        classStats,
        edgeOffered,
        edgeClassOffered,
        hint: `discrete · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}${blast.breakerOpenEdges.length ? ` · breaker open ${blast.breakerOpenEdges.join(',')}` : ''}`,
        ...blast,
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
      const { stats } = statsFromFluid(topology, state, 'fluid', profiles)
      onProgress({ t: state.t, fraction: stepIndex / total, nodeStats: stats })
    },
  })
  const last = result.steps.at(-1)
  if (!last) return { ok: false, reason: 'Fluid run produced no steps.' }
  const { stats, classStats, edgeOffered, edgeClassOffered } = statsFromFluid(
    topology,
    last,
    'fluid',
    profiles,
  )
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
    latency: 'unknown',
    latencyHint: 'P50 / P90 / P99 unknown — fluid mode has rates, not tails',
  }, profiles)
  const blast = blastFromRun(topology, fault)
  return {
    ok: true,
    run: {
      mode: 'fluid',
      kpis,
      bottlenecks,
      nodeStats: stats,
      classStats,
      edgeOffered,
      edgeClassOffered,
      hint: `fluid · ${workload.durationSec}s · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
      ...blast,
    },
  }
}

import {
  blastRadius,
  expectedArrivals,
  meanMs,
  runDiscrete,
  runFluid,
  unwrap,
  costFromProfiles,
  compileScenario,
  scenarioFromLegacy,
  solveAnalytic,
  simulateOnce,
  simulateWithSlices,
  headroomOf,
  hockeyStickSweep,
  type CalibrationProfile,
  type Component,
  type DiscreteRunResult,
  type EngineResult,
  type FluidState,
  type SimEvent,
  type Topology,
  type Workload,
} from '@sds/engine'
import { explainFromModel } from './explain.ts'
import { profileCitation } from '../calibration/citation.ts'
import {
  classTotalsFromOffered,
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  loadHintFromClassTotals,
  offeredClassTotals,
  type ClassFilter,
  type WorkloadDraft,
} from './compile.ts'
import type { FaultMode } from '../calibration/types.ts'
import type {
  Bottleneck,
  KpiState,
  NodeRunStat,
  RunTick,
  ServiceNodeData,
  WorkspaceRun,
  ZoneNodeData,
} from './types.ts'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import { emitEvery, shouldEmitTick } from './playback.ts'
import { isSimulatedMode, normalizeRunMode } from './run-mode.ts'

export function kpisFromDraft(
  draft: WorkloadDraft,
  profiles: CalibrationProfile[] = [],
  nodes?: Node<ServiceNodeData | ZoneNodeData>[],
  edges?: RfEdge[],
): KpiState {
  const totals =
    nodes && edges ? offeredClassTotals(nodes, edges, draft) : { ...draft.classes }
  const { load, hint } = loadHintFromClassTotals(totals)
  const cost = costFromProfiles(profiles)
  return {
    load: formatRps(load),
    loadHint: hint,
    latency: 'unknown',
    latencyHint: 'Run Analytic for closed-form p50/p95/p99. Never Measured.',
    errors: 'unknown',
    bottlenecks: '—',
    bottleneckHint: 'Run to rank from the engine',
    cost: cost.value,
    costHint: cost.hint,
  }
}

export const idleKpis: KpiState = kpisFromDraft(defaultWorkloadDraft())

export type RunProgress = RunTick & {
  fraction: number
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
  offered: Workload['offered'],
  mode: string,
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
  const { load, hint } = loadHintFromClassTotals(classTotalsFromOffered(offered))
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

function tickFromFluid(
  topology: Topology,
  state: FluidState,
  profiles: CalibrationProfile[],
): RunTick {
  const { stats, classStats, edgeOffered, edgeClassOffered } = statsFromFluid(
    topology,
    state,
    'fluid',
    profiles,
  )
  return {
    t: state.t,
    nodeStats: stats,
    classStats,
    edgeOffered,
    edgeClassOffered,
  }
}

function ticksFromDiscrete(
  topology: Topology,
  result: DiscreteRunResult,
  durationSec: number,
  profiles: CalibrationProfile[],
): RunTick[] {
  const bins = Math.min(48, Math.max(2, Math.round(durationSec / Math.max(0.25, durationSec / 24))))
  const binSec = durationSec / bins
  const ticks: RunTick[] = []
  let previous: RunTick | undefined
  for (let i = 1; i <= bins; i++) {
    const end = i * binSec
    const start = (i - 1) * binSec
    const slice: DiscreteRunResult = {
      ...result,
      events: result.events.filter((event) => event.t > start - 1e-12 && event.t <= end + 1e-12),
    }
    const { stats, classStats, edgeOffered, edgeClassOffered } = statsFromDiscrete(
      topology,
      slice,
      binSec,
      profiles,
    )
    const empty = Object.values(stats).every((row) => row.offered === 0 && row.completed === 0)
    const snap = empty && previous
      ? previous
      : { nodeStats: stats, classStats, edgeOffered, edgeClassOffered }
    const tick: RunTick = { t: end, ...snap }
    ticks.push(tick)
    previous = tick
  }
  return ticks
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

function planStatusLabel(status: string): string {
  if (status === 'unstable') return 'Unstable'
  if (status === 'warning' || status === 'critical') return 'Saturating'
  if (status === 'not_wired') return 'Not wired'
  if (status === 'unknown') return 'Unknown'
  return 'Stable'
}

function statsFromEngine(
  topology: Topology,
  result: EngineResult,
  mode: 'analytic' | 'simulated',
  profiles: CalibrationProfile[],
) {
  const label = mode === 'analytic' ? 'Analytic' : 'Simulated'
  const stats: Record<string, NodeRunStat> = {}
  const classStats: Record<string, Record<string, NodeRunStat>> = {}
  for (const component of topology.components) {
    const row = result.nodes[component.id]
    const profile = profiles.find((item) => component.calibrationProfileIds.includes(item.id))
    const citation = profileCitation(profile)
    const servers = component.behavior.servers.state === 'set' ? unwrap(component.behavior.servers) : undefined
    let serviceMs: number | undefined
    for (const service of Object.values(component.behavior.serviceTime)) {
      if (service?.state === 'set') serviceMs = Math.max(serviceMs ?? 0, meanMs(unwrap(service)))
    }
    if (!row) continue
    const generator = component.kind === 'traffic_generator'
    const waitText = generator
      ? formatRps(row.lambda)
      : row.waitUnknown || !Number.isFinite(row.p99)
        ? 'unknown wait'
        : `${row.p99.toFixed(0)} ms p99`
    const mu = serviceMs && servers ? servers / (serviceMs / 1000) : Number.POSITIVE_INFINITY
    const offered = row.lambda
    const completed = row.throughput
    const rejected = row.dropRate
    stats[component.id] = {
      util: generator ? 0 : Number.isFinite(row.rho) ? Math.min(1, Math.max(0, row.rho)) : 0,
      completed,
      rejected,
      offered,
      mu,
      capped: Number.isFinite(mu),
      p99: waitText,
      meta: generator
        ? `${label} · generator`
        : `${label} · ${planStatusLabel(row.status)} · ρ ${Number.isFinite(row.rho) ? (row.rho * 100).toFixed(0) : '—'}% · ${citation}`,
      citation,
      backlog: Number.isFinite(row.Lq) ? row.Lq : 0,
      loss: offered > 0 ? rejected / offered : 0,
      servers,
      serviceMs,
    }
    classStats[component.id] = {}
  }
  for (const edge of topology.edges) {
    const flow = result.edges[edge.id]
    if (!flow) continue
    const dest = stats[edge.to]
    if (!dest) continue
    const destClasses = (classStats[edge.to] ??= {})
    for (const [classId, rps] of Object.entries(flow.flow_rps)) {
      const prev = destClasses[classId]
      const offered = (prev?.offered ?? 0) + rps
      destClasses[classId] = {
        ...dest,
        offered,
        completed: offered,
        rejected: 0,
        loss: 0,
      }
    }
  }
  const edgeOffered: Record<string, number> = {}
  const edgeClassOffered: Record<string, Record<string, number>> = {}
  for (const [id, edge] of Object.entries(result.edges)) {
    let sum = 0
    const byClass: Record<string, number> = {}
    for (const [classId, rps] of Object.entries(edge.flow_rps)) {
      byClass[classId] = rps
      sum += rps
    }
    edgeOffered[id] = sum
    edgeClassOffered[id] = byClass
  }
  return { stats, classStats, edgeOffered, edgeClassOffered }
}

function hockeyFromSweep(
  topology: Topology,
  sweep: { rps: number; waitMs: Record<string, number> }[],
) {
  const rps = sweep.map((point) => point.rps)
  const ids = topology.components.filter((c) => c.kind !== 'traffic_generator').map((c) => c.id)
  const lines = ids.map((id) => ({
    id,
    title: topology.components.find((c) => c.id === id)?.name ?? id,
    waitMs: sweep.map((point) => point.waitMs[id] ?? Number.NaN),
  }))
  return { rps, lines }
}

type WorkspaceOutcome = { ok: true; run: WorkspaceRun } | { ok: false; reason: string }

function finishFromEngine(
  topology: Topology,
  workload: Workload,
  compiled: Parameters<typeof solveAnalytic>[0],
  result: EngineResult,
  mode: 'analytic' | 'simulated',
  profiles: CalibrationProfile[],
  onProgress?: (progress: RunProgress) => void,
): WorkspaceOutcome {
  const { stats, classStats, edgeOffered, edgeClassOffered } = statsFromEngine(
    topology,
    result,
    mode,
    profiles,
  )
  const room = mode === 'analytic' ? headroomOf(compiled, solveAnalytic) : undefined
  const stick =
    mode === 'analytic' ? hockeyFromSweep(topology, hockeyStickSweep(compiled, solveAnalytic, 10)) : undefined
  const errors = Object.values(result.nodes).reduce((sum, row) => sum + row.dropRate + row.timeoutRate, 0)
  const offeredSum = Object.values(result.nodes)
    .filter((row) => row.status !== 'not_wired')
    .reduce((sum, row) => sum + row.lambda, 0)
  const hot = result.system.bottleneck ? result.nodes[result.system.bottleneck] : undefined
  const latency =
    hot && Number.isFinite(hot.W_ms)
      ? `${hot.W_ms.toFixed(0)} ms`
      : hot && !Number.isFinite(hot.W_ms)
        ? 'unstable'
        : '—'
  const { kpis, bottlenecks } = kpisFromStats(stats, topology, workload.offered, mode, {
    errors: offeredSum > 0 ? errors / offeredSum : 0,
    latency,
    latencyHint:
      mode === 'analytic'
        ? `${result.evidence} · Analytic p99 on the hottest node. Never Measured.`
        : `${result.evidence} · Simulated mean sojourn on the hottest node. Not Measured.`,
  }, profiles)
  if (room?.headroom_rps !== undefined) {
    kpis.bottleneckHint = `${kpis.bottleneckHint} · headroom ${formatRps(room.headroom_rps)}`
  }
  const lastTick: RunTick = {
    t: workload.durationSec,
    nodeStats: stats,
    classStats,
    edgeOffered,
    edgeClassOffered,
  }
  onProgress?.({ ...lastTick, fraction: 1 })
  return {
    ok: true,
    run: {
      mode,
      kpis,
      bottlenecks,
      nodeStats: stats,
      classStats,
      edgeOffered,
      edgeClassOffered,
      ticks: [lastTick],
      durationSec: workload.durationSec,
      hint: `${mode} · seed ${workload.seed} · ${result.evidence}`,
      affectedComponentIds: [],
      breakerOpenEdges: [],
      evidence: result.evidence,
      stability: result.system.stability,
      headroomRps: room?.headroom_rps,
      firstFailing: room?.firstFailing,
      hockeyStick: stick,
    },
  }
}

export function runWorkspace(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  rfEdges: RfEdge[],
  draft: WorkloadDraft,
  profiles: CalibrationProfile[],
  fault: FaultMode,
  onProgress?: (progress: RunProgress) => void,
  cancelled?: () => boolean,
): WorkspaceOutcome {
  const { topology, workload } = compileCanvas(nodes, rfEdges, draft, profiles, fault)
  if (topology.components.length === 0) {
    return { ok: false, reason: 'Canvas has no service nodes to compile.' }
  }
  const arrivals = expectedArrivals(workload)
  const mode = normalizeRunMode(draft.mode)
  if (mode === 'analytic' || (mode === 'simulated' && fault === 'none')) {
    if (mode === 'simulated' && arrivals > DISCRETE_EVENT_GUARD) {
      return {
        ok: false,
        reason: `Simulated mode would schedule about ${Math.round(arrivals).toLocaleString('en-US')} arrivals. Guard is ${DISCRETE_EVENT_GUARD.toLocaleString('en-US')} so the tab does not freeze. Use Analytic, or lower rate / duration.`,
      }
    }
    const compiled = compileScenario(scenarioFromLegacy(topology, workload))
    if (compiled.invalid) return { ok: false, reason: compiled.invalid }
    const result =
      mode === 'analytic'
        ? solveAnalytic(compiled)
        : simulateOnce(compiled, workload.seed, {
            cancelled,
            onProgress: (info) => {
              onProgress?.({
                t: info.t_s,
                fraction: info.fraction,
                nodeStats: {},
                classStats: {},
                edgeOffered: {},
                edgeClassOffered: {},
              })
            },
          })
    return finishFromEngine(topology, workload, compiled, result, mode, profiles, onProgress)
  }
  if (isSimulatedMode(draft.mode) && arrivals > DISCRETE_EVENT_GUARD) {
    return {
      ok: false,
      reason: `Simulated mode would schedule about ${Math.round(arrivals).toLocaleString('en-US')} arrivals. Guard is ${DISCRETE_EVENT_GUARD.toLocaleString('en-US')} so the tab does not freeze. Use Analytic, or lower rate / duration.`,
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
    const ticks = ticksFromDiscrete(topology, result, workload.durationSec, profiles)
    const lastTick: RunTick = {
      t: workload.durationSec,
      nodeStats: stats,
      classStats,
      edgeOffered,
      edgeClassOffered,
    }
    if (ticks.length === 0 || ticks.at(-1)!.t < workload.durationSec - 1e-9) {
      ticks.push(lastTick)
    } else {
      ticks[ticks.length - 1] = lastTick
    }
    const sent = result.counts.created
    const errors = sent === 0 ? 0 : (result.counts.rejected + result.counts.dropped) / sent
    const { kpis, bottlenecks } = kpisFromStats(stats, topology, workload.offered, 'discrete', {
      errors,
      latency: `${result.meanWaitMs.toFixed(0)} ms`,
      latencyHint: 'Mean wait from discrete-event. P99 needs more samples.',
    }, profiles)
    onProgress?.({ ...lastTick, fraction: 1 })
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
        ticks,
        durationSec: workload.durationSec,
        hint: `discrete · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}${blast.breakerOpenEdges.length ? ` · breaker open ${blast.breakerOpenEdges.join(',')}` : ''}`,
        ...blast,
      },
    }
  }

  const stepCount = Math.max(1, Math.round(workload.durationSec / workload.dtSec))
  const every = emitEvery(stepCount)
  const ticks: RunTick[] = []
  const result = runFluid(topology, workload, {
    record: false,
    onStep: (state, stepIndex, total) => {
      if (!shouldEmitTick(stepIndex, total, every)) return
      const tick = tickFromFluid(topology, state, profiles)
      ticks.push(tick)
      onProgress?.({ ...tick, fraction: stepIndex / total })
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
  if (ticks.length === 0 || ticks.at(-1)!.t < last.t - 1e-9) {
    ticks.push({
      t: last.t,
      nodeStats: stats,
      classStats,
      edgeOffered,
      edgeClassOffered,
    })
  }
  let offered = 0
  let rejected = 0
  for (const component of topology.components) {
    if (component.kind === 'traffic_generator') continue
    const row = stats[component.id]
    if (!row) continue
    offered += row.offered
    rejected += row.rejected
  }
  const { kpis, bottlenecks } = kpisFromStats(stats, topology, workload.offered, 'fluid', {
    errors: offered > 0 ? rejected / offered : 0,
    latency: 'unknown',
    latencyHint: 'Analytic percentiles not wired yet. Unknown until then. Not Measured.',
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
      ticks,
      durationSec: workload.durationSec,
      hint: `fluid · ${workload.durationSec}s · seed ${workload.seed}${fault !== 'none' ? ` · fault ${fault}` : ''}`,
      ...blast,
    },
  }
}

/** Worker path: Simulated DES yields every 8 ms so cancel can land. Analytic stays sync. */
export async function runWorkspaceSliced(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  rfEdges: RfEdge[],
  draft: WorkloadDraft,
  profiles: CalibrationProfile[],
  fault: FaultMode,
  onProgress?: (progress: RunProgress) => void,
  cancelled?: () => boolean,
): Promise<WorkspaceOutcome> {
  const { topology, workload } = compileCanvas(nodes, rfEdges, draft, profiles, fault)
  if (topology.components.length === 0) {
    return { ok: false, reason: 'Canvas has no service nodes to compile.' }
  }
  const arrivals = expectedArrivals(workload)
  const mode = normalizeRunMode(draft.mode)
  if (mode === 'analytic' || (mode === 'simulated' && fault === 'none')) {
    if (mode === 'simulated' && arrivals > DISCRETE_EVENT_GUARD) {
      return {
        ok: false,
        reason: `Simulated mode would schedule about ${Math.round(arrivals).toLocaleString('en-US')} arrivals. Guard is ${DISCRETE_EVENT_GUARD.toLocaleString('en-US')} so the tab does not freeze. Use Analytic, or lower rate / duration.`,
      }
    }
    const compiled = compileScenario(scenarioFromLegacy(topology, workload))
    if (compiled.invalid) return { ok: false, reason: compiled.invalid }
    const result =
      mode === 'analytic'
        ? solveAnalytic(compiled)
        : await simulateWithSlices(compiled, workload.seed, {
            cancelled,
            onProgress: (info) => {
              onProgress?.({
                t: info.t_s,
                fraction: info.fraction,
                nodeStats: {},
                classStats: {},
                edgeOffered: {},
                edgeClassOffered: {},
              })
            },
          })
    return finishFromEngine(topology, workload, compiled, result, mode, profiles, onProgress)
  }
  return runWorkspace(nodes, rfEdges, draft, profiles, fault, onProgress, cancelled)
}

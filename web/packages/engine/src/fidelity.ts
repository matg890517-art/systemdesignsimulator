import { meanMs, unwrap } from './values.ts'
import type {
  CalibrationProfile,
  Component,
  Confidence,
  FluidState,
  Topology,
} from './types.ts'

/** Decision 7: B’s numeric band is set only after the first real measurement. */
export const B_TOLERANCE_RPS: number | undefined = undefined

export const SATURATION_UTIL = 0.85

export type RecordedLoadTest = {
  schema: 1
  name: string
  /** absent = no lab run yet (decision 6). lab = a real recording. harness = scorer unit tests only. */
  kind: 'absent' | 'lab' | 'harness'
  recordedOn?: string
  sourceUrl?: string
  notes: string
  reference: 'generic-9'
  firstSaturatingComponentId?: string
  latencyKneeRps?: number
  ranking?: { componentId: string }[]
}

export type CheckStatus = 'pass' | 'fail' | 'blocked'

export type FidelityCheck = {
  id: 'A' | 'B' | 'C'
  status: CheckStatus
  detail: string
  predicted?: string | number
  measured?: string | number
}

export type ProfileGap = {
  profileId: string
  name: string
  bindsTo?: string
  unknownRoles: string[]
  confidence: Confidence | 'unknown'
  measured: boolean
}

export type FidelityReport = {
  recorded: RecordedLoadTest
  checkA: FidelityCheck
  checkB: FidelityCheck
  checkC: FidelityCheck
  gaps: ProfileGap[]
  measuredLabels: number
}

export const absentRecordedTest: RecordedLoadTest = {
  schema: 1,
  name: 'No recorded load test',
  kind: 'absent',
  notes:
    'Decision 6: no profile is labeled Measured until a real reference load test exists. J12 A and B stay blocked.',
  reference: 'generic-9',
}

export function muOf(component: Component): number {
  const servers =
    component.behavior.servers.state === 'set' ? unwrap(component.behavior.servers) : Number.POSITIVE_INFINITY
  let serviceSec = 0
  for (const service of Object.values(component.behavior.serviceTime)) {
    if (service?.state === 'set') serviceSec = Math.max(serviceSec, meanMs(unwrap(service)) / 1000)
  }
  if (serviceSec <= 0) return Number.POSITIVE_INFINITY
  return servers / serviceSec
}

export function utilOf(component: Component, last: FluidState): number {
  const row = last.components[component.id]
  if (!row) return 0
  let completed = 0
  let rejected = 0
  for (const item of Object.values(row)) {
    completed += item.completed
    rejected += item.rejected
  }
  const mu = muOf(component)
  if (!Number.isFinite(mu)) return rejected > 0 ? 1 : 0
  return mu > 0 ? Math.min(1, completed / mu) : rejected > 0 ? 1 : 0
}

export function rankByUtilization(
  topology: Topology,
  last: FluidState,
): { id: string; util: number }[] {
  return topology.components
    .filter((component) => component.kind !== 'traffic_generator')
    .map((component) => ({ id: component.id, util: utilOf(component, last) }))
    .sort((a, b) => b.util - a.util || a.id.localeCompare(b.id))
}

export function firstSaturatingComponentId(
  ranking: { id: string; util: number }[],
  threshold = SATURATION_UTIL,
): string | undefined {
  return ranking.find((row) => row.util >= threshold)?.id
}

/** First offered load whose latency is at least twice the low-load baseline. Labeled a guess. */
export function latencyKneeRps(points: { rps: number; latencyMs: number }[]): number | undefined {
  if (points.length < 2) return undefined
  const sorted = [...points].sort((a, b) => a.rps - b.rps)
  const baseline = sorted[0]!.latencyMs
  if (baseline <= 0) return undefined
  const knee = sorted.find((point) => point.latencyMs >= baseline * 2)
  return knee?.rps
}

export function spearmanRho(predicted: string[], measured: string[]): number | undefined {
  const n = Math.min(predicted.length, measured.length)
  if (n < 2) return undefined
  const measuredRank = new Map(measured.map((id, index) => [id, index]))
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0; i < n; i++) {
    const y = measuredRank.get(predicted[i]!)
    if (y === undefined) continue
    xs.push(i)
    ys.push(y)
  }
  if (xs.length < 2) return undefined
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let denX = 0
  let denY = 0
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i]! - meanX
    const dy = ys[i]! - meanY
    num += dx * dy
    denX += dx * dx
    denY += dy * dy
  }
  const den = Math.sqrt(denX * denY)
  return den === 0 ? undefined : num / den
}

export function profileGaps(profiles: CalibrationProfile[]): ProfileGap[] {
  return profiles.map((profile) => {
    const unknownRoles = profile.fields
      .filter((field) => field.value.state === 'unknown')
      .map((field) => field.role)
    const setField = profile.fields.find((field) => field.value.state === 'set')
    const confidence =
      setField && setField.value.state === 'set' ? setField.value.confidence : 'unknown'
    return {
      profileId: profile.id,
      name: profile.name,
      bindsTo: profile.bindsTo,
      unknownRoles,
      confidence,
      measured: confidence === 'measured',
    }
  })
}

export function scoreFidelity(input: {
  recorded: RecordedLoadTest
  predictedFirst?: string
  predictedKneeRps?: number
  predictedRanking?: string[]
  profiles?: CalibrationProfile[]
}): FidelityReport {
  const recorded = input.recorded
  const gaps = profileGaps(input.profiles ?? [])
  const measuredLabels = gaps.filter((gap) => gap.measured).length

  const checkA: FidelityCheck = (() => {
    if (recorded.kind === 'absent' || !recorded.firstSaturatingComponentId) {
      return {
        id: 'A',
        status: 'blocked',
        detail: 'No recorded first-saturating component. J12 A waits for a lab run of the reference stack.',
        predicted: input.predictedFirst,
      }
    }
    if (!input.predictedFirst) {
      return {
        id: 'A',
        status: 'fail',
        detail: 'Engine predicted no component at or above 85% utilization.',
        measured: recorded.firstSaturatingComponentId,
      }
    }
    const pass = input.predictedFirst === recorded.firstSaturatingComponentId
    return {
      id: 'A',
      status: pass ? 'pass' : 'fail',
      detail: pass
        ? 'Same first-saturating component.'
        : `Engine named ${input.predictedFirst}; recording named ${recorded.firstSaturatingComponentId}.`,
      predicted: input.predictedFirst,
      measured: recorded.firstSaturatingComponentId,
    }
  })()

  const checkB: FidelityCheck = (() => {
    if (recorded.kind === 'absent' || recorded.latencyKneeRps === undefined) {
      return {
        id: 'B',
        status: 'blocked',
        detail: 'No recorded latency-knee load. Decision 7 also leaves the B tolerance unset until after the first measurement.',
        predicted: input.predictedKneeRps,
      }
    }
    if (B_TOLERANCE_RPS === undefined) {
      return {
        id: 'B',
        status: 'blocked',
        detail: `Recording knee ${recorded.latencyKneeRps} rps. B tolerance is unset until after the first real measurement (decision 7).`,
        predicted: input.predictedKneeRps,
        measured: recorded.latencyKneeRps,
      }
    }
    if (input.predictedKneeRps === undefined) {
      return {
        id: 'B',
        status: 'fail',
        detail: 'Engine did not produce a predicted knee.',
        measured: recorded.latencyKneeRps,
      }
    }
    const err = Math.abs(input.predictedKneeRps - recorded.latencyKneeRps) / Math.max(recorded.latencyKneeRps, 1e-9)
    const pass = err <= B_TOLERANCE_RPS
    return {
      id: 'B',
      status: pass ? 'pass' : 'fail',
      detail: `Relative error ${(err * 100).toFixed(1)}% vs tolerance ${(B_TOLERANCE_RPS * 100).toFixed(0)}%.`,
      predicted: input.predictedKneeRps,
      measured: recorded.latencyKneeRps,
    }
  })()

  const rho =
    recorded.ranking && input.predictedRanking
      ? spearmanRho(input.predictedRanking, recorded.ranking.map((row) => row.componentId))
      : undefined
  const checkC: FidelityCheck = {
    id: 'C',
    status: rho === undefined ? 'blocked' : 'pass',
    detail:
      rho === undefined
        ? 'Rank correlation is diagnostic only (decision 7). Needs two rankings.'
        : `Spearman ρ = ${rho.toFixed(2)} (diagnostic, not a pass check).`,
    predicted: rho,
  }

  return { recorded, checkA, checkB, checkC, gaps, measuredLabels }
}

const LOAD_TEST_HEADER = ['timestamp', 'requestClass', 'latencyMs', 'status', 'rps'] as const

/** Strict header from decision 14. Does not label a profile Measured by itself. */
export function parseLoadTestCsv(text: string): { rps: number; latencyMs: number }[] {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const header = lines[0]!.split(',').map((cell) => cell.trim())
  if (LOAD_TEST_HEADER.some((name, index) => header[index] !== name)) return []
  const points: { rps: number; latencyMs: number }[] = []
  for (const line of lines.slice(1)) {
    const cells = line.split(',')
    const latencyMs = Number(cells[2])
    const rps = Number(cells[4])
    if (!Number.isFinite(latencyMs) || !Number.isFinite(rps)) continue
    points.push({ rps, latencyMs })
  }
  return points
}

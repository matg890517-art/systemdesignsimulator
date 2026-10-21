import type { LoadShape, RequestClassId, Workload } from './types.ts'

export function shapeFactor(shape: LoadShape | undefined, tSec: number): number {
  if (!shape || shape.kind === 'constant' || shape.kind === 'poisson') return 1
  if (shape.kind === 'step') return tSec >= shape.atSec ? shape.factor : 1
  if (tSec >= shape.atSec && tSec < shape.atSec + shape.durationSec) return shape.factor
  return 1
}

export function peakFactor(shape: LoadShape | undefined): number {
  if (!shape || shape.kind === 'constant' || shape.kind === 'poisson') return 1
  return Math.max(1, shape.factor)
}

export function baselineRps(workload: Workload): number {
  let total = 0
  for (const classes of Object.values(workload.offered)) {
    for (const rps of Object.values(classes)) total += rps
  }
  return total
}

/** Upper bound on Poisson arrivals over the run. Not a canvas limit. */
export function expectedArrivals(workload: Workload): number {
  return baselineRps(workload) * peakFactor(workload.shape) * workload.durationSec
}

export function offeredAt(
  workload: Workload,
  generatorId: string,
  classId: RequestClassId,
  tSec: number,
): number {
  const base = workload.offered[generatorId]?.[classId] ?? 0
  return base * shapeFactor(workload.shape, tSec)
}

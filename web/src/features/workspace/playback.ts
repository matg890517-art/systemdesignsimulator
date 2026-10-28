import type { RunTick, WorkspaceRun } from './types.ts'

/** Sample this many fluid steps (plus first and last) so playback has a curve, not every Δt. */
export const TICK_BUDGET = 48

export function emitEvery(stepCount: number, budget = TICK_BUDGET): number {
  return Math.max(1, Math.floor(Math.max(1, stepCount) / budget))
}

export function shouldEmitTick(stepIndex: number, total: number, every: number): boolean {
  if (stepIndex <= 1 || stepIndex === total) return true
  return stepIndex % every === 0
}

/** Wall-clock length of a replay. 60 s of sim ≈ 10 s on screen. */
export function playbackWallMs(durationSec: number): number {
  return Math.round(Math.min(12_000, Math.max(4_000, durationSec * 160)))
}

/** Dash cycle: busier hops move faster. View of offered rate, not a second engine. */
export function flowPeriodSec(rps: number): number {
  if (rps <= 0) return 1.4
  return Math.max(0.18, Math.min(1.2, 1.05 - Math.log10(1 + rps) / 5))
}

export function pickTick(ticks: RunTick[] | undefined, t: number): RunTick | undefined {
  if (!ticks || ticks.length === 0) return undefined
  let chosen = ticks[0]
  for (const tick of ticks) {
    if (tick.t <= t + 1e-9) chosen = tick
    else break
  }
  return chosen
}

/** Cards and hop labels at simulated time t. Last-tick fields stay on the run for summaries. */
export function viewRunAt(run: WorkspaceRun, t: number): WorkspaceRun {
  const tick = pickTick(run.ticks, t)
  if (!tick) return run
  return {
    ...run,
    nodeStats: tick.nodeStats,
    classStats: tick.classStats,
    edgeOffered: tick.edgeOffered,
    edgeClassOffered: tick.edgeClassOffered,
  }
}

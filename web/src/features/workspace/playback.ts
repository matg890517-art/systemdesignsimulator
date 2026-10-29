import { normalizeShowMode, type ShowMode } from './display-mode.ts'
import { isSimulatedMode } from './run-mode.ts'
import type { RunTick, TickRates, WorkspaceRun } from './types.ts'

export function canPlayback(run: WorkspaceRun | undefined): boolean {
  return Boolean(run && isSimulatedMode(run.mode) && run.ticks.length > 1)
}

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

/** One trip along the hop. Busier hops move faster. View of offered rate, not a second engine. */
export function flowPeriodSec(rps: number): number {
  if (rps <= 0) return 2.4
  return Math.max(0.7, Math.min(2.4, 2.15 - Math.log10(1 + rps) / 2.4))
}

/** Traveling dots on a hop. A view of rate, not one circle per request. */
export function flowPacketCount(rps: number): number {
  if (rps <= 0) return 0
  return Math.min(5, Math.max(2, Math.round(1.5 + Math.log10(1 + rps))))
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

function ratesOf(tick: RunTick, show: ShowMode): TickRates {
  if (show === 'instant' && tick.instant) return tick.instant
  return {
    nodeStats: tick.nodeStats,
    classStats: tick.classStats,
    edgeOffered: tick.edgeOffered,
    edgeClassOffered: tick.edgeClassOffered,
  }
}

/** Instantaneous = this sample. Average = t=0 to playhead. Queue depth is always the live snapshot. */
export function viewRunAt(run: WorkspaceRun, t: number, showMode: ShowMode = 'average'): WorkspaceRun {
  const tick = pickTick(run.ticks, t)
  if (!tick) return run
  const rates = ratesOf(tick, normalizeShowMode(showMode))
  return {
    ...run,
    nodeStats: rates.nodeStats,
    classStats: rates.classStats,
    edgeOffered: rates.edgeOffered,
    edgeClassOffered: rates.edgeClassOffered,
  }
}

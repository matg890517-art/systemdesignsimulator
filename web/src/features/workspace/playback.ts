import { normalizeShowMode, type ShowMode } from './display-mode.ts'
import { isSimulatedMode } from './run-mode.ts'
import type { NodeRunStat, RunTick, TickRates, WorkspaceRun } from './types.ts'

export const PLAYBACK_SPEEDS = [0.5, 1, 2, 5, 10] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

export function canPlayback(run: WorkspaceRun | undefined): boolean {
  return Boolean(run && isSimulatedMode(run.mode) && run.ticks.length > 1)
}

/** Current simulated time vs Workload Duration. Not a VCR. */
export function formatSimClock(t: number, durationSec: number): string {
  const max = Math.max(0, durationSec)
  const value = Math.min(Math.max(0, t), max)
  const currentDigits = max > 0 && max < 15 ? 2 : 1
  const full =
    Math.abs(max - Math.round(max)) < 1e-6 ? String(Math.round(max)) : max.toFixed(1)
  return `${value.toFixed(currentDigits)}s / ${full}s`
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

/** Canvas paint cadence while the slider moves every animation frame. Not a 60 FPS claim. */
export const PLAY_PAINT_MS = 32

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

/**
 * Instant holds the last closed dt window. The t=0 DES snapshot has a 0 s window
 * (all zeros / busy-or-idle), so it is not a sample — use the first closed tick until then.
 */
export function pickInstantTick(ticks: RunTick[] | undefined, t: number): RunTick | undefined {
  if (!ticks || ticks.length === 0) return undefined
  const closed = ticks.filter((tick) => tick.t > 1e-9)
  if (closed.length === 0) return ticks[0]
  return pickTick(closed, t)
}

/** Neighbors around t so the canvas can lerp. Engine ticks stay sparse; this is a view. */
export function pickTickSpan(
  ticks: RunTick[] | undefined,
  t: number,
): { from: RunTick; to: RunTick; u: number } | undefined {
  if (!ticks || ticks.length === 0) return undefined
  if (ticks.length === 1 || t <= ticks[0]!.t + 1e-9) {
    const only = ticks[0]!
    return { from: only, to: only, u: 0 }
  }
  const last = ticks[ticks.length - 1]!
  if (t >= last.t - 1e-9) return { from: last, to: last, u: 0 }
  for (let i = 1; i < ticks.length; i++) {
    const to = ticks[i]!
    if (to.t + 1e-9 < t) continue
    const from = ticks[i - 1]!
    const span = to.t - from.t
    const u = span > 1e-9 ? Math.min(1, Math.max(0, (t - from.t) / span)) : 0
    return { from, to, u }
  }
  return { from: last, to: last, u: 0 }
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

function lerpNum(a: number, b: number, u: number): number {
  if (!Number.isFinite(a)) return b
  if (!Number.isFinite(b)) return a
  return a + (b - a) * u
}

function lerpStat(a: NodeRunStat | undefined, b: NodeRunStat | undefined, u: number): NodeRunStat | undefined {
  if (!a) return b
  if (!b) return a
  return {
    ...a,
    util: lerpNum(a.util, b.util, u),
    completed: lerpNum(a.completed, b.completed, u),
    rejected: lerpNum(a.rejected, b.rejected, u),
    offered: lerpNum(a.offered, b.offered, u),
    backlog: lerpNum(a.backlog, b.backlog, u),
    loss: lerpNum(a.loss, b.loss, u),
    p99: u < 0.5 ? a.p99 : b.p99,
  }
}

function lerpRecord<T>(
  a: Record<string, T>,
  b: Record<string, T>,
  u: number,
  mix: (left: T | undefined, right: T | undefined, at: number) => T | undefined,
): Record<string, T> {
  const out: Record<string, T> = {}
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const row = mix(a[id], b[id], u)
    if (row !== undefined) out[id] = row
  }
  return out
}

export function lerpRates(from: TickRates, to: TickRates, u: number): TickRates {
  if (u <= 0) return from
  if (u >= 1) return to
  return {
    nodeStats: lerpRecord(from.nodeStats, to.nodeStats, u, lerpStat),
    classStats: lerpRecord(from.classStats, to.classStats, u, (left, right, at) => {
      if (!left) return right
      if (!right) return left
      return lerpRecord(left, right, at, lerpStat)
    }),
    edgeOffered: lerpRecord(from.edgeOffered, to.edgeOffered, u, (left, right, at) =>
      lerpNum(left ?? 0, right ?? 0, at),
    ),
    edgeClassOffered: lerpRecord(from.edgeClassOffered, to.edgeClassOffered, u, (left, right, at) => {
      if (!left) return right
      if (!right) return left
      return lerpRecord(left, right, at, (l, r, u2) => lerpNum(l ?? 0, r ?? 0, u2))
    }),
  }
}

/**
 * Instantaneous = last dt sample (held, not lerped). Average = t=0 to playhead (lerped).
 * Slider still moves continuously. Not extra DES samples.
 */
export function viewRunAt(run: WorkspaceRun, t: number, showMode: ShowMode = 'average'): WorkspaceRun {
  const show = normalizeShowMode(showMode)
  if (show === 'instant') {
    const tick = pickInstantTick(run.ticks, t)
    if (!tick) return run
    const rates = ratesOf(tick, show)
    return {
      ...run,
      nodeStats: rates.nodeStats,
      classStats: rates.classStats,
      edgeOffered: rates.edgeOffered,
      edgeClassOffered: rates.edgeClassOffered,
    }
  }
  const span = pickTickSpan(run.ticks, t)
  if (!span) return run
  const rates = lerpRates(ratesOf(span.from, show), ratesOf(span.to, show), span.u)
  return {
    ...run,
    nodeStats: rates.nodeStats,
    classStats: rates.classStats,
    edgeOffered: rates.edgeOffered,
    edgeClassOffered: rates.edgeClassOffered,
  }
}

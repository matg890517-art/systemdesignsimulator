export type LiveClock = {
  originMs: number
  pace: number
  paused: boolean
  tSim: number
}

export function createLiveClock(nowMs: number, pace: number): LiveClock {
  return { originMs: nowMs, pace, paused: false, tSim: 0 }
}

/** Keep the current t_sim on screen when pace changes or Pause ends. */
export function reanchorOriginMs(nowMs: number, tSim: number, pace: number): number {
  return nowMs - (tSim / Math.max(pace, 1e-9)) * 1000
}

/** Wall delay so a tick at t_sim is shown at origin + t_sim/pace. pace≤0 means no wait. */
export function liveDelayMs(originMs: number, tSim: number, pace: number, nowMs: number): number {
  if (!(pace > 0)) return 0
  return originMs + (tSim / pace) * 1000 - nowMs
}

/** Keep Stop up until the full Duration has elapsed on the desk. */
export function liveHoldMs(originMs: number, durationSec: number, pace: number, nowMs: number): number {
  return Math.max(0, liveDelayMs(originMs, durationSec, pace, nowMs))
}

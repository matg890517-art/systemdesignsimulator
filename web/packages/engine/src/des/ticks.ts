/** Fallback Instantaneous window when Workload dt is missing. */
export const INSTANT_WINDOW_S = 1

/**
 * Canvas sample step. Prefer Workload dt so each Δt is one tick.
 * No duration split and no frame-budget stretch — long runs emit more ticks.
 * Instantaneous ρ and hop `/s` are that same step (the last dt), not a 1 s override.
 */
export function tickEveryUs(durationUs: number, dtUs?: number): number {
  const span = Math.max(1, Math.round(durationUs))
  if (dtUs && dtUs > 0) return Math.max(1, Math.round(dtUs))
  const windowUs = Math.round(INSTANT_WINDOW_S * 1_000_000)
  return Math.min(windowUs, span)
}

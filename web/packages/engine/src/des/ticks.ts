/** Sample this many DES instants (plus last) so Simulated playback has a curve. */
export const TICK_BUDGET = 60

/** Instantaneous ρ and hop `/s` use this many simulated seconds, not Workload dt. */
export const INSTANT_WINDOW_S = 1

/**
 * Instantaneous window is 1 s of simulated time, not dt.
 * Runs longer than TICK_BUDGET seconds stretch the step so we stay within the frame cap.
 * Not every DES event, and not a 60 FPS claim.
 */
export function tickEveryUs(durationUs: number, _dtUs?: number, budget = TICK_BUDGET): number {
  const windowUs = Math.round(INSTANT_WINDOW_S * 1_000_000)
  const byWindow = Math.min(windowUs, Math.max(1, durationUs))
  const byBudget = Math.max(1, Math.floor(Math.max(1, durationUs) / budget))
  return Math.max(byWindow, byBudget)
}

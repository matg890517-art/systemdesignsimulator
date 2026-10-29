/** Sample this many DES instants (plus last) so Simulated playback has a curve. */
export const TICK_BUDGET = 48

/**
 * Instantaneous window follows Workload dt. Long runs still cap at TICK_BUDGET frames
 * (60 s / 0.1 s → ~1.25 s ≈ 10 dt). Not every DES event, and not a 60 FPS claim.
 */
export function tickEveryUs(durationUs: number, dtUs?: number, budget = TICK_BUDGET): number {
  const byBudget = Math.max(1, Math.floor(Math.max(1, durationUs) / budget))
  if (!dtUs || dtUs <= 0) return byBudget
  return Math.max(byBudget, Math.round(dtUs))
}

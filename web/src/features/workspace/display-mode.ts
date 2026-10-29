/** Canvas paint, not the engine. Analytic is one solve; this only changes Simulated ticks. */
export const SHOW_MODES = [
  {
    id: 'instant' as const,
    label: 'Instantaneous',
    shortLabel: 'Instant',
    hint: 'ρ is % of limit in the last 1 s of simulated time. Hop /s is arrivals in that 1 s, not one request and not Workload dt. p99 stays empty. DES is event-driven.',
  },
  {
    id: 'average' as const,
    label: 'Average',
    shortLabel: 'Average',
    hint: 'ρ and hop /s from t = 0 to the playhead. p99 only if wait rounds to at least 1 ms. KPI strip stays the post-warm-up summary.',
  },
]

export type ShowMode = (typeof SHOW_MODES)[number]['id']

export function normalizeShowMode(value: string | undefined): ShowMode {
  return value === 'average' ? 'average' : 'instant'
}

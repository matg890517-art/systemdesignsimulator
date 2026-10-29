/** Canvas paint, not the engine. Analytic is one solve; this only changes Simulated ticks. */
export const SHOW_MODES = [
  {
    id: 'instant' as const,
    label: 'Instantaneous',
    shortLabel: 'Instant',
    hint: 'ρ is % of limit in this sample. Hop /s is arrivals in the sample, not one request. DES is event-driven; samples follow dt, capped at 48 frames (~10 dt on a 60 s / 0.1 s run).',
  },
  {
    id: 'average' as const,
    label: 'Average',
    shortLabel: 'Average',
    hint: 'ρ and hop /s from t = 0 to the playhead. KPI strip stays the post-warm-up summary.',
  },
]

export type ShowMode = (typeof SHOW_MODES)[number]['id']

export function normalizeShowMode(value: string | undefined): ShowMode {
  return value === 'average' ? 'average' : 'instant'
}

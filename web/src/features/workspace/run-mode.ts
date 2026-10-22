import type { WorkloadDraft } from './compile.ts'

/** F6: two run modes on the same topology. Fluid has rates, not tails. */
export const RUN_MODES = [
  {
    id: 'fluid' as const,
    label: 'Fluid-flow',
    shortLabel: 'Fluid',
    hint: 'Rates and capacity. P50 / P90 / P99 stay unknown.',
  },
  {
    id: 'discrete' as const,
    label: 'Discrete-event',
    shortLabel: 'Discrete',
    hint: 'Individual requests. Tails come from samples.',
  },
]

export function isRunMode(value: string): value is WorkloadDraft['mode'] {
  return value === 'fluid' || value === 'discrete'
}

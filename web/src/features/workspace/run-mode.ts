import type { WorkloadDraft } from './compile.ts'

/** F6: Analytic (E1) vs discrete-event (E2+). Fluid id is the overload/rate branch until Analytic is wired. */
export const RUN_MODES = [
  {
    id: 'fluid' as const,
    label: 'Fluid-flow',
    shortLabel: 'Fluid',
    hint: 'Today: rate stepper. Phase 1 target: Analytic Erlang C. Percentiles labeled Analytic, not Measured. Unknown S keeps wait unknown.',
  },
  {
    id: 'discrete' as const,
    label: 'Discrete-event',
    shortLabel: 'Discrete',
    hint: 'Verifier for Analytic, then bursts and faults. Tails come from samples.',
  },
]

export function isRunMode(value: string): value is WorkloadDraft['mode'] {
  return value === 'fluid' || value === 'discrete'
}

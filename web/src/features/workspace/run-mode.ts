import type { WorkloadDraft } from './compile.ts'

export type RunModeId = 'analytic' | 'simulated'

/** F6: Analytic (E1) vs Simulated DES (E2+). Older Fluid/Discrete ids still parse. */
export const RUN_MODES = [
  {
    id: 'analytic' as const,
    label: 'Analytic',
    shortLabel: 'Analytic',
    hint: 'Closed-form steady state (Jackson, Erlang C). p50/p95/p99 labeled Analytic, never Measured. Unknown S keeps wait unknown.',
  },
  {
    id: 'simulated' as const,
    label: 'Simulated',
    shortLabel: 'Simulated',
    hint: 'Seeded discrete-event verifier of the same scenario. Tails come from samples. Not Measured.',
  },
]

export function normalizeRunMode(value: string | undefined): RunModeId {
  if (value === 'simulated' || value === 'discrete') return 'simulated'
  return 'analytic'
}

export function isRunMode(value: string): value is WorkloadDraft['mode'] {
  return value === 'analytic' || value === 'simulated' || value === 'fluid' || value === 'discrete'
}

export function isSimulatedMode(value: string | undefined): boolean {
  return normalizeRunMode(value) === 'simulated'
}

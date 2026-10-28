import { runAnalytic } from './analytic.ts'
import { replayDiscreteLog, runDiscrete } from './discrete.ts'
import { assertConservation, fluidStep, initialFluidState } from './fluid.ts'
import type { FluidRunResult, FluidState, Topology, Workload } from './types.ts'

export { runAnalytic, replayDiscreteLog, runDiscrete }

export function runFluid(
  topology: Topology,
  workload: Workload,
  options?: {
    checkConservation?: boolean
    /** Keep every tick for replay. Default true. Workspace runs set false. */
    record?: boolean
    onStep?: (state: FluidState, stepIndex: number, stepCount: number) => void
  },
): FluidRunResult {
  const check = options?.checkConservation ?? true
  const record = options?.record ?? true
  const steps = Math.round(workload.durationSec / workload.dtSec)
  let state = initialFluidState(topology, workload)
  const recorded = record ? [structuredClone(state)] : [state]

  for (let i = 0; i < steps; i++) {
    const next = fluidStep(topology, workload, state, workload.dtSec)
    if (check) assertConservation(next, workload.dtSec, state)
    if (record) recorded.push(structuredClone(next))
    options?.onStep?.(next, i + 1, steps)
    state = next
  }

  if (!record) recorded.push(state)
  return { seed: workload.seed, dtSec: workload.dtSec, steps: recorded }
}

export function replayLog(result: FluidRunResult): string {
  return JSON.stringify(result)
}

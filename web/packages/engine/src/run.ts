import { replayDiscreteLog, runDiscrete } from './discrete.ts'
import { assertConservation, fluidStep, initialFluidState } from './fluid.ts'
import type { FluidRunResult, Topology, Workload } from './types.ts'

export { replayDiscreteLog, runDiscrete }

export function runFluid(
  topology: Topology,
  workload: Workload,
  options?: { checkConservation?: boolean },
): FluidRunResult {
  const check = options?.checkConservation ?? true
  const steps = Math.round(workload.durationSec / workload.dtSec)
  let state = initialFluidState(topology, workload)
  const recorded = [structuredClone(state)]

  for (let i = 0; i < steps; i++) {
    const next = fluidStep(topology, workload, state, workload.dtSec)
    if (check) assertConservation(next, workload.dtSec, state)
    recorded.push(structuredClone(next))
    state = next
  }

  return { seed: workload.seed, dtSec: workload.dtSec, steps: recorded }
}

export function replayLog(result: FluidRunResult): string {
  return JSON.stringify(result)
}

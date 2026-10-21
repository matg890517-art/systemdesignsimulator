import { describe, expect, it } from 'vitest'
import { runDiscrete } from './discrete.ts'
import { referenceStack, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'

const J5_TOLERANCE = 0.05

function relativeError(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-9)
  return Math.abs(a - b) / denom
}

function discreteRate(
  componentId: string,
  result: ReturnType<typeof runDiscrete>,
  durationSec: number,
  skipSec = 2,
) {
  const finishes = result.events.filter(
    (event) =>
      event.type === 'finish-service' && event.at === componentId && event.t >= skipSec * 1000,
  ).length
  return finishes / (durationSec - skipSec)
}

describe('J5 mode agreement', () => {
  it('keeps util and throughput within 5% on the reference stack at light load (5% is a labeled guess)', () => {
    const topology = referenceStack()
    const workload = workloadAt(60, { durationSec: 20, seed: 4821 })
    const fluid = runFluid(topology, workload)
    const discrete = runDiscrete(topology, workload)
    const last = fluid.steps.at(-1)
    if (!last) throw new Error('no fluid steps')

    for (const id of ['lb', 'service', 'worker'] as const) {
      const fluidCompleted = last.components[id]?.read?.completed ?? 0
      const discreteCompleted = discreteRate(id, discrete, workload.durationSec)
      expect(fluidCompleted).toBeGreaterThan(0)
      expect(relativeError(fluidCompleted, discreteCompleted)).toBeLessThan(J5_TOLERANCE)

      const servers = id === 'lb' ? 4 : 8
      const serviceSec = id === 'lb' ? 0.001 : id === 'service' ? 0.02 : 0.03
      const mu = servers / serviceSec
      const fluidUtil = fluidCompleted / mu
      const discreteUtil = discreteCompleted / mu
      expect(fluidUtil).toBeLessThan(0.5)
      expect(relativeError(fluidUtil, discreteUtil)).toBeLessThan(J5_TOLERANCE)
    }
  })
})

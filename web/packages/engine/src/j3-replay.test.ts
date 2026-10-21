import { describe, expect, it } from 'vitest'
import { chainTopology, workloadAt } from './fixtures.ts'
import { replayLog, runFluid } from './run.ts'

describe('J3 deterministic replay', () => {
  it('produces a byte-identical timeline for the same topology, workload, mode and seed', () => {
    const topology = chainTopology()
    const workload = workloadAt(200, { seed: 4821 })
    const a = replayLog(runFluid(topology, workload))
    const b = replayLog(runFluid(topology, workload))
    expect(a).toBe(b)
  })

  it('matches the last tick when the workspace skips recording every step', () => {
    const topology = chainTopology()
    const workload = workloadAt(150, { seed: 4821 })
    const full = runFluid(topology, workload)
    const thin = runFluid(topology, workload, { record: false })
    const lastFull = full.steps.at(-1)
    const lastThin = thin.steps.at(-1)
    if (!lastFull || !lastThin) throw new Error('no steps')
    expect(lastThin.t).toBe(lastFull.t)
    expect(lastThin.components.pool.read.completed).toBeCloseTo(
      lastFull.components.pool.read.completed,
      9,
    )
  })
})

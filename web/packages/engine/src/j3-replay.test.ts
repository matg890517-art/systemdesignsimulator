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
})

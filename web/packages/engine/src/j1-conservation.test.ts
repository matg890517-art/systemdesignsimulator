import { describe, expect, it } from 'vitest'
import { conservationHolds } from './conservation.ts'
import { chainTopology, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'

describe('J1 flow conservation, fluid', () => {
  it('holds the identity offered = admitted + rejected + network drop', () => {
    expect(
      conservationHolds({
        offered: 200,
        admitted: 160,
        rejected: 40,
        networkDrop: 0,
      }),
    ).toBe(true)
  })

  it('holds at every tick for a stable worker pool', () => {
    const result = runFluid(chainTopology(), workloadAt(150))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const pool = last.components.pool.read
    expect(pool.admitted).toBeCloseTo(150, 9)
    expect(pool.rejected).toBeCloseTo(0, 9)
    expect(pool.completed).toBeCloseTo(150, 9)
    expect(pool.backlog).toBeLessThan(1)
  })

  it('fills the queue then rejects the surplus at 200 rps', () => {
    const result = runFluid(chainTopology(), workloadAt(200, { durationSec: 2 }))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const pool = last.components.pool.read
    expect(pool.admitted).toBeCloseTo(160, 6)
    expect(pool.rejected).toBeCloseTo(40, 6)
    expect(pool.backlog).toBeCloseTo(50, 6)
  })
})

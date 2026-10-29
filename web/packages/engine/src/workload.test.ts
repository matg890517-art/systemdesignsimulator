import { describe, expect, it } from 'vitest'
import { chainTopology, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'
import { expectedArrivals, offeredAt, shapeFactor } from './workload.ts'

describe('load shapes', () => {
  it('keeps constant and poisson at factor 1', () => {
    expect(shapeFactor({ kind: 'constant' }, 10)).toBe(1)
    expect(shapeFactor({ kind: 'poisson' }, 10)).toBe(1)
  })

  it('ramps from 0 to 1 over durationSec', () => {
    expect(shapeFactor({ kind: 'ramp', durationSec: 10 }, 0)).toBe(0)
    expect(shapeFactor({ kind: 'ramp', durationSec: 10 }, 5)).toBeCloseTo(0.5, 9)
    expect(shapeFactor({ kind: 'ramp', durationSec: 10 }, 10)).toBe(1)
    expect(shapeFactor({ kind: 'ramp', durationSec: 10 }, 12)).toBe(1)
  })

  it('steps the offered rate after atSec', () => {
    const workload = {
      ...workloadAt(100),
      shape: { kind: 'step' as const, atSec: 1, factor: 2 },
    }
    expect(offeredAt(workload, 'clients', 'read', 0.5)).toBe(100)
    expect(offeredAt(workload, 'clients', 'read', 1)).toBe(200)
  })

  it('spikes only inside the window', () => {
    const shape = { kind: 'spike' as const, atSec: 2, durationSec: 1, factor: 5 }
    expect(shapeFactor(shape, 1.9)).toBe(1)
    expect(shapeFactor(shape, 2)).toBe(5)
    expect(shapeFactor(shape, 2.9)).toBe(5)
    expect(shapeFactor(shape, 3)).toBe(1)
  })

  it('does not cap fluid flow when servers are unknown', () => {
    const topology = chainTopology()
    const pool = topology.components.find((component) => component.id === 'pool')
    if (!pool) throw new Error('missing pool')
    pool.behavior.servers = { state: 'unknown' }
    const result = runFluid(topology, workloadAt(200, { durationSec: 2 }))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    expect(last.components.pool.read.completed).toBeCloseTo(200, 6)
    expect(last.components.pool.read.rejected).toBeCloseTo(0, 6)
  })

  it('does not cap fluid flow when service time is unknown', () => {
    const topology = chainTopology()
    const pool = topology.components.find((component) => component.id === 'pool')
    if (!pool) throw new Error('missing pool')
    pool.behavior.serviceTime.read = { state: 'unknown' }
    const result = runFluid(topology, workloadAt(200, { durationSec: 2 }))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    expect(last.components.pool.read.completed).toBeCloseTo(200, 6)
    expect(last.components.pool.read.rejected).toBeCloseTo(0, 6)
  })

  it('counts expected arrivals from peak factor, not a canvas cap', () => {
    expect(expectedArrivals(workloadAt(100, { durationSec: 2 }))).toBe(200)
    expect(
      expectedArrivals({
        ...workloadAt(100, { durationSec: 2 }),
        shape: { kind: 'spike', atSec: 1, durationSec: 0.2, factor: 10 },
      }),
    ).toBe(2000)
  })
})

import { describe, expect, it } from 'vitest'
import { requestConservationHolds } from './conservation.ts'
import { runDiscrete } from './discrete.ts'
import { cache, edge, generator, worker, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'

function cacheChain(hitRate: number) {
  return {
    components: [
      generator('clients'),
      cache('front', { servers: 8, serviceMs: 1, hitRate }),
      worker('origin', { servers: 16, serviceMs: 5, queue: 'unbounded' }),
    ],
    edges: [edge('c-f', 'clients', 'front'), edge('f-o', 'front', 'origin')],
  }
}

describe('J8 cache hit rate, discrete-event', () => {
  it('reproduces the configured aggregate hit rate within 5% (tolerance is a labeled guess)', () => {
    const hitRate = 0.8
    const result = runDiscrete(cacheChain(hitRate), workloadAt(200, { durationSec: 6, seed: 4821 }))
    expect(requestConservationHolds(result.counts)).toBe(true)
    const stats = result.cacheStats.front
    expect(stats).toBeDefined()
    expect(stats!.lookups).toBeGreaterThan(200)
    expect(Math.abs(stats!.measuredHitRate - hitRate)).toBeLessThan(0.05)
  })

  it('keeps origin traffic near the miss fraction, matching fluid', () => {
    const topology = cacheChain(0.9)
    const workload = workloadAt(100, { durationSec: 4, seed: 7 })
    const discrete = runDiscrete(topology, workload)
    const fluid = runFluid(topology, workload)
    const last = fluid.steps.at(-1)
    if (!last) throw new Error('no fluid steps')
    const originArrivals = discrete.events.filter(
      (event) => event.type === 'arrive' && event.at === 'origin',
    ).length
    const originRps = originArrivals / workload.durationSec
    expect(last.components.origin.read.incomingOffered).toBeCloseTo(10, 5)
    expect(originRps).toBeGreaterThan(5)
    expect(originRps).toBeLessThan(18)
  })
})

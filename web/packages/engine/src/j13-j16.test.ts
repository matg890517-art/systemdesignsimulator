import { describe, expect, it } from 'vitest'
import { hockeyStickRow, runAnalytic } from './analytic.ts'
import { cache, edge, generator, hockeyStickTopology, worker, workloadAt } from './fixtures.ts'
import { erlangCWaitMs, littlesLawHolds, mmcWaitQuantileMs } from './queueing.ts'
import { createRng } from './rng.ts'

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

describe('J13 Jackson traffic', () => {
  it('sends only the miss fraction past a cache', () => {
    const result = runAnalytic(cacheChain(0.8), workloadAt(100))
    expect(result.label).toBe('analytic')
    expect(result.components.front?.lambda).toBeCloseTo(100, 9)
    expect(result.components.origin?.lambda).toBeCloseTo(20, 9)
    expect(result.totals.read).toBeCloseTo(100, 9)
  })

  it('splits weighted siblings without double-counting', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('a', { servers: 8, serviceMs: 10, queue: 'unbounded' }),
        worker('b', { servers: 8, serviceMs: 10, queue: 'unbounded' }),
      ],
      edges: [
        edge('c-a', 'clients', 'a', { routing: { mode: 'weighted', weight: 1 } }),
        edge('c-b', 'clients', 'b', { routing: { mode: 'weighted', weight: 3 } }),
      ],
    }
    const result = runAnalytic(topology, workloadAt(800))
    expect(result.components.a?.lambda).toBeCloseTo(200, 9)
    expect(result.components.b?.lambda).toBeCloseTo(600, 9)
  })
})

describe('J14 hockey-stick table', () => {
  it('matches 6 / 7 / 8 servers at 290 rps and does not call 6 servers OK', () => {
    const six = hockeyStickRow(6)
    const seven = hockeyStickRow(7)
    const eight = hockeyStickRow(8)
    expect(six.rho).toBeCloseTo(0.9667, 3)
    expect(six.sojournMs).toBeCloseTo(111, 0)
    expect(six.p95WaitMs).toBeCloseTo(290, 0)
    expect(six.status).toBe('saturating')
    expect(seven.rho).toBeCloseTo(0.8286, 3)
    expect(seven.sojournMs).toBeCloseTo(29, 0)
    expect(seven.p95WaitMs).toBeCloseTo(40, 0)
    expect(eight.rho).toBeCloseTo(0.725, 3)
    expect(eight.sojournMs).toBeCloseTo(23, 0)
    expect(eight.p95WaitMs).toBeCloseTo(17, 0)
    expect(six.sojournMs / eight.sojournMs).toBeGreaterThan(4)
    expect(six.status).not.toBe('stable')
  })
})

describe('J15 Little’s law and monotonic wait', () => {
  it('keeps L = λW and never shortens wait as load rises', () => {
    const loads = [50, 100, 150, 200, 250]
    let previousWait = 0
    for (const rps of loads) {
      const result = runAnalytic(hockeyStickTopology(8), workloadAt(rps))
      const pool = result.components.pool
      if (!pool) throw new Error('missing pool')
      expect(littlesLawHolds(pool.lambda, pool.waitMs / 1000, pool.queueLength)).toBe(true)
      expect(pool.waitMs).toBeGreaterThanOrEqual(previousWait - 1e-9)
      previousWait = pool.waitMs
    }
  })
})

describe('J16 unstable never silent', () => {
  it('flags ρ ≥ 1 as Unstable and does not cap λ', () => {
    const result = runAnalytic(hockeyStickTopology(6), workloadAt(400))
    const pool = result.components.pool
    if (!pool) throw new Error('missing pool')
    expect(pool.lambda).toBeCloseTo(400, 9)
    expect(pool.rho).toBeGreaterThan(1)
    expect(pool.status).toBe('unstable')
    expect(result.status).toBe('unstable')
    expect(pool.waitMs).toBe(Number.POSITIVE_INFINITY)
  })

  it('keeps wait unknown when service time is unknown', () => {
    const topology = hockeyStickTopology(6)
    const pool = topology.components.find((component) => component.id === 'pool')
    if (!pool) throw new Error('missing pool')
    pool.behavior.serviceTime = { read: { state: 'unknown' } }
    const result = runAnalytic(topology, workloadAt(100))
    expect(result.components.pool?.waitUnknown).toBe(true)
    expect(Number.isNaN(result.components.pool?.waitMs)).toBe(true)
  })
})

describe('engine PRNG', () => {
  it('replays the same stream for the same seed and differs for another seed', () => {
    const a = createRng(4821)
    const b = createRng(4821)
    const c = createRng(7)
    const first = Array.from({ length: 8 }, () => a())
    const second = Array.from({ length: 8 }, () => b())
    const other = Array.from({ length: 8 }, () => c())
    expect(first).toEqual(second)
    expect(first).not.toEqual(other)
    expect(first.every((value) => value >= 0 && value < 1)).toBe(true)
  })
})

describe('Erlang C helpers', () => {
  it('agrees with the closed-form wait used by the hockey-stick row', () => {
    const wait = erlangCWaitMs(290, 50, 6)
    const p95 = mmcWaitQuantileMs(0.95, 290, 50, 6)
    expect(wait + 20).toBeCloseTo(hockeyStickRow(6).sojournMs, 10)
    expect(p95).toBeCloseTo(hockeyStickRow(6).p95WaitMs, 10)
  })
})

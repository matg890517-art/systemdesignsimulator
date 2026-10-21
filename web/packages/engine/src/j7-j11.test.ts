import { describe, expect, it } from 'vitest'
import { runDiscrete } from './discrete.ts'
import {
  edge,
  failingDependency,
  generator,
  worker,
  workloadAt,
} from './fixtures.ts'
import { attemptsPerRequest } from './routing.ts'

describe('J7 retry behavior', () => {
  it('converges attempts per request to 1.11 and stays inside the retry budget', () => {
    expect(attemptsPerRequest(0.1, 2)).toBeCloseTo(1.11, 10)
    const result = runDiscrete(
      failingDependency(),
      workloadAt(80, { durationSec: 8, seed: 4821 }),
    )
    expect(result.meanAttempts).toBeCloseTo(1.11, 1)
    const retried = result.events.filter((event) => event.type === 'retry')
    expect(retried.every((event) => event.type === 'retry' && event.req.attempt <= 3)).toBe(
      true,
    )
  })
})

describe('J9 node crash', () => {
  it('turns later inflow into rejections and lists the blast radius', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('front', { servers: 8, serviceMs: 5, queue: 'unbounded' }),
        worker('back', { servers: 8, serviceMs: 5, queue: 'unbounded' }),
      ],
      edges: [edge('c-f', 'clients', 'front'), edge('f-b', 'front', 'back')],
    }
    const result = runDiscrete(topology, {
      ...workloadAt(60, { durationSec: 1.2, seed: 7 }),
      faults: [{ tSec: 0.3, kind: 'crash', componentId: 'front' }],
    })
    expect(result.counts.rejected).toBeGreaterThan(0)
    expect(result.affectedComponentIds).toEqual(expect.arrayContaining(['front', 'back']))
  })
})

describe('J10 link cut, loss, latency spike', () => {
  it('drops every request after a link cut', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('pool', { servers: 8, serviceMs: 5, queue: 'unbounded' }),
      ],
      edges: [edge('e1', 'clients', 'pool')],
    }
    const result = runDiscrete(topology, {
      ...workloadAt(50, { durationSec: 0.8, seed: 3 }),
      faults: [{ tSec: 0, kind: 'link-cut', edgeId: 'e1' }],
    })
    expect(result.counts.dropped).toBe(result.counts.created)
    expect(result.counts.completed).toBe(0)
  })

  it('approaches configured loss p', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('pool', { servers: 16, serviceMs: 2, queue: 'unbounded' }),
      ],
      edges: [edge('e1', 'clients', 'pool', { network: { latencyMs: 0, bandwidthApplies: 'both', lossProb: 0.2, serialization: false } })],
    }
    const result = runDiscrete(topology, workloadAt(200, { durationSec: 4, seed: 9 }))
    expect(Math.abs(result.measuredLoss - 0.2)).toBeLessThan(0.05)
  })

  it('adds the latency spike to network delay', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('pool', { servers: 16, serviceMs: 1, queue: 'unbounded' }),
      ],
      edges: [edge('e1', 'clients', 'pool')],
    }
    const result = runDiscrete(topology, {
      ...workloadAt(80, { durationSec: 1, seed: 11 }),
      faults: [{ tSec: 0, kind: 'latency-spike', edgeId: 'e1', addMs: 25 }],
    })
    expect(result.meanNetworkMs).toBeCloseTo(25, 5)
  })
})

describe('J11 circuit breaker', () => {
  it('opens on window error rate and counts breaker rejections separately', () => {
    const topology = {
      components: [
        generator('clients'),
        worker('dep', { servers: 8, serviceMs: 2, queue: 'unbounded', failProb: 1 }),
      ],
      edges: [
        edge('e1', 'clients', 'dep', {
          breaker: {
            errorThreshold: 0.5,
            windowMs: 10_000,
            openMs: 500,
            probes: 1,
            minRequests: 4,
          },
        }),
      ],
    }
    const result = runDiscrete(topology, workloadAt(40, { durationSec: 1.5, seed: 13 }))
    expect(result.events.some((event) => event.type === 'breaker-change' && event.to === 'open')).toBe(
      true,
    )
    expect(result.counts.breakerRejected).toBeGreaterThan(0)
  })
})

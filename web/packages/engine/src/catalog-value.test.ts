import { describe, expect, it } from 'vitest'
import { applyCatalogCeilings, usableAsCeiling } from './catalog-value.ts'
import { chainTopology, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'
import type { CatalogValue, ComponentBehavior } from './types.ts'

const sourcedHard: CatalogValue = {
  value: 50,
  unit: 'rps',
  scope: 'service',
  limitType: 'hard_limit',
  conditions: {},
  sourceUrl: 'https://docs.aws.amazon.com/example',
  retrievedOn: '2026-10-20',
  status: 'documented',
  caps: 'throughputRps',
}

function behavior(): ComponentBehavior {
  return chainTopology().components[1]!.behavior
}

describe('F26 catalog ceilings', () => {
  it('allows only sourced hard_limit and adjustable_quota to cap', () => {
    expect(usableAsCeiling(sourcedHard)).toBe(true)
    expect(
      usableAsCeiling({ ...sourcedHard, limitType: 'best_effort_target' }),
    ).toBe(false)
    expect(
      usableAsCeiling({ ...sourcedHard, limitType: 'performance_guidance' }),
    ).toBe(false)
    expect(usableAsCeiling({ ...sourcedHard, status: 'estimated' })).toBe(false)
    expect(usableAsCeiling({ ...sourcedHard, status: 'unknown' })).toBe(false)
    expect(usableAsCeiling({ ...sourcedHard, sourceUrl: '' })).toBe(false)
    expect(usableAsCeiling({ ...sourcedHard, value: undefined })).toBe(false)
  })

  it('does not infer a servers cap from unit count when caps is omitted', () => {
    const open = applyCatalogCeilings(behavior(), [
      { ...sourcedHard, value: 4, unit: 'count', caps: undefined },
    ])
    expect(open.servers).toEqual(behavior().servers)
  })

  it('applies a documented hard rps ceiling and ignores guidance', () => {
    const capped = applyCatalogCeilings(behavior(), [sourcedHard])
    expect(capped.throughputLimitRps).toMatchObject({
      state: 'set',
      value: 50,
      confidence: 'vendor',
    })
    const ignored = applyCatalogCeilings(behavior(), [
      { ...sourcedHard, limitType: 'performance_guidance' },
    ])
    expect(ignored.throughputLimitRps).toMatchObject({
      state: 'set',
      value: Number.POSITIVE_INFINITY,
    })
    const unknownServers = applyCatalogCeilings(
      { ...behavior(), servers: { state: 'unknown' } },
      [{ ...sourcedHard, value: 4, unit: 'count', caps: 'servers' }],
    )
    expect(unknownServers.servers).toEqual({ state: 'unknown' })
  })

  it('caps fluid completed at a sourced hard_limit and does not cap on guidance', () => {
    const topology = chainTopology()
    const pool = topology.components.find((item) => item.id === 'pool')
    if (!pool) throw new Error('missing pool')
    pool.behavior = applyCatalogCeilings(pool.behavior, [sourcedHard])
    const capped = runFluid(topology, workloadAt(200, { durationSec: 2 }))
    const last = capped.steps.at(-1)
    if (!last) throw new Error('no steps')
    expect(last.components.pool.read.completed).toBeCloseTo(50, 5)

    const open = chainTopology()
    const other = open.components.find((item) => item.id === 'pool')
    if (!other) throw new Error('missing pool')
    other.behavior = applyCatalogCeilings(other.behavior, [
      { ...sourcedHard, limitType: 'best_effort_target' },
    ])
    const free = runFluid(open, workloadAt(200, { durationSec: 2 }))
    const freeLast = free.steps.at(-1)
    if (!freeLast) throw new Error('no steps')
    expect(freeLast.components.pool.read.completed).toBeGreaterThan(100)
  })
})

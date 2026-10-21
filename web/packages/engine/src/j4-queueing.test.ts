import { describe, expect, it } from 'vitest'
import { runDiscrete } from './discrete.ts'
import { mmcTopology, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'
import { erlangCWaitMs } from './queueing.ts'

describe('J4 M/M/c', () => {
  it('matches the worked formula: 16 servers, 100 ms, 150 /s → 93.75% util, wait ~73 ms', () => {
    const wait = erlangCWaitMs(150, 10, 16)
    expect(150 / (16 * 10)).toBeCloseTo(0.9375, 10)
    expect(wait).toBeCloseTo(73, 0)
  })

  it('gives fluid utilization λ/(cμ) exactly', () => {
    const result = runFluid(mmcTopology(), workloadAt(150, { durationSec: 2 }))
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const mu = 16 / 0.1
    expect(last.components.pool.read?.completed).toBeCloseTo(150, 9)
    expect(150 / mu).toBeCloseTo(0.9375, 10)
    expect(last.components.pool.read?.rejected).toBeCloseTo(0, 9)
  })

  it('gives discrete-event utilization near λ/(cμ); wait stays on the Erlang C scale', () => {
    const expected = erlangCWaitMs(150, 10, 16)
    const durationSec = 20
    const result = runDiscrete(
      mmcTopology(),
      workloadAt(150, { durationSec, seed: 4821 }),
    )
    const rhoHat = result.counts.completed / (durationSec * 16 * 10)
    expect(result.counts.completed).toBeGreaterThan(1000)
    expect(rhoHat).toBeCloseTo(0.9375, 1)
    expect(result.meanWaitMs).toBeGreaterThan(expected * 0.4)
    expect(result.meanWaitMs).toBeLessThan(expected * 2.5)
  })
})

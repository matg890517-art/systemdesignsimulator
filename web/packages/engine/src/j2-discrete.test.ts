import { describe, expect, it } from 'vitest'
import { requestConservationHolds } from './conservation.ts'
import { runDiscrete } from './discrete.ts'
import { chainTopology, mmcTopology, referenceStack, workloadAt } from './fixtures.ts'
import { replayDiscreteLog } from './discrete.ts'

describe('J2 request conservation, discrete-event', () => {
  it('holds created = completed + rejected + dropped + expired + in flight', () => {
    expect(
      requestConservationHolds({
        created: 20,
        completed: 11,
        rejected: 3,
        dropped: 2,
        expired: 1,
        inFlight: 3,
      }),
    ).toBe(true)
  })

  it('holds at the end of a chain run', () => {
    const result = runDiscrete(chainTopology(), workloadAt(80, { durationSec: 1, seed: 4821 }))
    expect(requestConservationHolds(result.counts)).toBe(true)
    expect(result.counts.created).toBeGreaterThan(0)
  })

  it('holds on the generic reference stack', () => {
    const result = runDiscrete(
      referenceStack(),
      workloadAt(40, { durationSec: 0.8, seed: 4821 }),
    )
    expect(requestConservationHolds(result.counts)).toBe(true)
  })
})

describe('J3 deterministic replay, discrete-event', () => {
  it('produces a byte-identical event log for the same topology, workload and seed', () => {
    const topology = mmcTopology()
    const workload = workloadAt(50, { durationSec: 0.4, seed: 4821 })
    const a = replayDiscreteLog(runDiscrete(topology, workload))
    const b = replayDiscreteLog(runDiscrete(topology, workload))
    expect(a).toBe(b)
  })
})

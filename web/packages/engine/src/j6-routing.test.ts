import { describe, expect, it } from 'vitest'
import { attemptsPerRequest, offeredRate } from './routing.ts'
import { conservationHolds } from './conservation.ts'

describe('J6 routing examples', () => {
  it('splits 800 rps by weights 1 and 3 into 200 and 600', () => {
    const group = [1, 3]
    expect(offeredRate({ mode: 'weighted', weight: 1 }, 1, 800, group)).toBe(200)
    expect(offeredRate({ mode: 'weighted', weight: 3 }, 1, 800, group)).toBe(600)
  })

  it('broadcasts 150 events to every edge', () => {
    expect(offeredRate({ mode: 'broadcast' }, 1, 150)).toBe(150)
    expect(offeredRate({ mode: 'broadcast' }, 1, 150)).toBe(150)
  })

  it('fans out m=2 at 200 rps into 400 calls', () => {
    expect(offeredRate({ mode: 'single' }, 2, 200)).toBe(400)
  })

  it('computes 1.11 attempts per request for f=0.1 and 2 retries', () => {
    expect(attemptsPerRequest(0.1, 2)).toBeCloseTo(1.11, 10)
  })

  it('keeps conservation true on the worked identity', () => {
    expect(
      conservationHolds({
        offered: 200,
        admitted: 160,
        rejected: 40,
        networkDrop: 0,
      }),
    ).toBe(true)
  })
})

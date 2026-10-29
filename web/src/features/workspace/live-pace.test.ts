import { describe, expect, it } from 'vitest'
import { liveDelayMs, liveHoldMs } from './live-pace.ts'

describe('live pacing', () => {
  it('waits so 1 s of sim is 1 s of wall at 1×', () => {
    expect(liveDelayMs(0, 0, 1, 0)).toBe(0)
    expect(liveDelayMs(0, 0.5, 1, 0)).toBe(500)
    expect(liveDelayMs(0, 0.5, 1, 120)).toBe(380)
    expect(liveDelayMs(0, 0.5, 1, 600)).toBe(-100)
  })

  it('skips the wait when pace is off', () => {
    expect(liveDelayMs(0, 2, 0, 0)).toBe(0)
    expect(liveDelayMs(0, 2, -1, 0)).toBe(0)
  })

  it('holds Stop until Duration has elapsed at 1×', () => {
    expect(liveHoldMs(0, 3, 1, 400)).toBe(2600)
    expect(liveHoldMs(0, 3, 1, 3000)).toBe(0)
    expect(liveHoldMs(0, 3, 0, 0)).toBe(0)
  })
})

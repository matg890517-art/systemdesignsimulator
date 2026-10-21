import type { Distribution, Value } from './types.ts'

export function unwrap<T>(value: Value<T>, fallback?: T): T {
  if (value.state === 'set') return value.value
  if (fallback !== undefined) return fallback
  throw new Error('engine value is unknown or not applicable')
}

export function setValue<T>(
  value: T,
  confidence: 'measured' | 'vendor' | 'estimated' = 'estimated',
): Value<T> {
  return { state: 'set', value, confidence }
}

export function meanMs(distribution: Distribution): number {
  switch (distribution.kind) {
    case 'constant':
      return distribution.ms
    case 'exponential':
      return distribution.meanMs
    case 'lognormal':
      return distribution.medianMs * Math.exp((distribution.sigma * distribution.sigma) / 2)
  }
}

export function sampleDistribution(distribution: Distribution, rng: () => number): number {
  switch (distribution.kind) {
    case 'constant':
      return distribution.ms
    case 'exponential': {
      if (distribution.meanMs <= 0) return 0
      return -distribution.meanMs * Math.log(1 - rng())
    }
    case 'lognormal': {
      const u1 = Math.max(rng(), Number.EPSILON)
      const u2 = rng()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      return Math.exp(Math.log(distribution.medianMs) + distribution.sigma * z)
    }
  }
}

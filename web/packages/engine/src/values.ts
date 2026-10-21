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

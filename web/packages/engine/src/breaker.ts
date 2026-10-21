import type { Edge } from './types.ts'

/**
 * Documented circuit-breaker defaults (decision 10).
 * Opens on window error rate with a minimum request count, then a fixed probe count.
 */
export const documentedBreaker: NonNullable<Edge['breaker']> = {
  errorThreshold: 0.5,
  windowMs: 10_000,
  openMs: 500,
  probes: 1,
  minRequests: 4,
}

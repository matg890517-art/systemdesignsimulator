import type { Routing } from './types.ts'

/**
 * Offered rate on an edge from a source that admits `admitted` of a class.
 * Weighted weights are normalized across the sibling group, so they need not sum to 1.
 */
export function offeredRate(
  routing: Routing,
  fanOut: number,
  admitted: number,
  group: number[] = [],
): number {
  switch (routing.mode) {
    case 'single':
    case 'broadcast':
      return fanOut * admitted
    case 'weighted': {
      const weights = group.length ? group : [routing.weight]
      const sum = weights.reduce((a, b) => a + b, 0)
      return (routing.weight / sum) * fanOut * admitted
    }
    case 'conditional':
      return fanOut * admitted
  }
}

/** Attempts per request: sum of f^i for i = 0..r. */
export function attemptsPerRequest(f: number, r: number): number {
  if (f === 1) return r + 1
  return (1 - Math.pow(f, r + 1)) / (1 - f)
}

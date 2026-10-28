/** Generalized harmonic H(n, s) = sum_{i=1..n} i^{-s}. */
export function zipfHarmonic(n: number, s: number): number {
  if (n <= 0) return 0
  let h = 0
  const last = Math.floor(n)
  for (let i = 1; i <= last; i++) h += Math.pow(i, -s)
  return h
}

/**
 * Ideal Zipf hit ratio h = H(C, s) / H(N, s).
 * Static popularity, ideal policy (top C keys cached).
 */
export function zipfHitRatio(cacheSize: number, workingSet: number, zipfS: number): number {
  if (cacheSize <= 0 || workingSet <= 0) return 0
  if (cacheSize >= workingSet) return 1
  const denom = zipfHarmonic(workingSet, zipfS)
  if (denom <= 0) return 0
  return zipfHarmonic(cacheSize, zipfS) / denom
}

/** Precomputed CDF for Zipf ranks 1..N. p(i) ∝ i^{-s}. */
export function zipfCdf(n: number, s: number): Float64Array {
  const cdf = new Float64Array(n)
  const h = zipfHarmonic(n, s)
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += Math.pow(i + 1, -s) / h
    cdf[i] = acc
  }
  if (n) cdf[n - 1] = 1
  return cdf
}

export function zipfSample(cdf: Float64Array, u: number): number {
  let lo = 0
  let hi = cdf.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if ((cdf[mid] ?? 1) < u) lo = mid + 1
    else hi = mid
  }
  return lo + 1
}

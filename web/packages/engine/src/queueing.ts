/** Erlang C: probability an arrival waits. a = λ/μ, c servers. */
export function erlangC(c: number, a: number): number {
  if (c <= 0) return 1
  if (a >= c) return 1
  let sum = 1
  let term = 1
  for (let k = 1; k < c; k++) {
    term *= a / k
    sum += term
  }
  const last = term * (a / c)
  const rho = a / c
  return last / (last + (1 - rho) * sum)
}

/** Mean queue wait in milliseconds. μ is per-server service rate (1/s). */
export function erlangCWaitMs(lambda: number, mu: number, servers: number): number {
  if (lambda <= 0 || mu <= 0 || servers <= 0) return 0
  const a = lambda / mu
  if (a >= servers) return Number.POSITIVE_INFINITY
  const c = erlangC(servers, a)
  const waitSec = c / (servers * mu - lambda)
  return waitSec * 1000
}

/**
 * M/M/c P(Wq > t) = C(c,a) exp(-(cμ−λ)t).
 * Returns wait quantile in milliseconds. Infinite when unstable.
 */
export function mmcWaitQuantileMs(
  p: number,
  lambda: number,
  mu: number,
  servers: number,
): number {
  if (lambda <= 0 || mu <= 0 || servers <= 0) return 0
  const a = lambda / mu
  if (a >= servers) return Number.POSITIVE_INFINITY
  const cProb = erlangC(servers, a)
  if (cProb <= 0) return 0
  const tail = 1 - p
  if (tail >= cProb) return 0
  const rate = servers * mu - lambda
  return (-Math.log(tail / cProb) / rate) * 1000
}

/** Allen-Cunneen G/G/c wait: M/M/c wait × (Ca² + Cs²) / 2. */
export function allenCunneenWaitMs(
  lambda: number,
  mu: number,
  servers: number,
  arrivalScv: number,
  serviceScv: number,
): number {
  const mmc = erlangCWaitMs(lambda, mu, servers)
  if (!Number.isFinite(mmc)) return mmc
  return mmc * ((arrivalScv + serviceScv) / 2)
}

export function utilizationRho(lambda: number, mu: number, servers: number): number {
  if (servers <= 0 || mu <= 0) return Number.POSITIVE_INFINITY
  return lambda / (servers * mu)
}

export type StabilityStatus = 'stable' | 'saturating' | 'unstable'

export function statusFromRho(rho: number, utilCeiling = 0.7): StabilityStatus {
  if (!Number.isFinite(rho) || rho >= 1) return 'unstable'
  if (rho >= utilCeiling) return 'saturating'
  return 'stable'
}

/** Little’s law: L ≈ λ W (W in seconds). Infinite wait and infinite L agree. */
export function littlesLawHolds(
  lambda: number,
  waitSec: number,
  queueLength: number,
  eps = 1e-6,
): boolean {
  if (!Number.isFinite(waitSec) || !Number.isFinite(queueLength)) {
    return !Number.isFinite(waitSec) && !Number.isFinite(queueLength)
  }
  return Math.abs(queueLength - lambda * waitSec) <= eps * Math.max(1, Math.abs(lambda * waitSec))
}

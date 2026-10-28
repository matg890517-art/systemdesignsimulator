import { RHO_CRITICAL, RHO_WARNING } from '../schema/version.ts'
import type { NodeStatus } from '../schema/result.ts'

/** Erlang C: P(wait > 0). a = λ/μ, c servers. */
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
  const cProb = erlangC(servers, a)
  const waitSec = cProb / (servers * mu - lambda)
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

/** M/D/1 wait: ρ S / (2 (1 − ρ)). Returns milliseconds. */
export function md1WaitMs(lambda: number, serviceMs: number): number {
  if (lambda <= 0 || serviceMs <= 0) return 0
  const mu = 1000 / serviceMs
  const rho = lambda / mu
  if (rho >= 1) return Number.POSITIVE_INFINITY
  return (rho * serviceMs) / (2 * (1 - rho))
}

/** M/M/1/K blocking probability. */
export function mm1kBlocking(rho: number, k: number): number {
  if (k < 0) return 1
  if (rho === 1) return 1 / (k + 1)
  const rK = Math.pow(rho, k)
  return ((1 - rho) * rK) / (1 - rho * rK)
}

/** M/M/c/K blocking probability Pb = P_K. */
export function mmckBlocking(lambda: number, mu: number, servers: number, k: number): number {
  if (k < servers) return 1
  if (lambda <= 0 || mu <= 0 || servers <= 0) return 0
  const a = lambda / mu
  const rho = a / servers
  let sum = 1
  let term = 1
  for (let n = 1; n < servers; n++) {
    term *= a / n
    sum += term
  }
  const ac = term * (a / servers)
  let tail: number
  if (Math.abs(rho - 1) < 1e-12) {
    tail = ac * (k - servers + 1)
  } else {
    tail = ac * (1 - Math.pow(rho, k - servers + 1)) / (1 - rho)
  }
  const p0 = 1 / (sum + tail)
  let pK: number
  if (k === servers) pK = p0 * ac
  else {
    pK = p0 * ac * Math.pow(rho, k - servers)
  }
  return pK
}

/** Whitt QNA departure SCV. Approximate. */
export function qnaDepartureScv(
  rho: number,
  arrivalScv: number,
  serviceScv: number,
  servers: number,
): number {
  if (!Number.isFinite(rho) || rho >= 1) return serviceScv
  const c = Math.max(1, servers)
  return 1 + (1 - rho * rho) * (arrivalScv - 1) + (rho * rho * (serviceScv - 1)) / Math.sqrt(c)
}

export function rhoBand(
  rho: number,
  warning = RHO_WARNING,
  critical = RHO_CRITICAL,
): NodeStatus {
  if (!Number.isFinite(rho) || rho >= 1) return 'unstable'
  if (rho >= critical) return 'critical'
  if (rho >= warning) return 'warning'
  return 'healthy'
}

export type StabilityStatus = 'stable' | 'saturating' | 'unstable'

export function statusFromRho(rho: number, utilCeiling = RHO_WARNING): StabilityStatus {
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

export function scvFromDist(dist: {
  dist: string
  mean_ms?: number
  p50_ms?: number
  p95_ms?: number
  scv?: number
}): number {
  if (dist.scv !== undefined) return dist.scv
  if (dist.dist === 'exp') return 1
  if (dist.dist === 'det') return 0
  if (dist.dist === 'lognormal' && dist.p50_ms && dist.p95_ms && dist.p95_ms > 0 && dist.p50_ms > 0) {
    const sigma = Math.log(dist.p95_ms / dist.p50_ms) / 1.6448536269514722
    return Math.exp(sigma * sigma) - 1
  }
  return 1
}

export function meanMsFromDist(dist: {
  dist: string
  mean_ms?: number
  p50_ms?: number
  p95_ms?: number
  empiricalMs?: number[]
}): number | undefined {
  if (dist.mean_ms !== undefined && dist.mean_ms > 0) return dist.mean_ms
  if (dist.dist === 'lognormal' && dist.p50_ms && dist.p95_ms && dist.p50_ms > 0 && dist.p95_ms >= dist.p50_ms) {
    const sigma = Math.log(dist.p95_ms / dist.p50_ms) / 1.6448536269514722
    return dist.p50_ms * Math.exp((sigma * sigma) / 2)
  }
  if (dist.empiricalMs && dist.empiricalMs.length) {
    const sum = dist.empiricalMs.reduce((a, b) => a + b, 0)
    return sum / dist.empiricalMs.length
  }
  return undefined
}

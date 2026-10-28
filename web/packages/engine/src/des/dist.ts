import { zipfCdf, zipfSample } from '../analytic/zipf.ts'
import { meanMsFromDist, scvFromDist } from '../analytic/queue.ts'
import type { ServiceDist } from '../schema/scenario.ts'
import type { NodeResult } from '../schema/result.ts'
import type { EngineRng } from './rng.ts'

export function lognormalFit(p50_ms: number, p95_ms: number): {
  sigma: number
  mu_ln: number
  mean: number
  cs2: number
} {
  const sigma = Math.log(p95_ms / p50_ms) / 1.6448536269514722
  const mu_ln = Math.log(p50_ms)
  const mean = Math.exp(mu_ln + (sigma * sigma) / 2)
  const cs2 = Math.exp(sigma * sigma) - 1
  return { sigma, mu_ln, mean, cs2 }
}

export function sampleExponential(rng: EngineRng, mean: number): number {
  if (mean <= 0) return 0
  const u = Math.max(rng.next(), Number.EPSILON)
  return -mean * Math.log(1 - u)
}

export function sampleNormal01(rng: EngineRng): number {
  if (rng.hasSpare) {
    rng.hasSpare = false
    return rng.spare
  }
  const u1 = Math.max(rng.next(), Number.EPSILON)
  const u2 = rng.next()
  const mag = Math.sqrt(-2 * Math.log(u1))
  const z0 = mag * Math.cos(2 * Math.PI * u2)
  rng.spare = mag * Math.sin(2 * Math.PI * u2)
  rng.hasSpare = true
  return z0
}

export function sampleLognormal(rng: EngineRng, median: number, sigma: number): number {
  return Math.exp(Math.log(median) + sigma * sampleNormal01(rng))
}

/** Marsaglia-Tsang for shape >= 1; boost for shape < 1. */
export function sampleGamma(rng: EngineRng, shape: number, mean: number): number {
  if (shape <= 0 || mean <= 0) return 0
  const theta = mean / shape
  if (shape < 1) {
    const u = Math.max(rng.next(), Number.EPSILON)
    return sampleGamma(rng, shape + 1, (shape + 1) * theta) * Math.pow(u, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      x = sampleNormal01(rng)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = rng.next()
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v * theta
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * theta
  }
}

export function sampleEmpirical(rng: EngineRng, samples: number[]): number {
  if (!samples.length) return 0
  const u = rng.next()
  const i = Math.min(samples.length - 1, Math.floor(u * samples.length))
  const sorted = samples.slice().sort((a, b) => a - b)
  return sorted[i] ?? 0
}

export function sampleServiceMs(rng: EngineRng, dist: ServiceDist): number {
  const mean = meanMsFromDist(dist) ?? 0
  switch (dist.dist) {
    case 'det':
      return mean
    case 'exp':
      return sampleExponential(rng, mean)
    case 'lognormal': {
      const p50 = dist.p50_ms ?? mean
      const sigma =
        dist.p95_ms && dist.p50_ms
          ? Math.log(dist.p95_ms / dist.p50_ms) / 1.6448536269514722
          : Math.sqrt(Math.log(1 + scvFromDist(dist)))
      return sampleLognormal(rng, p50, sigma)
    }
    case 'gamma':
      return sampleGamma(rng, dist.shape ?? 1, mean)
    case 'empirical':
      return sampleEmpirical(rng, dist.empiricalMs ?? [])
  }
}

/** M/M/c wait mixture: with probability C wait is exponential with mean Wq/C, else 0. */
export function sampleWaitMixture(rng: EngineRng, row: NodeResult): number {
  if (!Number.isFinite(row.Wq_ms) || row.Wq_ms <= 0 || row.rho <= 0) return 0
  if (row.rho >= 1) return Number.POSITIVE_INFINITY
  const cmu = row.lambda / row.rho
  const cProb = Math.min(1, (row.Wq_ms / 1000) * cmu * (1 - row.rho))
  if (rng.next() >= cProb) return 0
  return sampleExponential(rng, row.Wq_ms / Math.max(cProb, 1e-12))
}

export function sampleZipfKey(
  rng: EngineRng,
  cdf: Float64Array,
): number {
  return zipfSample(cdf, rng.next())
}

export { zipfCdf }

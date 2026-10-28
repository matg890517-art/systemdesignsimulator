import {
  allenCunneenWaitMs,
  meanMsFromDist,
  mmckBlocking,
  mmcWaitQuantileMs,
  qnaDepartureScv,
  rhoBand,
  scvFromDist,
  utilizationRho,
} from './queue.ts'
import { serverCount, type ScenarioNode } from '../schema/scenario.ts'
import type { NodeResult } from '../schema/result.ts'
import { RHO_CRITICAL, RHO_WARNING } from '../schema/version.ts'

export type NodeSolve = {
  result: NodeResult
  mu: number
  servers: number
  arrivalScv: number
  serviceScv: number
  departureScv: number
}

export function solveNode(
  node: ScenarioNode,
  lambda: number,
  arrivalScv: number,
  wired: boolean,
  ceiling = RHO_WARNING,
): NodeSolve {
  if (!wired) {
    return {
      result: emptyNode('not_wired', lambda),
      mu: 0,
      servers: 0,
      arrivalScv,
      serviceScv: 1,
      departureScv: 1,
    }
  }
  if (node.kind === 'client') {
    return {
      result: {
        lambda,
        rho: 0,
        status: 'healthy',
        Wq_ms: 0,
        W_ms: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        L: 0,
        Lq: 0,
        throughput: lambda,
        dropRate: 0,
        timeoutRate: 0,
        waitUnknown: false,
      },
      mu: Number.POSITIVE_INFINITY,
      servers: 0,
      arrivalScv,
      serviceScv: 0,
      departureScv: arrivalScv,
    }
  }
  if (node.kind === 'external') {
    const s = meanMsFromDist(node.service) ?? 0
    return {
      result: {
        lambda,
        rho: 0,
        status: 'healthy',
        Wq_ms: 0,
        W_ms: s,
        p50: s,
        p95: s,
        p99: s,
        L: lambda * (s / 1000),
        Lq: 0,
        throughput: lambda,
        dropRate: 0,
        timeoutRate: 0,
        waitUnknown: s <= 0 && node.service.mean_ms === undefined && !node.service.p50_ms,
      },
      mu: s > 0 ? 1000 / s : Number.POSITIVE_INFINITY,
      servers: 0,
      arrivalScv,
      serviceScv: scvFromDist(node.service),
      departureScv: arrivalScv,
    }
  }

  const serviceMs = meanMsFromDist(node.service)
  const servers = Math.max(1, serverCount(node))
  if (serviceMs === undefined || serviceMs <= 0) {
    return {
      result: {
        ...emptyNode('unknown', lambda),
        waitUnknown: true,
        throughput: lambda,
      },
      mu: 0,
      servers,
      arrivalScv,
      serviceScv: 1,
      departureScv: arrivalScv,
    }
  }

  const mu = 1000 / serviceMs
  const cs2 = scvFromDist(node.service)
  let offered = lambda
  if (node.kind === 'load_balancer' && node.lb) {
    offered = lambda * (1 + node.lb.imbalance)
  }
  const rho = utilizationRho(offered, mu, servers)
  const K = node.buffer.K
  let dropRate = 0
  let throughput = lambda
  let waitMs: number
  if (K !== null) {
    const pb = mmckBlocking(offered, mu, servers, K)
    dropRate = lambda * pb
    throughput = lambda * (1 - pb)
    waitMs = allenCunneenWaitMs(throughput, mu, servers, arrivalScv, cs2)
    if (!Number.isFinite(waitMs)) waitMs = 0
  } else if (rho >= 1) {
    waitMs = Number.POSITIVE_INFINITY
    throughput = servers * mu
    dropRate = 0
  } else {
    waitMs = allenCunneenWaitMs(offered, mu, servers, arrivalScv, cs2)
    throughput = lambda
  }

  const sojourn = Number.isFinite(waitMs) ? waitMs + serviceMs : waitMs
  const p50 = mmcWaitQuantileMs(0.5, Math.min(offered, servers * mu * 0.999999), mu, servers)
  const p95 = mmcWaitQuantileMs(0.95, Math.min(offered, servers * mu * 0.999999), mu, servers)
  const p99 = mmcWaitQuantileMs(0.99, Math.min(offered, servers * mu * 0.999999), mu, servers)
  const waitSec = Number.isFinite(waitMs) ? waitMs / 1000 : Number.POSITIVE_INFINITY
  const sojournSec = Number.isFinite(sojourn) ? sojourn / 1000 : Number.POSITIVE_INFINITY
  const Lq = Number.isFinite(waitSec) ? throughput * waitSec : Number.POSITIVE_INFINITY
  const L = Number.isFinite(sojournSec) ? throughput * sojournSec : Number.POSITIVE_INFINITY

  let timeoutRate = 0
  if (node.timeout_ms !== undefined && Number.isFinite(waitMs)) {
    const cProb = waitMs > 0 ? Math.min(1, waitMs / Math.max(waitMs, 1)) : 0
    const rate = Math.max(1e-12, (servers * mu - Math.min(offered, servers * mu * 0.999)) )
    const pWait = Math.min(1, cProb)
    timeoutRate = lambda * pWait * Math.exp(-rate * (node.timeout_ms / 1000))
  }

  const band = rhoBand(rho, ceiling, RHO_CRITICAL)
  const status = band
  const departureScv = qnaDepartureScv(Math.min(rho, 0.999), arrivalScv, cs2, servers)

  return {
    result: {
      lambda,
      rho,
      status,
      Wq_ms: waitMs,
      W_ms: sojourn,
      p50: Number.isFinite(p50) ? p50 : Number.POSITIVE_INFINITY,
      p95: Number.isFinite(p95) ? p95 : Number.POSITIVE_INFINITY,
      p99: Number.isFinite(p99) ? p99 : Number.POSITIVE_INFINITY,
      L,
      Lq,
      throughput,
      dropRate,
      timeoutRate,
      waitUnknown: false,
    },
    mu,
    servers,
    arrivalScv,
    serviceScv: cs2,
    departureScv,
  }
}

function emptyNode(status: NodeResult['status'], lambda: number): NodeResult {
  return {
    lambda,
    rho: 0,
    status,
    Wq_ms: Number.NaN,
    W_ms: Number.NaN,
    p50: Number.NaN,
    p95: Number.NaN,
    p99: Number.NaN,
    L: Number.NaN,
    Lq: Number.NaN,
    throughput: 0,
    dropRate: 0,
    timeoutRate: 0,
    waitUnknown: true,
  }
}

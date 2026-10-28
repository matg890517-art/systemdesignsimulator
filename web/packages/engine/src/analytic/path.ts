import { createStreamRng } from '../des/rng.ts'
import { sampleWaitMixture, sampleServiceMs } from '../des/dist.ts'
import { PATH_DRAWS } from '../schema/version.ts'
import type { CompiledModel } from '../compile/compile.ts'
import type { NodeResult } from '../schema/result.ts'
import type { CallKind } from '../schema/scenario.ts'

export type Percentiles = { mean: number; p50: number; p95: number; p99: number }

function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))))
  return sorted[i] ?? 0
}

type Hop = { nodeId: string; edgeId: string; kind: CallKind; parallel: boolean; latencyMean: number }

function syncHops(compiled: CompiledModel, classId: string): Hop[] {
  const hops: Hop[] = []
  for (const edge of compiled.edges) {
    const spec = edge.perClass[classId]
    if (!spec) continue
    hops.push({
      nodeId: edge.to,
      edgeId: edge.id,
      kind: spec.kind,
      parallel: spec.parallel,
      latencyMean: spec.latency.mean_ms,
    })
  }
  return hops
}

/**
 * Seeded path sampler. Sequential hops add; parallel hops take max.
 * Independence is an assumption and is labeled Analytic.
 */
export function samplePathLatency(
  compiled: CompiledModel,
  classId: string,
  nodes: Record<string, NodeResult>,
  seed: number,
  draws = PATH_DRAWS,
): { sync: Percentiles; async?: Percentiles } {
  const hops = syncHops(compiled, classId)
  const rng = createStreamRng(seed, `path:${classId}`, 'path')
  const syncSamples: number[] = []
  const asyncSamples: number[] = []
  for (let d = 0; d < draws; d++) {
    let sequential = 0
    let parallelMax = 0
    let asyncSum = 0
    let sawAsync = false
    for (const hop of hops) {
      const row = nodes[hop.nodeId]
      const wait = row && !row.waitUnknown && Number.isFinite(row.Wq_ms) ? sampleWaitMixture(rng, row) : 0
      const node = compiled.nodes.find((item) => item.id === hop.nodeId)
      const service = node ? sampleServiceMs(rng, node.service) : 0
      const edge = hop.latencyMean
      const add = wait + service + edge
      if (hop.kind === 'async') {
        asyncSum += add
        sawAsync = true
        continue
      }
      if (hop.parallel) parallelMax = Math.max(parallelMax, add)
      else sequential += add
    }
    syncSamples.push(sequential + parallelMax)
    if (sawAsync) asyncSamples.push(asyncSum)
  }
  syncSamples.sort((a, b) => a - b)
  const mean = syncSamples.reduce((s, x) => s + x, 0) / Math.max(1, syncSamples.length)
  const sync: Percentiles = {
    mean,
    p50: quantile(syncSamples, 0.5),
    p95: quantile(syncSamples, 0.95),
    p99: quantile(syncSamples, 0.99),
  }
  if (!asyncSamples.length) return { sync }
  asyncSamples.sort((a, b) => a - b)
  const aMean = asyncSamples.reduce((s, x) => s + x, 0) / asyncSamples.length
  return {
    sync,
    async: {
      mean: aMean,
      p50: quantile(asyncSamples, 0.5),
      p95: quantile(asyncSamples, 0.95),
      p99: quantile(asyncSamples, 0.99),
    },
  }
}

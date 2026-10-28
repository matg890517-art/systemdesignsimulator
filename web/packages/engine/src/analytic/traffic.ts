import { solveLinear } from './gauss.ts'
import { routingMatrixForClass } from '../compile/compile.ts'
import type { CompiledModel } from '../compile/compile.ts'

export function gammaForClass(compiled: CompiledModel, classId: string): number[] {
  const n = compiled.nodes.length
  const gamma = new Array<number>(n).fill(0)
  for (const row of compiled.scenario.workload) {
    if (row.classId !== classId) continue
    const i = compiled.index.get(row.clientId)
    if (i === undefined) continue
    gamma[i] = (gamma[i] ?? 0) + row.rate_rps
  }
  return gamma
}

/** Jackson: lambda = gamma + P^T lambda. Nodes stay in array order. */
export function solveClassLambda(compiled: CompiledModel, classId: string): number[] | null {
  const n = compiled.nodes.length
  const P = routingMatrixForClass(compiled, classId)
  const gamma = gammaForClass(compiled, classId)
  const A = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - (P[j]?.[i] ?? 0)),
  )
  const exact = solveLinear(A, gamma)
  if (exact) return exact
  let lambda = gamma.slice()
  for (let iter = 0; iter < 64; iter++) {
    const next = gamma.slice()
    for (let i = 0; i < n; i++) {
      let incoming = 0
      for (let j = 0; j < n; j++) incoming += (P[j]?.[i] ?? 0) * (lambda[j] ?? 0)
      next[i] = (gamma[i] ?? 0) + incoming
    }
    let delta = 0
    for (let i = 0; i < n; i++) delta = Math.max(delta, Math.abs((next[i] ?? 0) - (lambda[i] ?? 0)))
    lambda = next
    if (delta < 1e-9) return lambda
  }
  return lambda
}

export function classIdsOf(compiled: CompiledModel): string[] {
  const ids = new Set<string>()
  for (const row of compiled.scenario.workload) ids.add(row.classId)
  for (const edge of compiled.edges) {
    for (const id of Object.keys(edge.perClass)) ids.add(id)
  }
  return [...ids]
}

/**
 * After a node is unstable, downstream sees only c*mu (or lambda*(1-Pb)).
 * Iterate a few times so overload does not silently flow through.
 */
export function capUnstableOutputs(
  compiled: CompiledModel,
  lambda: number[],
  throughput: number[],
): number[] {
  const n = compiled.nodes.length
  const classId = classIdsOf(compiled)[0]
  if (!classId) return lambda
  const P = routingMatrixForClass(compiled, classId)
  const gamma = gammaForClass(compiled, classId)
  const next = gamma.slice()
  for (let i = 0; i < n; i++) {
    let incoming = 0
    for (let j = 0; j < n; j++) {
      const out = throughput[j] ?? lambda[j] ?? 0
      incoming += (P[j]?.[i] ?? 0) * out
    }
    next[i] = (gamma[i] ?? 0) + incoming
  }
  return next
}

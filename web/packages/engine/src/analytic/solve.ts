import { compileScenario, type CompiledModel } from '../compile/compile.ts'
import type { Scenario } from '../schema/scenario.ts'
import type { ClassResult, EngineResult, NodeResult } from '../schema/result.ts'
import { systemFromNodes } from '../schema/result.ts'
import { ENGINE_VERSION, SCHEMA_VERSION } from '../schema/version.ts'
import { weakestEvidence } from '../schema/evidence.ts'
import { classIdsOf, solveClassLambda } from './traffic.ts'
import { solveNode } from './node.ts'
import { samplePathLatency } from './path.ts'
import { headroomOf, nPlusOne } from './headroom.ts'

export function solveAnalytic(compiled: CompiledModel): EngineResult {
  const warnings = compiled.warnings.map((w) => w.message)
  if (compiled.invalid) {
    return {
      engineVersion: ENGINE_VERSION,
      schemaVersion: SCHEMA_VERSION,
      seed: compiled.scenario.seed,
      mode: 'analytic',
      evidence: 'estimated',
      warnings,
      nodes: {},
      edges: {},
      classes: {},
      system: { stability: 'unstable', sensitivity: [], nPlusOne: [] },
      invalid: compiled.invalid,
    }
  }

  const ids = classIdsOf(compiled)
  const lambdaTotal = compiled.nodes.map(() => 0)
  const arrivalScv = compiled.nodes.map(() => 1)
  for (const classId of ids) {
    const lambda = solveClassLambda(compiled, classId) ?? compiled.nodes.map(() => 0)
    for (let i = 0; i < lambda.length; i++) lambdaTotal[i] = (lambdaTotal[i] ?? 0) + (lambda[i] ?? 0)
  }

  const nodes: Record<string, NodeResult> = {}
  const evidence = compiled.nodes.map((node) => node.evidence)
  const ceiling = compiled.scenario.targets.utilizationCeiling

  for (let i = 0; i < compiled.nodes.length; i++) {
    const node = compiled.nodes[i]!
    const wired = !compiled.notWired.includes(node.id)
    const solved = solveNode(node, lambdaTotal[i] ?? 0, arrivalScv[i] ?? 1, wired, ceiling)
    nodes[node.id] = solved.result
    if (i + 1 < compiled.nodes.length) arrivalScv[i + 1] = solved.departureScv
  }

  const edges: EngineResult['edges'] = {}
  for (const edge of compiled.edges) {
    const src = nodes[edge.from]
    const flow: Record<string, number> = {}
    for (const classId of Object.keys(edge.perClass)) {
      const hop = edge.perClass[classId]!
      const out = src?.throughput ?? src?.lambda ?? 0
      let p = 1
      if (hop.routing === 'weighted') {
        const sibs = compiled.edges.filter((item) => item.from === edge.from && item.perClass[classId])
        const sum = sibs.reduce((s, item) => s + (item.perClass[classId]?.weight ?? 0), 0)
        p = sum > 0 ? hop.weight / sum : 0
      }
      const miss = compiled.hitRatio.get(edge.from)
      const factor = miss === undefined ? 1 : 1 - miss
      flow[classId] = out * p * hop.calls * factor
    }
    edges[edge.id] = { flow_rps: flow }
  }

  const classes: Record<string, ClassResult> = {}
  for (const classId of ids) {
    const mean = Object.values(nodes).reduce((s, row) => {
      if (row.waitUnknown || !Number.isFinite(row.W_ms)) return s
      return s + row.W_ms
    }, 0)
    const errorRate = Object.values(nodes).reduce((s, row) => s + row.dropRate + row.timeoutRate, 0)
    classes[classId] = {
      pathLatency: { mean, p50: mean, p95: mean, p99: mean },
      errorRate,
    }
  }

  let bottleneck: string | undefined
  let worst = -1
  for (const [id, row] of Object.entries(nodes)) {
    if (row.status === 'not_wired' || row.waitUnknown) continue
    if (row.rho > worst) {
      worst = row.rho
      bottleneck = id
    }
  }

  const result: EngineResult = {
    engineVersion: ENGINE_VERSION,
    schemaVersion: SCHEMA_VERSION,
    seed: compiled.scenario.seed,
    mode: 'analytic',
    evidence: weakestEvidence(...evidence, 'estimated'),
    warnings,
    nodes,
    edges,
    classes,
    system: {
      stability: systemFromNodes(nodes),
      bottleneck,
      sensitivity: [],
      nPlusOne: [],
    },
  }
  return result
}

export function runAnalyticScenario(scenario: Scenario): EngineResult {
  const compiled = compileScenario(scenario)
  const base = solveAnalytic(compiled)
  if (base.invalid) return base
  const room = headroomOf(compiled, solveAnalytic)
  const plus = nPlusOne(compiled, solveAnalytic)
  const sensitivity = compiled.nodes
    .filter((node) => node.kind !== 'client')
    .map((node) => {
      const cut: CompiledModel = {
        ...compiled,
        nodes: compiled.nodes.map((item) =>
          item.id === node.id
            ? {
                ...item,
                servers: {
                  ...item.servers,
                  instances: Math.max(0, item.servers.instances - 1),
                },
              }
            : item,
        ),
      }
      const before = base.classes[compiled.scenario.classes[0]?.id ?? 'read']?.pathLatency.p99 ?? 0
      const after = solveAnalytic(cut).classes[compiled.scenario.classes[0]?.id ?? 'read']?.pathLatency.p99 ?? 0
      return { id: node.id, deltaP99_ms: after - before }
    })
    .sort((a, b) => b.deltaP99_ms - a.deltaP99_ms)
  const classes: Record<string, ClassResult> = { ...base.classes }
  for (const classId of classIdsOf(compiled)) {
    const sampled = samplePathLatency(compiled, classId, base.nodes, compiled.scenario.seed)
    classes[classId] = {
      pathLatency: sampled.sync,
      errorRate: base.classes[classId]?.errorRate ?? 0,
      asyncLatency: sampled.async,
    }
  }
  return {
    ...base,
    classes,
    system: {
      ...base.system,
      headroom_rps: room.headroom_rps,
      firstFailing: room.firstFailing,
      nPlusOne: plus,
      sensitivity,
    },
  }
}


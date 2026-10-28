import { zipfHitRatio } from '../analytic/zipf.ts'
import { spectralRadius } from '../analytic/gauss.ts'
import {
  SCHEMA_VERSION,
  limitMayCap,
  type Scenario,
  type ScenarioEdge,
  type ScenarioNode,
} from '../schema/index.ts'

export type CompileWarning = { code: string; message: string }

export type CompiledModel = {
  scenario: Scenario
  nodes: ScenarioNode[]
  edges: ScenarioEdge[]
  index: Map<string, number>
  notWired: string[]
  hitRatio: Map<string, number>
  warnings: CompileWarning[]
  invalid?: string
}

function carriesClass(edge: ScenarioEdge, classId: string): boolean {
  const hop = edge.perClass[classId]
  if (!hop) return false
  return true
}

function routingMatrix(nodes: ScenarioNode[], edges: ScenarioEdge[], classId: string): number[][] {
  const n = nodes.length
  const index = new Map(nodes.map((node, i) => [node.id, i]))
  const P = Array.from({ length: n }, () => new Array<number>(n).fill(0))
  const byFrom = new Map<string, ScenarioEdge[]>()
  for (const edge of edges) {
    if (!carriesClass(edge, classId)) continue
    const list = byFrom.get(edge.from) ?? []
    list.push(edge)
    byFrom.set(edge.from, list)
  }
  for (const [fromId, group] of byFrom) {
    const j = index.get(fromId)
    if (j === undefined) continue
    const hops = group.map((edge) => ({ edge, hop: edge.perClass[classId]! }))
    const weightSum = hops
      .filter((item) => item.hop.routing === 'weighted')
      .reduce((s, item) => s + item.hop.weight, 0)
    for (const { edge, hop } of hops) {
      const i = index.get(edge.to)
      if (i === undefined) continue
      let p = 0
      if (hop.routing === 'broadcast' || hop.routing === 'single') p = 1
      else if (hop.routing === 'weighted') p = weightSum > 0 ? hop.weight / weightSum : 0
      P[j]![i] = (P[j]![i] ?? 0) + p * hop.calls
    }
  }
  return P
}

export function compileScenario(input: Scenario): CompiledModel {
  const warnings: CompileWarning[] = []
  if (input.schemaVersion !== SCHEMA_VERSION) {
    warnings.push({
      code: 'schema',
      message: `schemaVersion ${input.schemaVersion} (engine expects ${SCHEMA_VERSION})`,
    })
  }
  const seen = new Set<string>()
  const nodes: ScenarioNode[] = []
  for (const node of input.nodes) {
    if (seen.has(node.id)) {
      warnings.push({ code: 'dup-node', message: `duplicate node id ${node.id} dropped` })
      continue
    }
    seen.add(node.id)
    const capped = applyCaps(node, warnings)
    nodes.push(capped)
  }
  const ids = new Set(nodes.map((node) => node.id))
  const edgeKey = new Set<string>()
  const edges: ScenarioEdge[] = []
  for (const edge of input.edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) {
      warnings.push({
        code: 'dangling',
        message: `dropped edge ${edge.id} (${edge.from} → ${edge.to})`,
      })
      continue
    }
    const classes = Object.keys(edge.perClass)
    if (classes.length === 0) {
      warnings.push({ code: 'empty-class', message: `edge ${edge.id} has empty class map (zero flow)` })
    }
    const next: ScenarioEdge = { ...edge, perClass: { ...edge.perClass } }
    for (const classId of classes) {
      const key = `${edge.from}\0${edge.to}\0${classId}`
      if (edgeKey.has(key)) {
        warnings.push({
          code: 'dup-edge',
          message: `parallel ${edge.from}→${edge.to} class ${classId} dropped`,
        })
        delete next.perClass[classId]
        continue
      }
      edgeKey.add(key)
    }
    if (Object.keys(next.perClass).length === 0 && classes.length > 0) continue
    edges.push(next)
  }

  const hasIncoming = new Set<string>()
  const hasOutgoing = new Set<string>()
  for (const edge of edges) {
    hasIncoming.add(edge.to)
    hasOutgoing.add(edge.from)
  }
  const clientIds = new Set(
    input.workload.map((row) => row.clientId).filter((id) => ids.has(id)),
  )
  const notWired = nodes
    .filter((node) => {
      if (node.kind === 'client') return !hasOutgoing.has(node.id) && !clientIds.has(node.id)
      return !hasIncoming.has(node.id) && !hasOutgoing.has(node.id)
    })
    .map((node) => node.id)

  const hitRatio = new Map<string, number>()
  for (const node of nodes) {
    if (node.cache) {
      hitRatio.set(node.id, zipfHitRatio(node.cache.cacheSize, node.cache.workingSet, node.cache.zipfS))
    } else if (node.hitRatio !== undefined) {
      hitRatio.set(node.id, Math.min(1, Math.max(0, node.hitRatio)))
    }
  }

  const classIds = [...new Set(input.workload.map((row) => row.classId))]
  for (const classId of classIds) {
    const P = routingMatrix(nodes, edges, classId)
    applyCacheToP(P, nodes, hitRatio)
    const rho = spectralRadius(P)
    if (rho >= 1 - 1e-9) {
      return {
        scenario: input,
        nodes,
        edges,
        index: new Map(nodes.map((node, i) => [node.id, i])),
        notWired,
        hitRatio,
        warnings,
        invalid: `infinite loop: spectral radius ${rho.toFixed(4)} for class ${classId}`,
      }
    }
  }

  if (nodes.length === 0) {
    return {
      scenario: input,
      nodes,
      edges,
      index: new Map(),
      notWired,
      hitRatio,
      warnings,
      invalid: 'no nodes',
    }
  }

  return {
    scenario: input,
    nodes,
    edges,
    index: new Map(nodes.map((node, i) => [node.id, i])),
    notWired,
    hitRatio,
    warnings,
  }
}

function applyCacheToP(
  P: number[][],
  nodes: ScenarioNode[],
  hitRatio: Map<string, number>,
): void {
  for (let j = 0; j < nodes.length; j++) {
    const node = nodes[j]!
    if (node.kind !== 'cache' && node.kind !== 'cdn') continue
    const h = hitRatio.get(node.id) ?? 0
    const miss = 1 - h
    for (let i = 0; i < nodes.length; i++) P[j]![i] = (P[j]![i] ?? 0) * miss
  }
}

function applyCaps(node: ScenarioNode, warnings: CompileWarning[]): ScenarioNode {
  let instances = node.servers.instances
  let concurrency = node.servers.concurrencyPerInstance
  for (const limit of node.limits) {
    if (!limitMayCap(limit.type)) continue
    if (limit.unit === 'servers' && limit.value < instances) {
      warnings.push({
        code: 'cap-servers',
        message: `${node.id} servers capped to ${limit.value} (${limit.type})`,
      })
      instances = limit.value
    }
    if (limit.unit === 'concurrency' && limit.value < concurrency) {
      concurrency = limit.value
    }
  }
  return {
    ...node,
    servers: { instances, concurrencyPerInstance: concurrency },
  }
}

export function routingMatrixForClass(
  compiled: CompiledModel,
  classId: string,
): number[][] {
  const P = routingMatrix(compiled.nodes, compiled.edges, classId)
  applyCacheToP(P, compiled.nodes, compiled.hitRatio)
  return P
}

import { meanMs } from '../values.ts'
import type { Component, Topology, Workload } from '../types.ts'
import {
  SCHEMA_VERSION,
  defaultRun,
  defaultTargets,
  type NodeKind,
  type Scenario,
  type ScenarioEdge,
  type ScenarioNode,
  type ServiceDist,
} from '../schema/index.ts'
import { evidenceFromConfidence } from '../schema/evidence.ts'

const KIND: Record<string, NodeKind> = {
  traffic_generator: 'client',
  gateway: 'service',
  load_balancer: 'load_balancer',
  service: 'service',
  worker: 'worker',
  queue: 'queue',
  event_bus: 'queue',
  cache: 'cache',
  relational_db: 'database',
  nosql_db: 'database',
  object_storage: 'external',
  cdn: 'cdn',
}

function serviceDist(component: Component): ServiceDist {
  const value = Object.values(component.behavior.serviceTime)[0]
  if (!value || value.state !== 'set') {
    return { dist: 'exp', evidence: 'estimated' }
  }
  const evidence = evidenceFromConfidence(value.confidence)
  const dist = value.value
  if (dist.kind === 'constant') return { dist: 'det', mean_ms: dist.ms, scv: 0, evidence }
  if (dist.kind === 'exponential') return { dist: 'exp', mean_ms: dist.meanMs, scv: 1, evidence }
  const mean = meanMs(dist)
  const p50 = dist.medianMs
  const p95 = dist.medianMs * Math.exp(1.6448536269514722 * dist.sigma)
  return { dist: 'lognormal', mean_ms: mean, p50_ms: p50, p95_ms: p95, evidence }
}

function nodeEvidence(component: Component): Evidence {
  const servers = component.behavior.servers
  const conf = servers.state === 'set' ? evidenceFromConfidence(servers.confidence) : 'estimated'
  return conf
}

function toNode(component: Component): ScenarioNode {
  const servers = component.behavior.servers.state === 'set' ? component.behavior.servers.value : 1
  const queue = component.behavior.queueCapacity
  const K = queue.state === 'set' ? (queue.value === 'unbounded' ? null : queue.value) : null
  const hit =
    component.behavior.cacheHitRate?.state === 'set' ? component.behavior.cacheHitRate.value : undefined
  return {
    id: component.id,
    name: component.name,
    kind: KIND[component.kind] ?? 'service',
    servers: { instances: servers, concurrencyPerInstance: 1 },
    service: serviceDist(component),
    limits: [],
    buffer: { K },
    hitRatio: hit,
    queue: component.kind === 'queue' || component.kind === 'event_bus' ? { consumers: servers } : undefined,
    evidence: nodeEvidence(component),
  }
}

function toEdge(edge: import('../types.ts').Edge): ScenarioEdge {
  const perClass: ScenarioEdge['perClass'] = {}
  const routing =
    edge.routing.mode === 'weighted'
      ? 'weighted'
      : edge.routing.mode === 'broadcast'
        ? 'broadcast'
        : 'single'
  const weight = edge.routing.mode === 'weighted' ? edge.routing.weight : 1
  const kind = edge.call.kind
  for (const classId of Object.keys(edge.classes)) {
    perClass[classId] = {
      routing,
      weight,
      calls: edge.fanOut || 1,
      kind,
      parallel: false,
      latency: { dist: 'det', mean_ms: edge.network.latencyMs, evidence: 'estimated' },
    }
  }
  return { id: edge.id, from: edge.from, to: edge.to, perClass }
}

export function scenarioFromLegacy(topology: Topology, workload: Workload): Scenario {
  const classIds = new Set<string>()
  const workloadRows = []
  for (const [clientId, rates] of Object.entries(workload.offered)) {
    for (const [classId, rate] of Object.entries(rates)) {
      classIds.add(classId)
      workloadRows.push({
        clientId,
        classId,
        profile: 'constant' as const,
        rate_rps: rate,
      })
    }
  }
  for (const edge of topology.edges) {
    for (const classId of Object.keys(edge.classes)) classIds.add(classId)
  }
  const names: Record<string, string> = {
    read: 'Read',
    write: 'Write',
    async: 'Async',
    bulk: 'Bulk',
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    seed: workload.seed,
    run: defaultRun(workload.seed, workload.durationSec),
    classes: [...classIds].map((id) => ({ id, name: names[id] ?? id })),
    nodes: topology.components.map(toNode),
    edges: topology.edges.map(toEdge),
    workload: workloadRows,
    targets: defaultTargets(),
  }
}


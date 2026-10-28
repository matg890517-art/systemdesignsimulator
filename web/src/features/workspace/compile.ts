import {
  applyCatalogCeilings,
  documentedBreaker,
  genericBlocks,
  type CalibrationProfile,
  type CanonicalKind,
  type Component,
  type ComponentBehavior,
  type DiscreteFault,
  type Edge,
  type LoadShape,
  type RequestClassId,
  type Routing,
  type Topology,
  type Value,
  type Workload,
} from '@sds/engine'
import { catalogEntryById, catalogValuesFor } from '../catalog/catalog.ts'
import type { FaultMode } from '../calibration/types.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import { classesFromActiveMap, hasExplicitClasses, readEdgeData } from './edge-data.ts'

export const REQUEST_CLASSES = ['read', 'write', 'async', 'bulk'] as const
export type WorkspaceClassId = (typeof REQUEST_CLASSES)[number]

export const DISCRETE_EVENT_GUARD = 20_000

export type WorkloadDraft = {
  durationSec: number
  dtSec: number
  seed: number
  mode: 'fluid' | 'discrete'
  shapeKind: LoadShape['kind']
  stepAtSec: number
  stepFactor: number
  spikeAtSec: number
  spikeDurationSec: number
  spikeFactor: number
  classes: Record<WorkspaceClassId, number>
  /** Per Clients card rates. Missing keys fall back to `classes`. */
  generators?: Record<string, Partial<Record<WorkspaceClassId, number>>>
}

export type CanvasGenerator = {
  id: string
  title: string
  classes: WorkspaceClassId[]
}

/** One run clock for every Clients card (Viewers, Uploaders, or Clients). */
export const WORKLOAD_RUN_CLOCK = {
  durationSec: 60,
  dtSec: 0.1,
  seed: 4821,
} as const

export const defaultWorkloadDraft = (): WorkloadDraft => ({
  ...WORKLOAD_RUN_CLOCK,
  mode: 'fluid',
  shapeKind: 'step',
  stepAtSec: 20,
  stepFactor: 2,
  spikeAtSec: 20,
  spikeDurationSec: 5,
  spikeFactor: 5,
  classes: { read: 50_000, write: 1_200, async: 2_600, bulk: 2 },
})

const notApplicable: Value<never> = { state: 'not_applicable' }

const KIND_BY_NODE: Record<string, CanonicalKind> = {
  viewers: 'traffic_generator',
  uploaders: 'traffic_generator',
  cloudfront: 'cdn',
  alb: 'load_balancer',
  ecs: 'service',
  elasticache: 'cache',
  dynamodb: 'nosql_db',
  gke: 'service',
  pubsub: 'event_bus',
  cloudrun: 'service',
  firestore: 'nosql_db',
  aks: 'worker',
  servicebus: 'queue',
  blob: 'object_storage',
  frontdoor: 'load_balancer',
}

const KIND_BY_CATALOG: Record<string, CanonicalKind> = {
  'aws-cloudfront': 'cdn',
  'aws-application-load-balancer': 'load_balancer',
  'aws-ecs': 'service',
  'aws-elasticache': 'cache',
  'aws-dynamodb': 'nosql_db',
  'aws-rds': 'relational_db',
  'aws-sqs': 'queue',
  'aws-batch': 'worker',
  'aws-s3': 'object_storage',
  'gcp-gke': 'service',
  'gcp-pub-sub': 'event_bus',
  'gcp-cloud-run': 'service',
  'gcp-firestore': 'nosql_db',
  'gcp-cloud-cdn': 'cdn',
  'gcp-cloud-load-balancing': 'load_balancer',
  'gcp-memorystore': 'cache',
  'gcp-cloud-sql': 'relational_db',
  'gcp-cloud-storage': 'object_storage',
  'azure-aks': 'worker',
  'azure-service-bus': 'queue',
  'azure-blob-storage': 'object_storage',
  'azure-front-door': 'load_balancer',
  'azure-application-gateway': 'load_balancer',
  'azure-cache-for-redis': 'cache',
  'azure-database-for-postgresql': 'relational_db',
  'azure-container-apps': 'worker',
}

const KIND_BY_CATEGORY: Record<string, CanonicalKind> = {
  Cache: 'cache',
  Database: 'nosql_db',
  Storage: 'object_storage',
  'Network and CDN': 'cdn',
  'Messaging and integration': 'queue',
  Compute: 'service',
  Containers: 'service',
  'Kubernetes object': 'service',
  Media: 'service',
  Analytics: 'service',
}

const EDGE_CLASSES: Record<string, RequestClassId[]> = {
  'v-cf': ['read', 'write', 'async'],
  'cf-alb': ['read', 'write', 'async'],
  'alb-ecs': ['read', 'write', 'async'],
  'ecs-cache': ['read', 'async'],
  'cache-ddb': ['read', 'async'],
  'ddb-gke': ['read', 'async'],
  'gke-ps': ['read', 'async'],
  'ps-run': ['read', 'async'],
  'run-fs': ['read', 'async'],
  'up-aks': ['bulk'],
  'aks-sb': ['bulk'],
  'sb-blob': ['bulk'],
  'blob-fd': ['bulk'],
  'copy-link': ['bulk'],
  'c-cdn': ['read', 'write'],
  'cdn-lb': ['read', 'write'],
  'lb-svc': ['read', 'write'],
  'svc-cache': ['read'],
  'svc-db': ['write'],
  'c-q': ['async', 'bulk'],
  'q-w': ['async', 'bulk'],
  'w-obj': ['bulk'],
}

const CLASS_BYTES: Record<WorkspaceClassId, { requestBytes: number; responseBytes: number }> = {
  read: { requestBytes: 2_000, responseBytes: 20_000 },
  write: { requestBytes: 8_000, responseBytes: 1_500 },
  async: { requestBytes: 500, responseBytes: 200 },
  bulk: { requestBytes: 8_000_000, responseBytes: 200 },
}

export function loadShapeFromDraft(draft: WorkloadDraft): LoadShape {
  if (draft.shapeKind === 'step') {
    return { kind: 'step', atSec: draft.stepAtSec, factor: draft.stepFactor }
  }
  if (draft.shapeKind === 'spike') {
    return {
      kind: 'spike',
      atSec: draft.spikeAtSec,
      durationSec: draft.spikeDurationSec,
      factor: draft.spikeFactor,
    }
  }
  return { kind: draft.shapeKind }
}

export function kindForNode(node: Node<ServiceNodeData>): CanonicalKind {
  const data = node.data
  const generic = genericBlocks.find((block) => block.id === data.catalogId)
  if (generic) return generic.kind
  if (data.catalogId && KIND_BY_CATALOG[data.catalogId]) return KIND_BY_CATALOG[data.catalogId]
  if (KIND_BY_NODE[node.id]) return KIND_BY_NODE[node.id]
  const entry = data.catalogId ? catalogEntryById(data.catalogId) : undefined
  if (entry && KIND_BY_CATEGORY[entry.category]) return KIND_BY_CATEGORY[entry.category]
  return 'service'
}

export function classesForGenerator(
  nodeId: string,
  kind: CanonicalKind,
  edges: { id: string; source: string; data?: unknown }[] = [],
): WorkspaceClassId[] {
  if (kind !== 'traffic_generator') return []
  const outgoing = edges.filter((edge) => edge.source === nodeId)
  if (outgoing.length === 0) return [...REQUEST_CLASSES]
  const active = new Set<WorkspaceClassId>()
  for (const edge of outgoing) {
    for (const classId of classesForEdge(edge.id, nodeId, [...REQUEST_CLASSES], edge)) {
      active.add(classId as WorkspaceClassId)
    }
  }
  return REQUEST_CLASSES.filter((id) => active.has(id))
}

function isServiceNode(
  node: Node<ServiceNodeData | ZoneNodeData>,
): node is Node<ServiceNodeData> {
  return node.type !== 'zone'
}

export function canvasGenerators(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edges: { id: string; source: string; data?: unknown }[] = [],
): CanvasGenerator[] {
  return nodes.filter(isServiceNode).flatMap((node) => {
    const kind = kindForNode(node)
    if (kind !== 'traffic_generator') return []
    return [
      {
        id: node.id,
        title: node.data.title,
        classes: classesForGenerator(node.id, kind, edges),
      },
    ]
  })
}

export function generatorClassRate(
  draft: WorkloadDraft,
  generatorId: string,
  classId: WorkspaceClassId,
): number {
  return draft.generators?.[generatorId]?.[classId] ?? draft.classes[classId] ?? 0
}

/** Workload fields: same four classes as the canvas chips. Off-path stays 0 unless the user set it. */
export function visibleClassRate(
  draft: WorkloadDraft,
  generator: CanvasGenerator,
  classId: WorkspaceClassId,
): number {
  const own = draft.generators?.[generator.id]?.[classId]
  if (own !== undefined) return own
  if (!generator.classes.includes(classId)) return 0
  return draft.classes[classId] ?? 0
}

export function withGeneratorClassRate(
  draft: WorkloadDraft,
  generatorId: string,
  classId: WorkspaceClassId,
  rps: number,
): WorkloadDraft {
  return {
    ...draft,
    generators: {
      ...draft.generators,
      [generatorId]: {
        ...draft.generators?.[generatorId],
        [classId]: rps,
      },
    },
  }
}

export function emptyClassTotals(): Record<WorkspaceClassId, number> {
  return { read: 0, write: 0, async: 0, bulk: 0 }
}

export function classTotalsFromOffered(
  offered: Workload['offered'],
): Record<WorkspaceClassId, number> {
  const totals = emptyClassTotals()
  for (const rates of Object.values(offered)) {
    for (const classId of REQUEST_CLASSES) {
      totals[classId] += rates[classId] ?? 0
    }
  }
  return totals
}

export function offeredClassTotals(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edges: { id: string; source: string; data?: unknown }[],
  draft: WorkloadDraft,
): Record<WorkspaceClassId, number> {
  const totals = emptyClassTotals()
  for (const generator of canvasGenerators(nodes, edges)) {
    for (const classId of generator.classes) {
      totals[classId] += generatorClassRate(draft, generator.id, classId)
    }
  }
  return totals
}

export function loadHintFromClassTotals(totals: Record<WorkspaceClassId, number>): {
  load: number
  hint: string
} {
  const load = REQUEST_CLASSES.reduce((sum, id) => sum + totals[id], 0)
  return {
    load,
    hint: `R ${totals.read.toLocaleString('en-US')} · W ${totals.write.toLocaleString('en-US')} · A ${totals.async.toLocaleString('en-US')} · B ${totals.bulk}/s`,
  }
}

function activeClassesForCanvas(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edges: { id: string; source: string; data?: unknown }[],
  draft: WorkloadDraft,
): WorkspaceClassId[] {
  const generators = canvasGenerators(nodes, edges)
  if (generators.length === 0) {
    return REQUEST_CLASSES.filter((id) => draft.classes[id] > 0)
  }
  const live = new Set<WorkspaceClassId>()
  for (const generator of generators) {
    for (const classId of generator.classes) {
      if (generatorClassRate(draft, generator.id, classId) > 0) live.add(classId)
    }
  }
  return REQUEST_CLASSES.filter((id) => live.has(id))
}

export type ClassFilter = 'all' | WorkspaceClassId

export function classesForEdge(
  edgeId: string,
  fromId: string,
  active: RequestClassId[] = [...REQUEST_CLASSES],
  edge?: { id: string; source: string; data?: unknown },
): RequestClassId[] {
  if (edge && hasExplicitClasses(edge)) {
    return classesFromActiveMap(readEdgeData(edge).classes).filter((id) => active.includes(id))
  }
  const mapped = EDGE_CLASSES[edgeId]
  if (mapped) return mapped.filter((id) => active.includes(id))
  if (fromId === 'uploaders' || ['aks', 'servicebus', 'blob', 'frontdoor'].includes(fromId)) {
    return active.filter((id) => id === 'bulk')
  }
  if (['gke', 'pubsub', 'cloudrun', 'firestore'].includes(fromId)) {
    return active.filter((id) => id === 'async' || id === 'read')
  }
  return active.filter((id) => id === 'read' || id === 'write')
}

export function edgeCarriesClass(
  edgeId: string,
  fromId: string,
  classId: WorkspaceClassId,
  edge?: { id: string; source: string; data?: unknown },
): boolean {
  return classesForEdge(edgeId, fromId, [...REQUEST_CLASSES], edge).includes(classId)
}

export function nodeCarriesClass(
  node: Node<ServiceNodeData>,
  edges: { id: string; source: string; target: string; data?: unknown }[],
  filter: ClassFilter,
): boolean {
  if (filter === 'all') return true
  const kind = kindForNode(node)
  if (classesForGenerator(node.id, kind, edges).includes(filter)) return true
  return edges.some(
    (edge) =>
      (edge.source === node.id || edge.target === node.id) &&
      edgeCarriesClass(edge.id, edge.source, filter, edge),
  )
}

function numericField(profile: CalibrationProfile | undefined, role: CalibrationProfile['fields'][number]['role']) {
  const field = profile?.fields.find((item) => item.role === role)
  return field?.value.state === 'set' ? field.value : undefined
}

function behaviorFor(
  kind: CanonicalKind,
  classIds: RequestClassId[],
  profile: CalibrationProfile | undefined,
): ComponentBehavior {
  const servers = numericField(profile, 'servers')
  const serviceMs = numericField(profile, 'serviceMs')
  const queue = numericField(profile, 'queue')
  const hit = numericField(profile, 'cacheHitRate')
  const serviceTime: ComponentBehavior['serviceTime'] = {}
  for (const classId of classIds) {
    if (kind === 'traffic_generator') {
      serviceTime[classId] = { state: 'set', value: { kind: 'constant', ms: 0 }, confidence: 'estimated' }
    } else if (serviceMs) {
      serviceTime[classId] = {
        state: 'set',
        value: { kind: 'constant', ms: serviceMs.value },
        confidence: serviceMs.confidence,
        sourceId: serviceMs.sourceId,
      }
    } else {
      serviceTime[classId] = { state: 'unknown' }
    }
  }
  return {
    servers:
      kind === 'traffic_generator'
        ? { state: 'set', value: 1, confidence: 'estimated' }
        : servers
          ? { state: 'set', value: servers.value, confidence: servers.confidence, sourceId: servers.sourceId }
          : { state: 'unknown' },
    serviceTime,
    queueCapacity: queue
      ? { state: 'set', value: queue.value, confidence: queue.confidence, sourceId: queue.sourceId }
      : { state: 'unknown' },
    throughputLimitRps: { ...notApplicable },
    scaling: { ...notApplicable },
    cacheHitRate: hit
      ? { state: 'set', value: hit.value, confidence: hit.confidence, sourceId: hit.sourceId }
      : undefined,
  }
}

function routingFor(rfEdge: RfEdge): Routing {
  return readEdgeData(rfEdge).routing
}

function breakerFor(rfEdge: RfEdge): Edge['breaker'] {
  const extra = rfEdge.data as { breaker?: Edge['breaker'] } | undefined
  return extra?.breaker ?? { ...documentedBreaker }
}

function crashTarget(components: Component[]): string | undefined {
  return components.find((item) => item.id === 'aks')?.id ?? components.find((item) => item.kind === 'worker')?.id
}

function uploadEdge(edges: Edge[]): Edge | undefined {
  return edges.find((item) => item.id === 'up-aks') ?? edges.find((item) => item.from === 'uploaders')
}

export function compileCanvas(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  rfEdges: RfEdge[],
  draft: WorkloadDraft,
  profiles: CalibrationProfile[],
  fault: FaultMode,
): { topology: Topology; workload: Workload } {
  const active = activeClassesForCanvas(nodes, rfEdges, draft)
  const serviceNodes = nodes.filter(isServiceNode)
  const nodeIds = new Set(serviceNodes.map((node) => node.id))
  const components: Component[] = serviceNodes.map((node) => {
    const kind = kindForNode(node)
    const profile = profiles.find((item) => item.bindsTo === node.id)
    return {
      id: node.id,
      name: node.data.title,
      kind,
      behavior: applyCatalogCeilings(
        behaviorFor(kind, active, profile),
        catalogValuesFor(node.data.catalogId).filter((value) => {
          if (value.conditions.launch === 'fargate') return false
          return true
        }),
      ),
      calibrationProfileIds: profile ? [profile.id] : [],
    }
  })

  const topologyEdges: Edge[] = []
  for (const rfEdge of rfEdges) {
    if (!nodeIds.has(rfEdge.source) || !nodeIds.has(rfEdge.target)) continue
    const typed = readEdgeData(rfEdge)
    const classIds = classesForEdge(rfEdge.id, rfEdge.source, active, rfEdge)
    const classes: Edge['classes'] = {}
    for (const classId of classIds) {
      const typedBytes = typed.classes[classId as WorkspaceClassId]
      const bytes = typedBytes
        ? { requestBytes: typedBytes.requestBytes, responseBytes: typedBytes.responseBytes }
        : (CLASS_BYTES[classId as WorkspaceClassId] ?? CLASS_BYTES.read)
      classes[classId] = bytes
    }
    topologyEdges.push({
      id: rfEdge.id,
      from: rfEdge.source,
      to: rfEdge.target,
      routing: routingFor(rfEdge),
      fanOut: typed.fanOut,
      classes,
      network: {
        latencyMs: typed.network.latencyMs,
        bandwidthBps: typed.network.bandwidthBps,
        bandwidthApplies: 'both',
        lossProb: typed.network.lossProb,
        serialization: false,
      },
      call: { kind: typed.call.kind },
      breaker: breakerFor(rfEdge),
    })
  }

  const aksId = crashTarget(components)
  const link = uploadEdge(topologyEdges)
  if (fault === 'crash' && aksId) {
    const target = components.find((item) => item.id === aksId)
    if (target) target.behavior.servers = { state: 'set', value: 0, confidence: 'estimated', sourceId: 'fault' }
  }
  if (link && (fault === 'packet-drop' || fault === 'link-cut')) {
    link.network.lossProb = fault === 'link-cut' ? 1 : 0.1
  }

  const offered: Workload['offered'] = {}
  for (const component of components) {
    if (component.kind !== 'traffic_generator') continue
    const ids = classesForGenerator(component.id, component.kind, rfEdges)
    const rates: Record<string, number> = {}
    for (const classId of ids) {
      const rps = generatorClassRate(draft, component.id, classId)
      if (rps > 0) rates[classId] = rps
    }
    offered[component.id] = rates
  }

  const faults: DiscreteFault[] = []
  if (fault === 'latency-spike' && link) {
    faults.push({ tSec: 1, kind: 'latency-spike', edgeId: link.id, addMs: 200 })
  }
  if (fault === 'crash' && aksId) {
    faults.push({ tSec: 0, kind: 'crash', componentId: aksId })
  }

  return {
    topology: { components, edges: topologyEdges },
    workload: {
      durationSec: draft.durationSec,
      dtSec: draft.dtSec,
      seed: draft.seed,
      offered,
      shape: loadShapeFromDraft(draft),
      faults: faults.length ? faults : undefined,
    },
  }
}

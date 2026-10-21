import {
  genericBlocks,
  type CalibrationProfile,
  type CanonicalKind,
  type Component,
  type ComponentBehavior,
  type DiscreteFault,
  type Edge,
  type LoadShape,
  type RequestClassId,
  type Topology,
  type Value,
  type Workload,
} from '@sds/engine'
import { catalogEntryById } from '../catalog/catalog.ts'
import type { FaultMode } from '../calibration/types.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'
import type { Edge as RfEdge, Node } from '@xyflow/react'

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
}

export const defaultWorkloadDraft = (): WorkloadDraft => ({
  durationSec: 60,
  dtSec: 0.1,
  seed: 4821,
  mode: 'fluid',
  shapeKind: 'constant',
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
  'gcp-gke': 'service',
  'gcp-pub-sub': 'event_bus',
  'gcp-cloud-run': 'service',
  'gcp-firestore': 'nosql_db',
  'azure-aks': 'worker',
  'azure-service-bus': 'queue',
  'azure-blob-storage': 'object_storage',
  'azure-front-door': 'load_balancer',
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
  'v-cf': ['read', 'write'],
  'cf-alb': ['read', 'write'],
  'alb-ecs': ['read', 'write'],
  'ecs-cache': ['read'],
  'cache-ddb': ['read'],
  'ddb-gke': ['read', 'async'],
  'gke-ps': ['read', 'async'],
  'ps-run': ['read', 'async'],
  'run-fs': ['read', 'async'],
  'up-aks': ['bulk'],
  'aks-sb': ['bulk'],
  'sb-blob': ['bulk'],
  'blob-fd': ['bulk'],
  'copy-link': ['bulk'],
}

const CLASS_BYTES: Record<WorkspaceClassId, { requestBytes: number; responseBytes: number }> = {
  read: { requestBytes: 2_000, responseBytes: 20_000 },
  write: { requestBytes: 8_000, responseBytes: 1_500 },
  async: { requestBytes: 500, responseBytes: 200 },
  bulk: { requestBytes: 8_000_000, responseBytes: 200 },
}

function isServiceNode(
  node: Node<ServiceNodeData | ZoneNodeData>,
): node is Node<ServiceNodeData> {
  return node.type !== 'zone'
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

export function classesForGenerator(nodeId: string, kind: CanonicalKind): WorkspaceClassId[] {
  if (nodeId === 'uploaders') return ['bulk']
  if (nodeId === 'viewers') return ['read', 'write', 'async']
  if (kind === 'traffic_generator') return [...REQUEST_CLASSES]
  return []
}

export type ClassFilter = 'all' | WorkspaceClassId

export function classesForEdge(
  edgeId: string,
  fromId: string,
  active: RequestClassId[] = [...REQUEST_CLASSES],
): RequestClassId[] {
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
): boolean {
  return classesForEdge(edgeId, fromId).includes(classId)
}

export function nodeCarriesClass(
  node: Node<ServiceNodeData>,
  edges: { id: string; source: string; target: string }[],
  filter: ClassFilter,
): boolean {
  if (filter === 'all') return true
  const kind = kindForNode(node)
  if (classesForGenerator(node.id, kind).includes(filter)) return true
  return edges.some(
    (edge) =>
      (edge.source === node.id || edge.target === node.id) &&
      edgeCarriesClass(edge.id, edge.source, filter),
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
  const active = REQUEST_CLASSES.filter((id) => draft.classes[id] > 0)
  const serviceNodes = nodes.filter(isServiceNode)
  const nodeIds = new Set(serviceNodes.map((node) => node.id))
  const components: Component[] = serviceNodes.map((node) => {
    const kind = kindForNode(node)
    const profile = profiles.find((item) => item.bindsTo === node.id)
    return {
      id: node.id,
      name: node.data.title,
      kind,
      behavior: behaviorFor(kind, active, profile),
      calibrationProfileIds: profile ? [profile.id] : [],
    }
  })

  const topologyEdges: Edge[] = []
  for (const rfEdge of rfEdges) {
    if (!nodeIds.has(rfEdge.source) || !nodeIds.has(rfEdge.target)) continue
    const classIds = classesForEdge(rfEdge.id, rfEdge.source, active)
    const classes: Edge['classes'] = {}
    for (const classId of classIds) {
      const bytes = CLASS_BYTES[classId as WorkspaceClassId] ?? CLASS_BYTES.read
      classes[classId] = bytes
    }
    topologyEdges.push({
      id: rfEdge.id,
      from: rfEdge.source,
      to: rfEdge.target,
      routing: { mode: 'single' },
      fanOut: 1,
      classes,
      network: {
        latencyMs: 0,
        bandwidthApplies: 'both',
        lossProb: 0,
        serialization: false,
      },
      call: { kind: 'sync' },
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
    const ids = classesForGenerator(component.id, component.kind)
    const rates: Record<string, number> = {}
    for (const classId of ids) {
      const rps = draft.classes[classId]
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

import type { Edge, Node } from '@xyflow/react'
import type { CalibrationField, CalibrationProfile, Confidence, Value } from '@sds/engine'
import { referenceBindings, type MappedProvider, type ReferenceRole } from '../catalog/provider-maps.ts'
import { defaultWorkloadDraft, type WorkloadDraft } from './compile.ts'
import { defaultClassBytes, type WorkspaceClassId } from './edge-data.ts'
import type { ServiceNodeData } from './types.ts'

const ALL_CLASSES: WorkspaceClassId[] = ['read', 'write', 'async', 'bulk']

function edgeClasses(active: WorkspaceClassId[]) {
  const classes: Record<
    WorkspaceClassId,
    { requestBytes: number; responseBytes: number; active: boolean }
  > = {
    read: { ...defaultClassBytes.read, active: false },
    write: { ...defaultClassBytes.write, active: false },
    async: { ...defaultClassBytes.async, active: false },
    bulk: { ...defaultClassBytes.bulk, active: false },
  }
  for (const id of ALL_CLASSES) {
    classes[id] = { ...defaultClassBytes[id], active: active.includes(id) }
  }
  return classes
}

function estimated(value: number): Value<number> {
  return { state: 'set', value, confidence: 'estimated' satisfies Confidence, sourceId: 'reference-stack-example' }
}

function unknown(): Value<number> {
  return { state: 'unknown' }
}

function field(
  id: string,
  label: string,
  unit: string,
  role: CalibrationField['role'],
  value: Value<number>,
): CalibrationField {
  return { id, label, unit, role, value }
}

function service(
  id: string,
  catalogId: string,
  title: string,
  x: number,
  y: number,
  meta: string,
  provider: ServiceNodeData['provider'] = 'generic',
): Node<ServiceNodeData> {
  return {
    id,
    type: 'service',
    position: { x, y },
    data: {
      title,
      util: 0,
      p99: 'not run',
      meta,
      provider,
      catalogId,
    },
  }
}

function weighted(
  id: string,
  source: string,
  target: string,
  label: string,
  active: WorkspaceClassId[],
): Edge {
  return {
    id,
    source,
    target,
    label,
    type: 'smoothstep',
    data: { routing: { mode: 'weighted', weight: 1 }, classes: edgeClasses(active) },
  }
}

function single(
  id: string,
  source: string,
  target: string,
  label: string,
  active: WorkspaceClassId[],
): Edge {
  return {
    id,
    source,
    target,
    label,
    type: 'smoothstep',
    data: { classes: edgeClasses(active) },
  }
}

const exampleNote =
  'Example Estimated values for the generic reference stack. Not a vendor quote or a measurement.'

function capacity(
  id: string,
  name: string,
  bindsTo: string,
  servers: number,
  serviceMs: number,
  extra: CalibrationField[] = [],
): CalibrationProfile {
  return {
    id,
    name,
    bindsTo,
    notes: exampleNote,
    fields: [
      field('servers', 'Servers', 'count', 'servers', estimated(servers)),
      field('serviceMs', 'Service time (mean)', 'ms', 'serviceMs', estimated(serviceMs)),
      field('queue', 'Queue capacity', 'jobs', 'queue', unknown()),
      field('p95Ms', 'Service time P95', 'ms', 'latencyP95Ms', unknown()),
      ...extra,
    ],
  }
}

const LAYOUT: Record<ReferenceRole, { x: number; y: number; meta: string }> = {
  clients: { x: 16, y: 120, meta: 'generator' },
  cdn: { x: 200, y: 48, meta: 'estimated hit 0.9' },
  lb: { x: 384, y: 48, meta: '4 servers' },
  service: { x: 568, y: 48, meta: '8 servers' },
  cache: { x: 752, y: 16, meta: 'estimated hit 0.8' },
  db: { x: 752, y: 120, meta: '4 servers' },
  queue: { x: 200, y: 216, meta: '2 servers' },
  worker: { x: 384, y: 216, meta: '8 servers' },
  object: { x: 568, y: 216, meta: '4 servers' },
}

/** Same 9-block wiring. Provider maps catalog ids only; capacities stay Estimated. */
export function referenceStackGraph(provider: MappedProvider = 'generic'): {
  nodes: Node<ServiceNodeData>[]
  edges: Edge[]
} {
  const map = referenceBindings[provider]
  const node = (role: ReferenceRole) => {
    const bind = map[role]
    const layout = LAYOUT[role]
    return service(
      role,
      bind.catalogId,
      bind.title,
      layout.x,
      layout.y,
      `${bind.provider} · ${layout.meta}`,
      bind.provider,
    )
  }
  return {
    nodes: [
      node('clients'),
      node('cdn'),
      node('lb'),
      node('service'),
      node('cache'),
      node('db'),
      node('queue'),
      node('worker'),
      node('object'),
    ],
    edges: [
      weighted('c-cdn', 'clients', 'cdn', 'R/W', ['read', 'write']),
      weighted('c-q', 'clients', 'queue', 'A/B', ['async', 'bulk']),
      single('cdn-lb', 'cdn', 'lb', 'miss', ['read', 'write']),
      single('lb-svc', 'lb', 'service', '', ['read', 'write']),
      weighted('svc-cache', 'service', 'cache', 'R', ['read']),
      weighted('svc-db', 'service', 'db', 'W', ['write']),
      single('q-w', 'queue', 'worker', '', ['async', 'bulk']),
      single('w-obj', 'worker', 'object', 'B', ['bulk']),
    ],
  }
}

export const referenceStackProfiles: CalibrationProfile[] = [
  {
    id: 'ref-clients',
    name: 'Generic clients',
    bindsTo: 'clients',
    notes: 'Traffic generator. Rates come from the Workload tab. Not a measurement.',
    fields: [],
  },
  capacity('ref-cdn', 'Generic CDN', 'cdn', 8, 1, [
    field('hitRate', 'Cache hit rate', 'fraction', 'cacheHitRate', estimated(0.9)),
  ]),
  capacity('ref-lb', 'Generic load balancer', 'lb', 4, 1),
  capacity('ref-service', 'Generic service', 'service', 8, 20),
  capacity('ref-cache', 'Generic cache', 'cache', 4, 2, [
    field('hitRate', 'Cache hit rate', 'fraction', 'cacheHitRate', estimated(0.8)),
  ]),
  capacity('ref-db', 'Generic database', 'db', 4, 10),
  capacity('ref-queue', 'Generic queue', 'queue', 2, 2),
  capacity('ref-worker', 'Generic worker', 'worker', 8, 30),
  capacity('ref-object', 'Generic object store', 'object', 4, 5),
]

/** Modest example load so 8×20 ms services are visible, not flooded by the YouTube 51k rps. */
export function referenceWorkloadDraft(): WorkloadDraft {
  return {
    ...defaultWorkloadDraft(),
    classes: { read: 200, write: 40, async: 30, bulk: 20 },
  }
}

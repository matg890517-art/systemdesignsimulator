import {
  costFromProfiles,
  type CalibrationField,
  type CalibrationProfile,
  type CanonicalKind,
  type CostReport,
} from '@sds/engine'
import { kindForNode } from './compile.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'
import type { Node } from '@xyflow/react'

function unknownField(
  id: string,
  label: string,
  unit: string,
  role: CalibrationField['role'],
): CalibrationField {
  return { id, label, unit, role, value: { state: 'unknown' } }
}

function estimatedField(
  id: string,
  label: string,
  unit: string,
  role: CalibrationField['role'],
  value: number,
): CalibrationField {
  return {
    id,
    label,
    unit,
    role,
    value: { state: 'set', value, confidence: 'estimated', sourceId: 'kind-example' },
  }
}

type ExampleCapacity = { servers: number; serviceMs: number; hitRate?: number }

/** Same n / S as the Generic 9-block. Not a catalog quota and not Measured. */
export const KIND_EXAMPLE_CAPACITY: Record<Exclude<CanonicalKind, 'traffic_generator'>, ExampleCapacity> =
  {
    gateway: { servers: 8, serviceMs: 2 },
    load_balancer: { servers: 4, serviceMs: 1 },
    service: { servers: 8, serviceMs: 20 },
    worker: { servers: 8, serviceMs: 30 },
    queue: { servers: 2, serviceMs: 2 },
    event_bus: { servers: 2, serviceMs: 2 },
    cache: { servers: 4, serviceMs: 2, hitRate: 0.8 },
    relational_db: { servers: 4, serviceMs: 10 },
    nosql_db: { servers: 8, serviceMs: 5 },
    object_storage: { servers: 4, serviceMs: 5 },
    cdn: { servers: 8, serviceMs: 1, hitRate: 0.9 },
  }

/** YouTube quoted load (~1,157 rps views) needs more n on the watch path than the 290 rps 9-block. */
const NODE_EXAMPLE_CAPACITY: Record<string, ExampleCapacity> = {
  glb: { servers: 8, serviceMs: 1 },
  upload: { servers: 8, serviceMs: 20 },
  consumer: { servers: 24, serviceMs: 10 },
  mediacdn: { servers: 8, serviceMs: 1, hitRate: 0.9 },
  gcs: { servers: 8, serviceMs: 5 },
  transcoder: { servers: 8, serviceMs: 30 },
  metaproc: { servers: 8, serviceMs: 20 },
  bigtable: { servers: 24, serviceMs: 10 },
}

const EXAMPLE_NOTE =
  'Example Estimated n and mean service time so the engine has a queueing model. Not a vendor quote, not a catalog quota, not Measured. Cost stays unknown.'

export function exampleCapacityFor(nodeId: string, catalogId?: string): ExampleCapacity | undefined {
  const kind = kindForSelection(nodeId, catalogId)
  if (kind === 'traffic_generator') return undefined
  return NODE_EXAMPLE_CAPACITY[nodeId] ?? KIND_EXAMPLE_CAPACITY[kind]
}

export function kindForSelection(nodeId: string, catalogId?: string): CanonicalKind {
  const node = {
    id: nodeId,
    type: 'service',
    position: { x: 0, y: 0 },
    data: {
      title: nodeId,
      util: 0,
      p99: '',
      meta: '',
      provider: 'generic',
      catalogId,
    },
  } as Node<ServiceNodeData>
  return kindForNode(node)
}

/** Skeleton profile for a canvas node. Every field starts unknown. No invented numbers. */
export function blankProfileForNode(
  nodeId: string,
  title: string,
  catalogId?: string,
): CalibrationProfile {
  const kind = kindForSelection(nodeId, catalogId)
  const fields: CalibrationField[] = []
  if (kind !== 'traffic_generator') {
    fields.push(
      unknownField('servers', 'Servers / pool', 'count', 'servers'),
      unknownField('serviceMs', 'Service time (mean)', 'ms', 'serviceMs'),
      unknownField('queue', 'Queue capacity', 'jobs', 'queue'),
      unknownField('p95Ms', 'Service time P95', 'ms', 'latencyP95Ms'),
      unknownField('costUsdPerHour', 'Hourly cost', 'USD/hr', 'costUsdPerHour'),
    )
  }
  if (kind === 'cache' || kind === 'cdn') {
    fields.push(unknownField('hitRate', 'Cache hit rate', 'fraction', 'cacheHitRate'))
  }
  return {
    id: `node-${nodeId}`,
    name: title,
    bindsTo: nodeId,
    notes:
      kind === 'traffic_generator'
        ? 'This node generates traffic. Rates come from Workload. Capacity is not applicable.'
        : 'Unknown until you type a number. Unknown does not cap the engine. A typed number is Estimated unless you mark Vendor or Measured.',
    fields,
  }
}

function withExampleFields(
  profile: CalibrationProfile,
  cap: ExampleCapacity | undefined,
  overwriteSet: boolean,
): CalibrationProfile {
  if (!cap) return profile
  return {
    ...profile,
    notes: EXAMPLE_NOTE,
    fields: profile.fields.map((field) => {
      if (!overwriteSet && field.value.state === 'set') return field
      if (field.role === 'servers') {
        return estimatedField(field.id, field.label, field.unit, field.role, cap.servers)
      }
      if (field.role === 'serviceMs') {
        return estimatedField(field.id, field.label, field.unit, field.role, cap.serviceMs)
      }
      if (field.role === 'cacheHitRate' && cap.hitRate !== undefined) {
        return estimatedField(field.id, field.label, field.unit, field.role, cap.hitRate)
      }
      return field
    }),
  }
}

/** Default card profile: Estimated n and S from kind (or YouTube node). Cost / queue / p95 stay unknown. */
export function exampleProfileForNode(
  nodeId: string,
  title: string,
  catalogId?: string,
): CalibrationProfile {
  const blank = blankProfileForNode(nodeId, title, catalogId)
  const cap = exampleCapacityFor(nodeId, catalogId)
  if (!cap) return blank
  return { ...withExampleFields(blank, cap, true), notes: EXAMPLE_NOTE, name: title }
}

/** Fill unknown n / S / hit on a saved profile. Typed values and $/hr stay. */
export function fillUnknownWithExample(
  profile: CalibrationProfile | undefined,
  nodeId: string,
  title: string,
  catalogId?: string,
): CalibrationProfile {
  const base = profile
    ? { ...mergeConfigProfile(profile, blankProfileForNode(nodeId, title, catalogId)), name: title }
    : blankProfileForNode(nodeId, title, catalogId)
  return withExampleFields(base, exampleCapacityFor(nodeId, catalogId), false)
}

export function profilesWithExampleCapacity(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  profiles: CalibrationProfile[],
): CalibrationProfile[] {
  const byBind = new Map(profiles.map((profile) => [profile.bindsTo, profile]))
  const out: CalibrationProfile[] = []
  for (const node of nodes) {
    if (node.type === 'zone') continue
    const data = node.data as ServiceNodeData
    out.push(fillUnknownWithExample(byBind.get(node.id), node.id, data.title, data.catalogId))
    byBind.delete(node.id)
  }
  out.push(...byBind.values())
  return out
}

export function mergeConfigProfile(
  bound: CalibrationProfile | undefined,
  blank: CalibrationProfile,
): CalibrationProfile {
  if (!bound) return blank
  const byRole = new Map(bound.fields.map((field) => [field.role, field]))
  return {
    ...bound,
    fields: [
      ...blank.fields.map((field) => byRole.get(field.role) ?? field),
      ...bound.fields.filter((field) => !blank.fields.some((item) => item.role === field.role)),
    ],
  }
}

export function configProfileForNode(
  bound: CalibrationProfile | undefined,
  nodeId: string,
  title: string,
  catalogId?: string,
): CalibrationProfile {
  return {
    ...mergeConfigProfile(bound, blankProfileForNode(nodeId, title, catalogId)),
    name: title,
  }
}

/** Typed $/hr across canvas services. Generators are not eligible. Catalog never fills this. */
export function costFromCanvas(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  profiles: CalibrationProfile[],
): CostReport {
  const merged = nodes
    .filter((node) => node.type !== 'zone')
    .map((node) => {
      const data = node.data as ServiceNodeData
      const bound = profiles.find((profile) => profile.bindsTo === node.id)
      return configProfileForNode(bound, node.id, data.title, data.catalogId)
    })
  return costFromProfiles(merged)
}

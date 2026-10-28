import type { CalibrationField, CalibrationProfile, CanonicalKind } from '@sds/engine'
import { kindForNode } from './compile.ts'
import type { ServiceNodeData } from './types.ts'
import type { Node } from '@xyflow/react'

function unknownField(
  id: string,
  label: string,
  unit: string,
  role: CalibrationField['role'],
): CalibrationField {
  return { id, label, unit, role, value: { state: 'unknown' } }
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
      unknownField('serviceMs', 'Service time (median)', 'ms', 'serviceMs'),
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

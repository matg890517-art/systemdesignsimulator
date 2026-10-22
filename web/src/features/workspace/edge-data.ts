import type { Routing } from '@sds/engine'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import { heatStroke } from './heat.ts'
import type { ProviderId, ServiceNodeData, ZoneNodeData } from './types.ts'

const CLASS_IDS = ['read', 'write', 'async', 'bulk'] as const
export type WorkspaceClassId = (typeof CLASS_IDS)[number]

export const CLASS_SHORT: Record<WorkspaceClassId, string> = {
  read: 'R',
  write: 'W',
  async: 'A',
  bulk: 'B',
}

const CLASS_LABEL_RE = /^(none|[RWAB](\/[RWAB])*)$/

export type WorkspaceEdgeData = {
  routing: Routing
  fanOut: number
  call: { kind: 'sync' | 'async' }
  classes: Partial<Record<WorkspaceClassId, { requestBytes: number; responseBytes: number; active: boolean }>>
  network: {
    latencyMs: number
    bandwidthBps?: number
    lossProb: number
  }
  crossProvider?: boolean
}

export const defaultClassBytes: Record<WorkspaceClassId, { requestBytes: number; responseBytes: number }> = {
  read: { requestBytes: 2_000, responseBytes: 20_000 },
  write: { requestBytes: 8_000, responseBytes: 1_500 },
  async: { requestBytes: 500, responseBytes: 200 },
  bulk: { requestBytes: 8_000_000, responseBytes: 200 },
}

export function setEdgeClassActive(
  data: WorkspaceEdgeData,
  id: WorkspaceClassId,
  active: boolean,
): WorkspaceEdgeData {
  const row = data.classes[id] ?? { ...defaultClassBytes[id], active: false }
  return {
    ...data,
    classes: { ...data.classes, [id]: { ...row, active } },
  }
}

export function classSummaryLabel(classes: WorkspaceEdgeData['classes']): string {
  return (
    CLASS_IDS.filter((id) => classes[id]?.active)
      .map((id) => CLASS_SHORT[id])
      .join('/') || 'none'
  )
}

/** Rewrite R/W-style labels when classes change. Leave miss, hop titles, and cross suffixes alone. */
export function relabelClassEdge(currentLabel: string, classes: WorkspaceEdgeData['classes']): string {
  const raw = currentLabel
  const split = raw.indexOf(' · ')
  const base = split >= 0 ? raw.slice(0, split) : raw
  const suffix = split >= 0 ? raw.slice(split) : ''
  if (base !== '' && !CLASS_LABEL_RE.test(base)) return raw
  return `${classSummaryLabel(classes)}${suffix}`
}

export function defaultEdgeData(): WorkspaceEdgeData {
  const classes = {} as WorkspaceEdgeData['classes']
  for (const id of CLASS_IDS) {
    classes[id] = { ...defaultClassBytes[id], active: id === 'read' || id === 'write' }
  }
  return {
    routing: { mode: 'single' },
    fanOut: 1,
    call: { kind: 'sync' },
    classes,
    network: { latencyMs: 0, lossProb: 0 },
  }
}

export function hasExplicitClasses(edge: RfEdge): boolean {
  const extra = edge.data as WorkspaceEdgeData | undefined
  return Boolean(extra?.classes && Object.keys(extra.classes).length > 0)
}

export function classesFromActiveMap(classes: WorkspaceEdgeData['classes']): WorkspaceClassId[] {
  return CLASS_IDS.filter((id) => classes[id]?.active === true)
}

export function withActiveClasses(
  data: WorkspaceEdgeData,
  active: WorkspaceClassId[],
): WorkspaceEdgeData {
  const classes: WorkspaceEdgeData['classes'] = {}
  for (const id of CLASS_IDS) {
    const row = data.classes[id] ?? { ...defaultClassBytes[id], active: false }
    classes[id] = { ...row, active: active.includes(id) }
  }
  return { ...data, classes }
}

export function readEdgeData(edge: RfEdge): WorkspaceEdgeData {
  const extra = edge.data as WorkspaceEdgeData | undefined
  const base = defaultEdgeData()
  if (!extra) return base
  return {
    routing: extra.routing ?? base.routing,
    fanOut: extra.fanOut ?? 1,
    call: extra.call ?? base.call,
    classes: { ...base.classes, ...extra.classes },
    network: {
      latencyMs: extra.network?.latencyMs ?? 0,
      bandwidthBps: extra.network?.bandwidthBps,
      lossProb: extra.network?.lossProb ?? 0,
    },
    crossProvider: extra.crossProvider,
  }
}

export function nodeProvider(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  id: string,
): ProviderId | undefined {
  const node = nodes.find((item) => item.id === id)
  if (!node || node.type === 'zone') return undefined
  return (node.data as ServiceNodeData).provider
}

export function isCrossProviderEdge(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edge: { source?: string | null; target?: string | null },
): boolean {
  if (!edge.source || !edge.target) return false
  const from = nodeProvider(nodes, edge.source)
  const to = nodeProvider(nodes, edge.target)
  if (!from || !to) return false
  if (from === 'generic' || to === 'generic') return false
  return from !== to
}

export function styleCrossProviderEdge(cross: boolean): { stroke: string; strokeDasharray?: string } {
  if (cross) return { stroke: '#B7791F', strokeDasharray: '6 4' }
  return { stroke: '#7B8794' }
}

/** Reuse the same edge objects when cross-provider paint is already applied. */
export function decorateEdges<T extends RfEdge>(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edges: T[],
): T[] {
  let changed = false
  const next = edges.map((edge) => {
    const cross = isCrossProviderEdge(nodes, edge) || readEdgeData(edge).crossProvider === true
    const style = styleCrossProviderEdge(cross)
    const from = nodes.find((node) => node.id === edge.source)
    const to = nodes.find((node) => node.id === edge.target)
    const fromUtil = from?.type === 'service' ? ((from.data as ServiceNodeData).util ?? 0) : 0
    const toUtil = to?.type === 'service' ? ((to.data as ServiceNodeData).util ?? 0) : 0
    const heat = heatStroke(Math.max(fromUtil, toUtil))
    const stroke =
      edge.style?.stroke === '#B3261E' ? '#B3261E' : fromUtil > 0 || toUtil > 0 ? heat : style.stroke
    const label = String(edge.label ?? '')
    const nextLabel =
      cross && !label.includes('cross') ? `${label ? `${label} · ` : ''}cross · Estimated` : edge.label
    const extra = edge.data as WorkspaceEdgeData | undefined
    const typed = readEdgeData(edge)
    const data = extra?.classes
      ? { ...extra, crossProvider: cross }
      : { routing: typed.routing, fanOut: typed.fanOut, call: typed.call, network: typed.network, crossProvider: cross }
    const sameData = extra?.crossProvider === cross && extra?.classes === (data as WorkspaceEdgeData).classes
    const sameStyle = edge.style?.stroke === stroke && edge.style?.strokeDasharray === style.strokeDasharray
    const sameLabel = edge.label === nextLabel
    if (sameData && sameStyle && sameLabel) return edge
    changed = true
    return {
      ...edge,
      data,
      style: { ...edge.style, ...style, stroke },
      label: nextLabel,
    }
  })
  return changed ? next : edges
}

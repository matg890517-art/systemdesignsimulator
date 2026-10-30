import type { Routing } from '@sds/engine'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import { heatStroke } from './heat.ts'
import { FLOW_ZERO_RPS } from './playback.ts'
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
const MISS_PREFIX = /^miss(?: · )?/
const HOP_RATE_RE = / · [\d,.]+(?:k)? (?:\/s|rps)/g

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
  note?: string
  /** Offered rps from the active Show mode. Drives traveling dots on the hop. */
  flowRps?: number
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

export function activeClassMap(active: readonly WorkspaceClassId[]): WorkspaceEdgeData['classes'] {
  const classes: WorkspaceEdgeData['classes'] = {}
  for (const id of CLASS_IDS) {
    classes[id] = { ...defaultClassBytes[id], active: active.includes(id) }
  }
  return classes
}

export function formatHopRate(n: number): string {
  if (!(n > FLOW_ZERO_RPS)) return '0 rps'
  if (n >= 1000) return `${Math.round(n).toLocaleString('en-US')} /s`
  return `${n.toFixed(1)} /s`
}

function typeTokenFromLabel(raw: string): string {
  const stripped = raw
    .replace(MISS_PREFIX, '')
    .replace(/ · cross · Estimated/g, '')
    .replace(HOP_RATE_RE, '')
    .trim()
  const base = stripped.includes(' · ') ? stripped.slice(0, stripped.indexOf(' · ')) : stripped
  if (CLASS_LABEL_RE.test(base)) return base
  const first = base.split(/\s+/)[0] ?? ''
  if (CLASS_LABEL_RE.test(first)) return first
  return 'none'
}

/** Prefix or strip the cache-miss hop label. The miss fraction itself is 1 − hit rate on the cache/CDN card. */
export function applyHopNoteLabel(label: string, miss: boolean): string {
  const raw = String(label ?? '')
  if (miss) return MISS_PREFIX.test(raw) ? raw : `miss · ${raw}`
  return raw.replace(MISS_PREFIX, '')
}

/** Class letters (and miss / cross notes). No baked hop rates. */
export function hopTypeLabel(edge: RfEdge): string {
  const extra = edge.data as WorkspaceEdgeData | undefined
  const summary = hasExplicitClasses(edge)
    ? classSummaryLabel(extra!.classes)
    : typeTokenFromLabel(String(edge.label ?? ''))
  const raw = String(edge.label ?? '')
  const miss = extra?.note === 'miss' || MISS_PREFIX.test(raw)
  const cross = extra?.crossProvider === true || raw.includes('cross · Estimated')
  const type = miss ? `miss · ${summary}` : summary
  return cross ? `${type} · cross · Estimated` : type
}

export function hopLabelWithRate(typeLabel: string, offered?: number): string {
  if (offered === undefined) return typeLabel
  const rate = formatHopRate(offered)
  if (typeLabel.includes(' · cross ·')) {
    return typeLabel.replace(' · cross ·', ` · ${rate} · cross ·`)
  }
  return `${typeLabel} · ${rate}`
}

/** Rewrite R/W-style labels when classes change. Keep a miss prefix. Leave hop titles and cross suffixes. */
export function relabelClassEdge(currentLabel: string, classes: WorkspaceEdgeData['classes']): string {
  const raw = currentLabel
  const miss = MISS_PREFIX.test(raw)
  const rest = (miss ? raw.replace(MISS_PREFIX, '') : raw).replace(HOP_RATE_RE, '')
  const split = rest.indexOf(' · ')
  const base = split >= 0 ? rest.slice(0, split) : rest
  const suffix = split >= 0 ? rest.slice(split) : ''
  if (base !== '' && !CLASS_LABEL_RE.test(base) && !miss) return raw
  const summary = classSummaryLabel(classes)
  return `${miss ? `miss · ${summary}` : summary}${suffix}`
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
    note: extra.note,
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
      ? { ...extra, crossProvider: cross, flowRps: extra.flowRps }
      : {
          routing: typed.routing,
          fanOut: typed.fanOut,
          call: typed.call,
          network: typed.network,
          crossProvider: cross,
          flowRps: extra?.flowRps,
        }
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

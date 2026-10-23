import type { Node } from '@xyflow/react'
import type { ProviderId, ServiceNodeData, WorkspaceNode, ZoneNodeData } from './types.ts'

export const ENV_GRID = {
  cardW: 150,
  cardH: 108,
  gap: 16,
  padX: 16,
  padTop: 36,
  padBottom: 20,
  cols: 3,
  rows: 2,
  x: 184,
  y: 16,
  stackGap: 24,
} as const

export const defaultEnvironmentSize = {
  width: ENV_GRID.padX * 2 + ENV_GRID.cols * ENV_GRID.cardW + (ENV_GRID.cols - 1) * ENV_GRID.gap,
  height:
    ENV_GRID.padTop + ENV_GRID.rows * ENV_GRID.cardH + (ENV_GRID.rows - 1) * ENV_GRID.gap + ENV_GRID.padBottom,
}

export const ENV_MIN_WIDTH = 240
export const ENV_MIN_HEIGHT = 160

export function environmentLabel(provider: ProviderId): string {
  if (provider === 'aws') return 'AWS'
  if (provider === 'gcp') return 'GCP'
  if (provider === 'azure') return 'Azure'
  if (provider === 'kubernetes') return 'Kubernetes'
  return 'Subsystem'
}

export function createEnvironment(input: {
  id?: string
  position: { x: number; y: number }
  provider: ProviderId
  label?: string
  nested?: boolean
  size?: { width: number; height: number }
}): Node<ZoneNodeData> {
  const width = input.size?.width ?? defaultEnvironmentSize.width
  const height = input.size?.height ?? defaultEnvironmentSize.height
  return {
    id: input.id ?? `env-${crypto.randomUUID()}`,
    type: 'zone',
    position: input.position,
    style: { width, height },
    data: {
      label: input.label ?? environmentLabel(input.provider),
      provider: input.provider,
      nested: input.nested,
    },
    draggable: true,
    selectable: true,
    zIndex: 0,
  }
}

export function isZone(node: WorkspaceNode): node is Node<ZoneNodeData> {
  return node.type === 'zone'
}

export function zoneSize(node: WorkspaceNode): { width: number; height: number } {
  const width = Number(node.style?.width)
  const height = Number(node.style?.height)
  return {
    width: Number.isFinite(width) && width > 0 ? width : defaultEnvironmentSize.width,
    height: Number.isFinite(height) && height > 0 ? height : defaultEnvironmentSize.height,
  }
}

export function absolutePosition(
  nodes: WorkspaceNode[],
  node: WorkspaceNode,
): { x: number; y: number } {
  let x = node.position.x
  let y = node.position.y
  let parentId = node.parentId
  while (parentId) {
    const parent = nodes.find((item) => item.id === parentId)
    if (!parent) break
    x += parent.position.x
    y += parent.position.y
    parentId = parent.parentId
  }
  return { x, y }
}

export function zoneContaining(
  nodes: WorkspaceNode[],
  point: { x: number; y: number },
  excludeId?: string,
): Node<ZoneNodeData> | undefined {
  const hits = nodes.filter(isZone).filter((zone) => {
    if (zone.id === excludeId) return false
    const origin = absolutePosition(nodes, zone)
    const { width, height } = zoneSize(zone)
    return (
      point.x >= origin.x &&
      point.x <= origin.x + width &&
      point.y >= origin.y &&
      point.y <= origin.y + height
    )
  })
  hits.sort((a, b) => {
    const aSize = zoneSize(a)
    const bSize = zoneSize(b)
    return aSize.width * aSize.height - bSize.width * bSize.height
  })
  return hits[0]
}

export function adoptIntoZone(
  nodes: WorkspaceNode[],
  serviceId: string,
  zoneId: string,
): WorkspaceNode[] {
  const service = nodes.find((node) => node.id === serviceId)
  const zone = nodes.find((node) => node.id === zoneId)
  if (!service || service.type !== 'service' || !zone || zone.type !== 'zone') return nodes
  if (zone.parentId) return nodes
  const abs = absolutePosition(nodes, service)
  const origin = absolutePosition(nodes, zone)
  return nodes.map((node) =>
    node.id === serviceId
      ? {
          ...node,
          parentId: zoneId,
          extent: undefined,
          position: { x: abs.x - origin.x, y: abs.y - origin.y },
        }
      : node,
  )
}

export function releaseFromZone(nodes: WorkspaceNode[], serviceId: string): WorkspaceNode[] {
  const service = nodes.find((node) => node.id === serviceId)
  if (!service?.parentId || service.type !== 'service') return nodes
  const abs = absolutePosition(nodes, service)
  return nodes.map((node) =>
    node.id === serviceId
      ? { ...node, parentId: undefined, extent: undefined, position: abs }
      : node,
  )
}

export function ungroupZone(nodes: WorkspaceNode[], zoneId: string): WorkspaceNode[] {
  const zone = nodes.find((node) => node.id === zoneId && node.type === 'zone')
  if (!zone) return nodes
  const origin = absolutePosition(nodes, zone)
  return nodes
    .filter((node) => node.id !== zoneId)
    .map((node) => {
      if (node.parentId !== zoneId) return node
      return {
        ...node,
        parentId: undefined,
        extent: undefined,
        position: { x: origin.x + node.position.x, y: origin.y + node.position.y },
      }
    })
}

export function ungroupZones(nodes: WorkspaceNode[], zoneIds: string[]): WorkspaceNode[] {
  let next = nodes
  for (const id of zoneIds) next = ungroupZone(next, id)
  return next
}

export function droppedServicePosition(
  nodes: WorkspaceNode[],
  position: { x: number; y: number },
): { position: { x: number; y: number }; parentId?: string } {
  const zone = zoneContaining(nodes, { x: position.x + 24, y: position.y + 24 })
  if (!zone) return { position }
  const origin = absolutePosition(nodes, zone)
  return {
    parentId: zone.id,
    position: { x: position.x - origin.x, y: position.y - origin.y },
  }
}

export function reparentOnDragStop(
  nodes: WorkspaceNode[],
  serviceId: string,
  center: { x: number; y: number },
): WorkspaceNode[] {
  const service = nodes.find((node) => node.id === serviceId)
  if (!service || service.type !== 'service') return nodes
  const zone = zoneContaining(nodes, center, serviceId)
  if (!zone) {
    return service.parentId ? releaseFromZone(nodes, serviceId) : nodes
  }
  if (service.parentId === zone.id) return nodes
  const released = service.parentId ? releaseFromZone(nodes, serviceId) : nodes
  return adoptIntoZone(released, serviceId, zone.id)
}

export function patchZone(
  nodes: WorkspaceNode[],
  zoneId: string,
  next: { data?: Partial<ZoneNodeData>; width?: number; height?: number },
): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id !== zoneId || node.type !== 'zone') return node
    const size = zoneSize(node)
    return {
      ...node,
      data: next.data ? { ...(node.data as ZoneNodeData), ...next.data } : node.data,
      style: {
        ...node.style,
        width: next.width ?? size.width,
        height: next.height ?? size.height,
      },
    }
  })
}

export type PaletteDropPayload = {
  name: string
  provider?: ProviderId
  catalogId?: string
  kind?: 'service' | 'environment'
}

export function parsePaletteDrop(raw: string): PaletteDropPayload | undefined {
  try {
    const parsed = JSON.parse(raw) as PaletteDropPayload
    if (!parsed || typeof parsed.name !== 'string') return undefined
    return parsed
  } catch {
    return { name: raw, provider: 'aws', kind: 'service' }
  }
}

export function serviceDraftFromDrop(
  payload: PaletteDropPayload,
  position: { x: number; y: number },
): Node<ServiceNodeData> {
  return {
    id: `${payload.name}-${crypto.randomUUID()}`,
    type: 'service',
    position,
    zIndex: 1,
    data: {
      title: payload.name,
      util: 0,
      p99: 'not run',
      meta: payload.catalogId
        ? 'Dropped from catalog · quotas unknown'
        : 'Dropped from palette · Estimated',
      provider: payload.provider ?? 'generic',
      catalogId: payload.catalogId,
    },
  }
}

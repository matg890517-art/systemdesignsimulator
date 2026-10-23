import type { Node } from '@xyflow/react'
import { createEnvironment, orderZonesBeforeChildren } from './environment.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export type WorkspaceGraphNode = Node<ServiceNodeData | ZoneNodeData>

const NODE_W = 150
const NODE_H = 88
const PAD = 32

export function wrapInSubsystem(
  nodes: WorkspaceGraphNode[],
  selectedIds: string[],
  now = Date.now(),
): { nodes: WorkspaceGraphNode[]; id: string } | { error: string } {
  const ids = new Set(selectedIds)
  const services = nodes.filter(
    (node) => ids.has(node.id) && node.type === 'service',
  ) as Node<ServiceNodeData>[]
  if (services.length < 2) return { error: 'Select at least two services to nest.' }
  if (services.some((node) => node.parentId)) {
    return { error: 'This build nests one level. Remove the parent zone first.' }
  }
  const minX = Math.min(...services.map((node) => node.position.x))
  const minY = Math.min(...services.map((node) => node.position.y))
  const maxX = Math.max(...services.map((node) => node.position.x + NODE_W))
  const maxY = Math.max(...services.map((node) => node.position.y + NODE_H))
  const id = `sub-${now}`
  const zone: WorkspaceGraphNode = createEnvironment({
    id,
    provider: 'generic',
    label: 'Subsystem',
    nested: true,
    position: { x: minX - PAD, y: minY - PAD },
    size: { width: maxX - minX + PAD * 2, height: maxY - minY + PAD * 2 },
  })
  const rest = nodes.map((node) => {
    if (!ids.has(node.id) || node.type !== 'service') return node
    return {
      ...node,
      parentId: id,
      extent: undefined,
      position: {
        x: node.position.x - (minX - PAD),
        y: node.position.y - (minY - PAD),
      },
    }
  })
  return { nodes: orderZonesBeforeChildren([zone, ...rest]), id }
}

import type { Edge } from '@xyflow/react'
import { absolutePosition } from './environment.ts'
import type { WorkspaceNode } from './types.ts'

/** Same box as ServiceNodeView. Used when React Flow has not measured the card yet. */
export const SERVICE_CARD = { width: 168, height: 72 } as const

export type SideHandle = 'left' | 'right' | 'top' | 'bottom'

export type HopHandles = {
  sourceHandle: SideHandle
  targetHandle: SideHandle
}

/** Opposite side of a card. The hop stays source → target; only the attachment flips. */
export function oppositeHandle(side: SideHandle): SideHandle {
  if (side === 'left') return 'right'
  if (side === 'right') return 'left'
  if (side === 'top') return 'bottom'
  return 'top'
}

/**
 * Pick source and target sides from the vector between card centers. Dominant axis
 * wins (|dx| ≥ |dy| is left/right). Direction of the hop does not change.
 */
export function handlesForCenters(from: { x: number; y: number }, to: { x: number; y: number }): HopHandles {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const sourceHandle: SideHandle =
    Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : dy >= 0 ? 'bottom' : 'top'
  return { sourceHandle, targetHandle: oppositeHandle(sourceHandle) }
}

function cardSize(node: WorkspaceNode): { width: number; height: number } {
  const measured = 'measured' in node ? (node as { measured?: { width?: number; height?: number } }).measured : undefined
  return {
    width: measured?.width && measured.width > 0 ? measured.width : SERVICE_CARD.width,
    height: measured?.height && measured.height > 0 ? measured.height : SERVICE_CARD.height,
  }
}

export function nodeCenter(nodes: WorkspaceNode[], node: WorkspaceNode): { x: number; y: number } {
  const origin = absolutePosition(nodes, node)
  const size = cardSize(node)
  return { x: origin.x + size.width / 2, y: origin.y + size.height / 2 }
}

export function handlesForNodes(nodes: WorkspaceNode[], sourceId: string, targetId: string): HopHandles {
  const source = nodes.find((node) => node.id === sourceId)
  const target = nodes.find((node) => node.id === targetId)
  if (!source || !target) return { sourceHandle: 'right', targetHandle: 'left' }
  return handlesForCenters(nodeCenter(nodes, source), nodeCenter(nodes, target))
}

/** Rewrite attachment sides from current card positions. Same array if nothing moved. */
export function routeEdges(nodes: WorkspaceNode[], edges: Edge[]): Edge[] {
  let changed = false
  const next = edges.map((edge) => {
    const handles = handlesForNodes(nodes, edge.source, edge.target)
    if (edge.sourceHandle === handles.sourceHandle && edge.targetHandle === handles.targetHandle) {
      return edge
    }
    changed = true
    return { ...edge, sourceHandle: handles.sourceHandle, targetHandle: handles.targetHandle }
  })
  return changed ? next : edges
}

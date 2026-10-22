import { addEdge, type Connection, type Edge } from '@xyflow/react'
import {
  defaultEdgeData,
  isCrossProviderEdge,
  styleCrossProviderEdge,
} from './edge-data.ts'
import type { WorkspaceNode } from './types.ts'

export function edgeDraftFromConnection(
  nodes: WorkspaceNode[],
  connection: Pick<Connection, 'source' | 'target' | 'sourceHandle' | 'targetHandle'>,
): Edge {
  const cross = isCrossProviderEdge(nodes, connection)
  const style = styleCrossProviderEdge(cross)
  return {
    ...connection,
    id: `${connection.source}-${connection.target}`,
    type: 'smoothstep',
    data: { ...defaultEdgeData(), crossProvider: cross },
    label: cross ? 'cross · Estimated' : undefined,
    style,
  }
}

export function connectComponents(
  nodes: WorkspaceNode[],
  edges: Edge[],
  source: string,
  target: string,
): { edges: Edge[] } | { error: string } {
  if (!source || !target) return { error: 'Pick two components' }
  if (source === target) return { error: 'Pick a different component' }
  const sourceNode = nodes.find((node) => node.id === source && node.type === 'service')
  const targetNode = nodes.find((node) => node.id === target && node.type === 'service')
  if (!sourceNode || !targetNode) return { error: 'Connect services, not zones' }
  if (edges.some((edge) => edge.source === source && edge.target === target)) {
    return { error: 'Already connected' }
  }
  return {
    edges: addEdge(
      edgeDraftFromConnection(nodes, {
        source,
        target,
        sourceHandle: null,
        targetHandle: null,
      }),
      edges,
    ),
  }
}

export function deleteSelection(
  nodes: WorkspaceNode[],
  edges: Edge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
): { nodes: WorkspaceNode[]; edges: Edge[] } {
  const dropNodes = new Set(
    selectedNodeIds.filter((id) => nodes.some((node) => node.id === id && node.type === 'service')),
  )
  const dropEdges = new Set(selectedEdgeIds)
  return {
    nodes: nodes.filter((node) => !dropNodes.has(node.id)),
    edges: edges.filter(
      (edge) => !dropEdges.has(edge.id) && !dropNodes.has(edge.source) && !dropNodes.has(edge.target),
    ),
  }
}

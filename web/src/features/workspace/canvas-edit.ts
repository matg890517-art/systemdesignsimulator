import { addEdge, type Connection, type Edge, type Node } from '@xyflow/react'
import { kindForNode } from './compile.ts'
import {
  defaultEdgeData,
  isCrossProviderEdge,
  styleCrossProviderEdge,
} from './edge-data.ts'
import type { ServiceNodeData, WorkspaceNode } from './types.ts'

function asService(node: WorkspaceNode | undefined): Node<ServiceNodeData> | undefined {
  if (!node || node.type !== 'service') return undefined
  return node as Node<ServiceNodeData>
}

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

export function connectRefusal(
  nodes: WorkspaceNode[],
  edges: Edge[],
  source: string,
  target: string,
): string | undefined {
  if (!source || !target) return 'Pick two components'
  if (source === target) return 'Pick a different component'
  const sourceNode = asService(nodes.find((node) => node.id === source))
  const targetNode = asService(nodes.find((node) => node.id === target))
  if (!sourceNode || !targetNode) return 'Connect services, not zones'
  const targetKind = kindForNode(targetNode)
  if (targetKind === 'traffic_generator') {
    return 'Clients only send load. They cannot be a target.'
  }
  const hop = edges.some(
    (edge) =>
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source),
  )
  if (hop) return 'Already connected. One hop per pair; extra classes go on that edge.'
  return undefined
}

export function connectComponents(
  nodes: WorkspaceNode[],
  edges: Edge[],
  source: string,
  target: string,
  handles?: Pick<Connection, 'sourceHandle' | 'targetHandle'>,
): { edges: Edge[] } | { error: string } {
  const error = connectRefusal(nodes, edges, source, target)
  if (error) return { error }
  return {
    edges: addEdge(
      edgeDraftFromConnection(nodes, {
        source,
        target,
        sourceHandle: handles?.sourceHandle ?? null,
        targetHandle: handles?.targetHandle ?? null,
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

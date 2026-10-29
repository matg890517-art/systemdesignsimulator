import { addEdge, type Connection, type Edge, type Node } from '@xyflow/react'
import { hopRefusal } from './connect-rules.ts'
import { kindForNode } from './compile.ts'
import {
  classSummaryLabel,
  defaultEdgeData,
  isCrossProviderEdge,
  readEdgeData,
  styleCrossProviderEdge,
} from './edge-data.ts'
import { handlesForNodes } from './edge-handles.ts'
import { ungroupZones } from './environment.ts'
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
  const sourceNode = asService(nodes.find((node) => node.id === connection.source))
  const fromLb = sourceNode ? kindForNode(sourceNode) === 'load_balancer' : false
  const data = {
    ...defaultEdgeData(),
    crossProvider: cross,
    ...(fromLb ? { routing: { mode: 'weighted' as const, weight: 1 } } : {}),
  }
  const summary = classSummaryLabel(data.classes)
  return {
    ...connection,
    id: `${connection.source}-${connection.target}`,
    type: 'smoothstep',
    data,
    label: cross ? `${summary} · cross · Estimated` : summary,
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
  const sourceKind = kindForNode(sourceNode)
  const targetKind = kindForNode(targetNode)
  const kindError = hopRefusal(sourceKind, targetKind)
  if (kindError) return kindError
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
): { edges: Edge[] } | { error: string } {
  const error = connectRefusal(nodes, edges, source, target)
  if (error) return { error }
  const handles = handlesForNodes(nodes, source, target)
  return {
    edges: applyLoadBalancerRouting(
      nodes,
      addEdge(
        edgeDraftFromConnection(nodes, {
          source,
          target,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
        }),
        edges,
      ),
    ),
  }
}

/** A second hop from a load balancer turns leftover Single hops into equal weights. */
function applyLoadBalancerRouting(nodes: WorkspaceNode[], edges: Edge[]): Edge[] {
  const lbs = new Set(
    nodes.flatMap((node) => {
      const service = asService(node)
      return service && kindForNode(service) === 'load_balancer' ? [service.id] : []
    }),
  )
  if (lbs.size === 0) return edges
  const count = new Map<string, number>()
  for (const edge of edges) {
    if (!lbs.has(edge.source)) continue
    count.set(edge.source, (count.get(edge.source) ?? 0) + 1)
  }
  return edges.map((edge) => {
    if (!lbs.has(edge.source) || (count.get(edge.source) ?? 0) < 2) return edge
    const data = readEdgeData(edge)
    if (data.routing.mode === 'broadcast' || data.routing.mode === 'weighted') return edge
    return { ...edge, data: { ...data, routing: { mode: 'weighted', weight: 1 } } }
  })
}

export function patchServiceTitle(
  nodes: WorkspaceNode[],
  nodeId: string,
  title: string,
): WorkspaceNode[] {
  return nodes.map((node) => {
    if (node.id !== nodeId || node.type !== 'service') return node
    return { ...node, data: { ...node.data, title } }
  })
}

export function deleteSelection(
  nodes: WorkspaceNode[],
  edges: Edge[],
  selectedNodeIds: string[],
  selectedEdgeIds: string[],
): { nodes: WorkspaceNode[]; edges: Edge[] } {
  const dropServices = new Set(
    selectedNodeIds.filter((id) => nodes.some((node) => node.id === id && node.type === 'service')),
  )
  const dropZones = selectedNodeIds.filter((id) =>
    nodes.some((node) => node.id === id && node.type === 'zone'),
  )
  const dropEdges = new Set(selectedEdgeIds)
  const withoutServices = nodes.filter((node) => !dropServices.has(node.id))
  return {
    nodes: ungroupZones(withoutServices, dropZones),
    edges: edges.filter(
      (edge) =>
        !dropEdges.has(edge.id) && !dropServices.has(edge.source) && !dropServices.has(edge.target),
    ),
  }
}

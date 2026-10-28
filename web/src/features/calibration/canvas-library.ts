import type { CalibrationProfile } from '@sds/engine'
import type { Edge as RfEdge } from '@xyflow/react'
import { configProfileForNode } from '../workspace/node-profile.ts'
import { initialEdges, initialNodes } from '../workspace/graph.ts'
import {
  browserStore,
  loadCurrent,
  type TopologySnapshot,
} from '../workspace/persistence.ts'
import type { ProviderId, ServiceNodeData, WorkspaceNode } from '../workspace/types.ts'

export const DEFAULT_CANVAS_NAME = 'Example: Video streaming platform (YouTube-style)'

export type CanvasCalibrationRow = {
  nodeId: string
  title: string
  catalogId?: string
  provider: ProviderId
  profile: CalibrationProfile
}

export function currentCanvas(snapshot?: TopologySnapshot): {
  name: string
  nodes: WorkspaceNode[]
  edges: RfEdge[]
} {
  if (snapshot?.nodes?.length) {
    return { name: snapshot.name, nodes: snapshot.nodes, edges: snapshot.edges }
  }
  return { name: DEFAULT_CANVAS_NAME, nodes: initialNodes, edges: initialEdges }
}

export function readCurrentCanvas() {
  const store = browserStore()
  return currentCanvas(store ? loadCurrent(store) : undefined)
}

export function calibrationRowsForCanvas(
  nodes: WorkspaceNode[],
  profiles: CalibrationProfile[],
): CanvasCalibrationRow[] {
  return nodes
    .filter((node) => node.type === 'service')
    .map((node) => {
      const data = node.data as ServiceNodeData
      const bound = profiles.find((profile) => profile.bindsTo === node.id)
      return {
        nodeId: node.id,
        title: data.title,
        catalogId: data.catalogId,
        provider: data.provider,
        profile: configProfileForNode(bound, node.id, data.title, data.catalogId),
      }
    })
}

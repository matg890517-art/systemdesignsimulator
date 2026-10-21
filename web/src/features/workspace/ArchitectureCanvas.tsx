import { useCallback, useMemo, type Dispatch, type DragEvent, type SetStateAction } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box } from '@mui/material'
import { ServiceNodeView, ZoneNodeView } from './ServiceNode.tsx'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export type WorkspaceNode = Node<ServiceNodeData | ZoneNodeData>

const nodeTypes = {
  service: ServiceNodeView,
  zone: ZoneNodeView,
}

function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onSelect,
}: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: { id: string; title: string; catalogId?: string }) => void
}) {
  const { screenToFlowPosition } = useReactFlow()

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  )

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData('application/sds-service')
      if (!raw) return
      let payload: { name: string; provider?: ServiceNodeData['provider']; catalogId?: string }
      try {
        payload = JSON.parse(raw) as { name: string; provider?: ServiceNodeData['provider']; catalogId?: string }
      } catch {
        payload = { name: raw, provider: 'aws' }
      }
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      const node: WorkspaceNode = {
        id: `${payload.name}-${crypto.randomUUID()}`,
        type: 'service',
        position,
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
      onNodesChange([{ type: 'add', item: node }])
    },
    [onNodesChange, screenToFlowPosition],
  )

  const defaultEdgeOptions = useMemo(
    () => ({ type: 'smoothstep' as const, style: { stroke: '#7B8794' } }),
    [],
  )

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={onDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onSelectionChange={({ nodes: selected }) => {
          const node = selected[0]
          if (!node || node.type !== 'service') {
            onSelect(undefined)
            return
          }
          const data = node.data as ServiceNodeData
          onSelect({ id: node.id, title: data.title, catalogId: data.catalogId })
        }}
        fitView
        minZoom={0.4}
      >
        <Background gap={16} color="#D5DBE3" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'zone') return '#D5DBE3'
            const util = (node.data as ServiceNodeData | undefined)?.util ?? 0
            if (util >= 0.85) return '#B3261E'
            if (util >= 0.7) return '#B7791F'
            return '#2744C7'
          }}
        />
      </ReactFlow>
    </Box>
  )
}

export function ArchitectureCanvas(props: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: { id: string; title: string; catalogId?: string }) => void
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}

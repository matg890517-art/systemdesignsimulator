import { useCallback, useMemo, useRef, type Dispatch, type DragEvent, type SetStateAction } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box } from '@mui/material'
import { ServiceNodeView, ZoneNodeView } from './ServiceNode.tsx'
import { ClassFilterProvider, useClassFilter, type ClassFilter } from './class-filter.ts'
import { edgeCarriesClass } from './compile.ts'
import { canvasSelectionKey } from './canvas-selection.ts'
import {
  decorateEdges,
  defaultEdgeData,
  isCrossProviderEdge,
  styleCrossProviderEdge,
} from './edge-data.ts'
import { heatStroke } from './heat.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export type WorkspaceNode = Node<ServiceNodeData | ZoneNodeData>

const nodeTypes = {
  service: ServiceNodeView,
  zone: ZoneNodeView,
}

function ClassAwareEdge(props: EdgeProps) {
  const { filter } = useClassFilter()
  const visible = filter === 'all' || edgeCarriesClass(props.id, props.source, filter)
  return (
    <SmoothStepEdge
      {...props}
      style={{
        ...props.style,
        stroke: visible
          ? typeof props.style?.stroke === 'string'
            ? props.style.stroke
            : '#7B8794'
          : '#D5DBE3',
        opacity: visible ? 1 : 0.14,
      }}
      label={visible ? props.label : undefined}
    />
  )
}

const edgeTypes = {
  smoothstep: ClassAwareEdge,
}

function CanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onSelect,
  onSelectEdge,
  onSelectIds,
}: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: { id: string; title: string; catalogId?: string }) => void
  onSelectEdge: (edge?: Edge) => void
  onSelectIds: (ids: string[]) => void
}) {
  const { screenToFlowPosition } = useReactFlow()
  const selectionKey = useRef('')
  const displayEdges = useMemo(() => decorateEdges(nodes, edges), [nodes, edges])

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: WorkspaceNode[]; edges: Edge[] }) => {
      const key = canvasSelectionKey(selectedNodes, selectedEdges)
      if (key === selectionKey.current) return
      selectionKey.current = key
      const serviceIds = selectedNodes.filter((item) => item.type === 'service').map((item) => item.id)
      onSelectIds(serviceIds)
      if (key.startsWith('e:')) {
        const edge = selectedEdges[0]
        onSelect(undefined)
        if (edge) onSelectEdge(edge)
        return
      }
      onSelectEdge(undefined)
      const node = selectedNodes.find((item) => item.type === 'service')
      if (!node) {
        onSelect(undefined)
        return
      }
      const data = node.data as ServiceNodeData
      onSelect({ id: node.id, title: data.title, catalogId: data.catalogId })
    },
    [onSelect, onSelectEdge, onSelectIds],
  )

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((current) => {
        const cross = isCrossProviderEdge(nodes, connection)
        const data = { ...defaultEdgeData(), crossProvider: cross }
        const style = styleCrossProviderEdge(cross)
        return addEdge(
          {
            ...connection,
            type: 'smoothstep',
            data,
            label: cross ? 'cross · Estimated' : undefined,
            style,
          },
          current,
        )
      }),
    [nodes, setEdges],
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
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onSelectionChange={onSelectionChange}
        onInit={(instance) => {
          void instance.fitView({ padding: 0.08 })
        }}
        minZoom={0.4}
        snapToGrid
        snapGrid={[16, 16]}
      >
        <Background gap={16} color="#D5DBE3" />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'zone') return '#D5DBE3'
            return heatStroke((node.data as ServiceNodeData | undefined)?.util ?? 0)
          }}
        />
      </ReactFlow>
    </Box>
  )
}

export function ArchitectureCanvas(props: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  classFilter: ClassFilter
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: { id: string; title: string; catalogId?: string }) => void
  onSelectEdge: (edge?: Edge) => void
  onSelectIds: (ids: string[]) => void
}) {
  const filterValue = useMemo(
    () => ({ filter: props.classFilter, edges: props.edges }),
    [props.classFilter, props.edges],
  )
  return (
    <ReactFlowProvider>
      <ClassFilterProvider value={filterValue}>
        <CanvasInner
          nodes={props.nodes}
          edges={props.edges}
          onNodesChange={props.onNodesChange}
          onEdgesChange={props.onEdgesChange}
          setEdges={props.setEdges}
          onSelect={props.onSelect}
          onSelectEdge={props.onSelectEdge}
          onSelectIds={props.onSelectIds}
        />
      </ClassFilterProvider>
    </ReactFlowProvider>
  )
}

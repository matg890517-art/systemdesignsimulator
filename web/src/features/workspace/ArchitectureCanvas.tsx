import {
  useCallback,
  useMemo,
  useRef,
  type Dispatch,
  type DragEvent,
  type MouseEvent,
  type SetStateAction,
} from 'react'
import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  SmoothStepEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'
import { ServiceNodeView, ZoneNodeView } from './ServiceNode.tsx'
import { ClassFilterProvider, useClassFilter, type ClassFilter } from './class-filter.ts'
import { edgeCarriesClass } from './compile.ts'
import { canvasSelectionKey } from './canvas-selection.ts'
import { decorateEdges } from './edge-data.ts'
import { connectComponents } from './canvas-edit.ts'
import {
  adoptIntoZone,
  createEnvironment,
  droppedServicePosition,
  parsePaletteDrop,
  serviceDraftFromDrop,
  zoneContaining,
} from './environment.ts'
import { heatStroke } from './heat.ts'
import type { CanvasSelection, ServiceNodeData, WorkspaceNode, ZoneNodeData } from './types.ts'

export type { WorkspaceNode }

const nodeTypes = {
  service: ServiceNodeView,
  zone: ZoneNodeView,
}

function ClassAwareEdge(props: EdgeProps) {
  const { filter } = useClassFilter()
  const visible =
    filter === 'all' ||
    edgeCarriesClass(props.id, props.source, filter, {
      id: props.id,
      source: props.source,
      data: props.data,
    })
  return (
    <SmoothStepEdge
      {...props}
      interactionWidth={32}
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
  setNodes,
  setEdges,
  onSelect,
  onSelectEdge,
  onSelectIds,
  onSelectEdgeIds,
  connectClick,
  connectFromId,
  onConnectFrom,
  onConnectError,
}: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: CanvasSelection) => void
  onSelectEdge: (edge?: Edge) => void
  onSelectIds: (ids: string[]) => void
  onSelectEdgeIds: (ids: string[]) => void
  connectClick: boolean
  connectFromId?: string
  onConnectFrom: (id?: string) => void
  onConnectError: (message?: string) => void
}) {
  const { screenToFlowPosition } = useReactFlow()
  const selectionKey = useRef('')
  const displayEdges = useMemo(() => decorateEdges(nodes, edges), [nodes, edges])

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: WorkspaceNode[]; edges: Edge[] }) => {
      const key = canvasSelectionKey(selectedNodes, selectedEdges)
      if (key === selectionKey.current) return
      selectionKey.current = key
      onSelectIds(selectedNodes.map((item) => item.id))
      onSelectEdgeIds(selectedEdges.map((edge) => edge.id))
      if (key.startsWith('e:')) {
        const edge = selectedEdges[0]
        onSelect(undefined)
        if (edge) onSelectEdge(edge)
        return
      }
      onSelectEdge(undefined)
      const service = selectedNodes.find((item) => item.type === 'service')
      if (service) {
        const data = service.data as ServiceNodeData
        onSelect({
          id: service.id,
          title: data.title,
          catalogId: data.catalogId,
          kind: 'service',
          provider: data.provider,
          parentId: service.parentId,
        })
        return
      }
      const zone = selectedNodes.find((item) => item.type === 'zone')
      if (!zone) {
        onSelect(undefined)
        return
      }
      const data = zone.data as ZoneNodeData
      onSelect({
        id: zone.id,
        title: data.label,
        kind: 'zone',
        provider: data.provider,
      })
    },
    [onSelect, onSelectEdge, onSelectEdgeIds, onSelectIds],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      setEdges((current) => {
        const next = connectComponents(nodes, current, connection.source!, connection.target!, {
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        })
        if ('error' in next) {
          onConnectError(next.error)
          return current
        }
        onConnectError(undefined)
        return next.edges
      })
    },
    [nodes, onConnectError, setEdges],
  )

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (!connectClick || node.type !== 'service') return
      if (!connectFromId) {
        onConnectFrom(node.id)
        onConnectError(undefined)
        return
      }
      if (connectFromId === node.id) return
      const next = connectComponents(nodes, edges, connectFromId, node.id)
      if ('error' in next) {
        onConnectError(next.error)
        return
      }
      setEdges(next.edges)
      onConnectFrom(undefined)
      onConnectError(undefined)
    },
    [connectClick, connectFromId, edges, nodes, onConnectError, onConnectFrom, setEdges],
  )

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData('application/sds-service')
      if (!raw) return
      const payload = parsePaletteDrop(raw)
      if (!payload) return
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      if (payload.kind === 'environment') {
        const env = createEnvironment({
          position,
          provider: payload.provider ?? 'generic',
        })
        setNodes((current) => [...current, env])
        return
      }
      setNodes((current) => {
        const placed = droppedServicePosition(current, position)
        return [...current, { ...serviceDraftFromDrop(payload, placed.position), ...placed }]
      })
    },
    [screenToFlowPosition, setNodes],
  )

  const onNodeDragStop = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (node.type !== 'service' || node.parentId) return
      setNodes((current) => {
        const zone = zoneContaining(
          current,
          { x: node.position.x + 75, y: node.position.y + 44 },
          node.id,
        )
        if (!zone) return current
        return adoptIntoZone(current, node.id, zone.id)
      })
    },
    [setNodes],
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
        position: 'relative',
        bgcolor: 'background.paper',
        borderRadius: 3,
        overflow: 'hidden',
        '& .react-flow__handle': {
          width: 10,
          height: 10,
          background: '#FFFFFF',
          border: '2px solid #2744C7',
          opacity: 1,
        },
        '& .react-flow__handle-connecting': { background: '#2744C7' },
        '& .react-flow__node-zone': { zIndex: '0 !important' },
        '& .react-flow__node-service': { zIndex: 1 },
        '& .react-flow__pane': connectClick ? { cursor: 'crosshair' } : undefined,
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
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
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
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        connectionMode={ConnectionMode.Loose}
        connectionRadius={28}
        nodesConnectable
        edgesReconnectable
        connectionLineStyle={{ stroke: '#2744C7', strokeWidth: 2 }}
        panOnDrag={!connectClick}
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
      <Box sx={{ position: 'absolute', left: 16, top: 12, pointerEvents: 'none' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          {connectClick
            ? connectFromId
              ? 'Click a target component'
              : 'Click a source component'
            : 'Drop an Environment box, then drag services onto it. Drag a corner to resize. Delete or Backspace removes the selection.'}
        </Typography>
      </Box>
    </Box>
  )
}

export function ArchitectureCanvas(props: {
  nodes: WorkspaceNode[]
  edges: Edge[]
  classFilter: ClassFilter
  onNodesChange: OnNodesChange<WorkspaceNode>
  onEdgesChange: OnEdgesChange<Edge>
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>
  setEdges: Dispatch<SetStateAction<Edge[]>>
  onSelect: (node?: CanvasSelection) => void
  onSelectEdge: (edge?: Edge) => void
  onSelectIds: (ids: string[]) => void
  onSelectEdgeIds: (ids: string[]) => void
  connectClick: boolean
  connectFromId?: string
  onConnectFrom: (id?: string) => void
  onConnectError: (message?: string) => void
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
          setNodes={props.setNodes}
          setEdges={props.setEdges}
          onSelect={props.onSelect}
          onSelectEdge={props.onSelectEdge}
          onSelectIds={props.onSelectIds}
          onSelectEdgeIds={props.onSelectEdgeIds}
          connectClick={props.connectClick}
          connectFromId={props.connectFromId}
          onConnectFrom={props.onConnectFrom}
          onConnectError={props.onConnectError}
        />
      </ClassFilterProvider>
    </ReactFlowProvider>
  )
}

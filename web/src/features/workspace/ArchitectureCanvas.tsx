import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type DragEvent,
  type MouseEvent,
  type SetStateAction,
} from 'react'
import AddIcon from '@mui/icons-material/Add'
import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  BaseEdge,
  getSmoothStepPath,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Button, Stack, Typography } from '@mui/material'
import { ServiceNodeView, ZoneNodeView } from './ServiceNode.tsx'
import { ClassFilterProvider, useClassFilter, type ClassFilter } from './class-filter.ts'
import { edgeCarriesClass } from './compile.ts'
import { canvasSelectionKey } from './canvas-selection.ts'
import { decorateEdges, type WorkspaceEdgeData } from './edge-data.ts'
import { flowPacketCount, flowPeriodSec } from './playback.ts'
import { connectComponents, connectRefusal } from './canvas-edit.ts'
import {
  absolutePosition,
  appendServiceInZone,
  createEnvironment,
  orderZonesBeforeChildren,
  parsePaletteDrop,
  reparentOnDragStop,
  serviceDraftFromDrop,
} from './environment.ts'
import { heatStroke } from './heat.ts'
import type { CanvasSelection, ServiceNodeData, WorkspaceNode, ZoneNodeData } from './types.ts'

export type { WorkspaceNode }

/** Extra top inset so Fit View sits the graph under the KPI overlay, not behind it. */
export const CANVAS_FIT_VIEW = {
  padding: { top: '136px', right: '40px', bottom: '72px', left: '24px' },
  duration: 200,
} as const

const nodeTypes = {
  service: ServiceNodeView,
  zone: ZoneNodeView,
}

function packetFill(stroke: string): string {
  if (stroke === '#7B8794' || stroke === '#D5DBE3') return '#2744C7'
  return stroke
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
  const flowRps = (props.data as WorkspaceEdgeData | undefined)?.flowRps ?? 0
  const flowing = visible && flowRps > 0
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  })
  const stroke = visible
    ? typeof props.style?.stroke === 'string'
      ? props.style.stroke
      : '#7B8794'
    : '#D5DBE3'
  const period = Math.round(flowPeriodSec(flowRps) * 5) / 5
  const packets = flowing ? flowPacketCount(flowRps) : 0
  const fill = packetFill(stroke)
  return (
    <>
      <BaseEdge
        path={path}
        labelX={labelX}
        labelY={labelY}
        label={visible ? props.label : undefined}
        labelStyle={props.labelStyle}
        labelShowBg={props.labelShowBg}
        labelBgStyle={props.labelBgStyle}
        labelBgPadding={props.labelBgPadding}
        labelBgBorderRadius={props.labelBgBorderRadius}
        markerEnd={props.markerEnd}
        markerStart={props.markerStart}
        interactionWidth={32}
        style={{ ...props.style, stroke, opacity: visible ? 1 : 0.14 }}
      />
      {packets > 0 ? (
        <g className="sds-flow-packets" pointerEvents="none">
          {Array.from({ length: packets }, (_, i) => (
            <circle key={i} r={4} fill={fill} stroke="#FFFFFF" strokeWidth={1.25}>
              <animateMotion
                dur={`${period}s`}
                repeatCount="indefinite"
                begin={`${-(i / packets) * period}s`}
                path={path}
              />
            </circle>
          ))}
        </g>
      ) : null}
    </>
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
  focusRequest,
  fitNonce,
  onLoadReference,
  onServiceDropped,
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
  focusRequest?: CanvasFocusRequest
  fitNonce?: number
  onLoadReference?: () => void
  onServiceDropped?: (node: Node<ServiceNodeData>) => void
}) {
  const { screenToFlowPosition, getInternalNode, setCenter, getZoom, fitView } = useReactFlow()
  const selectionKey = useRef('')
  const displayEdges = useMemo(() => decorateEdges(nodes, edges), [nodes, edges])
  const serviceCount = useMemo(() => nodes.filter((node) => node.type === 'service').length, [nodes])

  // Pan to a node that another panel (Bottlenecks) asked for. Zoom stays where the user left it.
  useEffect(() => {
    if (!focusRequest) return
    const internal = getInternalNode(focusRequest.nodeId)
    if (!internal) return
    const { positionAbsolute } = internal.internals
    const width = internal.measured.width ?? 168
    const height = internal.measured.height ?? 72
    void setCenter(positionAbsolute.x + width / 2, positionAbsolute.y + height / 2, {
      zoom: getZoom(),
      duration: 300,
    })
  }, [focusRequest, getInternalNode, getZoom, setCenter])

  useEffect(() => {
    if (!fitNonce) return
    const handle = window.setTimeout(() => {
      void fitView({ ...CANVAS_FIT_VIEW })
    }, 120)
    return () => window.clearTimeout(handle)
  }, [fitNonce, fitView])

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
        const next = connectComponents(nodes, current, connection.source!, connection.target!)
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
      event.stopPropagation()
      const raw = event.dataTransfer.getData('application/sds-service')
      if (!raw) return
      const payload = parsePaletteDrop(raw)
      if (!payload) return
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      if (payload.kind === 'environment') {
        if (!payload.provider || payload.provider === 'generic') return
        const env = createEnvironment({
          position,
          provider: payload.provider,
        })
        setNodes((current) => orderZonesBeforeChildren([...current, env]))
        return
      }
      const draft = serviceDraftFromDrop(payload, position)
      setNodes((current) => appendServiceInZone(current, draft, position))
      onServiceDropped?.(draft)
    },
    [screenToFlowPosition, setNodes, onServiceDropped],
  )

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onNodeDragStop = useCallback(
    (_event: MouseEvent, node: Node) => {
      if (node.type !== 'service') return
      setNodes((current) => {
        const live = current.map((item) =>
          item.id === node.id ? { ...item, position: node.position } : item,
        )
        const moved = live.find((item) => item.id === node.id)
        if (!moved) return current
        const abs = absolutePosition(live, moved)
        return reparentOnDragStop(live, node.id, { x: abs.x + 84, y: abs.y + 40 })
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
        '& .sds-flow-packets': { pointerEvents: 'none' },
        '& .react-flow__handle': {
          width: 10,
          height: 10,
          background: '#FFFFFF',
          border: '2px solid #2744C7',
          opacity: 1,
        },
        '& .react-flow__handle-connecting': { background: '#2744C7' },
        '& .react-flow__node-zone': { zIndex: '0 !important' },
        '& .react-flow__node-service': { zIndex: '1 !important' },
        '& .react-flow__pane': connectClick ? { cursor: 'crosshair' } : undefined,
        '& .react-flow__controls': {
          boxShadow: 'none',
          border: '1px solid #D5DBE3',
          borderRadius: 8,
          overflow: 'hidden',
        },
        '& .react-flow__controls-button': {
          width: 28,
          height: 28,
          borderBottom: '1px solid #D5DBE3',
          background: '#FFFFFF',
        },
        '& .react-flow__minimap': {
          background: '#EEF1F5',
          border: '1px solid #D5DBE3',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'none',
        },
      }}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={(connection) =>
          !connectRefusal(nodes, edges, connection.source ?? '', connection.target ?? '')
        }
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        elevateNodesOnSelect={false}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onSelectionChange={onSelectionChange}
        fitViewOptions={CANVAS_FIT_VIEW}
        onInit={(instance) => {
          void instance.fitView({ ...CANVAS_FIT_VIEW })
        }}
        minZoom={0.2}
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
      {connectClick ? (
        <Box sx={{ position: 'absolute', left: 16, top: 108, pointerEvents: 'none' }}>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {connectFromId ? 'Click target' : 'Click source'}
          </Typography>
        </Box>
      ) : null}
      {serviceCount === 0 ? (
        <Stack
          data-testid="empty-canvas"
          spacing={1}
          sx={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            px: 4,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'grid',
              placeItems: 'center',
              color: 'text.secondary',
              bgcolor: 'background.paper',
            }}
          >
            <AddIcon sx={{ fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Empty canvas</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', maxWidth: 360 }}>
            Drag a service from the palette, connect it, then Run. Unknown capacity stays unknown
            and does not cap the engine.
          </Typography>
          {onLoadReference ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onLoadReference}
              sx={{ pointerEvents: 'auto', mt: 0.5 }}
            >
              Load the generic reference stack
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  )
}

export type CanvasFocusRequest = { nodeId: string; nonce: number }

function ArchitectureCanvasView(props: {
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
  focusRequest?: CanvasFocusRequest
  fitNonce?: number
  onLoadReference?: () => void
  onServiceDropped?: (node: Node<ServiceNodeData>) => void
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
          focusRequest={props.focusRequest}
          fitNonce={props.fitNonce}
          onLoadReference={props.onLoadReference}
          onServiceDropped={props.onServiceDropped}
        />
      </ClassFilterProvider>
    </ReactFlowProvider>
  )
}

export const ArchitectureCanvas = memo(ArchitectureCanvasView)

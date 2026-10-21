import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEdgesState, useNodesState } from '@xyflow/react'
import { TopNav } from '../../components/TopNav.tsx'
import { ArchitectureCanvas } from './ArchitectureCanvas.tsx'
import { ClassFilterChips } from './ClassFilterChips.tsx'
import { Inspector } from './Inspector.tsx'
import { Palette } from './Palette.tsx'
import { WorkloadEditor } from './WorkloadEditor.tsx'
import { initialEdges, initialNodes } from './graph.ts'
import { getFault, getProfiles, useLibrary } from '../calibration/library.ts'
import { FaultsPanel } from './FaultsPanel.tsx'
import { idleKpis, pickNodeStat } from './simulate.ts'
import { runWorkspaceAsync } from './engine-client.ts'
import { getWorkloadDraft, useWorkloadDraft } from './workload-store.ts'
import { nodeCarriesClass, type ClassFilter } from './compile.ts'
import type { Bottleneck, KpiState, ServiceNodeData, WorkspaceRun } from './types.ts'

const seedBottlenecks: Bottleneck[] = [
  {
    id: 'aks',
    title: 'Transcode workers (AKS)',
    util: 0.95,
    summary: '2 uploads/s. 84 slots at 40 s serve 2.1 uploads/s.',
    suggestion: 'Run to confirm from the engine.',
    fromEngine: false,
  },
  {
    id: 'copy-link',
    title: 'Azure to AWS copy link',
    util: 0.91,
    summary: '0.8 GB/s copies vs 0.88 GB/s on the link. Capacity is Estimated.',
    suggestion: 'Measure this cross-provider link in Calibration.',
    fromEngine: false,
  },
]

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Box sx={{ minWidth: 170, px: 2, py: 1, flexShrink: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 20 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{hint}</Typography>
    </Box>
  )
}

export function WorkspacePage() {
  const [canvasReady, setCanvasReady] = useState(false)
  const [tab, setTab] = useState(0)
  const [kpis, setKpis] = useState<KpiState>(idleKpis)
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>(seedBottlenecks)
  const [selected, setSelected] = useState<{ id: string; title: string; catalogId?: string }>()
  const [ran, setRan] = useState(false)
  const [runError, setRunError] = useState<string>()
  const [runHint, setRunHint] = useState<string>()
  const [classFilter, setClassFilter] = useState<ClassFilter>('all')
  const [lastRun, setLastRun] = useState<WorkspaceRun>()
  const [running, setRunning] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const library = useLibrary()
  const draft = useWorkloadDraft()
  const runGen = useRef(0)
  const paintFrame = useRef(0)

  useEffect(() => {
    setCanvasReady(true)
  }, [])

  const kpisToShow = useMemo(() => kpis, [kpis])
  const modeLabel = draft.mode === 'discrete' ? 'Discrete-event' : 'Fluid-flow'
  const shownBottlenecks = useMemo(() => {
    if (classFilter === 'all') return bottlenecks
    return bottlenecks.filter((item) => {
      const node = nodes.find((entry) => entry.id === item.id)
      if (!node || node.type === 'zone') return false
      return nodeCarriesClass(
        {
          id: node.id,
          type: 'service',
          position: node.position,
          data: node.data as ServiceNodeData,
        },
        edges,
        classFilter,
      )
    })
  }, [bottlenecks, classFilter, nodes, edges])

  function paintRun(run: WorkspaceRun, filter: ClassFilter) {
    setNodes((current) =>
      current.map((node) => {
        if (node.type === 'zone') return node
        const data = node.data as ServiceNodeData
        const stat = pickNodeStat(run, node.id, filter)
        if (!stat || (filter !== 'all' && stat.offered <= 0 && stat.completed <= 0)) {
          return {
            ...node,
            data: {
              ...data,
              util: 0,
              p99: filter === 'all' ? 'no traffic' : `no ${filter}`,
              meta: `${run.mode} · ${filter === 'all' ? 'not on path' : `off ${filter} path`}`,
            },
          }
        }
        return {
          ...node,
          data: {
            ...data,
            util: stat.util,
            p99: stat.p99,
            meta: filter === 'all' ? stat.meta : `${stat.meta} · ${filter}`,
          },
        }
      }),
    )
  }

  function paintLiveStats(stats: WorkspaceRun['nodeStats']) {
    setNodes((current) =>
      current.map((node) => {
        if (node.type === 'zone') return node
        const data = node.data as ServiceNodeData
        const stat = stats[node.id]
        if (!stat) return node
        return {
          ...node,
          data: { ...data, util: stat.util, p99: stat.p99, meta: `${stat.meta} · live` },
        }
      }),
    )
  }

  async function onRun() {
    const id = runGen.current + 1
    runGen.current = id
    setRunning(true)
    setRunError(undefined)
    setRunHint('worker · running')
    let live = true
    try {
      const result = await runWorkspaceAsync(
        {
          nodes,
          edges,
          draft: getWorkloadDraft(),
          profiles: getProfiles(),
          fault: getFault(),
        },
        (progress) => {
          if (!live || runGen.current !== id) return
          cancelAnimationFrame(paintFrame.current)
          paintFrame.current = requestAnimationFrame(() => {
            if (!live || runGen.current !== id) return
            paintLiveStats(progress.nodeStats)
            setRunHint(`worker · running · t ${progress.t.toFixed(1)}s`)
          })
        },
      )
      live = false
      cancelAnimationFrame(paintFrame.current)
      if (runGen.current !== id) return
      if (!result.ok) {
        setRunError(result.reason)
        return
      }
      setRan(true)
      setKpis(result.run.kpis)
      setBottlenecks(result.run.bottlenecks)
      setRunHint(result.run.hint)
      setLastRun(result.run)
      paintRun(result.run, classFilter)
    } catch (error) {
      if (runGen.current !== id) return
      setRunError(error instanceof Error ? error.message : String(error))
    } finally {
      if (runGen.current === id) setRunning(false)
    }
  }

  useEffect(() => {
    if (lastRun) paintRun(lastRun, classFilter)
    // Paint from the last engine run when the class filter changes. Node positions stay in setNodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter])

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="workspace" />
      <Stack
        direction="row"
        sx={{ alignItems: 'center', px: 2, py: 1, gap: 1.5 }}
      >
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Projects / Example: Video streaming platform (YouTube-style) / Workspace
        </Typography>
        <Chip label="Saved" size="small" sx={{ bgcolor: 'success.light', color: 'success.dark', height: 20 }} />
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {modeLabel} · {draft.durationSec} s · seed {draft.seed}
        </Typography>
        <Button variant="contained" onClick={() => void onRun()} disabled={running}>
          {running ? 'Running…' : 'Run'}
        </Button>
      </Stack>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          bgcolor: 'background.paper',
          px: 2,
          borderBottom: 1,
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Canvas" />
          <Tab label="Workload" />
          <Tab label="Faults" />
        </Tabs>
        {tab === 0 ? <ClassFilterChips value={classFilter} onChange={setClassFilter} /> : null}
      </Stack>
      <Stack
        direction="row"
        sx={{
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexWrap: 'wrap',
        }}
      >
        <Kpi label="LOAD" value={kpisToShow.load} hint={kpisToShow.loadHint} />
        <Kpi label="LATENCY" value={kpisToShow.latency} hint={kpisToShow.latencyHint} />
        <Kpi label="ERRORS" value={kpisToShow.errors} hint="of requests" />
        <Kpi
          label="BOTTLENECKS"
          value={kpisToShow.bottlenecks}
          hint={kpisToShow.bottleneckHint}
        />
        <Kpi label="COST" value={kpisToShow.cost} hint={kpisToShow.costHint} />
        {running || ran ? (
          <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'text.secondary' }}>
            {running ? 'Running on a Web Worker' : 'Last run from @sds/engine'}
            {library.fault !== 'none' ? ` · fault ${library.fault}` : ''}
            {runHint ? ` · ${runHint}` : ''}
          </Typography>
        ) : null}
        {runError ? (
          <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'error.main' }}>
            {runError}
          </Typography>
        ) : null}
      </Stack>
      <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
        {tab === 0 && (
          <>
            <Palette />
            {canvasReady ? (
              <ArchitectureCanvas
                nodes={nodes}
                edges={edges}
                classFilter={classFilter}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                setEdges={setEdges}
                onSelect={setSelected}
              />
            ) : (
              <Box
                sx={{
                  flex: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'text.secondary',
                }}
              >
                Loading canvas
              </Box>
            )}
            <Inspector bottlenecks={shownBottlenecks} selected={selected} />
          </>
        )}
        {tab === 1 && <WorkloadEditor />}
        {tab === 2 && <FaultsPanel />}
      </Box>
    </Box>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Chip, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useNodesState } from '@xyflow/react'
import { TopNav } from '../../components/TopNav.tsx'
import { ArchitectureCanvas } from './ArchitectureCanvas.tsx'
import { Inspector } from './Inspector.tsx'
import { Palette } from './Palette.tsx'
import { initialNodes } from './graph.ts'
import { aksRunPlan, useLibrary } from '../calibration/library.ts'
import { FaultsPanel } from './FaultsPanel.tsx'
import { idleKpis, simulateAksBottleneck } from './simulate.ts'
import type { Bottleneck, KpiState, ServiceNodeData } from './types.ts'

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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const library = useLibrary()
  const plan = aksRunPlan()

  useEffect(() => {
    setCanvasReady(true)
  }, [])

  const kpisToShow = useMemo(() => kpis, [kpis])

  function onRun() {
    if (!plan.ok) {
      setRunError(plan.reason)
      return
    }
    const result = simulateAksBottleneck()
    setRan(true)
    setRunError(undefined)
    setKpis(result.kpis)
    setBottlenecks([
      result.bottleneck,
      seedBottlenecks[1] as Bottleneck,
    ])
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== 'aks') return node
        const data = node.data as ServiceNodeData
        return {
          ...node,
          data: {
            ...data,
            util: result.util,
            p99: `${result.mu.toFixed(1)} /s`,
            meta: 'Azure · engine fluid mode',
          },
        }
      }),
    )
  }

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
          Fluid-flow · 60 s · seed 4821
        </Typography>
        <Button variant="contained" onClick={onRun} disabled={!plan.ok}>
          Run
        </Button>
      </Stack>
      <Box sx={{ bgcolor: 'background.paper', px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Canvas" />
          <Tab label="Workload" />
          <Tab label="Faults" />
        </Tabs>
      </Box>
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
        {ran ? (
          <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'text.secondary' }}>
            Last run from @sds/engine
            {library.fault !== 'none' ? ` · fault ${library.fault}` : ''}
            {plan.ok ? ` · slots ${plan.servers} ${plan.serversConfidence}` : ''}
          </Typography>
        ) : null}
        {runError ? (
          <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'error.main' }}>
            {runError}
          </Typography>
        ) : null}
        {!plan.ok ? (
          <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'error.main' }}>
            {plan.reason}
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
                onNodesChange={onNodesChange}
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
            <Inspector bottlenecks={bottlenecks} selected={selected} />
          </>
        )}
        {tab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h2">Workload</Typography>
            <Typography sx={{ mt: 1, color: 'text.secondary' }}>
              Constant, Poisson, step and spike editors ship in a later phase. This run uses Peak
              evening: 51,200 rps.
            </Typography>
          </Box>
        )}
        {tab === 2 && <FaultsPanel />}
      </Box>
    </Box>
  )
}

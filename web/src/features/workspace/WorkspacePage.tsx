import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CableIcon from '@mui/icons-material/Cable'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { Box, Button, Chip, IconButton, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import { useEdgesState, useNodesState, type Edge } from '@xyflow/react'
import { KpiStat } from '../../components/KpiStat.tsx'
import { TopNav } from '../../components/TopNav.tsx'
import { ArchitectureCanvas } from './ArchitectureCanvas.tsx'
import { ClassFilterChips } from './ClassFilterChips.tsx'
import { FileMenu } from './FileMenu.tsx'
import { HeatLegend } from './HeatLegend.tsx'
import { Inspector } from './Inspector.tsx'
import { Palette } from './Palette.tsx'
import { IconModeProvider } from './icon-mode.tsx'
import { deleteSelection, patchServiceTitle } from './canvas-edit.ts'
import { WorkloadEditor } from './WorkloadEditor.tsx'
import { initialEdges, initialNodes } from './graph.ts'
import { costFromProfiles, expectedArrivals } from '@sds/engine'
import {
  getFault,
  getProfiles,
  replaceProfiles,
  setFault,
  useLibrary,
  youtubeSeedProfiles,
} from '../calibration/library.ts'
import { FaultsPanel } from './FaultsPanel.tsx'
import { idleKpis, kpisFromDraft, pickEdgeOffered, pickNodeStat } from './simulate.ts'
import { runWorkspaceAsync } from './engine-client.ts'
import { getWorkloadDraft, setWorkloadDraft, useWorkloadDraft } from './workload-store.ts'
import {
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  nodeCarriesClass,
  type ClassFilter,
} from './compile.ts'
import { RunModeToggle } from './RunModeToggle.tsx'
import { RUN_MODES } from './run-mode.ts'
import { type MappedProvider } from '../catalog/provider-maps.ts'
import {
  referenceStackGraph,
  referenceStackProfiles,
  referenceWorkloadDraft,
} from './reference-graph.ts'
import {
  browserStore,
  loadCurrent,
  parseSnapshot,
  saveCurrent,
  serializeSnapshot,
  snapshotFilename,
  snapshotFrom,
  takeQueuedOpen,
  upsertProject,
  type TopologySnapshot,
} from './persistence.ts'
import { hopLabelWithRate, hopTypeLabel } from './edge-data.ts'
import { architectureInventory } from './inventory.ts'
import { shareUrlFor, snapshotFromHref } from './share.ts'
import { wrapInSubsystem } from './subsystem.ts'
import { AKS_HEADROOM_CHALLENGE, scoreAksHeadroom } from '../challenge/challenge.ts'
import {
  patchZone,
  releaseFromZone,
  zoneSize,
} from './environment.ts'
import type { Bottleneck, CanvasSelection, KpiState, ServiceNodeData, WorkspaceRun } from './types.ts'

function readBootSnapshot(): TopologySnapshot | undefined {
  if (typeof window !== 'undefined') {
    const shared = snapshotFromHref(window.location.href)
    if (shared) return shared
  }
  const store = browserStore()
  if (!store) return undefined
  return takeQueuedOpen(store) ?? loadCurrent(store)
}

function challengeFromHref(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return new URL(window.location.href).searchParams.get('challenge') ?? undefined
  } catch {
    return undefined
  }
}

const seedBottlenecks: Bottleneck[] = [
  {
    id: 'aks',
    title: 'Transcode workers (AKS)',
    util: 0.95,
    summary: '2 uploads/s. 84 slots at 40 s serve 2.1 uploads/s.',
    suggestion: 'Run to confirm from the engine.',
    fromEngine: false,
    citation: 'Estimated · AKS transcode workers',
  },
  {
    id: 'copy-link',
    title: 'Azure to AWS copy link',
    util: 0.91,
    summary: '0.8 GB/s copies vs 0.88 GB/s on the link. Capacity is Estimated.',
    suggestion: 'Measure this cross-provider link in Calibration.',
    fromEngine: false,
    citation: 'Estimated · Azure to AWS copy link',
  },
]

function savedChipSx(hint: string) {
  if (
    hint.startsWith('Saved') ||
    hint.startsWith('Exported') ||
    hint.startsWith('Copied') ||
    hint.startsWith('Inventory')
  ) {
    return { bgcolor: 'success.light', color: 'success.dark' }
  }
  return { bgcolor: 'action.hover', color: 'text.secondary' }
}

export function WorkspacePage() {
  const boot = useRef<{
    nodes: typeof initialNodes
    edges: typeof initialEdges
    snapshot?: TopologySnapshot
  } | null>(null)
  if (boot.current === null) {
    const snapshot = readBootSnapshot()
    boot.current = {
      nodes: snapshot?.nodes?.length ? snapshot.nodes : initialNodes,
      edges: snapshot?.edges?.length ? snapshot.edges : initialEdges,
      snapshot,
    }
  }
  const [canvasReady, setCanvasReady] = useState(false)
  const [tab, setTab] = useState(0)
  const [kpis, setKpis] = useState<KpiState>(idleKpis)
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>(seedBottlenecks)
  const [selected, setSelected] = useState<CanvasSelection>()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>()
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([])
  const [connectClick, setConnectClick] = useState(false)
  const [connectFromId, setConnectFromId] = useState<string>()
  const [challengeId] = useState(challengeFromHref)
  const [ran, setRan] = useState(false)
  const [runError, setRunError] = useState<string>()
  const [runHint, setRunHint] = useState<string>()
  const [classFilter, setClassFilter] = useState<ClassFilter>('all')
  const [lastRun, setLastRun] = useState<WorkspaceRun>()
  const [running, setRunning] = useState(false)
  const [scene, setScene] = useState<'youtube' | 'reference' | 'custom'>(
    boot.current.snapshot?.scene ?? 'youtube',
  )
  const [projectName, setProjectName] = useState(
    boot.current.snapshot?.name ?? 'Example: Video streaming platform (YouTube-style)',
  )
  const [savedHint, setSavedHint] = useState(boot.current.snapshot ? 'Restored locally' : 'Local draft')
  const [fps, setFps] = useState(0)
  const [nodes, setNodes, onNodesChange] = useNodesState(boot.current.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(boot.current.edges)
  const library = useLibrary()
  const draft = useWorkloadDraft()
  const runGen = useRef(0)
  const paintFrame = useRef(0)
  const [sessionReady, setSessionReady] = useState(false)

  const onSelectNode = useCallback((next?: CanvasSelection) => {
    setSelected((current) => {
      if (
        current?.id === next?.id &&
        current?.title === next?.title &&
        current?.catalogId === next?.catalogId &&
        current?.kind === next?.kind &&
        current?.parentId === next?.parentId
      ) {
        return current
      }
      return next
    })
  }, [])

  const onSelectCanvasEdge = useCallback((edge?: Edge) => {
    setSelectedEdgeId((current) => {
      const id = edge?.id
      return current === id ? current : id
    })
  }, [])

  const onSelectIds = useCallback((ids: string[]) => {
    setSelectedIds((current) => (current.join(',') === ids.join(',') ? current : ids))
  }, [])

  const onSelectEdgeIds = useCallback((ids: string[]) => {
    setSelectedEdgeIds((current) => (current.join(',') === ids.join(',') ? current : ids))
  }, [])

  useEffect(() => {
    setCanvasReady(true)
  }, [])

  useEffect(() => {
    let frames = 0
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      frames += 1
      if (now - last >= 500) {
        const next = Math.round((frames * 1000) / (now - last))
        if (next > 0) setFps(next)
        frames = 0
        last = now
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const liveCost = costFromProfiles(library.profiles)
  const kpisToShow = ran
    ? { ...kpis, cost: liveCost.value, costHint: liveCost.hint }
    : kpisFromDraft(draft, library.profiles)
  const modeMeta = RUN_MODES.find((item) => item.id === draft.mode) ?? RUN_MODES[0]!
  const arrivals = useMemo(() => {
    if (draft.mode !== 'discrete') return 0
    return expectedArrivals(compileCanvas(nodes, edges, draft, getProfiles(), getFault()).workload)
  }, [nodes, edges, draft, library])
  const discreteBlocked = draft.mode === 'discrete' && arrivals > DISCRETE_EVENT_GUARD
  const challengeScore =
    challengeId === AKS_HEADROOM_CHALLENGE.id ? scoreAksHeadroom(lastRun) : undefined
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
        const inBlast = run.affectedComponentIds.includes(node.id)
        const blastOrigin = run.blastOriginId === node.id
        if (!stat || (filter !== 'all' && stat.offered <= 0 && stat.completed <= 0)) {
          return {
            ...node,
            data: {
              ...data,
              util: 0,
              p99: filter === 'all' ? 'no traffic' : `no ${filter}`,
              meta: `${run.mode} · ${filter === 'all' ? 'not on path' : `off ${filter} path`}`,
              inBlast,
              blastOrigin,
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
            inBlast,
            blastOrigin,
            queueDepth: `q ${stat.backlog.toFixed(1)}`,
            loss: stat.loss > 0 ? `loss ${(stat.loss * 100).toFixed(0)}%` : 'loss 0%',
          },
        }
      }),
    )
    setEdges((current) =>
      current.map((edge) => {
        const hit =
          run.affectedComponentIds.includes(edge.source) ||
          run.affectedComponentIds.includes(edge.target) ||
          run.breakerOpenEdges.includes(edge.id)
        return {
          ...edge,
          label: hopLabelWithRate(hopTypeLabel(edge), pickEdgeOffered(run, edge.id, filter)),
          style: {
            ...edge.style,
            stroke: hit ? '#B3261E' : '#7B8794',
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
          data: {
            ...data,
            util: stat.util,
            p99: stat.p99,
            meta: `${stat.meta} · live`,
            queueDepth: `q ${stat.backlog.toFixed(1)}`,
            loss: `loss ${(stat.loss * 100).toFixed(0)}%`,
          },
        }
      }),
    )
  }

  function onLoadReference(provider: MappedProvider = 'generic') {
    const graph = referenceStackGraph(provider)
    const label =
      provider === 'generic' ? 'Generic' : provider === 'aws' ? 'AWS' : provider === 'gcp' ? 'GCP' : 'Azure'
    setNodes(graph.nodes)
    setEdges(graph.edges)
    replaceProfiles(referenceStackProfiles)
    setWorkloadDraft(referenceWorkloadDraft())
    setScene('reference')
    setRan(false)
    setLastRun(undefined)
    setKpis(idleKpis)
    setBottlenecks([])
    setSelected(undefined)
    setSelectedIds([])
    setRunError(undefined)
    setProjectName(`${label} reference stack`)
    setSavedHint('Local draft')
    setRunHint(`${label} reference · Estimated capacities · catalog bindings only`)
  }

  function onRestoreExample() {
    setNodes(initialNodes)
    setEdges(initialEdges)
    replaceProfiles(structuredClone(youtubeSeedProfiles))
    setWorkloadDraft(defaultWorkloadDraft())
    setScene('youtube')
    setProjectName('Example: Video streaming platform (YouTube-style)')
    setSavedHint('Local draft')
    setRan(false)
    setLastRun(undefined)
    setKpis(idleKpis)
    setBottlenecks(seedBottlenecks)
    setSelected(undefined)
    setSelectedIds([])
    setRunError(undefined)
    setRunHint(undefined)
  }

  function currentSnapshot() {
    return snapshotFrom({
      name: projectName,
      scene,
      nodes,
      edges,
      draft: getWorkloadDraft(),
      profiles: getProfiles(),
      fault: getFault(),
    })
  }

  function applySnapshot(snapshot: TopologySnapshot, hint: string) {
    setNodes(snapshot.nodes)
    setEdges(snapshot.edges)
    setWorkloadDraft(snapshot.draft)
    replaceProfiles(snapshot.profiles)
    setFault(snapshot.fault)
    setScene(snapshot.scene)
    setProjectName(snapshot.name)
    setRan(false)
    setLastRun(undefined)
    setKpis(idleKpis)
    setBottlenecks(snapshot.scene === 'youtube' ? seedBottlenecks : [])
    setSelected(undefined)
    setSelectedIds([])
    setSelectedEdgeId(undefined)
    setRunError(undefined)
    setSavedHint(hint)
    setRunHint(hint)
  }

  function onSave() {
    const store = browserStore()
    if (!store) {
      setRunError('localStorage is not available in this tab.')
      return
    }
    upsertProject(store, currentSnapshot())
    setSavedHint('Saved to Projects')
  }

  function onExport() {
    const snapshot = currentSnapshot()
    const blob = new Blob([serializeSnapshot(snapshot)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = snapshotFilename(snapshot)
    link.click()
    URL.revokeObjectURL(url)
    setSavedHint('Exported JSON')
  }

  function onCopyLink() {
    const url = shareUrlFor(currentSnapshot(), window.location.href)
    if (!url) {
      setRunError('Snapshot too large for a URL. Export JSON instead.')
      return
    }
    void navigator.clipboard.writeText(url).then(
      () => setSavedHint('Copied share link'),
      () => setRunError('Clipboard is not available. Copy from the address bar after Export.'),
    )
  }

  function onInventory() {
    const payload = architectureInventory(projectName, nodes, edges)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sds-inventory.json'
    link.click()
    URL.revokeObjectURL(url)
    setSavedHint('Inventory JSON · not executable IaC')
  }

  function onGroup() {
    const result = wrapInSubsystem(nodes, selectedIds)
    if ('error' in result) {
      setRunError(result.error)
      return
    }
    setNodes(result.nodes)
    setScene('custom')
    setSavedHint('Nested subsystem')
    setRunError(undefined)
  }

  function onDeleteSelection() {
    const edgeIds = selectedEdgeIds.length
      ? selectedEdgeIds
      : selectedEdgeId
        ? [selectedEdgeId]
        : []
    if (selectedIds.length === 0 && edgeIds.length === 0) return
    const next = deleteSelection(nodes, edges, selectedIds, edgeIds)
    setNodes(next.nodes)
    setEdges(next.edges)
    setSelected(undefined)
    setSelectedIds([])
    setSelectedEdgeId(undefined)
    setSelectedEdgeIds([])
    setConnectFromId(undefined)
    setScene('custom')
    setSavedHint('Deleted selection')
    setRunError(undefined)
  }

  function onToggleConnect() {
    setConnectClick((current) => !current)
    setConnectFromId(undefined)
    setRunError(undefined)
  }

  function onImportFile(file: File) {
    void file.text().then((text) => {
      const snapshot = parseSnapshot(text)
      if (!snapshot) {
        setRunError('Not an SDS snapshot. Need version 1 JSON with nodes, edges, draft, and profiles.')
        return
      }
      applySnapshot(snapshot, `Imported ${snapshot.name}`)
    })
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

  useEffect(() => {
    const snapshot = boot.current?.snapshot
    if (snapshot) {
      setWorkloadDraft(snapshot.draft)
      replaceProfiles(snapshot.profiles)
      setFault(snapshot.fault)
      setRunHint(`Loaded ${snapshot.name}`)
    }
    setSessionReady(true)
  }, [])

  useEffect(() => {
    if (!sessionReady) return
    const store = browserStore()
    if (!store) return
    const handle = window.setTimeout(() => {
      saveCurrent(store, currentSnapshot())
    }, 250)
    return () => window.clearTimeout(handle)
  }, [sessionReady, nodes, edges, draft, library.fault, scene, projectName])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }
      const hasEdge = selectedEdgeIds.length > 0 || Boolean(selectedEdgeId)
      if (selectedIds.length === 0 && !hasEdge) return
      event.preventDefault()
      onDeleteSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const statusTone = discreteBlocked || runError ? 'error.main' : 'text.secondary'
  const statusText = discreteBlocked
    ? `Discrete-event would schedule about ${Math.round(arrivals).toLocaleString()} arrivals (guard ${DISCRETE_EVENT_GUARD.toLocaleString()}). Use fluid, or lower rate / duration.`
    : runError
      ? runError
      : [
          running ? 'Running on a Web Worker' : ran ? 'Last run from @sds/engine' : modeMeta.hint,
          library.fault !== 'none' ? `fault ${library.fault}` : undefined,
          runHint,
          running && fps > 0 ? `${fps} FPS` : undefined,
        ]
          .filter(Boolean)
          .join(' · ')
  const nothingSelected =
    selectedIds.length === 0 && selectedEdgeIds.length === 0 && !selectedEdgeId

  return (
    <IconModeProvider>
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="workspace" />
      <Stack
        direction="row"
        sx={{ alignItems: 'center', px: 1.5, py: 0.75, gap: 1, minHeight: 44 }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {projectName}
        </Typography>
        <Chip label={savedHint} sx={savedChipSx(savedHint)} />
        <Stack direction="row" spacing={0.25} sx={{ ml: 0.5 }}>
          <Tooltip title={connectFromId ? 'Click a target component' : 'Connect'}>
            <IconButton
              color={connectClick ? 'primary' : 'default'}
              onClick={onToggleConnect}
              aria-label={connectFromId ? 'Click target' : 'Connect'}
              aria-pressed={connectClick}
            >
              <CableIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <span>
              <IconButton
                color="error"
                onClick={onDeleteSelection}
                disabled={nothingSelected}
                aria-label="Delete"
              >
                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Group">
            <span>
              <IconButton
                onClick={onGroup}
                disabled={selectedIds.length < 2}
                aria-label="Group"
              >
                <AccountTreeIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <FileMenu
          onSave={onSave}
          onCopyLink={onCopyLink}
          onExport={onExport}
          onImportFile={onImportFile}
          onInventory={onInventory}
        />
        <RunModeToggle compact disabled={running} />
        <Button
          variant="contained"
          onClick={() => void onRun()}
          disabled={running || discreteBlocked}
          title={
            discreteBlocked
              ? 'Discrete-event would schedule too many arrivals. Use fluid, or lower rate / duration.'
              : modeMeta.hint
          }
        >
          {running ? 'Running…' : 'Run'}
        </Button>
      </Stack>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          bgcolor: 'background.paper',
          px: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          gap: 1.5,
        }}
      >
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label="Canvas" />
          <Tab label="Workload" />
          <Tab label="Faults" />
        </Tabs>
        {tab === 0 ? (
          <>
            <ClassFilterChips value={classFilter} onChange={setClassFilter} />
            <HeatLegend />
          </>
        ) : null}
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <KpiStat label="LOAD" value={kpisToShow.load} hint={kpisToShow.loadHint} />
        <KpiStat label="LATENCY" value={kpisToShow.latency} hint={kpisToShow.latencyHint} />
        <KpiStat label="ERRORS" value={kpisToShow.errors} hint="of requests" />
        <KpiStat
          label="BOTTLENECKS"
          value={kpisToShow.bottlenecks}
          hint={kpisToShow.bottleneckHint}
        />
        <KpiStat label="COST" value={kpisToShow.cost} hint={kpisToShow.costHint} />
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          px: 1.5,
          py: 0.5,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 28,
        }}
      >
        <Typography
          sx={{
            fontSize: 11,
            color: statusTone,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {statusText}
        </Typography>
        {challengeScore ? (
          <Chip
            label={`${AKS_HEADROOM_CHALLENGE.title}: ${challengeScore.status} · ${challengeScore.detail}`}
            sx={{
              height: 'auto',
              py: 0.25,
              maxWidth: 420,
              '& .MuiChip-label': { whiteSpace: 'normal' },
              bgcolor:
                challengeScore.status === 'pass'
                  ? 'success.light'
                  : challengeScore.status === 'fail'
                    ? 'error.light'
                    : 'action.hover',
            }}
          />
        ) : null}
      </Stack>
      <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
        {tab === 0 && (
          <>
            <Palette onLoadReference={onLoadReference} onRestoreExample={onRestoreExample} />
            {canvasReady ? (
              <ArchitectureCanvas
                nodes={nodes}
                edges={edges}
                classFilter={classFilter}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                setNodes={setNodes}
                setEdges={setEdges}
                onSelect={onSelectNode}
                onSelectEdge={onSelectCanvasEdge}
                onSelectIds={onSelectIds}
                onSelectEdgeIds={onSelectEdgeIds}
                connectClick={connectClick}
                connectFromId={connectFromId}
                onConnectFrom={setConnectFromId}
                onConnectError={setRunError}
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
            <Inspector
              bottlenecks={shownBottlenecks}
              selected={selected}
              selectedSize={(() => {
                if (selected?.kind !== 'zone') return undefined
                const zone = nodes.find((node) => node.id === selected.id)
                return zone ? zoneSize(zone) : undefined
              })()}
              selectedEdge={edges.find((edge) => edge.id === selectedEdgeId)}
              onEdgeChange={(edge) =>
                setEdges((current) => current.map((item) => (item.id === edge.id ? edge : item)))
              }
              onZoneChange={(id, next) => {
                setNodes((current) => patchZone(current, id, next))
                if (next.data?.label || next.data?.provider) {
                  setSelected((current) =>
                    current?.id === id
                      ? {
                          ...current,
                          title: next.data?.label ?? current.title,
                          provider: next.data?.provider ?? current.provider,
                        }
                      : current,
                  )
                }
              }}
              onServiceTitleChange={(id, title) => {
                setNodes((current) => patchServiceTitle(current, id, title))
                setSelected((current) =>
                  current?.id === id ? { ...current, title } : current,
                )
              }}
              onReleaseFromZone={() => {
                if (!selected?.id) return
                setNodes((current) => releaseFromZone(current, selected.id))
                setSelected((current) => (current ? { ...current, parentId: undefined } : current))
              }}
              onDeleteNode={onDeleteSelection}
              onDeleteEdge={onDeleteSelection}
              affectedIds={lastRun?.affectedComponentIds ?? []}
              blastOriginId={lastRun?.blastOriginId}
              breakerOpenEdges={lastRun?.breakerOpenEdges ?? []}
            />
          </>
        )}
        {tab === 1 && <WorkloadEditor />}
        {tab === 2 && <FaultsPanel />}
      </Box>
    </Box>
    </IconModeProvider>
  )
}

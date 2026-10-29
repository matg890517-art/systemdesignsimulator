import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import CableIcon from '@mui/icons-material/Cable'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import RedoIcon from '@mui/icons-material/Redo'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import UndoIcon from '@mui/icons-material/Undo'
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useHotkeys } from '@tanstack/react-hotkeys'
import { useEdgesState, useNodesState, type Edge, type Node } from '@xyflow/react'
import { KpiStat } from '../../components/KpiStat.tsx'
import { TopNav } from '../../components/TopNav.tsx'
import { ArchitectureCanvas, type CanvasFocusRequest } from './ArchitectureCanvas.tsx'
import { focusRoleForBottleneck, nextFieldFocus, type FieldFocusRequest } from './bottleneck-focus.ts'
import { nextNotice, noticeDurationMs, noticeSeverityForHint, type Notice, type NoticeSeverity } from './notices.ts'
import { ClassFilterChips } from './ClassFilterChips.tsx'
import { FileMenu } from './FileMenu.tsx'
import { HeatLegend } from './HeatLegend.tsx'
import { Inspector } from './Inspector.tsx'
import { Palette } from './Palette.tsx'
import { IconModeProvider } from './icon-mode.tsx'
import { deleteSelection, patchServiceTitle } from './canvas-edit.ts'
import { routeEdges } from './edge-handles.ts'
import {
  canRedo,
  canUndo,
  emptyHistory,
  recordHistory,
  redoHistory,
  structuralKey,
  undoHistory,
  type CanvasHistory,
  type CanvasSnapshot,
} from './history.ts'
import { WORKSPACE_HOTKEYS, withHotkey } from './hotkeys.ts'
import { WorkloadEditor } from './WorkloadEditor.tsx'
import { initialEdges, initialNodes } from './graph.ts'
import { expectedArrivals } from '@sds/engine'
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
import { isRunStopped, runWorkspaceAsync, stopWorkspaceRun } from './engine-client.ts'
import { getWorkloadDraft, setWorkloadDraft, useWorkloadDraft } from './workload-store.ts'
import {
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  kindForNode,
  nodeCarriesClass,
  type ClassFilter,
} from './compile.ts'
import { RunModeToggle } from './RunModeToggle.tsx'
import { ShowModeToggle } from './ShowModeToggle.tsx'
import { type ShowMode } from './display-mode.ts'
import { RUN_MODES, isSimulatedMode, normalizeRunMode } from './run-mode.ts'
import {
  activeRecord,
  chooseRun,
  getRunHistory,
  publishRun,
  rankingFromNodes,
  runMenuLabel,
  useRunHistory,
} from './run-history.ts'
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
import { hopLabelWithRate, hopTypeLabel, readEdgeData } from './edge-data.ts'
import { PlaybackBar, type PlaybackSpeed } from './PlaybackBar.tsx'
import { canPlayback, playbackWallMs, PLAY_PAINT_MS, viewRunAt } from './playback.ts'
import { architectureInventory } from './inventory.ts'
import { shareUrlFor, snapshotFromHref } from './share.ts'
import { wrapInSubsystem } from './subsystem.ts'
import { costFromCanvas } from './node-profile.ts'
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
  const [drawer, setDrawer] = useState<'workload' | 'faults' | null>(null)
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
  const runHistory = useRunHistory()
  const runGen = useRef(0)
  const paintFrame = useRef(0)
  const playFrame = useRef(0)
  const lastRunRef = useRef<WorkspaceRun | undefined>(undefined)
  const classFilterRef = useRef(classFilter)
  const playheadRef = useRef(0)
  const playingBackRef = useRef(false)
  const playTokenRef = useRef(0)
  const lastPlayPaintAt = useRef(0)
  const [playhead, setPlayhead] = useState(0)
  const [playingBack, setPlayingBack] = useState(false)
  const [playSpeed, setPlaySpeed] = useState<PlaybackSpeed>(1)
  const [showMode, setShowMode] = useState<ShowMode>('instant')
  const [fitNonce, setFitNonce] = useState(0)
  const playSpeedRef = useRef<PlaybackSpeed>(1)
  const showModeRef = useRef<ShowMode>('instant')
  lastRunRef.current = lastRun
  classFilterRef.current = classFilter
  playSpeedRef.current = playSpeed
  showModeRef.current = showMode
  const [sessionReady, setSessionReady] = useState(false)
  const [history, setHistory] = useState<CanvasHistory>(emptyHistory)
  const [notice, setNotice] = useState<Notice>()
  const [fieldFocus, setFieldFocus] = useState<FieldFocusRequest>()
  const [canvasFocus, setCanvasFocus] = useState<CanvasFocusRequest>()
  const lastStructural = useRef<{ key: string; snapshot: CanvasSnapshot }>({
    key: structuralKey(boot.current.nodes, boot.current.edges),
    snapshot: { nodes: boot.current.nodes, edges: boot.current.edges },
  })
  const applyingHistory = useRef(false)
  const quotaWarned = useRef(false)

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

  const notify = useCallback((message: string, severity: NoticeSeverity) => {
    setNotice((current) => nextNotice(current, message, severity))
  }, [])

  // Errors and confirmations surface as toasts. The status line keeps the inline copy.
  function fail(message: string) {
    setRunError(message)
    notify(message, 'error')
  }

  function confirmSaved(hint: string) {
    setSavedHint(hint)
    const severity = noticeSeverityForHint(hint)
    if (severity) notify(hint, severity)
  }

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

  const liveCost = costFromCanvas(nodes, library.profiles)
  const kpisToShow = ran
    ? { ...kpis, cost: liveCost.value, costHint: liveCost.hint }
    : kpisFromDraft(draft, library.profiles, nodes, edges)
  const modeMeta = RUN_MODES.find((item) => item.id === draft.mode) ?? RUN_MODES[0]!
  const arrivals = useMemo(() => {
    if (normalizeRunMode(draft.mode) !== 'simulated') return 0
    return expectedArrivals(compileCanvas(nodes, edges, draft, getProfiles(), getFault()).workload)
  }, [nodes, edges, draft, library])
  const discreteBlocked = isSimulatedMode(draft.mode) && arrivals > DISCRETE_EVENT_GUARD
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

  function paintRun(run: WorkspaceRun, filter: ClassFilter, live = false) {
    const blastIds = run.affectedComponentIds ?? []
    const breakerEdges = run.breakerOpenEdges ?? []
    setNodes((current) =>
      current.map((node) => {
        if (node.type === 'zone') return node
        const data = node.data as ServiceNodeData
        const stat = pickNodeStat(run, node.id, filter)
        const inBlast = blastIds.includes(node.id)
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
              live,
            },
          }
        }
        return {
          ...node,
          data: {
            ...data,
            util: stat.util,
            p99: stat.p99,
            meta: live
              ? `${filter === 'all' ? stat.meta : `${stat.meta} · ${filter}`} · live`
              : filter === 'all'
                ? stat.meta
                : `${stat.meta} · ${filter}`,
            inBlast,
            blastOrigin,
            live,
            queueDepth: `q ${stat.backlog.toFixed(1)}`,
            loss: stat.loss > 0 ? `loss ${(stat.loss * 100).toFixed(0)}%` : 'loss 0%',
          },
        }
      }),
    )
    setEdges((current) =>
      current.map((edge) => {
        const offered = pickEdgeOffered(run, edge.id, filter) ?? 0
        const hit =
          blastIds.includes(edge.source) ||
          blastIds.includes(edge.target) ||
          breakerEdges.includes(edge.id)
        const extra = readEdgeData(edge)
        return {
          ...edge,
          animated: false,
          data: { ...extra, flowRps: offered },
          label: hopLabelWithRate(hopTypeLabel(edge), offered > 0 ? offered : undefined),
          style: {
            ...edge.style,
            stroke: hit ? '#B3261E' : '#7B8794',
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
    setFitNonce((n) => n + 1)
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
    setFitNonce((n) => n + 1)
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
    confirmSaved(hint)
    setRunHint(hint)
    setFitNonce((n) => n + 1)
  }

  function onSave() {
    const store = browserStore()
    if (!store) {
      fail('localStorage is not available in this tab.')
      return
    }
    try {
      upsertProject(store, currentSnapshot())
    } catch (error) {
      fail(
        error instanceof Error && error.name === 'QuotaExceededError'
          ? 'Browser storage is full. Export JSON to keep this project.'
          : `Save failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return
    }
    confirmSaved('Saved to Projects')
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
    confirmSaved('Exported JSON')
  }

  function onCopyLink() {
    const url = shareUrlFor(currentSnapshot(), window.location.href)
    if (!url) {
      fail('Snapshot too large for a URL. Export JSON instead.')
      return
    }
    void navigator.clipboard.writeText(url).then(
      () => confirmSaved('Copied share link'),
      () => fail('Clipboard is not available. Copy from the address bar after Export.'),
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
    confirmSaved('Inventory JSON · not executable IaC')
  }

  function onGroup() {
    const result = wrapInSubsystem(nodes, selectedIds)
    if ('error' in result) {
      fail(result.error)
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
        fail('Not an SDS snapshot. Need version 1 JSON with nodes, edges, draft, and profiles.')
        return
      }
      applySnapshot(snapshot, `Imported ${snapshot.name}`)
    })
  }

  function clearLive() {
    setNodes((current) =>
      current.map((node) =>
        node.type !== 'zone' && (node.data as ServiceNodeData).live
          ? { ...node, data: { ...(node.data as ServiceNodeData), live: false } }
          : node,
      ),
    )
  }

  function showLastRun(run: WorkspaceRun, live: boolean) {
    const t = run.durationSec || run.ticks?.at(-1)?.t || 0
    setPlayhead(t)
    paintRun(viewRunAt(run, t, showModeRef.current), classFilterRef.current, live)
  }

  function stopPlayback() {
    playTokenRef.current += 1
    cancelAnimationFrame(playFrame.current)
    playingBackRef.current = false
    setPlayingBack(false)
  }

  function paintPlayhead(run: WorkspaceRun, t: number, now = performance.now(), force = false) {
    playheadRef.current = t
    setPlayhead(t)
    if (!force && now - lastPlayPaintAt.current < PLAY_PAINT_MS) return
    lastPlayPaintAt.current = now
    paintRun(viewRunAt(run, t, showModeRef.current), classFilterRef.current, false)
  }

  function startPlayback(run: WorkspaceRun, from = 0) {
    stopPlayback()
    if (!canPlayback(run)) {
      showLastRun(run, false)
      return
    }
    const duration = Math.max(run.durationSec, 1e-9)
    const startAt = Math.min(Math.max(0, from), duration)
    const wall = playbackWallMs(duration) / Math.max(0.25, playSpeedRef.current)
    const origin = performance.now() - (startAt / duration) * wall
    lastRunRef.current = run
    playingBackRef.current = true
    const token = ++playTokenRef.current
    setPlayingBack(true)
    paintPlayhead(run, startAt, performance.now(), true)
    const loop = (now: number) => {
      if (!playingBackRef.current || playTokenRef.current !== token) return
      const t = Math.min(duration, ((now - origin) / wall) * duration)
      const ended = t >= duration - 1e-9
      paintPlayhead(run, t, now, ended)
      if (ended) {
        playingBackRef.current = false
        setPlayingBack(false)
        return
      }
      playFrame.current = requestAnimationFrame(loop)
    }
    playFrame.current = requestAnimationFrame(loop)
  }

  function onScrubPlayback(t: number) {
    const run = lastRunRef.current
    if (!run || !canPlayback(run)) return
    stopPlayback()
    paintPlayhead(run, t, performance.now(), true)
  }

  function onTogglePlayback() {
    const run = lastRunRef.current
    if (!run || !canPlayback(run)) return
    if (playingBackRef.current) {
      stopPlayback()
      return
    }
    const atEnd = playheadRef.current >= (run.durationSec || 0) - 1e-6
    startPlayback(run, atEnd ? 0 : playheadRef.current)
  }

  function onPlaybackSpeed(next: PlaybackSpeed) {
    setPlaySpeed(next)
    playSpeedRef.current = next
    const run = lastRunRef.current
    if (run && playingBackRef.current) startPlayback(run, playheadRef.current)
  }

  function onStop() {
    // Bump the generation first so a result that was already in flight is ignored.
    runGen.current += 1
    cancelAnimationFrame(paintFrame.current)
    stopPlayback()
    const stopped = stopWorkspaceRun()
    setRunning(false)
    if (lastRun) {
      showLastRun(lastRun, false)
      setRunHint(`${lastRun.hint} · stopped a newer run`)
    } else {
      clearLive()
      setRunHint('stopped')
    }
    notify(stopped ? 'Run stopped. The canvas shows the last finished run.' : 'Nothing was running.', 'info')
  }

  async function onRun() {
    const id = runGen.current + 1
    runGen.current = id
    stopPlayback()
    setRunning(true)
    setRunError(undefined)
    setRunHint('worker · running')
    // Mark cards live immediately. A short fluid run can finish before the first progress frame.
    setNodes((current) =>
      current.map((node) =>
        node.type === 'zone'
          ? node
          : { ...node, data: { ...(node.data as ServiceNodeData), live: true } },
      ),
    )
    let live = true
    try {
      const result = await runWorkspaceAsync(
        {
          nodes,
          edges,
          draft: getWorkloadDraft(),
          profiles: getProfiles(),
          fault: getFault(),
          pace: isSimulatedMode(getWorkloadDraft().mode) ? 1 : undefined,
        },
        (progress) => {
          if (!live || runGen.current !== id) return
          playheadRef.current = progress.t
          setPlayhead(progress.t)
          setRunHint(`worker · live · t ${progress.t.toFixed(1)}s`)
          if (Object.keys(progress.nodeStats ?? {}).length === 0) return
          cancelAnimationFrame(paintFrame.current)
          paintFrame.current = requestAnimationFrame(() => {
            if (!live || runGen.current !== id) return
            paintRun(
              viewRunAt(
                {
                  mode: getWorkloadDraft().mode,
                  kpis: idleKpis,
                  bottlenecks: [],
                  nodeStats: progress.nodeStats,
                  classStats: progress.classStats ?? {},
                  edgeOffered: progress.edgeOffered ?? {},
                  edgeClassOffered: progress.edgeClassOffered ?? {},
                  ticks: [progress],
                  durationSec: progress.t,
                  hint: '',
                  affectedComponentIds: [],
                  breakerOpenEdges: [],
                },
                progress.t,
                showModeRef.current,
              ),
              classFilterRef.current,
              true,
            )
          })
        },
      )
      live = false
      cancelAnimationFrame(paintFrame.current)
      if (runGen.current !== id) return
      if (!result.ok) {
        clearLive()
        fail(result.reason)
        return
      }
      setRan(true)
      setKpis(result.run.kpis)
      setBottlenecks(result.run.bottlenecks)
      setRunHint(result.run.hint)
      setLastRun(result.run)
      lastRunRef.current = result.run
      publishRun({
        projectName,
        hint: result.run.hint,
        run: result.run,
        ranking: rankingFromNodes(nodes, result.run, getProfiles()),
      })
      showLastRun(result.run, false)
    } catch (error) {
      if (runGen.current !== id || isRunStopped(error)) return
      clearLive()
      fail(error instanceof Error ? error.message : String(error))
    } finally {
      if (runGen.current === id) setRunning(false)
    }
  }

  useEffect(() => {
    const run = lastRunRef.current
    if (!run) return
    const t = canPlayback(run)
      ? playheadRef.current
      : run.durationSec || run.ticks?.at(-1)?.t || 0
    paintRun(viewRunAt(run, t, showMode), classFilter, running)
    // Paint from the last engine run when the class filter or show mode changes. Node positions stay in setNodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, showMode])

  useEffect(() => {
    const snapshot = boot.current?.snapshot
    if (snapshot) {
      setWorkloadDraft(snapshot.draft)
      replaceProfiles(snapshot.profiles)
      setFault(snapshot.fault)
      setRunHint(`Loaded ${snapshot.name}`)
    }
    const active = activeRecord(getRunHistory())
    if (active) {
      setLastRun(active.run)
      setKpis(active.run.kpis)
      setBottlenecks(active.run.bottlenecks)
      setRan(true)
      setRunHint(active.run.hint)
    }
    setSessionReady(true)
    return () => {
      cancelAnimationFrame(paintFrame.current)
      cancelAnimationFrame(playFrame.current)
    }
  }, [])

  useEffect(() => {
    if (!sessionReady) return
    const store = browserStore()
    if (!store) return
    const handle = window.setTimeout(() => {
      try {
        saveCurrent(store, currentSnapshot())
        quotaWarned.current = false
      } catch {
        // Auto-save is best effort; warn once per overflow instead of every 250 ms.
        if (quotaWarned.current) return
        quotaWarned.current = true
        notify('Browser storage is full. Auto-save paused; Export JSON to keep this draft.', 'warning')
      }
    }, 250)
    return () => window.clearTimeout(handle)
  }, [sessionReady, nodes, edges, draft, library.fault, scene, projectName])

  // Attachment sides follow card centers. Same hop; only the handle ids change.
  useEffect(() => {
    setEdges((current) => routeEdges(nodes, current))
  }, [nodes, setEdges])

  // Undo history records structural edits (drop, connect, delete, group, load) from any
  // source, including the canvas's own setNodes/setEdges. Moves and renames are not recorded.
  useEffect(() => {
    const key = structuralKey(nodes, edges)
    if (key === lastStructural.current.key) return
    const previous = lastStructural.current.snapshot
    lastStructural.current = { key, snapshot: { nodes, edges } }
    if (applyingHistory.current) {
      applyingHistory.current = false
      return
    }
    setHistory((current) => recordHistory(current, previous))
  }, [nodes, edges])

  function clearSelection() {
    setSelected(undefined)
    setSelectedIds([])
    setSelectedEdgeId(undefined)
    setSelectedEdgeIds([])
    setConnectFromId(undefined)
  }

  function applyHistorySnapshot(snapshot: CanvasSnapshot, hint: string) {
    applyingHistory.current = true
    setNodes(snapshot.nodes)
    setEdges(snapshot.edges)
    clearSelection()
    setScene('custom')
    setSavedHint(hint)
    setRunError(undefined)
  }

  function onUndo() {
    const result = undoHistory(history, { nodes, edges })
    if (!result) return
    setHistory(result.history)
    applyHistorySnapshot(result.snapshot, 'Undo')
  }

  function onRedo() {
    const result = redoHistory(history, { nodes, edges })
    if (!result) return
    setHistory(result.history)
    applyHistorySnapshot(result.snapshot, 'Redo')
  }

  function onPickRun(id: number) {
    chooseRun(id)
    const record = getRunHistory().runs.find((item) => item.id === id)
    if (!record) return
    setRan(true)
    setKpis(record.run.kpis)
    setBottlenecks(record.run.bottlenecks)
    setLastRun(record.run)
    setRunHint(record.run.hint)
    stopPlayback()
    showLastRun(record.run, false)
  }

  function onEscape() {
    if (connectClick) {
      setConnectClick(false)
      setConnectFromId(undefined)
      setRunError(undefined)
      return
    }
    setNodes((current) =>
      current.map((node) => (node.selected ? { ...node, selected: false } : node)),
    )
    setEdges((current) =>
      current.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)),
    )
    clearSelection()
  }

  const hasSelection =
    selectedIds.length > 0 || selectedEdgeIds.length > 0 || Boolean(selectedEdgeId)

  /** Bottleneck row → select the node on the canvas → Config → the field the fix points at. */
  function onFocusBottleneck(id: string) {
    const node = nodes.find((item) => item.id === id && item.type !== 'zone')
    if (!node) return
    const data = node.data as ServiceNodeData
    setNodes((current) =>
      current.map((item) =>
        item.id === id ? { ...item, selected: true } : item.selected ? { ...item, selected: false } : item,
      ),
    )
    setEdges((current) =>
      current.map((edge) => (edge.selected ? { ...edge, selected: false } : edge)),
    )
    setSelectedEdgeId(undefined)
    setSelectedEdgeIds([])
    setSelectedIds([id])
    setSelected({
      id,
      title: data.title,
      catalogId: data.catalogId,
      kind: 'service',
      provider: data.provider,
      parentId: node.parentId,
    })
    const role = focusRoleForBottleneck(lastRun?.nodeStats[id])
    setFieldFocus((current) => nextFieldFocus(current, id, role))
    setCanvasFocus((current) => ({ nodeId: id, nonce: (current?.nonce ?? 0) + 1 }))
  }

  useHotkeys([
    {
      hotkey: WORKSPACE_HOTKEYS.run,
      callback: () => void onRun(),
      options: { enabled: !running && !discreteBlocked },
    },
    { hotkey: WORKSPACE_HOTKEYS.save, callback: onSave },
    // Keep native text undo inside fields; canvas undo only when focus is not in an input.
    {
      hotkey: WORKSPACE_HOTKEYS.undo,
      callback: onUndo,
      options: { enabled: canUndo(history), ignoreInputs: true },
    },
    {
      hotkey: WORKSPACE_HOTKEYS.redo,
      callback: onRedo,
      options: { enabled: canRedo(history), ignoreInputs: true },
    },
    { hotkey: WORKSPACE_HOTKEYS.delete, callback: onDeleteSelection, options: { enabled: hasSelection } },
    { hotkey: WORKSPACE_HOTKEYS.backspace, callback: onDeleteSelection, options: { enabled: hasSelection } },
    {
      hotkey: WORKSPACE_HOTKEYS.escape,
      callback: onEscape,
      options: { enabled: connectClick || hasSelection },
    },
  ])

  const statusTone = discreteBlocked || runError ? 'error.main' : 'text.secondary'
  const statusText = discreteBlocked
    ? `Simulated mode would schedule about ${Math.round(arrivals).toLocaleString()} arrivals (guard ${DISCRETE_EVENT_GUARD.toLocaleString()}). Use Analytic, or lower rate / duration.`
    : runError
      ? runError
      : [
          running
            ? 'Running on a Web Worker'
            : ran
              ? 'Last run from @sds/engine'
              : modeMeta.hint,
          library.fault !== 'none' ? `fault ${library.fault}` : undefined,
          runHint,
          running && fps > 0 ? `${fps} FPS` : undefined,
        ]
          .filter(Boolean)
          .join(' · ')
  const nothingSelected =
    selectedIds.length === 0 && selectedEdgeIds.length === 0 && !selectedEdgeId
  const serviceIds = useMemo(
    () => nodes.filter((node) => node.type !== 'zone').map((node) => node.id),
    [nodes],
  )

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
          <Tooltip
            title={
              connectFromId
                ? withHotkey('Click a target component. Cancel', 'escape')
                : connectClick
                  ? withHotkey('Connect: click source. Cancel', 'escape')
                  : 'Connect'
            }
          >
            <IconButton
              color={connectClick ? 'primary' : 'default'}
              onClick={onToggleConnect}
              aria-label={connectFromId ? 'Click target' : 'Connect'}
              aria-pressed={connectClick}
            >
              <CableIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title={withHotkey('Delete', 'delete')}>
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
          <Tooltip title={withHotkey('Undo', 'undo')}>
            <span>
              <IconButton onClick={onUndo} disabled={!canUndo(history)} aria-label="Undo">
                <UndoIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={withHotkey('Redo', 'redo')}>
            <span>
              <IconButton onClick={onRedo} disabled={!canRedo(history)} aria-label="Redo">
                <RedoIcon sx={{ fontSize: 18 }} />
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
        <Select
          size="small"
          displayEmpty
          value={activeRecord(runHistory)?.id ?? ''}
          disabled={runHistory.runs.length === 0 || running}
          onChange={(event) => onPickRun(Number(event.target.value))}
          renderValue={() => {
            const record = activeRecord(runHistory)
            return record ? runMenuLabel(record) : 'No runs yet'
          }}
          sx={{ minWidth: 168, maxWidth: 260, height: 32, fontSize: 12 }}
          aria-label="Run history"
        >
          {runHistory.runs.length === 0 ? (
            <MenuItem value="">No runs yet</MenuItem>
          ) : (
            runHistory.runs.map((item) => (
              <MenuItem key={item.id} value={item.id} sx={{ fontSize: 12 }}>
                {runMenuLabel(item)}
              </MenuItem>
            ))
          )}
        </Select>
        <RunModeToggle compact disabled={running} />
        <ShowModeToggle
          compact
          value={showMode}
          onChange={setShowMode}
          disabled={!isSimulatedMode(draft.mode)}
        />
        {running ? (
          <Button
            variant="outlined"
            color="error"
            onClick={onStop}
            startIcon={<StopRoundedIcon />}
            title="Stop the live clock. Simulated time freezes on the last painted tick."
          >
            Stop
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => void onRun()}
            disabled={discreteBlocked}
            title={
              discreteBlocked
                ? 'Simulated mode would schedule too many arrivals. Use Analytic, or lower rate / duration.'
                : withHotkey(modeMeta.hint, 'run')
            }
          >
            Run
          </Button>
        )}
      </Stack>
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
        <Button
          size="small"
          variant={drawer === 'workload' ? 'contained' : 'text'}
          onClick={() => setDrawer((current) => (current === 'workload' ? null : 'workload'))}
        >
          Workload
        </Button>
        <Button
          size="small"
          variant={drawer === 'faults' ? 'contained' : 'text'}
          onClick={() => setDrawer((current) => (current === 'faults' ? null : 'faults'))}
        >
          Faults
        </Button>
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
          <>
            <Palette
              nodes={nodes}
              onLoadReference={onLoadReference}
              onRestoreExample={onRestoreExample}
            />
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative', display: 'flex' }}>
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
                onConnectError={(message) => (message ? fail(message) : setRunError(undefined))}
                focusRequest={canvasFocus}
                fitNonce={fitNonce}
                onLoadReference={() => onLoadReference('generic')}
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
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                right: 8,
                zIndex: 5,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
                pointerEvents: 'none',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                  bgcolor: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: 1,
                }}
              >
                <KpiStat dense label="LOAD" value={kpisToShow.load} hint={kpisToShow.loadHint} />
                <KpiStat dense label="LATENCY" value={kpisToShow.latency} hint={kpisToShow.latencyHint} />
                <KpiStat dense label="ERRORS" value={kpisToShow.errors} hint="of requests" />
                <KpiStat
                  dense
                  label="BOTTLENECKS"
                  value={kpisToShow.bottlenecks}
                  hint={kpisToShow.bottleneckHint}
                />
                <KpiStat dense label="COST" value={kpisToShow.cost} hint={kpisToShow.costHint} />
              </Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignSelf: 'flex-start',
                  alignItems: 'center',
                  pointerEvents: 'auto',
                  bgcolor: 'rgba(255, 255, 255, 0.94)',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 1,
                  boxShadow: 1,
                }}
              >
                <ClassFilterChips value={classFilter} onChange={setClassFilter} />
                <HeatLegend />
              </Stack>
            </Box>
            {(running && isSimulatedMode(draft.mode)) || (!running && lastRun && canPlayback(lastRun)) ? (
              <Box
                sx={{
                  position: 'absolute',
                  left: 52,
                  right: 8,
                  bottom: 8,
                  zIndex: 5,
                }}
              >
                <PlaybackBar
                  t={playhead}
                  durationSec={running ? draft.durationSec : lastRun?.durationSec ?? draft.durationSec}
                  playing={running || playingBack}
                  speed={playSpeed}
                  showMode={showMode}
                  onToggle={running ? onStop : onTogglePlayback}
                  onScrub={running ? () => undefined : onScrubPlayback}
                  onSpeed={onPlaybackSpeed}
                />
              </Box>
            ) : null}
            </Box>
            <Inspector
              bottlenecks={shownBottlenecks}
              selected={selected}
              selectedSize={(() => {
                if (selected?.kind !== 'zone') return undefined
                const zone = nodes.find((node) => node.id === selected.id)
                return zone ? zoneSize(zone) : undefined
              })()}
              selectedEdge={edges.find((edge) => edge.id === selectedEdgeId)}
              loadBalancerSource={(() => {
                const hop = edges.find((edge) => edge.id === selectedEdgeId)
                const source = hop
                  ? nodes.find((node) => node.id === hop.source && node.type === 'service')
                  : undefined
                return source ? kindForNode(source as Node<ServiceNodeData>) === 'load_balancer' : false
              })()}
              lbBackendCount={(() => {
                const hop = edges.find((edge) => edge.id === selectedEdgeId)
                return hop ? edges.filter((edge) => edge.source === hop.source).length : 0
              })()}
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
              nodeIds={serviceIds}
              fieldFocus={fieldFocus}
              onFocusBottleneck={onFocusBottleneck}
              onNotice={notify}
            />
          </>
      </Box>
      <Drawer
        anchor="left"
        open={drawer === 'workload'}
        onClose={() => setDrawer(null)}
      >
        <Box sx={{ width: 440, maxWidth: '100vw', height: '100%', overflow: 'auto' }}>
          <WorkloadEditor nodes={nodes} edges={edges} />
        </Box>
      </Drawer>
      <Drawer
        anchor="left"
        open={drawer === 'faults'}
        onClose={() => setDrawer(null)}
      >
        <Box sx={{ width: 440, maxWidth: '100vw', height: '100%', overflow: 'auto' }}>
          <FaultsPanel />
        </Box>
      </Drawer>
      <Snackbar
        key={notice?.id}
        open={Boolean(notice)}
        autoHideDuration={notice ? noticeDurationMs(notice.severity) : null}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          setNotice(undefined)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 16 } }}
      >
        <Alert
          severity={notice?.severity ?? 'info'}
          variant="filled"
          onClose={() => setNotice(undefined)}
          sx={{ fontSize: 12, alignItems: 'center', maxWidth: 560, boxShadow: 3 }}
        >
          {notice?.message}
        </Alert>
      </Snackbar>
    </Box>
    </IconModeProvider>
  )
}

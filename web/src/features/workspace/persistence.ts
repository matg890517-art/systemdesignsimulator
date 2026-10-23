import type { CalibrationProfile } from '@sds/engine'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import type { FaultMode } from '../calibration/types.ts'
import { compileCanvas, type WorkloadDraft } from './compile.ts'
import { orderZonesBeforeChildren } from './environment.ts'
import type { ServiceNodeData, ZoneNodeData, WorkspaceNode } from './types.ts'

export const SNAPSHOT_VERSION = 1 as const
export const CURRENT_KEY = 'sds.current.v1'
export const PROJECTS_KEY = 'sds.projects.v1'

export type TopologySnapshot = {
  version: typeof SNAPSHOT_VERSION
  id: string
  name: string
  savedAt: string
  scene: 'youtube' | 'reference' | 'custom'
  nodes: Node<ServiceNodeData | ZoneNodeData>[]
  edges: RfEdge[]
  draft: WorkloadDraft
  profiles: CalibrationProfile[]
  fault: FaultMode
}

export type SnapshotStore = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function createMemoryStore(seed: Record<string, string> = {}): SnapshotStore {
  const data = { ...seed }
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

export function browserStore(): SnapshotStore | undefined {
  if (typeof localStorage === 'undefined') return undefined
  return localStorage
}

function persistableNodes(nodes: Node<ServiceNodeData | ZoneNodeData>[]) {
  return nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    parentId: node.parentId,
    style: node.style,
    draggable: node.draggable,
    selectable: node.selectable,
  }))
}

function persistableEdges(edges: RfEdge[]) {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    type: edge.type,
    style: edge.style,
    data: edge.data,
  }))
}

export function snapshotFrom(input: {
  id?: string
  name: string
  scene: TopologySnapshot['scene']
  nodes: Node<ServiceNodeData | ZoneNodeData>[]
  edges: RfEdge[]
  draft: WorkloadDraft
  profiles: CalibrationProfile[]
  fault: FaultMode
  savedAt?: string
}): TopologySnapshot {
  return JSON.parse(
    JSON.stringify({
      version: SNAPSHOT_VERSION,
      id: input.id ?? `proj-${input.draft.seed}-${Date.now()}`,
      name: input.name,
      savedAt: input.savedAt ?? new Date().toISOString(),
      scene: input.scene,
      nodes: persistableNodes(input.nodes),
      edges: persistableEdges(input.edges),
      draft: input.draft,
      profiles: input.profiles,
      fault: input.fault,
    }),
  ) as TopologySnapshot
}

export function serializeSnapshot(snapshot: TopologySnapshot): string {
  return JSON.stringify(snapshot, null, 2)
}

export function snapshotFilename(snapshot: TopologySnapshot): string {
  const slug = snapshot.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'sds-topology'}.sds.json`
}

export function parseSnapshot(raw: string): TopologySnapshot | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<TopologySnapshot>
    if (parsed.version !== SNAPSHOT_VERSION) return undefined
    if (!parsed.id || !parsed.name || !parsed.draft || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return undefined
    }
    if (parsed.draft.mode !== 'fluid' && parsed.draft.mode !== 'discrete') return undefined
    if (!Array.isArray(parsed.profiles)) return undefined
    const normalized = parsed.nodes.map((node) => {
      if (node.type === 'zone') {
        const data = node.data as ZoneNodeData
        const label =
          data?.provider === 'generic' && data.label === 'Environment' ? 'Subsystem' : data?.label
        return {
          ...node,
          draggable: true,
          selectable: true,
          data: { ...data, label },
        }
      }
      const data = node.data as ServiceNodeData
      const catalogId =
        data?.catalogId ??
        (node.id === 'viewers' || node.id === 'uploaders' ? 'generic-clients' : undefined)
      return {
        ...node,
        extent: undefined,
        data: catalogId ? { ...data, catalogId } : data,
      }
    }) as WorkspaceNode[]
    parsed.nodes = orderZonesBeforeChildren(normalized)
    return parsed as TopologySnapshot
  } catch {
    return undefined
  }
}

export function compileSnapshot(snapshot: TopologySnapshot) {
  return compileCanvas(snapshot.nodes, snapshot.edges, snapshot.draft, snapshot.profiles, snapshot.fault)
}

export function loadCurrent(store: SnapshotStore): TopologySnapshot | undefined {
  const raw = store.getItem(CURRENT_KEY)
  return raw ? parseSnapshot(raw) : undefined
}

export function saveCurrent(store: SnapshotStore, snapshot: TopologySnapshot) {
  store.setItem(CURRENT_KEY, serializeSnapshot(snapshot))
}

export function listProjects(store: SnapshotStore): TopologySnapshot[] {
  const raw = store.getItem(PROJECTS_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => parseSnapshot(JSON.stringify(item)))
      .filter((item): item is TopologySnapshot => Boolean(item))
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  } catch {
    return []
  }
}

export function upsertProject(store: SnapshotStore, snapshot: TopologySnapshot) {
  const rest = listProjects(store).filter((item) => item.id !== snapshot.id)
  store.setItem(PROJECTS_KEY, JSON.stringify([snapshot, ...rest]))
  saveCurrent(store, snapshot)
}

export function deleteProject(store: SnapshotStore, id: string) {
  store.setItem(PROJECTS_KEY, JSON.stringify(listProjects(store).filter((item) => item.id !== id)))
}

export function pendingOpenKey() {
  return 'sds.open.v1'
}

export function queueOpen(store: SnapshotStore, snapshot: TopologySnapshot) {
  store.setItem(pendingOpenKey(), serializeSnapshot(snapshot))
  saveCurrent(store, snapshot)
}

export function takeQueuedOpen(store: SnapshotStore): TopologySnapshot | undefined {
  const raw = store.getItem(pendingOpenKey())
  if (!raw) return undefined
  store.removeItem(pendingOpenKey())
  return parseSnapshot(raw)
}

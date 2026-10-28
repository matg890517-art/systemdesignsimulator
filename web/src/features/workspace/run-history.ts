import { useSyncExternalStore } from 'react'
import type { Node } from '@xyflow/react'
import type { RankRow, ServiceNodeData, WorkspaceRun, ZoneNodeData } from './types.ts'

export const RUN_HISTORY_LIMIT = 12
const STORAGE_KEY = 'sds.runs.v1'

export type RunRecord = {
  id: number
  at: string
  projectName: string
  hint: string
  run: WorkspaceRun
  ranking: RankRow[]
}

export type RunHistory = {
  runs: RunRecord[]
  activeId?: number
}

const PROVIDER_LABEL: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  kubernetes: 'Kubernetes',
  generic: 'Generic',
}

export function emptyRunHistory(): RunHistory {
  return { runs: [] }
}

export function runMenuLabel(record: RunRecord): string {
  const date = new Date(record.at)
  const when = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  const mode = record.hint.split('·')[0]?.trim() || 'run'
  return `${when} · ${mode} · ${record.projectName}`
}

/** Services only, hottest first. Generators are traffic sources, not ranked capacity. */
export function rankingFromNodes(
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  run: WorkspaceRun,
): RankRow[] {
  const rows: RankRow[] = []
  for (const node of nodes) {
    if (node.type === 'zone') continue
    const data = node.data as ServiceNodeData
    const stat = run.nodeStats[node.id]
    if (!stat || stat.meta.includes('generator')) continue
    rows.push({
      id: node.id,
      title: data.title,
      provider: PROVIDER_LABEL[data.provider] ?? data.provider,
      util: stat.util,
      p99: stat.p99,
      source: 'engine',
      citation: stat.citation,
    })
  }
  return rows.sort((a, b) => b.util - a.util || a.title.localeCompare(b.title))
}

export function appendRun(
  history: RunHistory,
  input: Omit<RunRecord, 'id' | 'at'> & { at?: string },
): RunHistory {
  const id = (history.runs[0]?.id ?? 0) + 1
  const record: RunRecord = {
    id,
    at: input.at ?? new Date().toISOString(),
    projectName: input.projectName,
    hint: input.hint,
    run: input.run,
    ranking: input.ranking,
  }
  return {
    runs: [record, ...history.runs].slice(0, RUN_HISTORY_LIMIT),
    activeId: id,
  }
}

export function focusRun(history: RunHistory, id: number): RunHistory {
  if (!history.runs.some((record) => record.id === id)) return history
  return { ...history, activeId: id }
}

export function activeRecord(history: RunHistory): RunRecord | undefined {
  return history.runs.find((record) => record.id === history.activeId) ?? history.runs[0]
}

type Store = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function browserSession(): Store | undefined {
  if (typeof sessionStorage === 'undefined') return undefined
  return sessionStorage
}

function readHistory(store: Store | undefined): RunHistory {
  if (!store) return emptyRunHistory()
  const raw = store.getItem(STORAGE_KEY)
  if (!raw) return emptyRunHistory()
  try {
    const parsed = JSON.parse(raw) as Partial<RunHistory>
    if (!Array.isArray(parsed.runs)) return emptyRunHistory()
    return { runs: parsed.runs, activeId: parsed.activeId }
  } catch {
    return emptyRunHistory()
  }
}

let state: RunHistory = readHistory(browserSession())
const listeners = new Set<() => void>()

function persist() {
  const store = browserSession()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Session storage is a convenience. The in-memory list still drives this tab.
  }
}

function emit(next: RunHistory) {
  state = next
  persist()
  for (const listener of listeners) listener()
}

export function getRunHistory(): RunHistory {
  return state
}

export function useRunHistory(): RunHistory {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getRunHistory,
    getRunHistory,
  )
}

export function publishRun(input: Omit<RunRecord, 'id' | 'at'> & { at?: string }): RunRecord {
  emit(appendRun(state, input))
  return activeRecord(state)!
}

export function chooseRun(id: number) {
  emit(focusRun(state, id))
}

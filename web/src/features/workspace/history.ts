import type { Edge } from '@xyflow/react'
import type { WorkspaceNode } from './types.ts'

/** Canvas undo history. Structural changes only: nodes or edges added or removed. */
export type CanvasSnapshot = { nodes: WorkspaceNode[]; edges: Edge[] }

export type CanvasHistory = { past: CanvasSnapshot[]; future: CanvasSnapshot[] }

export const HISTORY_LIMIT = 20

export const emptyHistory: CanvasHistory = { past: [], future: [] }

/** Sorted node and edge ids. Equal keys mean a move or a relabel, not a structural edit. */
export function structuralKey(nodes: WorkspaceNode[], edges: Edge[]): string {
  const nodeIds = nodes.map((node) => `${node.id}:${node.parentId ?? ''}`).sort()
  const edgeIds = edges.map((edge) => edge.id).sort()
  return `${nodeIds.join(',')}|${edgeIds.join(',')}`
}

/** Push the state that is about to be replaced. Any new edit drops the redo stack. */
export function recordHistory(history: CanvasHistory, previous: CanvasSnapshot): CanvasHistory {
  const past = [...history.past, previous]
  return { past: past.slice(Math.max(0, past.length - HISTORY_LIMIT)), future: [] }
}

export function undoHistory(
  history: CanvasHistory,
  current: CanvasSnapshot,
): { history: CanvasHistory; snapshot: CanvasSnapshot } | undefined {
  const snapshot = history.past.at(-1)
  if (!snapshot) return undefined
  return {
    history: { past: history.past.slice(0, -1), future: [...history.future, current] },
    snapshot,
  }
}

export function redoHistory(
  history: CanvasHistory,
  current: CanvasSnapshot,
): { history: CanvasHistory; snapshot: CanvasSnapshot } | undefined {
  const snapshot = history.future.at(-1)
  if (!snapshot) return undefined
  return {
    history: { past: [...history.past, current], future: history.future.slice(0, -1) },
    snapshot,
  }
}

export function canUndo(history: CanvasHistory): boolean {
  return history.past.length > 0
}

export function canRedo(history: CanvasHistory): boolean {
  return history.future.length > 0
}

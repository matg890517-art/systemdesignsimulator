import { describe, expect, it } from 'vitest'
import type { Edge } from '@xyflow/react'
import { hotkeyLabel, WORKSPACE_HOTKEYS, withHotkey } from './hotkeys.ts'
import {
  canRedo,
  canUndo,
  emptyHistory,
  HISTORY_LIMIT,
  recordHistory,
  redoHistory,
  structuralKey,
  undoHistory,
  type CanvasSnapshot,
} from './history.ts'
import type { WorkspaceNode } from './types.ts'

function node(id: string, x = 0, parentId?: string): WorkspaceNode {
  return {
    id,
    type: 'service',
    position: { x, y: 0 },
    parentId,
    data: { title: id, util: 0, p99: '', meta: '', provider: 'generic' },
  }
}

function edge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target }
}

describe('workspace hotkeys', () => {
  it('declares run, save, undo, redo, delete and escape with Mod bindings', () => {
    expect(WORKSPACE_HOTKEYS.run).toBe('Mod+Enter')
    expect(WORKSPACE_HOTKEYS.save).toBe('Mod+S')
    expect(WORKSPACE_HOTKEYS.undo).toBe('Mod+Z')
    expect(WORKSPACE_HOTKEYS.redo).toBe('Mod+Shift+Z')
    expect(WORKSPACE_HOTKEYS.delete).toBe('Delete')
    expect(WORKSPACE_HOTKEYS.escape).toBe('Escape')
  })

  it('formats labels per platform', () => {
    expect(hotkeyLabel('run', 'windows')).toBe('Ctrl+Enter')
    expect(hotkeyLabel('save', 'mac')).toContain('⌘')
    expect(withHotkey('Run', 'run', 'linux')).toBe('Run (Ctrl+Enter)')
  })
})

describe('canvas history', () => {
  const a: CanvasSnapshot = { nodes: [node('clients')], edges: [] }
  const b: CanvasSnapshot = { nodes: [node('clients'), node('cdn')], edges: [edge('clients', 'cdn')] }

  it('ignores moves and relabels, records add/remove and reparent', () => {
    expect(structuralKey([node('a', 0)], [])).toBe(structuralKey([node('a', 40)], []))
    expect(structuralKey([node('a')], [])).not.toBe(structuralKey([node('a'), node('b')], []))
    expect(structuralKey([node('a')], [])).not.toBe(structuralKey([node('a', 0, 'zone')], []))
    expect(structuralKey([node('a')], [])).not.toBe(structuralKey([node('a')], [edge('a', 'a')]))
  })

  it('undoes to the previous snapshot and redoes forward', () => {
    const recorded = recordHistory(emptyHistory, a)
    expect(canUndo(recorded)).toBe(true)
    expect(canRedo(recorded)).toBe(false)

    const undone = undoHistory(recorded, b)
    expect(undone?.snapshot).toBe(a)
    expect(canUndo(undone!.history)).toBe(false)
    expect(canRedo(undone!.history)).toBe(true)

    const redone = redoHistory(undone!.history, a)
    expect(redone?.snapshot).toBe(b)
    expect(canRedo(redone!.history)).toBe(false)
    expect(undoHistory(emptyHistory, a)).toBeUndefined()
  })

  it('drops redo on a new edit and caps the stack', () => {
    const undone = undoHistory(recordHistory(emptyHistory, a), b)!
    const afterEdit = recordHistory(undone.history, b)
    expect(afterEdit.future).toHaveLength(0)

    let history = emptyHistory
    for (let i = 0; i < HISTORY_LIMIT + 5; i += 1) {
      history = recordHistory(history, { nodes: [node(`n${i}`)], edges: [] })
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT)
    expect(history.past[0]?.nodes[0]?.id).toBe('n5')
  })
})

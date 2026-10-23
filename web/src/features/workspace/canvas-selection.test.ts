import { describe, expect, it } from 'vitest'
import { canvasSelectionKey } from './canvas-selection.ts'
import { decorateEdges } from './edge-data.ts'
import { initialEdges, initialNodes } from './graph.ts'

describe('canvas selection during drag', () => {
  it('keeps the same key when a selected node only moves', () => {
    const before = canvasSelectionKey([{ id: 'ecs', type: 'service' }], [])
    const after = canvasSelectionKey([{ id: 'ecs', type: 'service' }], [])
    expect(before).toBe('n:ecs')
    expect(after).toBe(before)
  })

  it('joins multi-selected service ids so extra selected nodes change the key', () => {
    expect(canvasSelectionKey([{ id: 'ecs', type: 'service' }, { id: 'aks', type: 'service' }], [])).toBe(
      'n:aks,ecs',
    )
    expect(canvasSelectionKey([{ id: 'aws', type: 'zone' }], [])).toBe('n:aws')
  })

  it('does not allocate new edge objects when paint is already applied', () => {
    const first = decorateEdges(initialNodes, initialEdges)
    const second = decorateEdges(initialNodes, first)
    expect(second).toBe(first)
  })
})

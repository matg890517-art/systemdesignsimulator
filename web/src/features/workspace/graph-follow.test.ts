import { describe, expect, it } from 'vitest'
import { connectComponents, deleteSelection } from './canvas-edit.ts'
import { hopLabelWithRate, hopTypeLabel, readEdgeData, setEdgeClassActive } from './edge-data.ts'
import { hopFlowSignature, hopFollowAction } from './graph-follow.ts'
import { initialEdges, initialNodes } from './graph.ts'

describe('hop follow after graph edits', () => {
  it('ignores painted rates and handle-only changes', () => {
    const painted = initialEdges.map((edge) => ({
      ...edge,
      sourceHandle: 'right',
      targetHandle: 'left',
      label: hopLabelWithRate(hopTypeLabel(edge), 1157),
      data: { ...readEdgeData(edge), flowRps: 1157 },
    }))
    expect(hopFlowSignature(painted)).toBe(hopFlowSignature(initialEdges))
  })

  it('changes when a hop is added or deleted', () => {
    const connected = connectComponents(initialNodes, initialEdges, 'upload', 'mediacdn')
    if ('error' in connected) throw new Error(connected.error)
    expect(hopFlowSignature(connected.edges)).not.toBe(hopFlowSignature(initialEdges))

    const deleted = deleteSelection(initialNodes, initialEdges, [], ['c-lb'])
    expect(hopFlowSignature(deleted.edges)).not.toBe(hopFlowSignature(initialEdges))
  })

  it('changes when hop classes change, not when an unconnected node is added', () => {
    const [first, ...rest] = initialEdges
    if (!first) throw new Error('missing hop')
    const toggled = [
      {
        ...first,
        data: setEdgeClassActive(readEdgeData(first), 'async', true),
      },
      ...rest,
    ]
    expect(hopFlowSignature(toggled)).not.toBe(hopFlowSignature(initialEdges))
    expect(hopFlowSignature(initialEdges)).toBe(hopFlowSignature(initialEdges))
  })

  it('re-solves Analytic after a Run, and only marks Simulated stale', () => {
    expect(hopFollowAction(false, false, 'analytic')).toBe('ignore')
    expect(hopFollowAction(true, false, 'analytic')).toBe('analytic-run')
    expect(hopFollowAction(false, true, 'analytic')).toBe('analytic-run')
    expect(hopFollowAction(true, true, 'simulated')).toBe('simulated-stale')
    expect(hopFollowAction(true, false, 'discrete')).toBe('simulated-stale')
    expect(hopFollowAction(false, false, 'simulated')).toBe('ignore')
  })
})

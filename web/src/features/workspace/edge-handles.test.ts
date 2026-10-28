import { describe, expect, it } from 'vitest'
import type { Edge } from '@xyflow/react'
import {
  handlesForCenters,
  handlesForNodes,
  oppositeHandle,
  routeEdges,
  SERVICE_CARD,
} from './edge-handles.ts'
import type { ServiceNodeData, WorkspaceNode, ZoneNodeData } from './types.ts'

function service(id: string, x: number, y: number, parentId?: string): WorkspaceNode {
  return {
    id,
    type: 'service',
    position: { x, y },
    parentId,
    data: {
      title: id,
      util: 0,
      p99: '',
      meta: '',
      provider: 'generic',
    } satisfies ServiceNodeData,
  }
}

describe('edge handles follow card position', () => {
  it('maps each relative layout to the facing sides', () => {
    const origin = { x: 0, y: 0 }
    expect(handlesForCenters(origin, { x: 200, y: 10 })).toEqual({
      sourceHandle: 'right',
      targetHandle: 'left',
    })
    expect(handlesForCenters(origin, { x: -200, y: 10 })).toEqual({
      sourceHandle: 'left',
      targetHandle: 'right',
    })
    expect(handlesForCenters(origin, { x: 10, y: 200 })).toEqual({
      sourceHandle: 'bottom',
      targetHandle: 'top',
    })
    expect(handlesForCenters(origin, { x: 10, y: -200 })).toEqual({
      sourceHandle: 'top',
      targetHandle: 'bottom',
    })
    expect(oppositeHandle('right')).toBe('left')
  })

  it('prefers left/right when the diagonal is even', () => {
    expect(handlesForCenters({ x: 0, y: 0 }, { x: 100, y: 100 }).sourceHandle).toBe('right')
  })

  it('uses absolute position so a zone child routes against the other card', () => {
    const nodes: WorkspaceNode[] = [
      {
        id: 'aws',
        type: 'zone',
        position: { x: 400, y: 0 },
        data: { label: 'AWS', provider: 'aws' } satisfies ZoneNodeData,
      },
      service('alb', 0, 0, 'aws'),
      service('front', 0, 0),
    ]
    // alb center is 400+84; front center is 84. Target sits to the left of source.
    expect(handlesForNodes(nodes, 'alb', 'front')).toEqual({
      sourceHandle: 'left',
      targetHandle: 'right',
    })
    expect(SERVICE_CARD.width).toBe(168)
  })

  it('rewrites only edges whose handles no longer match the layout', () => {
    const nodes = [service('a', 0, 0), service('b', 300, 0)]
    const edges: Edge[] = [
      { id: 'a-b', source: 'a', target: 'b', sourceHandle: 'bottom', targetHandle: 'top' },
    ]
    const routed = routeEdges(nodes, edges)
    expect(routed[0]).toMatchObject({ sourceHandle: 'right', targetHandle: 'left' })
    expect(routeEdges(nodes, routed)).toBe(routed)
  })
})

import { describe, expect, it } from 'vitest'
import type { CanonicalKind } from '@sds/engine'
import type { Node } from '@xyflow/react'
import { kindForNode } from './compile.ts'
import {
  canHop,
  hopFamily,
  hopRefusal,
  type HopFamily,
} from './connect-rules.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { referenceStackGraph } from './reference-graph.ts'
import type { ServiceNodeData } from './types.ts'

const KIND: Record<HopFamily, CanonicalKind> = {
  client: 'traffic_generator',
  cdn: 'cdn',
  lb: 'load_balancer',
  compute: 'service',
  cache: 'cache',
  db: 'relational_db',
  object: 'object_storage',
  async: 'event_bus',
}

const FAMILIES = Object.keys(KIND) as HopFamily[]

/** Rows = source family; columns follow FAMILIES. Nothing targets Clients. */
const MATRIX: Record<HopFamily, Record<HopFamily, boolean>> = {
  client: { client: false, cdn: true, lb: true, compute: true, cache: true, db: true, object: true, async: true },
  cdn: { client: false, cdn: true, lb: true, compute: true, cache: true, db: true, object: true, async: false },
  lb: { client: false, cdn: true, lb: true, compute: true, cache: true, db: true, object: true, async: true },
  compute: { client: false, cdn: true, lb: true, compute: true, cache: true, db: true, object: true, async: true },
  cache: { client: false, cdn: true, lb: true, compute: true, cache: false, db: true, object: true, async: false },
  db: { client: false, cdn: false, lb: true, compute: true, cache: false, db: false, object: true, async: true },
  object: { client: false, cdn: true, lb: true, compute: true, cache: false, db: false, object: true, async: true },
  async: { client: false, cdn: false, lb: true, compute: true, cache: false, db: true, object: true, async: true },
}

function serviceKind(nodes: { id: string; type?: string; data: unknown }[], id: string): CanonicalKind {
  const node = nodes.find((item) => item.id === id)
  if (!node || node.type === 'zone') throw new Error(`missing service ${id}`)
  return kindForNode(node as Node<ServiceNodeData>)
}

describe('hop matrix', () => {
  it('maps aliases onto the same families', () => {
    expect(hopFamily('gateway')).toBe('compute')
    expect(hopFamily('worker')).toBe('compute')
    expect(hopFamily('event_bus')).toBe('async')
    expect(hopFamily('queue')).toBe('async')
    expect(hopFamily('nosql_db')).toBe('db')
    expect(hopFamily('relational_db')).toBe('db')
  })

  it('allows and refuses by family', () => {
    for (const from of FAMILIES) {
      for (const to of FAMILIES) {
        const allowed = MATRIX[from][to]
        expect(canHop(KIND[from], KIND[to]), `${from} → ${to}`).toBe(allowed)
        if (!allowed) expect(hopRefusal(KIND[from], KIND[to])).toBeTruthy()
        else expect(hopRefusal(KIND[from], KIND[to])).toBeUndefined()
      }
    }
  })

  it('keeps every YouTube hop legal', () => {
    for (const edge of initialEdges) {
      expect(
        canHop(serviceKind(initialNodes, edge.source), serviceKind(initialNodes, edge.target)),
        `${edge.source} → ${edge.target}`,
      ).toBe(true)
    }
  })

  it('keeps every Generic 9-block hop legal', () => {
    const { nodes, edges } = referenceStackGraph('generic')
    for (const edge of edges) {
      expect(
        canHop(serviceKind(nodes, edge.source), serviceKind(nodes, edge.target)),
        `${edge.source} → ${edge.target}`,
      ).toBe(true)
    }
  })
})

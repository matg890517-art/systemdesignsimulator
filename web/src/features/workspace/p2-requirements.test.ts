import { describe, expect, it } from 'vitest'
import { scoreAksHeadroom } from '../challenge/challenge.ts'
import { heatFill, heatStroke } from './heat.ts'
import { architectureInventory } from './inventory.ts'
import { decodeSharePayload, encodeSharePayload, shareUrlFor, snapshotFromHref } from './share.ts'
import { wrapInSubsystem } from './subsystem.ts'
import { referenceStackGraph } from './reference-graph.ts'
import { youtubeTemplate } from './templates.ts'
import { canvasSelectionKey } from './canvas-selection.ts'
import type { WorkspaceRun } from './types.ts'

function mockRun(aks?: Partial<WorkspaceRun['nodeStats'][string]>): WorkspaceRun {
  return {
    mode: 'fluid',
    kpis: {
      load: '—',
      loadHint: '',
      latency: 'unknown',
      latencyHint: '',
      errors: '—',
      bottlenecks: '—',
      bottleneckHint: '',
      cost: 'unknown',
      costHint: '',
    },
    bottlenecks: [],
    nodeStats: aks
      ? {
          aks: {
            util: 0.9,
            completed: 2,
            rejected: 0,
            offered: 2,
            mu: 2.1,
            capped: true,
            p99: 'unknown',
            meta: 'Estimated',
            backlog: 0,
            loss: 0,
            servers: 84,
            ...aks,
          },
        }
      : {},
    classStats: {},
    hint: 'test',
    affectedComponentIds: [],
    breakerOpenEdges: [],
  }
}

describe('P1 leftover + P2', () => {
  it('F8 paints util heat, not latency tails', () => {
    expect(heatStroke(0)).toBe('#7B8794')
    expect(heatStroke(0.5)).toBe('#2744C7')
    expect(heatStroke(0.7)).toBe('#B7791F')
    expect(heatStroke(0.85)).toBe('#B3261E')
    expect(heatFill(0.95)).toBe('#FFF6F5')
  })

  it('F12 round-trips a compact share URL without using the hash', () => {
    const snapshot = youtubeTemplate()
    const encoded = encodeSharePayload(snapshot)
    expect(encoded.startsWith('sds1.')).toBe(true)
    const restored = decodeSharePayload(encoded)
    expect(restored?.nodes.map((node) => node.id)).toEqual(snapshot.nodes.map((node) => node.id))
    const url = shareUrlFor(snapshot, 'http://localhost:3000/results#old')
    expect(url).toBeDefined()
    expect(url).toContain('?share=sds1.')
    expect(url).not.toContain('#')
    expect(snapshotFromHref(url ?? '')?.name).toBe(snapshot.name)
  })

  it('F13 wraps two unzoned services in one nested generic zone', () => {
    const { nodes } = referenceStackGraph('generic')
    const ids = nodes.filter((node) => node.type === 'service').slice(0, 2).map((node) => node.id)
    const result = wrapInSubsystem(nodes, ids, 1)
    if ('error' in result) throw new Error(result.error)
    const zone = result.nodes.find((node) => node.id === result.id)
    expect(zone?.data).toMatchObject({ provider: 'generic', nested: true })
    const children = result.nodes.filter((node) => node.parentId === result.id)
    expect(children).toHaveLength(2)
    expect(wrapInSubsystem(result.nodes, ids, 2)).toMatchObject({
      error: 'This build nests one level. Remove the parent zone first.',
    })
  })

  it('F14 inventory is SDS JSON and says it is not executable IaC', () => {
    const snapshot = youtubeTemplate()
    const inventory = architectureInventory(snapshot.name, snapshot.nodes, snapshot.edges)
    expect(inventory.kind).toBe('sds-inventory')
    expect(inventory.note).toMatch(/Not executable IaC/)
    expect(inventory.services.some((item) => item.id === 'aks')).toBe(true)
    expect(JSON.stringify(inventory)).not.toMatch(/terraform|cloudformation|pulumi/i)
  })

  it('F21 scores AKS headroom from engine util, never as Measured', () => {
    expect(scoreAksHeadroom(undefined).status).toBe('blocked')
    expect(scoreAksHeadroom(mockRun()).status).toBe('blocked')
    expect(scoreAksHeadroom(mockRun({ capped: false })).status).toBe('blocked')
    expect(scoreAksHeadroom(mockRun({ util: 0.9, capped: true })).status).toBe('fail')
    const pass = scoreAksHeadroom(mockRun({ util: 0.8, capped: true, servers: 120 }))
    expect(pass.status).toBe('pass')
    expect(pass.detail).toMatch(/Estimated · not Measured/)
  })

  it('keeps a multi-select key stable while nodes only move', () => {
    expect(canvasSelectionKey([{ id: 'b', type: 'service' }, { id: 'a', type: 'service' }], [])).toBe(
      'n:a,b',
    )
  })
})

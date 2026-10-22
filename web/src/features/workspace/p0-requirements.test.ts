import { describe, expect, it } from 'vitest'
import { PALETTE_PROVIDERS } from '../catalog/catalog.ts'
import { compileCanvas } from './compile.ts'
import { defaultEdgeData, isCrossProviderEdge } from './edge-data.ts'
import { explainFromModel } from './explain.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { getProfiles } from '../calibration/library.ts'
import { defaultWorkloadDraft } from './compile.ts'

describe('remaining P0 requirements', () => {
  it('F16 lists Generic as the default palette folder', () => {
    expect(PALETTE_PROVIDERS[0]?.id).toBe('generic')
  })

  it('F1 drops a service and its edges, and F2 maps a tile to a named icon', async () => {
    const { deleteSelection } = await import('./canvas-edit.ts')
    const { iconGlyphFor } = await import('./kind-icon.ts')
    const { initialEdges, initialNodes } = await import('./graph.ts')
    const next = deleteSelection(initialNodes, initialEdges, ['ecs'], [])
    expect(next.nodes.some((node) => node.id === 'ecs')).toBe(false)
    expect(next.edges.some((edge) => edge.source === 'ecs' || edge.target === 'ecs')).toBe(false)
    expect(iconGlyphFor({ mode: 'service', name: 'EC2', catalogId: 'aws-ec2' })).toBe('compute')
    expect(iconGlyphFor({ mode: 'normal', name: 'Clients', catalogId: 'generic-clients' })).toBe(
      'clients',
    )
  })

  it('F29 marks Azure→AWS copy-link as a cross-provider edge', () => {
    expect(isCrossProviderEdge(initialNodes, { source: 'blob', target: 'cloudfront' })).toBe(true)
    expect(isCrossProviderEdge(initialNodes, { source: 'alb', target: 'ecs' })).toBe(false)
    const copy = initialEdges.find((edge) => edge.id === 'copy-link')
    expect(String(copy?.label)).toMatch(/cross · Estimated/)
  })

  it('F4 compiles typed edge payload bytes and fan-out from canvas data', () => {
    const edges = initialEdges.map((edge) =>
      edge.id === 'up-aks'
        ? {
            ...edge,
            data: {
              ...defaultEdgeData(),
              fanOut: 2,
              call: { kind: 'async' as const },
              classes: {
                bulk: { requestBytes: 1_000, responseBytes: 50, active: true },
                read: { requestBytes: 1, responseBytes: 1, active: false },
                write: { requestBytes: 1, responseBytes: 1, active: false },
                async: { requestBytes: 1, responseBytes: 1, active: false },
              },
            },
          }
        : edge,
    )
    const { topology } = compileCanvas(
      initialNodes,
      edges,
      { ...defaultWorkloadDraft(), classes: { read: 0, write: 0, async: 0, bulk: 2 } },
      getProfiles(),
      'none',
    )
    const link = topology.edges.find((item) => item.id === 'up-aks')
    expect(link?.fanOut).toBe(2)
    expect(link?.call.kind).toBe('async')
    expect(link?.classes.bulk?.requestBytes).toBe(1_000)
    expect(link?.classes.read).toBeUndefined()
  })

  it('F23 explains saturation from μ = n/S and Erlang wait', () => {
    const text = explainFromModel({
      name: 'AKS',
      offered: 2,
      completed: 2,
      rejected: 0,
      backlog: 0.4,
      util: 0.95,
      servers: 84,
      serviceMs: 40_000,
      capped: true,
    })
    expect(text.numbers).toMatch(/μ = n \/ S/)
    expect(text.wait).toMatch(/Erlang C/)
    expect(text.fix).toMatch(/Raise n/)
  })
})

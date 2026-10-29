import { describe, expect, it } from 'vitest'
import { PALETTE_PROVIDERS } from '../catalog/catalog.ts'
import { compileCanvas } from './compile.ts'
import {
  applyHopNoteLabel,
  classSummaryLabel,
  defaultEdgeData,
  hopLabelWithRate,
  hopTypeLabel,
  isCrossProviderEdge,
  relabelClassEdge,
  setEdgeClassActive,
} from './edge-data.ts'
import { explainFromModel } from './explain.ts'
import { initialEdges, initialNodes, youtubeEnvSize } from './graph.ts'
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
    expect(iconGlyphFor({ mode: 'normal', name: 'Environment', category: 'ENVIRONMENT' })).toBe('zone')
  })

  it('YouTube AWS, GCP, and Azure environments share one box size', () => {
    const zones = initialNodes.filter((node) => node.type === 'zone')
    expect(zones.map((node) => (node.data as { label: string }).label)).toEqual(['AWS', 'GCP', 'Azure'])
    for (const node of zones) {
      expect(node.position.x).toBe(zones[0]?.position.x)
      expect(node.style?.width).toBe(youtubeEnvSize.width)
      expect(node.style?.height).toBe(youtubeEnvSize.height)
      expect(node.draggable).toBe(true)
      expect(node.selectable).toBe(true)
    }
    expect(initialNodes.filter((node) => node.parentId).every((node) => node.extent !== 'parent')).toBe(
      true,
    )
    const viewersZ = initialNodes.find((node) => node.id === 'viewers')?.zIndex ?? 0
    const awsZ = initialNodes.find((node) => node.id === 'aws')?.zIndex ?? 0
    const cloudfrontZ = initialNodes.find((node) => node.id === 'cloudfront')?.zIndex ?? 0
    expect(awsZ).toBeLessThan(viewersZ)
    expect(awsZ).toBeLessThan(cloudfrontZ)
  })

  it('F29 marks Azure→AWS copy-link as a cross-provider edge', () => {
    expect(isCrossProviderEdge(initialNodes, { source: 'blob', target: 'cloudfront' })).toBe(true)
    expect(isCrossProviderEdge(initialNodes, { source: 'alb', target: 'ecs' })).toBe(false)
    const copy = initialEdges.find((edge) => edge.id === 'copy-link')
    expect(String(copy?.label)).toMatch(/cross · Estimated/)
  })

  it('F4 turns Write off on an edge and relabels R/W to R', () => {
    const on = defaultEdgeData()
    expect(classSummaryLabel(on.classes)).toBe('R/W')
    const off = setEdgeClassActive(on, 'write', false)
    expect(off.classes.write?.active).toBe(false)
    expect(classSummaryLabel(off.classes)).toBe('R')
    expect(relabelClassEdge('R/W', off.classes)).toBe('R')
    expect(relabelClassEdge('', off.classes)).toBe('R')
    expect(relabelClassEdge('miss', off.classes)).toBe('miss · R')
    expect(relabelClassEdge('miss · R/W', off.classes)).toBe('miss · R')
    expect(relabelClassEdge('R/W · 50,000 /s', off.classes)).toBe('R')
    expect(relabelClassEdge('B · 2.0 /s · cross · Estimated', defaultEdgeData().classes)).toBe(
      'R/W · cross · Estimated',
    )
  })

  it('edge labels are class types; hop rates come from a run, not baked copy', () => {
    expect(initialEdges.find((edge) => edge.id === 'v-cf')?.label).toBe('R/W/A')
    expect(initialEdges.find((edge) => edge.id === 'cf-alb')?.label).toBe('R/W/A')
    expect(initialEdges.find((edge) => edge.id === 'ddb-gke')?.label).toBe('R/A')
    expect(initialEdges.find((edge) => edge.id === 'up-aks')?.label).toBe('B')
    expect(initialEdges.find((edge) => edge.id === 'copy-link')?.label).toBe('B · cross · Estimated')
    for (const edge of initialEdges) {
      expect(String(edge.label)).not.toMatch(/\d/)
    }
    expect(hopTypeLabel(initialEdges.find((edge) => edge.id === 'copy-link')!)).toBe(
      'B · cross · Estimated',
    )
    expect(hopLabelWithRate('R/W', 50_000)).toBe('R/W · 50,000 /s')
    expect(hopLabelWithRate('miss · R/W', 20)).toBe('miss · R/W · 20.0 /s')
    expect(applyHopNoteLabel('R/W', true)).toBe('miss · R/W')
    expect(applyHopNoteLabel('miss · R/W', true)).toBe('miss · R/W')
    expect(applyHopNoteLabel('miss · R/W', false)).toBe('R/W')
    expect(
      hopTypeLabel({
        id: 'origin',
        source: 'cdn',
        target: 'lb',
        data: { ...defaultEdgeData(), note: 'miss', classes: defaultEdgeData().classes },
      }),
    ).toBe('miss · R/W')
    expect(hopLabelWithRate('B · cross · Estimated', 2)).toBe('B · 2.0 /s · cross · Estimated')
    expect(hopLabelWithRate('R/W', 0.04)).toBe('R/W')
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

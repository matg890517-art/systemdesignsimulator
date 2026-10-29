import { describe, expect, it } from 'vitest'
import { costFromCanvas } from '../workspace/node-profile.ts'
import { calibrationRowsForCanvas, currentCanvas } from './canvas-library.ts'
import { youtubeSeedProfiles } from './library.ts'
import { initialNodes } from '../workspace/graph.ts'
import { referenceStackGraph, referenceStackProfiles } from '../workspace/reference-graph.ts'
import { iconGlyphFor } from '../workspace/kind-icon.ts'
import { serviceMarkSrc } from '../workspace/icons/registry.ts'

describe('calibration canvas library', () => {
  it('lists YouTube canvas cards, not the leftover seed profile names', () => {
    const rows = calibrationRowsForCanvas(initialNodes, youtubeSeedProfiles)
    expect(rows.map((row) => row.title)).toEqual([
      'Viewers',
      'CloudFront',
      'Application LB',
      'ECS ×60',
      'ElastiCache',
      'DynamoDB',
      'GKE ×12',
      'Pub/Sub',
      'Cloud Run',
      'Firestore',
      'AKS ×84',
      'Service Bus',
      'Blob Storage',
      'Front Door',
      'Uploaders',
    ])
    expect(rows.some((row) => row.title === 'AKS transcode workers')).toBe(false)
    expect(rows.some((row) => row.title === 'Azure to AWS copy link')).toBe(false)
    const aks = rows.find((row) => row.nodeId === 'aks')
    expect(aks?.profile.fields.find((field) => field.role === 'servers')?.value).toMatchObject({
      state: 'set',
      value: 84,
    })
    expect(aks?.catalogId).toBe('azure-aks')
  })

  it('lists the Generic reference as Clients through Object store', () => {
    const graph = referenceStackGraph('generic')
    const rows = calibrationRowsForCanvas(graph.nodes, referenceStackProfiles)
    expect(rows.map((row) => row.title)).toEqual([
      'Clients',
      'CDN',
      'Load balancer',
      'Service',
      'Cache',
      'Database',
      'Queue',
      'Worker pool',
      'Object store',
    ])
  })

  it('uses the same catalog icons as the workspace cards', () => {
    const rows = calibrationRowsForCanvas(initialNodes, youtubeSeedProfiles)
    const viewers = rows.find((row) => row.nodeId === 'viewers')
    const uploaders = rows.find((row) => row.nodeId === 'uploaders')
    const aks = rows.find((row) => row.nodeId === 'aks')
    expect(
      iconGlyphFor({
        mode: 'service',
        name: viewers?.title ?? '',
        catalogId: viewers?.catalogId,
      }),
    ).toBe('clients')
    expect(
      iconGlyphFor({
        mode: 'service',
        name: uploaders?.title ?? '',
        catalogId: uploaders?.catalogId,
      }),
    ).toBe('clients')
    expect(serviceMarkSrc(aks?.catalogId)).toBeTruthy()
    for (const row of rows) {
      if (row.catalogId?.startsWith('generic-')) {
        expect(
          iconGlyphFor({ mode: 'service', name: row.title, catalogId: row.catalogId }),
        ).toBeTruthy()
      } else {
        expect(serviceMarkSrc(row.catalogId), row.catalogId).toBeTruthy()
      }
    }
  })

  it('falls back to the YouTube canvas when nothing is saved', () => {
    const canvas = currentCanvas()
    expect(canvas.name).toBe('Example: Video streaming platform (YouTube-style)')
    expect(canvas.nodes.filter((node) => node.type === 'service')).toHaveLength(15)
  })

  it('C0 Results cost is 0 of 8 on Generic even if the in-memory library is YouTube seeds', () => {
    const graph = referenceStackGraph('generic')
    const empty = costFromCanvas(graph.nodes, youtubeSeedProfiles)
    expect(empty.value).toBe('unknown')
    expect(empty.priced).toBe(0)
    expect(empty.eligible).toBe(8)
    const withCdn = [
      ...youtubeSeedProfiles,
      {
        id: 'node-cdn',
        name: 'CDN',
        bindsTo: 'cdn',
        fields: [
          {
            id: 'costUsdPerHour',
            label: 'Hourly cost',
            unit: 'USD/hr',
            role: 'costUsdPerHour' as const,
            value: { state: 'set' as const, value: 12.5, confidence: 'estimated' as const },
          },
        ],
      },
    ]
    const cost = costFromCanvas(graph.nodes, withCdn)
    expect(cost.value).toBe('$12.50/hr')
    expect(cost.priced).toBe(1)
    expect(cost.eligible).toBe(8)
    expect(cost.usdPerDay).toBe(300)
    expect(cost.usdPerMonth).toBe(12.5 * 730)
  })
})

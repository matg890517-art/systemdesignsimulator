import { describe, expect, it } from 'vitest'
import { expectedArrivals, runFluid } from '@sds/engine'
import { getProfiles } from '../calibration/library.ts'
import {
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  kindForNode,
} from './compile.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { runWorkspace } from './simulate.ts'
import type { ServiceNodeData } from './types.ts'
import type { Node } from '@xyflow/react'

describe('compileCanvas', () => {
  it('maps the example graph, including AKS calibration and unknown copy-link bandwidth', () => {
    const { topology, workload } = compileCanvas(
      initialNodes,
      initialEdges,
      defaultWorkloadDraft(),
      getProfiles(),
      'none',
    )
    const aks = topology.components.find((component) => component.id === 'aks')
    const cf = topology.components.find((component) => component.id === 'cloudfront')
    const copy = topology.edges.find((edge) => edge.id === 'copy-link')
    const ecs = topology.components.find((component) => component.id === 'ecs')
    expect(aks?.kind).toBe('worker')
    expect(aks?.behavior.servers).toMatchObject({ state: 'set', value: 84 })
    expect(cf?.behavior.cacheHitRate).toMatchObject({ state: 'set', value: 0.92 })
    expect(copy?.network.bandwidthBps).toBeUndefined()
    expect(ecs?.behavior.servers.state).toBe('unknown')
    expect(workload.offered.viewers.read).toBe(50_000)
    expect(workload.offered.uploaders.bulk).toBe(2)
    expect(expectedArrivals(workload)).toBeGreaterThan(DISCRETE_EVENT_GUARD)
  })

  it('treats generic clients as a generator', () => {
    const node = {
      id: 'clients-1',
      type: 'service',
      position: { x: 0, y: 0 },
      data: {
        title: 'Clients',
        util: 0,
        p99: 'not run',
        meta: '',
        provider: 'generic',
        catalogId: 'generic-clients',
      },
    } as Node<ServiceNodeData>
    expect(kindForNode(node)).toBe('traffic_generator')
  })

  it('zeros AKS slots on crash and sets upload loss on packet drop', () => {
    const crashed = compileCanvas(
      initialNodes,
      initialEdges,
      defaultWorkloadDraft(),
      getProfiles(),
      'crash',
    )
    expect(crashed.topology.components.find((item) => item.id === 'aks')?.behavior.servers).toMatchObject(
      { state: 'set', value: 0 },
    )
    const dropped = compileCanvas(
      initialNodes,
      initialEdges,
      defaultWorkloadDraft(),
      getProfiles(),
      'packet-drop',
    )
    expect(dropped.topology.edges.find((edge) => edge.id === 'up-aks')?.network.lossProb).toBe(0.1)
  })

  it('runs fluid on the full example and saturates calibrated AKS', () => {
    const draft = { ...defaultWorkloadDraft(), durationSec: 8 }
    const { topology, workload } = compileCanvas(
      initialNodes,
      initialEdges,
      draft,
      getProfiles(),
      'none',
    )
    const result = runFluid(topology, workload)
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    const mu = 84 / 40
    expect(last.components.aks.bulk.completed / mu).toBeCloseTo(2 / mu, 3)
    expect(last.components.cloudfront.read.completed).toBeGreaterThan(40_000)
    const albRead = last.components.alb.read.completed
    expect(albRead).toBeGreaterThan(3_000)
    expect(albRead).toBeLessThan(6_000)
  })

  it('refuses discrete at the example 51k rps and allows a short bulk-only run', () => {
    const blocked = runWorkspace(
      initialNodes,
      initialEdges,
      { ...defaultWorkloadDraft(), mode: 'discrete' },
      getProfiles(),
      'none',
    )
    expect(blocked.ok).toBe(false)

    const ok = runWorkspace(
      initialNodes,
      initialEdges,
      {
        ...defaultWorkloadDraft(),
        mode: 'discrete',
        durationSec: 2,
        classes: { read: 0, write: 0, async: 0, bulk: 2 },
      },
      getProfiles(),
      'none',
    )
    expect(ok.ok).toBe(true)
    if (ok.ok) {
      expect(ok.run.mode).toBe('discrete')
      expect(ok.run.nodeStats.aks.offered).toBeGreaterThan(0)
    }
  })
})

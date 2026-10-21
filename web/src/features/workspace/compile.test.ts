import { describe, expect, it } from 'vitest'
import { expectedArrivals, runFluid } from '@sds/engine'
import { getProfiles } from '../calibration/library.ts'
import {
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  edgeCarriesClass,
  kindForNode,
  nodeCarriesClass,
} from './compile.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { blankProfileForNode, configProfileForNode } from './node-profile.ts'
import {
  referenceStackGraph,
  referenceStackProfiles,
  referenceWorkloadDraft,
} from './reference-graph.ts'
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

  it('attaches the documented breaker so a crash can trip the upload edge', () => {
    const { topology } = compileCanvas(
      initialNodes,
      initialEdges,
      defaultWorkloadDraft(),
      getProfiles(),
      'none',
    )
    expect(topology.edges.find((item) => item.id === 'up-aks')?.breaker).toMatchObject({
      errorThreshold: 0.5,
      minRequests: 4,
      probes: 1,
    })
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

  it('trips the upload breaker and lists the AKS blast radius after a crash', () => {
    const result = runWorkspace(
      initialNodes,
      initialEdges,
      {
        ...defaultWorkloadDraft(),
        mode: 'discrete',
        durationSec: 2,
        classes: { read: 0, write: 0, async: 0, bulk: 40 },
      },
      getProfiles(),
      'crash',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.breakerOpenEdges).toContain('up-aks')
    expect(result.run.affectedComponentIds).toEqual(
      expect.arrayContaining(['aks', 'servicebus', 'blob', 'frontdoor', 'cloudfront']),
    )
    expect(result.run.blastOriginId).toBe('aks')
  })
})

describe('F24 class filter', () => {
  const service = (id: string) =>
    initialNodes.find((node) => node.id === id) as Node<ServiceNodeData>

  it('keeps read on the viewer path and bulk on the upload path', () => {
    expect(edgeCarriesClass('v-cf', 'viewers', 'read')).toBe(true)
    expect(edgeCarriesClass('v-cf', 'viewers', 'bulk')).toBe(false)
    expect(edgeCarriesClass('up-aks', 'uploaders', 'bulk')).toBe(true)
    expect(edgeCarriesClass('up-aks', 'uploaders', 'read')).toBe(false)
    expect(nodeCarriesClass(service('aks'), initialEdges, 'bulk')).toBe(true)
    expect(nodeCarriesClass(service('aks'), initialEdges, 'read')).toBe(false)
    expect(nodeCarriesClass(service('cloudfront'), initialEdges, 'read')).toBe(true)
    expect(nodeCarriesClass(service('alb'), initialEdges, 'bulk')).toBe(false)
    expect(nodeCarriesClass(service('cloudfront'), initialEdges, 'bulk')).toBe(true)
    expect(nodeCarriesClass(service('viewers'), initialEdges, 'async')).toBe(true)
  })

  it('exposes per-class util so a bulk filter can still see AKS saturation', () => {
    const draft = { ...defaultWorkloadDraft(), durationSec: 8 }
    const result = runWorkspace(initialNodes, initialEdges, draft, getProfiles(), 'none')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.classStats.aks.bulk.util).toBeCloseTo(0.95, 2)
    expect(result.run.nodeStats.aks.citation).toContain('Estimated')
    expect(result.run.nodeStats.aks.citation).toContain('AKS transcode workers')
    expect(result.run.classStats.aks.read?.offered ?? 0).toBe(0)
    expect(result.run.classStats.cloudfront.read.completed).toBeGreaterThan(40_000)
  })
})

describe('F3 config profiles', () => {
  it('opens every selected node with unknown fields and does not invent numbers', () => {
    const ecs = blankProfileForNode('ecs', 'ECS ×60', 'aws-ecs')
    expect(ecs.fields.find((field) => field.role === 'servers')?.value).toEqual({ state: 'unknown' })
    expect(ecs.fields.find((field) => field.role === 'serviceMs')?.value).toEqual({
      state: 'unknown',
    })
    const clients = blankProfileForNode('clients', 'Clients', 'generic-clients')
    expect(clients.fields).toEqual([])
  })

  it('keeps bound AKS numbers and fills missing CloudFront capacity as unknown', () => {
    const aks = configProfileForNode(
      getProfiles().find((profile) => profile.bindsTo === 'aks'),
      'aks',
      'AKS ×84',
      'azure-aks',
    )
    expect(aks.fields.find((field) => field.role === 'servers')?.value).toMatchObject({
      state: 'set',
      value: 84,
      confidence: 'estimated',
    })
    const cf = configProfileForNode(
      getProfiles().find((profile) => profile.bindsTo === 'cloudfront'),
      'cloudfront',
      'CloudFront',
      'aws-cloudfront',
    )
    expect(cf.fields.find((field) => field.role === 'cacheHitRate')?.value).toMatchObject({
      state: 'set',
      value: 0.92,
    })
    expect(cf.fields.find((field) => field.role === 'servers')?.value).toEqual({ state: 'unknown' })
  })
})

describe('mapped provider reference stacks', () => {
  it('binds AWS catalog ids, runs fluid, and does not invent ECS servers from the task quota', () => {
    const graph = referenceStackGraph('aws')
    expect(graph.nodes.find((node) => node.id === 'service')?.data.catalogId).toBe('aws-ecs')
    expect(graph.nodes.find((node) => node.id === 'queue')?.data.catalogId).toBe('aws-sqs')
    const { topology } = compileCanvas(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), durationSec: 8 },
      referenceStackProfiles,
      'none',
    )
    expect(topology.components.find((item) => item.id === 'service')?.kind).toBe('service')
    expect(topology.components.find((item) => item.id === 'service')?.behavior.servers).toMatchObject({
      state: 'set',
      value: 8,
      confidence: 'estimated',
    })

    const unknownServers = referenceStackProfiles.map((profile) => ({
      ...profile,
      fields: profile.fields.map((field) =>
        field.role === 'servers' ? { ...field, value: { state: 'unknown' as const } } : field,
      ),
    }))
    const open = compileCanvas(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), durationSec: 8 },
      unknownServers,
      'none',
    )
    expect(open.topology.components.find((item) => item.id === 'service')?.behavior.servers.state).toBe(
      'unknown',
    )

    const result = runWorkspace(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), durationSec: 8 },
      referenceStackProfiles,
      'none',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.nodeStats.service.offered).toBeGreaterThan(0)
  })

  it('keeps Azure AKS and GCP Pub/Sub on the same 9 node ids', () => {
    const azure = referenceStackGraph('azure')
    const gcp = referenceStackGraph('gcp')
    expect(azure.nodes.find((node) => node.id === 'service')?.data.catalogId).toBe('azure-aks')
    expect(gcp.nodes.find((node) => node.id === 'queue')?.data.catalogId).toBe('gcp-pub-sub')
    expect(kindForNode(gcp.nodes.find((node) => node.id === 'queue') as Node<ServiceNodeData>)).toBe(
      'event_bus',
    )
    expect(kindForNode(azure.nodes.find((node) => node.id === 'service') as Node<ServiceNodeData>)).toBe(
      'worker',
    )
  })
})

describe('generic reference stack', () => {
  it('compiles all 9 generic tiles and runs fluid without invented measurements', () => {
    const graph = referenceStackGraph()
    expect(graph.nodes).toHaveLength(9)
    const { topology, workload } = compileCanvas(
      graph.nodes,
      graph.edges,
      referenceWorkloadDraft(),
      referenceStackProfiles,
      'none',
    )
    expect(topology.components.map((component) => component.id).sort()).toEqual(
      ['cache', 'cdn', 'clients', 'db', 'lb', 'object', 'queue', 'service', 'worker'].sort(),
    )
    expect(topology.components.find((item) => item.id === 'service')?.behavior.servers).toMatchObject(
      { state: 'set', value: 8, confidence: 'estimated' },
    )
    const split = topology.edges.filter((edge) => edge.from === 'clients')
    expect(split.every((edge) => edge.routing.mode === 'weighted')).toBe(true)
    expect(workload.offered.clients.read).toBe(200)

    const result = runWorkspace(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), durationSec: 8 },
      referenceStackProfiles,
      'none',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.nodeStats.service.offered).toBeGreaterThan(0)
    expect(result.run.nodeStats.worker.offered).toBeGreaterThan(0)
  })
})


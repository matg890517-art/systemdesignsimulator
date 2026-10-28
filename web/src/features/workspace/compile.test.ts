import { describe, expect, it } from 'vitest'
import { expectedArrivals, runFluid } from '@sds/engine'
import { getProfiles } from '../calibration/library.ts'
import {
  canvasGenerators,
  compileCanvas,
  defaultWorkloadDraft,
  DISCRETE_EVENT_GUARD,
  edgeCarriesClass,
  kindForNode,
  nodeCarriesClass,
  visibleClassRate,
  withGeneratorClassRate,
  WORKLOAD_RUN_CLOCK,
} from './compile.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { blankProfileForNode, configProfileForNode } from './node-profile.ts'
import { readEdgeData, setEdgeClassActive } from './edge-data.ts'
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
    expect(workload.shape).toMatchObject({ kind: 'step', atSec: 20, factor: 2 })
    expect(workload.offered.viewers.write).toBe(1_200)
    expect(workload.offered.viewers.async).toBe(2_600)
    expect(workload.offered.uploaders.bulk).toBe(2)
    expect(topology.components.find((component) => component.id === 'viewers')?.kind).toBe(
      'traffic_generator',
    )
    expect(initialNodes.find((node) => node.id === 'viewers')?.data).toMatchObject({
      catalogId: 'generic-clients',
      title: 'Viewers',
    })
    expect(initialNodes.find((node) => node.id === 'uploaders')?.data).toMatchObject({
      catalogId: 'generic-clients',
      title: 'Uploaders',
    })
    expect(expectedArrivals(workload)).toBeGreaterThan(DISCRETE_EVENT_GUARD)
  })

  it('lists one workload generator per Clients card', () => {
    const youtube = canvasGenerators(initialNodes, initialEdges)
    expect(youtube.map((item) => item.title)).toEqual(['Viewers', 'Uploaders'])
    expect(youtube[0]?.classes).toEqual(['read', 'write', 'async'])
    expect(youtube[1]?.classes).toEqual(['bulk'])
    const graph = referenceStackGraph('generic')
    const generic = canvasGenerators(graph.nodes, graph.edges)
    expect(generic).toHaveLength(1)
    expect(generic[0]?.title).toBe('Clients')
    expect(generic[0]?.classes).toEqual(['read', 'write', 'async', 'bulk'])
  })

  it('shows Read Write Async Bulk on every Clients card; unused stay 0', () => {
    const youtube = canvasGenerators(initialNodes, initialEdges)
    const draft = defaultWorkloadDraft()
    expect(visibleClassRate(draft, youtube[0]!, 'read')).toBe(50_000)
    expect(visibleClassRate(draft, youtube[0]!, 'write')).toBe(1_200)
    expect(visibleClassRate(draft, youtube[0]!, 'async')).toBe(2_600)
    expect(visibleClassRate(draft, youtube[0]!, 'bulk')).toBe(0)
    expect(visibleClassRate(draft, youtube[1]!, 'read')).toBe(0)
    expect(visibleClassRate(draft, youtube[1]!, 'bulk')).toBe(2)
    const generic = canvasGenerators(
      referenceStackGraph('generic').nodes,
      referenceStackGraph('generic').edges,
    )
    const clients = referenceWorkloadDraft()
    expect(visibleClassRate(clients, generic[0]!, 'async')).toBe(30)
    expect(visibleClassRate(clients, generic[0]!, 'bulk')).toBe(20)
  })

  it('uses the same duration, dt and seed for YouTube and Clients', () => {
    const youtube = defaultWorkloadDraft()
    const clients = referenceWorkloadDraft()
    expect(youtube).toMatchObject(WORKLOAD_RUN_CLOCK)
    expect(clients).toMatchObject(WORKLOAD_RUN_CLOCK)
    expect(clients.durationSec).toBe(youtube.durationSec)
    expect(clients.dtSec).toBe(youtube.dtSec)
    expect(clients.seed).toBe(youtube.seed)
  })

  it('keeps independent rates when two Clients cards exist', () => {
    const draft = withGeneratorClassRate(
      withGeneratorClassRate(defaultWorkloadDraft(), 'viewers', 'read', 10),
      'uploaders',
      'bulk',
      4,
    )
    const { workload } = compileCanvas(initialNodes, initialEdges, draft, getProfiles(), 'none')
    expect(workload.offered.viewers.read).toBe(10)
    expect(workload.offered.viewers.write).toBe(1_200)
    expect(workload.offered.uploaders.bulk).toBe(4)
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
      expect(ok.run.nodeStats.viewers.loss).toBe(0)
    }
  })

  it('shows fluid completed rate on cards and does not mark a generator as 100% loss', () => {
    const graph = referenceStackGraph('generic')
    const fluid = runWorkspace(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), mode: 'fluid', durationSec: 8 },
      referenceStackProfiles,
      'none',
    )
    expect(fluid.ok).toBe(true)
    if (!fluid.ok) return
    expect(fluid.run.nodeStats.cdn.p99).toMatch(/\/s$/)
    expect(fluid.run.nodeStats.cdn.p99).not.toMatch(/unknown/)
    expect(fluid.run.kpis.latency).toBe('unknown')

    const discrete = runWorkspace(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), mode: 'discrete', durationSec: 2 },
      referenceStackProfiles,
      'none',
    )
    expect(discrete.ok).toBe(true)
    if (!discrete.ok) return
    expect(discrete.run.nodeStats.clients.loss).toBe(0)
    expect(discrete.run.nodeStats.cdn.p99).toMatch(/\/s$/)
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
    expect(nodeCarriesClass(service('viewers'), initialEdges, 'read')).toBe(true)
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
    expect(ecs.fields.find((field) => field.role === 'costUsdPerHour')?.value).toEqual({
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
    expect(graph.edges.find((edge) => edge.id === 'cdn-lb')?.label).toBe('miss · R/W')
    expect(graph.edges.find((edge) => edge.id === 'lb-svc')?.label).toBe('R/W')
    expect(graph.edges.find((edge) => edge.id === 'q-w')?.label).toBe('A/B')
    const split = topology.edges.filter((edge) => edge.from === 'clients')
    expect(split.every((edge) => edge.routing.mode === 'weighted')).toBe(true)
    expect(Object.keys(split.find((edge) => edge.id === 'c-cdn')?.classes ?? {}).sort()).toEqual([
      'read',
      'write',
    ])
    expect(Object.keys(split.find((edge) => edge.id === 'c-q')?.classes ?? {}).sort()).toEqual([
      'async',
      'bulk',
    ])
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
    expect(result.run.nodeStats.cdn.offered).toBeCloseTo(240, 0)
    expect(result.run.nodeStats.queue.offered).toBeCloseTo(50, 0)
    expect(result.run.edgeOffered['c-cdn']).toBeCloseTo(240, 0)
    expect(result.run.edgeOffered['c-q']).toBeCloseTo(50, 0)
    expect(result.run.ticks.length).toBeGreaterThan(2)
    expect(result.run.durationSec).toBe(8)
    expect(result.run.edgeClassOffered['c-cdn']?.read).toBeCloseTo(200, 0)
    expect(result.run.nodeStats.service.offered).toBeGreaterThan(0)
    expect(result.run.nodeStats.worker.offered).toBeGreaterThan(0)
  })

  it('sends Write to Queue when that hop is switched on', () => {
    const graph = referenceStackGraph('generic')
    const edges = graph.edges.map((edge) => {
      const data = readEdgeData(edge)
      if (edge.id === 'c-cdn') {
        return { ...edge, data: setEdgeClassActive(data, 'write', false), label: 'R' }
      }
      if (edge.id === 'c-q') {
        return { ...edge, data: setEdgeClassActive(data, 'write', true), label: 'W/A/B' }
      }
      return edge
    })
    const { topology } = compileCanvas(
      graph.nodes,
      edges,
      referenceWorkloadDraft(),
      referenceStackProfiles,
      'none',
    )
    expect(Object.keys(topology.edges.find((item) => item.id === 'c-q')?.classes ?? {}).sort()).toEqual(
      ['async', 'bulk', 'write'],
    )
    const result = runWorkspace(
      graph.nodes,
      edges,
      { ...referenceWorkloadDraft(), durationSec: 8 },
      referenceStackProfiles,
      'none',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.run.nodeStats.cdn.offered).toBeCloseTo(200, 0)
    expect(result.run.nodeStats.queue.offered).toBeCloseTo(90, 0)
  })

  it('keeps hop rates doubling after the default step (playback ticks, not a second engine)', () => {
    const graph = referenceStackGraph('generic')
    const result = runWorkspace(
      graph.nodes,
      graph.edges,
      { ...referenceWorkloadDraft(), durationSec: 40, dtSec: 0.5 },
      referenceStackProfiles,
      'none',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const before = result.run.ticks.find((tick) => tick.t < 20)
    const after = result.run.ticks.find((tick) => tick.t >= 20.5)
    expect(before).toBeDefined()
    expect(after).toBeDefined()
    expect(after!.edgeOffered['c-cdn'] ?? 0).toBeGreaterThan((before!.edgeOffered['c-cdn'] ?? 0) * 1.5)
    expect(result.run.nodeStats.cdn.offered).toBeCloseTo(480, 0)
  })
})


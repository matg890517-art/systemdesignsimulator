import { setValue } from './values.ts'
import type { CanonicalKind, Component, Edge, Topology, Workload } from './types.ts'

export const genericBlocks: { id: string; name: string; kind: CanonicalKind; category: string }[] =
  [
    { id: 'generic-clients', name: 'Clients', kind: 'traffic_generator', category: 'GENERIC' },
    { id: 'generic-lb', name: 'Load balancer', kind: 'load_balancer', category: 'GENERIC' },
    { id: 'generic-service', name: 'Service', kind: 'service', category: 'GENERIC' },
    { id: 'generic-cache', name: 'Cache', kind: 'cache', category: 'GENERIC' },
    { id: 'generic-db', name: 'Database', kind: 'relational_db', category: 'GENERIC' },
    { id: 'generic-queue', name: 'Queue', kind: 'queue', category: 'GENERIC' },
    { id: 'generic-worker', name: 'Worker pool', kind: 'worker', category: 'GENERIC' },
    { id: 'generic-cdn', name: 'CDN', kind: 'cdn', category: 'GENERIC' },
    { id: 'generic-object', name: 'Object store', kind: 'object_storage', category: 'GENERIC' },
  ]

function component(
  id: string,
  kind: CanonicalKind,
  opts: { servers: number; serviceMs: number; queue: number | 'unbounded'; exponential?: boolean },
): Component {
  return {
    id,
    name: id,
    kind,
    behavior: {
      servers: setValue(opts.servers),
      serviceTime: {
        read: setValue(
          opts.exponential
            ? { kind: 'exponential', meanMs: opts.serviceMs }
            : { kind: 'constant', ms: opts.serviceMs },
        ),
      },
      queueCapacity: setValue(opts.queue),
      throughputLimitRps: setValue(Number.POSITIVE_INFINITY),
      scaling: setValue('fixed'),
    },
    calibrationProfileIds: [],
  }
}

export function generator(id: string, name = id): Component {
  return {
    id,
    name,
    kind: 'traffic_generator',
    behavior: {
      servers: setValue(1),
      serviceTime: {
        read: setValue({ kind: 'constant', ms: 0 }),
      },
      queueCapacity: setValue('unbounded'),
      throughputLimitRps: setValue(Number.POSITIVE_INFINITY),
      scaling: setValue('fixed'),
    },
    calibrationProfileIds: [],
  }
}

export function cache(
  id: string,
  opts: { servers: number; serviceMs: number; hitRate: number; queue?: number | 'unbounded' },
): Component {
  const node = component(id, 'cache', {
    servers: opts.servers,
    serviceMs: opts.serviceMs,
    queue: opts.queue ?? 'unbounded',
  })
  node.behavior.cacheHitRate = setValue(opts.hitRate)
  return node
}

export function worker(
  id: string,
  opts: {
    servers: number
    serviceMs: number
    queue: number | 'unbounded'
    exponential?: boolean
    failProb?: number
  },
): Component {
  const node = component(id, 'worker', opts)
  if (opts.failProb !== undefined) node.behavior.failProb = setValue(opts.failProb)
  return node
}

export function edge(
  id: string,
  from: string,
  to: string,
  extra?: Partial<Edge>,
): Edge {
  return {
    id,
    from,
    to,
    routing: extra?.routing ?? { mode: 'single' },
    fanOut: extra?.fanOut ?? 1,
    classes: extra?.classes ?? {
      read: { requestBytes: 2000, responseBytes: 20000 },
    },
    network: extra?.network ?? {
      latencyMs: 0,
      bandwidthApplies: 'both',
      lossProb: 0,
      serialization: false,
    },
    call: extra?.call ?? { kind: 'sync' },
    retry: extra?.retry,
    breaker: extra?.breaker,
  }
}

export function chainTopology(): Topology {
  return {
    components: [
      generator('clients'),
      worker('pool', { servers: 16, serviceMs: 100, queue: 50 }),
    ],
    edges: [edge('e1', 'clients', 'pool')],
  }
}

export function workloadAt(
  rps: number,
  opts?: { durationSec?: number; seed?: number; dtSec?: number },
): Workload {
  return {
    durationSec: opts?.durationSec ?? 2,
    dtSec: opts?.dtSec ?? 0.1,
    seed: opts?.seed ?? 4821,
    offered: { clients: { read: rps } },
  }
}

export function mmcTopology(): Topology {
  return {
    components: [
      generator('clients'),
      worker('pool', { servers: 16, serviceMs: 100, queue: 'unbounded', exponential: true }),
    ],
    edges: [edge('e1', 'clients', 'pool')],
  }
}

/** J14 hockey-stick: 290 rps, S = 20 ms, μ = 50 /s. */
export function hockeyStickTopology(servers: number): Topology {
  return {
    components: [
      generator('clients'),
      worker('pool', { servers, serviceMs: 20, queue: 'unbounded', exponential: true }),
    ],
    edges: [edge('e1', 'clients', 'pool')],
  }
}

export function failingDependency(): Topology {
  return {
    components: [
      generator('clients'),
      worker('dep', { servers: 32, serviceMs: 5, queue: 'unbounded', failProb: 0.1 }),
    ],
    edges: [
      edge('e1', 'clients', 'dep', {
        retry: { max: 2, backoff: 'fixed', baseMs: 1, budget: 2, onlyIdempotent: true },
      }),
    ],
  }
}

/** Generic reference stack from decision 6: LB, service, cache, DB, queue, worker. */
export function referenceStack(): Topology {
  return {
    components: [
      generator('clients'),
      component('lb', 'load_balancer', { servers: 4, serviceMs: 1, queue: 'unbounded' }),
      component('service', 'service', { servers: 8, serviceMs: 20, queue: 'unbounded' }),
      component('cache', 'cache', { servers: 4, serviceMs: 2, queue: 'unbounded' }),
      component('db', 'relational_db', { servers: 4, serviceMs: 10, queue: 'unbounded' }),
      component('queue', 'queue', { servers: 2, serviceMs: 2, queue: 'unbounded' }),
      component('worker', 'worker', { servers: 8, serviceMs: 30, queue: 'unbounded' }),
    ],
    edges: [
      edge('c-lb', 'clients', 'lb', { routing: { mode: 'weighted', weight: 1 } }),
      edge('c-q', 'clients', 'queue', { routing: { mode: 'weighted', weight: 1 } }),
      edge('lb-svc', 'lb', 'service'),
      edge('svc-cache', 'service', 'cache', { routing: { mode: 'weighted', weight: 1 } }),
      edge('svc-db', 'service', 'db', { routing: { mode: 'weighted', weight: 1 } }),
      edge('q-w', 'queue', 'worker'),
    ],
  }
}

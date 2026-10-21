import { setValue } from './values.ts'
import type { Component, Edge, Topology, Workload } from './types.ts'

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

export function worker(
  id: string,
  opts: { servers: number; serviceMs: number; queue: number | 'unbounded' },
): Component {
  return {
    id,
    name: id,
    kind: 'worker',
    behavior: {
      servers: setValue(opts.servers),
      serviceTime: {
        read: setValue({ kind: 'constant', ms: opts.serviceMs }),
      },
      queueCapacity: setValue(opts.queue),
      throughputLimitRps: setValue(Number.POSITIVE_INFINITY),
      scaling: setValue('fixed'),
    },
    calibrationProfileIds: [],
  }
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
  opts?: { durationSec?: number; seed?: number },
): Workload {
  return {
    durationSec: opts?.durationSec ?? 2,
    dtSec: 0.1,
    seed: opts?.seed ?? 4821,
    offered: { clients: { read: rps } },
  }
}

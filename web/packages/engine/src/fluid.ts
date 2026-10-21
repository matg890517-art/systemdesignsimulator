import { backlogDeltaHolds, conservationHolds } from './conservation.ts'
import { meanMs, unwrap } from './values.ts'
import { offeredRate } from './routing.ts'
import { offeredAt } from './workload.ts'
import type {
  Component,
  Edge,
  FluidComponentClassState,
  FluidEdgeState,
  FluidState,
  RequestClassId,
  Topology,
  Workload,
} from './types.ts'

const emptyEdge = (): FluidEdgeState => ({
  offered: 0,
  delivered: 0,
  admitted: 0,
  completed: 0,
  retried: 0,
})

const emptyComponent = (backlog = 0): FluidComponentClassState => ({
  incomingOffered: 0,
  networkDrop: 0,
  admitted: 0,
  rejected: 0,
  completed: 0,
  backlog,
})

function classIds(topology: Topology, workload: Workload): RequestClassId[] {
  const ids = new Set<RequestClassId>()
  for (const rates of Object.values(workload.offered)) {
    for (const id of Object.keys(rates)) ids.add(id)
  }
  for (const edge of topology.edges) {
    for (const id of Object.keys(edge.classes)) ids.add(id)
  }
  return [...ids]
}

function bytesForCap(edge: Edge, classId: RequestClassId): number {
  const spec = edge.classes[classId]
  if (!spec) return 0
  switch (edge.network.bandwidthApplies) {
    case 'request':
      return spec.requestBytes
    case 'response':
      return spec.responseBytes
    case 'both':
      return spec.requestBytes + spec.responseBytes
  }
}

function deliver(edge: Edge, classId: RequestClassId, offered: number): number {
  let delivered = offered * (1 - edge.network.lossProb)
  const bps = edge.network.bandwidthBps
  const bytes = bytesForCap(edge, classId)
  if (bps !== undefined && bytes > 0) {
    const capRps = bps / (bytes * 8)
    delivered = Math.min(delivered, capRps)
  }
  return delivered
}

function sourceOutput(
  component: Component,
  classId: RequestClassId,
  state: FluidState,
  workload: Workload,
): number {
  if (component.kind === 'traffic_generator') {
    return offeredAt(workload, component.id, classId, state.t)
  }
  const row = state.components[component.id]?.[classId]
  if (!row) return 0
  const hit = component.behavior.cacheHitRate
    ? unwrap(component.behavior.cacheHitRate, 0)
    : 0
  return row.completed * (1 - hit)
}

function siblingWeights(edges: Edge[], fromId: string): number[] {
  return edges
    .filter((edge) => edge.from === fromId && edge.routing.mode === 'weighted')
    .map((edge) => (edge.routing.mode === 'weighted' ? edge.routing.weight : 0))
}

function topoOrder(topology: Topology): Component[] {
  const incoming = new Map<string, number>()
  const byId = new Map(topology.components.map((c) => [c.id, c]))
  for (const c of topology.components) incoming.set(c.id, 0)
  for (const edge of topology.edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1)
  }
  const queue = topology.components.filter((c) => (incoming.get(c.id) ?? 0) === 0)
  const ordered: Component[] = []
  const remaining = new Map(incoming)
  while (queue.length) {
    const node = queue.shift()
    if (!node) break
    ordered.push(node)
    for (const edge of topology.edges.filter((e) => e.from === node.id)) {
      const next = remaining.get(edge.to)
      if (next === undefined) continue
      remaining.set(edge.to, next - 1)
      if (next - 1 === 0) {
        const dest = byId.get(edge.to)
        if (dest) queue.push(dest)
      }
    }
  }
  for (const c of topology.components) {
    if (!ordered.includes(c)) ordered.push(c)
  }
  return ordered
}

function processComponent(
  component: Component,
  classId: RequestClassId,
  incomingOffered: number,
  networkDrop: number,
  delivered: number,
  prevBacklog: number,
  dtSec: number,
): FluidComponentClassState {
  if (component.kind === 'traffic_generator') {
    const offered = incomingOffered
    return {
      incomingOffered: offered,
      networkDrop: 0,
      admitted: offered,
      rejected: 0,
      completed: offered,
      backlog: 0,
    }
  }

  const servers =
    component.behavior.servers.state === 'set'
      ? unwrap(component.behavior.servers)
      : Number.POSITIVE_INFINITY
  const service = component.behavior.serviceTime[classId]
  const serviceSec =
    service && service.state === 'set' ? meanMs(unwrap(service)) / 1000 : 0
  const mu = serviceSec > 0 ? servers / serviceSec : Number.POSITIVE_INFINITY
  const cap = unwrap(component.behavior.throughputLimitRps, mu)
  const serviceCap = Math.min(mu, cap)

  const queue = unwrap(component.behavior.queueCapacity, 'unbounded')
  const freeRoom =
    queue === 'unbounded'
      ? Number.POSITIVE_INFINITY
      : Math.max(0, queue - prevBacklog)
  const maxAdmit = serviceCap + (Number.isFinite(freeRoom) ? freeRoom / dtSec : 0)
  const admitted = Math.min(delivered, maxAdmit)
  const rejected = Math.max(0, delivered - admitted)
  const completed = Math.min(admitted + prevBacklog / dtSec, serviceCap)
  const backlog = Math.max(0, prevBacklog + (admitted - completed) * dtSec)

  return {
    incomingOffered,
    networkDrop,
    admitted,
    rejected,
    completed,
    backlog,
  }
}

export function initialFluidState(
  topology: Topology,
  workload: Workload,
): FluidState {
  const classes = classIds(topology, workload)
  const edges: FluidState['edges'] = {}
  const components: FluidState['components'] = {}
  for (const edge of topology.edges) {
    edges[edge.id] = {}
    for (const classId of classes) edges[edge.id][classId] = emptyEdge()
  }
  for (const component of topology.components) {
    components[component.id] = {}
    for (const classId of classes) {
      components[component.id][classId] = emptyComponent()
    }
  }
  return { t: 0, seed: workload.seed, edges, components }
}

export function fluidStep(
  topology: Topology,
  workload: Workload,
  prev: FluidState,
  dtSec: number,
): FluidState {
  const classes = classIds(topology, workload)
  const next: FluidState = {
    t: prev.t + dtSec,
    seed: workload.seed,
    edges: {},
    components: {},
  }

  for (const edge of topology.edges) {
    next.edges[edge.id] = {}
    for (const classId of classes) next.edges[edge.id][classId] = emptyEdge()
  }
  for (const component of topology.components) {
    next.components[component.id] = {}
    for (const classId of classes) {
      next.components[component.id][classId] = emptyComponent(
        prev.components[component.id]?.[classId]?.backlog ?? 0,
      )
    }
  }

  const order = topoOrder(topology)

  for (const classId of classes) {
    for (const component of order) {
      if (component.kind === 'traffic_generator') {
        const offered = offeredAt(workload, component.id, classId, next.t)
        next.components[component.id][classId] = processComponent(
          component,
          classId,
          offered,
          0,
          offered,
          0,
          dtSec,
        )
      } else {
        const incoming = topology.edges.filter((edge) => edge.to === component.id)
        let incomingOffered = 0
        let delivered = 0
        for (const edge of incoming) {
          const row = next.edges[edge.id][classId]
          incomingOffered += row.offered
          delivered += row.delivered
        }
        const networkDrop = incomingOffered - delivered
        const prevBacklog = prev.components[component.id]?.[classId]?.backlog ?? 0
        const row = processComponent(
          component,
          classId,
          incomingOffered,
          networkDrop,
          delivered,
          prevBacklog,
          dtSec,
        )
        next.components[component.id][classId] = row

        if (incomingOffered > 0) {
          for (const edge of incoming) {
            const share = next.edges[edge.id][classId].offered / incomingOffered
            next.edges[edge.id][classId].admitted = row.admitted * share
            next.edges[edge.id][classId].completed = row.completed * share
          }
        }
      }

      const outgoing = topology.edges.filter((edge) => {
        if (edge.from !== component.id) return false
        if (edge.routing.mode === 'conditional') {
          return edge.routing.classes.includes(classId)
        }
        return classId in edge.classes || Object.keys(edge.classes).length === 0
      })
      const weights = siblingWeights(outgoing, component.id)
      const output = sourceOutput(component, classId, next, workload)

      for (const edge of outgoing) {
        const offered = offeredRate(edge.routing, edge.fanOut, output, weights)
        const delivered = deliver(edge, classId, offered)
        next.edges[edge.id][classId] = {
          ...next.edges[edge.id][classId],
          offered,
          delivered,
        }
      }
    }
  }

  return next
}

export function assertConservation(state: FluidState, dtSec: number, prev: FluidState) {
  for (const [componentId, classes] of Object.entries(state.components)) {
    for (const [classId, row] of Object.entries(classes)) {
      const ok = conservationHolds({
        offered: row.incomingOffered,
        admitted: row.admitted,
        rejected: row.rejected,
        networkDrop: row.networkDrop,
      })
      if (!ok) {
        throw new Error(`J1 conservation failed at ${componentId}/${classId} t=${state.t}`)
      }
      const prevBacklog = prev.components[componentId]?.[classId]?.backlog ?? 0
      const delta = row.backlog - prevBacklog
      if (!backlogDeltaHolds(row.admitted, row.completed, dtSec, delta)) {
        throw new Error(`J1 backlog failed at ${componentId}/${classId} t=${state.t}`)
      }
    }
  }
}

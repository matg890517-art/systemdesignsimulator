import type { Edge } from '@xyflow/react'
import { isSimulatedMode } from './run-mode.ts'
import { classesFromActiveMap, readEdgeData } from './edge-data.ts'

export type HopFollowAction = 'analytic-run' | 'simulated-stale' | 'ignore'

const FOLLOW_HOP_MS = 120

export const HOP_FOLLOW_DEBOUNCE_MS = FOLLOW_HOP_MS

/** Flow topology only: endpoints, classes, routing, call. Ignores paint (rates, labels, handles). */
export function hopFlowSignature(edges: readonly Edge[]): string {
  return edges
    .map((edge) => {
      const data = readEdgeData(edge)
      const classes = classesFromActiveMap(data.classes).join(',')
      const routing =
        data.routing.mode === 'weighted'
          ? `weighted:${data.routing.weight}`
          : data.routing.mode === 'conditional'
            ? `conditional:${data.routing.classes.slice().sort().join(',')}`
            : data.routing.mode
      return `${edge.id}:${edge.source}>${edge.target}:${classes}:${routing}:${data.call.kind}:${data.fanOut}`
    })
    .sort()
    .join('|')
}

/**
 * Connect, delete hop, or class/routing change after the user has Run.
 * Analytic re-solves. Simulated is a new scenario (N2) — stop and wait for Run.
 * An unconnected drop does not change this signature.
 */
export function hopFollowAction(ran: boolean, running: boolean, mode: string | undefined): HopFollowAction {
  if (!ran && !running) return 'ignore'
  if (isSimulatedMode(mode)) return 'simulated-stale'
  return 'analytic-run'
}

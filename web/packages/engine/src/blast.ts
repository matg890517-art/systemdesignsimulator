import type { Topology } from './types.ts'

/** Downstream component ids including the crashed root. Used by J9 and the blast-radius view. */
export function blastRadius(topology: Topology, rootId: string): string[] {
  const out = new Set<string>([rootId])
  let grew = true
  while (grew) {
    grew = false
    for (const edge of topology.edges) {
      if (out.has(edge.from) && !out.has(edge.to)) {
        out.add(edge.to)
        grew = true
      }
    }
  }
  return [...out]
}

import type { Confidence } from '@sds/engine'
import type { NodeHealth, ServiceNodeData } from './types.ts'

export type CardState = 'idle' | 'live' | 'hot' | 'watch' | 'failed'

/** One visual state per card. Crash origin wins, then live, then heat. Idle has no run data. */
export function cardState(data: Pick<ServiceNodeData, 'util' | 'live' | 'blastOrigin'>, health: NodeHealth): CardState {
  if (data.blastOrigin) return 'failed'
  if (data.live) return 'live'
  if (health === 'bottleneck') return 'hot'
  if (health === 'watch') return 'watch'
  return 'idle'
}

export type ConfidenceBadge = {
  label: string
  tone: 'unknown' | 'estimated' | 'vendor' | 'measured'
}

/** Short badge for the card corner. Unknown stays unknown and is shown, not hidden. */
export function confidenceBadge(confidence: Confidence | 'unknown'): ConfidenceBadge {
  if (confidence === 'measured') return { label: 'Measured', tone: 'measured' }
  if (confidence === 'vendor') return { label: 'Vendor', tone: 'vendor' }
  if (confidence === 'estimated') return { label: 'Est.', tone: 'estimated' }
  return { label: 'Unknown', tone: 'unknown' }
}

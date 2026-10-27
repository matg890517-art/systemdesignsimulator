import type { CalibrationField } from '@sds/engine'
import type { NodeRunStat } from './types.ts'

export type FocusRole = Extract<CalibrationField['role'], 'servers' | 'serviceMs'>

export type FieldFocusRequest = {
  nodeId: string
  role: FocusRole
  nonce: number
}

/**
 * Which Config field to land on when a bottleneck row is opened. Unknown capacity starts at
 * servers (the engine cannot cap without it); a set server count with unknown service time
 * goes to service time; a fully capped node goes to servers, the fix the explainer suggests.
 */
export function focusRoleForBottleneck(stat?: NodeRunStat): FocusRole {
  if (!stat || stat.servers === undefined) return 'servers'
  if (stat.serviceMs === undefined) return 'serviceMs'
  return 'servers'
}

export function nextFieldFocus(
  previous: FieldFocusRequest | undefined,
  nodeId: string,
  role: FocusRole,
): FieldFocusRequest {
  return { nodeId, role, nonce: (previous?.nonce ?? 0) + 1 }
}

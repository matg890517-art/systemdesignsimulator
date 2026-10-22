import type { LimitType } from '@sds/engine'

/**
 * Map Verified-limits prose onto LimitType (M1 + Decision 11).
 * Only hard_limit and adjustable_quota may cap. If the plan does not state a
 * number, omit `value` and set status unknown — never invent a quota.
 */
export const LIMIT_TYPE_FROM_PROSE: Record<
  string,
  { limitType: LimitType; cue: string }
> = {
  fixed: {
    limitType: 'hard_limit',
    cue: 'Plan says "fixed". M1 hard limit.',
  },
  adjustable: {
    limitType: 'adjustable_quota',
    cue: 'Plan says "adjustable". M1 adjustable quota.',
  },
  'best-effort': {
    limitType: 'best_effort_target',
    cue: 'Plan says "best-effort". M1 best-effort target.',
  },
  guidance: {
    limitType: 'performance_guidance',
    cue: 'Plan says "guidance". M1 performance guidance. S3 rates are this class.',
  },
  default: {
    limitType: 'configurable_setting',
    cue: 'A default or range the operator sets (idle timeout, scan interval). Decision 11.',
  },
  behavior: {
    limitType: 'documented_behavior',
    cue: 'Delivery, failover, ordering, replication, durability. Not a ceiling. Decision 11.',
  },
  'quota, adjustability not checked': {
    limitType: 'quota_adjustability_unknown',
    cue: 'A stated number with no "fixed" or "adjustable" in the plan. Decision 11. Cannot cap.',
  },
}

export function limitTypeFromProse(cue: keyof typeof LIMIT_TYPE_FROM_PROSE): LimitType {
  return LIMIT_TYPE_FROM_PROSE[cue]!.limitType
}

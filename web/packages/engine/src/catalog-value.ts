import type { CatalogValue, ComponentBehavior, Confidence } from './types.ts'

/** PDF p.27 + decision 11: only these two limit types may act as a ceiling. */
export function usableAsCeiling(value: CatalogValue): boolean {
  if (value.limitType !== 'hard_limit' && value.limitType !== 'adjustable_quota') return false
  if (value.status === 'unknown' || value.status === 'estimated') return false
  if (!value.sourceUrl || !value.retrievedOn) return false
  return true
}

function confidenceOf(value: CatalogValue): Confidence {
  return value.status === 'measured' ? 'measured' : 'vendor'
}

function capKind(value: CatalogValue): CatalogValue['caps'] {
  if (value.caps) return value.caps
  if (value.unit === 'rps') return 'throughputRps'
  if (value.unit === 'count') return 'servers'
  if (value.unit === 'bps') return 'bandwidthBps'
  return undefined
}

function minIfSet(
  current: ComponentBehavior['servers'] | ComponentBehavior['throughputLimitRps'],
  next: number,
  confidence: Confidence,
  sourceId: string,
): ComponentBehavior['servers'] | undefined {
  if (current.state !== 'set') return undefined
  if (current.value <= next) return current
  return { state: 'set', value: next, confidence, sourceId }
}

function fillIfOpen(
  current: ComponentBehavior['throughputLimitRps'],
  next: number,
  confidence: Confidence,
  sourceId: string,
): ComponentBehavior['throughputLimitRps'] {
  if (current.state === 'set') {
    return current.value <= next
      ? current
      : { state: 'set', value: next, confidence, sourceId }
  }
  return { state: 'set', value: next, confidence, sourceId }
}

/**
 * Apply sourced catalog ceilings onto behavior. Guidance, best-effort, estimated,
 * and unknown values are ignored. Calibration numbers already below the ceiling stay.
 */
export function applyCatalogCeilings(
  behavior: ComponentBehavior,
  values: CatalogValue[],
): ComponentBehavior {
  let next = behavior
  for (const value of values) {
    if (!usableAsCeiling(value)) continue
    const kind = capKind(value)
    const confidence = confidenceOf(value)
    const sourceId = value.sourceUrl
    if (kind === 'throughputRps') {
      next = {
        ...next,
        throughputLimitRps: fillIfOpen(next.throughputLimitRps, value.value, confidence, sourceId),
      }
    } else if (kind === 'servers') {
      const servers = minIfSet(next.servers, value.value, confidence, sourceId)
      if (servers) next = { ...next, servers }
    }
  }
  return next
}

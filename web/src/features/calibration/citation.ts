import type { CalibrationProfile, Confidence } from '@sds/engine'

export function confidenceLabel(confidence?: Confidence | 'unknown'): string {
  if (confidence === 'measured') return 'Measured'
  if (confidence === 'vendor') return 'Vendor figure'
  if (confidence === 'estimated') return 'Estimated'
  return 'Unknown'
}

/**
 * Confidence of a profile as a whole: the weakest set field wins, so one Estimated number
 * keeps the badge Estimated even next to Measured ones. No set field is unknown.
 */
export function profileConfidence(profile?: CalibrationProfile): Confidence | 'unknown' {
  if (!profile) return 'unknown'
  let weakest: Confidence | 'unknown' = 'unknown'
  for (const field of profile.fields) {
    if (field.value.state !== 'set') continue
    const confidence = field.value.confidence
    if (weakest === 'unknown') weakest = confidence
    else if (rank(confidence) < rank(weakest)) weakest = confidence
  }
  return weakest
}

function rank(confidence: Confidence): number {
  if (confidence === 'measured') return 3
  if (confidence === 'vendor') return 2
  return 1
}

export function profileCitation(profile?: CalibrationProfile): string {
  if (!profile) return 'No bound profile · unknown does not cap'
  const confidence = profileConfidence(profile)
  return `${confidenceLabel(confidence === 'unknown' ? undefined : confidence)} · ${profile.name}`
}

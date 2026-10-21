import type { CalibrationProfile, Confidence } from '@sds/engine'

export function confidenceLabel(confidence?: Confidence | 'unknown'): string {
  if (confidence === 'measured') return 'Measured'
  if (confidence === 'vendor') return 'Vendor figure'
  if (confidence === 'estimated') return 'Estimated'
  return 'Unknown'
}

export function profileCitation(profile?: CalibrationProfile): string {
  if (!profile) return 'No bound profile · unknown does not cap'
  const setField = profile.fields.find((field) => field.value.state === 'set')
  const confidence =
    setField && setField.value.state === 'set' ? setField.value.confidence : undefined
  return `${confidenceLabel(confidence)} · ${profile.name}`
}

import type { CalibrationField, CalibrationProfile, Confidence } from '@sds/engine'

/** Empty stays unknown. A typed number is Estimated unless confidence was already set. Never writes 0 for you. */
export function applyFieldNumber(
  field: CalibrationField,
  raw: string,
  sourceId: string,
): CalibrationField {
  if (raw.trim() === '') return { ...field, value: { state: 'unknown' } }
  const value = Number(raw)
  if (!Number.isFinite(value)) return field
  const current = field.value.state === 'set' ? field.value : undefined
  return {
    ...field,
    value: {
      state: 'set',
      value,
      confidence: current?.confidence === 'measured' ? 'measured' : (current?.confidence ?? 'estimated'),
      sourceId: current?.sourceId ?? sourceId,
    },
  }
}

/** Confidence only attaches to a set value. Unknown → Estimated does not invent a number. Measured is CSV-only (F28). */
export function applyFieldConfidence(
  field: CalibrationField,
  next: string,
): CalibrationField {
  if (next === 'unknown') return { ...field, value: { state: 'unknown' } }
  if (next === 'measured') return field
  if (field.value.state !== 'set') return field
  return {
    ...field,
    value: { ...field.value, confidence: next as Confidence },
  }
}

/** F28: a source link is Vendor figure; no source stays Estimated; CSV Measured is left alone. */
export function applyEvidenceFromSource(
  field: CalibrationField,
  sourceUrl?: string,
): CalibrationField {
  if (field.value.state !== 'set') return field
  if (field.value.confidence === 'measured') return field
  const url = sourceUrl?.trim()
  if (!url) {
    return { ...field, value: { ...field.value, confidence: 'estimated' } }
  }
  return { ...field, value: { ...field.value, confidence: 'vendor', sourceId: url } }
}

/** F28: P95 must be at least the median (serviceMs). A smaller P95 is refused, not invented. */
export function enforceP95AtLeastMedian(fields: CalibrationField[]): {
  fields: CalibrationField[]
  error?: string
} {
  const median = fields.find((field) => field.role === 'serviceMs')
  const p95 = fields.find((field) => field.role === 'latencyP95Ms')
  if (!median || !p95) return { fields }
  if (median.value.state !== 'set' || p95.value.state !== 'set') return { fields }
  if (p95.value.value >= median.value.value) return { fields }
  return {
    fields: fields.map((field) =>
      field.role === 'latencyP95Ms' ? { ...field, value: { state: 'unknown' } } : field,
    ),
    error: `P95 ${p95.value.value} ms is below the median ${median.value.value} ms. P95 was cleared to unknown.`,
  }
}

export function applyProfileFields(
  profile: CalibrationProfile,
  fields: CalibrationField[],
  sourceUrl?: string,
): { profile: CalibrationProfile; error?: string } {
  const evidenced = fields.map((field) => applyEvidenceFromSource(field, sourceUrl ?? profile.source))
  const checked = enforceP95AtLeastMedian(evidenced)
  return {
    profile: { ...profile, source: sourceUrl ?? profile.source, fields: checked.fields },
    error: checked.error,
  }
}

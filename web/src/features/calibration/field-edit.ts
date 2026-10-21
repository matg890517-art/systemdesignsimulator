import type { CalibrationField, Confidence } from '@sds/engine'

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
      confidence: current?.confidence ?? 'estimated',
      sourceId: current?.sourceId ?? sourceId,
    },
  }
}

/** Confidence only attaches to a set value. Unknown → Estimated does not invent a number. */
export function applyFieldConfidence(
  field: CalibrationField,
  next: string,
): CalibrationField {
  if (next === 'unknown') return { ...field, value: { state: 'unknown' } }
  if (field.value.state !== 'set') return field
  return {
    ...field,
    value: { ...field.value, confidence: next as Confidence },
  }
}

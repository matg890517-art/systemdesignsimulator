import { describe, expect, it } from 'vitest'
import type { CalibrationField } from '@sds/engine'
import { applyFieldConfidence, applyFieldNumber } from './field-edit.ts'

const unknown: CalibrationField = {
  id: 'servers',
  label: 'Servers',
  unit: 'count',
  role: 'servers',
  value: { state: 'unknown' },
}

describe('F3 field edit', () => {
  it('keeps unknown when the box is empty and never writes 0', () => {
    expect(applyFieldNumber(unknown, '', 'config').value).toEqual({ state: 'unknown' })
    expect(applyFieldConfidence(unknown, 'estimated').value).toEqual({ state: 'unknown' })
    expect(applyFieldConfidence(unknown, 'measured').value).toEqual({ state: 'unknown' })
  })

  it('treats a typed number as Estimated', () => {
    expect(applyFieldNumber(unknown, '8', 'config').value).toMatchObject({
      state: 'set',
      value: 8,
      confidence: 'estimated',
      sourceId: 'config',
    })
  })

  it('changes confidence only after a number exists', () => {
    const set = applyFieldNumber(unknown, '8', 'config')
    expect(applyFieldConfidence(set, 'vendor').value).toMatchObject({
      state: 'set',
      value: 8,
      confidence: 'vendor',
    })
    expect(applyFieldConfidence(set, 'unknown').value).toEqual({ state: 'unknown' })
  })
})

import { describe, expect, it } from 'vitest'
import { defaultWorkloadDraft } from './compile.ts'
import { RUN_MODES, isRunMode, normalizeRunMode } from './run-mode.ts'

describe('F6 run modes', () => {
  it('exposes Analytic and Simulated on the same draft', () => {
    expect(RUN_MODES.map((item) => item.id)).toEqual(['analytic', 'simulated'])
    expect(RUN_MODES.map((item) => item.shortLabel)).toEqual(['Analytic', 'Simulated'])
    expect(defaultWorkloadDraft().mode).toBe('analytic')
    expect(defaultWorkloadDraft().shapeKind).toBe('constant')
    expect(isRunMode('analytic')).toBe(true)
    expect(isRunMode('simulated')).toBe(true)
    expect(isRunMode('fluid')).toBe(true)
    expect(isRunMode('discrete')).toBe(true)
    expect(normalizeRunMode('fluid')).toBe('analytic')
    expect(normalizeRunMode('discrete')).toBe('simulated')
    expect(isRunMode('hybrid')).toBe(false)
    expect(RUN_MODES.find((item) => item.id === 'analytic')?.hint).toMatch(/unknown/i)
  })
})

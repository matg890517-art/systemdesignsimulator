import { describe, expect, it } from 'vitest'
import { defaultWorkloadDraft } from './compile.ts'
import { SHOW_MODES, normalizeShowMode } from './display-mode.ts'
import { RUN_MODES, isRunMode, normalizeRunMode } from './run-mode.ts'

describe('F6 run modes', () => {
  it('exposes Analytic and Simulated on the same draft', () => {
    expect(RUN_MODES.map((item) => item.id)).toEqual(['analytic', 'simulated'])
    expect(RUN_MODES.map((item) => item.shortLabel)).toEqual(['Analytic', 'Simulated'])
    expect(defaultWorkloadDraft().mode).toBe('analytic')
    expect(defaultWorkloadDraft().shapeKind).toBe('constant')
    expect(defaultWorkloadDraft().rampSec).toBe(12)
    expect(isRunMode('analytic')).toBe(true)
    expect(isRunMode('simulated')).toBe(true)
    expect(isRunMode('fluid')).toBe(true)
    expect(isRunMode('discrete')).toBe(true)
    expect(normalizeRunMode('fluid')).toBe('analytic')
    expect(normalizeRunMode('discrete')).toBe('simulated')
    expect(isRunMode('hybrid')).toBe(false)
    expect(RUN_MODES.find((item) => item.id === 'analytic')?.hint).toMatch(/unknown/i)
  })

  it('Show mode is Instantaneous or Average, not a third engine', () => {
    expect(SHOW_MODES.map((item) => item.id)).toEqual(['instant', 'average'])
    expect(normalizeShowMode(undefined)).toBe('instant')
    expect(normalizeShowMode('average')).toBe('average')
  })
})

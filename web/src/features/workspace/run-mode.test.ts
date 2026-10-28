import { describe, expect, it } from 'vitest'
import { defaultWorkloadDraft } from './compile.ts'
import { RUN_MODES, isRunMode } from './run-mode.ts'

describe('F6 run modes', () => {
  it('exposes fluid-flow and discrete-event on the same draft', () => {
    expect(RUN_MODES.map((item) => item.id)).toEqual(['fluid', 'discrete'])
    expect(RUN_MODES.map((item) => item.shortLabel)).toEqual(['Fluid', 'Discrete'])
    expect(defaultWorkloadDraft().mode).toBe('fluid')
    expect(defaultWorkloadDraft().shapeKind).toBe('step')
    expect(isRunMode('fluid')).toBe(true)
    expect(isRunMode('discrete')).toBe(true)
    expect(isRunMode('hybrid')).toBe(false)
    expect(RUN_MODES.find((item) => item.id === 'fluid')?.hint).toMatch(/unknown/i)
  })
})

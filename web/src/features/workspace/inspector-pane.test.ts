import { describe, expect, it } from 'vitest'
import { inspectorFocusLabel, inspectorPane } from './inspector-pane.ts'

describe('inspector pane', () => {
  it('shows Config for a node and Edge for a connection', () => {
    expect(inspectorPane('focus', false)).toBe('config')
    expect(inspectorPane('focus', true)).toBe('edge')
    expect(inspectorFocusLabel(false)).toBe('Config')
    expect(inspectorFocusLabel(true)).toBe('Edge')
  })

  it('keeps Bottlenecks and Blast until the user leaves them', () => {
    expect(inspectorPane('bottlenecks', true)).toBe('bottlenecks')
    expect(inspectorPane('blast', false)).toBe('blast')
  })
})

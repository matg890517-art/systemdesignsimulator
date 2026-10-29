import { describe, expect, it } from 'vitest'
import type { CalibrationProfile } from '@sds/engine'
import { profileCitation, profileConfidence } from '../calibration/citation.ts'
import { focusRoleForBottleneck, nextFieldFocus } from './bottleneck-focus.ts'
import { cardState, confidenceBadge, serverCountDisplay } from './card-state.ts'
import { isRunStopped, RunStoppedError, stopWorkspaceRun } from './engine-client.ts'
import { nextNotice, noticeDurationMs, noticeSeverityForHint } from './notices.ts'
import type { NodeRunStat } from './types.ts'

function stat(overrides: Partial<NodeRunStat>): NodeRunStat {
  return {
    util: 0.9,
    completed: 1,
    rejected: 0,
    offered: 1,
    mu: 1,
    capped: true,
    p99: '',
    meta: '',
    backlog: 0,
    loss: 0,
    ...overrides,
  }
}

function profile(fields: CalibrationProfile['fields']): CalibrationProfile {
  return { id: 'p', name: 'Pool', bindsTo: 'n', notes: '', fields }
}

describe('UX polish: toasts', () => {
  it('toasts confirmations only; draft and undo hints stay in the chip', () => {
    expect(noticeSeverityForHint('Saved to Projects')).toBe('success')
    expect(noticeSeverityForHint('Exported JSON')).toBe('success')
    expect(noticeSeverityForHint('Copied share link')).toBe('success')
    expect(noticeSeverityForHint('Imported Generic reference stack')).toBe('success')
    expect(noticeSeverityForHint('Local draft')).toBeUndefined()
    expect(noticeSeverityForHint('Undo')).toBeUndefined()
    expect(noticeSeverityForHint('Deleted selection')).toBeUndefined()
  })

  it('gives every notice a new id so the same message toasts twice', () => {
    const first = nextNotice(undefined, 'Saved to Projects', 'success')
    const second = nextNotice(first, 'Saved to Projects', 'success')
    expect(second.id).toBe(first.id + 1)
  })

  it('keeps errors until dismissed and auto-hides the rest', () => {
    expect(noticeDurationMs('error')).toBeNull()
    expect(noticeDurationMs('warning')).toBeGreaterThan(noticeDurationMs('success')!)
  })
})

describe('UX polish: Stop', () => {
  it('is a no-op when nothing is running and tags its own error', () => {
    expect(stopWorkspaceRun()).toBe(false)
    expect(isRunStopped(new RunStoppedError())).toBe(true)
    expect(isRunStopped(new Error('Run stopped'))).toBe(false)
  })
})

describe('UX polish: bottleneck → node → field', () => {
  it('lands on servers for unknown capacity, service time when only servers are set', () => {
    expect(focusRoleForBottleneck(undefined)).toBe('servers')
    expect(focusRoleForBottleneck(stat({ capped: false, servers: undefined }))).toBe('servers')
    expect(focusRoleForBottleneck(stat({ servers: 8, serviceMs: undefined }))).toBe('serviceMs')
    expect(focusRoleForBottleneck(stat({ servers: 8, serviceMs: 40 }))).toBe('servers')
  })

  it('bumps the nonce so the same node can be focused twice', () => {
    const first = nextFieldFocus(undefined, 'aks', 'servers')
    const second = nextFieldFocus(first, 'aks', 'servers')
    expect(second.nonce).toBe(first.nonce + 1)
  })
})

describe('UX polish: card states and confidence badge', () => {
  it('orders states: failed > live > hot > watch > idle', () => {
    expect(cardState({ util: 0.95, live: true, blastOrigin: true }, 'bottleneck')).toBe('failed')
    expect(cardState({ util: 0.95, live: true }, 'bottleneck')).toBe('live')
    expect(cardState({ util: 0.95 }, 'bottleneck')).toBe('hot')
    expect(cardState({ util: 0.75 }, 'watch')).toBe('watch')
    expect(cardState({ util: 0 }, 'default')).toBe('idle')
  })

  it('takes the weakest set field; unknown stays unknown and is shown', () => {
    expect(profileConfidence(undefined)).toBe('unknown')
    expect(profileConfidence(profile([{ id: 'a', label: 'a', unit: '', role: 'servers', value: { state: 'unknown' } }]))).toBe(
      'unknown',
    )
    const mixed = profile([
      { id: 'a', label: 'a', unit: '', role: 'servers', value: { state: 'set', value: 1, confidence: 'measured', sourceId: 'csv' } },
      { id: 'b', label: 'b', unit: '', role: 'serviceMs', value: { state: 'set', value: 1, confidence: 'estimated', sourceId: 'x' } },
    ])
    expect(profileConfidence(mixed)).toBe('estimated')
    expect(profileCitation(mixed)).toBe('Estimated · Pool')
    expect(confidenceBadge('vendor')).toEqual({ label: 'Vendor', tone: 'vendor' })
    expect(confidenceBadge('unknown').label).toBe('Unknown')
  })

  it('prints n from the profile, not from the card title, and keeps unknown as unknown', () => {
    expect(serverCountDisplay(undefined)).toMatchObject({ text: 'n —', known: false })
    expect(
      serverCountDisplay(
        profile([{ id: 'servers', label: 'Slots', unit: 'count', role: 'servers', value: { state: 'set', value: 84, confidence: 'estimated', sourceId: 'example' } }]),
      ),
    ).toEqual({ text: 'n 84', title: '84 slots', known: true })
    expect(
      serverCountDisplay(
        profile([{ id: 'servers', label: 'Servers', unit: 'count', role: 'servers', value: { state: 'unknown' } }]),
      ),
    ).toMatchObject({ text: 'n —', known: false })
  })
})

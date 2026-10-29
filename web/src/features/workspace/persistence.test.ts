import { describe, expect, it } from 'vitest'
import { replayLog, runFluid } from '@sds/engine'
import { getProfiles } from '../calibration/library.ts'
import { defaultWorkloadDraft } from './compile.ts'
import { initialEdges, initialNodes } from './graph.ts'
import {
  compileSnapshot,
  createMemoryStore,
  listProjects,
  loadCurrent,
  parseSnapshot,
  patchCurrentLibrary,
  saveCurrent,
  serializeSnapshot,
  snapshotFilename,
  snapshotFrom,
  upsertProject,
} from './persistence.ts'
import { youtubeTemplate } from './templates.ts'
import { idleKpis, kpisFromDraft } from './run-workspace.ts'

describe('F12 topology snapshot', () => {
  it('round-trips and replays the same fluid timeline', () => {
    const snapshot = snapshotFrom({
      name: 'Example: Video streaming',
      scene: 'youtube',
      nodes: initialNodes,
      edges: initialEdges,
      draft: { ...defaultWorkloadDraft(), durationSec: 8 },
      profiles: getProfiles(),
      fault: 'none',
    })
    const restored = parseSnapshot(serializeSnapshot(snapshot))
    expect(restored?.draft.seed).toBe(4821)
    expect(restored?.nodes.map((node) => node.id)).toEqual(snapshot.nodes.map((node) => node.id))
    if (!restored) throw new Error('parse failed')
    const a = compileSnapshot(snapshot)
    const b = compileSnapshot(restored)
    expect(a.workload.seed).toBe(b.workload.seed)
    expect(replayLog(runFluid(a.topology, a.workload))).toBe(replayLog(runFluid(b.topology, b.workload)))
  })

  it('keeps named projects in the store and lists newest first', () => {
    const store = createMemoryStore()
    const first = snapshotFrom({
      id: 'a',
      name: 'A',
      scene: 'youtube',
      nodes: initialNodes,
      edges: initialEdges,
      draft: defaultWorkloadDraft(),
      profiles: getProfiles(),
      fault: 'none',
      savedAt: '2026-10-21T00:00:00.000Z',
    })
    const second = snapshotFrom({
      id: 'b',
      name: 'B',
      scene: 'reference',
      nodes: initialNodes,
      edges: initialEdges,
      draft: defaultWorkloadDraft(),
      profiles: getProfiles(),
      fault: 'crash',
      savedAt: '2026-10-21T01:00:00.000Z',
    })
    upsertProject(store, first)
    upsertProject(store, second)
    expect(listProjects(store).map((item) => item.id)).toEqual(['b', 'a'])
  })

  it('exports a filename and re-parses the pretty JSON snapshot', () => {
    const snapshot = youtubeTemplate()
    expect(snapshotFilename(snapshot)).toMatch(/youtube/)
    const restored = parseSnapshot(serializeSnapshot(snapshot))
    expect(restored?.scene).toBe('youtube')
    expect(restored?.nodes.some((node) => node.id === 'gcs')).toBe(true)
    expect(restored?.nodes.some((node) => node.id === 'transcoder')).toBe(true)
  })

  it('patches typed $/hr onto the saved canvas without needing Workspace mounted', () => {
    const store = createMemoryStore()
    const snapshot = snapshotFrom({
      name: 'Generic reference stack',
      scene: 'reference',
      nodes: initialNodes,
      edges: initialEdges,
      draft: defaultWorkloadDraft(),
      profiles: getProfiles(),
      fault: 'none',
    })
    saveCurrent(store, snapshot)
    patchCurrentLibrary(
      store,
      [
        {
          id: 'node-cdn',
          name: 'CDN',
          bindsTo: 'cdn',
          fields: [
            {
              id: 'costUsdPerHour',
              label: 'Hourly cost',
              unit: 'USD/hr',
              role: 'costUsdPerHour',
              value: { state: 'set', value: 12.5, confidence: 'estimated' },
            },
          ],
        },
      ],
      'none',
    )
    const restored = loadCurrent(store)
    expect(restored?.name).toBe('Generic reference stack')
    expect(
      restored?.profiles
        .find((profile) => profile.bindsTo === 'cdn')
        ?.fields.find((field) => field.role === 'costUsdPerHour')?.value,
    ).toEqual({ state: 'set', value: 12.5, confidence: 'estimated' })
  })
})

describe('honest idle KPIs', () => {
  it('does not invent latency tails or catalog prices before a run', () => {
    expect(idleKpis.latency).toBe('unknown')
    expect(idleKpis.cost).toBe('unknown')
    expect(idleKpis.costHint).toMatch(/no SKU prices/i)
    const fromDraft = kpisFromDraft(defaultWorkloadDraft())
    expect(fromDraft.errors).toBe('unknown')
    expect(fromDraft.bottlenecks).toBe('—')
  })
})

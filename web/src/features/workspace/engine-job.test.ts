import { describe, expect, it } from 'vitest'
import { getProfiles } from '../calibration/library.ts'
import { defaultWorkloadDraft } from './compile.ts'
import { runEngineJob, type EngineJobMessage } from './engine-job.ts'
import { initialEdges, initialNodes } from './graph.ts'

describe('N4 engine job', () => {
  it('posts progress then a worker-tagged result for the example canvas', async () => {
    const messages: EngineJobMessage[] = []
    await runEngineJob(
      {
        id: 7,
        nodes: initialNodes,
        edges: initialEdges,
        draft: { ...defaultWorkloadDraft(), durationSec: 8 },
        profiles: getProfiles(),
        fault: 'none',
      },
      (message) => messages.push(message),
    )
    expect(messages.some((message) => message.type === 'progress')).toBe(true)
    const done = messages.at(-1)
    expect(done?.type).toBe('done')
    if (done?.type !== 'done' || !done.result.ok) throw new Error('expected a successful run')
    expect(done.id).toBe(7)
    expect(done.result.run.hint).toContain('worker')
    expect(done.result.run.mode).toBe('analytic')
    expect(done.result.run.nodeStats.aks).toBeDefined()
    expect(done.result.run.kpis.latency).not.toBe('unknown')
  })

  it('returns the discrete arrival guard without throwing', async () => {
    const messages: EngineJobMessage[] = []
    await runEngineJob(
      {
        id: 8,
        nodes: initialNodes,
        edges: initialEdges,
        draft: { ...defaultWorkloadDraft(), mode: 'simulated' },
        profiles: getProfiles(),
        fault: 'none',
      },
      (message) => messages.push(message),
    )
    const done = messages.at(-1)
    expect(done?.type).toBe('done')
    if (done?.type !== 'done') throw new Error('expected done')
    expect(done.result.ok).toBe(false)
  })
})

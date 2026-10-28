import { describe, expect, it } from 'vitest'
import type { Node } from '@xyflow/react'
import {
  activeRecord,
  appendRun,
  emptyRunHistory,
  focusRun,
  rankingFromNodes,
  RUN_HISTORY_LIMIT,
  runMenuLabel,
} from './run-history.ts'
import type { ServiceNodeData, WorkspaceRun, ZoneNodeData } from './types.ts'

function run(overrides: Partial<WorkspaceRun> = {}): WorkspaceRun {
  return {
    mode: 'fluid',
    kpis: {
      load: '1 rps',
      loadHint: '',
      latency: 'unknown',
      latencyHint: '',
      errors: '0%',
      bottlenecks: '0',
      bottleneckHint: '',
      cost: 'unknown',
      costHint: '',
    },
    bottlenecks: [],
    nodeStats: {},
    classStats: {},
    edgeOffered: {},
    edgeClassOffered: {},
    ticks: [],
    durationSec: 60,
    hint: 'fluid · 60s · seed 1',
    affectedComponentIds: [],
    breakerOpenEdges: [],
    ...overrides,
  }
}

function service(id: string, title: string, provider: ServiceNodeData['provider']): Node<ServiceNodeData> {
  return {
    id,
    type: 'service',
    position: { x: 0, y: 0 },
    data: { title, util: 0, p99: '', meta: '', provider },
  }
}

describe('run history', () => {
  it('keeps the newest run active and drops past the cap', () => {
    let history = emptyRunHistory()
    for (let i = 0; i < RUN_HISTORY_LIMIT + 2; i += 1) {
      history = appendRun(history, {
        at: `2026-10-28T12:${String(i).padStart(2, '0')}:00.000Z`,
        projectName: 'Example',
        hint: 'fluid · 60s',
        run: run(),
        ranking: [],
      })
    }
    expect(history.runs).toHaveLength(RUN_HISTORY_LIMIT)
    expect(history.activeId).toBe(RUN_HISTORY_LIMIT + 2)
    expect(history.runs[0]?.id).toBe(history.activeId)
    expect(activeRecord(focusRun(history, history.runs[1]!.id))?.id).toBe(history.runs[1]?.id)
    expect(focusRun(history, 999)).toBe(history)
  })

  it('labels a run from its clock and mode', () => {
    const label = runMenuLabel({
      id: 1,
      at: '2026-10-28T15:04:00.000Z',
      projectName: 'YouTube',
      hint: 'fluid · 60s · seed 1',
      run: run(),
      ranking: [],
    })
    const clock = new Date('2026-10-28T15:04:00.000Z')
    const when = `${String(clock.getHours()).padStart(2, '0')}:${String(clock.getMinutes()).padStart(2, '0')}`
    expect(label).toBe(`${when} · fluid · YouTube`)
  })

  it('ranks services from the run and skips generators and zones', () => {
    const nodes: Node<ServiceNodeData | ZoneNodeData>[] = [
      service('aks', 'AKS', 'azure'),
      service('viewers', 'Viewers', 'generic'),
      service('alb', 'ALB', 'aws'),
      { id: 'zone', type: 'zone', position: { x: 0, y: 0 }, data: { label: 'Azure', provider: 'azure' } },
    ]
    const rows = rankingFromNodes(nodes, run({
      nodeStats: {
        aks: { util: 0.95, completed: 2, rejected: 0, offered: 2, mu: 2.1, capped: true, p99: '2.0 /s', meta: 'fluid', backlog: 0, loss: 0, citation: 'Estimated · AKS' },
        viewers: { util: 0, completed: 0, rejected: 0, offered: 2, mu: Infinity, capped: false, p99: '2 /s', meta: 'fluid · generator', backlog: 0, loss: 0 },
        alb: { util: 0.2, completed: 1, rejected: 0, offered: 1, mu: 5, capped: true, p99: '1.0 /s', meta: 'fluid', backlog: 0, loss: 0 },
      },
    }))
    expect(rows.map((row) => row.id)).toEqual(['aks', 'alb'])
    expect(rows[0]).toMatchObject({ provider: 'Azure', source: 'engine', citation: 'Estimated · AKS' })
  })
})
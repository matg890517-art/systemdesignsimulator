import { describe, expect, it } from 'vitest'
import {
  emitEvery,
  flowPeriodSec,
  pickTick,
  playbackWallMs,
  shouldEmitTick,
  viewRunAt,
} from './playback.ts'
import type { NodeRunStat, RunTick, WorkspaceRun } from './types.ts'

function stat(offered: number): NodeRunStat {
  return {
    util: 0,
    completed: offered,
    rejected: 0,
    offered,
    mu: 10,
    capped: true,
    p99: `${offered} /s`,
    meta: 'test',
    backlog: 0,
    loss: 0,
  }
}

function tick(t: number, offered: number): RunTick {
  return {
    t,
    nodeStats: { cdn: stat(offered) },
    classStats: {},
    edgeOffered: { 'c-cdn': offered },
    edgeClassOffered: {},
  }
}

const run: WorkspaceRun = {
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
  nodeStats: { cdn: stat(480) },
  classStats: {},
  edgeOffered: { 'c-cdn': 480 },
  edgeClassOffered: {},
  ticks: [tick(0.5, 240), tick(19.5, 240), tick(20.5, 480), tick(40, 480)],
  durationSec: 40,
  hint: 'test',
  affectedComponentIds: [],
  breakerOpenEdges: [],
}

describe('F30 playback view', () => {
  it('samples first, last, and every N steps', () => {
    expect(emitEvery(600)).toBe(12)
    expect(shouldEmitTick(1, 600, 12)).toBe(true)
    expect(shouldEmitTick(12, 600, 12)).toBe(true)
    expect(shouldEmitTick(13, 600, 12)).toBe(false)
    expect(shouldEmitTick(600, 600, 12)).toBe(true)
  })

  it('picks the last tick at or before t', () => {
    expect(pickTick(run.ticks, 19)?.edgeOffered['c-cdn']).toBe(240)
    expect(pickTick(run.ticks, 21)?.edgeOffered['c-cdn']).toBe(480)
    expect(viewRunAt(run, 10).nodeStats.cdn.offered).toBe(240)
    expect(viewRunAt(run, 30).nodeStats.cdn.offered).toBe(480)
    expect(viewRunAt(run, 30).edgeOffered['c-cdn']).toBe(480)
  })

  it('keeps a replay short enough to watch and speeds dashes with rate', () => {
    expect(playbackWallMs(60)).toBeGreaterThanOrEqual(4_000)
    expect(playbackWallMs(60)).toBeLessThanOrEqual(12_000)
    expect(flowPeriodSec(500)).toBeLessThan(flowPeriodSec(20))
    expect(flowPeriodSec(0)).toBeGreaterThan(flowPeriodSec(20))
  })
})

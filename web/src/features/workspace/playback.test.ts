import { describe, expect, it } from 'vitest'
import {
  canPlayback,
  emitEvery,
  flowPacketCount,
  flowPeriodSec,
  pickTick,
  playbackWallMs,
  shouldEmitTick,
  viewRunAt,
} from './playback.ts'
import type { NodeRunStat, RunTick, WorkspaceRun } from './types.ts'

function stat(offered: number, extra: Partial<NodeRunStat> = {}): NodeRunStat {
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
    ...extra,
  }
}

function tick(t: number, offered: number, extra: Partial<NodeRunStat> = {}, instantOffered = offered): RunTick {
  return {
    t,
    nodeStats: { cdn: stat(offered, extra) },
    classStats: {},
    edgeOffered: { 'c-cdn': offered },
    edgeClassOffered: {},
    instant: {
      nodeStats: { cdn: stat(instantOffered, extra) },
      classStats: {},
      edgeOffered: { 'c-cdn': instantOffered },
      edgeClassOffered: {},
    },
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
  nodeStats: { cdn: stat(480, { util: 0.5, backlog: 12 }) },
  classStats: {},
  edgeOffered: { 'c-cdn': 480 },
  edgeClassOffered: {},
  ticks: [
    tick(0.5, 120, { util: 0.1, backlog: 0 }, 80),
    tick(19.5, 240, { util: 0.2, backlog: 1 }, 220),
    tick(20.5, 300, { util: 0.9, backlog: 4 }, 480),
    tick(40, 360, { util: 0.9, backlog: 7 }, 400),
  ],
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
    expect(pickTick(run.ticks, 19)?.edgeOffered['c-cdn']).toBe(120)
    expect(pickTick(run.ticks, 19.5)?.edgeOffered['c-cdn']).toBe(240)
    expect(pickTick(run.ticks, 21)?.edgeOffered['c-cdn']).toBe(300)
  })

  it('Average is 0→playhead; Instantaneous is the sample window', () => {
    expect(viewRunAt(run, 10, 'average').edgeOffered['c-cdn']).toBe(120)
    expect(viewRunAt(run, 10, 'average').nodeStats.cdn.backlog).toBe(0)
    expect(viewRunAt(run, 10, 'instant').edgeOffered['c-cdn']).toBe(80)
    expect(viewRunAt(run, 30, 'average').edgeOffered['c-cdn']).toBe(300)
    expect(viewRunAt(run, 30, 'instant').edgeOffered['c-cdn']).toBe(480)
    expect(viewRunAt(run, 40, 'average').nodeStats.cdn.backlog).toBe(7)
  })

  it('keeps a replay short enough to watch and speeds packets with rate', () => {
    expect(playbackWallMs(60)).toBeGreaterThanOrEqual(4_000)
    expect(playbackWallMs(60)).toBeLessThanOrEqual(12_000)
    expect(flowPeriodSec(500)).toBeLessThan(flowPeriodSec(20))
    expect(flowPeriodSec(0)).toBeGreaterThan(flowPeriodSec(20))
    expect(flowPacketCount(0)).toBe(0)
    expect(flowPacketCount(20)).toBeGreaterThanOrEqual(2)
    expect(flowPacketCount(500)).toBeGreaterThan(flowPacketCount(20))
    expect(flowPacketCount(10_000)).toBeLessThanOrEqual(5)
  })

  it('plays Simulated series only', () => {
    expect(canPlayback(run)).toBe(false)
    expect(canPlayback({ ...run, mode: 'analytic' })).toBe(false)
    expect(canPlayback({ ...run, mode: 'simulated' })).toBe(true)
    expect(canPlayback({ ...run, mode: 'simulated', ticks: [tick(40, 480)] })).toBe(false)
  })
})

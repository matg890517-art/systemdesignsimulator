import { describe, expect, it } from 'vitest'
import { compileScenario } from './compile/compile.ts'
import { md1WaitMs, mm1kBlocking, erlangCWaitMs } from './analytic/queue.ts'
import { zipfHitRatio } from './analytic/zipf.ts'
import { solveAnalytic, runAnalyticScenario } from './analytic/solve.ts'
import { simulateOnce, simulateWithSlices } from './des/simulate.ts'
import { LatencyHist } from './des/histogram.ts'
import { tickEveryUs } from './des/ticks.ts'
import { createStreamRng } from './des/rng.ts'
import { SCHEMA_VERSION, defaultRun, defaultTargets } from './schema/index.ts'
import type { ClassHop, Scenario, ScenarioNode } from './schema/scenario.ts'
import { hockeyStickRow, runAnalytic } from './analytic.ts'
import { hockeyStickTopology, workloadAt } from './fixtures.ts'

function client(id: string): ScenarioNode {
  return {
    id,
    kind: 'client',
    servers: { instances: 1, concurrencyPerInstance: 1 },
    service: { dist: 'det', mean_ms: 0, evidence: 'estimated' },
    limits: [],
    buffer: { K: null },
    evidence: 'estimated',
  }
}

function pool(id: string, servers: number, mean_ms: number, dist: 'exp' | 'det' = 'exp'): ScenarioNode {
  return {
    id,
    kind: 'worker',
    servers: { instances: servers, concurrencyPerInstance: 1 },
    service: { dist, mean_ms, scv: dist === 'det' ? 0 : 1, evidence: 'estimated' },
    limits: [],
    buffer: { K: null },
    evidence: 'estimated',
  }
}

function mmcScenario(lambda: number, servers: number, mean_ms: number, dist: 'exp' | 'det' = 'exp'): Scenario {
  return {
    schemaVersion: SCHEMA_VERSION,
    seed: 4821,
    run: { ...defaultRun(4821, 2), warmup_s: 0.4, replications: 1 },
    classes: [{ id: 'read', name: 'Read' }],
    nodes: [client('clients'), pool('pool', servers, mean_ms, dist)],
    edges: [
      {
        id: 'e1',
        from: 'clients',
        to: 'pool',
        perClass: {
          read: {
            routing: 'single',
            weight: 1,
            calls: 1,
            kind: 'sync',
            parallel: false,
            latency: { dist: 'det', mean_ms: 0, evidence: 'estimated' },
          },
        },
      },
    ],
    workload: [{ clientId: 'clients', classId: 'read', profile: 'constant', rate_rps: lambda }],
    targets: defaultTargets(),
  }
}

describe('E1.3 textbook queues', () => {
  it('M/M/1: S = 20 ms, rho = 0.8 → W = 100 ms', () => {
    const result = solveAnalytic(compileScenario(mmcScenario(40, 1, 20)))
    const row = result.nodes.pool
    expect(row?.rho).toBeCloseTo(0.8, 9)
    expect(row?.W_ms).toBeCloseTo(100, 4)
  })

  it('M/D/1 wait is half of M/M/1 wait', () => {
    expect(md1WaitMs(40, 20)).toBeCloseTo((0.8 * 20) / (2 * 0.2), 9)
    const result = solveAnalytic(compileScenario(mmcScenario(40, 1, 20, 'det')))
    expect(result.nodes.pool?.Wq_ms).toBeCloseTo(md1WaitMs(40, 20), 4)
  })

  it('M/M/1/K blocking matches the closed form', () => {
    expect(mm1kBlocking(0.8, 5)).toBeCloseTo(((1 - 0.8) * 0.8 ** 5) / (1 - 0.8 ** 6), 9)
  })
})

describe('E1.5 hockey-stick', () => {
  it('reproduces 6/7/8 servers at 290 rps', () => {
    const six = hockeyStickRow(6)
    expect(six.rho).toBeCloseTo(0.9667, 3)
    expect(six.sojournMs).toBeCloseTo(110.9, 1)
    expect(six.p95WaitMs).toBeCloseTo(290, 0)
    expect(six.status).not.toBe('stable')
    const seven = hockeyStickRow(7)
    expect(seven.sojournMs).toBeCloseTo(29.1, 1)
    const eight = hockeyStickRow(8)
    expect(eight.sojournMs).toBeCloseTo(22.8, 1)
  })
})

describe('E1.2 Jackson', () => {
  it('sends the miss fraction past a Zipf cache', () => {
    const h = zipfHitRatio(80, 400, 1)
    const scenario: Scenario = {
      ...mmcScenario(100, 8, 5),
      nodes: [
        client('clients'),
        {
          ...pool('front', 8, 1),
          kind: 'cache',
          cache: { workingSet: 400, cacheSize: 80, zipfS: 1 },
        },
        pool('origin', 16, 5),
      ],
      edges: [
        mmcScenario(100, 8, 5).edges[0]!,
        {
          id: 'f-o',
          from: 'front',
          to: 'origin',
          perClass: mmcScenario(100, 8, 5).edges[0]!.perClass,
        },
      ],
    }
    scenario.edges[0] = { ...scenario.edges[0]!, to: 'front' }
    const result = solveAnalytic(compileScenario(scenario))
    expect(result.nodes.front?.lambda).toBeCloseTo(100, 6)
    expect(result.nodes.origin?.lambda).toBeCloseTo(100 * (1 - h), 6)
  })
})

describe('E1.1 compile', () => {
  it('drops dangling edges and does not block the run', () => {
    const scenario = mmcScenario(10, 2, 10)
    scenario.edges.push({
      id: 'ghost',
      from: 'clients',
      to: 'missing',
      perClass: scenario.edges[0]!.perClass,
    })
    const compiled = compileScenario(scenario)
    expect(compiled.invalid).toBeUndefined()
    expect(compiled.warnings.some((w) => w.code === 'dangling')).toBe(true)
  })
})

describe('E1.6 DES determinism', () => {
  it('replays the same seed byte-identically on node means', () => {
    const compiled = compileScenario(mmcScenario(20, 4, 10))
    const a = simulateOnce(compiled, 4821)
    const b = simulateOnce(compiled, 4821)
    expect(JSON.stringify(a.nodes)).toBe(JSON.stringify(b.nodes))
  })

  it('keeps other nodes unchanged when an unconnected node is added', () => {
    const base = mmcScenario(20, 4, 10)
    const extra: Scenario = {
      ...base,
      nodes: [
        ...base.nodes,
        {
          ...pool('idle', 2, 10),
          id: 'idle',
        },
      ],
    }
    const a = simulateOnce(compileScenario(base), 7)
    const b = simulateOnce(compileScenario(extra), 7)
    expect(a.nodes.pool?.lambda).toBeCloseTo(b.nodes.pool?.lambda ?? -1, 12)
    expect(b.nodes.idle?.status).toBe('not_wired')
  })

  it('isolates PRNG streams by node id', () => {
    const a = createStreamRng(1, 'pool', 'service')
    const b = createStreamRng(1, 'pool', 'service')
    const c = createStreamRng(1, 'other', 'service')
    expect(a.next()).toBe(b.next())
    expect(a.next()).not.toBe(c.next())
  })
})

describe('E1.4 Zipf closed form', () => {
  it('is 1 when the cache holds the working set', () => {
    expect(zipfHitRatio(100, 100, 0.9)).toBe(1)
    expect(zipfHitRatio(0, 100, 0.9)).toBe(0)
  })
})

describe('legacy adapter still serves J14', () => {
  it('matches Erlang C sojourn', () => {
    const row = runAnalytic(hockeyStickTopology(6), workloadAt(290)).components.pool
    expect(row?.sojournMs).toBeCloseTo(erlangCWaitMs(290, 50, 6) + 20, 6)
  })
})

describe('E1.5 headroom', () => {
  it('reports a positive headroom below the ceiling', () => {
    const result = runAnalyticScenario(mmcScenario(10, 8, 20))
    expect(result.system.headroom_rps).toBeGreaterThan(10)
    expect(result.mode).toBe('analytic')
    expect(result.evidence).toBe('estimated')
  })
})

describe('E1.8 cancel and slices', () => {
  it('stops a DES run when cancelled()', () => {
    const compiled = compileScenario(mmcScenario(200, 4, 10))
    const result = simulateOnce(compiled, 1, { cancelled: () => true })
    expect(result.warnings).toContain('cancelled')
  })

  it('yields on the async slice path and honors cancel', async () => {
    const long = mmcScenario(200, 4, 10)
    long.run = { ...long.run, duration_s: 30, warmup_s: 6 }
    const compiled = compileScenario(long)
    let wall = 0
    const result = await simulateWithSlices(compiled, 1, {
      sliceMs: 1,
      now: () => {
        wall += 2
        return wall
      },
      cancelled: () => wall > 8,
    })
    expect(result.warnings).toContain('cancelled')
    expect(result.mode).toBe('simulated')
  })
})

const hop = (
  routing: ClassHop['routing'] = 'single',
  weight = 1,
): ClassHop => ({
  routing,
  weight,
  calls: 1,
  kind: 'sync',
  parallel: false,
  latency: { dist: 'det', mean_ms: 0, evidence: 'estimated' },
})

function lbSplitScenario(
  left: ClassHop,
  right: ClassHop,
): Scenario {
  return {
    schemaVersion: SCHEMA_VERSION,
    seed: 4821,
    run: defaultRun(4821, 2),
    classes: [{ id: 'read', name: 'Read' }],
    nodes: [
      client('clients'),
      {
        id: 'lb',
        kind: 'load_balancer',
        servers: { instances: 4, concurrencyPerInstance: 1 },
        service: { dist: 'exp', mean_ms: 1, scv: 1, evidence: 'estimated' },
        limits: [],
        buffer: { K: null },
        evidence: 'estimated',
      },
      pool('a', 8, 5),
      pool('b', 8, 5),
    ],
    edges: [
      { id: 'c-lb', from: 'clients', to: 'lb', perClass: { read: hop() } },
      { id: 'lb-a', from: 'lb', to: 'a', perClass: { read: left } },
      { id: 'lb-b', from: 'lb', to: 'b', perClass: { read: right } },
    ],
    workload: [{ clientId: 'clients', classId: 'read', profile: 'constant', rate_rps: 100 }],
    targets: defaultTargets(),
  }
}

describe('load balancer split', () => {
  it('splits two Single backends equally', () => {
    const result = solveAnalytic(compileScenario(lbSplitScenario(hop(), hop())))
    expect(result.nodes.a?.lambda).toBeCloseTo(50, 6)
    expect(result.nodes.b?.lambda).toBeCloseTo(50, 6)
    expect(result.edges['lb-a']?.flow_rps.read).toBeCloseTo(50, 6)
    expect(result.edges['lb-b']?.flow_rps.read).toBeCloseTo(50, 6)
  })

  it('keeps explicit 1:3 weights', () => {
    const result = solveAnalytic(
      compileScenario(lbSplitScenario(hop('weighted', 1), hop('weighted', 3))),
    )
    expect(result.nodes.a?.lambda).toBeCloseTo(25, 6)
    expect(result.nodes.b?.lambda).toBeCloseTo(75, 6)
  })

  it('copies when both hops are broadcast', () => {
    const result = solveAnalytic(
      compileScenario(lbSplitScenario(hop('broadcast'), hop('broadcast'))),
    )
    expect(result.nodes.a?.lambda).toBeCloseTo(100, 6)
    expect(result.nodes.b?.lambda).toBeCloseTo(100, 6)
  })
})

describe('Simulated time series', () => {
  it('emits decimated ticks including t=0 while N7 numbers stay post-warm-up', () => {
    const result = simulateOnce(compileScenario(mmcScenario(40, 1, 20)))
    expect(result.ticks?.length).toBeGreaterThan(1)
    expect(result.ticks?.[0]?.t_s).toBeCloseTo(0, 6)
    expect(result.ticks?.[0]?.nodes.pool?.lambda).toBe(0)
    expect(result.ticks?.at(-1)?.nodes.pool?.lambda).toBeGreaterThan(0)
    expect(Math.abs((result.ticks?.at(-1)?.nodes.pool?.lambda ?? 0) - 40) / 40).toBeLessThan(0.2)
    expect(Math.abs((result.ticks?.at(-1)?.nodes.pool?.rho ?? 0) - 0.8) / 0.8).toBeLessThan(0.25)
    expect(result.ticks?.at(-1)?.nodes.pool?.lambda_now ?? 0).toBeGreaterThan(0)
    expect(Math.abs((result.nodes.pool?.lambda ?? 0) - 40) / 40).toBeLessThan(0.08)
  })

  it('empty wait histogram has no p99', () => {
    const hist = new LatencyHist()
    expect(hist.percentileMs(0.99)).toBeNaN()
    hist.addUs(20_000)
    expect(hist.percentileMs(0.99)).toBeGreaterThan(0)
  })

  it('samples Instantaneous every 1 s, not Workload dt', () => {
    expect(tickEveryUs(2_000_000, 100_000)).toBe(1_000_000)
    expect(tickEveryUs(60_000_000, 100_000)).toBe(1_000_000)
    expect(tickEveryUs(60_000_000)).toBe(1_000_000)
    expect(tickEveryUs(120_000_000)).toBe(2_000_000)
  })

  it('ramps offered load from 0 to the target in Simulated only', () => {
    const scenario = mmcScenario(80, 4, 10)
    scenario.workload = [
      { clientId: 'clients', classId: 'read', profile: 'ramp', rate_rps: 80, ramp_s: 1 },
    ]
    const simulated = simulateOnce(compileScenario(scenario))
    const t1 = simulated.ticks?.find((tick) => tick.t_s >= 0.99 && tick.t_s <= 1.01)
    const late = simulated.ticks?.find((tick) => tick.t_s >= 1.9)
    expect(t1?.nodes.clients?.lambda ?? 0).toBeLessThan(late?.nodes.clients?.lambda ?? 0)
    expect(late?.nodes.clients?.lambda ?? 0).toBeGreaterThan(40)
    const analytic = solveAnalytic(compileScenario(scenario))
    expect(analytic.nodes.pool?.lambda).toBeCloseTo(80, 6)
    expect(analytic.ticks).toBeUndefined()
  })
})

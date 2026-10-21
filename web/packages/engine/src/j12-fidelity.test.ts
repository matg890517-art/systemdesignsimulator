import { describe, expect, it } from 'vitest'
import {
  B_TOLERANCE_RPS,
  absentRecordedTest,
  firstSaturatingComponentId,
  latencyKneeRps,
  parseLoadTestCsv,
  profileGaps,
  rankByUtilization,
  scoreFidelity,
  spearmanRho,
  type RecordedLoadTest,
} from './fidelity.ts'
import { edge, generator, worker, workloadAt } from './fixtures.ts'
import { runFluid } from './run.ts'
import type { CalibrationProfile } from './types.ts'

const harnessRecording: RecordedLoadTest = {
  schema: 1,
  name: 'Harness only',
  kind: 'harness',
  notes: 'Scorer fixture. Not a lab measurement. Must not set Measured.',
  reference: 'generic-9',
  firstSaturatingComponentId: 'tight',
  ranking: [{ componentId: 'tight' }, { componentId: 'slack' }],
}

function tightSlack() {
  return {
    components: [
      generator('clients'),
      worker('tight', { servers: 1, serviceMs: 50, queue: 'unbounded' }),
      worker('slack', { servers: 32, serviceMs: 1, queue: 'unbounded' }),
    ],
    edges: [edge('c-t', 'clients', 'tight'), edge('t-s', 'tight', 'slack')],
  }
}

describe('J12 fidelity', () => {
  it('blocks A and B when no recorded load test exists and never counts Measured', () => {
    const report = scoreFidelity({
      recorded: absentRecordedTest,
      predictedFirst: 'service',
      predictedKneeRps: 120,
      profiles: [
        {
          id: 'ref-service',
          name: 'Generic service',
          notes: 'Estimated example',
          fields: [
            {
              id: 'servers',
              label: 'Servers',
              unit: 'count',
              role: 'servers',
              value: { state: 'set', value: 8, confidence: 'estimated' },
            },
          ],
        },
      ],
    })
    expect(report.checkA.status).toBe('blocked')
    expect(report.checkB.status).toBe('blocked')
    expect(B_TOLERANCE_RPS).toBeUndefined()
    expect(report.measuredLabels).toBe(0)
    expect(report.gaps[0]?.measured).toBe(false)
  })

  it('passes A when the engine names the same first-saturating component as a supplied recording', () => {
    const topology = tightSlack()
    const last = runFluid(topology, workloadAt(40, { durationSec: 4, seed: 4821 })).steps.at(-1)
    if (!last) throw new Error('no steps')
    const ranking = rankByUtilization(topology, last)
    const predicted = firstSaturatingComponentId(ranking)
    expect(predicted).toBe('tight')
    expect(ranking[0]?.id).toBe('tight')
    const report = scoreFidelity({
      recorded: harnessRecording,
      predictedFirst: predicted,
      predictedRanking: ranking.map((row) => row.id),
    })
    expect(report.checkA.status).toBe('pass')
    expect(report.checkA.predicted).toBe('tight')
    expect(report.checkB.status).toBe('blocked')
    expect(report.checkC.detail).toMatch(/diagnostic/i)
  })

  it('extracts a latency knee and Spearman ρ without treating them as a lab pass', () => {
    expect(
      latencyKneeRps([
        { rps: 10, latencyMs: 5 },
        { rps: 20, latencyMs: 6 },
        { rps: 40, latencyMs: 14 },
      ]),
    ).toBe(40)
    expect(spearmanRho(['a', 'b', 'c'], ['a', 'b', 'c'])).toBeCloseTo(1, 8)
    const csv = parseLoadTestCsv(`timestamp,requestClass,latencyMs,status,rps
0,read,5,ok,10
1,read,14,ok,40
`)
    expect(csv).toEqual([
      { rps: 10, latencyMs: 5 },
      { rps: 40, latencyMs: 14 },
    ])
    expect(latencyKneeRps(csv)).toBe(40)
  })

  it('lists unknown roles on a profile and refuses a silent Measured label', () => {
    const profiles: CalibrationProfile[] = [
      {
        id: 'ref-db',
        name: 'Generic database',
        bindsTo: 'db',
        notes: 'Example',
        fields: [
          {
            id: 'servers',
            label: 'Servers',
            unit: 'count',
            role: 'servers',
            value: { state: 'set', value: 4, confidence: 'estimated' },
          },
          {
            id: 'p95',
            label: 'P95',
            unit: 'ms',
            role: 'latencyP95Ms',
            value: { state: 'unknown' },
          },
        ],
      },
    ]
    const gaps = profileGaps(profiles)
    expect(gaps[0]?.unknownRoles).toEqual(['latencyP95Ms'])
    expect(gaps[0]?.measured).toBe(false)
  })
})

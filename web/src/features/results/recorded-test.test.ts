import { describe, expect, it } from 'vitest'
import { absentRecordedTest, parseRecordedTest } from './recorded-test.ts'
import { scoreReferenceFidelity } from './score-reference.ts'

describe('recorded load test', () => {
  it('keeps J12 A and B blocked on the reference stack without a lab file', () => {
    const report = scoreReferenceFidelity(absentRecordedTest)
    expect(report.checkA.status).toBe('blocked')
    expect(report.checkB.status).toBe('blocked')
    expect(report.measuredLabels).toBe(0)
    expect(report.gaps.some((gap) => gap.unknownRoles.includes('queue'))).toBe(true)
    expect(report.gaps.every((gap) => gap.measured === false)).toBe(true)
    expect(report.gaps.every((gap) => gap.confidence !== 'measured')).toBe(true)
  })

  it('accepts a schema-1 JSON recording and rejects CSV as a Measured label', () => {
    const parsed = parseRecordedTest(
      JSON.stringify({
        schema: 1,
        kind: 'lab',
        name: 'Operator supplied',
        firstSaturatingComponentId: 'service',
      }),
    )
    expect(parsed?.kind).toBe('lab')
    expect(parseRecordedTest('timestamp,requestClass,latencyMs,status,rps\n0,read,5,ok,10')).toBeUndefined()
    expect(parseRecordedTest('{"schema":2,"kind":"lab"}')).toBeUndefined()
  })
})

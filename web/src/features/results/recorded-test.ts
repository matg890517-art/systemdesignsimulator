import { absentRecordedTest, type RecordedLoadTest } from '@sds/engine'

export { absentRecordedTest }

export function parseRecordedTest(raw: string): RecordedLoadTest | undefined {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return undefined
  try {
    const parsed = JSON.parse(trimmed) as Partial<RecordedLoadTest>
    if (parsed.schema !== 1) return undefined
    if (parsed.kind !== 'lab' && parsed.kind !== 'harness' && parsed.kind !== 'absent') return undefined
    return {
      schema: 1,
      name: parsed.name ?? 'Recorded test',
      kind: parsed.kind,
      recordedOn: parsed.recordedOn,
      sourceUrl: parsed.sourceUrl,
      notes: parsed.notes ?? '',
      reference: 'generic-9',
      firstSaturatingComponentId: parsed.firstSaturatingComponentId,
      latencyKneeRps: parsed.latencyKneeRps,
      ranking: parsed.ranking,
    }
  } catch {
    return undefined
  }
}

import { describe, expect, it } from 'vitest'
import {
  aksInputsFromProfiles,
  costFromProfiles,
  mergeProfiles,
  numericIfSet,
  parseCalibrationCsv,
  serializeCalibrationCsv,
} from './calibration.ts'
import { edge, generator, worker } from './fixtures.ts'
import { runFluid } from './run.ts'
import type { CalibrationProfile } from './types.ts'

const sample = `profileId,name,bindsTo,notes,fieldId,label,unit,role,state,value,confidence,sourceId
aks-transcode,AKS transcode,aks,Example design not a lab measurement,servers,Slots,count,servers,set,84,estimated,example
aks-transcode,AKS transcode,aks,Example design not a lab measurement,serviceMs,Service time,ms,serviceMs,set,40000,estimated,example
copy-link,Azure to AWS copy,,Do not cap the engine,bandwidth,Bandwidth,bps,bandwidthBps,unknown,,,
`

describe('calibration profiles', () => {
  it('parses optional source, date, tier, region and version columns', () => {
    const text = `profileId,name,bindsTo,notes,fieldId,label,unit,role,state,value,confidence,sourceId,source,retrievedOn,version,tier,region
aks-transcode,AKS transcode,aks,Example,servers,Slots,count,servers,set,84,vendor,https://example,https://example,2026-10-20,1,standard,eastus
`
    const profiles = parseCalibrationCsv(text)
    expect(profiles[0]?.source).toBe('https://example')
    expect(profiles[0]?.retrievedOn).toBe('2026-10-20')
    expect(profiles[0]?.tier).toBe('standard')
    expect(profiles[0]?.fields[0]?.value).toMatchObject({ confidence: 'vendor' })
  })

  it('parses CSV and round-trips set vs unknown', () => {
    const profiles = parseCalibrationCsv(sample)
    expect(profiles).toHaveLength(2)
    const aks = profiles[0]
    expect(aks?.bindsTo).toBe('aks')
    expect(aks?.fields[0]?.value).toEqual({
      state: 'set',
      value: 84,
      confidence: 'estimated',
      sourceId: 'example',
    })
    expect(profiles[1]?.fields[0]?.value).toEqual({ state: 'unknown' })
    const again = parseCalibrationCsv(serializeCalibrationCsv(profiles))
    expect(again).toEqual(profiles)
  })

  it('never treats unknown bandwidth as an engine cap', () => {
    const profiles = parseCalibrationCsv(sample)
    const copy = profiles.find((item) => item.id === 'copy-link')
    const bandwidth = copy?.fields.find((field) => field.role === 'bandwidthBps')
    expect(numericIfSet(bandwidth?.value ?? { state: 'unknown' })).toBeUndefined()
  })

  it('reads AKS slots and service time only when set', () => {
    const profiles = parseCalibrationCsv(sample)
    expect(aksInputsFromProfiles(profiles)).toEqual({
      servers: 84,
      serviceMs: 40000,
      queue: undefined,
      serversConfidence: 'estimated',
      serviceConfidence: 'estimated',
    })
  })

  it('merges measured slots onto an existing profile', () => {
    const current = parseCalibrationCsv(sample)
    const incoming: CalibrationProfile[] = [
      {
        id: 'aks-transcode',
        name: 'AKS transcode',
        bindsTo: 'aks',
        notes: 'Lab sample',
        fields: [
          {
            id: 'servers',
            label: 'Slots',
            unit: 'count',
            role: 'servers',
            value: { state: 'set', value: 97, confidence: 'measured', sourceId: 'lab-1' },
          },
        ],
      },
    ]
    const merged = mergeProfiles(current, incoming)
    expect(aksInputsFromProfiles(merged).servers).toBe(97)
    expect(aksInputsFromProfiles(merged).serversConfidence).toBe('measured')
    expect(aksInputsFromProfiles(merged).serviceMs).toBe(40000)
  })

  it('drops AKS completions to zero when the upload link is cut', () => {
    const result = runFluid(
      {
        components: [
          generator('uploaders'),
          worker('aks', { servers: 84, serviceMs: 40_000, queue: 200 }),
        ],
        edges: [
          edge('up-aks', 'uploaders', 'aks', {
            network: {
              latencyMs: 0,
              bandwidthApplies: 'both',
              lossProb: 1,
              serialization: false,
            },
          }),
        ],
      },
      {
        durationSec: 2,
        dtSec: 0.1,
        seed: 4821,
        offered: { uploaders: { read: 2 } },
      },
    )
    const last = result.steps.at(-1)
    if (!last) throw new Error('no steps')
    expect(last.components.aks.read.completed).toBeCloseTo(0, 9)
    expect(last.edges['up-aks']?.read.delivered).toBeCloseTo(0, 9)
  })
})

describe('F11 typed cost', () => {
  it('stays unknown until a node has $/hr, then sums Estimated values', () => {
    const empty = costFromProfiles(parseCalibrationCsv(sample))
    expect(empty.value).toBe('unknown')
    expect(empty.priced).toBe(0)
    expect(empty.eligible).toBe(0)
    const priced: CalibrationProfile[] = [
      {
        id: 'ecs',
        name: 'ECS',
        bindsTo: 'ecs',
        notes: 'Hand-typed. Not a catalog SKU.',
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
      {
        id: 'aks',
        name: 'AKS',
        bindsTo: 'aks',
        notes: 'Hand-typed. Not a catalog SKU.',
        fields: [
          {
            id: 'costUsdPerHour',
            label: 'Hourly cost',
            unit: 'USD/hr',
            role: 'costUsdPerHour',
            value: { state: 'set', value: 40, confidence: 'estimated' },
          },
        ],
      },
      {
        id: 'cdn',
        name: 'CDN',
        bindsTo: 'cdn',
        notes: 'Empty stays unknown.',
        fields: [
          {
            id: 'costUsdPerHour',
            label: 'Hourly cost',
            unit: 'USD/hr',
            role: 'costUsdPerHour',
            value: { state: 'unknown' },
          },
        ],
      },
    ]
    const cost = costFromProfiles(priced)
    expect(cost.usdPerHour).toBe(52.5)
    expect(cost.usdPerDay).toBe(52.5 * 24)
    expect(cost.usdPerMonth).toBe(52.5 * 730)
    expect(cost.priced).toBe(2)
    expect(cost.eligible).toBe(3)
    expect(cost.value).toBe('$52.50/hr')
    expect(cost.hint).toMatch(/2 of 3 nodes/)
    expect(cost.hint).toMatch(/\$1,260\/d/)
    expect(cost.hint).toMatch(/Estimated/)
    expect(cost.hint).toMatch(/not catalog SKUs/)
    expect(cost.rows.map((row) => row.bindsTo)).toEqual(['ecs', 'aks'])
  })
})

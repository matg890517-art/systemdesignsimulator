import { describe, expect, it } from 'vitest'
import {
  aksInputsFromProfiles,
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

import { useSyncExternalStore } from 'react'
import {
  aksInputsFromProfiles,
  mergeProfiles,
  parseCalibrationCsv,
  serializeCalibrationCsv,
} from '@sds/engine'
import type { CalibrationProfile, Confidence, FaultMode } from './types.ts'

export type { CalibrationProfile, Confidence, FaultMode }

export const youtubeSeedProfiles: CalibrationProfile[] = [
  {
    id: 'aks-transcode',
    name: 'AKS transcode workers',
    bindsTo: 'aks',
    notes:
      'Example design for the YouTube-style scenario. Not a lab measurement. Fluid mode uses service time as a constant mean; P95 stays unused until discrete-event.',
    fields: [
      {
        id: 'servers',
        label: 'Slots',
        unit: 'count',
        role: 'servers',
        value: { state: 'set', value: 84, confidence: 'estimated', sourceId: 'example' },
      },
      {
        id: 'serviceMs',
        label: 'Service time (mean)',
        unit: 'ms',
        role: 'serviceMs',
        value: { state: 'set', value: 40_000, confidence: 'estimated', sourceId: 'example' },
      },
      {
        id: 'queue',
        label: 'Queue capacity',
        unit: 'jobs',
        role: 'queue',
        value: { state: 'set', value: 200, confidence: 'estimated', sourceId: 'example' },
      },
      {
        id: 'p95Ms',
        label: 'Service time P95',
        unit: 'ms',
        role: 'latencyP95Ms',
        value: { state: 'unknown' },
      },
    ],
  },
  {
    id: 'copy-link',
    name: 'Azure to AWS copy link',
    notes:
      'Results may show 0.8 vs 0.88 GB/s as Estimated from the example. Bandwidth is unknown here, so it must not cap the engine.',
    fields: [
      {
        id: 'bandwidthBps',
        label: 'Bandwidth',
        unit: 'bps',
        role: 'bandwidthBps',
        value: { state: 'unknown' },
      },
    ],
  },
  {
    id: 'cloudfront-hit',
    name: 'CloudFront cache hit',
    bindsTo: 'cloudfront',
    notes: 'Hit rate from the example canvas. Estimated, not a vendor quote or a measurement.',
    fields: [
      {
        id: 'hitRate',
        label: 'Cache hit rate',
        unit: 'fraction',
        role: 'cacheHitRate',
        value: { state: 'set', value: 0.92, confidence: 'estimated', sourceId: 'example' },
      },
    ],
  },
]

export const sampleCalibrationCsv = `profileId,name,bindsTo,notes,fieldId,label,unit,role,state,value,confidence,sourceId
aks-transcode,AKS transcode workers,aks,Lab overwrite,servers,Slots,count,servers,set,97,measured,lab-1
`

type LibraryState = {
  profiles: CalibrationProfile[]
  fault: FaultMode
}

let state: LibraryState = { profiles: youtubeSeedProfiles, fault: 'none' }
const listeners = new Set<() => void>()

function emit(next: LibraryState) {
  state = next
  for (const listener of listeners) listener()
}

export function getLibraryState(): LibraryState {
  return state
}

export function useLibrary() {
  return useSyncExternalStore(subscribeLibrary, getLibraryState, getLibraryState)
}

export function subscribeLibrary(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getProfiles(): CalibrationProfile[] {
  return state.profiles
}

export function getFault(): FaultMode {
  return state.fault
}

export function setFault(fault: FaultMode) {
  emit({ ...state, fault })
}

export function profileForNode(nodeId: string): CalibrationProfile | undefined {
  return state.profiles.find((profile) => profile.bindsTo === nodeId)
}

export function updateProfile(next: CalibrationProfile) {
  upsertProfile(next)
}

export function upsertProfile(next: CalibrationProfile) {
  const exists = state.profiles.some((profile) => profile.id === next.id)
  emit({
    ...state,
    profiles: exists
      ? state.profiles.map((profile) => (profile.id === next.id ? next : profile))
      : [...state.profiles, next],
  })
}

export function upsertProfiles(incoming: CalibrationProfile[]) {
  const byId = new Map(state.profiles.map((profile) => [profile.id, profile]))
  for (const profile of incoming) byId.set(profile.id, profile)
  emit({ ...state, profiles: [...byId.values()] })
}

export function replaceProfiles(incoming: CalibrationProfile[]) {
  emit({ ...state, profiles: incoming })
}

export function importCalibrationCsv(text: string) {
  const incoming = parseCalibrationCsv(text)
  emit({ ...state, profiles: mergeProfiles(state.profiles, incoming) })
  return incoming.length
}

export function exportCalibrationCsv(): string {
  return serializeCalibrationCsv(state.profiles)
}

export function aksRunPlan():
  | {
      ok: true
      servers: number
      serviceMs: number
      queue: number
      serversConfidence: Confidence
      serviceConfidence: Confidence
    }
  | { ok: false; reason: string } {
  const inputs = aksInputsFromProfiles(state.profiles)
  if (inputs.servers === undefined) {
    return { ok: false, reason: 'AKS slots are unknown. Set them in Calibration before running.' }
  }
  if (inputs.serviceMs === undefined) {
    return {
      ok: false,
      reason: 'AKS service time is unknown. Set it in Calibration before running.',
    }
  }
  if (inputs.queue === undefined) {
    return {
      ok: false,
      reason: 'AKS queue capacity is unknown. Set it or mark it not applicable.',
    }
  }
  return {
    ok: true,
    servers: inputs.servers,
    serviceMs: inputs.serviceMs,
    queue: inputs.queue,
    serversConfidence: inputs.serversConfidence ?? 'estimated',
    serviceConfidence: inputs.serviceConfidence ?? 'estimated',
  }
}

export function lossProbForFault(fault = state.fault): number {
  if (fault === 'packet-drop') return 0.1
  if (fault === 'link-cut') return 1
  return 0
}

export const FAULT_OPTIONS: { id: FaultMode; label: string; body: string }[] = [
  {
    id: 'none',
    label: 'None',
    body: 'Upload link delivers every request. Engine lossProb = 0.',
  },
  {
    id: 'packet-drop',
    label: 'Packet drop 10%',
    body: 'Sets lossProb = 0.1 on the uploaders → AKS edge. Completions fall to 1.8 /s.',
  },
  {
    id: 'link-cut',
    label: 'Link cut',
    body: 'Sets lossProb = 1. AKS sees no delivered work.',
  },
  {
    id: 'crash',
    label: 'AKS crash',
    body: 'Run with 0 slots. Calibration is unchanged; this is a temporary fault.',
  },
  {
    id: 'latency-spike',
    label: 'Upload latency spike',
    body: 'Adds 200 ms on the uploaders → AKS edge in discrete-event mode. Fluid ignores it.',
  },
]

import { useSyncExternalStore } from 'react'
import {
  aksInputsFromProfiles,
  mergeProfiles,
  parseCalibrationCsv,
  serializeCalibrationCsv,
} from '@sds/engine'
import { initialNodes } from '../workspace/graph.ts'
import { exampleProfileForNode, profilesWithExampleCapacity } from '../workspace/node-profile.ts'
import { browserStore, loadCurrent, patchCurrentLibrary } from '../workspace/persistence.ts'
import type { ServiceNodeData } from '../workspace/types.ts'
import type { CalibrationProfile, Confidence, FaultMode } from './types.ts'

export type { CalibrationProfile, Confidence, FaultMode }

const youtubeExampleNote =
  'Quoted YouTube load (100M views/day, 1M uploads/day) with example Estimated n and S. Not a vendor quote, not a catalog quota, not Measured. Cost stays unknown.'

export const youtubeSeedProfiles: CalibrationProfile[] = initialNodes
  .filter((node) => node.type !== 'zone')
  .map((node) => {
    const data = node.data as ServiceNodeData
    return { ...exampleProfileForNode(node.id, data.title, data.catalogId), notes: youtubeExampleNote }
  })

export const sampleCalibrationCsv = `profileId,name,bindsTo,notes,fieldId,label,unit,role,state,value,confidence,sourceId
node-transcoder,Transcoder,transcoder,Lab overwrite,servers,Servers,count,servers,set,8,measured,lab-1
`

type LibraryState = {
  profiles: CalibrationProfile[]
  fault: FaultMode
}

let state: LibraryState = { profiles: youtubeSeedProfiles, fault: 'none' }
let didHydrate = false
const listeners = new Set<() => void>()

function persistLibrary() {
  const store = browserStore()
  if (!store) return
  patchCurrentLibrary(store, state.profiles, state.fault)
}

function emit(next: LibraryState) {
  state = next
  persistLibrary()
  for (const listener of listeners) listener()
}

/** Results and Calibration do not mount Workspace, so they need the saved canvas library. */
export function hydrateLibraryFromSnapshot() {
  if (didHydrate) return
  didHydrate = true
  const store = browserStore()
  const snap = store ? loadCurrent(store) : undefined
  if (!snap) return
  state = {
    profiles: profilesWithExampleCapacity(snap.nodes, snap.profiles),
    fault: snap.fault,
  }
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
    body: 'Sets lossProb = 0.1 on the Client → Load Balancing upload hop. Phase 1 Analytic ignores faults.',
  },
  {
    id: 'link-cut',
    label: 'Link cut',
    body: 'Sets lossProb = 1 on the Client → Load Balancing hop. Transcoders see no delivered uploads.',
  },
  {
    id: 'crash',
    label: 'Transcoder crash',
    body: 'Run with 0 servers on the Transcoder API worker. Calibration is unchanged.',
  },
  {
    id: 'latency-spike',
    label: 'Upload latency spike',
    body: 'Adds 200 ms on the Client → Load Balancing hop in discrete-event mode. Analytic ignores it.',
  },
]

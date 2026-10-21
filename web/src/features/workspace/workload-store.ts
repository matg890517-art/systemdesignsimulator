import { useSyncExternalStore } from 'react'
import { defaultWorkloadDraft, type WorkloadDraft } from './compile.ts'

let draft: WorkloadDraft = defaultWorkloadDraft()
const listeners = new Set<() => void>()

function emit(next: WorkloadDraft) {
  draft = next
  for (const listener of listeners) listener()
}

export function getWorkloadDraft(): WorkloadDraft {
  return draft
}

export function setWorkloadDraft(next: WorkloadDraft) {
  emit(next)
}

export function patchWorkloadDraft(patch: Partial<WorkloadDraft>) {
  emit({ ...draft, ...patch })
}

export function subscribeWorkload(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useWorkloadDraft() {
  return useSyncExternalStore(subscribeWorkload, getWorkloadDraft, getWorkloadDraft)
}

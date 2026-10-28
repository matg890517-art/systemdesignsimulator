import { runEngineJob, type EngineJobRequest } from './engine-job.ts'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<EngineJobRequest | { type: 'cancel' }>) => void) | null
  postMessage: (message: unknown) => void
}

let cancelled = false

scope.onmessage = (event) => {
  const data = event.data
  if (data && typeof data === 'object' && 'type' in data && data.type === 'cancel') {
    cancelled = true
    return
  }
  cancelled = false
  void runEngineJob(data as EngineJobRequest, (message) => scope.postMessage(message), () => cancelled)
}

import { runWorkspace, type RunProgress } from './run-workspace.ts'
import type { EngineJobMessage, EngineJobRequest, EngineJobResult } from './engine-job.ts'

type JobInput = Omit<EngineJobRequest, 'id'>

let worker: Worker | undefined
let nextId = 1

function getWorker(): Worker {
  worker ??= new Worker(new URL('./engine-worker.ts', import.meta.url), { type: 'module' })
  return worker
}

export function runWorkspaceAsync(
  input: JobInput,
  onProgress?: (progress: RunProgress) => void,
): Promise<EngineJobResult> {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return Promise.resolve(
      runWorkspace(input.nodes, input.edges, input.draft, input.profiles, input.fault, onProgress),
    )
  }

  const id = nextId
  nextId += 1
  const target = getWorker()

  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent<EngineJobMessage>) => {
      const message = event.data
      if (message.id !== id) return
      if (message.type === 'progress') {
        onProgress?.({ t: message.t, fraction: message.fraction, nodeStats: message.nodeStats })
        return
      }
      target.removeEventListener('message', onMessage)
      target.removeEventListener('error', onError)
      if (message.type === 'error') {
        reject(new Error(message.message))
        return
      }
      resolve(message.result)
    }
    const onError = (event: ErrorEvent) => {
      target.removeEventListener('message', onMessage)
      target.removeEventListener('error', onError)
      reject(event.error instanceof Error ? event.error : new Error(event.message))
    }
    target.addEventListener('message', onMessage)
    target.addEventListener('error', onError)
    const request: EngineJobRequest = { id, ...input }
    target.postMessage(request)
  })
}

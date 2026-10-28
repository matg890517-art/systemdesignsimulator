import { runWorkspace, type RunProgress } from './run-workspace.ts'
import type { EngineJobMessage, EngineJobRequest, EngineJobResult } from './engine-job.ts'

type JobInput = Omit<EngineJobRequest, 'id'>

let worker: Worker | undefined
let nextId = 1
const pending = new Map<number, (error: Error) => void>()

/** Thrown to a caller whose run was stopped from the toolbar. Not an engine failure. */
export class RunStoppedError extends Error {
  constructor() {
    super('Run stopped')
    this.name = 'RunStoppedError'
  }
}

export function isRunStopped(error: unknown): error is RunStoppedError {
  return error instanceof Error && error.name === 'RunStoppedError'
}

function getWorker(): Worker {
  worker ??= new Worker(new URL('./engine-worker.ts', import.meta.url), { type: 'module' })
  return worker
}

/**
 * The engine runs synchronously inside the worker, so the only way to stop a job mid-run is
 * to terminate the worker. The next run spins up a fresh one. Returns false when idle.
 */
export function stopWorkspaceRun(): boolean {
  if (!worker || pending.size === 0) return false
  worker.terminate()
  worker = undefined
  const rejects = [...pending.values()]
  pending.clear()
  for (const reject of rejects) reject(new RunStoppedError())
  return true
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
    const cleanup = () => {
      pending.delete(id)
      target.removeEventListener('message', onMessage)
      target.removeEventListener('error', onError)
    }
    const onMessage = (event: MessageEvent<EngineJobMessage>) => {
      const message = event.data
      if (message.id !== id) return
      if (message.type === 'progress') {
        onProgress?.({
          t: message.t,
          fraction: message.fraction,
          nodeStats: message.nodeStats,
          classStats: message.classStats,
          edgeOffered: message.edgeOffered,
          edgeClassOffered: message.edgeClassOffered,
        })
        return
      }
      cleanup()
      if (message.type === 'error') {
        reject(new Error(message.message))
        return
      }
      resolve(message.result)
    }
    const onError = (event: ErrorEvent) => {
      cleanup()
      reject(event.error instanceof Error ? event.error : new Error(event.message))
    }
    pending.set(id, (error) => {
      cleanup()
      reject(error)
    })
    target.addEventListener('message', onMessage)
    target.addEventListener('error', onError)
    const request: EngineJobRequest = { id, ...input }
    target.postMessage(request)
  })
}

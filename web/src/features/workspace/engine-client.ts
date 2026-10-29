import { liveDelayMs, liveHoldMs } from './live-pace.ts'
import { runWorkspace, type RunProgress } from './run-workspace.ts'
import type { EngineJobMessage, EngineJobRequest, EngineJobResult } from './engine-job.ts'

type JobInput = Omit<EngineJobRequest, 'id'>

let worker: Worker | undefined
let nextId = 1
let liveGen = 0
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

/**
 * Cooperative cancel posts first so a yielding Simulated run can stop. Terminate still
 * unfreezes the tab if the job is in a blocking slice.
 */
export function stopWorkspaceRun(): boolean {
  liveGen += 1
  if (!worker || pending.size === 0) return false
  try {
    worker.postMessage({ type: 'cancel' })
  } catch {
    /* terminate below */
  }
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
  const pace = input.pace ?? 0
  const origin = performance.now()
  const gen = liveGen
  let paint = Promise.resolve()

  const deliver = (progress: RunProgress) => {
    if (!onProgress) return
    if (!(pace > 0)) {
      onProgress(progress)
      return
    }
    paint = paint.then(async () => {
      if (gen !== liveGen) return
      const wait = liveDelayMs(origin, progress.t, pace, performance.now())
      if (wait > 1) await sleep(wait)
      if (gen !== liveGen) return
      onProgress(progress)
    })
  }

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
        deliver({
          t: message.t,
          fraction: message.fraction,
          nodeStats: message.nodeStats,
          classStats: message.classStats,
          edgeOffered: message.edgeOffered,
          edgeClassOffered: message.edgeClassOffered,
        })
        return
      }
      if (message.type === 'error') {
        cleanup()
        reject(new Error(message.message))
        return
      }
      void paint
        .then(async () => {
          if (gen !== liveGen) return
          if (message.result.ok && pace > 0) {
            const hold = liveHoldMs(origin, input.draft.durationSec, pace, performance.now())
            if (hold > 1) await sleep(hold)
          }
        })
        .then(() => {
          if (gen !== liveGen) return
          cleanup()
          resolve(message.result)
        })
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
    const request: EngineJobRequest = { id, ...input, pace: 0 }
    target.postMessage(request)
  })
}

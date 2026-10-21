import { runEngineJob, type EngineJobRequest } from './engine-job.ts'

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<EngineJobRequest>) => void) | null
  postMessage: (message: unknown) => void
}

scope.onmessage = (event) => {
  runEngineJob(event.data, (message) => scope.postMessage(message))
}

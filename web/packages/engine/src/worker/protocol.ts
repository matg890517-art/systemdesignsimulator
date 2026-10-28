import type { Scenario } from '../schema/scenario.ts'
import type { EngineMode, EngineResult } from '../schema/result.ts'

export type EngineInMessage =
  | { type: 'run'; scenario: Scenario; mode: EngineMode }
  | { type: 'cancel' }

export type EngineOutMessage =
  | { type: 'progress'; events: number; t_s: number }
  | { type: 'result'; result: EngineResult }
  | { type: 'error'; message: string }

/** Slice budget so a worker can yield. Wall-time, not simulated time. */
export const WORKER_SLICE_MS = 8

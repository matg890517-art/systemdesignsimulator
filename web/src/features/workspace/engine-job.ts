import type { CalibrationProfile } from '@sds/engine'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import type { FaultMode } from '../calibration/types.ts'
import type { WorkloadDraft } from './compile.ts'
import { runWorkspace } from './run-workspace.ts'
import type { RunTick, ServiceNodeData, WorkspaceRun, ZoneNodeData } from './types.ts'

export type EngineJobRequest = {
  id: number
  nodes: Node<ServiceNodeData | ZoneNodeData>[]
  edges: RfEdge[]
  draft: WorkloadDraft
  profiles: CalibrationProfile[]
  fault: FaultMode
}

export type EngineJobResult = { ok: true; run: WorkspaceRun } | { ok: false; reason: string }

export type EngineJobMessage =
  | ({ id: number; type: 'progress'; fraction: number } & RunTick)
  | { id: number; type: 'done'; result: EngineJobResult }
  | { id: number; type: 'error'; message: string }

export function runEngineJob(request: EngineJobRequest, post: (message: EngineJobMessage) => void) {
  try {
    const result = runWorkspace(
      request.nodes,
      request.edges,
      request.draft,
      request.profiles,
      request.fault,
      (progress) => {
        post({
          id: request.id,
          type: 'progress',
          ...progress,
        })
      },
    )
    if (result.ok) {
      result.run.hint = `${result.run.hint} · worker`
    }
    post({ id: request.id, type: 'done', result })
  } catch (error) {
    post({
      id: request.id,
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

import type { Edge, Node } from '@xyflow/react'
import { catalogEntryById, exampleNodeCatalogIds } from '../catalog/catalog.ts'
import {
  applyHopNoteLabel,
  classSummaryLabel,
  defaultEdgeData,
  withActiveClasses,
  type WorkspaceClassId,
  type WorkspaceEdgeData,
} from './edge-data.ts'
import {
  createEnvironment,
  ENV_GRID,
  orderZonesBeforeChildren,
} from './environment.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export const workspaceNodeTypes = ['service', 'zone'] as const

/** 4×2 so the dropped GCP tiles match the quoted upload vs streaming split. */
export const youtubeEnvSize = {
  width: ENV_GRID.padX * 2 + 4 * ENV_GRID.cardW + 3 * ENV_GRID.gap,
  height: ENV_GRID.padTop + 2 * ENV_GRID.cardH + ENV_GRID.gap + ENV_GRID.padBottom,
}

const PALETTE_DROP_META = 'Dropped from catalog · quotas unknown'

function envCell(col: number, row: number): { x: number; y: number } {
  return {
    x: ENV_GRID.padX + col * (ENV_GRID.cardW + ENV_GRID.gap),
    y: ENV_GRID.padTop + row * (ENV_GRID.cardH + ENV_GRID.gap),
  }
}

function paletteService(
  id: keyof typeof exampleNodeCatalogIds,
  parentId: string | undefined,
  position: { x: number; y: number },
  title: string,
): Node<ServiceNodeData> {
  const catalogId = exampleNodeCatalogIds[id]
  const entry = catalogEntryById(catalogId)
  return {
    id,
    type: 'service',
    parentId,
    position,
    data: {
      title,
      util: 0,
      p99: 'not run',
      meta: PALETTE_DROP_META,
      provider: entry?.provider ?? (catalogId.startsWith('generic-') ? 'generic' : 'gcp'),
      catalogId,
    },
  }
}

function hop(
  id: string,
  source: string,
  target: string,
  classes: WorkspaceClassId[],
  extra?: { note?: 'miss'; broadcast?: boolean; asyncCall?: boolean },
): Edge {
  let data: WorkspaceEdgeData = withActiveClasses(defaultEdgeData(), classes)
  if (extra?.broadcast) data = { ...data, routing: { mode: 'broadcast' } }
  if (extra?.asyncCall) data = { ...data, call: { kind: 'async' } }
  if (extra?.note) data = { ...data, note: extra.note }
  const summary = classSummaryLabel(data.classes)
  return {
    id,
    source,
    target,
    type: 'smoothstep',
    label: applyHopNoteLabel(summary, extra?.note === 'miss'),
    data,
  }
}

export const initialNodes: Node<ServiceNodeData | ZoneNodeData>[] = orderZonesBeforeChildren([
  paletteService('client', undefined, { x: 16, y: ENV_GRID.y + envCell(0, 0).y }, 'Client'),
  createEnvironment({
    id: 'gcp',
    provider: 'gcp',
    position: { x: ENV_GRID.x, y: ENV_GRID.y },
    size: youtubeEnvSize,
  }),
  paletteService('glb', 'gcp', envCell(0, 0), 'Cloud Load Balancing'),
  paletteService('upload', 'gcp', envCell(1, 0), 'Upload Service'),
  paletteService('consumer', 'gcp', envCell(2, 0), 'Video Consumer'),
  paletteService('mediacdn', 'gcp', envCell(3, 0), 'Media CDN'),
  paletteService('gcs', 'gcp', envCell(0, 1), 'Cloud Storage'),
  paletteService('transcoder', 'gcp', envCell(1, 1), 'Transcoder'),
  paletteService('metaproc', 'gcp', envCell(2, 1), 'Metadata Processor'),
  paletteService('bigtable', 'gcp', envCell(3, 1), 'Bigtable'),
])

export const initialEdges: Edge[] = [
  hop('c-lb', 'client', 'glb', ['read', 'write', 'bulk']),
  hop('lb-upload', 'glb', 'upload', ['write', 'bulk']),
  hop('lb-consumer', 'glb', 'consumer', ['read']),
  hop('upload-gcs', 'upload', 'gcs', ['bulk']),
  hop('gcs-transcoder', 'gcs', 'transcoder', ['bulk'], { asyncCall: true }),
  hop('transcoder-gcs', 'transcoder', 'gcs', ['write']),
  hop('transcoder-meta', 'transcoder', 'metaproc', ['bulk']),
  hop('metaproc-bt', 'metaproc', 'bigtable', ['bulk']),
  hop('consumer-cdn', 'consumer', 'mediacdn', ['read'], { broadcast: true }),
  hop('consumer-bt', 'consumer', 'bigtable', ['read'], { broadcast: true }),
  hop('cdn-gcs', 'mediacdn', 'gcs', ['read'], { note: 'miss' }),
]

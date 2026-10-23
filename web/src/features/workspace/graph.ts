import type { Edge, Node } from '@xyflow/react'
import { exampleNodeCatalogIds } from '../catalog/catalog.ts'
import {
  createEnvironment,
  defaultEnvironmentSize,
  ENV_GRID,
} from './environment.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export const workspaceNodeTypes = ['service', 'zone'] as const

export const youtubeEnvSize = defaultEnvironmentSize

function envY(index: number): number {
  return ENV_GRID.y + index * (youtubeEnvSize.height + ENV_GRID.stackGap)
}

function envCell(col: number, row: number): { x: number; y: number } {
  return {
    x: ENV_GRID.padX + col * (ENV_GRID.cardW + ENV_GRID.gap),
    y: ENV_GRID.padTop + row * (ENV_GRID.cardH + ENV_GRID.gap),
  }
}

function zone(id: string, provider: ZoneNodeData['provider'], y: number): Node<ZoneNodeData> {
  return createEnvironment({
    id,
    provider,
    position: { x: ENV_GRID.x, y },
  })
}

function service(
  id: string,
  parentId: string | undefined,
  position: { x: number; y: number },
  data: ServiceNodeData,
): Node<ServiceNodeData> {
  return {
    id,
    type: 'service',
    parentId,
    position,
    data,
    extent: parentId ? 'parent' : undefined,
  }
}

export const initialNodes: Node<ServiceNodeData | ZoneNodeData>[] = [
  service('viewers', undefined, { x: 16, y: envY(0) + envCell(0, 0).y }, {
    title: 'Viewers',
    util: 0,
    p99: '51.2k rps',
    meta: 'Poisson arrivals',
    provider: 'generic',
  }),
  zone('aws', 'aws', envY(0)),
  service('cloudfront', 'aws', envCell(0, 0), {
    title: 'CloudFront',
    util: 0.41,
    p99: 'p99 38 ms',
    meta: 'AWS · hit rate 92%',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.cloudfront,
  }),
  service('alb', 'aws', envCell(1, 0), {
    title: 'Application LB',
    util: 0.22,
    p99: 'p99 5 ms',
    meta: 'AWS · 5,200 rps',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.alb,
  }),
  service('ecs', 'aws', envCell(2, 0), {
    title: 'ECS ×60',
    util: 0.74,
    p99: 'p99 210 ms',
    meta: 'AWS · 87 rps each',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.ecs,
  }),
  service('elasticache', 'aws', envCell(0, 1), {
    title: 'ElastiCache',
    util: 0.58,
    p99: 'p99 3 ms',
    meta: 'AWS · hit rate 80%',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.elasticache,
  }),
  service('dynamodb', 'aws', envCell(1, 1), {
    title: 'DynamoDB',
    util: 0.71,
    p99: 'p99 14 ms',
    meta: 'AWS · 2,000 ops/s',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.dynamodb,
  }),
  zone('gcp', 'gcp', envY(1)),
  service('gke', 'gcp', envCell(0, 0), {
    title: 'GKE ×12',
    util: 0.62,
    p99: 'p99 90 ms',
    meta: 'GCP · recommendations',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.gke,
  }),
  service('pubsub', 'gcp', envCell(1, 0), {
    title: 'Pub/Sub',
    util: 0.24,
    p99: 'p99 18 ms',
    meta: 'GCP · view events',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.pubsub,
  }),
  service('cloudrun', 'gcp', envCell(2, 0), {
    title: 'Cloud Run',
    util: 0.46,
    p99: 'p99 120 ms',
    meta: 'GCP · view aggregator',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.cloudrun,
  }),
  service('firestore', 'gcp', envCell(0, 1), {
    title: 'Firestore',
    util: 0.39,
    p99: 'p99 18 ms',
    meta: 'GCP · view counters',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.firestore,
  }),
  zone('azure', 'azure', envY(2)),
  service('aks', 'azure', envCell(0, 0), {
    title: 'AKS ×84',
    util: 0.95,
    p99: '84 slots',
    meta: 'Azure · transcoders',
    provider: 'azure',
    engineId: 'aks',
    catalogId: exampleNodeCatalogIds.aks,
  }),
  service('servicebus', 'azure', envCell(1, 0), {
    title: 'Service Bus',
    util: 0.04,
    p99: 'p99 2.1 s',
    meta: 'Azure · depth, cap 2k',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.servicebus,
  }),
  service('blob', 'azure', envCell(2, 0), {
    title: 'Blob Storage',
    util: 0.28,
    p99: 'p99 110 ms',
    meta: 'Azure · raw uploads',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.blob,
  }),
  service('frontdoor', 'azure', envCell(0, 1), {
    title: 'Front Door',
    util: 0.12,
    p99: 'p99 25 ms',
    meta: 'Azure · upload ingress',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.frontdoor,
  }),
  service('uploaders', undefined, { x: 16, y: envY(2) + envCell(0, 0).y }, {
    title: 'Uploaders',
    util: 0,
    p99: '2 /s',
    meta: 'Poisson arrivals',
    provider: 'generic',
    engineId: 'uploaders',
  }),
]

function hop(
  id: string,
  source: string,
  target: string,
  label: string,
  extra?: { cross?: boolean },
): Edge {
  const cross = extra?.cross === true
  return {
    id,
    source,
    target,
    label: cross ? `${label} · cross · Estimated` : label,
    ...(cross ? { style: { strokeDasharray: '6 4', stroke: '#B7791F' } } : {}),
    ...(cross
      ? {
          data: {
            crossProvider: true,
            routing: { mode: 'single' as const },
            fanOut: 1,
            call: { kind: 'sync' as const },
          },
        }
      : {}),
  }
}

export const initialEdges: Edge[] = [
  hop('v-cf', 'viewers', 'cloudfront', 'R/W'),
  hop('cf-alb', 'cloudfront', 'alb', 'R/W'),
  hop('alb-ecs', 'alb', 'ecs', 'R/W'),
  hop('ecs-cache', 'ecs', 'elasticache', 'R'),
  hop('cache-ddb', 'elasticache', 'dynamodb', 'R'),
  hop('ddb-gke', 'dynamodb', 'gke', 'R/A'),
  hop('gke-ps', 'gke', 'pubsub', 'R/A'),
  hop('ps-run', 'pubsub', 'cloudrun', 'R/A'),
  hop('run-fs', 'cloudrun', 'firestore', 'R/A'),
  hop('up-aks', 'uploaders', 'aks', 'B'),
  hop('aks-sb', 'aks', 'servicebus', 'B'),
  hop('sb-blob', 'servicebus', 'blob', 'B'),
  hop('blob-fd', 'blob', 'frontdoor', 'B'),
  hop('copy-link', 'blob', 'cloudfront', 'B', { cross: true }),
]


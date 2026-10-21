import type { Edge, Node } from '@xyflow/react'
import { exampleNodeCatalogIds } from '../catalog/catalog.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

export const workspaceNodeTypes = ['service', 'zone'] as const

function zone(
  id: string,
  label: string,
  provider: ZoneNodeData['provider'],
  x: number,
  y: number,
  width: number,
  height: number,
): Node<ZoneNodeData> {
  return {
    id,
    type: 'zone',
    position: { x, y },
    style: { width, height },
    data: { label, provider },
    draggable: false,
    selectable: false,
  }
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
  service('viewers', undefined, { x: 16, y: 88 }, {
    title: 'Viewers',
    util: 0,
    p99: '51.2k rps',
    meta: 'Poisson arrivals',
    provider: 'generic',
  }),
  zone('aws', 'AWS', 'aws', 168, 16, 980, 168),
  service('cloudfront', 'aws', { x: 16, y: 40 }, {
    title: 'CloudFront',
    util: 0.41,
    p99: 'p99 38 ms',
    meta: 'AWS · hit rate 92%',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.cloudfront,
  }),
  service('alb', 'aws', { x: 188, y: 40 }, {
    title: 'Application LB',
    util: 0.22,
    p99: 'p99 5 ms',
    meta: 'AWS · 5,200 rps',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.alb,
  }),
  service('ecs', 'aws', { x: 360, y: 40 }, {
    title: 'ECS ×60',
    util: 0.74,
    p99: 'p99 210 ms',
    meta: 'AWS · 87 rps each',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.ecs,
  }),
  service('elasticache', 'aws', { x: 532, y: 40 }, {
    title: 'ElastiCache',
    util: 0.58,
    p99: 'p99 3 ms',
    meta: 'AWS · hit rate 80%',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.elasticache,
  }),
  service('dynamodb', 'aws', { x: 704, y: 40 }, {
    title: 'DynamoDB',
    util: 0.71,
    p99: 'p99 14 ms',
    meta: 'AWS · 2,000 ops/s',
    provider: 'aws',
    catalogId: exampleNodeCatalogIds.dynamodb,
  }),
  zone('gcp', 'GCP', 'gcp', 168, 204, 720, 168),
  service('gke', 'gcp', { x: 16, y: 40 }, {
    title: 'GKE ×12',
    util: 0.62,
    p99: 'p99 90 ms',
    meta: 'GCP · recommendations',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.gke,
  }),
  service('pubsub', 'gcp', { x: 188, y: 40 }, {
    title: 'Pub/Sub',
    util: 0.24,
    p99: 'p99 18 ms',
    meta: 'GCP · view events',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.pubsub,
  }),
  service('cloudrun', 'gcp', { x: 360, y: 40 }, {
    title: 'Cloud Run',
    util: 0.46,
    p99: 'p99 120 ms',
    meta: 'GCP · view aggregator',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.cloudrun,
  }),
  service('firestore', 'gcp', { x: 532, y: 40 }, {
    title: 'Firestore',
    util: 0.39,
    p99: 'p99 18 ms',
    meta: 'GCP · view counters',
    provider: 'gcp',
    catalogId: exampleNodeCatalogIds.firestore,
  }),
  zone('azure', 'AZURE', 'azure', 168, 392, 720, 176),
  service('aks', 'azure', { x: 16, y: 44 }, {
    title: 'AKS ×84',
    util: 0.95,
    p99: '84 slots',
    meta: 'Azure · transcoders',
    provider: 'azure',
    engineId: 'aks',
    catalogId: exampleNodeCatalogIds.aks,
  }),
  service('servicebus', 'azure', { x: 188, y: 44 }, {
    title: 'Service Bus',
    util: 0.04,
    p99: 'p99 2.1 s',
    meta: 'Azure · depth, cap 2k',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.servicebus,
  }),
  service('blob', 'azure', { x: 360, y: 44 }, {
    title: 'Blob Storage',
    util: 0.28,
    p99: 'p99 110 ms',
    meta: 'Azure · raw uploads',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.blob,
  }),
  service('frontdoor', 'azure', { x: 532, y: 44 }, {
    title: 'Front Door',
    util: 0.12,
    p99: 'p99 25 ms',
    meta: 'Azure · upload ingress',
    provider: 'azure',
    catalogId: exampleNodeCatalogIds.frontdoor,
  }),
  service('uploaders', undefined, { x: 912, y: 428 }, {
    title: 'Uploaders',
    util: 0,
    p99: '2 /s',
    meta: 'Poisson arrivals',
    provider: 'generic',
    engineId: 'uploaders',
  }),
]

export const initialEdges: Edge[] = [
  { id: 'v-cf', source: 'viewers', target: 'cloudfront', label: 'R 50k' },
  { id: 'cf-alb', source: 'cloudfront', target: 'alb', label: '5.2k' },
  { id: 'alb-ecs', source: 'alb', target: 'ecs', label: '5.2k' },
  { id: 'ecs-cache', source: 'ecs', target: 'elasticache', label: 'R 4k' },
  { id: 'cache-ddb', source: 'elasticache', target: 'dynamodb', label: '2.0k' },
  { id: 'ddb-gke', source: 'dynamodb', target: 'gke', label: 'A 2.6k' },
  { id: 'gke-ps', source: 'gke', target: 'pubsub', label: 'A 2.6k' },
  { id: 'ps-run', source: 'pubsub', target: 'cloudrun', label: 'A 2.6k' },
  { id: 'run-fs', source: 'cloudrun', target: 'firestore', label: 'A 2.6k' },
  { id: 'up-aks', source: 'uploaders', target: 'aks', label: 'B 2/s' },
  { id: 'aks-sb', source: 'aks', target: 'servicebus', label: 'A 2/s' },
  { id: 'sb-blob', source: 'servicebus', target: 'blob', label: 'A 2/s' },
  { id: 'blob-fd', source: 'blob', target: 'frontdoor', label: 'B 2/s' },
  {
    id: 'copy-link',
    source: 'blob',
    target: 'cloudfront',
    label: 'copy 0.8 GB/s',
    style: { strokeDasharray: '6 4' },
  },
]


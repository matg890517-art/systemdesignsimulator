import { genericBlocks } from '@sds/engine'
import { catalogEntryById } from '../catalog/catalog.ts'

export type IconMode = 'service' | 'normal'

/** Glyphs in the Real-base 20px slot. Service is the original service mark; Normal is the kind shape. */
export type IconGlyph =
  | 'clients'
  | 'lb'
  | 'service'
  | 'cache'
  | 'db'
  | 'queue'
  | 'worker'
  | 'cdn'
  | 'object'
  | 'compute'
  | 'function'
  | 'k8s'
  | 'api'
  | 'dns'
  | 'bus'
  | 'zone'

const KIND_GLYPH: Record<string, IconGlyph> = {
  traffic_generator: 'clients',
  gateway: 'api',
  load_balancer: 'lb',
  service: 'service',
  worker: 'worker',
  queue: 'queue',
  event_bus: 'bus',
  cache: 'cache',
  relational_db: 'db',
  nosql_db: 'db',
  object_storage: 'object',
  cdn: 'cdn',
}

const CATEGORY_GLYPH: Record<string, IconGlyph> = {
  Compute: 'compute',
  Containers: 'k8s',
  Storage: 'object',
  Database: 'db',
  Cache: 'cache',
  'Network and CDN': 'cdn',
  'Messaging and integration': 'queue',
  Analytics: 'service',
  Media: 'cdn',
  'Kubernetes object': 'k8s',
  GENERIC: 'service',
  ENVIRONMENT: 'zone',
}

function categoryGlyph(category?: string): IconGlyph | undefined {
  if (!category) return undefined
  if (CATEGORY_GLYPH[category]) return CATEGORY_GLYPH[category]
  const folded = category.toLowerCase()
  for (const [key, glyph] of Object.entries(CATEGORY_GLYPH)) {
    if (key.toLowerCase() === folded) return glyph
  }
  return undefined
}

function serviceFallbackGlyph(label: string, category?: string): IconGlyph | undefined {
  if (/\benvironment\b/.test(label) || category === 'ENVIRONMENT') return 'zone'
  if (/\blambda\b|cloud functions|cloud run|app runner|functions?/.test(label)) return 'function'
  if (/\b(eks|ecs|gke|aks|kubernetes|k8s|fargate)\b/.test(label)) return 'k8s'
  if (/\b(ec2|compute engine|virtual machine|\bvm\b|lightsail|batch)\b/.test(label)) return 'compute'
  if (/\b(api gateway|apigee|gateway)\b/.test(label)) return 'api'
  if (/\b(route 53|cloud dns|dns)\b/.test(label)) return 'dns'
  if (/\b(pub.?sub|eventbridge|event grid|event hubs|sns|service bus)\b/.test(label)) return 'bus'
  if (/\b(sqs|queue|pubsub)\b/.test(label)) return 'queue'
  if (/\b(s3|blob|object|cloud storage|ebs|efs|fsx)\b/.test(label)) return 'object'
  if (/\b(redis|elasticache|memorystore|memcached|cache)\b/.test(label)) return 'cache'
  if (/\b(rds|sql|dynamo|cosmos|firestore|spanner|bigtable|database)\b/.test(label)) return 'db'
  if (/\b(cloudfront|front door|cloud cdn|cdn|cloudflare)\b/.test(label)) return 'cdn'
  if (/\b(load balancer|application lb|nlb|alb|application gateway)\b/.test(label)) return 'lb'
  if (/\b(client|viewer|uploader)\b/.test(label)) return 'clients'
  return undefined
}

export function iconGlyphFor(input: {
  mode: IconMode
  name: string
  catalogId?: string
  category?: string
}): IconGlyph {
  const generic = genericBlocks.find((block) => block.id === input.catalogId)
  const entry = input.catalogId ? catalogEntryById(input.catalogId) : undefined
  const category = input.category ?? entry?.category ?? generic?.category
  const kindGlyph = generic ? (KIND_GLYPH[generic.kind] ?? 'service') : undefined
  if (input.mode === 'normal') {
    return kindGlyph ?? categoryGlyph(category) ?? 'service'
  }
  const label = `${input.catalogId ?? ''} ${input.name}`.toLowerCase()
  return (
    serviceFallbackGlyph(label, category) ??
    kindGlyph ??
    categoryGlyph(category) ??
    'service'
  )
}

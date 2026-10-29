import type { CanonicalKind } from '@sds/engine'

/** Hop families for “can A connect to B?”. Catalog kind maps here; title does not. */
export type HopFamily = 'client' | 'cdn' | 'lb' | 'compute' | 'cache' | 'db' | 'object' | 'async'

export const HOP_FAMILY_LABEL: Record<HopFamily, string> = {
  client: 'Clients',
  cdn: 'CDN',
  lb: 'Load balancer',
  compute: 'Service or worker',
  cache: 'Cache',
  db: 'Database',
  object: 'Object store',
  async: 'Queue',
}

export function hopFamily(kind: CanonicalKind): HopFamily {
  switch (kind) {
    case 'traffic_generator':
      return 'client'
    case 'cdn':
      return 'cdn'
    case 'load_balancer':
      return 'lb'
    case 'gateway':
    case 'service':
    case 'worker':
      return 'compute'
    case 'cache':
      return 'cache'
    case 'relational_db':
    case 'nosql_db':
      return 'db'
    case 'object_storage':
      return 'object'
    case 'queue':
    case 'event_bus':
      return 'async'
  }
}

/**
 * Allowed directed hops. Nothing targets Clients.
 * YouTube + Generic 9-block edges are all in this set (cache miss, CDC, copy-to-CDN).
 */
const ALLOWED: Record<HopFamily, readonly HopFamily[]> = {
  client: ['cdn', 'lb', 'compute', 'cache', 'db', 'object', 'async'],
  cdn: ['cdn', 'lb', 'compute', 'cache', 'db', 'object'],
  lb: ['cdn', 'lb', 'compute', 'cache', 'db', 'object', 'async'],
  compute: ['cdn', 'lb', 'compute', 'cache', 'db', 'object', 'async'],
  cache: ['cdn', 'lb', 'compute', 'db', 'object'],
  db: ['lb', 'compute', 'async', 'object'],
  object: ['cdn', 'lb', 'compute', 'async', 'object'],
  async: ['lb', 'compute', 'db', 'object', 'async'],
}

export function canHop(from: CanonicalKind, to: CanonicalKind): boolean {
  const dest = hopFamily(to)
  if (dest === 'client') return false
  return ALLOWED[hopFamily(from)].includes(dest)
}

export function hopRefusal(from: CanonicalKind, to: CanonicalKind): string | undefined {
  if (canHop(from, to)) return undefined
  const src = HOP_FAMILY_LABEL[hopFamily(from)]
  const dest = HOP_FAMILY_LABEL[hopFamily(to)]
  if (hopFamily(to) === 'client') return 'Clients only send load. They cannot be a target.'
  return `${src} cannot connect to ${dest}.`
}

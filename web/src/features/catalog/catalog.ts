import type { ProviderBinding } from '@sds/engine'
import { catalogEntries, catalogReadOn } from './entries.ts'
import type {
  CatalogEntry,
  CatalogProvider,
  LimitsOnPage,
  PaletteGroup,
  PaletteProvider,
} from './types.ts'

export { catalogEntries, catalogReadOn }
export type { CatalogEntry, CatalogProvider, LimitsOnPage, PaletteGroup, PaletteProvider }

export const CATALOG_PROVIDERS: { id: CatalogProvider; label: string }[] = [
  { id: 'aws', label: 'AWS' },
  { id: 'azure', label: 'Azure' },
  { id: 'gcp', label: 'GCP' },
  { id: 'kubernetes', label: 'Kubernetes' },
]

export const PALETTE_PROVIDERS: { id: PaletteProvider; label: string }[] = [
  ...CATALOG_PROVIDERS,
  { id: 'generic', label: 'Generic' },
]

const CATEGORY_ORDER = [
  'Compute',
  'Containers',
  'Storage',
  'Database',
  'Cache',
  'Network and CDN',
  'Messaging and integration',
  'Analytics',
  'Media',
  'Kubernetes object',
]

/** Example canvas node id → catalog row. Binding only; no quota numbers. */
export const exampleNodeCatalogIds: Record<string, string> = {
  cloudfront: 'aws-cloudfront',
  alb: 'aws-application-load-balancer',
  ecs: 'aws-ecs',
  elasticache: 'aws-elasticache',
  dynamodb: 'aws-dynamodb',
  gke: 'gcp-gke',
  pubsub: 'gcp-pub-sub',
  cloudrun: 'gcp-cloud-run',
  firestore: 'gcp-firestore',
  aks: 'azure-aks',
  servicebus: 'azure-service-bus',
  blob: 'azure-blob-storage',
  frontdoor: 'azure-front-door',
}

const genericGroups: PaletteGroup[] = [
  {
    category: 'TRAFFIC',
    count: 2,
    tiles: [
      { name: 'Traffic generator', provider: 'generic' },
      { name: 'Fan-out', provider: 'generic' },
    ],
  },
]

export function catalogEntryById(id: string): CatalogEntry | undefined {
  return catalogEntries.find((entry) => entry.id === id)
}

export function catalogForNode(nodeId: string, catalogId?: string): CatalogEntry | undefined {
  if (catalogId) return catalogEntryById(catalogId)
  const mapped = exampleNodeCatalogIds[nodeId]
  return mapped ? catalogEntryById(mapped) : undefined
}

export function exampleNodesFor(entryId: string): string[] {
  return Object.entries(exampleNodeCatalogIds)
    .filter(([, catalogId]) => catalogId === entryId)
    .map(([nodeId]) => nodeId)
}

export function catalogStats(entries: readonly CatalogEntry[]) {
  return {
    total: entries.length,
    yes: entries.filter((entry) => entry.limitsOnPage === 'yes').length,
    partial: entries.filter((entry) => entry.limitsOnPage === 'partial').length,
    no: entries.filter((entry) => entry.limitsOnPage === 'no').length,
  }
}

export function filterCatalog(
  entries: readonly CatalogEntry[],
  opts: { provider?: CatalogProvider | 'all'; query?: string; limits?: LimitsOnPage | 'all' },
): CatalogEntry[] {
  const query = opts.query?.trim().toLowerCase() ?? ''
  return entries.filter((entry) => {
    if (opts.provider && opts.provider !== 'all' && entry.provider !== opts.provider) return false
    if (opts.limits && opts.limits !== 'all' && entry.limitsOnPage !== opts.limits) return false
    if (!query) return true
    return (
      entry.name.toLowerCase().includes(query) ||
      entry.category.toLowerCase().includes(query) ||
      entry.docsUrl.toLowerCase().includes(query)
    )
  })
}

export function paletteGroupsFor(provider: PaletteProvider, query = ''): PaletteGroup[] {
  const needle = query.trim().toLowerCase()
  if (provider === 'generic') {
    if (!needle) return genericGroups
    return genericGroups
      .map((group) => ({
        ...group,
        tiles: group.tiles.filter((tile) => tile.name.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.tiles.length > 0)
      .map((group) => ({ ...group, count: group.tiles.length }))
  }

  const grouped = new Map<string, CatalogEntry[]>()
  for (const entry of catalogEntries) {
    if (entry.provider !== provider) continue
    if (
      needle &&
      !entry.name.toLowerCase().includes(needle) &&
      !entry.category.toLowerCase().includes(needle)
    ) {
      continue
    }
    const list = grouped.get(entry.category) ?? []
    list.push(entry)
    grouped.set(entry.category, list)
  }

  const categories = [
    ...CATEGORY_ORDER.filter((category) => grouped.has(category)),
    ...[...grouped.keys()].filter((category) => !CATEGORY_ORDER.includes(category)),
  ]

  return categories.map((category) => {
    const entries = grouped.get(category) ?? []
    return {
      category: category.toUpperCase(),
      count: entries.length,
      tiles: entries.map((entry) => ({
        name: entry.name,
        catalogId: entry.id,
        provider: entry.provider,
        limitsOnPage: entry.limitsOnPage,
      })),
    }
  })
}

/** Attach a cloud service to a component without inventing quota numbers. */
export function emptyProviderBinding(entry: CatalogEntry): ProviderBinding {
  return {
    provider: entry.provider,
    service: entry.name,
    quotas: [],
  }
}

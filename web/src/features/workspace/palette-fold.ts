import { catalogEntryById } from '../catalog/catalog.ts'
import type { PaletteGroup, PaletteProvider, PaletteTile } from '../catalog/types.ts'

const CLOSED: Record<PaletteProvider, boolean> = {
  generic: false,
  aws: false,
  azure: false,
  gcp: false,
  kubernetes: false,
}

const CATEGORY_LABEL: Record<string, string> = {
  GENERIC: 'Blocks',
  COMPUTE: 'Compute',
  CONTAINERS: 'Containers',
  STORAGE: 'Storage',
  DATABASE: 'Database',
  CACHE: 'Cache',
  'NETWORK AND CDN': 'Network',
  'MESSAGING AND INTEGRATION': 'Messaging',
  ANALYTICS: 'Analytics',
  MEDIA: 'Media',
  'KUBERNETES OBJECT': 'Objects',
  'CLUSTER LIMITS': 'Cluster',
  ENVIRONMENT: 'Environment',
}

export function categoryLabel(category: string): string {
  if (CATEGORY_LABEL[category]) return CATEGORY_LABEL[category]!
  return category
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function folderKey(provider: PaletteProvider, category: string): string {
  return `${provider}:${category}`
}

/** One provider folder open at a time, like a file explorer. */
export function accordionProviders(
  current: Record<PaletteProvider, boolean>,
  id: PaletteProvider,
): Record<PaletteProvider, boolean> {
  return { ...CLOSED, [id]: !current[id] }
}

export function firstCategoryOpen(
  provider: PaletteProvider,
  groups: PaletteGroup[],
): Record<string, boolean> {
  const first = groups[0]
  if (!first) return {}
  return { [folderKey(provider, first.category)]: true }
}

export function providersOpenOnly(id: PaletteProvider): Record<PaletteProvider, boolean> {
  return { ...CLOSED, [id]: true }
}

/** Open every category that holds a catalog id currently on the canvas (Front Door lives in Network, not Compute). */
export function categoriesOpenForCatalogIds(
  provider: PaletteProvider,
  groups: PaletteGroup[],
  catalogIds: readonly string[],
): Record<string, boolean> {
  const wanted = new Set(catalogIds)
  const next: Record<string, boolean> = {}
  for (const group of groups) {
    if (group.tiles.some((tile) => tile.catalogId && wanted.has(tile.catalogId))) {
      next[folderKey(provider, group.category)] = true
    }
  }
  if (Object.keys(next).length === 0) return firstCategoryOpen(provider, groups)
  return next
}

const CLOUD_PROVIDERS = ['aws', 'azure', 'gcp', 'kubernetes'] as const

/** Open the cloud folder that holds the dropped tiles so Load YouTube shows GCP, not Generic. */
export function foldersFromCanvas(tiles: PaletteTile[], groupsFor: (provider: PaletteProvider) => PaletteGroup[]) {
  const catalogIds = tiles
    .map((tile) => tile.catalogId)
    .filter((id): id is string => Boolean(id))
  const cloud = CLOUD_PROVIDERS.find((provider) => tiles.some((tile) => tile.provider === provider))
  if (!cloud) {
    return {
      providers: providersOpenOnly('generic'),
      categories: { [folderKey('generic', 'GENERIC')]: true },
    }
  }
  return {
    providers: providersOpenOnly(cloud),
    categories: categoriesOpenForCatalogIds(cloud, groupsFor(cloud), catalogIds),
  }
}

export function canvasPaletteTiles(
  nodes: {
    id: string
    type?: string
    data: { title?: string; catalogId?: string; provider?: PaletteProvider }
  }[],
): PaletteTile[] {
  const tiles: PaletteTile[] = []
  const seen = new Set<string>()
  for (const node of nodes) {
    if (node.type === 'zone') continue
    const title = node.data.title ?? node.id
    const catalogId = node.data.catalogId
    const key = `${catalogId ?? node.id}:${title}`
    if (seen.has(key)) continue
    seen.add(key)
    const entry = catalogId ? catalogEntryById(catalogId) : undefined
    tiles.push({
      name: title,
      catalogId,
      provider: node.data.provider ?? entry?.provider ?? 'generic',
      limitsOnPage: entry?.limitsOnPage,
    })
  }
  return tiles
}

/** The On canvas folder follows the user's toggle. A search that hits it forces the folder open. */
export function canvasFolderOpen(pinnedOpen: boolean, query: string, matchCount: number): boolean {
  if (query.trim()) return matchCount > 0
  return pinnedOpen
}

/** Searching opens every folder that has a match, and every matching category. */
export function searchOpenState(
  query: string,
  groupsByProvider: Record<PaletteProvider, PaletteGroup[]>,
): { providers: Record<PaletteProvider, boolean>; categories: Record<string, boolean> } | undefined {
  const needle = query.trim()
  if (!needle) return undefined
  const providers = { ...CLOSED }
  const categories: Record<string, boolean> = {}
  for (const [id, groups] of Object.entries(groupsByProvider) as [PaletteProvider, PaletteGroup[]][]) {
    if (groups.length === 0) continue
    providers[id] = true
    for (const group of groups) {
      categories[folderKey(id, group.category)] = true
    }
  }
  return { providers, categories }
}

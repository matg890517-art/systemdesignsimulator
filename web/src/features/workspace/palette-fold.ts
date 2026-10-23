import type { PaletteGroup, PaletteProvider } from '../catalog/types.ts'

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

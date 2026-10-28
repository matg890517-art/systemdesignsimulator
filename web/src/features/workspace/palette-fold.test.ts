import { describe, expect, it } from 'vitest'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import { referenceBindings } from '../catalog/provider-maps.ts'
import {
  accordionProviders,
  canvasFolderOpen,
  canvasPaletteTiles,
  categoriesOpenForCatalogIds,
  categoryLabel,
  firstCategoryOpen,
  folderKey,
  providersOpenOnly,
  searchOpenState,
} from './palette-fold.ts'
import { referenceStackGraph } from './reference-graph.ts'

describe('palette folder explorer', () => {
  it('keeps Generic first and shortens long category names', () => {
    expect(PALETTE_PROVIDERS[0]?.id).toBe('generic')
    expect(categoryLabel('NETWORK AND CDN')).toBe('Network')
    expect(categoryLabel('MESSAGING AND INTEGRATION')).toBe('Messaging')
    expect(categoryLabel('COMPUTE')).toBe('Compute')
  })

  it('keeps On canvas closed until opened, and opens it while a search matches', () => {
    expect(canvasFolderOpen(false, '', 4)).toBe(false)
    expect(canvasFolderOpen(true, '', 4)).toBe(true)
    expect(canvasFolderOpen(false, 'aks', 1)).toBe(true)
    expect(canvasFolderOpen(true, 'zzz', 0)).toBe(false)
  })

  it('opens one provider folder at a time', () => {
    const afterAws = accordionProviders(
      { generic: true, aws: false, azure: false, gcp: false, kubernetes: false },
      'aws',
    )
    expect(afterAws).toEqual({
      generic: false,
      aws: true,
      azure: false,
      gcp: false,
      kubernetes: false,
    })
    expect(accordionProviders(afterAws, 'aws').aws).toBe(false)
  })

  it('opens the first category when a provider folder expands', () => {
    const groups = paletteGroupsFor('aws')
    expect(firstCategoryOpen('aws', groups)[folderKey('aws', 'COMPUTE')]).toBe(true)
    expect(Object.keys(firstCategoryOpen('aws', groups))).toHaveLength(1)
  })

  it('lists every Azure 9-block card including Front Door', () => {
    const azure = referenceStackGraph('azure')
    const tiles = canvasPaletteTiles(azure.nodes)
    expect(tiles.map((tile) => tile.name)).toEqual([
      'Clients',
      'Front Door',
      'Application Gateway',
      'AKS',
      'Cache for Redis',
      'Database for PostgreSQL',
      'Service Bus',
      'Container Apps',
      'Blob Storage',
    ])
    expect(providersOpenOnly('azure').azure).toBe(true)
    expect(providersOpenOnly('azure').generic).toBe(false)
    const open = categoriesOpenForCatalogIds(
      'azure',
      paletteGroupsFor('azure'),
      Object.values(referenceBindings.azure).map((bind) => bind.catalogId),
    )
    expect(open[folderKey('azure', 'NETWORK AND CDN')]).toBe(true)
    expect(open[folderKey('azure', 'CONTAINERS')]).toBe(true)
    expect(open[folderKey('azure', 'COMPUTE')]).toBeUndefined()
  })

  it('search opens only folders that match', () => {
    const groupsByProvider = Object.fromEntries(
      PALETTE_PROVIDERS.map((item) => [item.id, paletteGroupsFor(item.id, 'lambda')]),
    ) as Parameters<typeof searchOpenState>[1]
    const open = searchOpenState('lambda', groupsByProvider)
    expect(open?.providers.aws).toBe(true)
    expect(open?.providers.generic).toBe(false)
    expect(open?.categories[folderKey('aws', 'COMPUTE')]).toBe(true)
    expect(searchOpenState('', groupsByProvider)).toBeUndefined()
  })
})

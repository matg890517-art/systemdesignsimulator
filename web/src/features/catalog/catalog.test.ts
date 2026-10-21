import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  catalogEntries,
  catalogReadOn,
  catalogStats,
  emptyProviderBinding,
  exampleNodeCatalogIds,
  filterCatalog,
  paletteGroupsFor,
} from './catalog.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

describe('catalog data', () => {
  it('is a cloud-agnostic list with official pages and no quota numbers', () => {
    expect(catalogReadOn).toBe('2026-10-20')
    expect(catalogEntries).toHaveLength(137)
    const ids = catalogEntries.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const entry of catalogEntries) {
      expect(Object.keys(entry).sort()).toEqual([
        'category',
        'docsUrl',
        'id',
        'limitsOnPage',
        'name',
        'provider',
      ])
      expect(entry.docsUrl.startsWith('https://')).toBe(true)
      expect(['yes', 'partial', 'no']).toContain(entry.limitsOnPage)
      expect(entry).not.toHaveProperty('quotas')
      expect(emptyProviderBinding(entry).quotas).toEqual([])
    }
    const stats = catalogStats(catalogEntries)
    expect(stats.yes + stats.partial + stats.no).toBe(stats.total)
    expect(catalogEntries.filter((entry) => entry.provider === 'aws')).toHaveLength(50)
    expect(catalogEntries.filter((entry) => entry.provider === 'azure')).toHaveLength(44)
    expect(catalogEntries.filter((entry) => entry.provider === 'gcp')).toHaveLength(35)
    expect(catalogEntries.filter((entry) => entry.provider === 'kubernetes')).toHaveLength(8)
  })

  it('maps the example canvas to catalog rows without inventing measurements', () => {
    for (const catalogId of Object.values(exampleNodeCatalogIds)) {
      const entry = catalogEntries.find((item) => item.id === catalogId)
      expect(entry, catalogId).toBeDefined()
    }
    const aks = catalogEntries.find((entry) => entry.id === 'azure-aks')
    expect(aks?.docsUrl).toContain('aks/quotas')
    expect(aks?.limitsOnPage).toBe('yes')
  })

  it('filters by provider and search, and drives the workspace palette', () => {
    const aks = filterCatalog(catalogEntries, { provider: 'azure', query: 'aks' })
    expect(aks.map((entry) => entry.name)).toEqual(['AKS'])
    const compute = paletteGroupsFor('aws')
    expect(compute[0]?.category).toBe('COMPUTE')
    expect(compute[0]?.count).toBe(7)
    expect(compute[0]?.tiles.map((tile) => tile.name)).toEqual([
      'EC2',
      'Lambda',
      'Fargate',
      'Batch',
      'App Runner',
      'Elastic Beanstalk',
      'Lightsail',
    ])
    expect(paletteGroupsFor('generic')[0]?.tiles.map((tile) => tile.name)).toEqual([
      'Clients',
      'Load balancer',
      'Service',
      'Cache',
      'Database',
      'Queue',
      'Worker pool',
      'CDN',
      'Object store',
    ])
  })

  it('does not live in the engine package', () => {
    const engineIndex = readFileSync(join(root, 'web/packages/engine/src/index.ts'), 'utf8')
    expect(engineIndex).not.toContain('catalog')
    const fluid = readFileSync(join(root, 'web/packages/engine/src/fluid.ts'), 'utf8')
    expect(fluid).not.toMatch(/aws|azure|gcp|kubernetes/i)
  })
})

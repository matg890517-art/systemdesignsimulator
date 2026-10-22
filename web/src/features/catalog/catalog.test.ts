import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { usableAsCeiling } from '@sds/engine'
import {
  catalogEntries,
  catalogReadOn,
  catalogStats,
  catalogValuesFor,
  comparisonRows,
  emptyProviderBinding,
  exampleNodeCatalogIds,
  filterCatalog,
  PALETTE_PROVIDERS,
  paletteGroupsFor,
} from './catalog.ts'
import { mappedProviders, referenceBindings } from './provider-maps.ts'

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

  it('puts Generic first in the workspace palette folders', () => {
    expect(PALETTE_PROVIDERS[0]?.id).toBe('generic')
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
    expect(engineIndex).not.toContain('catalogEntries')
    const fluid = readFileSync(join(root, 'web/packages/engine/src/fluid.ts'), 'utf8')
    expect(fluid).not.toMatch(/aws|azure|gcp|kubernetes/i)
  })

  it('keeps verified ECS task quota as a documented ceiling that does not fill unknown', () => {
    const values = catalogValuesFor('aws-ecs')
    expect(values[0]?.value).toBe(5_000)
    expect(usableAsCeiling(values[0]!)).toBe(true)
    const fargate = values.find((value) => value.conditions.launch === 'fargate')
    expect(fargate?.limitType).toBe('adjustable_quota')
    expect(catalogValuesFor('aws-application-load-balancer').some((value) => value.limitType === 'configurable_setting')).toBe(
      true,
    )
    expect(usableAsCeiling(catalogValuesFor('aws-application-load-balancer').find((value) => value.unit === 's')!)).toBe(
      false,
    )
  })

  it('maps the 9-block reference onto each first-release catalog without prices', () => {
    for (const provider of mappedProviders) {
      const roles = Object.values(referenceBindings[provider])
      expect(roles).toHaveLength(9)
      for (const bind of roles) {
        if (bind.catalogId.startsWith('generic-')) continue
        expect(
          catalogEntries.find((entry) => entry.id === bind.catalogId),
          bind.catalogId,
        ).toBeDefined()
      }
    }
    expect(JSON.stringify(referenceBindings)).not.toMatch(/\$|price|hourly/i)
  })

  it('compares container services on sourced ceilings without inventing prices', () => {
    const rows = comparisonRows('Containers')
    const names = rows.map((row) => `${row.provider}:${row.name}`)
    expect(names).toEqual(expect.arrayContaining(['aws:ECS', 'aws:EKS', 'azure:AKS', 'gcp:GKE']))
    const ecs = rows.find((row) => row.catalogId === 'aws-ecs')
    expect(ecs?.ceilings.some((item) => item.mayCap && item.text.includes('5,000'))).toBe(true)
    const aks = rows.find((row) => row.catalogId === 'azure-aks')
    expect(aks?.ceilings.some((item) => item.text.includes('5,000'))).toBe(true)
    expect(aks?.ceilings.every((item) => item.mayCap === false)).toBe(true)
    expect(JSON.stringify(rows)).not.toMatch(/\$|price|hourly/i)
  })
})

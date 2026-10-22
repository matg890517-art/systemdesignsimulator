import { describe, expect, it } from 'vitest'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import {
  accordionProviders,
  categoryLabel,
  firstCategoryOpen,
  folderKey,
  searchOpenState,
} from './palette-fold.ts'

describe('palette folder explorer', () => {
  it('keeps Generic first and shortens long category names', () => {
    expect(PALETTE_PROVIDERS[0]?.id).toBe('generic')
    expect(categoryLabel('NETWORK AND CDN')).toBe('Network')
    expect(categoryLabel('MESSAGING AND INTEGRATION')).toBe('Messaging')
    expect(categoryLabel('COMPUTE')).toBe('Compute')
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

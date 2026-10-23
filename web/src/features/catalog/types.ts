export type CatalogProvider = 'aws' | 'azure' | 'gcp' | 'kubernetes'

export type LimitsOnPage = 'yes' | 'partial' | 'no'

export type CatalogEntry = {
  id: string
  provider: CatalogProvider
  category: string
  name: string
  docsUrl: string
  limitsOnPage: LimitsOnPage
}

export type PaletteProvider = CatalogProvider | 'generic'

export type PaletteTile = {
  name: string
  catalogId?: string
  provider: PaletteProvider
  limitsOnPage?: LimitsOnPage
  kind?: 'service' | 'environment'
}

export type PaletteGroup = {
  category: string
  count: number
  tiles: PaletteTile[]
}

import type { PaletteProvider } from '../../catalog/types.ts'

const serviceMarks = import.meta.glob('./service/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const providerMarks = import.meta.glob('./providers/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function serviceMarkSrc(catalogId?: string): string | undefined {
  if (!catalogId || catalogId.startsWith('generic-')) return undefined
  return serviceMarks[`./service/${catalogId}.svg`]
}

export function providerMarkSrc(provider: PaletteProvider): string | undefined {
  if (provider === 'generic') return undefined
  return providerMarks[`./providers/${provider}.svg`]
}

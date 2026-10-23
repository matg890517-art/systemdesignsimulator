import type { IconGlyph } from './kind-icon.ts'

const INK = '#131B26'

/** 20×20 kind marks. Same paths on generic tiles, folder headers, and Normal-mode cards. */
const paths: Record<IconGlyph, string> = {
  blocks:
    'M3 3h6.2v6.2H3V3Zm7.8 0H17v6.2h-6.2V3ZM3 10.8h6.2V17H3v-6.2Zm7.8 0H17V17h-6.2v-6.2Z',
  clients:
    'M6.6 7.4a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Zm6.8 0a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2ZM3.2 16.4c0-2.2 1.7-3.6 3.6-3.6h.6c1.9 0 3.6 1.4 3.6 3.6v.6H3.2v-.6Zm6.4 0c.2-1.5 1.1-2.7 2.4-3.2.5-.2 1-.3 1.5-.3 1.9 0 3.6 1.4 3.6 3.6v.6H9.6v-.7Z',
  lb: 'M3 3h14v2.6H3V3ZM9.1 5.6h1.8v3.4H9.1V5.6ZM3 13.2h4.2v3.8H3v-3.8Zm4.9 0h4.2v3.8H7.9v-3.8Zm4.9 0H17v3.8h-4.2v-3.8ZM4.4 9h1.4v4.2H4.4V9Zm4.9 0h1.4v4.2H9.3V9Zm4.9 0H15.6v4.2h-1.4V9Z',
  service:
    'M4 3.2h12c.9 0 1.6.7 1.6 1.6v10.4c0 .9-.7 1.6-1.6 1.6H4c-.9 0-1.6-.7-1.6-1.6V4.8c0-.9.7-1.6 1.6-1.6Zm1.4 2.4v1.8h9.2V5.6H5.4Zm0 3.4v1.8h6.8V9H5.4Zm0 3.4v1.8h4.4v-1.8H5.4Z',
  cache:
    'M3.2 3.2h13.6v3.4H3.2V3.2Zm0 4.9h13.6v3.4H3.2V8.1Zm0 4.9h13.6v3.4H3.2v-3.4Z',
  db: 'M10 2.4c3.8 0 6.8 1.2 6.8 2.8v9.6c0 1.6-3 2.8-6.8 2.8s-6.8-1.2-6.8-2.8V5.2c0-1.6 3-2.8 6.8-2.8Zm0 1.6c-2.9 0-5 .7-5 1.2s2.1 1.2 5 1.2 5-.7 5-1.2-2.1-1.2-5-1.2Zm5.2 3.2c-1 .5-2.9.9-5.2.9s-4.2-.4-5.2-.9v1.8c1 .5 2.9.9 5.2.9s4.2-.4 5.2-.9V7.2Zm0 3.6c-1 .5-2.9.9-5.2.9s-4.2-.4-5.2-.9v1.8c1 .5 2.9.9 5.2.9s4.2-.4 5.2-.9v-1.8Z',
  queue:
    'M2.6 5.2 6.8 10 2.6 14.8h2.2L9 10 4.8 5.2H2.6Zm5.2 0L12 10 7.8 14.8h2.2L14.2 10 10 5.2H7.8Zm5.2 0L17.2 10 13 14.8h2.2L19.4 10 15.2 5.2h-2.2Z',
  worker:
    'M10 2.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2ZM5.4 9.4h9.2c.8 0 1.4.6 1.4 1.4V17.2H4V10.8c0-.8.6-1.4 1.4-1.4Z',
  cdn: 'M10 2.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6Zm0 1.8c-1.3 0-2.4 2.3-2.4 6s1.1 6 2.4 6 2.4-2.3 2.4-6-1.1-6-2.4-6ZM4.2 9h11.6v2H4.2V9Z',
  object:
    'M10 2.8 16.6 6.6v6.8L10 17.2 3.4 13.4V6.6L10 2.8Zm0 1.9L5.2 7.4v5.2L10 15.3l4.8-2.7V7.4L10 4.7Z',
  compute:
    'M3 3h14v9.4H3V3Zm1.8 1.8v5.8h10.4V4.8H4.8ZM8.2 13.4h3.6v1.2h2.4v1.6H5.8v-1.6h2.4v-1.2Z',
  function: 'M11.4 2.2 6 10.4h3.2L7.2 17.8 16 8.8h-3.4L11.4 2.2Z',
  k8s: 'M10 2 17 6.1v7.8L10 18 3 13.9V6.1L10 2Zm0 2.2-5 2.9v5.8L10 15.8l5-2.9V7.1L10 4.2Z',
  api: 'M3.6 4.2h5.4v2.2H5.8v7.2h3.2v2.2H3.6V4.2Zm7.4 0H16.4v11.6h-5.4v-2.2h3.2V6.4h-3.2V4.2Z',
  dns: 'M10 2.2 17.4 6.4v7.2L10 17.8 2.6 13.6V6.4L10 2.2Zm0 2.4L5 7.4v5.2l5 2.7 5-2.7V7.4l-5-2.8Z',
  bus: 'M3.2 6h13.6v8H3.2V6Zm2 2.2v3.6h9.6V8.2H5.2Z',
  zone: 'M3.2 3.2h13.6v13.6H3.2V3.2Zm1.8 1.8v10h10v-10h-10Z',
}

export function KindIcon({
  glyph,
  size,
  title,
}: {
  glyph: IconGlyph
  size: number
  title?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={INK}
      fillRule="evenodd"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={paths[glyph]} />
    </svg>
  )
}

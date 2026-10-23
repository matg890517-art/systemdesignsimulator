import type { IconGlyph } from './kind-icon.ts'

const INK = '#131B26'

/** Shared 20×20 fill glyphs for Generic tiles, Normal mode, and folder headers. */
const paths: Record<IconGlyph, string | readonly string[]> = {
  blocks:
    'M3 3h6.2v6.2H3V3Zm7.8 0H17v6.2h-6.2V3ZM3 10.8h6.2V17H3v-6.2Zm7.8 0H17V17h-6.2v-6.2Z',
  clients:
    'M7 7.4a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3Zm6.2 0a2.15 2.15 0 1 0 0-4.3 2.15 2.15 0 0 0 0 4.3ZM3.4 16.4c0-2.15 1.7-3.5 3.45-3.5h.7c1.75 0 3.45 1.35 3.45 3.5v.5H3.4v-.5Zm6.4 0c.15-1.45 1.1-2.65 2.4-3.15.45-.2.95-.35 1.5-.35 1.75 0 3.45 1.35 3.45 3.5v.5H9.8v-.5Z',
  lb: 'M3.2 2.8h13.6v2.6H3.2V2.8ZM9.2 5.4h1.6v3.4H9.2V5.4ZM3 12.8h4.2v4.4H3v-4.4Zm5.4 0h3.2v4.4H8.4v-4.4Zm5.4 0H17v4.4h-3.2v-4.4ZM4.4 8.8h1.4v4H4.4v-4Zm5 0h1.4v4h-1.4v-4Zm5 0h1.4v4h-1.4v-4Z',
  service:
    'M4.2 3.2h11.6c.7 0 1.2.5 1.2 1.2v11.2c0 .7-.5 1.2-1.2 1.2H4.2c-.7 0-1.2-.5-1.2-1.2V4.4c0-.7.5-1.2 1.2-1.2Zm1.4 2.2v1.8h8.8V5.4H5.6Zm0 3.2v1.8h8.8V8.6H5.6Zm0 3.2v1.8h5.6v-1.8H5.6Z',
  cache:
    'M3.2 3.4h13.6v3.4H3.2V3.4Zm0 4.9h13.6v3.4H3.2V8.3Zm0 4.9h13.6v3.4H3.2v-3.4Z',
  db: 'M10 2.3c3.8 0 6.7 1.2 6.7 2.7v9.9c0 1.5-2.9 2.7-6.7 2.7s-6.7-1.2-6.7-2.7V5c0-1.5 2.9-2.7 6.7-2.7Zm0 1.6c-2.9 0-5 .7-5 1.1s2.1 1.1 5 1.1 5-.7 5-1.1-2.1-1.1-5-1.1Zm5 3.2c-.9.5-2.8.9-5 .9s-4.1-.4-5-.9v1.9c.9.5 2.8.9 5 .9s4.1-.4 5-.9V7.1Zm0 3.7c-.9.5-2.8.9-5 .9s-4.1-.4-5-.9v1.9c.9.5 2.8.9 5 .9s4.1-.4 5-.9v-1.9Z',
  queue:
    'M2.6 5.2 6.8 10 2.6 14.8h2.2L9 10 4.8 5.2H2.6Zm5.2 0L12 10 7.8 14.8h2.2L14.2 10 10 5.2H7.8Zm5.2 0L17.2 10 13 14.8h2.2L19.4 10 15.2 5.2h-2.2Z',
  worker:
    'M10 2.5a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2ZM5.4 9.4h9.2c.8 0 1.4.6 1.4 1.4V17.4H4V10.8c0-.8.6-1.4 1.4-1.4Z',
  cdn: [
    'M10 2.3a7.7 7.7 0 1 1 0 15.4 7.7 7.7 0 0 1 0-15.4Zm0 1.8a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8Z',
    'M4.1 9.1h11.8v1.8H4.1V9.1Z',
  ],
  object:
    'M10 2.6 17.2 6.6v6.8L10 17.4 2.8 13.4V6.6L10 2.6Zm0 1.9-5.4 3v5.1L10 15.6l5.4-3V7.5L10 4.5Z',
  compute:
    'M3.2 3h13.6v9.4H3.2V3Zm1.7 1.7v6h10.2v-6H4.9ZM8.3 13.4h3.4v1.2h2.4v1.6H5.9v-1.6h2.4v-1.2Z',
  function: 'M11.4 2.2 6 10.4h3.2L7.2 17.8 16 8.8h-3.4L11.4 2.2Z',
  k8s: 'M10 2.2 17.1 6.3v7.4L10 17.8 2.9 13.7V6.3L10 2.2Zm0 2.3-5 2.9v5.4l5 2.9 5-2.9V7.4L10 4.5Z',
  api: 'M3.8 4.2h5.4v2.1H6.1v7.4h3.1v2.1H3.8V4.2Zm6.9 0H16v11.6h-5.3v-2.1h3.2V6.3h-3.2V4.2Z',
  dns: 'M10 2.4 17.3 6.6v6.8L10 17.6 2.7 13.4V6.6L10 2.4Zm0 2.3L5.2 7.5v5l4.8 2.8 4.8-2.8v-5L10 4.7Z',
  bus: 'M3.2 6h13.6v8H3.2V6Zm2 2.1v3.8h9.6V8.1H5.2Z',
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
      {(Array.isArray(paths[glyph]) ? paths[glyph] : [paths[glyph]]).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

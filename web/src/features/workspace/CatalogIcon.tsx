import { Box } from '@mui/material'
import { KindIcon } from './KindIcon.tsx'
import { iconGlyphFor, type IconMode } from './kind-icon.ts'
import { serviceMarkSrc } from './icons/registry.ts'

export function CatalogIcon({
  mode,
  name,
  catalogId,
  category,
  size,
  title,
}: {
  mode: IconMode
  name: string
  catalogId?: string
  category?: string
  size: number
  title?: string
}) {
  const glyph = iconGlyphFor({ mode, name, catalogId, category })
  const mark = mode === 'service' ? serviceMarkSrc(catalogId) : undefined
  if (mark) {
    return (
      <Box
        component="img"
        src={mark}
        alt=""
        title={title}
        width={size}
        height={size}
        sx={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />
    )
  }
  return <KindIcon glyph={glyph} size={size} title={title} />
}

import { useState } from 'react'
import AppsIcon from '@mui/icons-material/Apps'
import MenuIcon from '@mui/icons-material/Menu'
import { Box, Button, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import { mappedProviders, type MappedProvider } from '../catalog/provider-maps.ts'
import type { PaletteProvider, PaletteTile } from '../catalog/types.ts'
import { KindIcon } from './KindIcon.tsx'
import { iconGlyphFor } from './kind-icon.ts'
import { useIconMode } from './icon-mode.tsx'

function limitsDot(tile: PaletteTile) {
  if (tile.limitsOnPage === 'yes') return 'success.main'
  if (tile.limitsOnPage === 'partial') return 'warning.main'
  return 'divider'
}

function limitsWord(tile: PaletteTile) {
  if (tile.limitsOnPage === 'yes') return 'limits listed'
  if (tile.limitsOnPage === 'partial') return 'partial'
  if (tile.limitsOnPage === 'no') return 'none listed'
  return 'not set'
}

export function Palette({
  onLoadReference,
  onRestoreExample,
}: {
  onLoadReference: (provider: MappedProvider) => void
  onRestoreExample: () => void
}) {
  const { mode, setMode } = useIconMode()
  const [openProviders, setOpenProviders] = useState<Record<PaletteProvider, boolean>>({
    generic: true,
    aws: false,
    azure: false,
    gcp: false,
    kubernetes: false,
  })
  const [view, setView] = useState<'button' | 'list'>('button')
  const [query, setQuery] = useState('')

  function toggle(id: PaletteProvider) {
    setOpenProviders((current) => ({ ...current, [id]: !current[id] }))
  }

  function tileNode(tile: PaletteTile, category: string) {
    const payload = JSON.stringify({
      name: tile.name,
      provider: tile.provider,
      catalogId: tile.catalogId,
    })
    const glyph = iconGlyphFor({
      mode,
      name: tile.name,
      catalogId: tile.catalogId,
      category,
    })
    if (view === 'list') {
      return (
        <Stack
          key={tile.catalogId ?? tile.name}
          direction="row"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData('application/sds-service', payload)
            event.dataTransfer.effectAllowed = 'move'
          }}
          sx={{
            alignItems: 'center',
            gap: 0.75,
            py: 0.4,
            cursor: 'grab',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <KindIcon glyph={glyph} size={16} title={tile.name} />
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: limitsDot(tile),
              flexShrink: 0,
            }}
          />
          <Typography sx={{ fontSize: 11, flex: 1 }}>{tile.name}</Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{limitsWord(tile)}</Typography>
        </Stack>
      )
    }
    return (
      <Box
        key={tile.catalogId ?? tile.name}
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData('application/sds-service', payload)
          event.dataTransfer.effectAllowed = 'move'
        }}
        sx={{
          width: 68,
          minHeight: 55,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '6px',
          px: 0.25,
          py: 0.75,
          textAlign: 'center',
          cursor: 'grab',
          bgcolor: 'background.paper',
          mb: 0.5,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <KindIcon glyph={glyph} size={20} title={tile.name} />
        <Typography sx={{ fontSize: 11, lineHeight: '17px', width: 64 }}>{tile.name}</Typography>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: limitsDot(tile),
            position: 'absolute',
            top: 4,
            right: 4,
          }}
        />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: 236,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        overflow: 'auto',
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search services"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ flex: 1 }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={view}
          onChange={(_, next: 'button' | 'list' | null) => {
            if (next) setView(next)
          }}
          aria-label="Palette layout"
          sx={{
            height: 32,
            '& .MuiToggleButton-root': { px: 0.5, minWidth: 28 },
          }}
        >
          <ToggleButton value="button" aria-label="Button view">
            <AppsIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <MenuIcon sx={{ fontSize: 16 }} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Drag a service onto the canvas. Generic is the default folder.
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        ● limits on official page · ◐ partial · ○ none listed
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Icons</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next: 'service' | 'normal' | null) => {
            if (next) setMode(next)
          }}
          aria-label="Icon style"
          sx={{ height: 29, '& .MuiToggleButton-root': { px: 1, fontSize: 11, py: 0 } }}
        >
          <ToggleButton value="service">Service</ToggleButton>
          <ToggleButton value="normal">Normal</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {PALETTE_PROVIDERS.map((item) => {
        const groups = paletteGroupsFor(item.id, query)
        const count = groups.reduce((sum, group) => sum + group.count, 0)
        const open = openProviders[item.id]
        return (
          <Box key={item.id}>
            <Typography
              onClick={() => toggle(item.id)}
              sx={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {open ? '▾' : '▸'} {item.label} ({count})
            </Typography>
            {open
              ? groups.map((group) => (
                  <Box key={group.category} sx={{ pl: 1, mt: 0.5 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
                        {group.category}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{group.count}</Typography>
                    </Stack>
                    {view === 'list' ? (
                      group.tiles.map((tile) => tileNode(tile, group.category))
                    ) : (
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                        {group.tiles.map((tile) => tileNode(tile, group.category))}
                      </Stack>
                    )}
                  </Box>
                ))
              : null}
          </Box>
        )
      })}
      <Stack spacing={0.75} sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        {mappedProviders.map((provider) => (
          <Button
            key={provider}
            size="small"
            variant={provider === 'generic' ? 'outlined' : 'text'}
            onClick={() => onLoadReference(provider)}
          >
            Load{' '}
            {provider === 'generic' ? 'generic' : provider === 'aws' ? 'AWS' : provider === 'gcp' ? 'GCP' : 'Azure'}{' '}
            reference
          </Button>
        ))}
        <Button size="small" onClick={onRestoreExample}>
          Restore YouTube example
        </Button>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Same 9 blocks. Catalog bindings only. Capacities stay Estimated until a lab test exists.
        </Typography>
      </Stack>
    </Box>
  )
}

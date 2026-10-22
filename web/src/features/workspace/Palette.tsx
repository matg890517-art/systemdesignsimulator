import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import { mappedProviders, type MappedProvider } from '../catalog/provider-maps.ts'
import type { PaletteProvider, PaletteTile } from '../catalog/types.ts'

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

  function tileNode(tile: PaletteTile) {
    const payload = JSON.stringify({
      name: tile.name,
      provider: tile.provider,
      catalogId: tile.catalogId,
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
          width: 92,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          textAlign: 'center',
          cursor: 'grab',
          bgcolor: 'background.paper',
          mb: 0.5,
        }}
      >
        <Typography sx={{ fontSize: 11 }}>{tile.name}</Typography>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            mx: 'auto',
            mt: 0.5,
            bgcolor: limitsDot(tile),
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
      <TextField
        size="small"
        placeholder="Search services"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Generic is the default folder. Drag a service. Providers can be mixed.
      </Typography>
      <Stack direction="row" spacing={1}>
        <Typography
          onClick={() => setView('button')}
          sx={{
            fontSize: 12,
            fontWeight: view === 'button' ? 600 : 400,
            color: view === 'button' ? 'primary.main' : 'text.secondary',
            cursor: 'pointer',
          }}
        >
          Buttons
        </Typography>
        <Typography
          onClick={() => setView('list')}
          sx={{
            fontSize: 12,
            fontWeight: view === 'list' ? 600 : 400,
            color: view === 'list' ? 'primary.main' : 'text.secondary',
            cursor: 'pointer',
          }}
        >
          List
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        ● limits on official page · ◐ partial · ○ none listed
      </Typography>
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
                      group.tiles.map(tileNode)
                    ) : (
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
                        {group.tiles.map(tileNode)}
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

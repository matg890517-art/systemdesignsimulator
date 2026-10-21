import { useState } from 'react'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import type { PaletteProvider, PaletteTile } from '../catalog/types.ts'

function limitsDot(tile: PaletteTile) {
  if (tile.limitsOnPage === 'yes') return 'success.main'
  if (tile.limitsOnPage === 'partial') return 'warning.main'
  return 'divider'
}

export function Palette({
  onLoadReference,
  onRestoreExample,
}: {
  onLoadReference: () => void
  onRestoreExample: () => void
}) {
  const [provider, setProvider] = useState<PaletteProvider>('aws')
  const [query, setQuery] = useState('')
  const groups = paletteGroupsFor(provider, query)

  return (
    <Box
      sx={{
        width: 220,
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
        Drag a service onto the canvas. Providers can be mixed. Catalogs stay data.
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        ● limits on official page · ◐ partial · ○ none listed
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
        {PALETTE_PROVIDERS.map((item) => (
          <Typography
            key={item.id}
            onClick={() => setProvider(item.id)}
            sx={{
              fontSize: 12,
              fontWeight: item.id === provider ? 600 : 400,
              color: item.id === provider ? 'primary.main' : 'text.secondary',
              cursor: 'pointer',
            }}
          >
            {item.label === 'Kubernetes' ? 'K8s' : item.label}
          </Typography>
        ))}
      </Stack>
      {groups.map((group) => (
        <Box key={group.category}>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
              {group.category}
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{group.count}</Typography>
          </Stack>
          {group.tiles.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              {group.tiles.map((tile) => (
                <Box
                  key={tile.catalogId ?? tile.name}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      'application/sds-service',
                      JSON.stringify({
                        name: tile.name,
                        provider: tile.provider,
                        catalogId: tile.catalogId,
                      }),
                    )
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
              ))}
            </Stack>
          )}
        </Box>
      ))}
      <Stack spacing={0.75} sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button size="small" variant="outlined" onClick={onLoadReference}>
          Load generic reference
        </Button>
        <Button size="small" onClick={onRestoreExample}>
          Restore YouTube example
        </Button>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Reference uses Estimated example numbers, not measurements.
        </Typography>
      </Stack>
    </Box>
  )
}

import { useMemo, useState, type DragEvent } from 'react'
import AppsIcon from '@mui/icons-material/Apps'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MenuIcon from '@mui/icons-material/Menu'
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { PALETTE_PROVIDERS, paletteGroupsFor } from '../catalog/catalog.ts'
import { mappedProviders, type MappedProvider } from '../catalog/provider-maps.ts'
import type { PaletteGroup, PaletteProvider, PaletteTile } from '../catalog/types.ts'
import { CatalogIcon } from './CatalogIcon.tsx'
import { KindIcon } from './KindIcon.tsx'
import { iconGlyphFor } from './kind-icon.ts'
import { providerMarkSrc } from './icons/registry.ts'
import { useIconMode } from './icon-mode.tsx'
import {
  accordionProviders,
  categoryLabel,
  firstCategoryOpen,
  folderKey,
  searchOpenState,
} from './palette-fold.ts'

function limitsDot(tile: PaletteTile) {
  if (tile.limitsOnPage === 'yes') return 'success.main'
  if (tile.limitsOnPage === 'partial') return 'warning.main'
  return 'divider'
}

function limitsWord(tile: PaletteTile) {
  if (tile.kind === 'environment') return 'layout'
  if (tile.limitsOnPage === 'yes') return 'listed'
  if (tile.limitsOnPage === 'partial') return 'partial'
  if (tile.limitsOnPage === 'no') return 'none'
  return 'generic'
}

const TEMPLATE_LABEL: Record<MappedProvider, string> = {
  generic: 'Generic',
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
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
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    [folderKey('generic', 'GENERIC')]: true,
  })
  const [view, setView] = useState<'button' | 'list'>('list')
  const [query, setQuery] = useState('')
  const [template, setTemplate] = useState<MappedProvider | 'youtube'>('generic')

  const groupsByProvider = useMemo(() => {
    const next = {} as Record<PaletteProvider, PaletteGroup[]>
    for (const item of PALETTE_PROVIDERS) {
      next[item.id] = paletteGroupsFor(item.id, query)
    }
    return next
  }, [query])

  const searchOpen = searchOpenState(query, groupsByProvider)
  const providersOpen = searchOpen?.providers ?? openProviders
  const categoriesOpen = searchOpen?.categories ?? openCategories

  function toggleProvider(id: PaletteProvider) {
    if (query.trim()) return
    const next = accordionProviders(openProviders, id)
    setOpenProviders(next)
    if (next[id]) {
      const prefix = `${id}:`
      setOpenCategories((current) => {
        const kept = Object.fromEntries(
          Object.entries(current).filter(([key]) => !key.startsWith(prefix)),
        )
        return { ...kept, ...firstCategoryOpen(id, groupsByProvider[id]) }
      })
    }
  }

  function toggleCategory(provider: PaletteProvider, category: string) {
    if (query.trim()) return
    const key = folderKey(provider, category)
    setOpenCategories((current) => ({ ...current, [key]: !current[key] }))
  }

  function tileNode(tile: PaletteTile, category: string) {
    const payload = JSON.stringify({
      name: tile.name,
      provider: tile.provider,
      catalogId: tile.catalogId,
      kind: tile.kind ?? 'service',
    })
    const onDragStart = (event: DragEvent) => {
      event.dataTransfer.setData('application/sds-service', payload)
      event.dataTransfer.effectAllowed = 'move'
    }
    if (view === 'list') {
      return (
        <Stack
          key={tile.catalogId ?? `${tile.provider}-${tile.kind ?? 'service'}-${tile.name}`}
          direction="row"
          draggable
          onDragStart={onDragStart}
          title={`${tile.name} · ${limitsWord(tile)}`}
          sx={{
            alignItems: 'center',
            gap: 0.75,
            px: 0.75,
            py: 0.5,
            mx: 0.25,
            borderRadius: 1,
            cursor: 'grab',
            '&:hover': { bgcolor: 'primary.light' },
          }}
        >
          <CatalogIcon
            mode={mode}
            name={tile.name}
            catalogId={tile.catalogId}
            category={category}
            size={16}
            title={tile.name}
          />
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: limitsDot(tile),
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontSize: 12,
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tile.name}
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: 'text.secondary',
              flexShrink: 0,
            }}
          >
            {limitsWord(tile)}
          </Typography>
        </Stack>
      )
    }
    return (
      <Box
        key={tile.catalogId ?? `${tile.provider}-${tile.kind ?? 'service'}-${tile.name}`}
        draggable
        onDragStart={onDragStart}
        title={`${tile.name} · ${limitsWord(tile)}`}
        sx={{
          height: 68,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '6px',
          px: 0.5,
          py: 0.75,
          textAlign: 'center',
          cursor: 'grab',
          bgcolor: 'background.paper',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.light' },
        }}
      >
        <CatalogIcon
          mode={mode}
          name={tile.name}
          catalogId={tile.catalogId}
          category={category}
          size={20}
          title={tile.name}
        />
        <Typography
          sx={{
            fontSize: 11,
            lineHeight: '14px',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tile.name}
        </Typography>
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
        width: 256,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Stack spacing={1} sx={{ p: 1.5, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search services"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ flex: 1 }}
            slotProps={{ htmlInput: { 'aria-label': 'Search services' } }}
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
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={mode}
            onChange={(_, next: 'service' | 'normal' | null) => {
              if (next) setMode(next)
            }}
            aria-label="Icon style"
            sx={{ height: 26, '& .MuiToggleButton-root': { px: 1, fontSize: 11, py: 0 } }}
          >
            <ToggleButton value="service">Service</ToggleButton>
            <ToggleButton value="normal">Normal</ToggleButton>
          </ToggleButtonGroup>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ ml: 'auto', alignItems: 'center' }}
            title="Limits on official page"
          >
            <LegendSwatch color="success.main" label="listed" />
            <LegendSwatch color="warning.main" label="partial" />
            <LegendSwatch color="divider" label="none" />
          </Stack>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1, overflow: 'auto', px: 1, pb: 1 }}>
        {PALETTE_PROVIDERS.map((item) => {
          const groups = groupsByProvider[item.id]
          const count = groups.reduce((sum, group) => sum + group.count, 0)
          if (query.trim() && count === 0) return null
          const open = providersOpen[item.id]
          return (
            <Box key={item.id} sx={{ mb: 0.25 }}>
              <Stack
                component="button"
                type="button"
                direction="row"
                onClick={() => toggleProvider(item.id)}
                aria-expanded={open}
                sx={{
                  width: '100%',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 0.75,
                  py: 0.5,
                  border: 0,
                  borderRadius: 1,
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  bgcolor: open ? 'primary.light' : 'background.paper',
                  cursor: 'pointer',
                  color: 'text.primary',
                  '&:hover': { bgcolor: open ? 'primary.light' : 'action.hover' },
                }}
              >
                {open ? (
                  <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                ) : (
                  <ChevronRightIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                )}
                <ProviderMark provider={item.id} />
                <Typography sx={{ fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>
                  {item.label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{count}</Typography>
              </Stack>
              {open
                ? groups.map((group) => {
                    const hideHeading = item.id === 'generic' && groups.length === 1
                    const catOpen =
                      hideHeading ||
                      groups.length === 1 ||
                      Boolean(categoriesOpen[folderKey(item.id, group.category)])
                    return (
                      <Box key={group.category} sx={{ pl: hideHeading ? 0.5 : 1.25 }}>
                        {hideHeading ? null : (
                          <Stack
                            component="button"
                            type="button"
                            direction="row"
                            onClick={() => toggleCategory(item.id, group.category)}
                            aria-expanded={catOpen}
                            sx={{
                              width: '100%',
                              alignItems: 'center',
                              gap: 0.25,
                              px: 0.5,
                              py: 0.35,
                              border: 0,
                              borderRadius: 1,
                              bgcolor: 'transparent',
                              cursor: 'pointer',
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {catOpen ? (
                              <ExpandMoreIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <ChevronRightIcon sx={{ fontSize: 16 }} />
                            )}
                            <KindIcon
                              glyph={iconGlyphFor({
                                mode: 'normal',
                                name: categoryLabel(group.category),
                                category: group.category,
                              })}
                              size={14}
                            />
                            <Typography sx={{ fontSize: 11, fontWeight: 600, flex: 1, textAlign: 'left' }}>
                              {categoryLabel(group.category)}
                            </Typography>
                            <Typography sx={{ fontSize: 11 }}>{group.count}</Typography>
                          </Stack>
                        )}
                        {catOpen ? (
                          view === 'list' ? (
                            group.tiles.map((tile) => tileNode(tile, group.category))
                          ) : (
                            <Box
                              sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: 0.75,
                                px: 0.5,
                                py: 0.5,
                              }}
                            >
                              {group.tiles.map((tile) => tileNode(tile, group.category))}
                            </Box>
                          )
                        ) : null}
                      </Box>
                    )
                  })
                : null}
            </Box>
          )
        })}
      </Box>

      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          p: 1.25,
          borderTop: 1,
          borderColor: 'divider',
          flexShrink: 0,
          alignItems: 'center',
        }}
      >
        <Select
          size="small"
          value={template}
          onChange={(event) => setTemplate(event.target.value as MappedProvider | 'youtube')}
          aria-label="Reference template"
          sx={{ flex: 1, fontSize: 12 }}
        >
          {mappedProviders.map((provider) => (
            <MenuItem key={provider} value={provider}>
              {TEMPLATE_LABEL[provider]} reference
            </MenuItem>
          ))}
          <MenuItem value="youtube">YouTube example</MenuItem>
        </Select>
        <Button
          size="small"
          variant="outlined"
          onClick={() => {
            if (template === 'youtube') onRestoreExample()
            else onLoadReference(template)
          }}
        >
          Load
        </Button>
      </Stack>
    </Box>
  )
}

function Dot({ color }: { color: string }) {
  return (
    <Box
      sx={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        bgcolor: color,
        flexShrink: 0,
      }}
    />
  )
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.35} sx={{ alignItems: 'center' }}>
      <Dot color={color} />
      <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1 }}>{label}</Typography>
    </Stack>
  )
}

function ProviderMark({ provider }: { provider: PaletteProvider }) {
  const src = providerMarkSrc(provider)
  if (src) {
    return (
      <Box
        component="img"
        src={src}
        alt=""
        width={16}
        height={16}
        sx={{ width: 16, height: 16, objectFit: 'contain', flexShrink: 0 }}
      />
    )
  }
  return <KindIcon glyph="service" size={16} />
}

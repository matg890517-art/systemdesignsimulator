import { useMemo, useState } from 'react'
import { Box, Button, Chip, Link, Stack, Tab, Tabs, TextField, Typography } from '@mui/material'
import { createLink } from '@tanstack/react-router'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { TopNav } from '../../components/TopNav.tsx'
import { usableAsCeiling } from '@sds/engine'
import {
  CATALOG_PROVIDERS,
  COMPARISON_CATEGORIES,
  catalogEntries,
  catalogReadOn,
  catalogStats,
  catalogValueKey,
  catalogValuesFor,
  comparisonRows,
  formatCatalogValue,
  exampleNodesFor,
  filterCatalog,
} from './catalog.ts'
import type { CatalogEntry, CatalogProvider, LimitsOnPage } from './types.ts'

const CalibrationLink = createLink(Button)
const features = tableFeatures({})
const helper = createColumnHelper<typeof features, CatalogEntry>()

function limitsChip(limits: LimitsOnPage) {
  if (limits === 'yes') {
    return { label: 'Limits on page', sx: { bgcolor: 'success.light', color: 'success.dark', height: 20 } }
  }
  if (limits === 'partial') {
    return { label: 'Partial', sx: { bgcolor: 'warning.light', color: 'warning.dark', height: 20 } }
  }
  return { label: 'No limits on page', sx: { bgcolor: 'background.default', color: 'text.secondary', height: 20 } }
}

const columns = helper.columns([
  helper.accessor('name', { header: 'Service' }),
  helper.accessor('category', { header: 'Category' }),
  helper.accessor('limitsOnPage', {
    header: 'Official page',
    cell: (info) => <Chip size="small" {...limitsChip(info.getValue())} />,
  }),
])

export function CatalogPage() {
  const [provider, setProvider] = useState<CatalogProvider>('aws')
  const [limits, setLimits] = useState<LimitsOnPage | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('aws-ec2')
  const [view, setView] = useState<'services' | 'compare'>('services')
  const [compareCategory, setCompareCategory] = useState<(typeof COMPARISON_CATEGORIES)[number]>('Containers')
  const compare = comparisonRows(compareCategory)

  const providerRows = useMemo(
    () => filterCatalog(catalogEntries, { provider, query }),
    [provider, query],
  )
  const rows = useMemo(
    () => (limits === 'all' ? providerRows : providerRows.filter((entry) => entry.limitsOnPage === limits)),
    [providerRows, limits],
  )
  const selected = rows.find((entry) => entry.id === selectedId) ?? rows[0]
  const stats = catalogStats(providerRows)
  const allStats = catalogStats(catalogEntries)
  const exampleNodes = selected ? exampleNodesFor(selected.id) : []

  const table = useTable({
    features,
    columns,
    data: rows,
  })

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <TopNav page="catalog" />
      <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1, gap: 1.5, flexWrap: 'wrap' }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Catalogs / AWS, Azure, GCP, Kubernetes · read {catalogReadOn}
        </Typography>
        <Chip
          label="Data only · engine stays cloud-agnostic"
          size="small"
          sx={{ bgcolor: 'primary.light', color: 'primary.dark', height: 20 }}
        />
        <Chip
          size="small"
          label="Services"
          onClick={() => setView('services')}
          sx={{
            height: 20,
            bgcolor: view === 'services' ? 'primary.main' : 'background.paper',
            color: view === 'services' ? 'background.paper' : 'text.secondary',
          }}
        />
        <Chip
          size="small"
          label="Compare limits"
          onClick={() => setView('compare')}
          sx={{
            height: 20,
            bgcolor: view === 'compare' ? 'primary.main' : 'background.paper',
            color: view === 'compare' ? 'background.paper' : 'text.secondary',
          }}
        />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {allStats.total} services · {allStats.yes} with limits on the official page · {allStats.partial}{' '}
          partial · {allStats.no} none
        </Typography>
      </Stack>
      <Box sx={{ px: 2, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tabs
          value={provider}
          onChange={(_, value: CatalogProvider) => {
            setProvider(value)
            const first = filterCatalog(catalogEntries, { provider: value, query, limits })[0]
            if (first) setSelectedId(first.id)
          }}
        >
          {CATALOG_PROVIDERS.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
        <TextField
          size="small"
          placeholder="Search services"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          sx={{ width: 220 }}
        />
        <Stack direction="row" spacing={0.75}>
          {(
            [
              ['all', `All ${stats.total}`],
              ['yes', `Limits ${stats.yes}`],
              ['partial', `Partial ${stats.partial}`],
              ['no', `None ${stats.no}`],
            ] as const
          ).map(([item, label]) => (
            <Chip
              key={item}
              size="small"
              label={label}
              onClick={() => setLimits(item)}
              sx={{
                height: 22,
                bgcolor: limits === item ? 'primary.light' : 'background.paper',
                color: limits === item ? 'primary.dark' : 'text.secondary',
              }}
            />
          ))}
        </Stack>
      </Box>
      {view === 'compare' ? (
        <Box sx={{ flex: 1, p: 1.5, overflow: 'auto' }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              Capacity and limits · no prices
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5, mb: 1.5 }}>
              F18 compares the same category across providers. Only a sourced hard_limit or
              adjustable_quota may cap. Empty ceiling means the official page is listed, not that
              a number was invented.
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
              {COMPARISON_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  size="small"
                  label={item}
                  onClick={() => setCompareCategory(item)}
                  sx={{
                    height: 22,
                    bgcolor: compareCategory === item ? 'primary.light' : 'background.default',
                    color: compareCategory === item ? 'primary.dark' : 'text.secondary',
                  }}
                />
              ))}
            </Stack>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Provider', 'Service', 'Official page', 'Sourced ceilings'].map((header) => (
                    <Box
                      component="th"
                      key={header}
                      sx={{
                        textAlign: 'left',
                        fontSize: 11,
                        color: 'text.secondary',
                        pb: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {header}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {compare.map((row) => (
                  <Box component="tr" key={row.catalogId}>
                    <Box component="td" sx={{ py: 0.75, pr: 1, fontSize: 12, borderBottom: 1, borderColor: 'divider' }}>
                      {row.provider.toUpperCase()}
                    </Box>
                    <Box component="td" sx={{ py: 0.75, pr: 1, fontSize: 12, borderBottom: 1, borderColor: 'divider' }}>
                      {row.name}
                    </Box>
                    <Box component="td" sx={{ py: 0.75, pr: 1, fontSize: 12, borderBottom: 1, borderColor: 'divider' }}>
                      {row.limitsOnPage === 'yes'
                        ? 'Limits on page'
                        : row.limitsOnPage === 'partial'
                          ? 'Partial'
                          : 'None listed'}
                    </Box>
                    <Box component="td" sx={{ py: 0.75, fontSize: 12, borderBottom: 1, borderColor: 'divider' }}>
                      {row.ceilings.length === 0
                        ? 'No sourced ceiling'
                        : row.ceilings.map((item) => (
                            <Typography key={item.key} sx={{ fontSize: 12 }}>
                              {item.text}
                              {item.mayCap ? ' · may cap' : ' · does not cap'}
                            </Typography>
                          ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
      <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 1.5,
            overflow: 'auto',
          }}
        >
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component="thead">
              {table.getHeaderGroups().map((group) => (
                <Box component="tr" key={group.id}>
                  {group.headers.map((header) => (
                    <Box
                      component="th"
                      key={header.id}
                      sx={{
                        textAlign: 'left',
                        fontSize: 11,
                        color: 'text.secondary',
                        pb: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <Box component="tbody">
              {table.getRowModel().rows.map((row) => (
                <Box
                  component="tr"
                  key={row.id}
                  onClick={() => setSelectedId(row.original.id)}
                  sx={{
                    cursor: 'pointer',
                    bgcolor: row.original.id === selected?.id ? 'primary.light' : 'transparent',
                  }}
                >
                  {row.getAllCells().map((cell) => (
                    <Box
                      component="td"
                      key={cell.id}
                      sx={{
                        py: 0.75,
                        pr: 1,
                        fontSize: 12,
                        borderBottom: 1,
                        borderColor: 'divider',
                        verticalAlign: 'middle',
                      }}
                    >
                      <table.FlexRender cell={cell} />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          {rows.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2 }}>
              No services match this filter.
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 360,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 2,
            overflow: 'auto',
          }}
        >
          {selected ? (
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{selected.name}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                {selected.provider.toUpperCase()} · {selected.category}
              </Typography>
              <Chip
                size="small"
                {...limitsChip(selected.limitsOnPage)}
                sx={{ alignSelf: 'flex-start', ...limitsChip(selected.limitsOnPage).sx }}
              />
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                Catalog is not a measurement. Only a sourced hard_limit or adjustable_quota
                may cap the engine. Guidance, settings, and unknown stay display-only.
              </Typography>
              <Link href={selected.docsUrl} target="_blank" rel="noreferrer" sx={{ fontSize: 13, wordBreak: 'break-all' }}>
                {selected.docsUrl}
              </Link>
              {catalogValuesFor(selected.id).map((value) => (
                <Box
                  key={catalogValueKey(value)}
                  sx={{ p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                    {formatCatalogValue(value)}
                  </Typography>
                  {value.note ? (
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{value.note}</Typography>
                  ) : null}
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {value.limitType.replaceAll('_', ' ')} · {value.scope} · {value.retrievedOn} ·{' '}
                    {value.status}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                    {usableAsCeiling(value)
                      ? 'May cap the engine as a ceiling.'
                      : 'Does not cap the engine.'}
                  </Typography>
                </Box>
              ))}
              {exampleNodes.length > 0 ? (
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  Used on the example canvas as {exampleNodes.join(', ')}.
                </Typography>
              ) : null}
              {selected.id === 'azure-aks' ? (
                <CalibrationLink to="/calibration" size="small" variant="outlined">
                  Open AKS calibration
                </CalibrationLink>
              ) : null}
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Select a service. The engine does not hard-code a cloud.
            </Typography>
          )}
        </Box>
      </Box>
      )}
    </Box>
  )
}

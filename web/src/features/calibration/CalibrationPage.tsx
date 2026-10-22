import { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table'
import { TopNav } from '../../components/TopNav.tsx'
import type { CalibrationField, CalibrationProfile } from './types.ts'
import { applyProfileFields } from './field-edit.ts'
import { FieldEditor } from './FieldEditor.tsx'
import {
  exportCalibrationCsv,
  importCalibrationCsv,
  sampleCalibrationCsv,
  updateProfile,
  useLibrary,
} from './library.ts'

function chipLabel(field: CalibrationField) {
  if (field.value.state === 'unknown') return 'Unknown'
  if (field.value.state === 'not_applicable') return 'N/A'
  return field.value.confidence === 'measured'
    ? 'Measured'
    : field.value.confidence === 'vendor'
      ? 'Vendor'
      : 'Estimated'
}

function chipColor(field: CalibrationField) {
  if (field.value.state !== 'set') return { bgcolor: 'background.default', color: 'text.secondary' }
  if (field.value.confidence === 'measured') return { bgcolor: 'success.light', color: 'success.dark' }
  if (field.value.confidence === 'vendor') return { bgcolor: 'primary.light', color: 'primary.dark' }
  return { bgcolor: 'warning.light', color: 'warning.dark' }
}

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, CalibrationProfile>()
const columns = helper.columns([
  helper.accessor('name', { header: 'Profile' }),
  helper.accessor('bindsTo', {
    header: 'Binds',
    cell: (info) => info.getValue() ?? '—',
  }),
  helper.display({
    id: 'fields',
    header: 'Fields',
    cell: ({ row }) =>
      row.original.fields
        .map((field) => {
          const value =
            field.value.state === 'set' ? String(field.value.value) : field.value.state
          return `${field.label} ${value}`
        })
        .join(' · '),
  }),
])

export function CalibrationPage() {
  const { profiles } = useLibrary()
  const [selectedId, setSelectedId] = useState('aks-transcode')
  const [csv, setCsv] = useState(sampleCalibrationCsv)
  const [message, setMessage] = useState<string>()
  const selected = profiles.find((profile) => profile.id === selectedId) ?? profiles[0]

  const table = useTable({
    features,
    columns,
    data: profiles,
  })

  const draft = selected

  const fieldSummary = useMemo(() => draft?.fields ?? [], [draft])

  function patchField(fieldId: string, next: CalibrationField) {
    if (!draft) return
    const fields = draft.fields.map((field) => (field.id === fieldId ? next : field))
    const applied = applyProfileFields(draft, fields, draft.source)
    updateProfile(applied.profile)
    if (applied.error) setMessage(applied.error)
  }

  function onImport() {
    try {
      const count = importCalibrationCsv(csv)
      setMessage(`Imported ${count} profile(s). Unknown fields still do not cap the engine.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV import failed')
    }
  }

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
      <TopNav page="calibration" />
      <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1, gap: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Projects / Example: Video streaming platform (YouTube-style) / Calibration
        </Typography>
        <Chip
          label="Client library"
          size="small"
          sx={{ bgcolor: 'primary.light', color: 'primary.dark', height: 20 }}
        />
      </Stack>
      <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
        <Box
          sx={{
            width: 420,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 1.5,
            overflow: 'auto',
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>Library</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5 }}>
            Estimated / Vendor / Measured are explicit. Unknown is allowed and never
            turned into a silent default.
          </Typography>
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
                    bgcolor: row.original.id === selectedId ? 'primary.light' : 'transparent',
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
                        verticalAlign: 'top',
                      }}
                    >
                      <table.FlexRender cell={cell} />
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            flex: 1,
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 2,
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          {draft ? (
            <>
              <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{draft.name}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
                {draft.notes}
              </Typography>
              <Stack spacing={1} sx={{ mt: 2, maxWidth: 420 }}>
                <TextField
                  size="small"
                  label="Source URL"
                  value={draft.source ?? ''}
                  onChange={(event) =>
                    updateProfile({ ...draft, source: event.target.value || undefined })
                  }
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Retrieved on"
                    value={draft.retrievedOn ?? ''}
                    placeholder="YYYY-MM-DD"
                    onChange={(event) =>
                      updateProfile({ ...draft, retrievedOn: event.target.value || undefined })
                    }
                  />
                  <TextField
                    size="small"
                    label="Region"
                    value={draft.region ?? ''}
                    onChange={(event) =>
                      updateProfile({ ...draft, region: event.target.value || undefined })
                    }
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Tier"
                    value={draft.tier ?? ''}
                    onChange={(event) =>
                      updateProfile({ ...draft, tier: event.target.value || undefined })
                    }
                  />
                  <TextField
                    size="small"
                    label="Version"
                    value={draft.version ?? ''}
                    onChange={(event) =>
                      updateProfile({ ...draft, version: event.target.value || undefined })
                    }
                  />
                </Stack>
              </Stack>
              <Stack spacing={2} sx={{ mt: 2, maxWidth: 420 }}>
                {fieldSummary.map((field) => (
                  <Box key={field.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{field.label}</Typography>
                      <Chip size="small" label={chipLabel(field)} sx={{ height: 20, ...chipColor(field) }} />
                    </Stack>
                    <FieldEditor
                      field={field}
                      sourceId="calibration"
                      onChange={(next) => patchField(field.id, next)}
                    />
                  </Box>
                ))}
              </Stack>
            </>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 320,
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
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>CSV import</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            Header is required. state=unknown leaves value empty. Sample below writes
            measured 97 slots onto AKS.
          </Typography>
          <TextField
            multiline
            minRows={10}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            sx={{ '& textarea': { fontFamily: '"IBM Plex Mono", monospace', fontSize: 11 } }}
          />
          <Button variant="contained" onClick={onImport}>
            Import CSV
          </Button>
          <Button size="small" onClick={() => setCsv(exportCalibrationCsv())}>
            Load current library
          </Button>
          {message ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{message}</Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  )
}

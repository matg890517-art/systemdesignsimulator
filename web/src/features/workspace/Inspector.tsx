import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import type { CalibrationField, CalibrationProfile, Confidence } from '@sds/engine'
import {
  profileForNode,
  updateProfile,
  useLibrary,
} from '../calibration/library.ts'
import { catalogForNode } from '../catalog/catalog.ts'
import { formatPct } from './simulate.ts'
import type { Bottleneck } from './types.ts'

function FieldEditor({
  field,
  onChange,
}: {
  field: CalibrationField
  onChange: (next: CalibrationField) => void
}) {
  const current = field.value.state === 'set' ? field.value : undefined
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{field.label}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="number"
          disabled={!current}
          value={current ? current.value : ''}
          placeholder={current ? undefined : 'unknown'}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (!Number.isFinite(next) || !current) return
            onChange({
              ...field,
              value: { ...current, value: next },
            })
          }}
          sx={{ flex: 1 }}
        />
        <Typography sx={{ alignSelf: 'center', fontSize: 11, color: 'text.secondary' }}>
          {field.unit}
        </Typography>
      </Stack>
      <TextField
        select
        size="small"
        label="Confidence"
        value={current ? current.confidence : 'unknown'}
        onChange={(event) => {
          const next = event.target.value
          if (next === 'unknown') {
            onChange({ ...field, value: { state: 'unknown' } })
            return
          }
          onChange({
            ...field,
            value: {
              state: 'set',
              value: current ? current.value : 0,
              confidence: next as Confidence,
              sourceId: current ? current.sourceId : 'config',
            },
          })
        }}
      >
        <MenuItem value="unknown">Unknown</MenuItem>
        <MenuItem value="estimated">Estimated</MenuItem>
        <MenuItem value="vendor">Vendor figure</MenuItem>
        <MenuItem value="measured">Measured</MenuItem>
      </TextField>
      {field.role === 'latencyP95Ms' ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          P95 is stored, not used in fluid mode.
        </Typography>
      ) : null}
      {field.role === 'bandwidthBps' && field.value.state !== 'set' ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Unknown bandwidth does not cap the engine.
        </Typography>
      ) : null}
    </Box>
  )
}

function ConfigPanel({
  nodeId,
  catalogId,
}: {
  nodeId?: string
  catalogId?: string
}) {
  const library = useLibrary()
  const bound = nodeId ? profileForNode(nodeId) : undefined
  const catalog = nodeId ? catalogForNode(nodeId, catalogId) : undefined
  const [draft, setDraft] = useState<CalibrationProfile | undefined>(bound)

  useEffect(() => {
    setDraft(nodeId ? profileForNode(nodeId) : undefined)
  }, [nodeId, library])

  if (!nodeId) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Select a service on the canvas to edit its bound calibration profile.
      </Typography>
    )
  }
  const catalogBlock = catalog ? (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{catalog.name}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        {catalog.provider.toUpperCase()} · official page{' '}
        {catalog.limitsOnPage === 'yes'
          ? 'lists limits.'
          : catalog.limitsOnPage === 'partial'
            ? 'lists some limits.'
            : 'does not list limits.'}{' '}
        Quotas stay unknown until Calibration.
      </Typography>
      <Typography
        component="a"
        href={catalog.docsUrl}
        target="_blank"
        rel="noreferrer"
        sx={{ fontSize: 11, color: 'primary.main', wordBreak: 'break-all' }}
      >
        {catalog.docsUrl}
      </Typography>
    </Box>
  ) : null

  if (!draft) {
    return (
      <Stack spacing={1.5}>
        {catalogBlock}
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {nodeId} has no bound profile. Add one on the Calibration page. Unknown values
          are never filled in for you.
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={1.5}>
      {catalogBlock}
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{draft.name}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{draft.notes}</Typography>
      {draft.fields.map((field) => (
        <FieldEditor
          key={field.id}
          field={field}
          onChange={(next) =>
            setDraft({
              ...draft,
              fields: draft.fields.map((item) => (item.id === field.id ? next : item)),
            })
          }
        />
      ))}
      <Button
        variant="contained"
        size="small"
        onClick={() => updateProfile(draft)}
      >
        Apply to library
      </Button>
    </Stack>
  )
}

export function Inspector({
  bottlenecks,
  selected,
}: {
  bottlenecks: Bottleneck[]
  selected?: { id: string; title: string; catalogId?: string }
}) {
  const [tab, setTab] = useState(0)
  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflow: 'auto',
      }}
    >
      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab label="Config" />
        <Tab label={`Bottlenecks ${bottlenecks.length}`} />
      </Tabs>
      {tab === 0 && <ConfigPanel nodeId={selected?.id} catalogId={selected?.catalogId} />}
      {tab === 1 && (
        <>
          {selected ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Selected: {selected.title}
            </Typography>
          ) : null}
          {bottlenecks.map((item) => (
            <Box
              key={item.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: item.fromEngine ? 'error.light' : 'warning.light',
                border: '1px solid',
                borderColor: item.fromEngine ? 'error.main' : 'warning.main',
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: item.fromEngine ? 'error.main' : 'warning.dark',
                }}
              >
                {item.title} {formatPct(item.util)}
              </Typography>
              <Typography sx={{ fontSize: 12, mt: 0.5 }}>{item.summary}</Typography>
              <Typography sx={{ fontSize: 12, mt: 0.75, color: 'primary.main', fontWeight: 600 }}>
                {item.fromEngine ? 'From engine · ' : 'Estimated · '}
                {item.suggestion}
              </Typography>
            </Box>
          ))}
        </>
      )}
    </Box>
  )
}

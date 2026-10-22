import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type { CalibrationField } from '@sds/engine'
import { applyFieldConfidence, applyFieldNumber } from './field-edit.ts'

export function FieldEditor({
  field,
  sourceId,
  onChange,
}: {
  field: CalibrationField
  sourceId: string
  onChange: (next: CalibrationField) => void
}) {
  const current = field.value.state === 'set' ? field.value : undefined
  const measured = current?.confidence === 'measured'
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{field.label}</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="number"
          value={current ? current.value : ''}
          placeholder="unknown"
          onChange={(event) => onChange(applyFieldNumber(field, event.target.value, sourceId))}
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
        onChange={(event) => onChange(applyFieldConfidence(field, event.target.value))}
        disabled={measured}
      >
        <MenuItem value="unknown">Unknown</MenuItem>
        <MenuItem value="estimated">Estimated</MenuItem>
        <MenuItem value="vendor">Vendor figure</MenuItem>
        {measured ? <MenuItem value="measured">Measured</MenuItem> : null}
      </TextField>
      {!current ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Leave empty for unknown. Type a number to set it as Estimated. A source link on the
          profile becomes Vendor figure. Measured only comes from CSV import.
        </Typography>
      ) : null}
      {measured ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Measured from an imported CSV. Hand edits cannot relabel it Measured.
        </Typography>
      ) : null}
      {field.role === 'latencyP95Ms' ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          P95 must be at least the median. Fluid mode does not use P95.
        </Typography>
      ) : null}
      {field.role === 'bandwidthBps' && field.value.state !== 'set' ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Unknown bandwidth does not cap the engine.
        </Typography>
      ) : null}
      {field.role === 'costUsdPerHour' ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Typed $/hr is Estimated. Catalog has no SKU prices. Empty stays unknown and is not
          summed.
        </Typography>
      ) : null}
    </Box>
  )
}

import { useState } from 'react'
import { Box, MenuItem, Stack, TextField, Typography } from '@mui/material'
import type { CalibrationField } from '@sds/engine'
import { applyFieldConfidence, applyFieldNumber } from './field-edit.ts'

export function FieldEditor({
  field,
  sourceId,
  onChange,
  hideLabel = false,
}: {
  field: CalibrationField
  sourceId: string
  onChange: (next: CalibrationField) => void
  hideLabel?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const current = field.value.state === 'set' ? field.value : undefined
  const measured = current?.confidence === 'measured'
  const unknown = !current
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {hideLabel ? null : (
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{field.label}</Typography>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <TextField
          size="small"
          type="number"
          value={current ? current.value : ''}
          placeholder="unknown"
          onChange={(event) => onChange(applyFieldNumber(field, event.target.value, sourceId))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{ flex: 1, minWidth: 0 }}
          slotProps={{ htmlInput: { 'aria-label': field.label } }}
        />
        <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>
          {field.unit}
        </Typography>
        <TextField
          select
          size="small"
          value={current ? current.confidence : 'unknown'}
          onChange={(event) => onChange(applyFieldConfidence(field, event.target.value))}
          disabled={measured}
          sx={{ width: 128, flexShrink: 0 }}
          slotProps={{ htmlInput: { 'aria-label': `${field.label} confidence` } }}
        >
          <MenuItem value="unknown">Unknown</MenuItem>
          <MenuItem value="estimated">Estimated</MenuItem>
          <MenuItem value="vendor">Vendor figure</MenuItem>
          {measured ? <MenuItem value="measured">Measured</MenuItem> : null}
        </TextField>
      </Stack>
      {unknown && focused ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Empty stays unknown. A typed number is Estimated.
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

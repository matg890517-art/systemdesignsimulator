import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { SHOW_MODES, type ShowMode } from './display-mode.ts'

export function ShowModeToggle({
  value,
  onChange,
  disabled,
  compact = false,
}: {
  value: ShowMode
  onChange: (next: ShowMode) => void
  disabled?: boolean
  compact?: boolean
}) {
  const selected = SHOW_MODES.find((item) => item.id === value) ?? SHOW_MODES[0]!
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selected.id}
      disabled={disabled}
      onChange={(_, next: ShowMode | null) => {
        if (next) onChange(next)
      }}
      aria-label="Show mode"
      title={
        disabled
          ? 'Analytic is one steady-state solve. Instantaneous and Average are the same Jackson numbers.'
          : selected.hint
      }
      sx={{
        height: compact ? 32 : 36,
        flexShrink: 0,
        '& .MuiToggleButton-root': {
          px: compact ? 1 : 1.25,
          fontSize: compact ? 11 : 13,
          fontWeight: 600,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        },
      }}
    >
      {SHOW_MODES.map((item) => (
        <ToggleButton key={item.id} value={item.id} aria-label={item.label} title={item.hint}>
          {compact ? item.shortLabel : item.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

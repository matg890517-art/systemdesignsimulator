import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { patchWorkloadDraft, useWorkloadDraft } from './workload-store.ts'
import { RUN_MODES, isRunMode, normalizeRunMode } from './run-mode.ts'

export function RunModeToggle({
  disabled,
  compact = false,
}: {
  disabled?: boolean
  compact?: boolean
}) {
  const draft = useWorkloadDraft()
  const selected =
    RUN_MODES.find((item) => item.id === normalizeRunMode(draft.mode)) ?? RUN_MODES[0]!

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selected.id}
      disabled={disabled}
      onChange={(_, next: string | null) => {
        if (next && isRunMode(next)) patchWorkloadDraft({ mode: next })
      }}
      aria-label="Run mode"
      title={selected.hint}
      sx={{
        height: 36,
        flexShrink: 0,
        '& .MuiToggleButton-root': {
          px: compact ? 1.25 : 1.5,
          fontSize: 13,
          fontWeight: 600,
          textTransform: 'none',
          whiteSpace: 'nowrap',
        },
      }}
    >
      {RUN_MODES.map((item) => (
        <ToggleButton key={item.id} value={item.id} aria-label={item.label} title={item.hint}>
          {compact ? item.shortLabel : item.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

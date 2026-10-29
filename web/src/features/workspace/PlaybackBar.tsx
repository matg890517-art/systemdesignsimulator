import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Box, IconButton, Slider, Stack, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material'
import type { ShowMode } from './display-mode.ts'

export const PLAYBACK_SPEEDS = [0.5, 1, 2] as const
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number]

/** Simulated-only scrubber. Analytic has no time series. KPI strip stays the post-warm-up summary. */
export function PlaybackBar({
  t,
  durationSec,
  playing,
  speed,
  showMode,
  onToggle,
  onScrub,
  onSpeed,
}: {
  t: number
  durationSec: number
  playing: boolean
  speed: PlaybackSpeed
  showMode: ShowMode
  onToggle: () => void
  onScrub: (t: number) => void
  onSpeed: (speed: PlaybackSpeed) => void
}) {
  const max = Math.max(durationSec, 1e-9)
  const value = Math.min(Math.max(0, t), max)
  return (
    <Box
      sx={{
        pointerEvents: 'auto',
        width: '100%',
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        boxShadow: 1,
        px: 1,
        py: 0.5,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: '100%' }}>
        <IconButton size="small" onClick={onToggle} aria-label={playing ? 'Pause replay' : 'Play replay'}>
          {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
        <Typography sx={{ fontSize: 11, minWidth: 92, color: 'text.secondary', flexShrink: 0 }}>
          {max < 15 ? value.toFixed(2) : value.toFixed(1)}s / {max.toFixed(0)}s
        </Typography>
        <Slider
          size="small"
          min={0}
          max={max}
          step={0.001}
          value={value}
          onChange={(_, next) => onScrub(Array.isArray(next) ? next[0]! : next)}
          aria-label="Simulated time"
          sx={{ flex: 1, minWidth: 80, py: 0.5 }}
        />
        <ToggleButtonGroup
          exclusive
          size="small"
          value={speed}
          onChange={(_, next: PlaybackSpeed | null) => {
            if (next) onSpeed(next)
          }}
          aria-label="Replay speed"
          sx={{
            flexShrink: 0,
            '& .MuiToggleButton-root': { px: 0.75, py: 0.25, fontSize: 10, minWidth: 36, minHeight: 24 },
          }}
        >
          {PLAYBACK_SPEEDS.map((item) => (
            <ToggleButton key={item} value={item} aria-label={`${item} times speed`}>
              {item}×
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Tooltip
          title={
            showMode === 'instant'
              ? 'Instantaneous: ρ and hop /s over the last 1 s of simulated time, not dt. Queue depth is live. p99 stays empty.'
              : 'Average: ρ and hop /s from t=0 to this time. Queue depth is live. p99 only if wait is at least 1 ms. KPI stays post-warm-up.'
          }
        >
          <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {showMode === 'instant' ? 'Instant' : 'Average'}
          </Typography>
        </Tooltip>
      </Stack>
    </Box>
  )
}

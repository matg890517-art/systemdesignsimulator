import { forwardRef, type ComponentProps } from 'react'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Box,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { formatSimClock, PLAYBACK_SPEEDS, type PlaybackSpeed } from './playback.ts'

const TimePlayPaper = forwardRef<HTMLDivElement, ComponentProps<typeof Paper>>(
  function TimePlayPaper(props, ref) {
    return <Paper ref={ref} elevation={3} {...props} />
  },
)

export type { PlaybackSpeed }

/** Simulated-only clock: current time / Workload Duration. */
export function SimClock({ t, durationSec }: { t: number; durationSec: number }) {
  const max = Math.max(durationSec, 0)
  const value = Math.min(Math.max(0, t), Math.max(max, 1e-9))
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{ alignItems: 'center', minWidth: 0, flexShrink: 0 }}
      aria-label="Simulated time"
    >
      <Typography sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0 }}>Time</Typography>
      <Typography
        sx={{
          fontSize: 12,
          fontFamily: '"IBM Plex Mono", monospace',
          color: 'text.primary',
          whiteSpace: 'nowrap',
        }}
      >
        {formatSimClock(t, durationSec)}
      </Typography>
      <Box
        sx={{
          width: 64,
          height: 4,
          bgcolor: 'action.hover',
          borderRadius: 1,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: 'primary.main' }} />
      </Box>
    </Stack>
  )
}

/** Persistent Simulated player. Pause holds the clock; Stop on the toolbar aborts. */
export function TimePlaySnackbar({
  open,
  t,
  durationSec,
  playing,
  speed,
  pauseDisabled,
  onTogglePause,
  onSpeed,
}: {
  open: boolean
  t: number
  durationSec: number
  playing: boolean
  speed: PlaybackSpeed
  pauseDisabled?: boolean
  onTogglePause: () => void
  onSpeed: (speed: PlaybackSpeed) => void
}) {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      ClickAwayListenerProps={{ mouseEvent: false, touchEvent: false }}
      sx={{ bottom: { xs: 16 } }}
    >
      <TimePlayPaper
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={onTogglePause}
            disabled={pauseDisabled}
            aria-label={playing ? 'Pause simulated time' : 'Play simulated time'}
            title={
              playing
                ? 'Pause the clock. Stop on the toolbar aborts the run.'
                : 'Play simulated time'
            }
          >
            {playing ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </IconButton>
          <SimClock t={t} durationSec={durationSec} />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={speed}
            onChange={(_, next: PlaybackSpeed | null) => {
              if (next != null) onSpeed(next)
            }}
            aria-label="Simulated speed"
            sx={{
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                px: 0.75,
                py: 0.25,
                fontSize: 10,
                minWidth: 32,
                minHeight: 24,
              },
            }}
          >
            {PLAYBACK_SPEEDS.map((item) => (
              <ToggleButton key={item} value={item} aria-label={`${item} times speed`}>
                {item}×
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Stack>
      </TimePlayPaper>
    </Snackbar>
  )
}

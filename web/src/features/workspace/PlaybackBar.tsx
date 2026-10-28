import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { Box, IconButton, Slider, Stack, Typography } from '@mui/material'

export function PlaybackBar({
  t,
  durationSec,
  playing,
  onScrub,
  onTogglePlay,
}: {
  t: number
  durationSec: number
  playing: boolean
  onScrub: (next: number) => void
  onTogglePlay: () => void
}) {
  const max = Math.max(0.1, durationSec)
  const now = Math.min(max, Math.max(0, t))
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        pointerEvents: 'auto',
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 1,
        py: 0.25,
        boxShadow: 1,
        minWidth: 280,
        maxWidth: 420,
      }}
    >
      <IconButton
        size="small"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause playback' : 'Play playback'}
      >
        {playing ? <PauseIcon sx={{ fontSize: 18 }} /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 120, px: 0.5 }}>
        <Slider
          size="small"
          min={0}
          max={max}
          step={0.1}
          value={now}
          onChange={(_, value) => onScrub(Array.isArray(value) ? value[0]! : value)}
          aria-label="Simulated time"
        />
      </Box>
      <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, minWidth: 88 }}>
        t {now.toFixed(1)}s / {max.toFixed(0)}s
      </Typography>
    </Stack>
  )
}

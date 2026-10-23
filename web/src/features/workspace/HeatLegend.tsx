import { Box, Stack, Typography } from '@mui/material'
import { HEAT_STOPS } from './heat.ts'

export function HeatLegend() {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', py: 0.5 }}>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Util</Typography>
      {HEAT_STOPS.map((stop) => (
        <Box
          key={stop.label}
          sx={{
            width: 12,
            height: 8,
            borderRadius: '2px',
            bgcolor: stop.color,
          }}
        />
      ))}
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>0 / 70 / 85</Typography>
    </Stack>
  )
}

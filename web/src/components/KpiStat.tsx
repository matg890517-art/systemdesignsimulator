import { Box, Typography } from '@mui/material'

export function KpiStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Box sx={{ minWidth: 0, px: 2, py: 1 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 18,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
      <Typography
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {hint}
      </Typography>
    </Box>
  )
}

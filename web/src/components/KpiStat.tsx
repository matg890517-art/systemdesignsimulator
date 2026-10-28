import { Box, Typography } from '@mui/material'

export function KpiStat({
  label,
  value,
  hint,
  dense = false,
}: {
  label: string
  value: string
  hint: string
  dense?: boolean
}) {
  return (
    <Box sx={{ minWidth: 0, px: dense ? 1.25 : 2, py: dense ? 0.75 : 1 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: dense ? 14 : 18,
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

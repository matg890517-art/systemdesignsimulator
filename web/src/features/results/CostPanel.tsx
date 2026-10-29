import { Box, Stack, Typography } from '@mui/material'
import { formatUsd, type CostReport } from '@sds/engine'

export function CostPanel({ report }: { report: CostReport }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.5 }}>Cost</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5 }}>
        Typed $/hr × 24 and 730 h/mo. Not Simulated duration. Catalog has no SKU
        prices. F11 sourced prices are later.
      </Typography>
      <Stack spacing={0.75}>
        <Row label="Hour" value={report.value} />
        <Row
          label="Day"
          value={report.usdPerDay === undefined ? 'unknown' : formatUsd(report.usdPerDay, '/d')}
        />
        <Row
          label="Month"
          value={
            report.usdPerMonth === undefined ? 'unknown' : formatUsd(report.usdPerMonth, '/mo')
          }
        />
        <Row
          label="Priced"
          value={`${report.priced} of ${report.eligible} nodes`}
        />
      </Stack>
    </Box>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12, fontFamily: '"IBM Plex Mono", monospace' }}>{value}</Typography>
    </Stack>
  )
}

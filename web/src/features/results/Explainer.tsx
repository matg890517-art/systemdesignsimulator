import { Box, Stack, Typography } from '@mui/material'
import { formatPct } from '../workspace/simulate.ts'
import type { ResultsReport } from '../workspace/types.ts'

export function Explainer({ report }: { report: ResultsReport }) {
  const { baseline, raised, suggestedSlots, bottlenecks } = report
  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
        Bottleneck explainer
      </Typography>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'error.light',
          border: '1px solid',
          borderColor: 'error.main',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'error.main' }}>
          AKS transcode pool {formatPct(baseline.util)}
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.75, fontFamily: '"IBM Plex Mono", monospace' }}>
          μ = n / S = {baseline.servers} / {baseline.serviceMs / 1000} s = {baseline.mu.toFixed(2)} /s
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.5, fontFamily: '"IBM Plex Mono", monospace' }}>
          ρ = λ / μ = {baseline.offered} / {baseline.mu.toFixed(2)} = {formatPct(baseline.util)}
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 1 }}>
          Fluid conservation: completed stays at {baseline.completed.toFixed(2)} /s, so the pool
          sits at {formatPct(baseline.util)} of capacity. Queue stays near{' '}
          {baseline.backlog.toFixed(1)}; rejected {baseline.rejected.toFixed(2)} /s.
        </Typography>
      </Box>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: 'success.light',
          border: '1px solid',
          borderColor: 'success.main',
        }}
      >
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'success.dark' }}>
          Same offered load at {suggestedSlots} slots
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.75, fontFamily: '"IBM Plex Mono", monospace' }}>
          μ = {raised.mu.toFixed(2)} /s · ρ = {formatPct(raised.util)}
        </Typography>
        <Typography sx={{ fontSize: 12, mt: 0.5 }}>
          Engine rerun with the suggested slot count. Utilization falls toward 83% without
          changing arrivals.
        </Typography>
      </Box>
      {bottlenecks
        .filter((item) => !item.fromEngine)
        .map((item) => (
          <Box
            key={item.id}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'warning.light',
              border: '1px solid',
              borderColor: 'warning.main',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'warning.dark' }}>
              {item.title} {formatPct(item.util)}
            </Typography>
            <Typography sx={{ fontSize: 12, mt: 0.5 }}>{item.summary}</Typography>
            <Typography sx={{ fontSize: 12, mt: 0.75, fontWeight: 600, color: 'primary.main' }}>
              Estimated · {item.suggestion}
            </Typography>
          </Box>
        ))}
      <Stack spacing={0.5}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          P50 / P99 on the KPI strip stay Estimated. Fluid mode has rates, not latency tails.
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Cost stays an estimate until SKU prices live in Catalog.
        </Typography>
      </Stack>
    </Box>
  )
}

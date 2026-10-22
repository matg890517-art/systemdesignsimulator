import { Box, Stack, Typography } from '@mui/material'
import { erlangCWaitMs } from '@sds/engine'
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
        <Typography sx={{ fontSize: 12, mt: 0.5, fontFamily: '"IBM Plex Mono", monospace' }}>
          Erlang C mean wait{' '}
          {baseline.mu > baseline.offered && baseline.servers > 0
            ? `${erlangCWaitMs(baseline.offered, 1 / (baseline.serviceMs / 1000), baseline.servers).toFixed(1)} ms`
            : 'unbounded (ρ ≥ 1)'}
        </Typography>
        {bottlenecks[0]?.citation ? (
          <Typography sx={{ fontSize: 11, mt: 0.75, color: 'text.secondary' }}>
            {bottlenecks[0].citation}
          </Typography>
        ) : null}
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
          P50 / P90 / P99 stay unknown in fluid mode. Discrete mean wait is the live latency until tails are sampled.
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Cost sums typed $/hr on nodes. Catalog has no SKU prices. Unknown if none are typed.
        </Typography>
      </Stack>
    </Box>
  )
}

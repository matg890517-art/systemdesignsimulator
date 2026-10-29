import { Box, Stack, Typography } from '@mui/material'
import { formatPct } from '../workspace/simulate.ts'
import type { Bottleneck } from '../workspace/types.ts'

export function Explainer({ bottlenecks }: { bottlenecks: Bottleneck[] }) {
  const fromEngine = bottlenecks.filter((item) => item.fromEngine)
  const estimated = bottlenecks.filter((item) => !item.fromEngine)
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 280,
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
      {fromEngine.length === 0 && estimated.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          No component at or above 85% in this run.
        </Typography>
      ) : null}
      {fromEngine.map((item) => (
        <Box
          key={item.id}
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'error.light',
            border: '1px solid',
            borderColor: 'error.main',
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'error.main' }}>
            {item.title} {formatPct(item.util)}
          </Typography>
          {item.cause ? (
            <Typography sx={{ fontSize: 12, mt: 0.75 }}>{item.cause}</Typography>
          ) : null}
          <Typography sx={{ fontSize: 12, mt: 0.75, fontFamily: '"IBM Plex Mono", monospace' }}>
            {item.summary}
          </Typography>
          {item.wait ? (
            <Typography sx={{ fontSize: 12, mt: 0.5, fontFamily: '"IBM Plex Mono", monospace' }}>
              {item.wait}
            </Typography>
          ) : null}
          <Typography sx={{ fontSize: 12, mt: 0.75, fontWeight: 600, color: 'primary.main' }}>
            {item.suggestion}
          </Typography>
          {item.citation ? (
            <Typography sx={{ fontSize: 11, mt: 0.75, color: 'text.secondary' }}>
              {item.citation}
            </Typography>
          ) : null}
        </Box>
      ))}
      {estimated.map((item) => (
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
          Phase 1 percentiles are Analytic (Erlang C / path gamma), never Measured. Simulated
          samples check them. The fluid rate stepper is the overload branch when ρ ≥ 1.
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          Cost sums typed $/hr. Day is ×24, month is ×730 h. Not Simulated duration. Catalog has
          no SKU prices. Unknown if none are typed.
        </Typography>
      </Stack>
    </Box>
  )
}

import { Box, Stack, Typography } from '@mui/material'

export type ChartLine = {
  id: string
  label: string
  color: string
  points: { t: number; y: number }[]
}

export function LineChart({
  title,
  hint,
  lines,
  yMax,
  yLabel,
  target,
}: {
  title: string
  hint: string
  lines: ChartLine[]
  yMax: number
  yLabel: string
  target?: { y: number; label: string }
}) {
  const width = 640
  const height = 220
  const pad = { l: 52, r: 72, t: 16, b: 32 }
  const innerW = width - pad.l - pad.r
  const innerH = height - pad.t - pad.b
  const tMax = Math.max(1, ...lines.flatMap((line) => line.points.map((p) => p.t)))
  const yCeiling = yMax > 0 ? yMax : 1
  const x = (t: number) => pad.l + (t / tMax) * innerW
  const y = (value: number) => pad.t + innerH - (value / yCeiling) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        minWidth: 0,
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{title}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1 }}>{hint}</Typography>
      <Box
        component="svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
        preserveAspectRatio="xMidYMid meet"
        sx={{ width: '100%', height: 'auto', aspectRatio: '32 / 11', display: 'block' }}
      >
        {ticks.map((frac) => {
          const value = yCeiling * (1 - frac)
          const gy = pad.t + innerH * frac
          return (
            <g key={frac}>
              <line
                x1={pad.l}
                x2={width - pad.r}
                y1={gy}
                y2={gy}
                stroke="#D5DBE3"
                strokeDasharray="4 4"
              />
              <text
                x={pad.l - 8}
                y={gy + 4}
                textAnchor="end"
                fontSize="11"
                fill="#566273"
                fontFamily='"IBM Plex Mono", monospace'
              >
                {yLabel === 'util' ? `${Math.round(value * 100)}%` : value.toFixed(1)}
              </text>
            </g>
          )
        })}
        {target ? (
          <g>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={y(target.y)}
              y2={y(target.y)}
              stroke="#2E7D5B"
              strokeDasharray="6 4"
            />
            <text
              x={width - pad.r + 6}
              y={y(target.y) + 4}
              fontSize="11"
              fill="#2E7D5B"
            >
              {target.label}
            </text>
          </g>
        ) : null}
        {lines.map((line) => {
          const d = line.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.t).toFixed(1)} ${y(p.y).toFixed(1)}`)
            .join(' ')
          const last = line.points.at(-1)
          return (
            <g key={line.id}>
              <path d={d} fill="none" stroke={line.color} strokeWidth={2.5} />
              {last ? (
                <>
                  <circle cx={x(last.t)} cy={y(last.y)} r={3.5} fill={line.color} />
                  <text
                    x={x(last.t) + 8}
                    y={y(last.y) + 4}
                    fontSize="11"
                    fill={line.color}
                    fontFamily='"IBM Plex Mono", monospace'
                  >
                    {yLabel === 'util'
                      ? `${Math.round(last.y * 100)}%`
                      : last.y.toFixed(1)}
                  </text>
                </>
              ) : null}
            </g>
          )
        })}
        <text
          x={(pad.l + width - pad.r) / 2}
          y={height - 6}
          textAnchor="middle"
          fontSize="11"
          fill="#566273"
        >
          time (s)
        </text>
      </Box>
      <Stack direction="row" spacing={2} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        {lines.map((line) => (
          <Stack key={line.id} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 12, height: 2, bgcolor: line.color }} />
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              {line.label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

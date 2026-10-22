import { Box, Stack, Typography } from '@mui/material'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { formatPct, nodeHealth } from './simulate.ts'
import { useClassFilter } from './class-filter.ts'
import { nodeCarriesClass } from './compile.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'
import { zoneColors } from '../../theme/sdsTheme.ts'

const stroke = {
  default: '#D5DBE3',
  watch: '#B7791F',
  bottleneck: '#B3261E',
} as const

const utilColor = {
  default: '#2E7D5B',
  watch: '#B7791F',
  bottleneck: '#B3261E',
} as const

export function ServiceNodeView({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const { filter, edges } = useClassFilter()
  const onPath = nodeCarriesClass(
    { id, type: 'service', position: { x: 0, y: 0 }, data },
    edges,
    filter,
  )
  const health = nodeHealth(data)
  return (
    <Box
      sx={{
        width: 150,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: stroke[health],
        borderWidth: health === 'default' ? 1 : 2,
        borderRadius: '10px',
        p: 1.25,
        opacity: onPath ? 1 : 0.28,
      }}
    >
      <Handle type="target" position={Position.Left} />
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{data.title}</Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 13,
              color: utilColor[health],
            }}
          >
            {formatPct(data.util)}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {data.p99}
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          {data.queueDepth ?? data.loss
            ? `${data.queueDepth ?? ''} ${data.loss ?? ''}`.trim()
            : data.blastOrigin
              ? `Crash origin · ${data.meta}`
              : data.inBlast
                ? `Blast radius · ${data.meta}`
                : data.meta}
        </Typography>
        {data.queueDepth || data.loss ? (
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            {data.blastOrigin
              ? `Crash origin · ${data.meta}`
              : data.inBlast
                ? `Blast radius · ${data.meta}`
                : data.meta}
          </Typography>
        ) : null}
      </Stack>
      <Handle type="source" position={Position.Right} />
    </Box>
  )
}

export function ZoneNodeView({ data }: NodeProps<Node<ZoneNodeData>>) {
  const colors = zoneColors[data.provider]
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: colors.bg,
        border: '1px solid',
        borderColor: colors.line,
        borderRadius: '10px',
        px: 1.5,
        py: 1,
      }}
    >
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.label }}>
        {data.label}
      </Typography>
    </Box>
  )
}

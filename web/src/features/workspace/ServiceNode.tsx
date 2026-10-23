import { Box, Stack, Typography } from '@mui/material'
import { Handle, NodeResizer, Position, type Node, type NodeProps } from '@xyflow/react'
import { heatFill } from './heat.ts'
import { formatPct, nodeHealth } from './simulate.ts'
import { useClassFilter } from './class-filter.ts'
import { nodeCarriesClass } from './compile.ts'
import { useIconMode } from './icon-mode.tsx'
import { KindIcon } from './KindIcon.tsx'
import { iconGlyphFor } from './kind-icon.ts'
import { ENV_MIN_HEIGHT, ENV_MIN_WIDTH } from './environment.ts'
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

const TARGET_SIDES = [Position.Left, Position.Top] as const
const SOURCE_SIDES = [Position.Right, Position.Bottom] as const

export function ServiceNodeView({ id, data }: NodeProps<Node<ServiceNodeData>>) {
  const { filter, edges } = useClassFilter()
  const { mode } = useIconMode()
  const glyph = iconGlyphFor({
    mode,
    name: data.title,
    catalogId: data.catalogId,
  })
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
        bgcolor: heatFill(data.util),
        border: '1px solid',
        borderColor: stroke[health],
        borderWidth: health === 'default' ? 1 : 2,
        borderRadius: '10px',
        p: 1.25,
        opacity: onPath ? 1 : 0.28,
      }}
    >
      {TARGET_SIDES.map((side) => (
        <Handle key={`t-${side}`} id={`t-${side}`} type="target" position={side} />
      ))}
      {SOURCE_SIDES.map((side) => (
        <Handle key={`s-${side}`} id={`s-${side}`} type="source" position={side} />
      ))}
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <KindIcon glyph={glyph} size={16} title={data.title} />
          <Typography sx={{ fontWeight: 600, fontSize: 12, minWidth: 0 }}>
            {data.title}
          </Typography>
        </Stack>
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
    </Box>
  )
}

export function ZoneNodeView({ data, selected }: NodeProps<Node<ZoneNodeData>>) {
  const colors = zoneColors[data.provider]
  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        bgcolor: colors.bg,
        border: '1px solid',
        borderColor: selected ? 'primary.main' : colors.line,
        borderWidth: selected ? 2 : 1,
        borderRadius: '10px',
        px: 1.5,
        py: 1,
      }}
    >
      <NodeResizer
        minWidth={ENV_MIN_WIDTH}
        minHeight={ENV_MIN_HEIGHT}
        isVisible={selected}
        lineStyle={{ borderColor: colors.line }}
        handleStyle={{ width: 8, height: 8, background: colors.label, borderRadius: 1 }}
      />
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: colors.label }}>
        {data.nested ? `${data.label} · nested` : data.label}
      </Typography>
    </Box>
  )
}

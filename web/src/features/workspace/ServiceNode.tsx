import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Handle, NodeResizer, Position, type Node, type NodeProps } from '@xyflow/react'
import { heatFill } from './heat.ts'
import { formatPct, nodeHealth } from './simulate.ts'
import { useClassFilter } from './class-filter.ts'
import { kindForNode, nodeCarriesClass } from './compile.ts'
import { useIconMode } from './icon-mode.tsx'
import { CatalogIcon } from './CatalogIcon.tsx'
import { ENV_MIN_HEIGHT, ENV_MIN_WIDTH } from './environment.ts'
import { cardState, confidenceBadge, serverCountDisplay, type ConfidenceBadge } from './card-state.ts'
import { useLibrary } from '../calibration/library.ts'
import { confidenceLabel, profileConfidence } from '../calibration/citation.ts'
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

const badgeTone: Record<ConfidenceBadge['tone'], { color: string; bg: string; border: string }> = {
  unknown: { color: '#566273', bg: 'transparent', border: '1px dashed #B9C2CE' },
  estimated: { color: '#566273', bg: '#EEF1F5', border: '1px solid transparent' },
  vendor: { color: '#2744C7', bg: '#E7ECFC', border: '1px solid transparent' },
  measured: { color: '#2E7D5B', bg: '#E3F3EB', border: '1px solid transparent' },
}

const SIDES = [Position.Left, Position.Right, Position.Top, Position.Bottom] as const

export function ServiceNodeView({ id, data, selected }: NodeProps<Node<ServiceNodeData>>) {
  const { filter, edges } = useClassFilter()
  const { mode } = useIconMode()
  const library = useLibrary()
  const node = { id, type: 'service', position: { x: 0, y: 0 }, data }
  const onPath = nodeCarriesClass(node, edges, filter)
  const generator = kindForNode(node) === 'traffic_generator'
  const profile = library.profiles.find((item) => item.bindsTo === id)
  const confidence = profileConfidence(profile)
  const badge = confidenceBadge(confidence)
  const servers = generator ? undefined : serverCountDisplay(profile)
  const health = nodeHealth(data)
  const state = cardState(data, health)
  const queueLoss = [data.queueDepth, data.loss].filter(Boolean).join(' · ')
  const blast = data.blastOrigin ? 'Crash origin' : data.inBlast ? 'Blast radius' : undefined
  const secondLine = [queueLoss || undefined, blast].filter(Boolean).join(' · ') || data.meta
  return (
    <Box
      data-card-state={state}
      sx={{
        width: 168,
        bgcolor: heatFill(data.util),
        border: '1px solid',
        borderColor: state === 'live' ? '#2744C7' : stroke[health],
        borderWidth: health === 'default' && state !== 'live' ? 1 : 2,
        borderStyle: state === 'failed' ? 'dashed' : 'solid',
        borderRadius: '10px',
        p: 1.25,
        opacity: onPath ? 1 : 0.28,
        boxShadow: selected ? '0 0 0 2px #FFFFFF, 0 0 0 4px #2744C7' : 'none',
        transition: 'box-shadow 120ms ease, border-color 120ms ease, background-color 200ms ease',
        '&:hover': selected ? undefined : { boxShadow: '0 1px 4px rgba(19, 27, 38, 0.14)' },
      }}
    >
      {SIDES.map((side) => (
        <Handle key={side} id={side} type="source" position={side} />
      ))}
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <CatalogIcon
            mode={mode}
            name={data.title}
            catalogId={data.catalogId}
            size={16}
            title={data.title}
          />
          <Typography
            noWrap
            title={data.title}
            sx={{ fontWeight: 600, fontSize: 12, minWidth: 0, flex: 1 }}
          >
            {data.title}
          </Typography>
          {servers ? (
            <Tooltip title={servers.title}>
              <Typography
                component="span"
                data-server-count={servers.known ? 'set' : 'unknown'}
                noWrap
                sx={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  color: servers.known ? 'text.primary' : 'text.secondary',
                  flexShrink: 0,
                }}
              >
                {servers.text}
              </Typography>
            </Tooltip>
          ) : null}
          {generator ? null : (
            <Tooltip
              title={`${confidenceLabel(confidence === 'unknown' ? undefined : confidence)} capacity. ${
                confidence === 'unknown'
                  ? 'Unknown does not cap the engine. Set it in Config.'
                  : 'Weakest set field decides the badge.'
              }`}
            >
              <Box
                component="span"
                data-confidence={confidence}
                sx={{
                  fontSize: 9,
                  fontWeight: 600,
                  lineHeight: '14px',
                  px: 0.5,
                  borderRadius: 1,
                  letterSpacing: 0.2,
                  textTransform: 'uppercase',
                  color: badgeTone[badge.tone].color,
                  bgcolor: badgeTone[badge.tone].bg,
                  border: badgeTone[badge.tone].border,
                  flexShrink: 0,
                }}
              >
                {badge.label}
              </Box>
            </Tooltip>
          )}
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
          <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary', minWidth: 0, flex: 1 }}>
            {data.p99}
          </Typography>
          {state === 'live' ? (
            <Box
              component="span"
              aria-label="live"
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                bgcolor: '#2744C7',
                flexShrink: 0,
                alignSelf: 'center',
                '@keyframes sdsLivePulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.25 },
                },
                animation: 'sdsLivePulse 1s ease-in-out infinite',
              }}
            />
          ) : null}
        </Stack>
        {secondLine ? (
          <Typography noWrap sx={{ fontSize: 11, color: 'text.secondary' }}>
            {secondLine}
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

import { Box, Chip, Typography } from '@mui/material'
import {
  createColumnHelper,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { formatPct } from '../workspace/simulate.ts'
import type { RankRow } from '../workspace/types.ts'

function barColor(util: number) {
  if (util >= 0.85) return '#B3261E'
  if (util >= 0.7) return '#B7791F'
  return '#2E7D5B'
}

const features = tableFeatures({})
const helper = createColumnHelper<typeof features, RankRow>()

const columns = helper.columns([
  helper.display({
    id: 'rank',
    header: '#',
    cell: ({ row }) => row.index + 1,
  }),
  helper.accessor('title', {
    header: 'Service',
    cell: (info) => (
      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
          {info.getValue()}
        </Typography>
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          {info.row.original.provider}
        </Typography>
      </Box>
    ),
  }),
  helper.accessor('util', {
    header: 'Util',
    cell: (info) => {
      const util = info.getValue()
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 110 }}>
          <Box
            sx={{
              flex: 1,
              height: 6,
              bgcolor: 'divider',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                width: `${Math.min(100, Math.round(util * 100))}%`,
                height: '100%',
                bgcolor: barColor(util),
              }}
            />
          </Box>
          <Typography
            sx={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 12,
              color: barColor(util),
              minWidth: 36,
            }}
          >
            {formatPct(util)}
          </Typography>
        </Box>
      )
    },
  }),
  helper.accessor('source', {
    header: 'Source',
    cell: (info) => {
      const source = info.getValue()
      return (
        <Chip
          size="small"
          label={info.row.original.citation ?? (source === 'engine' ? 'Engine' : 'Est.')}
          sx={{
            height: 20,
            fontSize: 11,
            maxWidth: 140,
            bgcolor: source === 'engine' ? 'primary.light' : 'background.default',
            color: source === 'engine' ? 'primary.dark' : 'text.secondary',
          }}
        />
      )
    },
  }),
])

export function RankingTable({ rows }: { rows: RankRow[] }) {
  const table = useTable({
    features,
    columns,
    data: rows,
  })

  return (
    <Box
      sx={{
        width: 300,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        overflow: 'auto',
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 1 }}>
        Utilization ranking
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5 }}>
        From the Workspace run. Utilization is Analytic ρ against each bound
        profile. Unknown capacity is not a measurement.
      </Typography>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="thead">
          {table.getHeaderGroups().map((group) => (
            <Box component="tr" key={group.id}>
              {group.headers.map((header) => (
                <Box
                  component="th"
                  key={header.id}
                  sx={{
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'text.secondary',
                    pb: 1,
                    pr: 1,
                    whiteSpace: 'nowrap',
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <table.FlexRender header={header} />
                  )}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
        <Box component="tbody">
          {table.getRowModel().rows.map((row) => (
            <Box component="tr" key={row.id}>
              {row.getAllCells().map((cell) => (
                <Box
                  component="td"
                  key={cell.id}
                  sx={{
                    py: 0.75,
                    pr: 1,
                    fontSize: 12,
                    borderBottom: 1,
                    borderColor: 'divider',
                    verticalAlign: 'middle',
                  }}
                >
                  <table.FlexRender cell={cell} />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

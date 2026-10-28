import { useMemo, useState } from 'react'
import { Box, MenuItem, Select, Stack, Typography } from '@mui/material'
import { KpiStat } from '../../components/KpiStat.tsx'
import { TopNav } from '../../components/TopNav.tsx'
import { idleKpis } from '../workspace/simulate.ts'
import {
  activeRecord,
  chooseRun,
  runMenuLabel,
  useRunHistory,
} from '../workspace/run-history.ts'
import type { KpiState } from '../workspace/types.ts'
import { Explainer } from './Explainer.tsx'
import { FidelityPanel } from './FidelityPanel.tsx'
import { LineChart } from './LineChart.tsx'
import { RankingTable } from './RankingTable.tsx'
import { absentRecordedTest, parseRecordedTest } from './recorded-test.ts'
import { scoreReferenceFidelity } from './score-reference.ts'

export function ResultsPage() {
  const history = useRunHistory()
  const record = activeRecord(history)
  const [recorded, setRecorded] = useState(absentRecordedTest)
  const fidelity = useMemo(() => scoreReferenceFidelity(recorded), [recorded])
  const kpis: KpiState = record?.run.kpis ?? idleKpis

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <TopNav page="results" />
      <Stack direction="row" sx={{ alignItems: 'center', px: 2, py: 1, gap: 1.5 }}>
        <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 0 }} noWrap>
          {record
            ? `${record.projectName} / Results`
            : 'Results'}
        </Typography>
        <Select
          size="small"
          displayEmpty
          value={record?.id ?? ''}
          disabled={history.runs.length === 0}
          onChange={(event) => chooseRun(Number(event.target.value))}
          sx={{ minWidth: 220, maxWidth: 420, height: 32, fontSize: 12 }}
          renderValue={() => (record ? runMenuLabel(record) : 'No Workspace run yet')}
        >
          {history.runs.map((item) => (
            <MenuItem key={item.id} value={item.id} sx={{ fontSize: 12 }}>
              {runMenuLabel(item)}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
          {record ? record.hint : 'Run on Workspace. This page reads that run.'}
        </Typography>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          alignItems: 'center',
        }}
      >
        <KpiStat label="LOAD" value={kpis.load} hint={kpis.loadHint} />
        <KpiStat label="LATENCY" value={kpis.latency} hint={kpis.latencyHint} />
        <KpiStat label="ERRORS" value={kpis.errors} hint="of requests" />
        <KpiStat label="BOTTLENECKS" value={kpis.bottlenecks} hint={kpis.bottleneckHint} />
        <KpiStat label="COST" value={kpis.cost} hint={kpis.costHint} />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
        {record ? (
          <>
            <RankingTable rows={record.ranking} />
            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
              {record.run.hockeyStick ? (
                <LineChart
                  title="Hockey-stick · latency vs load"
                  hint={`${record.run.stability ?? 'steady state'} · headroom ${record.run.headroomRps !== undefined ? `${Math.round(record.run.headroomRps)} rps` : '—'} · Analytic sojourn, never Measured. ρ ≥ 1 is omitted (Unstable).`}
                  xLabel="offered rps"
                  yLabel="ms"
                  yMax={Math.max(
                    1,
                    ...record.run.hockeyStick.lines.flatMap((line) =>
                      line.waitMs.filter((y) => Number.isFinite(y)),
                    ),
                  )}
                  lines={record.run.hockeyStick.lines
                    .filter((line) => line.waitMs.some((y) => Number.isFinite(y)))
                    .slice(0, 6)
                    .map((line, index) => ({
                      id: line.id,
                      label: line.title,
                      color: ['#2744C7', '#B3261E', '#2E7D5B', '#B7791F', '#6B4C9A', '#1D6F8A'][index] ?? '#2744C7',
                      points: record.run.hockeyStick!.rps.map((rps, i) => ({
                        t: rps,
                        y: line.waitMs[i] ?? 0,
                      })).filter((p) => Number.isFinite(p.y)),
                    }))}
                />
              ) : null}
              <Explainer bottlenecks={record.run.bottlenecks} />
            </Stack>
          </>
        ) : (
          <Box
            sx={{
              flex: 1,
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 3,
              minWidth: 0,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>No run yet</Typography>
            <Typography sx={{ mt: 1, fontSize: 13, color: 'text.secondary', maxWidth: 520 }}>
              Run the canvas on Workspace. Phase 1 Results is steady-state queueing: Stable /
              Saturating / Unstable, ρ, wait, Analytic p50/p95/p99 (never Measured), headroom, and
              a hockey-stick of latency vs load. J12 A/B stay blocked. Cost stays unknown until you
              type $/hr.
              Catalog has no SKU prices.
            </Typography>
          </Box>
        )}
        <Stack spacing={1.5} sx={{ width: 320, flexShrink: 0, minHeight: 0, overflow: 'auto' }}>
          <FidelityPanel
            report={fidelity}
            onLoadFile={(text) => {
              const next = parseRecordedTest(text)
              if (next) setRecorded(next)
            }}
          />
        </Stack>
      </Box>
    </Box>
  )
}

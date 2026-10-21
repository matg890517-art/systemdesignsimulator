import { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { TopNav } from '../../components/TopNav.tsx'
import { aksRunPlan, useLibrary } from '../calibration/library.ts'
import { aksScenario, buildResultsReport, idleKpis } from '../workspace/simulate.ts'
import type { KpiState, ResultsReport } from '../workspace/types.ts'
import { Explainer } from './Explainer.tsx'
import { LineChart } from './LineChart.tsx'
import { RankingTable } from './RankingTable.tsx'

function Kpi({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <Box sx={{ minWidth: 0, px: 2, py: 1 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 18, whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{hint}</Typography>
    </Box>
  )
}

export function ResultsPage() {
  const library = useLibrary()
  const plan = aksRunPlan()
  const [report, setReport] = useState<ResultsReport | undefined>(() => {
    try {
      return buildResultsReport()
    } catch {
      return undefined
    }
  })
  const [ran, setRan] = useState(Boolean(report))
  const kpis: KpiState = report?.kpis ?? idleKpis

  const utilLines = useMemo(
    () =>
      report
        ? [
            {
              id: 'baseline',
              label: `${report.baseline.servers} slots`,
              color: '#B3261E',
              points: report.baseline.series.map((p) => ({ t: p.t, y: p.util })),
            },
            {
              id: 'raised',
              label: `${report.raised.servers} slots`,
              color: '#2744C7',
              points: report.raised.series.map((p) => ({ t: p.t, y: p.util })),
            },
          ]
        : [],
    [report],
  )

  const rateLines = useMemo(
    () =>
      report
        ? [
            {
              id: 'completed',
              label: 'completed',
              color: '#2744C7',
              points: report.baseline.series.map((p) => ({ t: p.t, y: p.completed })),
            },
            {
              id: 'mu',
              label: `μ ${report.baseline.mu.toFixed(1)} /s`,
              color: '#7B8794',
              points: report.baseline.series.map((p) => ({
                t: p.t,
                y: report.baseline.mu,
              })),
            },
          ]
        : [],
    [report],
  )

  function onRun() {
    if (!plan.ok) return
    setReport(buildResultsReport())
    setRan(true)
  }

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
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Projects / Example: Video streaming platform (YouTube-style) / Results
        </Typography>
        <Chip label="Engine fluid" size="small" sx={{ bgcolor: 'primary.light', color: 'primary.dark', height: 20 }} />
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Fluid-flow · {aksScenario.durationSec} s · seed {aksScenario.seed}
        </Typography>
        <Button variant="contained" onClick={onRun} disabled={!plan.ok}>
          Run
        </Button>
      </Stack>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr)) auto',
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          alignItems: 'center',
        }}
      >
        <Kpi label="LOAD" value={kpis.load} hint={kpis.loadHint} />
        <Kpi label="LATENCY" value={kpis.latency} hint={kpis.latencyHint} />
        <Kpi label="ERRORS" value={kpis.errors} hint="of requests · Estimated" />
        <Kpi label="BOTTLENECKS" value={kpis.bottlenecks} hint={kpis.bottleneckHint} />
        <Kpi label="COST" value={kpis.cost} hint={kpis.costHint} />
        {ran && report ? (
          <Typography sx={{ px: 2, fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            Last run from @sds/engine · {report.baseline.servers} vs {report.suggestedSlots} slots
            {library.fault !== 'none' ? ` · ${library.fault}` : ''}
          </Typography>
        ) : null}
        {!plan.ok ? (
          <Typography sx={{ px: 2, fontSize: 11, color: 'error.main' }}>{plan.reason}</Typography>
        ) : null}
      </Box>
      {report ? (
        <Box sx={{ flex: 1, display: 'flex', gap: 1.5, p: 1.5, minHeight: 0 }}>
          <RankingTable rows={report.ranking} />
          <Stack spacing={1.5} sx={{ flex: 1.6, minWidth: 360, overflow: 'auto' }}>
            <LineChart
              title="AKS utilization"
              hint="Engine fluid rates. Red is the calibrated slot count. Blue is the suggested slot count."
              lines={utilLines}
              yMax={1}
              yLabel="util"
              target={{ y: aksScenario.targetUtil, label: '83% target' }}
            />
            <LineChart
              title="Completed vs capacity"
              hint="Completed stays at offered load when the pool keeps up. Capacity is μ = n / S. Fluid mode has no latency tails."
              lines={rateLines}
              yMax={Math.max(report.baseline.mu, 2.5)}
              yLabel="rps"
            />
            <Typography sx={{ fontSize: 11, color: 'text.secondary', px: 0.5 }}>
              Load, latency, errors and cost KPIs on this example stay Estimated except the AKS
              bottleneck, which the engine ranks from conservation. Idle strip defaults:{' '}
              {idleKpis.latency}.
            </Typography>
          </Stack>
          <Explainer report={report} />
        </Box>
      ) : (
        <Typography sx={{ p: 3, color: 'text.secondary' }}>
          {plan.ok ? 'Run the engine to fill Results.' : plan.reason}
        </Typography>
      )}
    </Box>
  )
}

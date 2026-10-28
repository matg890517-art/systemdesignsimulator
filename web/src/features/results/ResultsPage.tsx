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
            <Explainer bottlenecks={record.run.bottlenecks} />
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
              Run the canvas on Workspace. Results shows that run: load, latency, errors,
              bottlenecks, cost, and the ranking. Fluid P50 / P90 / P99 stay unknown. Cost stays
              unknown until you type $/hr. Catalog has no SKU prices.
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

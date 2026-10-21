import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import type { FidelityReport } from '@sds/engine'

function statusChip(status: FidelityReport['checkA']['status']) {
  if (status === 'pass') return { label: 'Pass', sx: { bgcolor: 'success.light', color: 'success.dark', height: 20 } }
  if (status === 'fail') return { label: 'Fail', sx: { bgcolor: 'error.light', color: 'error.main', height: 20 } }
  return { label: 'Blocked', sx: { bgcolor: 'warning.light', color: 'warning.dark', height: 20 } }
}

export function FidelityPanel({
  report,
  onLoadFile,
}: {
  report: FidelityReport
  onLoadFile: (text: string) => void
}) {
  const checks = [report.checkA, report.checkB, report.checkC]
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minWidth: 280,
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>J12 fidelity</Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        A = same first-saturating component. B = load where latency climbs (tolerance after the
        first measurement). C = rank correlation, diagnostic only. No Measured label without a
        lab recording (decision 6).
      </Typography>
      <Typography sx={{ fontSize: 12 }}>
        Recording: {report.recorded.name} · {report.recorded.kind}
      </Typography>
      {checks.map((check) => (
        <Box key={check.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 600, fontSize: 12 }}>Check {check.id}</Typography>
            <Chip size="small" {...statusChip(check.status)} />
          </Stack>
          <Typography sx={{ fontSize: 12, mt: 0.5 }}>{check.detail}</Typography>
          {check.predicted !== undefined ? (
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              Predicted {String(check.predicted)}
              {check.measured !== undefined ? ` · recorded ${String(check.measured)}` : ''}
            </Typography>
          ) : null}
        </Box>
      ))}
      <Typography sx={{ fontWeight: 600, fontSize: 12 }}>Gaps per profile</Typography>
      {report.gaps.map((gap) => (
        <Typography key={gap.profileId} sx={{ fontSize: 12, color: 'text.secondary' }}>
          {gap.name}
          {gap.unknownRoles.length ? ` · unknown ${gap.unknownRoles.join(', ')}` : ' · no unknown fields'}
          {gap.measured ? ' · Measured' : ` · ${gap.confidence}`}
        </Typography>
      ))}
      <Button
        size="small"
        variant="outlined"
        component="label"
      >
        Load recorded test
        <input
          type="file"
          hidden
          accept=".json,application/json"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            void file.text().then(onLoadFile)
            event.target.value = ''
          }}
        />
      </Button>
    </Box>
  )
}

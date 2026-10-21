import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { FAULT_OPTIONS, setFault, useLibrary } from '../calibration/library.ts'

export function FaultsPanel() {
  const { fault } = useLibrary()
  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <Typography variant="h2">Faults</Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        These change the next engine run on the compiled canvas. Packet drop and link
        cut set lossProb on the uploaders → AKS edge. Crash zeros AKS slots, lists the
        downstream blast radius, and trips the documented upstream breaker in
        discrete-event. Latency spike applies in discrete-event mode.
      </Typography>
      <RadioGroup
        sx={{ mt: 2 }}
        value={fault}
        onChange={(event) => setFault(event.target.value as typeof fault)}
      >
        {FAULT_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.id}
            value={option.id}
            control={<Radio />}
            label={
              <Box sx={{ py: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{option.label}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {option.body}
                </Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>
    </Box>
  )
}

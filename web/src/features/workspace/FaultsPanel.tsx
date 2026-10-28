import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { FAULT_OPTIONS, setFault, useLibrary } from '../calibration/library.ts'

export function FaultsPanel() {
  const { fault } = useLibrary()
  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <Typography variant="h2">Faults</Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        Engine slice E3 (product Phase 4). Phase 1 Analytic and Simulated ignore faults:
        nothing failing, nothing bursting. The controls stay so the tab does not vanish.
        A later E3 run will feed crash, latency spike, link cut and packet drop.
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

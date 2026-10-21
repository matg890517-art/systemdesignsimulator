import {
  Box,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { expectedArrivals } from '@sds/engine'
import { compileCanvas, DISCRETE_EVENT_GUARD, REQUEST_CLASSES, type WorkloadDraft } from './compile.ts'
import { getWorkloadDraft, patchWorkloadDraft, useWorkloadDraft } from './workload-store.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { getProfiles } from '../calibration/library.ts'

const SHAPES = [
  { id: 'constant', label: 'Constant', body: 'Offered rate stays at the baseline for the whole run.' },
  { id: 'poisson', label: 'Poisson', body: 'Same mean as constant in fluid. Discrete mode draws exponential gaps.' },
  { id: 'step', label: 'Step', body: 'Baseline, then multiply by a factor from a given second onward.' },
  { id: 'spike', label: 'Spike', body: 'Baseline, a short burst, then back to baseline.' },
] as const

const CLASS_LABEL: Record<(typeof REQUEST_CLASSES)[number], string> = {
  read: 'Read',
  write: 'Write',
  async: 'Async',
  bulk: 'Bulk',
}

export function WorkloadEditor() {
  const draft = useWorkloadDraft()
  const compiled = compileCanvas(initialNodes, initialEdges, draft, getProfiles(), 'none')
  const arrivals = expectedArrivals(compiled.workload)
  const discreteBlocked = draft.mode === 'discrete' && arrivals > DISCRETE_EVENT_GUARD

  return (
    <Box sx={{ p: 3, maxWidth: 720, overflow: 'auto' }}>
      <Typography variant="h2">Workload</Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        Viewers send read, write, and async. Uploaders send bulk. Run compiles the canvas; unknown
        capacity does not cap the engine.
      </Typography>

      <Typography sx={{ mt: 3, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
        Request classes
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
        {REQUEST_CLASSES.map((id) => (
          <TextField
            key={id}
            size="small"
            type="number"
            label={`${CLASS_LABEL[id]} rps`}
            value={draft.classes[id]}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next < 0) return
              patchWorkloadDraft({ classes: { ...getWorkloadDraft().classes, [id]: next } })
            }}
            sx={{ width: 150 }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          type="number"
          label="Duration (s)"
          value={draft.durationSec}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (!Number.isFinite(next) || next <= 0) return
            patchWorkloadDraft({ durationSec: next })
          }}
          sx={{ width: 140 }}
        />
        <TextField
          size="small"
          type="number"
          label="dt (s)"
          value={draft.dtSec}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (!Number.isFinite(next) || next <= 0) return
            patchWorkloadDraft({ dtSec: next })
          }}
          sx={{ width: 120 }}
        />
        <TextField
          size="small"
          type="number"
          label="Seed"
          value={draft.seed}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (!Number.isFinite(next)) return
            patchWorkloadDraft({ seed: next })
          }}
          sx={{ width: 120 }}
        />
        <TextField
          select
          size="small"
          label="Engine"
          value={draft.mode}
          onChange={(event) =>
            patchWorkloadDraft({ mode: event.target.value as WorkloadDraft['mode'] })
          }
          sx={{ width: 160 }}
        >
          <MenuItem value="fluid">Fluid-flow</MenuItem>
          <MenuItem value="discrete">Discrete-event</MenuItem>
        </TextField>
      </Stack>

      <Typography sx={{ mt: 3, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
        Load shape
      </Typography>
      <RadioGroup
        sx={{ mt: 1 }}
        value={draft.shapeKind}
        onChange={(event) =>
          patchWorkloadDraft({ shapeKind: event.target.value as WorkloadDraft['shapeKind'] })
        }
      >
        {SHAPES.map((shape) => (
          <FormControlLabel
            key={shape.id}
            value={shape.id}
            control={<Radio />}
            label={
              <Box sx={{ py: 0.5 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{shape.label}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{shape.body}</Typography>
              </Box>
            }
          />
        ))}
      </RadioGroup>

      {draft.shapeKind === 'step' ? (
        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            size="small"
            type="number"
            label="Step at (s)"
            value={draft.stepAtSec}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next < 0) return
              patchWorkloadDraft({ stepAtSec: next })
            }}
          />
          <TextField
            size="small"
            type="number"
            label="Factor"
            value={draft.stepFactor}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next <= 0) return
              patchWorkloadDraft({ stepFactor: next })
            }}
          />
        </Stack>
      ) : null}

      {draft.shapeKind === 'spike' ? (
        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            size="small"
            type="number"
            label="Spike at (s)"
            value={draft.spikeAtSec}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next < 0) return
              patchWorkloadDraft({ spikeAtSec: next })
            }}
          />
          <TextField
            size="small"
            type="number"
            label="Duration (s)"
            value={draft.spikeDurationSec}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next <= 0) return
              patchWorkloadDraft({ spikeDurationSec: next })
            }}
          />
          <TextField
            size="small"
            type="number"
            label="Factor"
            value={draft.spikeFactor}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (!Number.isFinite(next) || next <= 0) return
              patchWorkloadDraft({ spikeFactor: next })
            }}
          />
        </Stack>
      ) : null}

      <Typography sx={{ mt: 2, fontSize: 12, color: discreteBlocked ? 'error.main' : 'text.secondary' }}>
        {discreteBlocked
          ? `Discrete mode would schedule about ${Math.round(arrivals).toLocaleString()} arrivals (guard ${DISCRETE_EVENT_GUARD.toLocaleString()}). Use fluid, or lower rate / duration.`
          : `About ${Math.round(arrivals).toLocaleString()} arrivals over ${draft.durationSec}s at peak.`}
      </Typography>
    </Box>
  )
}

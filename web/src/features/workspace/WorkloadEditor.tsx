import {
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { expectedArrivals } from '@sds/engine'
import type { Edge as RfEdge, Node } from '@xyflow/react'
import {
  canvasGenerators,
  compileCanvas,
  DISCRETE_EVENT_GUARD,
  REQUEST_CLASSES,
  visibleClassRate,
  type WorkloadDraft,
} from './compile.ts'
import {
  patchGeneratorClassRate,
  patchWorkloadDraft,
  useWorkloadDraft,
} from './workload-store.ts'
import { getProfiles } from '../calibration/library.ts'
import { RunModeToggle } from './RunModeToggle.tsx'
import { RUN_MODES, isSimulatedMode, normalizeRunMode } from './run-mode.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

const SHAPES = [
  { id: 'constant', label: 'Constant', body: 'Phase 1. Offered rate stays at the baseline. Analytic reads this as λ.' },
  {
    id: 'ramp',
    label: 'Ramp',
    body: 'Simulated only. Offered load starts at 0 and rises to the target, then holds. Analytic still solves the target rate.',
  },
  { id: 'poisson', label: 'Poisson', body: 'Engine slice E2. Same mean as constant. Simulated draws exponential gaps.' },
  { id: 'step', label: 'Step', body: 'Engine slice E2. Baseline, then multiply from a given second.' },
  { id: 'spike', label: 'Spike', body: 'Engine slice E2. Baseline, a short burst, then back to baseline.' },
] as const

const CLASS_LABEL: Record<(typeof REQUEST_CLASSES)[number], string> = {
  read: 'Read',
  write: 'Write',
  async: 'Async',
  bulk: 'Bulk',
}

const fieldGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 1.5,
  mt: 1,
} as const

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (next: number) => void
}) {
  return (
    <Box>
      <Typography component="label" sx={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>
        {label}
      </Typography>
      <TextField
        size="small"
        type="number"
        hiddenLabel
        fullWidth
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (!Number.isFinite(next)) return
          onChange(next)
        }}
        slotProps={{ htmlInput: { 'aria-label': label } }}
      />
    </Box>
  )
}

function RunClockFields({ draft }: { draft: WorkloadDraft }) {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>Run clock</Typography>
      <Box sx={fieldGridSx}>
        <NumberField
          label="Duration (s)"
          value={draft.durationSec}
          onChange={(next) => {
            if (next <= 0) return
            patchWorkloadDraft({ durationSec: next })
          }}
        />
        <NumberField
          label="dt (s)"
          value={draft.dtSec}
          onChange={(next) => {
            if (next <= 0) return
            patchWorkloadDraft({ dtSec: next })
          }}
        />
        <NumberField
          label="Seed"
          value={draft.seed}
          onChange={(next) => patchWorkloadDraft({ seed: next })}
        />
      </Box>
      <Typography sx={{ mt: 0.75, fontSize: 11, color: 'text.secondary' }}>
        Same on every Clients card. Duration is simulated seconds. Warm-up is 20% of duration. Seed
        replays Simulated. dt is unused in Analytic.
      </Typography>
    </Box>
  )
}

export function WorkloadEditor({
  nodes,
  edges,
}: {
  nodes: Node<ServiceNodeData | ZoneNodeData>[]
  edges: RfEdge[]
}) {
  const draft = useWorkloadDraft()
  const generators = canvasGenerators(nodes, edges)
  const compiled = compileCanvas(nodes, edges, draft, getProfiles(), 'none')
  const arrivals = expectedArrivals(compiled.workload)
  const discreteBlocked = isSimulatedMode(draft.mode) && arrivals > DISCRETE_EVENT_GUARD

  return (
    <Box sx={{ p: 3, maxWidth: 720, overflow: 'auto' }}>
      <Typography variant="h2">Workload</Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        One rate block per Clients card on the canvas. Every card has Read, Write, Async and Bulk,
        same as the Class chips. A class with no outgoing hop stays 0 until you turn it on. Phase 1
        Analytic uses the target rate (this is λ). Ramp plays in Simulated. Poisson, step and spike
        wait for discrete verifier and bursts. Unknown capacity does not cap the engine.
      </Typography>

      {generators.length === 0 ? (
        <Typography sx={{ mt: 3, fontSize: 13, color: 'text.secondary' }}>
          Drop a Clients card. Each extra Clients card adds another rate block here.
        </Typography>
      ) : (
        generators.map((generator) => (
          <Box key={generator.id} sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              {generator.title}
            </Typography>
            <Box sx={fieldGridSx}>
              {REQUEST_CLASSES.map((id) => (
                <NumberField
                  key={id}
                  label={`${CLASS_LABEL[id]} rps`}
                  value={visibleClassRate(draft, generator, id)}
                  onChange={(next) => {
                    if (next < 0) return
                    patchGeneratorClassRate(generator.id, id, next)
                  }}
                />
              ))}
            </Box>
          </Box>
        ))
      )}
      <RunClockFields draft={draft} />
      <Stack spacing={0.75} sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          Run mode
        </Typography>
        <RunModeToggle />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {RUN_MODES.find((item) => item.id === normalizeRunMode(draft.mode))?.hint} Same topology either way. Also
          next to Run on the canvas.
        </Typography>
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

      {draft.shapeKind === 'ramp' ? (
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          <Box sx={{ maxWidth: 200 }}>
            <NumberField
              label="Ramp (s)"
              value={draft.rampSec}
              onChange={(next) => {
                if (next <= 0) return
                patchWorkloadDraft({ rampSec: next })
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Analytic uses the target rate. Ramp plays in Simulated.
          </Typography>
        </Stack>
      ) : null}

      {draft.shapeKind === 'step' ? (
        <Box sx={fieldGridSx}>
          <NumberField
            label="Step at (s)"
            value={draft.stepAtSec}
            onChange={(next) => {
              if (next < 0) return
              patchWorkloadDraft({ stepAtSec: next })
            }}
          />
          <NumberField
            label="Factor"
            value={draft.stepFactor}
            onChange={(next) => {
              if (next <= 0) return
              patchWorkloadDraft({ stepFactor: next })
            }}
          />
        </Box>
      ) : null}

      {draft.shapeKind === 'spike' ? (
        <Box sx={fieldGridSx}>
          <NumberField
            label="Spike at (s)"
            value={draft.spikeAtSec}
            onChange={(next) => {
              if (next < 0) return
              patchWorkloadDraft({ spikeAtSec: next })
            }}
          />
          <NumberField
            label="Duration (s)"
            value={draft.spikeDurationSec}
            onChange={(next) => {
              if (next <= 0) return
              patchWorkloadDraft({ spikeDurationSec: next })
            }}
          />
          <NumberField
            label="Factor"
            value={draft.spikeFactor}
            onChange={(next) => {
              if (next <= 0) return
              patchWorkloadDraft({ spikeFactor: next })
            }}
          />
        </Box>
      ) : null}

      <Typography sx={{ mt: 2, fontSize: 12, color: discreteBlocked ? 'error.main' : 'text.secondary' }}>
        {discreteBlocked
          ? `Simulated mode would schedule about ${Math.round(arrivals).toLocaleString()} arrivals (guard ${DISCRETE_EVENT_GUARD.toLocaleString()}). Use Analytic, or lower rate / duration.`
          : `About ${Math.round(arrivals).toLocaleString()} arrivals over ${draft.durationSec}s at peak.`}
      </Typography>
    </Box>
  )
}

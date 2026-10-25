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
  generatorClassRate,
  REQUEST_CLASSES,
  type WorkloadDraft,
} from './compile.ts'
import {
  patchGeneratorClassRate,
  patchWorkloadDraft,
  useWorkloadDraft,
} from './workload-store.ts'
import { getProfiles } from '../calibration/library.ts'
import { RunModeToggle } from './RunModeToggle.tsx'
import { RUN_MODES } from './run-mode.ts'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

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

function RunClockFields({ draft }: { draft: WorkloadDraft }) {
  return (
    <>
      <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
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
      </Stack>
      <Typography sx={{ mt: 0.75, fontSize: 11, color: 'text.secondary' }}>
        Same on Viewers, Uploaders and Clients. Duration is simulated seconds, dt is the Fluid
        step, seed replays Discrete.
      </Typography>
    </>
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
  const discreteBlocked = draft.mode === 'discrete' && arrivals > DISCRETE_EVENT_GUARD

  return (
    <Box sx={{ p: 3, maxWidth: 720, overflow: 'auto' }}>
      <Typography variant="h2">Workload</Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        One rate block per Clients card on the canvas. Classes follow that card&apos;s outgoing
        edges. YouTube: Viewers R/W, Uploaders Bulk. Unknown capacity does not cap the engine.
      </Typography>

      {generators.length === 0 ? (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            Drop a Clients card. Each extra Clients card adds another rate block here.
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
            Run clock
          </Typography>
          <RunClockFields draft={draft} />
        </Box>
      ) : (
        generators.map((generator) => (
          <Box key={generator.id} sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
              {generator.title}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {generator.classes.map((id) => (
                <TextField
                  key={id}
                  size="small"
                  type="number"
                  label={`${CLASS_LABEL[id]} rps`}
                  value={generatorClassRate(draft, generator.id, id)}
                  onChange={(event) => {
                    const next = Number(event.target.value)
                    if (!Number.isFinite(next) || next < 0) return
                    patchGeneratorClassRate(generator.id, id, next)
                  }}
                  sx={{ width: 150 }}
                />
              ))}
            </Stack>
            <RunClockFields draft={draft} />
          </Box>
        ))
      )}
      <Stack spacing={0.75} sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          Run mode
        </Typography>
        <RunModeToggle />
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          {RUN_MODES.find((item) => item.id === draft.mode)?.hint} Same topology either way. Also
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

import { Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { TopNav } from '../../components/TopNav.tsx'
import { browserStore, queueOpen } from '../workspace/persistence.ts'
import { templateSnapshot, type TemplateId } from '../workspace/templates.ts'

const steps = [
  {
    title: '1. Open a template',
    body: 'Start from the YouTube-style example or the generic 9-block. AWS, Azure, and GCP maps bind catalog ids only. Capacities stay Estimated.',
  },
  {
    title: '2. Type what you know',
    body: 'Select a node. Empty fields stay unknown and do not cap the engine. A typed number is Estimated. Hourly cost is optional and is never taken from Catalog.',
  },
  {
    title: '3. Set a workload and Run',
    body: 'Phase 1 Analytic uses constant load. Poisson, step, and spike wait for discrete verifier and bursts. The engine runs on a Web Worker.',
  },
  {
    title: '4. Read Results as a model, not a lab',
    body: 'Bottlenecks come from Erlang-C wait, not from capacity ≥ load. Analytic p50/p95/p99 are labeled Analytic, never Measured. J12 A/B stay blocked until a real recorded test of the reference stack exists.',
  },
  {
    title: '5. Try the AKS headroom challenge',
    body: 'Type Estimated slots so engine util on AKS is under 85%. Pass is not Measured. Do not fill n from the ECS task quota.',
  },
]

const templates: { id: TemplateId; label: string; hint: string }[] = [
  { id: 'youtube', label: 'YouTube-style example', hint: 'Mixed AWS / Azure / GCP · Estimated' },
  { id: 'generic', label: 'Generic 9-block', hint: 'No cloud vendor in the engine' },
  { id: 'aws', label: 'AWS mapping', hint: 'Catalog ids only' },
  { id: 'azure', label: 'Azure mapping', hint: 'Catalog ids only' },
  { id: 'gcp', label: 'GCP mapping', hint: 'Catalog ids only' },
]

export function LearnPage() {
  const navigate = useNavigate()

  function openTemplate(id: TemplateId) {
    const store = browserStore()
    const snapshot = templateSnapshot(id)
    if (store) queueOpen(store, snapshot)
    void navigate({ to: '/' })
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="learn" />
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
          <Typography variant="h2">Learn</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            A short path through the capacity planner. This is not a tutorial that invents
            measurements. Numbers you type are Estimated until a lab recording exists.
          </Typography>
          {steps.map((step) => (
            <Box key={step.title} sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{step.title}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>{step.body}</Typography>
            </Box>
          ))}
          <Button
            size="small"
            variant="outlined"
            onClick={() => void navigate({ to: '/challenge' })}
            sx={{ alignSelf: 'flex-start' }}
          >
            Open AKS headroom challenge
          </Button>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Templates</Typography>
          <Stack spacing={1}>
            {templates.map((item) => (
              <Box
                key={item.id}
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 3,
                  p: 2,
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{item.label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.hint}</Typography>
                </Box>
                <Button size="small" variant="contained" onClick={() => openTemplate(item.id)}>
                  Open in Workspace
                </Button>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  )
}

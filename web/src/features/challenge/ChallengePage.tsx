import { Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { TopNav } from '../../components/TopNav.tsx'
import { browserStore, queueOpen } from '../workspace/persistence.ts'
import { youtubeTemplate } from '../workspace/templates.ts'
import { AKS_HEADROOM_CHALLENGE } from './challenge.ts'

export function ChallengePage() {
  const navigate = useNavigate()

  function start() {
    const store = browserStore()
    if (store) queueOpen(store, youtubeTemplate())
    void navigate({ to: '/', search: { challenge: AKS_HEADROOM_CHALLENGE.id } })
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="challenge" />
      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
        <Stack spacing={2} sx={{ maxWidth: 720 }}>
          <Typography variant="h2">{AKS_HEADROOM_CHALLENGE.title}</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
            {AKS_HEADROOM_CHALLENGE.goal} Pass is engine util, not a Measured lab result. No
            account is required.
          </Typography>
          {AKS_HEADROOM_CHALLENGE.rules.map((rule) => (
            <Box key={rule} sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 2 }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{rule}</Typography>
            </Box>
          ))}
          <Button variant="contained" onClick={start} sx={{ alignSelf: 'flex-start' }}>
            Open YouTube example
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}

import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { TopNav } from '../../components/TopNav.tsx'
import {
  browserStore,
  deleteProject,
  listProjects,
  queueOpen,
  type TopologySnapshot,
} from '../workspace/persistence.ts'

function formatSaved(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const store = browserStore()
  const [tick, setTick] = useState(0)
  const projects = useMemo(() => (store ? listProjects(store) : []), [store, tick])

  function refresh() {
    setTick((value) => value + 1)
  }

  function openProject(snapshot: TopologySnapshot) {
    if (!store) return
    queueOpen(store, snapshot)
    void navigate({ to: '/' })
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="projects" />
      <Stack sx={{ px: 2, py: 1.5, gap: 0.5 }}>
        <Typography variant="h2">Projects</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Saved locally in this browser. Open reloads the topology, workload, calibration and
          seed so a run replays exactly. No auth and no share link in this phase.
        </Typography>
      </Stack>
      <Box sx={{ flex: 1, p: 1.5, overflow: 'auto' }}>
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          {projects.map((project) => (
            <Box
              key={project.id}
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 3,
                p: 2,
                display: 'flex',
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{project.name}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                  {project.nodes.filter((node) => node.type !== 'zone').length} services · seed{' '}
                  {project.draft.seed} · {project.draft.mode} · fault {project.fault} ·{' '}
                  {formatSaved(project.savedAt)}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={project.scene}
                sx={{ height: 20, bgcolor: 'primary.light', color: 'primary.dark' }}
              />
              <Button size="small" variant="contained" onClick={() => openProject(project)}>
                Open
              </Button>
              <Button
                size="small"
                onClick={() => {
                  if (!store) return
                  deleteProject(store, project.id)
                  refresh()
                }}
              >
                Delete
              </Button>
            </Box>
          ))}
          {projects.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              No named saves yet. In Workspace, click Save. The current canvas also autosaves and
              survives reload.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}

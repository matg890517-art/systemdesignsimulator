import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { TopNav } from '../../components/TopNav.tsx'
import {
  browserStore,
  deleteProject,
  listProjects,
  parseSnapshot,
  queueOpen,
  serializeSnapshot,
  snapshotFilename,
  type TopologySnapshot,
} from '../workspace/persistence.ts'
import { templateSnapshot, type TemplateId } from '../workspace/templates.ts'

function formatSaved(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

const templates: { id: TemplateId; label: string }[] = [
  { id: 'youtube', label: 'YouTube-style' },
  { id: 'generic', label: 'Generic 9-block' },
  { id: 'aws', label: 'AWS map' },
  { id: 'azure', label: 'Azure map' },
  { id: 'gcp', label: 'GCP map' },
]

export function ProjectsPage() {
  const navigate = useNavigate()
  const store = browserStore()
  const [tick, setTick] = useState(0)
  const [importError, setImportError] = useState<string>()
  const projects = useMemo(() => (store ? listProjects(store) : []), [store, tick])

  function refresh() {
    setTick((value) => value + 1)
  }

  function openProject(snapshot: TopologySnapshot) {
    if (!store) return
    queueOpen(store, snapshot)
    void navigate({ to: '/' })
  }

  function exportProject(snapshot: TopologySnapshot) {
    const blob = new Blob([serializeSnapshot(snapshot)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = snapshotFilename(snapshot)
    link.click()
    URL.revokeObjectURL(url)
  }

  function onImportFile(file: File) {
    void file.text().then((text) => {
      const snapshot = parseSnapshot(text)
      if (!snapshot) {
        setImportError('Not an SDS snapshot (version 1 JSON with nodes, edges, draft, profiles).')
        return
      }
      setImportError(undefined)
      if (!store) return
      queueOpen(store, snapshot)
      void navigate({ to: '/' })
    })
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <TopNav page="projects" />
      <Stack sx={{ px: 2, py: 1.5, gap: 0.5 }}>
        <Typography variant="h2">Projects</Typography>
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          Saved locally in this browser. Export writes a JSON snapshot you can send. Import loads
          that file. No auth and no share URL in this phase.
        </Typography>
      </Stack>
      <Box sx={{ flex: 1, p: 1.5, overflow: 'auto' }}>
        <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {templates.map((item) => (
              <Button key={item.id} size="small" variant="outlined" onClick={() => openProject(templateSnapshot(item.id))}>
                {item.label}
              </Button>
            ))}
            <Button size="small" variant="outlined" component="label">
              Import JSON
              <input
                hidden
                type="file"
                accept="application/json,.json,.sds.json"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) onImportFile(file)
                }}
              />
            </Button>
          </Stack>
          {importError ? (
            <Typography sx={{ fontSize: 12, color: 'error.main' }}>{importError}</Typography>
          ) : null}
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
              <Button size="small" onClick={() => exportProject(project)}>
                Export
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
              No named saves yet. In Workspace, click Save. Templates above open without a save.
              The current canvas also autosaves and survives reload.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Box>
  )
}

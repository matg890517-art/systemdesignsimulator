import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import type { CalibrationProfile } from '@sds/engine'
import type { Edge as RfEdge } from '@xyflow/react'
import { FieldEditor } from '../calibration/FieldEditor.tsx'
import { applyProfileFields } from '../calibration/field-edit.ts'
import { profileForNode, upsertProfile, useLibrary } from '../calibration/library.ts'
import { catalogForNode } from '../catalog/catalog.ts'
import { classesForEdge, REQUEST_CLASSES } from './compile.ts'
import {
  defaultEdgeData,
  hasExplicitClasses,
  readEdgeData,
  relabelClassEdge,
  setEdgeClassActive,
  withActiveClasses,
  type WorkspaceClassId,
  type WorkspaceEdgeData,
} from './edge-data.ts'
import { blankProfileForNode, configProfileForNode } from './node-profile.ts'
import { formatPct } from './simulate.ts'
import type { Bottleneck } from './types.ts'

const CLASS_NAME: Record<WorkspaceClassId, string> = {
  read: 'Read',
  write: 'Write',
  async: 'Async',
  bulk: 'Bulk',
}

function dataForEdit(edge: RfEdge): WorkspaceEdgeData {
  const base = readEdgeData(edge)
  if (hasExplicitClasses(edge)) return base
  return withActiveClasses(base, classesForEdge(edge.id, String(edge.source)) as WorkspaceClassId[])
}

function ConfigPanel({
  nodeId,
  title,
  catalogId,
  onDelete,
}: {
  nodeId?: string
  title?: string
  catalogId?: string
  onDelete?: () => void
}) {
  const library = useLibrary()
  const catalog = nodeId ? catalogForNode(nodeId, catalogId) : undefined
  const [draft, setDraft] = useState<CalibrationProfile | undefined>()

  useEffect(() => {
    if (!nodeId) {
      setDraft(undefined)
      return
    }
    setDraft(configProfileForNode(profileForNode(nodeId), nodeId, title ?? nodeId, catalogId))
  }, [nodeId, title, catalogId, library])

  if (!nodeId || !draft) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Select a service on the canvas to edit servers, service time, queue, and hit rate.
        Empty fields stay unknown and do not cap the engine.
      </Typography>
    )
  }

  const generic = catalogId?.startsWith('generic-')
  return (
    <Stack spacing={1.5}>
      {catalog ? (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{catalog.name}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {catalog.provider.toUpperCase()} · official page{' '}
            {catalog.limitsOnPage === 'yes'
              ? 'lists limits.'
              : catalog.limitsOnPage === 'partial'
                ? 'lists some limits.'
                : 'does not list limits.'}{' '}
            Quotas stay unknown until you type them.
          </Typography>
          <Typography
            component="a"
            href={catalog.docsUrl}
            target="_blank"
            rel="noreferrer"
            sx={{ fontSize: 11, color: 'primary.main', wordBreak: 'break-all' }}
          >
            {catalog.docsUrl}
          </Typography>
        </Box>
      ) : (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          {generic
            ? 'Generic building block. No official limits page. Set capacity below as unknown or estimated.'
            : `${title ?? nodeId} has no catalog page. Set capacity below; unknown does not cap the engine.`}
        </Typography>
      )}
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{draft.name}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{draft.notes}</Typography>
      <TextField
        size="small"
        label="Source URL"
        value={draft.source ?? ''}
        placeholder="none → Estimated"
        onChange={(event) => setDraft({ ...draft, source: event.target.value || undefined })}
      />
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label="Date"
          value={draft.retrievedOn ?? ''}
          placeholder="YYYY-MM-DD"
          onChange={(event) => setDraft({ ...draft, retrievedOn: event.target.value || undefined })}
        />
        <TextField
          size="small"
          label="Region"
          value={draft.region ?? ''}
          onChange={(event) => setDraft({ ...draft, region: event.target.value || undefined })}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label="Tier"
          value={draft.tier ?? ''}
          onChange={(event) => setDraft({ ...draft, tier: event.target.value || undefined })}
        />
        <TextField
          size="small"
          label="Version"
          value={draft.version ?? ''}
          onChange={(event) => setDraft({ ...draft, version: event.target.value || undefined })}
        />
      </Stack>
      {draft.fields.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          No capacity fields on this node. Edit rates on the Workload tab.
        </Typography>
      ) : (
        draft.fields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            sourceId="config"
            onChange={(next) =>
              setDraft({
                ...draft,
                fields: draft.fields.map((item) => (item.id === field.id ? next : item)),
              })
            }
          />
        ))
      )}
      <Button
        variant="contained"
        size="small"
        onClick={() => {
          const next = applyProfileFields(draft, draft.fields, draft.source)
          upsertProfile(next.profile)
          setDraft(next.profile)
        }}
      >
        Apply to library
      </Button>
      <Button
        size="small"
        onClick={() => {
          const blank = blankProfileForNode(nodeId, title ?? nodeId, catalogId)
          setDraft(blank)
          upsertProfile(blank)
        }}
      >
        Reset to default
      </Button>
      {onDelete ? (
        <Button size="small" color="error" variant="outlined" onClick={onDelete}>
          Delete component
        </Button>
      ) : null}
    </Stack>
  )
}

function EdgePanel({
  edge,
  onChange,
  onDelete,
}: {
  edge?: RfEdge
  onChange: (edge: RfEdge) => void
  onDelete?: () => void
}) {
  if (!edge) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Select an edge to edit request classes, payload bytes, routing, call kind, and
        latency. Cross-provider links stay Estimated until measured.
      </Typography>
    )
  }
  const selected = edge
  const data = dataForEdit(selected)
  function patch(next: WorkspaceEdgeData) {
    const previous = String(selected.label ?? '')
    const classLabel = relabelClassEdge(previous, next.classes)
    onChange({
      ...selected,
      data: next,
      label: next.crossProvider
        ? classLabel.includes('cross')
          ? classLabel
          : `${classLabel ? `${classLabel} · ` : ''}cross · Estimated`
        : classLabel,
    })
  }
  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
        {edge.source} → {edge.target}
      </Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Classes on this hop. Off means zero flow here. Workload rps is the global rate, not this
        switch.
      </Typography>
      <Stack spacing={0.25}>
        {REQUEST_CLASSES.map((id) => {
          const row = data.classes[id] ?? { ...defaultEdgeData().classes[id]! }
          return (
            <FormControlLabel
              key={id}
              sx={{ ml: 0, mr: 0, width: '100%', justifyContent: 'space-between' }}
              labelPlacement="start"
              control={
                <Switch
                  size="small"
                  checked={row.active}
                  onChange={(_, checked) => patch(setEdgeClassActive(data, id, checked))}
                  slotProps={{ input: { 'aria-label': `${CLASS_NAME[id]} on this edge` } }}
                />
              }
              label={
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{CLASS_NAME[id]}</Typography>
              }
            />
          )
        })}
      </Stack>
      {onDelete ? (
        <Button size="small" color="error" variant="outlined" onClick={onDelete}>
          Delete connection
        </Button>
      ) : null}
      {data.crossProvider ? (
        <Typography sx={{ fontSize: 11, color: 'warning.dark' }}>
          Leaves a provider. Latency and capacity stay Estimated until measured (F29).
        </Typography>
      ) : null}
      <TextField
        select
        size="small"
        label="Routing"
        value={data.routing.mode}
        onChange={(event) => {
          const mode = event.target.value
          patch({
            ...data,
            routing:
              mode === 'weighted'
                ? { mode: 'weighted', weight: 1 }
                : mode === 'broadcast'
                  ? { mode: 'broadcast' }
                  : { mode: 'single' },
          })
        }}
      >
        <MenuItem value="single">Single</MenuItem>
        <MenuItem value="weighted">Weighted</MenuItem>
        <MenuItem value="broadcast">Broadcast</MenuItem>
      </TextField>
      {data.routing.mode === 'weighted' ? (
        <TextField
          size="small"
          type="number"
          label="Weight"
          value={data.routing.weight}
          onChange={(event) =>
            patch({ ...data, routing: { mode: 'weighted', weight: Number(event.target.value) || 0 } })
          }
        />
      ) : null}
      <TextField
        select
        size="small"
        label="Call"
        value={data.call.kind}
        onChange={(event) =>
          patch({ ...data, call: { kind: event.target.value as 'sync' | 'async' } })
        }
      >
        <MenuItem value="sync">Sync</MenuItem>
        <MenuItem value="async">Async</MenuItem>
      </TextField>
      <TextField
        size="small"
        type="number"
        label="Fan-out"
        value={data.fanOut}
        onChange={(event) => patch({ ...data, fanOut: Math.max(1, Number(event.target.value) || 1) })}
      />
      <TextField
        size="small"
        type="number"
        label="Latency (ms)"
        value={data.network.latencyMs}
        onChange={(event) =>
          patch({ ...data, network: { ...data.network, latencyMs: Number(event.target.value) || 0 } })
        }
      />
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Payload bytes per class. Bandwidth empty = unknown, does not cap.
      </Typography>
      {REQUEST_CLASSES.map((id) => {
        const row = data.classes[id] ?? { ...defaultEdgeData().classes[id]! }
        return (
          <Box key={id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{CLASS_NAME[id]}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <TextField
                size="small"
                type="number"
                label="req B"
                value={row.requestBytes}
                onChange={(event) =>
                  patch({
                    ...data,
                    classes: {
                      ...data.classes,
                      [id]: { ...row, requestBytes: Number(event.target.value) || 0 },
                    },
                  })
                }
              />
              <TextField
                size="small"
                type="number"
                label="resp B"
                value={row.responseBytes}
                onChange={(event) =>
                  patch({
                    ...data,
                    classes: {
                      ...data.classes,
                      [id]: { ...row, responseBytes: Number(event.target.value) || 0 },
                    },
                  })
                }
              />
            </Stack>
          </Box>
        )
      })}
    </Stack>
  )
}

export function Inspector({
  bottlenecks,
  selected,
  selectedEdge,
  onEdgeChange,
  onDeleteNode,
  onDeleteEdge,
  affectedIds = [],
  blastOriginId,
  breakerOpenEdges = [],
}: {
  bottlenecks: Bottleneck[]
  selected?: { id: string; title: string; catalogId?: string }
  selectedEdge?: RfEdge
  onEdgeChange: (edge: RfEdge) => void
  onDeleteNode?: () => void
  onDeleteEdge?: () => void
  affectedIds?: string[]
  blastOriginId?: string
  breakerOpenEdges?: string[]
}) {
  const [tab, setTab] = useState(0)
  useEffect(() => {
    if (selectedEdge) setTab(1)
    else if (selected) setTab(0)
  }, [selectedEdge, selected])
  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        overflow: 'auto',
      }}
    >
      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab label="Config" />
        <Tab label="Edge" />
        <Tab label={`Bottlenecks ${bottlenecks.length}`} />
        <Tab label={`Blast ${affectedIds.length}`} />
      </Tabs>
      {tab === 0 && (
        <ConfigPanel
          nodeId={selected?.id}
          title={selected?.title}
          catalogId={selected?.catalogId}
          onDelete={selected ? onDeleteNode : undefined}
        />
      )}
      {tab === 1 && (
        <EdgePanel edge={selectedEdge} onChange={onEdgeChange} onDelete={selectedEdge ? onDeleteEdge : undefined} />
      )}
      {tab === 2 && (
        <>
          {selected ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Selected: {selected.title}
            </Typography>
          ) : null}
          {bottlenecks.map((item) => (
            <Box
              key={item.id}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: item.fromEngine ? 'error.light' : 'warning.light',
                border: '1px solid',
                borderColor: item.fromEngine ? 'error.main' : 'warning.main',
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: item.fromEngine ? 'error.main' : 'warning.dark',
                }}
              >
                {item.title} {formatPct(item.util)}
              </Typography>
              <Typography sx={{ fontSize: 12, mt: 0.5 }}>{item.summary}</Typography>
              <Typography sx={{ fontSize: 12, mt: 0.75, color: 'primary.main', fontWeight: 600 }}>
                {item.fromEngine ? 'From engine · ' : 'Estimated · '}
                {item.suggestion}
              </Typography>
              {item.cause ? (
                <Typography sx={{ fontSize: 11, mt: 0.5 }}>{item.cause}</Typography>
              ) : null}
              {item.wait ? (
                <Typography sx={{ fontSize: 11, mt: 0.5, fontFamily: '"IBM Plex Mono", monospace' }}>
                  {item.wait}
                </Typography>
              ) : null}
              {item.citation ? (
                <Typography sx={{ fontSize: 11, mt: 0.5, color: 'text.secondary' }}>
                  {item.citation}
                </Typography>
              ) : null}
            </Box>
          ))}
        </>
      )}
      {tab === 3 && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Downstream of a crash, from the engine graph. Unknown capacity still does not cap.
          </Typography>
          {blastOriginId ? (
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Origin {blastOriginId}</Typography>
          ) : (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Run with AKS crash (Faults tab) to fill this view.
            </Typography>
          )}
          {breakerOpenEdges.length > 0 ? (
            <Typography sx={{ fontSize: 12 }}>
              Upstream breaker open on {breakerOpenEdges.join(', ')}.
            </Typography>
          ) : null}
          {affectedIds.map((id) => (
            <Box
              key={id}
              sx={{
                p: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: id === blastOriginId ? 'error.main' : 'divider',
                bgcolor: id === blastOriginId ? 'error.light' : 'background.default',
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 600 }}>
                {id === blastOriginId ? `${id} · crashed` : id}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  )
}

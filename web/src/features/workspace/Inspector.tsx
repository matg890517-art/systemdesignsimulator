import { useEffect, useRef, useState } from 'react'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import {
  Box,
  Button,
  ButtonBase,
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
  applyHopNoteLabel,
  defaultEdgeData,
  hasExplicitClasses,
  readEdgeData,
  relabelClassEdge,
  setEdgeClassActive,
  withActiveClasses,
  type WorkspaceClassId,
  type WorkspaceEdgeData,
} from './edge-data.ts'
import {
  ENV_MIN_HEIGHT,
  ENV_MIN_WIDTH,
  environmentLabel,
} from './environment.ts'
import { configProfileForNode, exampleProfileForNode } from './node-profile.ts'
import type { FieldFocusRequest } from './bottleneck-focus.ts'
import {
  inspectorFocusLabel,
  inspectorPane,
  type InspectorRunTab,
} from './inspector-pane.ts'
import type { NoticeSeverity } from './notices.ts'
import { formatPct } from './simulate.ts'
import type { Bottleneck, CanvasSelection, ProviderId } from './types.ts'

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
  fieldFocus,
  onTitleChange,
  onDelete,
  onRelease,
  onNotice,
}: {
  nodeId?: string
  title?: string
  catalogId?: string
  fieldFocus?: FieldFocusRequest
  onTitleChange?: (title: string) => void
  onDelete?: () => void
  onRelease?: () => void
  onNotice?: (message: string, severity: NoticeSeverity) => void
}) {
  const library = useLibrary()
  const catalog = nodeId ? catalogForNode(nodeId, catalogId) : undefined
  const [draft, setDraft] = useState<CalibrationProfile | undefined>()
  // Uncommitted edits live here between keystrokes and the blur/Enter that applies them.
  const pending = useRef<{ nodeId?: string; draft?: CalibrationProfile; dirty: boolean }>({ dirty: false })
  const fieldInputs = useRef<Partial<Record<string, HTMLInputElement | null>>>({})

  useEffect(() => {
    if (!nodeId) {
      pending.current = { dirty: false }
      setDraft(undefined)
      return
    }
    // Keep typing-in-progress when the library changes under the same node.
    if (pending.current.dirty && pending.current.nodeId === nodeId) return
    const next = configProfileForNode(profileForNode(nodeId), nodeId, title ?? nodeId, catalogId)
    pending.current = { nodeId, draft: next, dirty: false }
    setDraft(next)
  }, [nodeId, title, catalogId, library])

  useEffect(() => {
    if (!fieldFocus || fieldFocus.nodeId !== nodeId) return
    const input = fieldInputs.current[fieldFocus.role]
    if (!input) return
    input.focus()
    input.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [fieldFocus, nodeId, draft?.id])

  function stage(next: CalibrationProfile) {
    pending.current = { nodeId, draft: next, dirty: true }
    setDraft(next)
  }

  /** Auto-apply: evidence from the source URL, P95 ≥ median, then the library. */
  function commit(next: CalibrationProfile | undefined = pending.current.draft) {
    if (!next || !pending.current.dirty) return
    const applied = applyProfileFields(next, next.fields, next.source)
    pending.current = { nodeId, draft: applied.profile, dirty: false }
    upsertProfile(applied.profile)
    setDraft(applied.profile)
    if (applied.error) onNotice?.(applied.error, 'warning')
  }

  if (!nodeId || !draft) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Select a service or environment box. Cards start with Estimated n and S. Cost stays unknown.
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
            Catalog quotas are not copied. Example Estimated n and S are a starting model.
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
            ? 'Generic building block. No official limits page. n and S below are Estimated examples. Cost stays unknown.'
            : `${title ?? nodeId} has no catalog page. n and S below are Estimated examples. Cost stays unknown.`}
        </Typography>
      )}
      <TextField
        size="small"
        label="Title"
        value={title ?? ''}
        onChange={(event) => onTitleChange?.(event.target.value)}
        helperText="Shown on the card. Catalog kind does not change."
      />
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{draft.notes}</Typography>
      <TextField
        size="small"
        label="Source URL"
        value={draft.source ?? ''}
        placeholder="none → Estimated"
        onChange={(event) => stage({ ...draft, source: event.target.value || undefined })}
        onBlur={() => commit()}
        helperText={
          draft.source
            ? 'Set fields become Vendor figure (source not checked).'
            : 'A link marks set fields as Vendor figure. None keeps Estimated.'
        }
      />
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label="Date"
          value={draft.retrievedOn ?? ''}
          placeholder="YYYY-MM-DD"
          onChange={(event) => stage({ ...draft, retrievedOn: event.target.value || undefined })}
          onBlur={() => commit()}
        />
        <TextField
          size="small"
          label="Region"
          value={draft.region ?? ''}
          onChange={(event) => stage({ ...draft, region: event.target.value || undefined })}
          onBlur={() => commit()}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          label="Tier"
          value={draft.tier ?? ''}
          onChange={(event) => stage({ ...draft, tier: event.target.value || undefined })}
          onBlur={() => commit()}
        />
        <TextField
          size="small"
          label="Version"
          value={draft.version ?? ''}
          onChange={(event) => stage({ ...draft, version: event.target.value || undefined })}
          onBlur={() => commit()}
        />
      </Stack>
      {draft.fields.length === 0 ? (
        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
          No capacity fields on this node. Edit rates in Workload.
        </Typography>
      ) : (
        draft.fields.map((field) => (
          <FieldEditor
            key={field.id}
            field={field}
            sourceId="config"
            inputRef={(element) => {
              fieldInputs.current[field.role] = element
            }}
            onChange={(next, commitNow) => {
              const staged = {
                ...draft,
                fields: draft.fields.map((item) => (item.id === field.id ? next : item)),
              }
              stage(staged)
              if (commitNow) commit(staged)
            }}
            onCommit={() => commit()}
          />
        ))
      )}
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Edits apply to the calibration library when you leave a field or press Enter. The next
        Run uses them.
      </Typography>
      <Button
        size="small"
        onClick={() => {
          const next = exampleProfileForNode(nodeId, title ?? nodeId, catalogId)
          pending.current = { nodeId, draft: next, dirty: false }
          setDraft(next)
          upsertProfile(next)
          onNotice?.(`${title ?? nodeId} reset to Estimated example n and S. Cost stays unknown.`, 'info')
        }}
      >
        Reset to default
      </Button>
      {onRelease ? (
        <Button size="small" variant="outlined" onClick={onRelease}>
          Remove from environment
        </Button>
      ) : null}
      {onDelete ? (
        <Button size="small" color="error" variant="outlined" onClick={onDelete}>
          Delete component
        </Button>
      ) : null}
    </Stack>
  )
}

function TabLabel({ label, count }: { label: string; count?: number }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Box component="span">{label}</Box>
      {count ? (
        <Box
          component="span"
          sx={{
            minWidth: 16,
            height: 16,
            px: 0.5,
            borderRadius: 8,
            bgcolor: 'action.hover',
            fontSize: 10,
            fontWeight: 600,
            lineHeight: '16px',
            textAlign: 'center',
          }}
        >
          {count}
        </Box>
      ) : null}
    </Stack>
  )
}

const CLOUD_PROVIDERS: ProviderId[] = ['aws', 'azure', 'gcp', 'kubernetes']

function EnvironmentPanel({
  selected,
  width,
  height,
  onChange,
  onDelete,
}: {
  selected: CanvasSelection
  width: number
  height: number
  onChange: (next: { data?: { label?: string; provider?: ProviderId }; width?: number; height?: number }) => void
  onDelete?: () => void
}) {
  return (
    <Stack spacing={1.5}>
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selected.title}</Typography>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Provider container. Drop a service on the box to contain it. Drag the service out, or use
        Remove from environment, to disconnect. The box stays behind cards. Not an engine node.
      </Typography>
      <TextField
        size="small"
        label="Name"
        value={selected.title}
        onChange={(event) => onChange({ data: { label: event.target.value } })}
      />
      <TextField
        select
        size="small"
        label="Provider color"
        value={selected.provider ?? 'generic'}
        onChange={(event) => {
          const provider = event.target.value as ProviderId
          const keepCustom = selected.title !== environmentLabel(selected.provider ?? 'generic')
          onChange({
            data: {
              provider,
              label: keepCustom ? selected.title : environmentLabel(provider),
            },
          })
        }}
      >
        {(selected.provider === 'generic'
          ? (['generic', ...CLOUD_PROVIDERS] as ProviderId[])
          : CLOUD_PROVIDERS
        ).map((id) => (
          <MenuItem key={id} value={id}>
            {environmentLabel(id)}
          </MenuItem>
        ))}
      </TextField>
      <Stack direction="row" spacing={1}>
        <TextField
          size="small"
          type="number"
          label="Width"
          value={Math.round(width)}
          onChange={(event) =>
            onChange({ width: Math.max(ENV_MIN_WIDTH, Number(event.target.value) || ENV_MIN_WIDTH) })
          }
        />
        <TextField
          size="small"
          type="number"
          label="Height"
          value={Math.round(height)}
          onChange={(event) =>
            onChange({ height: Math.max(ENV_MIN_HEIGHT, Number(event.target.value) || ENV_MIN_HEIGHT) })
          }
        />
      </Stack>
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Or drag a corner on the canvas. Deleting the box ungroups; services stay.
      </Typography>
      {onDelete ? (
        <Button size="small" color="error" variant="outlined" onClick={onDelete}>
          Remove environment
        </Button>
      ) : null}
    </Stack>
  )
}

function EdgePanel({
  edge,
  onChange,
  onDelete,
  loadBalancerSource,
  backendCount = 0,
}: {
  edge?: RfEdge
  onChange: (edge: RfEdge) => void
  onDelete?: () => void
  loadBalancerSource?: boolean
  backendCount?: number
}) {
  if (!edge) {
    return (
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
        Click a connection to set classes, routing, and latency.
      </Typography>
    )
  }
  const selected = edge
  const data = dataForEdit(selected)
  function patch(next: WorkspaceEdgeData) {
    const previous = String(selected.label ?? '')
    const classLabel = relabelClassEdge(
      applyHopNoteLabel(previous, next.note === 'miss'),
      next.classes,
    )
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
      <FormControlLabel
        sx={{ ml: 0, mr: 0, width: '100%', justifyContent: 'space-between' }}
        labelPlacement="start"
        control={
          <Switch
            size="small"
            checked={data.note === 'miss'}
            onChange={(_, checked) => patch({ ...data, note: checked ? 'miss' : undefined })}
            slotProps={{ input: { 'aria-label': 'Cache miss hop' } }}
          />
        }
        label={<Typography sx={{ fontSize: 12, fontWeight: 600 }}>Cache miss hop</Typography>}
      />
      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
        Label only: this hop is origin fill after a cache/CDN miss. The miss fraction is 1 − hit
        rate on that card (Config). Same on a blank canvas as on Generic / AWS / Azure / GCP /
        YouTube.
      </Typography>
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
      {loadBalancerSource ? (
        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
          {backendCount > 1
            ? 'This load balancer splits the class across its hops by weight. Equal weights share equally. Broadcast copies instead of splitting.'
            : 'A second hop from this load balancer splits the class by weight, like backends behind an LB.'}
        </Typography>
      ) : null}
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
        if (!row.active) return null
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
  selectedSize,
  selectedEdge,
  onEdgeChange,
  onZoneChange,
  onServiceTitleChange,
  onReleaseFromZone,
  onDeleteNode,
  onDeleteEdge,
  affectedIds = [],
  blastOriginId,
  breakerOpenEdges = [],
  nodeIds = [],
  fieldFocus,
  onFocusBottleneck,
  onNotice,
  loadBalancerSource,
  lbBackendCount = 0,
}: {
  bottlenecks: Bottleneck[]
  selected?: CanvasSelection
  selectedSize?: { width: number; height: number }
  selectedEdge?: RfEdge
  onEdgeChange: (edge: RfEdge) => void
  onZoneChange?: (
    id: string,
    next: { data?: { label?: string; provider?: ProviderId }; width?: number; height?: number },
  ) => void
  onServiceTitleChange?: (id: string, title: string) => void
  onReleaseFromZone?: () => void
  onDeleteNode?: () => void
  onDeleteEdge?: () => void
  affectedIds?: string[]
  blastOriginId?: string
  breakerOpenEdges?: string[]
  /** Service ids on the canvas. A bottleneck row for one of them opens in Config. */
  nodeIds?: string[]
  fieldFocus?: FieldFocusRequest
  onFocusBottleneck?: (id: string) => void
  onNotice?: (message: string, severity: NoticeSeverity) => void
  loadBalancerSource?: boolean
  lbBackendCount?: number
}) {
  const [runTab, setRunTab] = useState<InspectorRunTab>('focus')
  const hasSelectedEdge = Boolean(selectedEdge)
  const pane = inspectorPane(runTab, hasSelectedEdge)
  useEffect(() => {
    setRunTab('focus')
  }, [selected?.id, selectedEdge?.id])
  // A bottleneck row jumps to Config even when its node was already selected.
  useEffect(() => {
    if (fieldFocus) setRunTab('focus')
  }, [fieldFocus])
  return (
    <Box
      sx={{
        width: 292,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        pt: 1,
        px: 1.5,
        pb: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <Tabs
        value={runTab}
        onChange={(_, value: InspectorRunTab) => setRunTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flexShrink: 0, minHeight: 36 }}
      >
        <Tab value="focus" label={inspectorFocusLabel(hasSelectedEdge)} />
        <Tab value="bottlenecks" label={<TabLabel label="Bottlenecks" count={bottlenecks.length} />} />
        <Tab value="blast" label={<TabLabel label="Blast" count={affectedIds.length} />} />
      </Tabs>
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {pane === 'config' &&
        (selected?.kind === 'zone' ? (
          <EnvironmentPanel
            selected={selected}
            width={selectedSize?.width ?? ENV_MIN_WIDTH}
            height={selectedSize?.height ?? ENV_MIN_HEIGHT}
            onChange={(next) => onZoneChange?.(selected.id, next)}
            onDelete={onDeleteNode}
          />
        ) : (
          <ConfigPanel
            nodeId={selected?.id}
            title={selected?.title}
            catalogId={selected?.catalogId}
            fieldFocus={fieldFocus}
            onTitleChange={
              selected ? (next) => onServiceTitleChange?.(selected.id, next) : undefined
            }
            onDelete={selected ? onDeleteNode : undefined}
            onRelease={selected?.parentId ? onReleaseFromZone : undefined}
            onNotice={onNotice}
          />
        ))}
      {pane === 'edge' && (
        <EdgePanel
          edge={selectedEdge}
          onChange={onEdgeChange}
          onDelete={selectedEdge ? onDeleteEdge : undefined}
          loadBalancerSource={loadBalancerSource}
          backendCount={lbBackendCount}
        />
      )}
      {pane === 'bottlenecks' && (
        <>
          {selected ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Selected: {selected.title}
            </Typography>
          ) : null}
          {bottlenecks.length === 0 ? (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              No component at or above 85% in the last run. Run again after a change to re-rank.
            </Typography>
          ) : null}
          {bottlenecks.map((item) => {
            const openable = Boolean(onFocusBottleneck) && nodeIds.includes(item.id)
            const body = (
              <>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 600,
                      flex: 1,
                      minWidth: 0,
                      color: item.fromEngine ? 'error.main' : 'warning.dark',
                    }}
                  >
                    {item.title} {formatPct(item.util)}
                  </Typography>
                  {openable ? (
                    <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  ) : null}
                </Stack>
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
                {openable ? (
                  <Typography sx={{ fontSize: 11, mt: 0.75, color: 'text.secondary' }}>
                    Open in Config to change capacity.
                  </Typography>
                ) : null}
              </>
            )
            const cardSx = {
              p: 1,
              borderRadius: 2,
              textAlign: 'left' as const,
              display: 'block',
              width: '100%',
              bgcolor: item.fromEngine ? 'error.light' : 'warning.light',
              border: '1px solid',
              borderColor: item.fromEngine ? 'error.main' : 'warning.main',
            }
            if (!openable) {
              return (
                <Box key={item.id} sx={cardSx}>
                  {body}
                </Box>
              )
            }
            return (
              <ButtonBase
                key={item.id}
                onClick={() => onFocusBottleneck?.(item.id)}
                aria-label={`Open ${item.title} in Config`}
                sx={{
                  ...cardSx,
                  fontFamily: 'inherit',
                  '&:hover': { borderColor: 'primary.main' },
                  '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main' },
                }}
              >
                {body}
              </ButtonBase>
            )
          })}
        </>
      )}
      {pane === 'blast' && (
        <Stack spacing={1}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Downstream of a crash, from the engine graph. Unknown capacity still does not cap.
          </Typography>
          {blastOriginId ? (
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Origin {blastOriginId}</Typography>
          ) : (
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Run with AKS crash (Faults) to fill this view.
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
    </Box>
  )
}

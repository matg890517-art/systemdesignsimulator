import { useEffect, useState } from 'react'
import { Box, Button, Stack, Tab, Tabs, Typography } from '@mui/material'
import type { CalibrationProfile } from '@sds/engine'
import { FieldEditor } from '../calibration/FieldEditor.tsx'
import { profileForNode, upsertProfile, useLibrary } from '../calibration/library.ts'
import { catalogForNode } from '../catalog/catalog.ts'
import { configProfileForNode } from './node-profile.ts'
import { formatPct } from './simulate.ts'
import type { Bottleneck } from './types.ts'

function ConfigPanel({
  nodeId,
  title,
  catalogId,
}: {
  nodeId?: string
  title?: string
  catalogId?: string
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
      <Button variant="contained" size="small" onClick={() => upsertProfile(draft)}>
        Apply to library
      </Button>
    </Stack>
  )
}

export function Inspector({
  bottlenecks,
  selected,
}: {
  bottlenecks: Bottleneck[]
  selected?: { id: string; title: string; catalogId?: string }
}) {
  const [tab, setTab] = useState(0)
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
        <Tab label={`Bottlenecks ${bottlenecks.length}`} />
      </Tabs>
      {tab === 0 && (
        <ConfigPanel
          nodeId={selected?.id}
          title={selected?.title}
          catalogId={selected?.catalogId}
        />
      )}
      {tab === 1 && (
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
            </Box>
          ))}
        </>
      )}
    </Box>
  )
}

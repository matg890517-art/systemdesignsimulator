import { youtubeSeedProfiles } from '../calibration/library.ts'
import { defaultWorkloadDraft } from './compile.ts'
import { initialEdges, initialNodes } from './graph.ts'
import { snapshotFrom, type TopologySnapshot } from './persistence.ts'
import {
  referenceStackGraph,
  referenceStackProfiles,
  referenceWorkloadDraft,
} from './reference-graph.ts'
import type { MappedProvider } from '../catalog/provider-maps.ts'

export type TemplateId = 'youtube' | MappedProvider

export function youtubeTemplate(): TopologySnapshot {
  return snapshotFrom({
    id: 'tmpl-youtube',
    name: 'Example: Video streaming platform (YouTube-style)',
    scene: 'youtube',
    nodes: initialNodes,
    edges: initialEdges,
    draft: defaultWorkloadDraft(),
    profiles: structuredClone(youtubeSeedProfiles),
    fault: 'none',
  })
}

export function referenceTemplate(provider: MappedProvider = 'generic'): TopologySnapshot {
  const graph = referenceStackGraph(provider)
  const label =
    provider === 'generic' ? 'Generic' : provider === 'aws' ? 'AWS' : provider === 'gcp' ? 'GCP' : 'Azure'
  return snapshotFrom({
    id: `tmpl-${provider}`,
    name: `${label} reference stack`,
    scene: 'reference',
    nodes: graph.nodes,
    edges: graph.edges,
    draft: referenceWorkloadDraft(),
    profiles: structuredClone(referenceStackProfiles),
    fault: 'none',
  })
}

export function templateSnapshot(id: TemplateId): TopologySnapshot {
  if (id === 'youtube') return youtubeTemplate()
  return referenceTemplate(id)
}

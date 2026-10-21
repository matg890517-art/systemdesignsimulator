import {
  firstSaturatingComponentId,
  rankByUtilization,
  runFluid,
  scoreFidelity,
  type FidelityReport,
  type RecordedLoadTest,
} from '@sds/engine'
import { compileCanvas } from '../workspace/compile.ts'
import { referenceStackGraph, referenceStackProfiles, referenceWorkloadDraft } from '../workspace/reference-graph.ts'

export function scoreReferenceFidelity(recorded: RecordedLoadTest): FidelityReport {
  const graph = referenceStackGraph()
  const { topology, workload } = compileCanvas(
    graph.nodes,
    graph.edges,
    { ...referenceWorkloadDraft(), durationSec: 8 },
    referenceStackProfiles,
    'none',
  )
  const last = runFluid(topology, workload).steps.at(-1)
  const ranking = last ? rankByUtilization(topology, last) : []
  return scoreFidelity({
    recorded,
    predictedFirst: firstSaturatingComponentId(ranking),
    predictedRanking: ranking.map((row) => row.id),
    profiles: referenceStackProfiles,
  })
}

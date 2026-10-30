import type { WorkspaceRun } from '../workspace/types.ts'

const TRANSCODER_IDS = ['transcoder', 't240', 't720', 't1080', 't4k'] as const

export const AKS_HEADROOM_CHALLENGE = {
  id: 'aks-headroom',
  title: 'Transcoder headroom',
  goal: 'Run the YouTube example so Transcoder util stays under 85%. Raise Estimated n if it does not.',
  rules: [
    'Load the YouTube example. Cards already have Estimated n and S so the engine can cap util.',
    'Do not copy n from a catalog quota. That ceiling is not Transcoder API capacity.',
    'Pass is engine util on a capped Transcoder, not a Measured lab result.',
  ],
} as const

export function scoreAksHeadroom(run: WorkspaceRun | undefined): {
  status: 'pass' | 'fail' | 'blocked'
  detail: string
} {
  if (!run) {
    return { status: 'blocked', detail: 'Run the YouTube-style canvas first.' }
  }
  const workers = TRANSCODER_IDS.map((id) => run.nodeStats[id]).filter(Boolean)
  if (workers.length === 0) {
    return {
      status: 'blocked',
      detail: 'No Transcoder API worker on this canvas. Load the YouTube example.',
    }
  }
  const capped = workers.filter((row) => row.capped)
  if (capped.length === 0) {
    return {
      status: 'blocked',
      detail: 'Transcoder servers are unknown. Type n in Config. Unknown does not cap the engine.',
    }
  }
  const hottest = capped.reduce((best, row) => (row.util > best.util ? row : best))
  const pct = `${Math.round(hottest.util * 100)}%`
  if (hottest.util < 0.85) {
    return {
      status: 'pass',
      detail: `Transcoder util ${pct} with n = ${hottest.servers ?? 'typed'}. Estimated · not Measured.`,
    }
  }
  return {
    status: 'fail',
    detail: `Transcoder util ${pct} ≥ 85%. Raise Estimated servers or lower bulk load, then Run again.`,
  }
}

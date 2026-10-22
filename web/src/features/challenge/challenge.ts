import type { WorkspaceRun } from '../workspace/types.ts'

export const AKS_HEADROOM_CHALLENGE = {
  id: 'aks-headroom',
  title: 'AKS headroom',
  goal: 'Run the YouTube-style stack so AKS util is under 85%.',
  rules: [
    'Type an Estimated slot count. Empty stays unknown and does not cap.',
    'Do not fill n from the ECS 5,000-task quota. That ceiling is not AKS capacity.',
    'Pass is engine util on AKS, not a Measured lab result.',
  ],
} as const

export function scoreAksHeadroom(run: WorkspaceRun | undefined): {
  status: 'pass' | 'fail' | 'blocked'
  detail: string
} {
  if (!run) {
    return { status: 'blocked', detail: 'Run the YouTube-style canvas first.' }
  }
  const aks = run.nodeStats.aks
  if (!aks) {
    return { status: 'blocked', detail: 'AKS is not on this canvas. Load the YouTube-style template.' }
  }
  if (!aks.capped) {
    return {
      status: 'blocked',
      detail: 'AKS servers are unknown. Type slots in Config. Unknown does not cap the engine.',
    }
  }
  const pct = `${Math.round(aks.util * 100)}%`
  if (aks.util < 0.85) {
    return {
      status: 'pass',
      detail: `AKS util ${pct} with n = ${aks.servers ?? 'typed'}. Estimated · not Measured.`,
    }
  }
  return {
    status: 'fail',
    detail: `AKS util ${pct} ≥ 85%. Raise Estimated slots or lower bulk load, then Run again.`,
  }
}

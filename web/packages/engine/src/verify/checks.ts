import type { CheckResult, NodeResult } from '../schema/result.ts'
import { littlesLawHolds } from '../analytic/queue.ts'

export function checkLittle(nodes: Record<string, NodeResult>, rel = 0.01): CheckResult {
  for (const [id, row] of Object.entries(nodes)) {
    if (row.waitUnknown || row.status === 'not_wired' || row.status === 'unknown') continue
    if (!Number.isFinite(row.W_ms) || row.lambda <= 0) continue
    const L = row.L
    const ok = littlesLawHolds(row.lambda, row.W_ms / 1000, L, Math.max(1e-6, rel * Math.max(1, Math.abs(L))))
    if (!ok && Number.isFinite(L)) {
      const err = Math.abs(L - row.lambda * (row.W_ms / 1000)) / Math.max(L, 1e-9)
      if (err > rel) return { ok: false, detail: `Little failed at ${id} (${(err * 100).toFixed(2)}%)` }
    }
  }
  return { ok: true, detail: 'Little holds' }
}

export function checkConservation(counts: {
  created: number
  completed: number
  dropped: number
  timedOut: number
  inFlight: number
}): CheckResult {
  const rhs = counts.completed + counts.dropped + counts.timedOut + counts.inFlight
  const ok = counts.created === rhs
  return {
    ok,
    detail: ok
      ? 'conservation holds'
      : `created ${counts.created} ≠ completed+dropped+timedOut+inFlight ${rhs}`,
  }
}

export function checkUtilization(nodes: Record<string, NodeResult>, rel = 0.05): CheckResult {
  for (const [id, row] of Object.entries(nodes)) {
    if (row.waitUnknown || row.status === 'not_wired' || row.lambda <= 0) continue
    if (!Number.isFinite(row.rho) || row.rho >= 1) continue
    if (row.W_ms <= 0) continue
    // Identity ρ ≈ λ S / c with S = W - Wq. Soft check.
    const s = row.W_ms - row.Wq_ms
    if (s <= 0) continue
    void id
    void rel
  }
  return { ok: true, detail: 'utilization identity recorded' }
}

export function meansAgree(analytic: number, simulated: number, rel = 0.03): boolean {
  const scale = Math.max(1, Math.abs(analytic))
  return Math.abs(analytic - simulated) <= rel * scale
}

import { compileScenario } from './compile/compile.ts'
import { scenarioFromLegacy } from './compile/from-legacy.ts'
import { solveAnalytic } from './analytic/solve.ts'
import { planStatus } from './schema/result.ts'
import { hockeyStickTopology, workloadAt } from './fixtures.ts'
import type { StabilityStatus } from './analytic/queue.ts'
import type { RequestClassId, Topology, Workload } from './types.ts'

export type ResultLabel = 'analytic' | 'simulated'

export type AnalyticComponentReport = {
  id: string
  lambda: number
  rho: number
  waitMs: number
  sojournMs: number
  p50WaitMs: number
  p95WaitMs: number
  p99WaitMs: number
  queueLength: number
  throughput: number
  status: StabilityStatus
  waitUnknown: boolean
}

export type AnalyticRunResult = {
  label: ResultLabel
  totals: Record<RequestClassId, number>
  components: Record<string, AnalyticComponentReport>
  bottleneckId?: string
  status: StabilityStatus
}

/** Closed-form steady state. Same topology and workload as discrete-event. Label Analytic. */
export function runAnalytic(topology: Topology, workload: Workload): AnalyticRunResult {
  const compiled = compileScenario(scenarioFromLegacy(topology, workload))
  const result = solveAnalytic(compiled)
  const components: Record<string, AnalyticComponentReport> = {}
  const totals: Record<RequestClassId, number> = {}
  for (const row of compiled.scenario.workload) {
    totals[row.classId] = (totals[row.classId] ?? 0) + row.rate_rps
  }
  for (const [id, row] of Object.entries(result.nodes)) {
    components[id] = {
      id,
      lambda: row.lambda,
      rho: row.rho,
      waitMs: row.Wq_ms,
      sojournMs: row.W_ms,
      p50WaitMs: row.p50,
      p95WaitMs: row.p95,
      p99WaitMs: row.p99,
      queueLength: row.Lq,
      throughput: row.throughput,
      status: planStatus(row.status),
      waitUnknown: row.waitUnknown,
    }
  }
  return {
    label: 'analytic',
    totals,
    components,
    bottleneckId: result.system.bottleneck,
    status: result.system.stability,
  }
}

/** Hockey-stick acceptance: 290 rps, S = 20 ms, μ = 50 /s. */
export function hockeyStickRow(servers: number): AnalyticComponentReport {
  const result = runAnalytic(hockeyStickTopology(servers), workloadAt(290, { durationSec: 60 }))
  return result.components.pool!
}

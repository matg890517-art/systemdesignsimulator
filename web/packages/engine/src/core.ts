import { compileScenario } from './compile/compile.ts'
import { scenarioFromLegacy } from './compile/from-legacy.ts'
import { runAnalyticScenario, solveAnalytic } from './analytic/solve.ts'
import { simulateOnce } from './des/simulate.ts'
import type { Scenario } from './schema/scenario.ts'
import type { EngineMode, EngineResult } from './schema/result.ts'
import type { Topology, Workload } from './types.ts'
import { DEFAULT_REPLICATIONS, T_95_19 } from './schema/version.ts'

export function runEngine(scenario: Scenario, mode: EngineMode = 'analytic'): EngineResult {
  if (mode === 'analytic') return runAnalyticScenario(scenario)
  const compiled = compileScenario(scenario)
  const reps = Math.max(1, scenario.run.replications)
  if (reps === 1) return simulateOnce(compiled, scenario.seed)
  const runs = []
  for (let r = 0; r < Math.min(reps, DEFAULT_REPLICATIONS); r++) {
    runs.push(simulateOnce(compiled, scenario.seed + r * 0x9e3779b9))
  }
  const first = runs[0]!
  const keys = Object.keys(first.nodes)
  const ci95: Record<string, { mean: number; half: number }> = {}
  for (const id of keys) {
    const xs = runs.map((run) => run.nodes[id]?.W_ms ?? 0).filter((x) => Number.isFinite(x))
    const mean = xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length)
    const varSum = xs.reduce((s, x) => s + (x - mean) * (x - mean), 0) / Math.max(1, xs.length - 1)
    const half = T_95_19 * Math.sqrt(Math.max(0, varSum) / Math.max(1, xs.length))
    ci95[id] = { mean, half }
  }
  return {
    ...first,
    interval: { replications: runs.length, ci95 },
  }
}

export function runEngineFromLegacy(
  topology: Topology,
  workload: Workload,
  mode: EngineMode = 'analytic',
): EngineResult {
  return runEngine(scenarioFromLegacy(topology, workload), mode)
}

export { compileScenario, solveAnalytic, runAnalyticScenario, simulateOnce, scenarioFromLegacy }

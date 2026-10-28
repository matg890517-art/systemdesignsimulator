import type { CompiledModel } from '../compile/compile.ts'
import type { EngineResult } from '../schema/result.ts'

function scaleWorkload(compiled: CompiledModel, s: number): CompiledModel {
  return {
    ...compiled,
    scenario: {
      ...compiled.scenario,
      workload: compiled.scenario.workload.map((row) => ({ ...row, rate_rps: row.rate_rps * s })),
    },
  }
}

function breaks(result: EngineResult, sloP99?: number, ceiling = 0.7): string | undefined {
  if (result.invalid) return result.invalid
  for (const [id, row] of Object.entries(result.nodes)) {
    if (row.status === 'not_wired' || row.waitUnknown) continue
    if (row.rho >= 1) return id
    if (row.rho >= ceiling) return id
    if (sloP99 !== undefined && Number.isFinite(row.p99) && row.p99 > sloP99) return id
  }
  return undefined
}

/** Bisection on a common scale factor of all client rates. */
export function headroomOf(
  compiled: CompiledModel,
  solve: (model: CompiledModel) => EngineResult,
): { headroom_rps: number; firstFailing?: string } {
  const ceiling = compiled.scenario.targets.utilizationCeiling
  const slo = compiled.scenario.targets.sloP99_ms
  const base = compiled.scenario.workload.reduce((s, row) => s + row.rate_rps, 0)
  let lo = 0
  let hi = 1
  let fail = breaks(solve(compiled), slo, ceiling)
  if (fail) return { headroom_rps: 0, firstFailing: fail }
  for (let i = 0; i < 24 && !breaks(solve(scaleWorkload(compiled, hi)), slo, ceiling); i++) hi *= 2
  fail = breaks(solve(scaleWorkload(compiled, hi)), slo, ceiling)
  for (let i = 0; i < 32; i++) {
    const mid = (lo + hi) / 2
    const hit = breaks(solve(scaleWorkload(compiled, mid)), slo, ceiling)
    if (hit) {
      hi = mid
      fail = hit
    } else lo = mid
  }
  return { headroom_rps: lo * base, firstFailing: fail }
}

export type HockeyStickPoint = {
  rps: number
  waitMs: Record<string, number>
  bottleneck?: string
}

/** Latency vs offered load. Infinite wait is omitted (Unstable). */
export function hockeyStickSweep(
  compiled: CompiledModel,
  solve: (model: CompiledModel) => EngineResult,
  steps = 10,
): HockeyStickPoint[] {
  const base = compiled.scenario.workload.reduce((sum, row) => sum + row.rate_rps, 0)
  const points: HockeyStickPoint[] = []
  for (let i = 1; i <= steps; i++) {
    const scale = i / steps
    const result = solve(scaleWorkload(compiled, scale))
    const waitMs: Record<string, number> = {}
    for (const [id, row] of Object.entries(result.nodes)) {
      if (row.waitUnknown || row.status === 'not_wired') continue
      if (Number.isFinite(row.W_ms)) waitMs[id] = row.W_ms
    }
    points.push({ rps: base * scale, waitMs, bottleneck: result.system.bottleneck })
  }
  return points
}

export function nPlusOne(compiled: CompiledModel, solve: (model: CompiledModel) => EngineResult) {
  return compiled.nodes
    .filter((node) => node.kind !== 'client')
    .map((node) => {
      const next: CompiledModel = {
        ...compiled,
        nodes: compiled.nodes.map((item) =>
          item.id === node.id
            ? {
                ...item,
                servers: {
                  ...item.servers,
                  instances: Math.max(0, item.servers.instances - 1),
                },
              }
            : item,
        ),
      }
      const result = solve(next)
      const fails =
        result.system.stability === 'unstable' ||
        Boolean(breaks(result, compiled.scenario.targets.sloP99_ms, compiled.scenario.targets.utilizationCeiling))
      return { id: node.id, fails }
    })
}

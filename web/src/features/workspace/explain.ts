import { erlangCWaitMs } from '@sds/engine'

/** F23: numbers from μ = n/S and Erlang C wait, not a flat percent. */
export function explainFromModel(input: {
  name: string
  offered: number
  completed: number
  rejected: number
  backlog: number
  util: number
  servers?: number
  serviceMs?: number
  capped: boolean
}): {
  cause: string
  numbers: string
  wait: string
  fix: string
} {
  if (!input.capped || input.servers === undefined || input.serviceMs === undefined || input.serviceMs <= 0) {
    return {
      cause: `${input.name} has unknown capacity, so utilization is not a hard engine cap.`,
      numbers: `${input.offered.toFixed(2)} offered/s · ${input.completed.toFixed(2)} completed/s · queue ${input.backlog.toFixed(1)} · rejected ${input.rejected.toFixed(2)}/s.`,
      wait: 'Expected wait is unknown until servers and service time are set.',
      fix: 'Type servers and median service time (Estimated). Unknown does not cap the engine.',
    }
  }
  const serviceSec = input.serviceMs / 1000
  const mu = input.servers / serviceSec
  const rho = mu > 0 ? input.offered / mu : 1
  const perServerMu = 1 / serviceSec
  const waitMs =
    rho < 1 && input.servers > 0
      ? erlangCWaitMs(input.offered, perServerMu, input.servers)
      : Number.POSITIVE_INFINITY
  const wait =
    Number.isFinite(waitMs)
      ? `Erlang C mean wait ${waitMs.toFixed(1)} ms at ρ = ${(rho * 100).toFixed(0)}%.`
      : 'ρ ≥ 1, so the queueing model says wait grows without bound.'
  return {
    cause: `${input.name} saturates from conservation: completed stays near min(λ, μ).`,
    numbers: `μ = n / S = ${input.servers} / ${serviceSec} s = ${mu.toFixed(2)} /s. ρ = λ / μ = ${input.offered.toFixed(2)} / ${mu.toFixed(2)} = ${(rho * 100).toFixed(0)}%. Queue ${input.backlog.toFixed(1)}.`,
    wait,
    fix:
      rho >= 0.83
        ? `Raise n until ρ sits near 83%, or shorten service time. Current util ${(input.util * 100).toFixed(0)}%.`
        : 'Load is below the 83% sizing target. Check another component or a cross-provider link.',
  }
}

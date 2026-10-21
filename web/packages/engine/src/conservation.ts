const EPS = 1e-9

export function conservationHolds(
  s: {
    offered: number
    admitted: number
    rejected: number
    networkDrop: number
  },
  eps = EPS,
): boolean {
  return Math.abs(s.offered - (s.admitted + s.rejected + s.networkDrop)) <= eps
}

export function requestConservationHolds(
  s: {
    created: number
    completed: number
    rejected: number
    dropped: number
    expired: number
    inFlight: number
  },
  eps = EPS,
): boolean {
  return (
    Math.abs(
      s.created - (s.completed + s.rejected + s.dropped + s.expired + s.inFlight),
    ) <= eps
  )
}

export function backlogDeltaHolds(
  admitted: number,
  completed: number,
  dtSec: number,
  deltaBacklog: number,
  eps = EPS,
): boolean {
  return Math.abs(deltaBacklog - (admitted - completed) * dtSec) <= eps
}

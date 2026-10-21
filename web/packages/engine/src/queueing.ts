/** Erlang C: probability an arrival waits. a = λ/μ, c servers. */
export function erlangC(c: number, a: number): number {
  if (c <= 0) return 1
  if (a >= c) return 1
  let sum = 1
  let term = 1
  for (let k = 1; k < c; k++) {
    term *= a / k
    sum += term
  }
  const last = term * (a / c)
  const rho = a / c
  return last / (last + (1 - rho) * sum)
}

/** Mean queue wait in milliseconds. μ is per-server service rate (1/s). */
export function erlangCWaitMs(lambda: number, mu: number, servers: number): number {
  const a = lambda / mu
  const c = erlangC(servers, a)
  const waitSec = c / (servers * mu - lambda)
  return waitSec * 1000
}

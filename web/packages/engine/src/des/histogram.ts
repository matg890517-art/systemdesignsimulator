/** Log-linear latency histogram, ~1% relative error, no sample storage. */

const MIN_US = 1
const MAX_US = 1e12
const BINS = 240

export class LatencyHist {
  private counts: Uint32Array
  private n = 0
  private sum = 0

  constructor() {
    this.counts = new Uint32Array(BINS)
  }

  addUs(us: number): void {
    if (!Number.isFinite(us) || us < 0) return
    const x = Math.max(MIN_US, Math.min(MAX_US, us))
    const t = Math.log(x / MIN_US) / Math.log(MAX_US / MIN_US)
    const i = Math.min(BINS - 1, Math.max(0, Math.floor(t * BINS)))
    this.counts[i] = (this.counts[i] ?? 0) + 1
    this.n++
    this.sum += us
  }

  meanMs(): number {
    return this.n ? this.sum / this.n / 1000 : 0
  }

  percentileMs(p: number): number {
    if (!this.n) return 0
    const target = p * this.n
    let acc = 0
    for (let i = 0; i < BINS; i++) {
      acc += this.counts[i] ?? 0
      if (acc >= target) {
        const t = (i + 0.5) / BINS
        const us = MIN_US * Math.pow(MAX_US / MIN_US, t)
        return us / 1000
      }
    }
    return MAX_US / 1000
  }
}

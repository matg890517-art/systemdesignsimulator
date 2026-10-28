/** Binary min-heap in typed arrays, ordered by (time, seq). Time is integer microseconds. */

const KIND_ARRIVE = 1
const KIND_DEPART = 2
const KIND_GEN = 3

export const EventKind = { arrive: KIND_ARRIVE, depart: KIND_DEPART, generate: KIND_GEN } as const

export class EventHeap {
  size = 0
  private cap: number
  time: Float64Array
  seq: Uint32Array
  kind: Uint8Array
  a: Int32Array
  b: Int32Array

  constructor(capacity = 4096) {
    this.cap = capacity
    this.time = new Float64Array(capacity)
    this.seq = new Uint32Array(capacity)
    this.kind = new Uint8Array(capacity)
    this.a = new Int32Array(capacity)
    this.b = new Int32Array(capacity)
  }

  push(t: number, seq: number, kind: number, a: number, b: number): void {
    if (this.size === this.cap) this.grow()
    const i = this.size
    this.time[i] = t
    this.seq[i] = seq >>> 0
    this.kind[i] = kind
    this.a[i] = a
    this.b[i] = b
    this.size++
    this.up(i)
  }

  pop(): { t: number; seq: number; kind: number; a: number; b: number } | undefined {
    if (this.size === 0) return undefined
    const t = this.time[0]!
    const seq = this.seq[0]!
    const kind = this.kind[0]!
    const a = this.a[0]!
    const b = this.b[0]!
    this.size--
    if (this.size > 0) {
      this.time[0] = this.time[this.size]!
      this.seq[0] = this.seq[this.size]!
      this.kind[0] = this.kind[this.size]!
      this.a[0] = this.a[this.size]!
      this.b[0] = this.b[this.size]!
      this.down(0)
    }
    return { t, seq, kind, a, b }
  }

  private less(i: number, j: number): boolean {
    const ti = this.time[i]!
    const tj = this.time[j]!
    if (ti < tj) return true
    if (ti > tj) return false
    return this.seq[i]! < this.seq[j]!
  }

  private swap(i: number, j: number): void {
    const t = this.time[i]!
    this.time[i] = this.time[j]!
    this.time[j] = t
    const s = this.seq[i]!
    this.seq[i] = this.seq[j]!
    this.seq[j] = s
    const k = this.kind[i]!
    this.kind[i] = this.kind[j]!
    this.kind[j] = k
    const a = this.a[i]!
    this.a[i] = this.a[j]!
    this.a[j] = a
    const b = this.b[i]!
    this.b[i] = this.b[j]!
    this.b[j] = b
  }

  private up(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1
      if (!this.less(i, p)) break
      this.swap(i, p)
      i = p
    }
  }

  private down(i: number): void {
    for (;;) {
      const l = i * 2 + 1
      const r = l + 1
      let m = i
      if (l < this.size && this.less(l, m)) m = l
      if (r < this.size && this.less(r, m)) m = r
      if (m === i) break
      this.swap(i, m)
      i = m
    }
  }

  private grow(): void {
    const cap = this.cap * 2
    const time = new Float64Array(cap)
    const seq = new Uint32Array(cap)
    const kind = new Uint8Array(cap)
    const a = new Int32Array(cap)
    const b = new Int32Array(cap)
    time.set(this.time)
    seq.set(this.seq)
    kind.set(this.kind)
    a.set(this.a)
    b.set(this.b)
    this.time = time
    this.seq = seq
    this.kind = kind
    this.a = a
    this.b = b
    this.cap = cap
  }
}

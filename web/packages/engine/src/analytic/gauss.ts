/** Solve A x = b with partial pivoting. Returns null if singular. A is copied. */
export function solveLinear(Ain: number[][], bIn: number[]): number[] | null {
  const n = bIn.length
  if (n === 0) return []
  const A = Ain.map((row, i) => {
    const copy = row.slice()
    copy.push(bIn[i] ?? 0)
    return copy
  })
  for (let col = 0; col < n; col++) {
    let pivot = col
    let best = Math.abs(A[col]?.[col] ?? 0)
    for (let r = col + 1; r < n; r++) {
      const mag = Math.abs(A[r]?.[col] ?? 0)
      if (mag > best) {
        best = mag
        pivot = r
      }
    }
    if (best < 1e-12) return null
    if (pivot !== col) {
      const tmp = A[col]!
      A[col] = A[pivot]!
      A[pivot] = tmp
    }
    const diag = A[col]![col]!
    for (let r = col + 1; r < n; r++) {
      const f = (A[r]![col] ?? 0) / diag
      for (let c = col; c <= n; c++) {
        A[r]![c] = (A[r]![c] ?? 0) - f * (A[col]![c] ?? 0)
      }
    }
  }
  const x = new Array<number>(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let sum = A[i]![n] ?? 0
    for (let j = i + 1; j < n; j++) sum -= (A[i]![j] ?? 0) * x[j]!
    const diag = A[i]![i] ?? 0
    if (Math.abs(diag) < 1e-12) return null
    x[i] = sum / diag
  }
  return x
}

/** Power-iteration estimate of spectral radius of a non-negative matrix. */
export function spectralRadius(P: number[][], iters = 48): number {
  const n = P.length
  if (n === 0) return 0
  let v = new Array<number>(n).fill(1 / n)
  let rho = 0
  for (let k = 0; k < iters; k++) {
    const w = new Array<number>(n).fill(0)
    for (let i = 0; i < n; i++) {
      let s = 0
      for (let j = 0; j < n; j++) s += (P[i]![j] ?? 0) * v[j]!
      w[i] = s
    }
    const norm = Math.hypot(...w) || 1
    v = w.map((x) => x / norm)
    let num = 0
    let den = 0
    for (let i = 0; i < n; i++) {
      let Pv = 0
      for (let j = 0; j < n; j++) Pv += (P[i]![j] ?? 0) * v[j]!
      num += Pv * v[i]!
      den += v[i]! * v[i]!
    }
    rho = den > 0 ? num / den : 0
  }
  return rho
}

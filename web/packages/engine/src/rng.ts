/**
 * Engine PRNG. Own xoshiro128** so a library upgrade cannot change a seeded run.
 * One stream per createRng(seed). Not cryptographic.
 */
export function createRng(seed: number): () => number {
  const s = splitmix32(seed >>> 0)
  let a = splitmix32(s)
  let b = splitmix32(a)
  let c = splitmix32(b)
  let d = splitmix32(c)
  if ((a | b | c | d) === 0) a = 1
  return () => {
    const r = rotl(Math.imul(a, 5), 7)
    const result = Math.imul(r, 9) >>> 0
    const t = b << 9
    c ^= a
    d ^= b
    b ^= c
    a ^= d
    c ^= t
    d = rotl(d, 11)
    return result / 4294967296
  }
}

function splitmix32(x: number): number {
  let t = (x + 0x9e3779b9) >>> 0
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad)
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97)
  return (t ^ (t >>> 15)) >>> 0
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}

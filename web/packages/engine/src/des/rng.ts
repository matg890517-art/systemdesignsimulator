/**
 * xoshiro128** with isolated streams.
 * Stream seed = splitmix(seed XOR hash(id, purpose)).
 */

export type EngineRng = {
  next: () => number
  hasSpare: boolean
  spare: number
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0
}

export function splitmix32(x: number): number {
  let t = (x + 0x9e3779b9) >>> 0
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad)
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97)
  return (t ^ (t >>> 15)) >>> 0
}

export function fnv1a(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function xoshiro(seed: number): () => number {
  const s0 = splitmix32(seed >>> 0)
  let a = splitmix32(s0)
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

export function createRng(seed: number): () => number {
  return xoshiro(seed)
}

export function createStreamRng(seed: number, nodeId: string, purpose: string): EngineRng {
  const mixed = (seed >>> 0) ^ fnv1a(`${nodeId}\0${purpose}`)
  const next = xoshiro(splitmix32(mixed))
  return { next, hasSpare: false, spare: 0 }
}

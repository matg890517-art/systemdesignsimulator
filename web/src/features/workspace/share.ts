import { parseSnapshot, type TopologySnapshot } from './persistence.ts'

const PREFIX = 'sds1.'

function bytesToB64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function b64UrlToBytes(raw: string): Uint8Array | undefined {
  const padded = raw.replaceAll('-', '+').replaceAll('_', '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  try {
    const binary = atob(padded + pad)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  } catch {
    return undefined
  }
}

export function encodeSharePayload(snapshot: TopologySnapshot): string {
  const json = JSON.stringify(snapshot)
  return PREFIX + bytesToB64Url(new TextEncoder().encode(json))
}

export function decodeSharePayload(raw: string): TopologySnapshot | undefined {
  const trimmed = raw.trim()
  if (!trimmed.startsWith(PREFIX)) return parseSnapshot(trimmed)
  const bytes = b64UrlToBytes(trimmed.slice(PREFIX.length))
  if (!bytes) return undefined
  return parseSnapshot(new TextDecoder().decode(bytes))
}

export function shareUrlFor(snapshot: TopologySnapshot, href: string): string | undefined {
  const payload = encodeSharePayload(snapshot)
  if (payload.length > 12_000) return undefined
  const url = new URL(href)
  url.pathname = '/'
  url.hash = ''
  url.search = `share=${payload}`
  return url.toString()
}

export function snapshotFromHref(href: string): TopologySnapshot | undefined {
  try {
    const url = new URL(href)
    const raw = url.searchParams.get('share')
    return raw ? decodeSharePayload(raw) : undefined
  } catch {
    return undefined
  }
}

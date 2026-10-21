import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const text = fs.readFileSync(path.join(root, 'component link.md'), 'utf8').replace(/\r\n/g, '\n')
const providerOf = { AWS: 'aws', Azure: 'azure', GCP: 'gcp', Kubernetes: 'kubernetes' }

function slug(name, provider) {
  return `${provider}-${name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

let provider = ''
const rows = []
for (const line of text.split('\n')) {
  const heading = line.match(/^## (.+)/)
  if (heading) {
    provider = providerOf[heading[1].trim()] ?? ''
    continue
  }
  const match = line.match(
    /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(https?:[^|]+?)\s*\|\s*(yes|partial|no)\s*\|$/,
  )
  if (!match || !provider) continue
  rows.push({
    id: slug(match[2].trim(), provider),
    provider,
    category: match[1].trim(),
    name: match[2].trim(),
    docsUrl: match[3].trim(),
    limitsOnPage: match[4].trim(),
  })
}

const destDir = path.join(root, 'web/src/features/catalog')
fs.mkdirSync(destDir, { recursive: true })
const body = `import type { CatalogEntry } from './types.ts'

export const catalogReadOn = '2026-10-20' as const

export const catalogEntries: CatalogEntry[] = ${JSON.stringify(rows, null, 2)}
`
fs.writeFileSync(path.join(destDir, 'entries.ts'), body)
console.log(`wrote ${rows.length} catalog entries`)

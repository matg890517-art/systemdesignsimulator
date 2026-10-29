import type { CalibrationField, CalibrationProfile, Confidence, FieldRole, Value } from './types.ts'

const ROLES: FieldRole[] = [
  'servers',
  'serviceMs',
  'queue',
  'lossProb',
  'bandwidthBps',
  'latencyP95Ms',
  'cacheHitRate',
  'costUsdPerHour',
]

const CONFIDENCE: Confidence[] = ['measured', 'vendor', 'estimated']

export function numericIfSet(value: Value<number>): number | undefined {
  if (value.state === 'set') return value.value
  return undefined
}

/** Accounting windows for typed $/hr. Not Simulated duration. */
export const HOURS_PER_DAY = 24
export const HOURS_PER_MONTH = 730

export type NodeCost = {
  profileId: string
  bindsTo?: string
  name: string
  usdPerHour: number
  confidence: Confidence
}

export type CostReport = {
  value: string
  hint: string
  usdPerHour?: number
  usdPerDay?: number
  usdPerMonth?: number
  priced: number
  eligible: number
  /** @deprecated use priced */
  counted: number
  rows: NodeCost[]
}

/** Always-on rollup. 730 h/mo is the labeled convention, not a DES month. */
export function formatUsd(amount: number, suffix = ''): string {
  const digits = Math.abs(amount - Math.round(amount)) < 1e-9 ? 0 : 2
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  })}${suffix}`
}

export function hourlyByBindsTo(report: CostReport): Record<string, number> {
  const out: Record<string, number> = {}
  for (const row of report.rows) {
    if (row.bindsTo) out[row.bindsTo] = row.usdPerHour
  }
  return out
}

/** Sum typed $/hr. Empty stays unknown. Catalog never supplies this number. */
export function costFromProfiles(profiles: CalibrationProfile[]): CostReport {
  const eligibleProfiles = profiles.filter((profile) =>
    profile.fields.some((field) => field.role === 'costUsdPerHour'),
  )
  const rows: NodeCost[] = []
  for (const profile of eligibleProfiles) {
    const field = profile.fields.find((item) => item.role === 'costUsdPerHour')
    if (field?.value.state !== 'set') continue
    rows.push({
      profileId: profile.id,
      bindsTo: profile.bindsTo,
      name: profile.name,
      usdPerHour: field.value.value,
      confidence: field.value.confidence,
    })
  }
  const eligible = eligibleProfiles.length
  const priced = rows.length
  if (priced === 0) {
    return {
      value: 'unknown',
      hint:
        eligible > 0
          ? `0 of ${eligible} nodes · type $/hr. Catalog has no SKU prices.`
          : 'Type $/hr on a node. Catalog has no SKU prices.',
      priced: 0,
      eligible,
      counted: 0,
      rows: [],
    }
  }
  const usdPerHour = rows.reduce((sum, row) => sum + row.usdPerHour, 0)
  const usdPerDay = usdPerHour * HOURS_PER_DAY
  const usdPerMonth = usdPerHour * HOURS_PER_MONTH
  const allVendor = rows.every((row) => row.confidence === 'vendor')
  const evidence = allVendor ? 'Vendor' : 'Estimated'
  return {
    value: formatUsd(usdPerHour, '/hr'),
    hint: `${priced} of ${eligible} nodes · ${formatUsd(usdPerDay, '/d')} · ${formatUsd(usdPerMonth, '/mo')} · ${evidence} · not catalog SKUs`,
    usdPerHour,
    usdPerDay,
    usdPerMonth,
    priced,
    eligible,
    counted: priced,
    rows,
  }
}

export function fieldByRole(
  profile: CalibrationProfile,
  role: FieldRole,
): CalibrationField | undefined {
  return profile.fields.find((field) => field.role === role)
}

export function aksInputsFromProfiles(profiles: CalibrationProfile[]): {
  servers?: number
  serviceMs?: number
  queue?: number
  serversConfidence?: Confidence
  serviceConfidence?: Confidence
} {
  const profile = profiles.find((item) => item.bindsTo === 'aks')
  if (!profile) return {}
  const servers = fieldByRole(profile, 'servers')
  const service = fieldByRole(profile, 'serviceMs')
  const queue = fieldByRole(profile, 'queue')
  return {
    servers: servers ? numericIfSet(servers.value) : undefined,
    serviceMs: service ? numericIfSet(service.value) : undefined,
    queue: queue ? numericIfSet(queue.value) : undefined,
    serversConfidence:
      servers?.value.state === 'set' ? servers.value.confidence : undefined,
    serviceConfidence:
      service?.value.state === 'set' ? service.value.confidence : undefined,
  }
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        quoted = !quoted
      }
      continue
    }
    if (ch === ',' && !quoted) {
      cells.push(current)
      current = ''
      continue
    }
    current += ch
  }
  cells.push(current)
  return cells.map((cell) => cell.trim())
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

function parseState(raw: string): Value<number>['state'] {
  if (raw === 'unknown' || raw === 'not_applicable' || raw === 'set') return raw
  throw new Error(`invalid calibration state: ${raw}`)
}

function parseRole(raw: string): FieldRole {
  if (ROLES.includes(raw as FieldRole)) return raw as FieldRole
  throw new Error(`invalid calibration role: ${raw}`)
}

function parseConfidence(raw: string): Confidence {
  if (CONFIDENCE.includes(raw as Confidence)) return raw as Confidence
  throw new Error(`invalid calibration confidence: ${raw}`)
}

export function parseCalibrationCsv(text: string): CalibrationProfile[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
  if (lines.length === 0) return []
  const header = splitCsvLine(lines[0] ?? '')
  const expected = [
    'profileId',
    'name',
    'bindsTo',
    'notes',
    'fieldId',
    'label',
    'unit',
    'role',
    'state',
    'value',
    'confidence',
    'sourceId',
  ]
  if (expected.some((name, i) => header[i] !== name)) {
    throw new Error(`CSV header must be ${expected.join(',')}`)
  }
  const extra = {
    source: header.indexOf('source'),
    retrievedOn: header.indexOf('retrievedOn'),
    version: header.indexOf('version'),
    tier: header.indexOf('tier'),
    region: header.indexOf('region'),
  }

  const byId = new Map<string, CalibrationProfile>()
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line)
    const [
      profileId,
      name,
      bindsTo,
      notes,
      fieldId,
      label,
      unit,
      roleRaw,
      stateRaw,
      valueRaw,
      confidenceRaw,
      sourceId,
    ] = cells
    if (!profileId || !fieldId) continue
    const state = parseState(stateRaw ?? '')
    const role = parseRole(roleRaw ?? '')
    let value: Value<number>
    if (state === 'set') {
      const parsed = Number(valueRaw)
      if (!Number.isFinite(parsed)) {
        throw new Error(`set field ${fieldId} needs a finite number`)
      }
      value = {
        state: 'set',
        value: parsed,
        confidence: parseConfidence(confidenceRaw ?? ''),
        sourceId: sourceId || undefined,
      }
    } else if (state === 'unknown') {
      value = { state: 'unknown' }
    } else {
      value = { state: 'not_applicable' }
    }

    const existing = byId.get(profileId)
    const field: CalibrationField = {
      id: fieldId,
      label: label ?? fieldId,
      unit: unit ?? '',
      role,
      value,
    }
    if (existing) {
      existing.fields.push(field)
    } else {
      const meta: Pick<CalibrationProfile, 'source' | 'retrievedOn' | 'version' | 'tier' | 'region'> =
        {}
      const take = (index: number, key: keyof typeof meta) => {
        const text = index >= 0 ? cells[index] : undefined
        if (text) meta[key] = text
      }
      take(extra.source, 'source')
      take(extra.retrievedOn, 'retrievedOn')
      take(extra.version, 'version')
      take(extra.tier, 'tier')
      take(extra.region, 'region')
      byId.set(profileId, {
        id: profileId,
        name: name || profileId,
        bindsTo: bindsTo || undefined,
        notes: notes ?? '',
        ...meta,
        fields: [field],
      })
    }
  }
  return [...byId.values()]
}

export function serializeCalibrationCsv(profiles: CalibrationProfile[]): string {
  const header = [
    'profileId',
    'name',
    'bindsTo',
    'notes',
    'fieldId',
    'label',
    'unit',
    'role',
    'state',
    'value',
    'confidence',
    'sourceId',
    'source',
    'retrievedOn',
    'version',
    'tier',
    'region',
  ].join(',')
  const rows = [header]
  for (const profile of profiles) {
    for (const field of profile.fields) {
      const value = field.value
      rows.push(
        [
          csvCell(profile.id),
          csvCell(profile.name),
          csvCell(profile.bindsTo ?? ''),
          csvCell(profile.notes),
          csvCell(field.id),
          csvCell(field.label),
          csvCell(field.unit),
          field.role,
          value.state,
          value.state === 'set' ? String(value.value) : '',
          value.state === 'set' ? value.confidence : '',
          value.state === 'set' ? (value.sourceId ?? '') : '',
          csvCell(profile.source ?? ''),
          csvCell(profile.retrievedOn ?? ''),
          csvCell(profile.version ?? ''),
          csvCell(profile.tier ?? ''),
          csvCell(profile.region ?? ''),
        ].join(','),
      )
    }
  }
  return rows.join('\n')
}

export function mergeProfiles(
  current: CalibrationProfile[],
  incoming: CalibrationProfile[],
): CalibrationProfile[] {
  const byId = new Map(current.map((profile) => [profile.id, structuredClone(profile)]))
  for (const profile of incoming) {
    const existing = byId.get(profile.id)
    if (!existing) {
      byId.set(profile.id, structuredClone(profile))
      continue
    }
    existing.name = profile.name
    existing.bindsTo = profile.bindsTo
    existing.notes = profile.notes
    existing.source = profile.source
    existing.retrievedOn = profile.retrievedOn
    existing.version = profile.version
    existing.tier = profile.tier
    existing.region = profile.region
    for (const field of profile.fields) {
      const index = existing.fields.findIndex((item) => item.id === field.id)
      if (index >= 0) existing.fields[index] = structuredClone(field)
      else existing.fields.push(structuredClone(field))
    }
  }
  return [...byId.values()]
}

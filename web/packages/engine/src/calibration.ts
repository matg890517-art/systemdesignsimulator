import type { CalibrationField, CalibrationProfile, Confidence, FieldRole, Value } from './types.ts'

const ROLES: FieldRole[] = [
  'servers',
  'serviceMs',
  'queue',
  'lossProb',
  'bandwidthBps',
  'latencyP95Ms',
  'cacheHitRate',
]

const CONFIDENCE: Confidence[] = ['measured', 'vendor', 'estimated']

export function numericIfSet(value: Value<number>): number | undefined {
  if (value.state === 'set') return value.value
  return undefined
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

  const byId = new Map<string, CalibrationProfile>()
  for (const line of lines.slice(1)) {
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
    ] = splitCsvLine(line)
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
      byId.set(profileId, {
        id: profileId,
        name: name || profileId,
        bindsTo: bindsTo || undefined,
        notes: notes ?? '',
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
    for (const field of profile.fields) {
      const index = existing.fields.findIndex((item) => item.id === field.id)
      if (index >= 0) existing.fields[index] = structuredClone(field)
      else existing.fields.push(structuredClone(field))
    }
  }
  return [...byId.values()]
}

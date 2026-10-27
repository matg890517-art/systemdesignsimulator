export type NoticeSeverity = 'error' | 'warning' | 'success' | 'info'

export type Notice = {
  id: number
  message: string
  severity: NoticeSeverity
}

const CONFIRMATIONS = ['Saved', 'Exported', 'Copied', 'Imported', 'Inventory'] as const

/** Saved-state hints that deserve a toast. Draft/undo/delete hints stay in the chip only. */
export function noticeSeverityForHint(hint: string): NoticeSeverity | undefined {
  return CONFIRMATIONS.some((prefix) => hint.startsWith(prefix)) ? 'success' : undefined
}

export function nextNotice(previous: Notice | undefined, message: string, severity: NoticeSeverity): Notice {
  return { id: (previous?.id ?? 0) + 1, message, severity }
}

/** Toast lifetime by severity. Errors stay until dismissed or replaced. */
export function noticeDurationMs(severity: NoticeSeverity): number | null {
  if (severity === 'error') return null
  if (severity === 'warning') return 6000
  return 2500
}

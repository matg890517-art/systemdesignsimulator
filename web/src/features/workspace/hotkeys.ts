import { formatForDisplay, type HotkeyChord } from '@tanstack/hotkeys'

/**
 * Workspace keyboard shortcuts, declared once as data so buttons, tooltips, and
 * the registrations in WorkspacePage read the same bindings.
 *
 * Mod is Command on macOS and Control elsewhere. Delete / Backspace / Escape are
 * single keys, so TanStack Hotkeys already ignores them while typing in a field.
 */
export const WORKSPACE_HOTKEYS = {
  run: 'Mod+Enter',
  save: 'Mod+S',
  undo: 'Mod+Z',
  redo: 'Mod+Shift+Z',
  delete: 'Delete',
  backspace: 'Backspace',
  escape: 'Escape',
} as const satisfies Record<string, HotkeyChord>

export type WorkspaceHotkeyId = keyof typeof WORKSPACE_HOTKEYS

export type HotkeyPlatform = 'mac' | 'windows' | 'linux'

/** Platform-appropriate label, e.g. `Ctrl+Enter` or `⌘ Enter`. Modifier symbols on macOS; key names stay words. */
export function hotkeyLabel(id: WorkspaceHotkeyId, platform?: HotkeyPlatform): string {
  return formatForDisplay(WORKSPACE_HOTKEYS[id], {
    ...(platform ? { platform } : {}),
    useSymbols: { modifiers: true, keys: false },
  }) as string
}

/** `Run (Ctrl+Enter)` style suffix for tooltips and titles. */
export function withHotkey(text: string, id: WorkspaceHotkeyId, platform?: HotkeyPlatform): string {
  return `${text} (${hotkeyLabel(id, platform)})`
}

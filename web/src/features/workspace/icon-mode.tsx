import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { IconMode } from './kind-icon.ts'

const IconModeContext = createContext<{
  mode: IconMode
  setMode: (mode: IconMode) => void
}>({
  mode: 'service',
  setMode: () => {},
})

export function IconModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<IconMode>('service')
  const value = useMemo(() => ({ mode, setMode }), [mode])
  return <IconModeContext.Provider value={value}>{children}</IconModeContext.Provider>
}

export function useIconMode() {
  return useContext(IconModeContext)
}

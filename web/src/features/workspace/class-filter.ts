import { createContext, useContext } from 'react'
import type { Edge } from '@xyflow/react'
import type { ClassFilter } from './compile.ts'

export type { ClassFilter }

export const CLASS_FILTERS: { id: ClassFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'read', label: 'Read' },
  { id: 'write', label: 'Write' },
  { id: 'async', label: 'Async' },
  { id: 'bulk', label: 'Bulk' },
]

type ClassFilterContextValue = {
  filter: ClassFilter
  edges: Edge[]
}

const ClassFilterContext = createContext<ClassFilterContextValue>({
  filter: 'all',
  edges: [],
})

export const ClassFilterProvider = ClassFilterContext.Provider

export function useClassFilter() {
  return useContext(ClassFilterContext)
}

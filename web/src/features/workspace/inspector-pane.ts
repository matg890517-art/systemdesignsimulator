export type InspectorRunTab = 'focus' | 'bottlenecks' | 'blast'
export type InspectorPane = 'config' | 'edge' | 'bottlenecks' | 'blast'

/** Node selection shows Config; an edge shows Edge. Run tabs stay until the selection changes. */
export function inspectorPane(runTab: InspectorRunTab, hasSelectedEdge: boolean): InspectorPane {
  if (runTab !== 'focus') return runTab
  return hasSelectedEdge ? 'edge' : 'config'
}

export function inspectorFocusLabel(hasSelectedEdge: boolean): 'Edge' | 'Config' {
  return hasSelectedEdge ? 'Edge' : 'Config'
}

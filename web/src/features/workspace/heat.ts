/** F8: util heat. Not a latency heatmap. Fluid tails stay unknown. */
export function heatStroke(util: number): string {
  if (util >= 0.85) return '#B3261E'
  if (util >= 0.7) return '#B7791F'
  if (util > 0) return '#2744C7'
  return '#7B8794'
}

export function heatFill(util: number): string {
  if (util >= 0.85) return '#FFF6F5'
  if (util >= 0.7) return '#FFF1D6'
  if (util > 0) return '#E7ECFC'
  return '#FFFFFF'
}

export const HEAT_STOPS = [
  { label: '0%', color: '#7B8794' },
  { label: '70%', color: '#B7791F' },
  { label: '85%', color: '#B3261E' },
] as const

/** Stable identity for React Flow selection. Position updates must not change this. */
export function canvasSelectionKey(
  selectedNodes: Array<{ id: string; type?: string }>,
  selectedEdges: Array<{ id: string }>,
): string {
  const edgeId = selectedEdges[0]?.id
  if (edgeId) return `e:${edgeId}`
  const node = selectedNodes.find((item) => item.type === 'service')
  return node ? `n:${node.id}` : ''
}

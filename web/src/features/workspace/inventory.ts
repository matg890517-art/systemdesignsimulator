import type { Edge as RfEdge, Node } from '@xyflow/react'
import type { ServiceNodeData, ZoneNodeData } from './types.ts'

/** F14: a readable inventory. Not Terraform, CloudFormation, or anything you can apply. */
export type ArchitectureInventory = {
  kind: 'sds-inventory'
  version: 1
  note: 'Not executable IaC. Catalog ids are bindings only. Unknown capacities are omitted.'
  name: string
  services: {
    id: string
    title: string
    provider: string
    catalogId?: string
    parentId?: string
  }[]
  subsystems: { id: string; label: string; nested?: boolean }[]
  edges: { id: string; from: string; to: string }[]
}

export function architectureInventory(
  name: string,
  nodes: Node<ServiceNodeData | ZoneNodeData>[],
  edges: RfEdge[],
): ArchitectureInventory {
  return {
    kind: 'sds-inventory',
    version: 1,
    note: 'Not executable IaC. Catalog ids are bindings only. Unknown capacities are omitted.',
    name,
    services: nodes
      .filter((node) => node.type === 'service')
      .map((node) => {
        const data = node.data as ServiceNodeData
        return {
          id: node.id,
          title: data.title,
          provider: data.provider,
          catalogId: data.catalogId,
          parentId: node.parentId,
        }
      }),
    subsystems: nodes
      .filter((node) => node.type === 'zone')
      .map((node) => {
        const data = node.data as ZoneNodeData
        return { id: node.id, label: data.label, nested: data.nested }
      }),
    edges: edges.map((edge) => ({ id: edge.id, from: edge.source, to: edge.target })),
  }
}

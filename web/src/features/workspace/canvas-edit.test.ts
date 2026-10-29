import { describe, expect, it } from 'vitest'
import { connectComponents, deleteSelection, patchServiceTitle } from './canvas-edit.ts'
import { readEdgeData } from './edge-data.ts'
import { initialEdges, initialNodes } from './graph.ts'

describe('canvas edit', () => {
  it('deletes a service and every attached edge, and leaves zones', () => {
    const next = deleteSelection(initialNodes, initialEdges, ['alb'], [])
    expect(next.nodes.some((node) => node.id === 'alb')).toBe(false)
    expect(next.nodes.some((node) => node.id === 'aws' && node.type === 'zone')).toBe(true)
    expect(next.edges.some((edge) => edge.source === 'alb' || edge.target === 'alb')).toBe(false)
  })

  it('deletes a selected edge without removing nodes', () => {
    const next = deleteSelection(initialNodes, initialEdges, [], ['cf-alb'])
    expect(next.nodes).toHaveLength(initialNodes.length)
    expect(next.edges.some((edge) => edge.id === 'cf-alb')).toBe(false)
  })

  it('ungroups a selected environment and keeps the services', () => {
    const next = deleteSelection(initialNodes, initialEdges, ['aws'], [])
    expect(next.nodes.some((node) => node.id === 'aws')).toBe(false)
    expect(next.nodes.some((node) => node.id === 'ecs')).toBe(true)
    expect(next.nodes.find((node) => node.id === 'ecs')?.parentId).toBeUndefined()
    expect(next.edges).toHaveLength(initialEdges.length)
  })

  it('connects two services with a typed edge and labels a cross-provider hop Estimated', () => {
    const same = connectComponents(initialNodes, initialEdges, 'alb', 'blob')
    if ('error' in same) throw new Error(same.error)
    const added = same.edges.find((edge) => edge.source === 'alb' && edge.target === 'blob')
    expect(added?.type).toBe('smoothstep')
    expect(added?.sourceHandle).toBeTruthy()
    expect(added?.targetHandle).toBeTruthy()
    expect(String(added?.label)).toMatch(/cross · Estimated/)
    expect(readEdgeData(added!).routing).toEqual({ mode: 'weighted', weight: 1 })
    const ecsHop = same.edges.find((edge) => edge.id === 'alb-ecs')
    expect(ecsHop && readEdgeData(ecsHop).routing).toEqual({ mode: 'weighted', weight: 1 })
    expect(connectComponents(initialNodes, initialEdges, 'alb', 'ecs')).toMatchObject({
      error: 'Already connected. One hop per pair; extra classes go on that edge.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'alb', 'alb')).toMatchObject({
      error: 'Pick a different component',
    })
  })

  it('refuses client-to-client, edges into clients, and a second hop on the same pair', () => {
    expect(connectComponents(initialNodes, initialEdges, 'viewers', 'uploaders')).toMatchObject({
      error: 'Clients only send load. They cannot be a target.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'alb', 'viewers')).toMatchObject({
      error: 'Clients only send load. They cannot be a target.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'ecs', 'alb')).toMatchObject({
      error: 'Already connected. One hop per pair; extra classes go on that edge.',
    })
  })

  it('renames a service card without changing catalog kind', () => {
    const next = patchServiceTitle(initialNodes, 'viewers', 'Viewers (web)')
    const node = next.find((item) => item.id === 'viewers')
    expect(node?.type).toBe('service')
    expect(node && 'title' in node.data ? node.data.title : undefined).toBe('Viewers (web)')
    expect(node && 'catalogId' in node.data ? node.data.catalogId : undefined).toBe(
      'generic-clients',
    )
  })
})

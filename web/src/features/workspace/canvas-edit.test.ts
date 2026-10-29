import { describe, expect, it } from 'vitest'
import { connectComponents, deleteSelection, patchServiceTitle } from './canvas-edit.ts'
import { initialEdges, initialNodes } from './graph.ts'

describe('canvas edit', () => {
  it('deletes a service and every attached edge, and leaves zones', () => {
    const next = deleteSelection(initialNodes, initialEdges, ['glb'], [])
    expect(next.nodes.some((node) => node.id === 'glb')).toBe(false)
    expect(next.nodes.some((node) => node.id === 'gcp' && node.type === 'zone')).toBe(true)
    expect(next.edges.some((edge) => edge.source === 'glb' || edge.target === 'glb')).toBe(false)
  })

  it('deletes a selected edge without removing nodes', () => {
    const next = deleteSelection(initialNodes, initialEdges, [], ['c-lb'])
    expect(next.nodes).toHaveLength(initialNodes.length)
    expect(next.edges.some((edge) => edge.id === 'c-lb')).toBe(false)
  })

  it('ungroups a selected environment and keeps the services', () => {
    const next = deleteSelection(initialNodes, initialEdges, ['gcp'], [])
    expect(next.nodes.some((node) => node.id === 'gcp')).toBe(false)
    expect(next.nodes.some((node) => node.id === 'upload')).toBe(true)
    expect(next.nodes.find((node) => node.id === 'upload')?.parentId).toBeUndefined()
    expect(next.edges).toHaveLength(initialEdges.length)
  })

  it('connects two services with a typed edge and refuses a second hop on the pair', () => {
    const same = connectComponents(initialNodes, initialEdges, 'upload', 'mediacdn')
    if ('error' in same) throw new Error(same.error)
    const added = same.edges.find((edge) => edge.source === 'upload' && edge.target === 'mediacdn')
    expect(added?.type).toBe('smoothstep')
    expect(added?.sourceHandle).toBeTruthy()
    expect(added?.targetHandle).toBeTruthy()
    expect(connectComponents(initialNodes, initialEdges, 'glb', 'upload')).toMatchObject({
      error: 'Already connected. One hop per pair; extra classes go on that edge.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'glb', 'glb')).toMatchObject({
      error: 'Pick a different component',
    })
  })

  it('refuses client-to-client, edges into clients, and a second hop on the same pair', () => {
    const extraClient = {
      ...initialNodes.find((node) => node.id === 'client')!,
      id: 'client-b',
      parentId: undefined,
      position: { x: 16, y: 200 },
    }
    const nodes = [...initialNodes, extraClient]
    expect(connectComponents(nodes, initialEdges, 'client', 'client-b')).toMatchObject({
      error: 'Clients only send load. They cannot be a target.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'glb', 'client')).toMatchObject({
      error: 'Clients only send load. They cannot be a target.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'upload', 'gcs')).toMatchObject({
      error: 'Already connected. One hop per pair; extra classes go on that edge.',
    })
  })

  it('refuses hops the kind matrix does not allow', () => {
    expect(connectComponents(initialNodes, initialEdges, 'bigtable', 'mediacdn')).toMatchObject({
      error: 'Database cannot connect to CDN.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'gcs', 'bigtable')).toMatchObject({
      error: 'Object store cannot connect to Database.',
    })
    expect(connectComponents(initialNodes, initialEdges, 'mediacdn', 'client')).toMatchObject({
      error: 'Clients only send load. They cannot be a target.',
    })
  })

  it('renames a service card without changing catalog kind', () => {
    const next = patchServiceTitle(initialNodes, 'client', 'Client (web)')
    const node = next.find((item) => item.id === 'client')
    expect(node?.type).toBe('service')
    expect(node && 'title' in node.data ? node.data.title : undefined).toBe('Client (web)')
    expect(node && 'catalogId' in node.data ? node.data.catalogId : undefined).toBe(
      'generic-clients',
    )
  })
})

import { describe, expect, it } from 'vitest'
import {
  adoptIntoZone,
  createEnvironment,
  defaultEnvironmentSize,
  droppedServicePosition,
  environmentLabel,
  releaseFromZone,
  ungroupZone,
  zoneContaining,
} from './environment.ts'
import type { WorkspaceNode } from './types.ts'

function service(id: string, x: number, y: number, parentId?: string): WorkspaceNode {
  return {
    id,
    type: 'service',
    position: { x, y },
    parentId,
    extent: parentId ? 'parent' : undefined,
    data: {
      title: id,
      util: 0,
      p99: 'not run',
      meta: '',
      provider: 'generic',
    },
  }
}

describe('environment boxes', () => {
  it('drops a named, draggable provider box', () => {
    const box = createEnvironment({ id: 'env-1', provider: 'aws', position: { x: 40, y: 16 } })
    expect(box.type).toBe('zone')
    expect(box.draggable).toBe(true)
    expect(box.selectable).toBe(true)
    expect(box.data.label).toBe('AWS')
    expect(box.style?.width).toBe(defaultEnvironmentSize.width)
    expect(environmentLabel('azure')).toBe('Azure')
  })

  it('parents a dropped service that lands inside the box', () => {
    const env = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const placed = droppedServicePosition([env], { x: 140, y: 60 })
    expect(placed.parentId).toBe('aws')
    expect(placed.extent).toBe('parent')
    expect(placed.position.x).toBe(40)
    expect(placed.position.y).toBe(40)
  })

  it('adopts, releases, and ungroups without deleting services', () => {
    const env = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const alb = service('alb', 300, 80)
    const adopted = adoptIntoZone([env, alb], 'alb', 'aws')
    expect(adopted.find((node) => node.id === 'alb')?.parentId).toBe('aws')
    expect(zoneContaining(adopted, { x: 120, y: 40 })?.id).toBe('aws')
    const released = releaseFromZone(adopted, 'alb')
    expect(released.find((node) => node.id === 'alb')?.parentId).toBeUndefined()
    expect(released.find((node) => node.id === 'alb')?.position).toEqual({ x: 300, y: 80 })
    const nested = adoptIntoZone([env, alb], 'alb', 'aws')
    const ungrouped = ungroupZone(nested, 'aws')
    expect(ungrouped.some((node) => node.id === 'aws')).toBe(false)
    expect(ungrouped.find((node) => node.id === 'alb')?.parentId).toBeUndefined()
    expect(ungrouped.find((node) => node.id === 'alb')?.position).toEqual({ x: 300, y: 80 })
  })
})

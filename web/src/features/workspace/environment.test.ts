import { describe, expect, it } from 'vitest'
import {
  adoptIntoZone,
  appendServiceInZone,
  createEnvironment,
  defaultEnvironmentSize,
  droppedServicePosition,
  environmentLabel,
  orderZonesBeforeChildren,
  releaseFromZone,
  reparentOnDragStop,
  SERVICE_Z,
  serviceDraftFromDrop,
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
    expect(environmentLabel('generic')).toBe('Subsystem')
  })

  it('parents a dropped service that lands inside the box', () => {
    const env = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const placed = droppedServicePosition([env], { x: 140, y: 60 })
    expect(placed.parentId).toBe('aws')
    expect(placed.extent).toBeUndefined()
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

  it('contains a service inside the box and disconnects when the center leaves it', () => {
    const env = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const alb = service('alb', 300, 80)
    const adopted = adoptIntoZone([env, alb], 'alb', 'aws')
    expect(adopted.find((node) => node.id === 'alb')?.parentId).toBe('aws')
    expect(adopted.find((node) => node.id === 'alb')?.extent).toBeUndefined()
    const stillInside = reparentOnDragStop(adopted, 'alb', { x: 140, y: 60 })
    expect(stillInside.find((node) => node.id === 'alb')?.parentId).toBe('aws')
    const outside = reparentOnDragStop(adopted, 'alb', { x: 10, y: 10 })
    expect(outside.find((node) => node.id === 'alb')?.parentId).toBeUndefined()
  })

  it('keeps the zone before children so parenting matches the YouTube example', () => {
    const env = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const alb = service('alb', 300, 80)
    const adopted = adoptIntoZone([alb, env], 'alb', 'aws')
    const awsIndex = adopted.findIndex((node) => node.id === 'aws')
    const albIndex = adopted.findIndex((node) => node.id === 'alb')
    expect(awsIndex).toBeGreaterThanOrEqual(0)
    expect(awsIndex).toBeLessThan(albIndex)
    expect(orderZonesBeforeChildren(adopted)[awsIndex]?.id).toBe('aws')

    const withDrop = appendServiceInZone(
      [alb, env],
      serviceDraftFromDrop({ name: 'ECS', provider: 'aws', kind: 'service' }, { x: 0, y: 0 }),
      { x: 140, y: 60 },
    )
    const envAt = withDrop.findIndex((node) => node.id === 'aws')
    const child = withDrop.find((node) => node.parentId === 'aws')
    expect(child).toBeDefined()
    expect(envAt).toBeLessThan(withDrop.findIndex((node) => node.id === child?.id))
  })

  it('keeps every environment behind every service card', () => {
    const aws = createEnvironment({ id: 'aws', provider: 'aws', position: { x: 100, y: 20 } })
    const azure = createEnvironment({ id: 'azure', provider: 'azure', position: { x: 100, y: 400 } })
    const clients = service('clients', 16, 80)
    const alb = service('alb', 300, 80)
    const stacked = adoptIntoZone([clients, alb, aws, azure], 'alb', 'aws')
    const clientsZ = stacked.find((node) => node.id === 'clients')?.zIndex ?? 0
    const awsZ = stacked.find((node) => node.id === 'aws')?.zIndex ?? 0
    const albZ = stacked.find((node) => node.id === 'alb')?.zIndex ?? 0
    const azureZ = stacked.find((node) => node.id === 'azure')?.zIndex ?? 0
    expect(awsZ).toBeLessThan(SERVICE_Z)
    expect(azureZ).toBeLessThan(SERVICE_Z)
    expect(clientsZ).toBe(SERVICE_Z)
    expect(albZ).toBe(SERVICE_Z)
    expect(awsZ).toBeLessThan(albZ)
    expect(awsZ).toBeLessThan(clientsZ)
  })
})

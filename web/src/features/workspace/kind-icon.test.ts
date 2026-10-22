import { describe, expect, it } from 'vitest'
import { iconGlyphFor } from './kind-icon.ts'

describe('kind icons', () => {
  it('Normal mode uses the generic kind shape', () => {
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Clients', catalogId: 'generic-clients' }),
    ).toBe('clients')
    expect(iconGlyphFor({ mode: 'normal', name: 'ECS', catalogId: 'aws-ecs' })).toBe('k8s')
  })

  it('Service mode uses the original service glyph from the name, not a blank tile', () => {
    expect(iconGlyphFor({ mode: 'service', name: 'EC2', catalogId: 'aws-ec2' })).toBe('compute')
    expect(
      iconGlyphFor({ mode: 'service', name: 'Lambda', catalogId: 'aws-lambda' }),
    ).toBe('function')
    expect(iconGlyphFor({ mode: 'service', name: 'S3', catalogId: 'aws-s3' })).toBe('object')
    expect(
      iconGlyphFor({
        mode: 'service',
        name: 'Application Load Balancer',
        catalogId: 'aws-application-load-balancer',
      }),
    ).toBe('lb')
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Worker pool', catalogId: 'generic-worker' }),
    ).toBe('worker')
  })
})

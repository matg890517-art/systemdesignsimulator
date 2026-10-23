import { describe, expect, it } from 'vitest'
import { iconGlyphFor } from './kind-icon.ts'
import { providerMarkSrc, serviceMarkSrc } from './icons/registry.ts'

describe('kind icons', () => {
  it('Normal mode uses the generic kind shape', () => {
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Clients', catalogId: 'generic-clients' }),
    ).toBe('clients')
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Viewers', catalogId: 'generic-clients' }),
    ).toBe('clients')
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Uploaders', catalogId: 'generic-clients' }),
    ).toBe('clients')
    expect(iconGlyphFor({ mode: 'normal', name: 'ECS', catalogId: 'aws-ecs' })).toBe('k8s')
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Cache', catalogId: 'generic-cache' }),
    ).toBe('cache')
    expect(
      iconGlyphFor({ mode: 'normal', name: 'Queue', catalogId: 'generic-queue' }),
    ).toBe('queue')
    expect(iconGlyphFor({ mode: 'normal', name: 'Blocks', category: 'GENERIC' })).toBe(
      'blocks',
    )
    expect(iconGlyphFor({ mode: 'normal', name: 'Compute', category: 'COMPUTE' })).toBe(
      'compute',
    )
  })

  it('Service mode falls back to a named glyph when no official mark is mapped', () => {
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

  it('Service mode maps official architecture marks by catalogId', () => {
    expect(serviceMarkSrc('aws-lambda')).toBeTruthy()
    expect(serviceMarkSrc('aws-ec2')).toBeTruthy()
    expect(serviceMarkSrc('azure-aks')).toBeTruthy()
    expect(serviceMarkSrc('gcp-cloud-run')).toBeTruthy()
    expect(serviceMarkSrc('generic-clients')).toBeUndefined()
    expect(serviceMarkSrc(undefined)).toBeUndefined()
    expect(providerMarkSrc('aws')).toBeTruthy()
    expect(providerMarkSrc('generic')).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { usableAsCeiling } from '@sds/engine'
import { LIMIT_TYPE_FROM_PROSE, limitTypeFromProse } from './limit-type-map.ts'
import {
  CANONICAL_VERIFIED_CATALOG_IDS,
  PARTIAL_RECORDED_CATALOG_IDS,
  catalogValuesFor,
  formatCatalogValue,
} from './verified-limits.ts'
import { catalogEntries } from './entries.ts'

describe('canonical Verified 18 vs figure table', () => {
  it('keeps the first-compare 18, not Azure Load Balancer and not AWS Batch', () => {
    expect(CANONICAL_VERIFIED_CATALOG_IDS).toHaveLength(18)
    expect(CANONICAL_VERIFIED_CATALOG_IDS).toEqual([
      'aws-lambda',
      'aws-ecs',
      'aws-aurora',
      'aws-rds',
      'aws-elasticache',
      'aws-memorydb',
      'aws-cloudfront',
      'aws-application-load-balancer',
      'aws-sqs',
      'azure-aks',
      'azure-azure-sql',
      'azure-cache-for-redis',
      'azure-service-bus',
      'gcp-gke',
      'gcp-cloud-sql',
      'gcp-memorystore',
      'gcp-cloud-load-balancing',
      'gcp-pub-sub',
    ])
    expect(PARTIAL_RECORDED_CATALOG_IDS).toEqual(['azure-load-balancer'])
    expect(CANONICAL_VERIFIED_CATALOG_IDS).not.toContain('azure-load-balancer')
    for (const id of CANONICAL_VERIFIED_CATALOG_IDS) {
      expect(catalogEntries.find((entry) => entry.id === id), id).toBeDefined()
      expect(catalogValuesFor(id).length).toBeGreaterThan(0)
    }
  })
})

describe('limitType mapping M1 + Decision 11', () => {
  it('maps plan cues onto the six named types plus quota_adjustability_unknown', () => {
    expect(limitTypeFromProse('fixed')).toBe('hard_limit')
    expect(limitTypeFromProse('adjustable')).toBe('adjustable_quota')
    expect(limitTypeFromProse('best-effort')).toBe('best_effort_target')
    expect(limitTypeFromProse('guidance')).toBe('performance_guidance')
    expect(limitTypeFromProse('default')).toBe('configurable_setting')
    expect(limitTypeFromProse('behavior')).toBe('documented_behavior')
    expect(limitTypeFromProse('quota, adjustability not checked')).toBe('quota_adjustability_unknown')
    expect(Object.keys(LIMIT_TYPE_FROM_PROSE)).toHaveLength(7)
  })
})

describe('RDS pattern', () => {
  it('encodes stated figures with the plan URL and date, and leaves unstated fields unknown', () => {
    const rds = catalogValuesFor('aws-rds')
    expect(rds.every((value) => value.sourceUrl.endsWith('/CHAP_Limits.html'))).toBe(true)
    expect(rds.every((value) => value.retrievedOn === '2026-10-20')).toBe(true)
    expect(rds.every((value) => value.status !== 'measured')).toBe(true)

    const replicas = rds.find((value) => value.conditions.metric === 'read-replicas-per-primary')
    expect(replicas).toMatchObject({
      value: 15,
      limitType: 'quota_adjustability_unknown',
      status: 'documented',
    })
    expect(usableAsCeiling(replicas!)).toBe(false)

    expect(rds.find((value) => value.conditions.metric === 'multi-az-instance')?.limitType).toBe(
      'documented_behavior',
    )
    expect(rds.find((value) => value.conditions.metric === 'multi-az-cluster')?.limitType).toBe(
      'documented_behavior',
    )

    const storage = rds.find((value) => value.conditions.metric === 'per-instance-storage')
    expect(storage?.status).toBe('unknown')
    expect(storage?.value).toBeUndefined()
    expect(formatCatalogValue(storage!)).toBe('unknown · quota adjustability unknown')

    const consistency = rds.find((value) => value.conditions.metric === 'consistency')
    expect(consistency?.status).toBe('unknown')
    expect(consistency?.value).toBeUndefined()

    expect(rds.some((value) => value.unit === 'rps' || value.conditions.metric?.includes('qps'))).toBe(
      false,
    )
  })
})

describe('batched Verified figures from plan prose', () => {
  it('keeps Azure Load Balancer Partial idle timeout as a setting that does not cap', () => {
    const lb = catalogValuesFor('azure-load-balancer')
    const idle = lb.find((value) => value.conditions.metric === 'idle-timeout-default')
    expect(idle).toMatchObject({
      value: 4,
      unit: 'min',
      limitType: 'configurable_setting',
      retrievedOn: '2026-10-20',
    })
    expect(usableAsCeiling(idle!)).toBe(false)
    expect(lb.find((value) => value.conditions.metric === 'limits')?.status).toBe('unknown')
  })

  it('does not let AKS node counts cap, because adjustability was not stated', () => {
    const aks = catalogValuesFor('azure-aks')
    const nodes = aks.find((value) => value.conditions.metric === 'nodes')
    expect(nodes?.value).toBe(5_000)
    expect(nodes?.limitType).toBe('quota_adjustability_unknown')
    expect(usableAsCeiling(nodes!)).toBe(false)
    expect(aks.every((value) => !usableAsCeiling(value))).toBe(true)
  })

  it('records Lambda timeouts from M6 (Oct 18) and leaves concurrency unknown', () => {
    const lambda = catalogValuesFor('aws-lambda')
    expect(lambda.every((value) => value.retrievedOn === '2026-10-18')).toBe(true)
    expect(lambda.find((value) => value.conditions.executionModel === 'ordinary')?.value).toBe(900)
    expect(lambda.find((value) => value.conditions.executionModel === 'managed-instances')?.value).toBe(
      5_400,
    )
    const concurrency = lambda.find((value) => value.conditions.metric === 'concurrency')
    expect(concurrency?.limitType).toBe('adjustable_quota')
    expect(concurrency?.status).toBe('unknown')
    expect(concurrency?.value).toBeUndefined()
    expect(usableAsCeiling(concurrency!)).toBe(false)
  })

  it('marks CloudFront unknown because the plan states no number', () => {
    const cf = catalogValuesFor('aws-cloudfront')
    expect(cf).toHaveLength(1)
    expect(cf[0]?.status).toBe('unknown')
    expect(cf[0]?.value).toBeUndefined()
    expect(usableAsCeiling(cf[0]!)).toBe(false)
  })

  it('stores SQS Standard and FIFO as variants on one service', () => {
    const sqs = catalogValuesFor('aws-sqs')
    expect(sqs.some((value) => value.conditions.variant === 'standard' && value.limitType === 'best_effort_target')).toBe(
      true,
    )
    const fifoRate = sqs.find(
      (value) => value.conditions.variant === 'fifo' && value.conditions.batch === 'batched',
    )
    expect(fifoRate).toMatchObject({ value: 3_000, limitType: 'performance_guidance' })
    expect(usableAsCeiling(fifoRate!)).toBe(false)
    expect(sqs.find((value) => value.conditions.metric === 'numeric-quota')?.status).toBe('unknown')
  })

  it('records the Oct 23 AWS Batch page outside the canonical 18 and does not cap the worker', () => {
    expect(CANONICAL_VERIFIED_CATALOG_IDS).not.toContain('aws-batch')
    const batch = catalogValuesFor('aws-batch')
    expect(batch).toHaveLength(19)
    expect(batch.every((value) => value.retrievedOn === '2026-10-23')).toBe(true)
    expect(batch.every((value) => value.sourceUrl.endsWith('/service_limits.html'))).toBe(true)
    expect(batch.every((value) => value.status === 'documented')).toBe(true)
    expect(batch.every((value) => value.limitType === 'hard_limit')).toBe(true)
    expect(batch.every((value) => value.scope === 'region')).toBe(true)
    expect(batch.every((value) => value.caps === undefined)).toBe(true)
    expect(batch.find((value) => value.conditions.metric === 'job-queues')).toMatchObject({ value: 50 })
    expect(batch.find((value) => value.conditions.metric === 'SubmitJob-tps')).toMatchObject({
      value: 50,
      unit: 'tps',
      conditions: { account: 'each', operation: 'SubmitJob' },
    })
    expect(batch.find((value) => value.conditions.metric === 'consumable-resources')?.value).toBe(50_000)
    expect(batch.find((value) => value.conditions.metric === 'jobs-in-SUBMITTED')?.value).toBe(1_000_000)
    expect(batch.find((value) => value.conditions.metric === 'SubmitServiceJob-tps')?.value).toBe(5)
    expect(batch.every((value) => usableAsCeiling(value))).toBe(true)
  })

  it('does not encode the unverified 86,400 s GCP load balancer maximum', () => {
    const gcpLb = catalogValuesFor('gcp-cloud-load-balancing')
    expect(gcpLb.some((value) => value.value === 86_400)).toBe(false)
    expect(gcpLb.find((value) => value.conditions.metric === 'backend-timeout-default')?.value).toBe(30)
  })
})

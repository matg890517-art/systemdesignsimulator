import type { CatalogValue, CatalogValueCap, CatalogValueScope, CatalogValueStatus, LimitType } from '@sds/engine'
import { catalogEntries, catalogReadOn } from './entries.ts'

/**
 * Canonical 18 Verified = Components by provider counts (AWS 9 + Azure 4 + GCP 5).
 * The Verified-limits table is a figure reading: it splits SQS and includes
 * Azure Load Balancer, which is Partial, not one of these 18.
 */
export const CANONICAL_VERIFIED_CATALOG_IDS = [
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
] as const

/** Partial services that still have a recorded figure (idle timeout). Not Verified. */
export const PARTIAL_RECORDED_CATALOG_IDS = ['azure-load-balancer'] as const

type Draft = {
  value?: number
  unit: string
  scope: CatalogValueScope
  limitType: LimitType
  conditions: Record<string, string>
  status: CatalogValueStatus
  caps?: CatalogValueCap
  note?: string
}

function docs(id: string): string {
  const entry = catalogEntries.find((item) => item.id === id)
  if (!entry) throw new Error(`catalog entry missing: ${id}`)
  return entry.docsUrl
}

function rows(id: string, drafts: Draft[], retrievedOn: string = catalogReadOn): CatalogValue[] {
  const sourceUrl = docs(id)
  return drafts.map((draft) => ({ ...draft, sourceUrl, retrievedOn }))
}

function unknown(metric: string, note: string, scope: CatalogValueScope = 'service'): Draft {
  return {
    unit: 'count',
    scope,
    limitType: 'quota_adjustability_unknown',
    conditions: { metric },
    status: 'unknown',
    note,
  }
}

/**
 * Sourced from the Full Plan only. Vendor figure / documented, never Measured.
 * Omit value when the plan does not state a number. Do not invent a quota.
 */
export const verifiedCatalogValues: Record<string, CatalogValue[]> = {
  // Pattern: RDS. sourceUrl + retrievedOn from full plan.md (CHAP_Limits.html, 2026-10-20).
  'aws-rds': rows('aws-rds', [
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'multi-az-instance', role: 'failover-only' },
      status: 'documented',
      note: 'Multi-AZ instance is failover only.',
    },
    {
      unit: 'count',
      scope: 'cluster',
      limitType: 'documented_behavior',
      conditions: { metric: 'multi-az-cluster', role: 'serves-reads' },
      status: 'documented',
      note: 'Multi-AZ cluster also serves reads.',
    },
    {
      value: 15,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'read-replicas-per-primary' },
      status: 'documented',
      note: '15 read replicas per primary. Plan does not say fixed or adjustable.',
    },
    unknown('per-instance-storage', 'Per-instance storage: the plan does not state a number.'),
    unknown('consistency', 'Consistency: the plan does not state a figure.'),
  ]),

  'aws-ecs': rows('aws-ecs', [
    {
      value: 5_000,
      unit: 'count',
      scope: 'service',
      limitType: 'hard_limit',
      conditions: { metric: 'tasks-per-service' },
      status: 'documented',
      caps: 'servers',
    },
    {
      value: 5_000,
      unit: 'count',
      scope: 'cluster',
      limitType: 'hard_limit',
      conditions: { metric: 'services-per-cluster' },
      status: 'documented',
    },
    {
      value: 10,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'tasks-per-RunTask' },
      status: 'documented',
      note: '10 tasks per RunTask. Plan does not say fixed or adjustable.',
    },
    {
      value: 20,
      unit: 'rps',
      scope: 'account',
      limitType: 'adjustable_quota',
      conditions: { launch: 'fargate', metric: 'RunTask-sustained' },
      status: 'documented',
      caps: 'throughputRps',
    },
    unknown('cooldown-defaults', 'Cooldown defaults: the plan does not state a number.'),
    unknown('warm-up', 'Warm-up: the plan does not state a number.'),
  ]),

  'aws-application-load-balancer': rows('aws-application-load-balancer', [
    {
      value: 60,
      unit: 's',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout-default' },
      status: 'documented',
    },
    {
      value: 1,
      unit: 's',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout', bound: 'min' },
      status: 'documented',
    },
    {
      value: 4_000,
      unit: 's',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout', bound: 'max' },
      status: 'documented',
    },
    {
      value: 1_000,
      unit: 'count',
      scope: 'target',
      limitType: 'adjustable_quota',
      conditions: { metric: 'targets-per-alb' },
      status: 'documented',
      caps: 'servers',
    },
    {
      value: 50,
      unit: 'count',
      scope: 'service',
      limitType: 'adjustable_quota',
      conditions: { metric: 'listeners' },
      status: 'documented',
    },
    {
      value: 100,
      unit: 'count',
      scope: 'service',
      limitType: 'adjustable_quota',
      conditions: { metric: 'rules' },
      status: 'documented',
    },
    unknown('scaling-time', 'Scaling time: the plan does not state a number.'),
    unknown('connection-rate', 'Connection rate: the plan does not state a number.'),
  ]),

  'aws-sqs': rows('aws-sqs', [
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { variant: 'standard', metric: 'delivery' },
      status: 'documented',
      note: 'At-least-once delivery.',
    },
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'best_effort_target',
      conditions: { variant: 'standard', metric: 'order' },
      status: 'documented',
      note: 'Best-effort order.',
    },
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { variant: 'standard', metric: 'api-calls' },
      status: 'documented',
      note: 'Nearly unlimited API calls. Not a number.',
    },
    unknown('numeric-quota', 'Numeric quota: the plan does not state a number.', 'queue'),
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { variant: 'fifo', metric: 'order' },
      status: 'documented',
      note: 'Strict order within a message group.',
    },
    {
      value: 5,
      unit: 'min',
      scope: 'message',
      limitType: 'documented_behavior',
      conditions: { variant: 'fifo', metric: 'deduplication' },
      status: 'documented',
    },
    {
      value: 3_000,
      unit: 'rps',
      scope: 'queue',
      limitType: 'performance_guidance',
      conditions: { variant: 'fifo', metric: 'messages-per-second', batch: 'batched', partition: 'per-partition' },
      status: 'documented',
    },
    {
      value: 300,
      unit: 'rps',
      scope: 'queue',
      limitType: 'performance_guidance',
      conditions: { variant: 'fifo', metric: 'messages-per-second', batch: 'unbatched', partition: 'per-partition' },
      status: 'documented',
    },
    {
      value: 120_000,
      unit: 'count',
      scope: 'queue',
      limitType: 'quota_adjustability_unknown',
      conditions: { variant: 'fifo', metric: 'in-flight' },
      status: 'documented',
      note: '120,000 in flight. Plan does not say fixed or adjustable.',
    },
    unknown('regional-total', 'Regional total: the plan does not state a number.', 'region'),
  ]),

  'aws-elasticache': rows('aws-elasticache', [
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'replication' },
      status: 'documented',
      note: 'Asynchronous replication.',
    },
    {
      unit: 's',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'writes-after-failover' },
      status: 'documented',
      note: 'Writes resume in seconds after failover. Plan does not state a number of seconds.',
    },
    {
      value: 65_000,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'clients', variant: 'serverless' },
      status: 'documented',
      note: 'Serverless caches 65,000 clients. Plan does not say fixed or adjustable.',
    },
    unknown('node-based-connections', 'Node-based connections: the plan does not state a number.'),
    unknown('eviction', 'Eviction: the plan does not state a figure.'),
  ]),

  'aws-memorydb': rows('aws-memorydb', [
    {
      unit: 'count',
      scope: 'cluster',
      limitType: 'documented_behavior',
      conditions: { metric: 'transaction-log' },
      status: 'documented',
      note: 'Multi-AZ transaction log.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'failover-durability' },
      status: 'documented',
      note: 'No data lost on failover.',
    },
    unknown('node-sizes', 'Node sizes: the plan does not state a number.'),
    unknown('connections', 'Connections: the plan does not state a number.'),
    unknown('eviction', 'Eviction: the plan does not state a figure.'),
  ]),

  'aws-aurora': rows('aws-aurora', [
    {
      value: 15,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'replicas' },
      status: 'documented',
      note: 'Up to 15 replicas. Plan does not say fixed or adjustable.',
    },
    {
      value: 60,
      unit: 's',
      scope: 'service',
      limitType: 'performance_guidance',
      conditions: { metric: 'failover' },
      status: 'documented',
      note: 'Failover usually under 60 s.',
    },
    unknown('mysql-connection-defaults', 'MySQL connection defaults by class: the plan does not state a number.'),
    {
      value: 128,
      unit: 'TiB',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'storage', variant: '128-TiB' },
      status: 'documented',
      note: 'Storage 128 or 256 TiB; pages differ. Plan does not say which pages map to which.',
    },
    {
      value: 256,
      unit: 'TiB',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'storage', variant: '256-TiB' },
      status: 'documented',
      note: 'Storage 128 or 256 TiB; pages differ. Plan does not say which pages map to which.',
    },
  ]),

  'aws-lambda': rows(
    'aws-lambda',
    [
      {
        value: 900,
        unit: 's',
        scope: 'function',
        limitType: 'hard_limit',
        conditions: { metric: 'timeout', executionModel: 'ordinary' },
        status: 'documented',
        note: 'M6: 900 s applies to ordinary functions only.',
      },
      {
        value: 5_400,
        unit: 's',
        scope: 'invocation',
        limitType: 'hard_limit',
        conditions: {
          metric: 'timeout',
          executionModel: 'managed-instances',
          invocation: 'async-or-event-source-mapping',
        },
        status: 'documented',
        note: 'M6: Managed Instances allow 5,400 s for asynchronous and event-source-mapping invocations.',
      },
      {
        unit: 'count',
        scope: 'account',
        limitType: 'adjustable_quota',
        conditions: { metric: 'concurrency' },
        status: 'unknown',
        note: 'M1: Lambda concurrency is adjustable. The plan does not state a number.',
      },
    ],
    '2026-10-18',
  ),

  'aws-cloudfront': rows('aws-cloudfront', [
    {
      unit: 'count',
      scope: 'distribution',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'quotas' },
      status: 'unknown',
      note: 'Oct 18 spot check verified the service. The plan does not state a CloudFront number.',
    },
  ]),

  'azure-aks': rows('azure-aks', [
    {
      value: 5_000,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'nodes' },
      status: 'documented',
      note: '5,000 nodes. Plan does not say fixed or adjustable.',
    },
    {
      value: 1_000,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'nodes-per-pool' },
      status: 'documented',
      note: '1,000 per pool. Plan does not say fixed or adjustable.',
    },
    {
      value: 100,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'pools' },
      status: 'documented',
      note: '100 pools. Plan does not say fixed or adjustable.',
    },
    {
      value: 250,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'pods-per-node' },
      status: 'documented',
      note: '250 pods per node. Plan does not say fixed or adjustable.',
    },
    {
      value: 10,
      unit: 's',
      scope: 'cluster',
      limitType: 'configurable_setting',
      conditions: { metric: 'autoscaler-scan' },
      status: 'documented',
    },
    unknown('scale-up-time', 'Scale-up time: the plan does not state a number.', 'cluster'),
  ]),

  'azure-azure-sql': rows('azure-azure-sql', [
    {
      value: 30_000,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'sessions' },
      status: 'documented',
      note: '30,000 sessions. Plan does not say fixed or adjustable.',
    },
    {
      value: 150,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'workers', tier: 'serverless-general-purpose', stated: '150' },
      status: 'documented',
      note: '150 workers (serverless General Purpose). Plan does not say which of 150/600 is min or max.',
    },
    {
      value: 600,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'workers', tier: 'serverless-general-purpose', stated: '600' },
      status: 'documented',
      note: '600 workers (serverless General Purpose). Plan does not say which of 150/600 is min or max.',
    },
    {
      value: 3,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'secondaries', tier: 'business-critical' },
      status: 'documented',
      note: 'Business Critical up to 3 secondaries. Plan does not say fixed or adjustable.',
    },
    unknown('failover-time', 'Failover time: the plan does not state a number.'),
    unknown('other-tiers', 'Other tiers: the plan does not state figures.'),
  ]),

  'azure-cache-for-redis': rows('azure-cache-for-redis', [
    {
      value: 256,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'connections', bound: 'min', by: 'tier' },
      status: 'documented',
      note: 'Connections 256 to 40,000 by tier. Plan does not map a number to a tier.',
    },
    {
      value: 40_000,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'connections', bound: 'max', by: 'tier' },
      status: 'documented',
      note: 'Connections 256 to 40,000 by tier. Plan does not map a number to a tier.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'eviction', policy: 'volatile-lru' },
      status: 'documented',
      note: 'volatile-lru.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'replication' },
      status: 'documented',
      note: 'Asynchronous replication.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'retirement', variant: 'basic-standard-premium' },
      status: 'documented',
      note: 'Basic, Standard, Premium retire Sep 30, 2028.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'retirement', variant: 'enterprise' },
      status: 'documented',
      note: 'Enterprise retires Mar 31, 2027.',
    },
  ]),

  'azure-service-bus': rows('azure-service-bus', [
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { metric: 'delivery', mode: 'peek-lock' },
      status: 'documented',
      note: 'Peek-lock at-least-once.',
    },
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { metric: 'order', mode: 'sessions' },
      status: 'documented',
      note: 'Sessions give ordering.',
    },
    unknown('throughput-quota', 'Throughput quota: the plan does not state a number.', 'queue'),
  ]),

  'azure-load-balancer': rows('azure-load-balancer', [
    {
      value: 4,
      unit: 'min',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout-default' },
      status: 'documented',
      note: 'Partial: idle timeout 4 min default. Not one of the 18 Verified services.',
    },
    {
      value: 4,
      unit: 'min',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout', bound: 'min' },
      status: 'documented',
    },
    {
      value: 100,
      unit: 'min',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout', bound: 'max' },
      status: 'documented',
    },
    {
      value: 4,
      unit: 'min',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout-outbound', bound: 'min' },
      status: 'documented',
    },
    {
      value: 120,
      unit: 'min',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout-outbound', bound: 'max' },
      status: 'documented',
    },
    unknown('limits', 'Limits (beyond idle timeout): the plan does not state a number.'),
    unknown('scaling', 'Scaling: the plan does not state a number.'),
  ]),

  'gcp-cloud-load-balancing': rows('gcp-cloud-load-balancing', [
    {
      value: 30,
      unit: 's',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'backend-timeout-default' },
      status: 'documented',
      note: 'ChatGPT 86,400 s maximum stays unverified.',
    },
    {
      value: 50,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'backends-per-backend-service' },
      status: 'documented',
      note: '50 backends per backend service. Plan does not say fixed or adjustable.',
    },
    unknown('connection-rate', 'Connection rate: the plan does not state a number.'),
    unknown('scaling', 'Scaling: the plan does not state a number.'),
  ]),

  'gcp-gke': rows('gcp-gke', [
    {
      value: 65_000,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'nodes', mode: 'standard' },
      status: 'documented',
      note: 'Standard 65,000 nodes. Plan does not say fixed or adjustable.',
    },
    {
      value: 5_000,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'nodes', mode: 'autopilot' },
      status: 'documented',
      note: 'Autopilot 5,000. Plan does not say fixed or adjustable.',
    },
    {
      value: 512,
      unit: 'count',
      scope: 'cluster',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'pods-per-node' },
      status: 'documented',
      note: '512 pods per node. Plan does not say fixed or adjustable.',
    },
    unknown('autoscaler-timing', 'Autoscaler timing: the plan does not state a number.', 'cluster'),
  ]),

  'gcp-pub-sub': rows('gcp-pub-sub', [
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { metric: 'delivery' },
      status: 'documented',
      note: 'At-least-once.',
    },
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { metric: 'order' },
      status: 'documented',
      note: 'Optional ordering.',
    },
    {
      unit: 'count',
      scope: 'queue',
      limitType: 'documented_behavior',
      conditions: { metric: 'exactly-once' },
      status: 'documented',
      note: 'Exactly-once supported.',
    },
    {
      value: 4,
      unit: 'GB/s',
      scope: 'region',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'publish', regionClass: 'large' },
      status: 'documented',
      note: '4 GB/s per region publish in large regions. Plan does not say fixed or adjustable.',
    },
  ]),

  'gcp-memorystore': rows('gcp-memorystore', [
    {
      value: 65_000,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'clients' },
      status: 'documented',
      note: '65,000 clients. Plan does not say fixed or adjustable.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'replication' },
      status: 'documented',
      note: 'Asynchronous.',
    },
    {
      value: 30,
      unit: 's',
      scope: 'service',
      limitType: 'performance_guidance',
      conditions: { metric: 'unavailable-on-repair' },
      status: 'documented',
      note: 'About 30 s unavailable on repair.',
    },
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'acknowledged-writes' },
      status: 'documented',
      note: 'Acknowledged writes can be lost.',
    },
    unknown('memory-sizes', 'Memory sizes: the plan does not state a number.'),
  ]),

  'gcp-cloud-sql': rows('gcp-cloud-sql', [
    {
      unit: 'count',
      scope: 'service',
      limitType: 'documented_behavior',
      conditions: { metric: 'ha' },
      status: 'documented',
      note: 'Synchronous HA.',
    },
    {
      value: 60,
      unit: 's',
      scope: 'service',
      limitType: 'performance_guidance',
      conditions: { metric: 'failover' },
      status: 'documented',
      note: 'About 60 s failover.',
    },
    {
      value: 262_142,
      unit: 'count',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'connections', engine: 'postgresql' },
      status: 'documented',
      note: 'PostgreSQL connection sum up to 262,142. Plan does not say fixed or adjustable.',
    },
    {
      value: 64,
      unit: 'TB',
      scope: 'service',
      limitType: 'quota_adjustability_unknown',
      conditions: { metric: 'storage' },
      status: 'documented',
      note: 'Storage up to 64 TB. Plan does not say fixed or adjustable.',
    },
    unknown('standby-reads', 'Standby reads: the plan does not state a figure.'),
    unknown('consistency', 'Consistency: the plan does not state a figure.'),
  ]),
}

export function catalogValuesFor(catalogId?: string): CatalogValue[] {
  if (!catalogId) return []
  return verifiedCatalogValues[catalogId] ?? []
}

export function catalogValueKey(value: CatalogValue): string {
  return [
    value.conditions.metric,
    value.conditions.variant,
    value.conditions.bound,
    value.conditions.launch,
    value.conditions.mode,
    value.conditions.tier,
    value.conditions.stated,
    value.conditions.executionModel,
    value.value ?? 'unknown',
    value.limitType,
  ].join(':')
}

export function formatCatalogValue(value: CatalogValue): string {
  const kind = value.limitType.replaceAll('_', ' ')
  if (value.value === undefined) return `unknown · ${kind}`
  return `${value.value.toLocaleString('en-US')} ${value.unit} · ${kind}`
}

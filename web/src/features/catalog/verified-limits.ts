import type { CatalogValue, CatalogValueCap, CatalogValueScope, CatalogValueStatus, LimitType } from '@sds/engine'
import { catalogEntries, catalogReadOn } from './entries.ts'

/**
 * Canonical 18 = the first provider compare (Decision 3, amended Oct 23).
 * Later page readings (AWS Batch, Oct 23) are recorded figures and can be
 * Verified in the status table without joining this list.
 * The figure table also includes Azure Load Balancer, which is Partial.
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

/** A figure quoted from a supplied official page. No engine cap is attached. */
function pageFigure(
  metric: string,
  value: number | undefined,
  unit: string,
  scope: CatalogValueScope,
  limitType: LimitType,
  note: string,
  extra: Record<string, string> = {},
): Draft {
  return {
    ...(value === undefined ? {} : { value }),
    unit,
    scope,
    limitType,
    conditions: { metric, ...extra },
    status: value === undefined && limitType !== 'documented_behavior' ? 'unknown' : 'documented',
    note,
  }
}

/** AWS Batch service quotas page: unchanged, and each quota is Region specific. */
function batchQuota(
  metric: string,
  value: number,
  unit: string,
  note: string,
  extra: Record<string, string> = {},
): Draft {
  return {
    value,
    unit,
    scope: 'region',
    limitType: 'hard_limit',
    conditions: { metric, ...extra },
    status: 'documented',
    note: `${note} Unchanged quota. Each quota is Region specific. Not applied as worker throughput or server count.`,
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

  // Lambda quotas page, supplied 2026-10-23. Confirms the Oct 18 timeouts and states concurrency.
  // The file has no date line. MB on that page means 1,024 KB. No caps: these are not wired as throughput.
  'aws-lambda': rows(
    'aws-lambda',
    [
      pageFigure('concurrent-executions', 1_000, 'count', 'region', 'adjustable_quota', 'Default concurrent executions per Region. The page says this can be increased up to tens of thousands, which is not a number. New accounts have reduced concurrency; the page states no reduced figure. Not wired as server count.'),
      pageFigure('code-storage-zip', 300, 'GB', 'region', 'hard_limit', 'Storage for uploaded .zip functions and layers. Unzipped. Not increasable. The page says MB means 1,024 KB; this row is the page’s GB figure.'),
      pageFigure('container-image-storage', undefined, 'count', 'region', 'quota_adjustability_unknown', 'Storage for container-image functions is Amazon ECR. This page states no number.'),
      pageFigure('eni-per-vpc', 3_000, 'count', 'service', 'adjustable_quota', 'Elastic network interfaces per VPC, shared with other services such as EFS, regardless of Region. The page says this can be increased up to thousands, which is not a number.'),
      pageFigure('memory', 128, 'MB', 'function', 'configurable_setting', 'Minimum function memory. 1 MB increments. The page’s MB means 1,024 KB.', { bound: 'min' }),
      pageFigure('memory', 10_240, 'MB', 'function', 'hard_limit', 'Maximum function memory. The configuration quotas cannot be changed except as noted.', { bound: 'max' }),
      pageFigure('memory-one-vcpu', 1_769, 'MB', 'function', 'documented_behavior', 'At 1,769 MB a function has the equivalent of one vCPU.'),
      pageFigure('timeout', 900, 's', 'function', 'hard_limit', '900 seconds (15 minutes) for an ordinary function. Confirms the Oct 18 reading.', { executionModel: 'ordinary' }),
      pageFigure('timeout', 5_400, 's', 'invocation', 'hard_limit', 'Managed Instances: 5,400 seconds (90 minutes) for asynchronous invocations and event source mappings, except Amazon MQ and Amazon DocumentDB. Confirms the Oct 18 reading.', { executionModel: 'managed-instances', invocation: 'async-or-event-source-mapping' }),
      pageFigure('environment-variables', 4, 'KB', 'function', 'hard_limit', 'All environment variables for the function, in aggregate.'),
      pageFigure('resource-based-policy', 20, 'KB', 'function', 'hard_limit', 'Function resource-based policy.'),
      pageFigure('layers', 5, 'count', 'function', 'hard_limit', 'Function layers.'),
      pageFigure('concurrency-scaling', 1_000, 'count', 'function', 'hard_limit', 'For each function, 1,000 execution environments every 10 seconds.'),
      pageFigure('invocation-payload', 6, 'MB', 'invocation', 'hard_limit', 'Synchronous request payload.', { mode: 'synchronous', stated: 'request' }),
      pageFigure('invocation-payload', 6, 'MB', 'invocation', 'hard_limit', 'Synchronous response payload.', { mode: 'synchronous', stated: 'response' }),
      pageFigure('invocation-payload', 200, 'MB', 'invocation', 'hard_limit', 'Synchronous streamed response.', { mode: 'synchronous', stated: 'streamed-response' }),
      pageFigure('invocation-payload', 1, 'MB', 'invocation', 'hard_limit', 'Asynchronous invocation payload.', { mode: 'asynchronous' }),
      pageFigure('invocation-payload', 1, 'MB', 'invocation', 'hard_limit', 'Total combined size of the request line and header values.', { stated: 'request-line-and-headers' }),
      pageFigure('streamed-response-uncapped', 6, 'MB', 'invocation', 'documented_behavior', 'Streamed-response bandwidth is uncapped for the first 6 MB.'),
      pageFigure('streamed-response-remainder', 2, 'MBps', 'invocation', 'hard_limit', 'For a streamed response larger than 6 MB, 2 MBps for the remainder.'),
      pageFigure('network-bandwidth', 625, 'Mbps', 'function', 'hard_limit', 'Network bandwidth per execution environment when the function is attached to a VPC. The increase described on the page is for functions not attached to a VPC.', { vpc: 'attached' }),
      pageFigure('network-bandwidth', 625, 'Mbps', 'function', 'adjustable_quota', 'Default network bandwidth per execution environment. Functions not attached to a VPC can request an increase. After approval, bandwidth scales with memory from 2,048 MB.', { vpc: 'not-attached', bound: 'default' }),
      pageFigure('network-bandwidth', 3_000, 'Mbps', 'function', 'adjustable_quota', 'Maximum network bandwidth after an approved increase, at 10,240 MB, for functions not attached to a VPC.', { vpc: 'not-attached', bound: 'max' }),
      pageFigure('deployment-package', 50, 'MB', 'function', 'hard_limit', 'Zipped deployment package uploaded through the Lambda API or SDKs. Larger files use Amazon S3.', { stated: 'zipped-api' }),
      pageFigure('deployment-package', 50, 'MB', 'function', 'hard_limit', 'Deployment package uploaded through the Lambda console.', { stated: 'console' }),
      pageFigure('deployment-package', 250, 'MB', 'function', 'hard_limit', 'Maximum unzipped deployment package, including layers and custom runtimes.', { stated: 'unzipped' }),
      pageFigure('container-image-settings', 16, 'KB', 'function', 'hard_limit', 'Container image settings size.'),
      pageFigure('container-image-code', 10, 'GB', 'function', 'hard_limit', 'Maximum uncompressed container image, including all layers.'),
      pageFigure('test-events', 10, 'count', 'function', 'hard_limit', 'Test events in the console editor.'),
      pageFigure('tmp-storage', 512, 'MB', 'function', 'configurable_setting', 'Minimum /tmp directory storage. 1 MB increments.', { bound: 'min' }),
      pageFigure('tmp-storage', 10_240, 'MB', 'function', 'hard_limit', 'Maximum /tmp directory storage.', { bound: 'max' }),
      pageFigure('file-descriptors', 1_024, 'count', 'function', 'hard_limit', 'File descriptors.', { executionModel: 'ordinary' }),
      pageFigure('file-descriptors', 4_096, 'count', 'function', 'hard_limit', 'Lambda Managed Instances file descriptors.', { executionModel: 'managed-instances' }),
      pageFigure('processes-and-threads', 1_024, 'count', 'function', 'hard_limit', 'Execution processes and threads.', { executionModel: 'ordinary' }),
      pageFigure('processes-and-threads', undefined, 'count', 'function', 'quota_adjustability_unknown', 'Lambda Managed Instances use Bottlerocket default process and thread limits. This page states no number.', { executionModel: 'managed-instances' }),
      pageFigure('sync-invocations-per-environment', 10, 'rps', 'function', 'quota_adjustability_unknown', 'Each execution environment can serve up to 10 synchronous requests per second. The page says the total invocation limit is 10 times the concurrency limit. It does not say whether this 10 can be changed.'),
      pageFigure('async-invocations-per-environment', undefined, 'rps', 'function', 'documented_behavior', 'Each execution environment can serve an unlimited number of asynchronous requests. The total limit is the concurrency available to the function.'),
      pageFigure('provisioned-concurrency-invocation-multiplier', 10, 'multiple', 'function', 'quota_adjustability_unknown', 'Invocation requests per function version or alias are 10 times allocated provisioned concurrency. Applies only to functions that use provisioned concurrency. The page does not say whether this multiplier can be changed.'),
      pageFigure('GetFunction', 100, 'rps', 'region', 'hard_limit', 'GetFunction API requests per second. Cannot be increased.'),
      pageFigure('GetPolicy', 15, 'rps', 'region', 'hard_limit', 'GetPolicy API requests per second. Cannot be increased.'),
      pageFigure('control-plane-api', 15, 'rps', 'region', 'hard_limit', 'Remainder of the control-plane API requests, excluding invocation, GetFunction, and GetPolicy. 15 requests per second across all of those APIs, not per API. Cannot be increased.'),
      pageFigure('durable-running-executions', 5_000_000, 'count', 'region', 'adjustable_quota', 'Maximum running durable executions per Region. Soft limit.', { variant: 'default' }),
      pageFigure('durable-running-executions', 10_000_000, 'count', 'region', 'adjustable_quota', 'Maximum running durable executions in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('durable-operations-per-execution', 30_000, 'count', 'region', 'hard_limit', 'Maximum durable operations per durable execution. Cannot be increased.'),
      pageFigure('durable-storage-written', 100, 'MB', 'region', 'hard_limit', 'Durable execution storage written. Cannot be increased. Cumulative payload size persisted per execution.'),
      pageFigure('durable-operation-payload', 1, 'MB', 'region', 'hard_limit', 'Maximum payload size per durable operation. Cannot be increased. Checkpoint and callback payloads.'),
      pageFigure('durable-initiate-rps', 3_000, 'rps', 'region', 'adjustable_quota', 'Function invocation rate to initiate durable executions.', { variant: 'default' }),
      pageFigure('durable-initiate-rps', 6_000, 'rps', 'region', 'adjustable_quota', 'Function invocation rate to initiate durable executions in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('CheckpointDurableExecution', 10_000, 'rps', 'region', 'adjustable_quota', 'CheckpointDurableExecution requests per second.', { variant: 'default' }),
      pageFigure('CheckpointDurableExecution', 20_000, 'rps', 'region', 'adjustable_quota', 'CheckpointDurableExecution requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('GetDurableExecution', 30, 'rps', 'region', 'adjustable_quota', 'GetDurableExecution requests per second. The durable section says quotas can be increased except as noted, and this row is not marked otherwise.'),
      pageFigure('GetDurableExecutionHistory', 15, 'rps', 'region', 'adjustable_quota', 'GetDurableExecutionHistory requests per second.'),
      pageFigure('GetDurableExecutionState', 10_000, 'rps', 'region', 'adjustable_quota', 'GetDurableExecutionState requests per second.', { variant: 'default' }),
      pageFigure('GetDurableExecutionState', 20_000, 'rps', 'region', 'adjustable_quota', 'GetDurableExecutionState requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('ListDurableExecutionsByFunction', 15, 'rps', 'region', 'adjustable_quota', 'ListDurableExecutionsByFunction requests per second.'),
      pageFigure('SendDurableExecutionCallbackFailure', 3_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackFailure requests per second.', { variant: 'default' }),
      pageFigure('SendDurableExecutionCallbackFailure', 6_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackFailure requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('SendDurableExecutionCallbackHeartbeat', 3_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackHeartbeat requests per second.', { variant: 'default' }),
      pageFigure('SendDurableExecutionCallbackHeartbeat', 6_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackHeartbeat requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('SendDurableExecutionCallbackSuccess', 3_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackSuccess requests per second.', { variant: 'default' }),
      pageFigure('SendDurableExecutionCallbackSuccess', 6_000, 'rps', 'region', 'adjustable_quota', 'SendDurableExecutionCallbackSuccess requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('StopDurableExecution', 300, 'rps', 'region', 'adjustable_quota', 'StopDurableExecution requests per second.', { variant: 'default' }),
      pageFigure('StopDurableExecution', 600, 'rps', 'region', 'adjustable_quota', 'StopDurableExecution requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland).', { variant: 'iad-pdx-dub' }),
      pageFigure('microvm-memory', 400, 'GB', 'region', 'adjustable_quota', 'Memory allocated across all MicroVMs per account per Region. The page’s examples (200 MicroVMs at 2 GB, or 400 at 1 GB) illustrate this quota. Burstable up to four times.', { variant: 'default' }),
      pageFigure('microvm-memory', 1_024, 'GB', 'region', 'adjustable_quota', 'MicroVM memory in US East (N. Virginia), US West (Oregon), US East (Ohio), and Asia Pacific (Tokyo).', { variant: 'iad-pdx-cmh-nrt' }),
      pageFigure('microvm-memory-burst-multiple', 4, 'multiple', 'region', 'adjustable_quota', 'MicroVM memory is burstable up to four times the memory quota.'),
      pageFigure('microvm-execution-duration', 28_800, 's', 'function', 'hard_limit', 'Maximum MicroVM execution duration, 8 hours. Not adjustable.'),
      pageFigure('microvm-images', 100, 'count', 'region', 'adjustable_quota', 'MicroVM images per account per Region.'),
      pageFigure('microvm-image-versions', 50, 'count', 'region', 'adjustable_quota', 'Versions per MicroVM image.'),
      pageFigure('microvm-concurrent-builds', 5, 'count', 'region', 'adjustable_quota', 'Concurrent MicroVM image builds per account per Region.', { variant: 'default' }),
      pageFigure('microvm-concurrent-builds', 10, 'count', 'region', 'adjustable_quota', 'Concurrent MicroVM image builds in US East (N. Virginia), US West (Oregon), US East (Ohio), and Asia Pacific (Tokyo).', { variant: 'iad-pdx-cmh-nrt' }),
      pageFigure('microvm-concurrent-connections', 8, 'count', 'function', 'hard_limit', 'Concurrent connections per MicroVM at 1 vCPU. Not adjustable.', { variant: '1-vcpu' }),
      pageFigure('microvm-concurrent-connections', 16, 'count', 'function', 'hard_limit', 'Concurrent connections per MicroVM at 2 vCPU.', { variant: '2-vcpu' }),
      pageFigure('microvm-concurrent-connections', 32, 'count', 'function', 'hard_limit', 'Concurrent connections per MicroVM at 4 vCPU.', { variant: '4-vcpu' }),
      pageFigure('microvm-concurrent-connections', 64, 'count', 'function', 'hard_limit', 'Concurrent connections per MicroVM at 8 vCPU.', { variant: '8-vcpu' }),
      pageFigure('microvm-concurrent-connections', 128, 'count', 'function', 'hard_limit', 'Concurrent connections per MicroVM at 16 vCPU.', { variant: '16-vcpu' }),
      pageFigure('microvm-requests-per-second', 40, 'rps', 'function', 'hard_limit', 'Requests per second per MicroVM at 4 vCPU / 8 GB. Not adjustable.', { variant: '4-vcpu-8-gb' }),
      pageFigure('microvm-requests-per-second', 160, 'rps', 'function', 'hard_limit', 'Requests per second per MicroVM at 16 vCPU / 32 GB. Not adjustable.', { variant: '16-vcpu-32-gb' }),
      pageFigure('RunMicrovm', 5, 'tps', 'region', 'adjustable_quota', 'RunMicrovm rate and burst are both 5 transactions per second. Per account per Region.'),
      pageFigure('ResumeMicrovm', 5, 'tps', 'region', 'adjustable_quota', 'ResumeMicrovm rate and burst are both 5 transactions per second. Per account per Region.'),
      pageFigure('SuspendMicrovm', 2, 'tps', 'region', 'adjustable_quota', 'SuspendMicrovm rate and burst are both 2 transactions per second. Per account per Region.'),
      pageFigure('TerminateMicrovm', 10, 'tps', 'region', 'adjustable_quota', 'TerminateMicrovm rate and burst are both 10 transactions per second. Per account per Region.'),
      pageFigure('GetMicrovm', 100, 'tps', 'region', 'adjustable_quota', 'GetMicrovm rate and burst are both 100 transactions per second. Per account per Region.'),
      pageFigure('CreateMicrovmAuthToken', 50, 'tps', 'region', 'adjustable_quota', 'CreateMicrovmAuthToken rate and burst are both 50 transactions per second. Per account per Region.'),
      pageFigure('CreateMicrovmShellAuthToken', 5, 'tps', 'region', 'adjustable_quota', 'CreateMicrovmShellAuthToken rate and burst are both 5 transactions per second. Per account per Region.'),
      pageFigure('web-endpoints', 10, 'count', 'function', 'hard_limit', 'Endpoints per Web Function. Not adjustable.'),
      pageFigure('web-revisions', 50, 'count', 'function', 'best_effort_target', 'Revisions per Web Function. Automatic cleanup target. The page says the count can temporarily exceed 50. Not adjustable.'),
      pageFigure('web-deployment-package', 512, 'MB', 'function', 'hard_limit', 'Web Function deployment package, unzipped. Not adjustable.'),
      pageFigure('web-environment-variables', 32, 'KB', 'function', 'hard_limit', 'Web Function environment variable size. Not adjustable.'),
      pageFigure('web-request-header', 128, 'KiB', 'invocation', 'hard_limit', 'Web Function request header size. The page writes KiB. Not adjustable.'),
      pageFigure('web-tmp', 512, 'MB', 'function', 'hard_limit', 'Web Function /tmp directory size. Not adjustable.'),
      pageFigure('web-vcpu', 2, 'count', 'function', 'hard_limit', 'vCPUs per Web Function execution environment. Not adjustable.'),
      pageFigure('web-memory', 2, 'GB', 'function', 'hard_limit', 'Memory per Web Function execution environment. Not adjustable.'),
      pageFigure('web-concurrent-requests', 64, 'count', 'function', 'configurable_setting', 'Default concurrent requests per Web Function environment. The valid range is 1–128.', { bound: 'default' }),
      pageFigure('web-concurrent-requests', 1, 'count', 'function', 'configurable_setting', 'Minimum concurrent requests per Web Function environment.', { bound: 'min' }),
      pageFigure('web-concurrent-requests', 128, 'count', 'function', 'hard_limit', 'Maximum concurrent requests per Web Function environment. Not adjustable.', { bound: 'max' }),
      pageFigure('web-request-timeout', 30, 's', 'invocation', 'configurable_setting', 'Default Web Function request timeout. The valid range is 3–900 seconds.', { bound: 'default' }),
      pageFigure('web-request-timeout', 3, 's', 'invocation', 'configurable_setting', 'Minimum Web Function request timeout.', { bound: 'min' }),
      pageFigure('web-request-timeout', 900, 's', 'invocation', 'hard_limit', 'Maximum Web Function request timeout. Not adjustable.', { bound: 'max' }),
      pageFigure('web-initialization-timeout', 10, 's', 'function', 'hard_limit', 'Time for the Web Function server to start listening. Not adjustable.'),
      pageFigure('web-file-descriptors', 1_024, 'count', 'function', 'hard_limit', 'File descriptors per Web Function execution environment. Not adjustable.'),
      pageFigure('web-processes-and-threads', 1_024, 'count', 'function', 'hard_limit', 'Processes and threads per Web Function execution environment. Not adjustable.'),
      pageFigure('web-endpoint-environments', 2, 'count', 'function', 'hard_limit', 'Minimum valid maxEnvironments per endpoint. Not set by default. Not adjustable.', { bound: 'min' }),
      pageFigure('web-endpoint-environments', 10_000, 'count', 'function', 'hard_limit', 'Maximum environments per endpoint. Not set by default. Enforced in each Region. The account vCPU quota can limit an endpoint to fewer environments. Not adjustable.', { bound: 'max' }),
      pageFigure('web-endpoint-rate', 10_000, 'rps', 'region', 'hard_limit', 'Per-endpoint request rate that applies when throttleConfig.rateLimit is not set. A setting of 0 blocks all traffic. Allowed settings are 0, 100–1,000 in steps of 100, and 2,000–10,000 in steps of 1,000. Not adjustable.'),
      pageFigure('web-endpoint-revisions', 2, 'count', 'function', 'hard_limit', 'Maximum revisions per endpoint. Not adjustable.'),
      pageFigure('web-revision-weight', 1, 'count', 'function', 'hard_limit', 'Minimum revision weight.', { bound: 'min' }),
      pageFigure('web-revision-weight', 100, 'count', 'function', 'hard_limit', 'Maximum revision weight.', { bound: 'max' }),
      pageFigure('web-account-rps', 100_000, 'rps', 'region', 'adjustable_quota', 'Web Function requests per second per account, in each Region.'),
      pageFigure('web-account-vcpu', 2_000, 'count', 'region', 'adjustable_quota', 'Arm64 vCPUs for Web Function execution environments, per account per Region. Each execution environment uses 2 vCPUs.'),
      pageFigure('web-egress-connectors', 1, 'count', 'function', 'hard_limit', 'Egress network connectors per revision: 0 or 1.'),
      pageFigure('web-endpoint-revisions-routed', 2, 'count', 'function', 'hard_limit', 'Revisions routed by one endpoint: 1 or 2.', { stated: 'routed' }),
      pageFigure('web-public-egress', undefined, 'count', 'function', 'documented_behavior', 'Direct public egress is IPv4 only.'),
      pageFigure('web-privatelink', undefined, 'count', 'function', 'documented_behavior', 'Private endpoint access with AWS PrivateLink is not available.'),
      pageFigure('web-connector-scope', undefined, 'count', 'function', 'documented_behavior', 'An egress connector is a version-qualified ARN in the same account and Region, with exactly one compute resource type, WebFunction. Endpoint types that support connectors are HomeRegion only. Changing a revision’s connector means creating a new revision. Endpoint type and Region set are fixed at endpoint creation.'),
      pageFigure('other-services', undefined, 'count', 'service', 'quota_adjustability_unknown', 'IAM, Lambda@Edge, and VPC quotas are not on this page. The page’s API Gateway example of 10,000 requests per second is not recorded as a Lambda quota.'),
    ],
    '2026-10-23',
  ),

  // Fargate throttling page, supplied 2026-10-23. The file has no date line.
  // Rates are adjustable. Not wired as completed-request throughput.
  'aws-fargate': rows(
    'aws-fargate',
    [
      pageFigure('launch-burst', 100, 'count', 'region', 'adjustable_quota', 'On-Demand token-bucket burst: up to 100 Amazon ECS tasks and Amazon EKS pods per account. A rate increase can be requested. Not wired as completed-request throughput.', { launch: 'on-demand', account: 'each' }),
      pageFigure('launch-sustained', 20, 'launches/s', 'region', 'adjustable_quota', 'On-Demand refill: 20 Amazon ECS tasks and Amazon EKS pods per second. Observed launch rates also depend on image download, health checks, and load balancer registration. The page states no separate figure for that variation.', { launch: 'on-demand', account: 'each' }),
      pageFigure('launch-burst', 100, 'count', 'region', 'adjustable_quota', 'Spot token-bucket burst for Amazon ECS tasks: 100.', { launch: 'spot', account: 'each' }),
      pageFigure('launch-sustained', 20, 'launches/s', 'region', 'adjustable_quota', 'Spot refill for Amazon ECS tasks: 20 per second.', { launch: 'spot', account: 'each' }),
      pageFigure('launch-burst', 20, 'count', 'region', 'adjustable_quota', 'Accounts that launch only Amazon EKS pods have a burst of 20 on the platform versions named on the Amazon EKS platform-versions page. This file does not list those versions.', { launch: 'eks-pods-only', account: 'each' }),
      pageFigure('launch-sustained', 20, 'launches/s', 'region', 'adjustable_quota', 'Accounts that launch only Amazon EKS pods have a sustained rate of 20 pod launches per second on those platform versions.', { launch: 'eks-pods-only', account: 'each' }),
      pageFigure('RunTask-api', 20, 'calls/s', 'region', 'adjustable_quota', 'Amazon ECS RunTask API calls per second. Burst and sustained are both 20. Per account per Region.', { account: 'each' }),
      pageFigure('tasks-per-RunTask', 10, 'count', 'invocation', 'quota_adjustability_unknown', 'Each RunTask call can launch up to 10 tasks. The page does not say whether this per-call maximum can be changed.'),
    ],
    '2026-10-23',
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

  // Quoted from the AWS Batch service quotas page, read 2026-10-23.
  // Outside the canonical 18. No caps: SubmitJob TPS is an API rate, not completed jobs.
  'aws-batch': rows(
    'aws-batch',
    [
      batchQuota('job-queues', 50, 'count', 'Maximum number of job queues.'),
      batchQuota(
        'compute-environments-ecs-and-eks',
        50,
        'count',
        'Maximum number of compute environments across Amazon ECS and Amazon EKS.',
      ),
      batchQuota(
        'compute-environments-per-eks-cluster',
        5,
        'count',
        'Maximum number of compute environments per Amazon EKS cluster.',
      ),
      batchQuota(
        'compute-environments-per-job-queue',
        3,
        'count',
        'Maximum number of compute environments for each job queue.',
      ),
      batchQuota('job-dependencies', 20, 'count', 'Maximum number of job dependencies for a job.'),
      batchQuota(
        'job-definition-size',
        24,
        'KiB',
        'Maximum job definition size for RegisterJobDefinition API operations.',
        { operation: 'RegisterJobDefinition' },
      ),
      batchQuota(
        'job-payload-size',
        30,
        'KiB',
        'Maximum job payload size for SubmitJob API operations.',
        { operation: 'SubmitJob' },
      ),
      batchQuota('array-job-size', 10_000, 'count', 'Maximum array size for array jobs.'),
      batchQuota('jobs-in-SUBMITTED', 1_000_000, 'count', 'Maximum number of jobs in SUBMITTED state.'),
      batchQuota(
        'SubmitJob-tps',
        50,
        'tps',
        'Maximum transactions per second for each account for SubmitJob operations.',
        { operation: 'SubmitJob', account: 'each' },
      ),
      batchQuota(
        'consumable-resources',
        50_000,
        'count',
        'Maximum number of consumable resources. The page writes 50k.',
      ),
      batchQuota('service-environments', 50, 'count', 'Maximum number of service environments.'),
      batchQuota(
        'service-environments-per-job-queue',
        1,
        'count',
        'Maximum number of service environments for each job queue.',
      ),
      batchQuota(
        'job-queues-per-quota-management-service-environment',
        1,
        'count',
        'Maximum number of job queues associated for each quota management enabled service environment.',
      ),
      batchQuota(
        'quota-shares-per-quota-management-job-queue',
        20,
        'count',
        'Maximum number of quota shares for each quota management job queue.',
      ),
      batchQuota(
        'SubmitServiceJob-request-size',
        30,
        'KiB',
        'Maximum size of a SubmitServiceJob request.',
        { operation: 'SubmitServiceJob' },
      ),
      batchQuota(
        'SubmitServiceJob-payload-size',
        10,
        'KiB',
        'Maximum job service request payload size for SubmitServiceJob API operations.',
        { operation: 'SubmitServiceJob' },
      ),
      batchQuota(
        'SubmitServiceJob-tps',
        5,
        'tps',
        'Maximum transactions per second for each account for SubmitServiceJob operations.',
        { operation: 'SubmitServiceJob', account: 'each' },
      ),
      batchQuota(
        'service-job-retry-attempts',
        10,
        'count',
        'Maximum number of attempts with retry strategy for a service job.',
      ),
    ],
    '2026-10-23',
  ),
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

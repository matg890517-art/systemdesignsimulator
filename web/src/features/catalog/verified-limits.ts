import type { CatalogValue } from '@sds/engine'

/**
 * Sourced from the Full Plan verified-limits table (read Oct 20, 2026).
 * These are documented vendor figures, not measurements. Only rows with
 * limitType hard_limit or adjustable_quota may cap, and only after applyCatalogCeilings.
 */
export const verifiedCatalogValues: Record<string, CatalogValue[]> = {
  'aws-ecs': [
    {
      value: 5_000,
      unit: 'count',
      scope: 'service',
      limitType: 'hard_limit',
      conditions: { metric: 'tasks-per-service' },
      sourceUrl: 'https://docs.aws.amazon.com/general/latest/gr/ecs-service.html',
      retrievedOn: '2026-10-20',
      status: 'documented',
      caps: 'servers',
    },
    {
      value: 20,
      unit: 'rps',
      scope: 'account',
      limitType: 'adjustable_quota',
      conditions: { launch: 'fargate', metric: 'RunTask-sustained' },
      sourceUrl: 'https://docs.aws.amazon.com/general/latest/gr/ecs-service.html',
      retrievedOn: '2026-10-20',
      status: 'documented',
      caps: 'throughputRps',
    },
  ],
  'aws-application-load-balancer': [
    {
      value: 1_000,
      unit: 'count',
      scope: 'target',
      limitType: 'adjustable_quota',
      conditions: { metric: 'targets-per-alb' },
      sourceUrl:
        'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-limits.html',
      retrievedOn: '2026-10-20',
      status: 'documented',
      caps: 'servers',
    },
    {
      value: 60,
      unit: 's',
      scope: 'target',
      limitType: 'configurable_setting',
      conditions: { metric: 'idle-timeout-default' },
      sourceUrl:
        'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-limits.html',
      retrievedOn: '2026-10-20',
      status: 'documented',
    },
  ],
}

export function catalogValuesFor(catalogId?: string): CatalogValue[] {
  if (!catalogId) return []
  return verifiedCatalogValues[catalogId] ?? []
}

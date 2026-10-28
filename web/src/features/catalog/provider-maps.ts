import type { CatalogProvider } from './types.ts'

export type ReferenceRole =
  | 'clients'
  | 'cdn'
  | 'lb'
  | 'service'
  | 'cache'
  | 'db'
  | 'queue'
  | 'worker'
  | 'object'

export type MappedProvider = 'generic' | Extract<CatalogProvider, 'aws' | 'azure' | 'gcp'>

export type RoleBinding = {
  catalogId: string
  title: string
  provider: MappedProvider
}

/**
 * Same 9-block reference (decision 6) bound to each first-release catalog.
 * Bindings are catalog rows only. Capacities stay Estimated until a lab test exists.
 */
export const referenceBindings: Record<MappedProvider, Record<ReferenceRole, RoleBinding>> = {
  generic: {
    clients: { catalogId: 'generic-clients', title: 'Clients', provider: 'generic' },
    cdn: { catalogId: 'generic-cdn', title: 'CDN', provider: 'generic' },
    lb: { catalogId: 'generic-lb', title: 'Load balancer', provider: 'generic' },
    service: { catalogId: 'generic-service', title: 'Service', provider: 'generic' },
    cache: { catalogId: 'generic-cache', title: 'Cache', provider: 'generic' },
    db: { catalogId: 'generic-db', title: 'Database', provider: 'generic' },
    queue: { catalogId: 'generic-queue', title: 'Queue', provider: 'generic' },
    worker: { catalogId: 'generic-worker', title: 'Worker pool', provider: 'generic' },
    object: { catalogId: 'generic-object', title: 'Object store', provider: 'generic' },
  },
  aws: {
    clients: { catalogId: 'generic-clients', title: 'Clients', provider: 'generic' },
    cdn: { catalogId: 'aws-cloudfront', title: 'CloudFront', provider: 'aws' },
    lb: { catalogId: 'aws-application-load-balancer', title: 'Application Load Balancer', provider: 'aws' },
    service: { catalogId: 'aws-ecs', title: 'ECS', provider: 'aws' },
    cache: { catalogId: 'aws-elasticache', title: 'ElastiCache', provider: 'aws' },
    db: { catalogId: 'aws-rds', title: 'RDS', provider: 'aws' },
    queue: { catalogId: 'aws-sqs', title: 'SQS', provider: 'aws' },
    worker: { catalogId: 'aws-batch', title: 'Batch', provider: 'aws' },
    object: { catalogId: 'aws-s3', title: 'S3', provider: 'aws' },
  },
  azure: {
    clients: { catalogId: 'generic-clients', title: 'Clients', provider: 'generic' },
    cdn: { catalogId: 'azure-front-door', title: 'Front Door', provider: 'azure' },
    lb: { catalogId: 'azure-application-gateway', title: 'Application Gateway', provider: 'azure' },
    service: { catalogId: 'azure-aks', title: 'AKS', provider: 'azure' },
    cache: { catalogId: 'azure-cache-for-redis', title: 'Cache for Redis', provider: 'azure' },
    db: { catalogId: 'azure-database-for-postgresql', title: 'Database for PostgreSQL', provider: 'azure' },
    queue: { catalogId: 'azure-service-bus', title: 'Service Bus', provider: 'azure' },
    worker: { catalogId: 'azure-container-apps', title: 'Container Apps', provider: 'azure' },
    object: { catalogId: 'azure-blob-storage', title: 'Blob Storage', provider: 'azure' },
  },
  gcp: {
    clients: { catalogId: 'generic-clients', title: 'Clients', provider: 'generic' },
    cdn: { catalogId: 'gcp-cloud-cdn', title: 'Cloud CDN', provider: 'gcp' },
    lb: { catalogId: 'gcp-cloud-load-balancing', title: 'Cloud Load Balancing', provider: 'gcp' },
    service: { catalogId: 'gcp-gke', title: 'GKE', provider: 'gcp' },
    cache: { catalogId: 'gcp-memorystore', title: 'Memorystore', provider: 'gcp' },
    db: { catalogId: 'gcp-cloud-sql', title: 'Cloud SQL', provider: 'gcp' },
    queue: { catalogId: 'gcp-pub-sub', title: 'Pub/Sub', provider: 'gcp' },
    worker: { catalogId: 'gcp-cloud-run', title: 'Cloud Run', provider: 'gcp' },
    object: { catalogId: 'gcp-cloud-storage', title: 'Cloud Storage', provider: 'gcp' },
  },
}

export const mappedProviders: MappedProvider[] = ['generic', 'aws', 'azure', 'gcp']

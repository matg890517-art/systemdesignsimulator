# Component verify links and status

Official page for every catalog component, with its status. Every link was read on Oct 20, 2026. A link shows where to look; it does not mean the limits were read. Merged from `component_link.md` (links, limits on page) and `catalog-updated.pdf` (statuses, notes, fixed links).

## Status labels

- **Verified:** limits read and recorded in the Verified limits table or the Oct 18, 2026 AWS spot check (Lambda, SQS, S3, CloudFront).
- **Partial:** the page states some limits but not all, or the figures are guidance rather than quotas.
- **Listed (not checked):** an official limits page exists and is linked, but its figures are not yet recorded in the plan.
- **No limits on page:** the linked official page states no limits (concept or overview pages).

## Counts

| Provider | Services | Verified | Partial | Listed (not checked) | No limits on page |
|---|---|---|---|---|---|
| AWS | 50 | 9 | 1 | 40 | 0 |
| Azure | 44 | 4 | 2 | 36 | 2 |
| Google Cloud | 35 | 5 | 2 | 28 | 0 |
| Kubernetes | 8 | 0 | 1 | 0 | 7 |
| **Total** | **137** | **18** | **6** | **104** | **9** |

## Differences between the two inputs

- The two files list the same 137 services, in the same order, with the same links, except two: GCP Pub/Sub (old `https://docs.cloud.google.com/pubsub/docs/quotas` returned 404, now `https://docs.cloud.google.com/pubsub/quotas`) and GCP Dataproc (renamed by Google to "Managed Service for Apache Spark"; old `https://docs.cloud.google.com/dataproc/quotas`, now `https://docs.cloud.google.com/managed-spark/quotas`). The new links are used below.
- The "Limits on page" value is identical in both files for all 137 services.
- Only the PDF has the Status and Note columns, the counts and the Generic components; they are included below.
- Naming: "Application Load Balancer" everywhere ("ALB" only as a short label). ECR is not a catalog entry.

## AWS (50)

| Category | Service | Official page | Limits on page | Status | Note |
|---|---|---|---|---|---|
| Compute | EC2 | https://docs.aws.amazon.com/general/latest/gr/ec2-service.html | yes | Listed (not checked) |  |
| Compute | Lambda | https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html | yes | Verified |  |
| Compute | Fargate | https://docs.aws.amazon.com/AmazonECS/latest/developerguide/throttling.html | yes | Listed (not checked) | Indirect: ECS throttlingpage (Fargate launchrates). |
| Compute | Batch | https://docs.aws.amazon.com/batch/latest/userguide/service_limits.html | yes | Listed (not checked) |  |
| Compute | App Runner | https://docs.aws.amazon.com/general/latest/gr/apprunner.html | yes | Listed (not checked) |  |
| Compute | Elastic Beanstalk | https://docs.aws.amazon.com/general/latest/gr/elasticbeanstalk.html | yes | Listed (not checked) |  |
| Compute | Lightsail | https://docs.aws.amazon.com/general/latest/gr/lightsail.html | yes | Listed (not checked) |  |
| Containers | ECS | https://docs.aws.amazon.com/general/latest/gr/ecs-service.html | yes | Verified |  |
| Containers | EKS | https://docs.aws.amazon.com/eks/latest/best-practices/known_limits_and_service_quotas.html | yes | Listed (not checked) |  |
| Storage | S3 | https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html | partial | Partial | Performance guidance, notquotas. |
| Storage | EBS | https://docs.aws.amazon.com/ebs/latest/userguide/ebs-resource-quotas.html | yes | Listed (not checked) |  |
| Storage | EFS | https://docs.aws.amazon.com/efs/latest/ug/limits.html | yes | Listed (not checked) |  |
| Storage | FSx | https://docs.aws.amazon.com/fsx/latest/WindowsGuide/limits.html | yes | Listed (not checked) | Indirect: FSx for Windowsonly. |
| Storage | Storage Gateway | https://docs.aws.amazon.com/storagegateway/latest/vgw/resource-gateway-limits.html | yes | Listed (not checked) |  |
| Database | Aurora | https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_Limits.html | yes | Verified |  |
| Database | RDS | https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html | yes | Verified |  |
| Database | DynamoDB | https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html | yes | Listed (not checked) |  |
| Database | DocumentDB | https://docs.aws.amazon.com/documentdb/latest/devguide/limits.html | yes | Listed (not checked) |  |
| Database | Neptune | https://docs.aws.amazon.com/neptune/latest/userguide/limits.html | yes | Listed (not checked) |  |
| Database | Keyspaces | https://docs.aws.amazon.com/keyspaces/latest/devguide/quotas.html | yes | Listed (not checked) |  |
| Database | Timestream | https://docs.aws.amazon.com/timestream/latest/developerguide/ts-limits.html | yes | Listed (not checked) |  |
| Database | Redshift | https://docs.aws.amazon.com/redshift/latest/mgmt/amazon-redshift-limits.html | yes | Listed (not checked) |  |
| Cache | ElastiCache | https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/quota-limits.html | yes | Verified |  |
| Cache | MemoryDB | https://docs.aws.amazon.com/memorydb/latest/devguide/quota-limits.html | yes | Verified |  |
| Network and CDN | CloudFront | https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html | yes | Verified |  |
| Network and CDN | Route 53 | https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/DNSLimitations.html | yes | Listed (not checked) |  |
| Network and CDN | Application LoadBalancer | https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-limits.html | yes | Verified |  |
| Network and CDN | Network LoadBalancer | https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-limits.html | yes | Listed (not checked) |  |
| Network and CDN | API Gateway | https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html | yes | Listed (not checked) |  |
| Network and CDN | Global Accelerator | https://docs.aws.amazon.com/global-accelerator/latest/dg/limits-global-accelerator.html | yes | Listed (not checked) |  |
| Network and CDN | VPC | https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html | yes | Listed (not checked) |  |
| Network and CDN | Direct Connect | https://docs.aws.amazon.com/directconnect/latest/UserGuide/limits.html | yes | Listed (not checked) |  |
| Network and CDN | WAF | https://docs.aws.amazon.com/waf/latest/developerguide/limits.html | yes | Listed (not checked) |  |
| Network and CDN | Shield | https://docs.aws.amazon.com/waf/latest/developerguide/shield-limits.html | yes | Listed (not checked) |  |
| Messaging and integration | SQS | https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html | yes | Verified |  |
| Messaging and integration | SNS | https://docs.aws.amazon.com/general/latest/gr/sns.html | yes | Listed (not checked) |  |
| Messaging and integration | EventBridge | https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-quota.html | yes | Listed (not checked) |  |
| Messaging and integration | Kinesis DataStreams | https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html | yes | Listed (not checked) |  |
| Messaging and integration | MSK | https://docs.aws.amazon.com/msk/latest/developerguide/limits.html | yes | Listed (not checked) |  |
| Messaging and integration | Step Functions | https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html | yes | Listed (not checked) |  |
| Messaging and integration | MQ | https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-limits.html | yes | Listed (not checked) |  |
| Messaging and integration | AppSync | https://docs.aws.amazon.com/general/latest/gr/appsync.html | yes | Listed (not checked) |  |
| Analytics | OpenSearchService | https://docs.aws.amazon.com/opensearch-service/latest/developerguide/limits.html | yes | Listed (not checked) |  |
| Analytics | Athena | https://docs.aws.amazon.com/athena/latest/ug/service-limits.html | yes | Listed (not checked) |  |
| Analytics | EMR | https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-service-limits-what-are.html | partial | Listed (not checked) |  |
| Analytics | Glue | https://docs.aws.amazon.com/general/latest/gr/glue.html | yes | Listed (not checked) |  |
| Media | MediaConvert | https://docs.aws.amazon.com/general/latest/gr/mediaconvert.html | yes | Listed (not checked) |  |
| Media | MediaLive | https://docs.aws.amazon.com/general/latest/gr/medialive_region.html | yes | Listed (not checked) |  |
| Media | MediaPackage | https://docs.aws.amazon.com/mediapackage/latest/userguide/quotas.html | yes | Listed (not checked) |  |
| Media | IVS | https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/service-quotas.html | yes | Listed (not checked) |  |

## Azure (44)

| Category | Service | Official page | Limits on page | Status | Note |
|---|---|---|---|---|---|
| Compute | Virtual Machines | https://learn.microsoft.com/en-us/azure/virtual-machines/quotas | partial | Listed (not checked) |  |
| Compute | VM Scale Sets | https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-faq | yes | Listed (not checked) | Indirect: FAQ page. |
| Compute | App Service | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits | yes | Listed (not checked) | Generic Azure subscriptionlimits page. |
| Compute | Functions | https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale | yes | Listed (not checked) |  |
| Compute | Batch | https://learn.microsoft.com/en-us/azure/batch/batch-quota-limit | yes | Listed (not checked) |  |
| Compute | Container Instances | https://learn.microsoft.com/en-us/azure/container-instances/container-instances-resource-and-quota-limits | yes | Listed (not checked) |  |
| Containers | AKS | https://learn.microsoft.com/en-us/azure/aks/quotas-skus-regions | yes | Verified |  |
| Containers | Container Apps | https://learn.microsoft.com/en-us/azure/container-apps/quotas | partial | Listed (not checked) |  |
| Storage | Blob Storage | https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets | yes | Listed (not checked) |  |
| Storage | Files | https://learn.microsoft.com/en-us/azure/storage/files/storage-files-scale-targets | yes | Listed (not checked) |  |
| Storage | Disk Storage | https://learn.microsoft.com/en-us/azure/virtual-machines/disks-scalability-targets | yes | Listed (not checked) |  |
| Storage | NetApp Files | https://learn.microsoft.com/en-us/azure/azure-netapp-files/azure-netapp-files-resource-limits | yes | Listed (not checked) |  |
| Storage | Data Lake Storage | https://azure.microsoft.com/en-us/products/storage/data-lake-storage | no | No limits on page | Product page, no limits. |
| Storage | Elastic SAN | https://learn.microsoft.com/en-us/azure/storage/elastic-san/elastic-san-scale-targets | yes | Listed (not checked) |  |
| Database | Cosmos DB | https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits | yes | Listed (not checked) |  |
| Database | Azure SQL | https://learn.microsoft.com/en-us/azure/azure-sql/database/resource-limits-vcore-single-databases?view=azuresql | yes | Verified | vCore single-database limitsonly. |
| Database | SQL ManagedInstance | https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/resource-limits?view=azuresql | yes | Listed (not checked) |  |
| Database | Database forPostgreSQL | https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits | yes | Listed (not checked) |  |
| Database | Database for MySQL | https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-limitations | partial | Listed (not checked) |  |
| Database | Managed Instancefor ApacheCassandra | https://learn.microsoft.com/en-us/azure/managed-instance-apache-cassandra/faq | partial | Listed (not checked) |  |
| Cache | Cache for Redis | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits | yes | Verified | Generic Azure subscriptionlimits page. Basic, Standard,Premium retire Sep 30, 2028. |
| Cache | Managed Redis | https://learn.microsoft.com/en-us/azure/redis/plan-tiers-and-capacity | partial | Listed (not checked) |  |
| Network and CDN | Front Door | https://learn.microsoft.com/en-us/azure/frontdoor/front-door-routing-limits | partial | Partial |  |
| Network and CDN | Content DeliveryNetwork | https://learn.microsoft.com/en-us/azure/cdn/cdn-overview | no | No limits on page | Overview page, no limits. |
| Network and CDN | Application Gateway | https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-autoscaling-zone-redundant | yes | Listed (not checked) |  |
| Network and CDN | Load Balancer | https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-tcp-idle-timeout | partial | Partial | Indirect: idle-timeout how-to. |
| Network and CDN | Traffic Manager | https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-faqs | partial | Listed (not checked) | Indirect: FAQ page. |
| Network and CDN | DNS | https://learn.microsoft.com/en-us/azure/dns/dns-zones-records | yes | Listed (not checked) |  |
| Network and CDN | ExpressRoute | https://learn.microsoft.com/en-us/azure/expressroute/expressroute-faqs | yes | Listed (not checked) |  |
| Network and CDN | Firewall | https://learn.microsoft.com/en-us/azure/firewall/firewall-performance | yes | Listed (not checked) |  |
| Network and CDN | Web ApplicationFirewall | https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/waf-engine | partial | Listed (not checked) |  |
| Network and CDN | VPN Gateway | https://learn.microsoft.com/en-us/azure/vpn-gateway/about-gateway-skus | yes | Listed (not checked) |  |
| Messaging and integration | Service Bus | https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-quotas | yes | Verified |  |
| Messaging and integration | Event Grid | https://learn.microsoft.com/en-us/azure/event-grid/quotas-limits | yes | Listed (not checked) |  |
| Messaging and integration | Event Hubs | https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-quotas | yes | Listed (not checked) |  |
| Messaging and integration | Queue Storage | https://learn.microsoft.com/en-us/azure/storage/queues/scalability-targets | yes | Listed (not checked) |  |
| Messaging and integration | API Management | https://learn.microsoft.com/en-us/azure/api-management/service-limits | yes | Listed (not checked) |  |
| Messaging and integration | Logic Apps | https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config | yes | Listed (not checked) |  |
| Messaging and integration | Web PubSub | https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-scale-manual-scale | partial | Listed (not checked) |  |
| Analytics | Data Explorer | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits | yes | Listed (not checked) | Generic Azure subscriptionlimits page. |
| Analytics | Stream Analytics | https://learn.microsoft.com/en-us/azure/stream-analytics/stream-analytics-streaming-unit-consumption | partial | Listed (not checked) |  |
| Analytics | Synapse Analytics | https://learn.microsoft.com/en-us/azure/synapse-analytics/sql-data-warehouse/sql-data-warehouse-service-capacity-limits | yes | Listed (not checked) |  |
| Analytics | Databricks | https://learn.microsoft.com/en-us/azure/databricks/admin/account-settings/serverless-quotas | partial | Listed (not checked) |  |
| Analytics | Data Factory | https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits | yes | Listed (not checked) | Generic Azure subscriptionlimits page. |

## Google Cloud (35)

| Category | Service | Official page | Limits on page | Status | Note |
|---|---|---|---|---|---|
| Compute | Compute Engine | https://docs.cloud.google.com/compute/quotas-limits | partial | Listed (not checked) |  |
| Compute | Cloud Run | https://docs.cloud.google.com/run/quotas | yes | Listed (not checked) |  |
| Compute | Cloud Runfunctions | https://docs.cloud.google.com/functions/quotas | yes | Listed (not checked) |  |
| Compute | App Engine | https://docs.cloud.google.com/appengine/docs/standard/quotas | yes | Listed (not checked) |  |
| Compute | Batch | https://docs.cloud.google.com/batch/quotas | yes | Listed (not checked) |  |
| Containers | GKE | https://docs.cloud.google.com/kubernetes-engine/quotas | yes | Verified |  |
| Storage | Cloud Storage | https://docs.cloud.google.com/storage/quotas | yes | Listed (not checked) |  |
| Storage | Persistent Disk | https://docs.cloud.google.com/compute/docs/disks/performance | yes | Listed (not checked) |  |
| Storage | Filestore | https://docs.cloud.google.com/filestore/docs/limits | yes | Listed (not checked) |  |
| Storage | Hyperdisk | https://docs.cloud.google.com/compute/docs/disks/hyperdisk-perf-limits | yes | Listed (not checked) |  |
| Database | Cloud SQL | https://docs.cloud.google.com/sql/docs/quotas | yes | Verified |  |
| Database | AlloyDB | https://docs.cloud.google.com/alloydb/quotas | yes | Listed (not checked) |  |
| Database | Spanner | https://docs.cloud.google.com/spanner/quotas | yes | Listed (not checked) |  |
| Database | Bigtable | https://docs.cloud.google.com/bigtable/quotas | yes | Listed (not checked) |  |
| Database | Firestore | https://docs.cloud.google.com/firestore/quotas | yes | Listed (not checked) |  |
| Cache | Memorystore | https://docs.cloud.google.com/memorystore/docs/redis/quotas | yes | Verified |  |
| Network and CDN | Cloud CDN | https://docs.cloud.google.com/cdn/docs/caching | partial | Partial |  |
| Network and CDN | Media CDN | https://docs.cloud.google.com/media-cdn/quotas | yes | Listed (not checked) |  |
| Network and CDN | Cloud LoadBalancing | https://docs.cloud.google.com/load-balancing/docs/quotas | yes | Verified |  |
| Network and CDN | Cloud DNS | https://docs.cloud.google.com/dns/quotas | yes | Listed (not checked) |  |
| Network and CDN | Cloud Armor | https://docs.cloud.google.com/armor/quotas | yes | Listed (not checked) |  |
| Network and CDN | Cloud NAT | https://docs.cloud.google.com/nat/quota | yes | Listed (not checked) |  |
| Network and CDN | CloudInterconnect | https://docs.cloud.google.com/network-connectivity/docs/interconnect/quotas | yes | Listed (not checked) |  |
| Messaging and integration | Pub/Sub | https://docs.cloud.google.com/pubsub/quotas | yes | Verified | Link fixed: the old URL returned404; new page confirmed Oct 20,2026. |
| Messaging and integration | Cloud Tasks | https://docs.cloud.google.com/tasks/docs/quotas | yes | Listed (not checked) |  |
| Messaging and integration | Eventarc | https://docs.cloud.google.com/eventarc/docs/quotas | yes | Listed (not checked) |  |
| Messaging and integration | Workflows | https://docs.cloud.google.com/workflows/quotas | yes | Listed (not checked) |  |
| Messaging and integration | Cloud Scheduler | https://docs.cloud.google.com/scheduler/quotas | yes | Listed (not checked) |  |
| Messaging and integration | Apigee | https://docs.cloud.google.com/apigee/docs/api-platform/reference/subscription-entitlements | partial | Partial |  |
| Messaging and integration | API Gateway | https://docs.cloud.google.com/api-gateway/docs/quotas | yes | Listed (not checked) |  |
| Analytics | BigQuery | https://docs.cloud.google.com/bigquery/quotas | yes | Listed (not checked) |  |
| Analytics | Dataflow | https://docs.cloud.google.com/dataflow/quotas | yes | Listed (not checked) |  |
| Analytics | Dataproc | https://docs.cloud.google.com/managed-spark/quotas | yes | Listed (not checked) | Renamed by Google: "ManagedService for Apache Spark"; linkupdated. |
| Media | Transcoder API | https://docs.cloud.google.com/transcoder/quotas | yes | Listed (not checked) |  |
| Media | Live Stream API | https://docs.cloud.google.com/livestream/docs/quotas | yes | Listed (not checked) |  |

## Kubernetes (8)

| Category | Service | Official page | Limits on page | Status | Note |
|---|---|---|---|---|---|
| Kubernetes object | Deployment | https://kubernetes.io/docs/concepts/workloads/controllers/deployment/ | no | No limits on page |  |
| Kubernetes object | StatefulSet | https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/ | no | No limits on page |  |
| Kubernetes object | Job | https://kubernetes.io/docs/concepts/workloads/controllers/job/ | no | No limits on page |  |
| Kubernetes object | Service | https://kubernetes.io/docs/concepts/services-networking/service/ | no | No limits on page |  |
| Kubernetes object | Ingress | https://kubernetes.io/docs/concepts/services-networking/ingress/ | no | No limits on page |  |
| Kubernetes object | HorizontalPodAutoscaler | https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/ | no | No limits on page |  |
| Kubernetes object | PersistentVolumeClaim | https://kubernetes.io/docs/concepts/storage/persistent-volumes/ | no | No limits on page |  |
| Cluster limits | Kubernetes scalabilitythresholds | https://kubernetes.io/docs/setup/best-practices/cluster-large/ | partial | Partial |  |

## Generic (9 components, no provider page)

Clients, Load balancer, Service, Cache, Database, Queue, Worker pool, CDN, Object store. Limits are Not set until entered. The canvas labels "Viewers" and "Uploaders" are Clients.

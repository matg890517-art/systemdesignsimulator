import type { CatalogEntry } from './types.ts'

export const catalogReadOn = '2026-10-20' as const

export const catalogEntries: CatalogEntry[] = [
  {
    "id": "aws-ec2",
    "provider": "aws",
    "category": "Compute",
    "name": "EC2",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/ec2-service.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-lambda",
    "provider": "aws",
    "category": "Compute",
    "name": "Lambda",
    "docsUrl": "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-fargate",
    "provider": "aws",
    "category": "Compute",
    "name": "Fargate",
    "docsUrl": "https://docs.aws.amazon.com/AmazonECS/latest/developerguide/throttling.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-batch",
    "provider": "aws",
    "category": "Compute",
    "name": "Batch",
    "docsUrl": "https://docs.aws.amazon.com/batch/latest/userguide/service_limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-app-runner",
    "provider": "aws",
    "category": "Compute",
    "name": "App Runner",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/apprunner.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-elastic-beanstalk",
    "provider": "aws",
    "category": "Compute",
    "name": "Elastic Beanstalk",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/elasticbeanstalk.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-lightsail",
    "provider": "aws",
    "category": "Compute",
    "name": "Lightsail",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/lightsail.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-ecs",
    "provider": "aws",
    "category": "Containers",
    "name": "ECS",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/ecs-service.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-eks",
    "provider": "aws",
    "category": "Containers",
    "name": "EKS",
    "docsUrl": "https://docs.aws.amazon.com/eks/latest/best-practices/known_limits_and_service_quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-s3",
    "provider": "aws",
    "category": "Storage",
    "name": "S3",
    "docsUrl": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html",
    "limitsOnPage": "partial"
  },
  {
    "id": "aws-ebs",
    "provider": "aws",
    "category": "Storage",
    "name": "EBS",
    "docsUrl": "https://docs.aws.amazon.com/ebs/latest/userguide/ebs-resource-quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-efs",
    "provider": "aws",
    "category": "Storage",
    "name": "EFS",
    "docsUrl": "https://docs.aws.amazon.com/efs/latest/ug/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-fsx",
    "provider": "aws",
    "category": "Storage",
    "name": "FSx",
    "docsUrl": "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-storage-gateway",
    "provider": "aws",
    "category": "Storage",
    "name": "Storage Gateway",
    "docsUrl": "https://docs.aws.amazon.com/storagegateway/latest/vgw/resource-gateway-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-aurora",
    "provider": "aws",
    "category": "Database",
    "name": "Aurora",
    "docsUrl": "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_Limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-rds",
    "provider": "aws",
    "category": "Database",
    "name": "RDS",
    "docsUrl": "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-dynamodb",
    "provider": "aws",
    "category": "Database",
    "name": "DynamoDB",
    "docsUrl": "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-documentdb",
    "provider": "aws",
    "category": "Database",
    "name": "DocumentDB",
    "docsUrl": "https://docs.aws.amazon.com/documentdb/latest/devguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-neptune",
    "provider": "aws",
    "category": "Database",
    "name": "Neptune",
    "docsUrl": "https://docs.aws.amazon.com/neptune/latest/userguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-keyspaces",
    "provider": "aws",
    "category": "Database",
    "name": "Keyspaces",
    "docsUrl": "https://docs.aws.amazon.com/keyspaces/latest/devguide/quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-timestream",
    "provider": "aws",
    "category": "Database",
    "name": "Timestream",
    "docsUrl": "https://docs.aws.amazon.com/timestream/latest/developerguide/ts-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-redshift",
    "provider": "aws",
    "category": "Database",
    "name": "Redshift",
    "docsUrl": "https://docs.aws.amazon.com/redshift/latest/mgmt/amazon-redshift-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-elasticache",
    "provider": "aws",
    "category": "Cache",
    "name": "ElastiCache",
    "docsUrl": "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/quota-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-memorydb",
    "provider": "aws",
    "category": "Cache",
    "name": "MemoryDB",
    "docsUrl": "https://docs.aws.amazon.com/memorydb/latest/devguide/quota-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-cloudfront",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "CloudFront",
    "docsUrl": "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-route-53",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Route 53",
    "docsUrl": "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/DNSLimitations.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-application-load-balancer",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Application Load Balancer",
    "docsUrl": "https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-network-load-balancer",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Network Load Balancer",
    "docsUrl": "https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-api-gateway",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "API Gateway",
    "docsUrl": "https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-global-accelerator",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Global Accelerator",
    "docsUrl": "https://docs.aws.amazon.com/global-accelerator/latest/dg/limits-global-accelerator.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-vpc",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "VPC",
    "docsUrl": "https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-direct-connect",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Direct Connect",
    "docsUrl": "https://docs.aws.amazon.com/directconnect/latest/UserGuide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-waf",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "WAF",
    "docsUrl": "https://docs.aws.amazon.com/waf/latest/developerguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-shield",
    "provider": "aws",
    "category": "Network and CDN",
    "name": "Shield",
    "docsUrl": "https://docs.aws.amazon.com/waf/latest/developerguide/shield-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-sqs",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "SQS",
    "docsUrl": "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-sns",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "SNS",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/sns.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-eventbridge",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "EventBridge",
    "docsUrl": "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-quota.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-kinesis-data-streams",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "Kinesis Data Streams",
    "docsUrl": "https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-msk",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "MSK",
    "docsUrl": "https://docs.aws.amazon.com/msk/latest/developerguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-step-functions",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "Step Functions",
    "docsUrl": "https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-mq",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "MQ",
    "docsUrl": "https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-appsync",
    "provider": "aws",
    "category": "Messaging and integration",
    "name": "AppSync",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/appsync.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-opensearch-service",
    "provider": "aws",
    "category": "Analytics",
    "name": "OpenSearch Service",
    "docsUrl": "https://docs.aws.amazon.com/opensearch-service/latest/developerguide/limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-athena",
    "provider": "aws",
    "category": "Analytics",
    "name": "Athena",
    "docsUrl": "https://docs.aws.amazon.com/athena/latest/ug/service-limits.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-emr",
    "provider": "aws",
    "category": "Analytics",
    "name": "EMR",
    "docsUrl": "https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-service-limits-what-are.html",
    "limitsOnPage": "partial"
  },
  {
    "id": "aws-glue",
    "provider": "aws",
    "category": "Analytics",
    "name": "Glue",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/glue.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-mediaconvert",
    "provider": "aws",
    "category": "Media",
    "name": "MediaConvert",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/mediaconvert.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-medialive",
    "provider": "aws",
    "category": "Media",
    "name": "MediaLive",
    "docsUrl": "https://docs.aws.amazon.com/general/latest/gr/medialive_region.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-mediapackage",
    "provider": "aws",
    "category": "Media",
    "name": "MediaPackage",
    "docsUrl": "https://docs.aws.amazon.com/mediapackage/latest/userguide/quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "aws-ivs",
    "provider": "aws",
    "category": "Media",
    "name": "IVS",
    "docsUrl": "https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/service-quotas.html",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-virtual-machines",
    "provider": "azure",
    "category": "Compute",
    "name": "Virtual Machines",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/virtual-machines/quotas",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-vm-scale-sets",
    "provider": "azure",
    "category": "Compute",
    "name": "VM Scale Sets",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-faq",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-app-service",
    "provider": "azure",
    "category": "Compute",
    "name": "App Service",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-functions",
    "provider": "azure",
    "category": "Compute",
    "name": "Functions",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-batch",
    "provider": "azure",
    "category": "Compute",
    "name": "Batch",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/batch/batch-quota-limit",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-container-instances",
    "provider": "azure",
    "category": "Compute",
    "name": "Container Instances",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/container-instances/container-instances-resource-and-quota-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-aks",
    "provider": "azure",
    "category": "Containers",
    "name": "AKS",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/aks/quotas-skus-regions",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-container-apps",
    "provider": "azure",
    "category": "Containers",
    "name": "Container Apps",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/container-apps/quotas",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-blob-storage",
    "provider": "azure",
    "category": "Storage",
    "name": "Blob Storage",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-files",
    "provider": "azure",
    "category": "Storage",
    "name": "Files",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/storage/files/storage-files-scale-targets",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-disk-storage",
    "provider": "azure",
    "category": "Storage",
    "name": "Disk Storage",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/virtual-machines/disks-scalability-targets",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-netapp-files",
    "provider": "azure",
    "category": "Storage",
    "name": "NetApp Files",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-netapp-files/azure-netapp-files-resource-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-data-lake-storage",
    "provider": "azure",
    "category": "Storage",
    "name": "Data Lake Storage",
    "docsUrl": "https://azure.microsoft.com/en-us/products/storage/data-lake-storage",
    "limitsOnPage": "no"
  },
  {
    "id": "azure-elastic-san",
    "provider": "azure",
    "category": "Storage",
    "name": "Elastic SAN",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/storage/elastic-san/elastic-san-scale-targets",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-cosmos-db",
    "provider": "azure",
    "category": "Database",
    "name": "Cosmos DB",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-azure-sql",
    "provider": "azure",
    "category": "Database",
    "name": "Azure SQL",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-sql/database/resource-limits-vcore-single-databases?view=azuresql",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-sql-managed-instance",
    "provider": "azure",
    "category": "Database",
    "name": "SQL Managed Instance",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/resource-limits?view=azuresql",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-database-for-postgresql",
    "provider": "azure",
    "category": "Database",
    "name": "Database for PostgreSQL",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-database-for-mysql",
    "provider": "azure",
    "category": "Database",
    "name": "Database for MySQL",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-limitations",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-managed-instance-for-apache-cassandra",
    "provider": "azure",
    "category": "Database",
    "name": "Managed Instance for Apache Cassandra",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/managed-instance-apache-cassandra/faq",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-cache-for-redis",
    "provider": "azure",
    "category": "Cache",
    "name": "Cache for Redis",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-managed-redis",
    "provider": "azure",
    "category": "Cache",
    "name": "Managed Redis",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/redis/plan-tiers-and-capacity",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-front-door",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Front Door",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/frontdoor/front-door-routing-limits",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-content-delivery-network",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Content Delivery Network",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/cdn/cdn-overview",
    "limitsOnPage": "no"
  },
  {
    "id": "azure-application-gateway",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Application Gateway",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-autoscaling-zone-redundant",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-load-balancer",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Load Balancer",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-tcp-idle-timeout",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-traffic-manager",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Traffic Manager",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-faqs",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-dns",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "DNS",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/dns/dns-zones-records",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-expressroute",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "ExpressRoute",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/expressroute/expressroute-faqs",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-firewall",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Firewall",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/firewall/firewall-performance",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-web-application-firewall",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "Web Application Firewall",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/waf-engine",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-vpn-gateway",
    "provider": "azure",
    "category": "Network and CDN",
    "name": "VPN Gateway",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/vpn-gateway/about-gateway-skus",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-service-bus",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Service Bus",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-event-grid",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Event Grid",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/event-grid/quotas-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-event-hubs",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Event Hubs",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-queue-storage",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Queue Storage",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/storage/queues/scalability-targets",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-api-management",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "API Management",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/api-management/service-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-logic-apps",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Logic Apps",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-web-pubsub",
    "provider": "azure",
    "category": "Messaging and integration",
    "name": "Web PubSub",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-scale-manual-scale",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-data-explorer",
    "provider": "azure",
    "category": "Analytics",
    "name": "Data Explorer",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-stream-analytics",
    "provider": "azure",
    "category": "Analytics",
    "name": "Stream Analytics",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/stream-analytics/stream-analytics-streaming-unit-consumption",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-synapse-analytics",
    "provider": "azure",
    "category": "Analytics",
    "name": "Synapse Analytics",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/synapse-analytics/sql-data-warehouse/sql-data-warehouse-service-capacity-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "azure-databricks",
    "provider": "azure",
    "category": "Analytics",
    "name": "Databricks",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/databricks/admin/account-settings/serverless-quotas",
    "limitsOnPage": "partial"
  },
  {
    "id": "azure-data-factory",
    "provider": "azure",
    "category": "Analytics",
    "name": "Data Factory",
    "docsUrl": "https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-compute-engine",
    "provider": "gcp",
    "category": "Compute",
    "name": "Compute Engine",
    "docsUrl": "https://docs.cloud.google.com/compute/quotas-limits",
    "limitsOnPage": "partial"
  },
  {
    "id": "gcp-cloud-run",
    "provider": "gcp",
    "category": "Compute",
    "name": "Cloud Run",
    "docsUrl": "https://docs.cloud.google.com/run/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-run-functions",
    "provider": "gcp",
    "category": "Compute",
    "name": "Cloud Run functions",
    "docsUrl": "https://docs.cloud.google.com/functions/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-app-engine",
    "provider": "gcp",
    "category": "Compute",
    "name": "App Engine",
    "docsUrl": "https://docs.cloud.google.com/appengine/docs/standard/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-batch",
    "provider": "gcp",
    "category": "Compute",
    "name": "Batch",
    "docsUrl": "https://docs.cloud.google.com/batch/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-gke",
    "provider": "gcp",
    "category": "Containers",
    "name": "GKE",
    "docsUrl": "https://docs.cloud.google.com/kubernetes-engine/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-storage",
    "provider": "gcp",
    "category": "Storage",
    "name": "Cloud Storage",
    "docsUrl": "https://docs.cloud.google.com/storage/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-persistent-disk",
    "provider": "gcp",
    "category": "Storage",
    "name": "Persistent Disk",
    "docsUrl": "https://docs.cloud.google.com/compute/docs/disks/performance",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-filestore",
    "provider": "gcp",
    "category": "Storage",
    "name": "Filestore",
    "docsUrl": "https://docs.cloud.google.com/filestore/docs/limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-hyperdisk",
    "provider": "gcp",
    "category": "Storage",
    "name": "Hyperdisk",
    "docsUrl": "https://docs.cloud.google.com/compute/docs/disks/hyperdisk-perf-limits",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-sql",
    "provider": "gcp",
    "category": "Database",
    "name": "Cloud SQL",
    "docsUrl": "https://docs.cloud.google.com/sql/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-alloydb",
    "provider": "gcp",
    "category": "Database",
    "name": "AlloyDB",
    "docsUrl": "https://docs.cloud.google.com/alloydb/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-spanner",
    "provider": "gcp",
    "category": "Database",
    "name": "Spanner",
    "docsUrl": "https://docs.cloud.google.com/spanner/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-bigtable",
    "provider": "gcp",
    "category": "Database",
    "name": "Bigtable",
    "docsUrl": "https://docs.cloud.google.com/bigtable/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-firestore",
    "provider": "gcp",
    "category": "Database",
    "name": "Firestore",
    "docsUrl": "https://docs.cloud.google.com/firestore/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-memorystore",
    "provider": "gcp",
    "category": "Cache",
    "name": "Memorystore",
    "docsUrl": "https://docs.cloud.google.com/memorystore/docs/redis/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-cdn",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud CDN",
    "docsUrl": "https://docs.cloud.google.com/cdn/docs/caching",
    "limitsOnPage": "partial"
  },
  {
    "id": "gcp-media-cdn",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Media CDN",
    "docsUrl": "https://docs.cloud.google.com/media-cdn/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-load-balancing",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud Load Balancing",
    "docsUrl": "https://docs.cloud.google.com/load-balancing/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-dns",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud DNS",
    "docsUrl": "https://docs.cloud.google.com/dns/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-armor",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud Armor",
    "docsUrl": "https://docs.cloud.google.com/armor/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-nat",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud NAT",
    "docsUrl": "https://docs.cloud.google.com/nat/quota",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-interconnect",
    "provider": "gcp",
    "category": "Network and CDN",
    "name": "Cloud Interconnect",
    "docsUrl": "https://docs.cloud.google.com/network-connectivity/docs/interconnect/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-pub-sub",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Pub/Sub",
    "docsUrl": "https://docs.cloud.google.com/pubsub/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-tasks",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Cloud Tasks",
    "docsUrl": "https://docs.cloud.google.com/tasks/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-eventarc",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Eventarc",
    "docsUrl": "https://docs.cloud.google.com/eventarc/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-workflows",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Workflows",
    "docsUrl": "https://docs.cloud.google.com/workflows/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-cloud-scheduler",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Cloud Scheduler",
    "docsUrl": "https://docs.cloud.google.com/scheduler/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-apigee",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "Apigee",
    "docsUrl": "https://docs.cloud.google.com/apigee/docs/api-platform/reference/subscription-entitlements",
    "limitsOnPage": "partial"
  },
  {
    "id": "gcp-api-gateway",
    "provider": "gcp",
    "category": "Messaging and integration",
    "name": "API Gateway",
    "docsUrl": "https://docs.cloud.google.com/api-gateway/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-bigquery",
    "provider": "gcp",
    "category": "Analytics",
    "name": "BigQuery",
    "docsUrl": "https://docs.cloud.google.com/bigquery/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-dataflow",
    "provider": "gcp",
    "category": "Analytics",
    "name": "Dataflow",
    "docsUrl": "https://docs.cloud.google.com/dataflow/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-dataproc",
    "provider": "gcp",
    "category": "Analytics",
    "name": "Dataproc",
    "docsUrl": "https://docs.cloud.google.com/dataproc/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-transcoder-api",
    "provider": "gcp",
    "category": "Media",
    "name": "Transcoder API",
    "docsUrl": "https://docs.cloud.google.com/transcoder/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "gcp-live-stream-api",
    "provider": "gcp",
    "category": "Media",
    "name": "Live Stream API",
    "docsUrl": "https://docs.cloud.google.com/livestream/docs/quotas",
    "limitsOnPage": "yes"
  },
  {
    "id": "kubernetes-deployment",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "Deployment",
    "docsUrl": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-statefulset",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "StatefulSet",
    "docsUrl": "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-job",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "Job",
    "docsUrl": "https://kubernetes.io/docs/concepts/workloads/controllers/job/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-service",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "Service",
    "docsUrl": "https://kubernetes.io/docs/concepts/services-networking/service/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-ingress",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "Ingress",
    "docsUrl": "https://kubernetes.io/docs/concepts/services-networking/ingress/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-horizontalpodautoscaler",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "HorizontalPodAutoscaler",
    "docsUrl": "https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-persistentvolumeclaim",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "PersistentVolumeClaim",
    "docsUrl": "https://kubernetes.io/docs/concepts/storage/persistent-volumes/",
    "limitsOnPage": "no"
  },
  {
    "id": "kubernetes-kubernetes-scalability-thresholds",
    "provider": "kubernetes",
    "category": "Kubernetes object",
    "name": "Kubernetes scalability thresholds",
    "docsUrl": "https://kubernetes.io/docs/setup/best-practices/cluster-large/",
    "limitsOnPage": "partial"
  }
]

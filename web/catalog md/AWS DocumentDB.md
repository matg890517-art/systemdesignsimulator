

# Amazon DocumentDB quotas
<a name="limits"></a>

This topic describes the resource quotas and naming constraints for Amazon DocumentDB (with MongoDB compatibility).

For certain management features, Amazon DocumentDB uses operational technology that is shared with Amazon Relational Database Service (Amazon RDS) and Amazon Neptune.

**Topics**
+ [Supported instance types](#limits-suported_instance_types)
+ [Supported Regions](#limits-region_availability)
+ [Regional quotas](#limits-regional_quotas)
+ [Aggregation quotas](#limits-aggregation)
+ [Cluster quotas](#limits-cluster)
+ [Instance quotas](#limits.instance)
+ [Naming constraints](#limits-naming_constraints)
+ [TTL constraints](#limits.ttl-constraints)
+ [Elastic cluster quotas](#elastic.cluster.limits)
+ [Elastic cluster shard quotas](#elastic.cluster.shard.limits)
+ [Elastic cluster CPU, memory, connection, and cursor quotas per shard](#elastic.cluster.memory.limits)

## Supported instance types
<a name="limits-suported_instance_types"></a>

Amazon DocumentDB supports on-demand instances and the following instance types:
+ NVMe-backed:
  + **R6GD instance types:** `db.r6gd.xlarge`, `db.r6gd.2xlarge`, `db.r6gd.4xlarge`, `db.r6gd.8xlarge`, `db.r6gd.12xlarge`, `db.r6gd.16xlarge`.
+ Memory optimized:
  + **R8G instance types:** `db.r8g.large`, `db.r8g.xlarge`, `db.r8g.2xlarge`, `db.r8g.4xlarge`, `db.r8g.8xlarge`, `db.r8g.12xlarge`, `db.r8g.16xlarge`, `db.r8g.24xlarge`, `db.r8g.48xlarge`.
  + **R6G instance types:** `db.r6g.large`, `db.r6g.xlarge`, `db.r6g.2xlarge`, `db.r6g.4xlarge`, `db.r6g.8xlarge`, `db.r6g.12xlarge`, `db.r6g.16xlarge`.
  + **R5 instance types:** `db.r5.large`, `db.r5.xlarge`, `db.r5.2xlarge`, `db.r5.4xlarge`, `db.r5.8xlarge`, `db.r5.12xlarge`, `db.r5.16xlarge`.
  + **R4 instance types:** `db.r4.large`, `db.r4.2xlarge`, `db.r4.4xlarge`, `db.r4.8xlarge`, `db.r4.16xlarge`.
+ Burstable performance:
  + **T4G instance types:** `db.t4g.medium`.
  + **T3 instance types:** `db.t3.medium`.

For more information on the supported instance types and their specifications, see [Instance class specifications](db-instance-classes.md#db-instance-class-specs).

## Supported Regions
<a name="limits-region_availability"></a>

Amazon DocumentDB is available in the following AWS Regions:


| Region Name | Region | Availability Zones (compute) | 
| --- | --- | --- | 
| US East (Ohio) | `us-east-2` | 3 | 
| US East (N. Virginia) | `us-east-1` | 6 | 
| US West (Oregon) | `us-west-2` | 4 | 
| Africa (Cape Town) | `af-south-1` | 3 | 
| South America (São Paulo) | `sa-east-1` | 3 | 
| Asia Pacific (Hong Kong) | `ap-east-1` | 3 | 
| Asia Pacific (Hyderabad) | `ap-south-2` | 3 | 
| Asia Pacific (Malaysia) | `ap-southeast-5` | 3 | 
| Asia Pacific (Mumbai) | `ap-south-1` | 3 | 
| Asia Pacific (Osaka) | `ap-northeast-3` | 3 | 
| Asia Pacific (Seoul) | `ap-northeast-2` | 4 | 
| Asia Pacific (Singapore) | `ap-southeast-1` | 3 | 
| Asia Pacific (Sydney) | `ap-southeast-2` | 3 | 
| Asia Pacific (Jakarta) | `ap-southeast-3` | 3 | 
| Asia Pacific (Melbourne) | `ap-southeast-4` | 3 | 
| Asia Pacific (Thailand) | `ap-southeast-7` | 3 | 
| Asia Pacific (Tokyo) | `ap-northeast-1` | 3 | 
| Canada (Central) | `ca-central-1` | 3 | 
| Canada West (Calgary) | `ca-west-1` | 3 | 
| China (Beijing) Region | `cn-north-1` | 3 | 
| China (Ningxia) | `cn-northwest-1` | 3 | 
| Europe (Frankfurt) | `eu-central-1` | 3 | 
| Europe (Zurich) | `eu-central-2` | 3 | 
| Europe (Ireland) | `eu-west-1` | 3 | 
| Europe (London) | `eu-west-2` | 3 | 
| Europe (Milan) | `eu-south-1` | 3 | 
| Europe (Paris) | `eu-west-3` | 3 | 
| Europe (Spain) | `eu-south-2` | 3 | 
| Europe (Stockholm) | `eu-north-1` | 3 | 
| Mexico (Central) | `mx-central-1` | 3 | 
| Middle East (UAE) | `me-central-1` | 3 | 
| Israel (Tel Aviv) | `il-central-1` | 3 | 
| AWS GovCloud (US-West) | `us-gov-west-1` | 3 | 
| AWS GovCloud (US-East) | `us-gov-east-1` | 3 | 

## Regional quotas
<a name="limits-regional_quotas"></a>

For certain management features, Amazon DocumentDB uses operational technology that is shared with Amazon Relational Database Service (Amazon RDS). The following table contains Regional quotas that are shared among Amazon DocumentDB and Amazon RDS.

**Note**  
The Amazon RDS shared technology described above only applies to Amazon DocumentDB instance-based clusters. Amazon DocumentDB elastic clusters do not share technology with Amazon RDS.

The following quotas apply to Amazon DocumentDB instance-based clusters and are per AWS account per Region.


| Resource | AWS default quota | 
| --- | --- | 
| Clusters | 40 | 
| Cluster parameter groups | 50 | 
| Clusters per parameter group | 100 | 
| Instances per parameter group | 300 | 
| Event subscriptions | 20 | 
| Instances | 40 | 
| Manual cluster snapshots | 100 | 
| Read replicas per cluster | 15 | 
| Subnet groups | 50 | 
| Subnets per subnet group | 20 | 
| Tags per resource | 50 | 
| VPC security groups per instance | 5 | 

The following quotas apply to Amazon DocumentDB elastic clusters and are per AWS account per Region.


| Resource | AWS default quota | 
| --- | --- | 
| Elastic clusters | 20 | 
| Elastic clusters vCPU | 1024 | 
| Manual elastic cluster snapshot | 20 | 

You can use Service Quotas to request an increase for a quota, if the quota is adjustable. Some requests are automatically resolved, while others are submitted to Support. You can track the status of a quota increase request that is submitted to Support. Requests to increase service quotas do not receive priority support. If you have an urgent request, contact [Support](https://aws.amazon.com/premiumsupport/). For more information on Service Quotas, see [What Is Service Quotas?](https://docs.aws.amazon.com//servicequotas/latest/userguide/intro.html)

**To request a quota increase for Amazon DocumentDB:**

1. Open the Service Quotas console at [https://console.aws.amazon.com/servicequotas](https://console.aws.amazon.com/servicequotas) and, if necessary, sign in. 

1. In the navigation pane, choose **AWS services**. 

1. Select Amazon DocumentDB (with MongoDB compatibility) or Amazon DocumentDB Elastic Cluster from the list, or type either in the search field.

1. If the quota is adjustable, you can select its radio button or its name, and then choose **Request quota increase** from the top right of the page.

1. For **Change quota value**, enter the new value. The new value must be greater than the current value.

1. Choose **Request**. After the request is resolved, the **Applied quota value** for the quota is set to the new value.

1. To view any pending or recently resolved requests, choose **Dashboard** from the navigation pane. For pending requests, choose the status of the request to open the request receipt. The initial status of a request is `Pending`. After the status changes to `Quota requested`, you'll see the case number with Support. Choose the case number to open the ticket for your request.

## Aggregation quotas
<a name="limits-aggregation"></a>

The following table describes aggregation quotas in Amazon DocumentDB.


| Resource | Quota | 
| --- | --- | 
| Maximum number of supported stages | 500 | 

## Cluster quotas
<a name="limits-cluster"></a>

The following table describes Amazon DocumentDB instance-based cluster quotas.


| Resource | Quota | 
| --- | --- | 
| Cluster size (sum of all collections and indexes) | 256 TiB for Engine Version 8.0 and beyond (128 TiB for earlier engine versions) | 
| Collection size (sum of all collections cannot exceed cluster quota) – does not include the index size | 32 TiB | 
| Collections per cluster | 100,000 | 
| Databases per cluster | 100,000 | 
| Database size (sum of all databases cannot exceed cluster quota) | 256 TiB for Engine Version 8.0 and beyond (128 TiB for earlier engine versions) | 
| Document nesting depth | 200 levels | 
| Document size | 16 MiB | 
| Index key size | 2,048 bytes | 
| Indexes per collection | 64 | 
| Keys in a compound index | 32 | 
| Maximum number of writes in a single batch command | 100,000 | 
| Number of users per cluster | 1000 | 

## Instance quotas
<a name="limits.instance"></a>

The following table describes Amazon DocumentDB quotas per instance.

------
#### [ Amazon DocumentDB 8.0 ]


| Instance type | Instance memory (GiB) | Connections (all) | Cursor quota | Open transactions | Connections (active) | 
| --- | --- | --- | --- | --- | --- | 
| T3.medium | 4 | 1000 | 30 | 50 | 102 | 
| T4G.medium | 4 | 1000 | 30 | 50 | 102 | 
| R5.large | 16 | 3400 | 450 | 200 | 1100 | 
| R5.xlarge | 32 | 7000 | 450 | 400 | 2700 | 
| R5.2xlarge | 64 | 14200 | 450 | 800 | 4500 | 
| R5.4xlarge | 128 | 28400 | 760 | 1600 | 4500 | 
| R5.8xlarge | 256 | 60000 | 1520 | 3200 | 4500 | 
| R5.12xlarge | 384 | 60000 | 2280 | 4800 | 4500 | 
| R5.16xlarge | 512 | 60000 | 3040 | 6400 | 4500 | 
| R6G.large\* | 16 | 3400 | 450 | 200 | 1100 | 
| R6G.xlarge\* | 32 | 7000 | 450 | 400 | 2700 | 
| R6G.2xlarge\* | 64 | 14200 | 450 | 800 | 4500 | 
| R6G.4xlarge\* | 128 | 28400 | 760 | 1600 | 4500 | 
| R6G.8xlarge\* | 256 | 60000 | 1520 | 3200 | 4500 | 
| R6G.12xlarge\* | 384 | 60000 | 2280 | 4800 | 4500 | 
| R6G.16xlarge\* | 512 | 60000 | 3040 | 6400 | 4500 | 
| R8G.large | 16 | 3400 | 450 | 200 | 1100 | 
| R8G.xlarge | 32 | 7000 | 450 | 400 | 2700 | 
| R8G.2xlarge | 64 | 14200 | 450 | 800 | 4500 | 
| R8G.4xlarge | 128 | 28400 | 760 | 1600 | 4500 | 
| R8G.8xlarge | 256 | 60000 | 1520 | 3200 | 4500 | 
| R8G.12xlarge | 384 | 60000 | 2280 | 4800 | 4500 | 
| R8G.16xlarge | 512 | 60000 | 3040 | 6400 | 4500 | 
| R8G.24xlarge | 768 | 60000 | 4560 | 9600 | 4500 | 
| R8G.48xlarge | 1536 | 60000 | 9120 | 9600 | 4500 | 

\* including R6GD

------
#### [ Amazon DocumentDB 5.0 ]


| Instance type | Instance memory (GiB) | Connections (all) | Cursor quota | Open transactions | Connections (active) | 
| --- | --- | --- | --- | --- | --- | 
| T3.medium | 4 | 1000 | 30 | 50 | 102 | 
| T4G.medium | 4 | 1000 | 30 | 50 | 102 | 
| R5.large | 16 | 3400 | 450 | 200 | 1100 | 
| R5.xlarge | 32 | 7000 | 450 | 400 | 2700 | 
| R5.2xlarge | 64 | 14200 | 450 | 800 | 4500 | 
| R5.4xlarge | 128 | 28400 | 760 | 1600 | 4500 | 
| R5.8xlarge | 256 | 60000 | 1520 | 3200 | 4500 | 
| R5.12xlarge | 384 | 60000 | 2280 | 4800 | 4500 | 
| R5.16xlarge | 512 | 60000 | 3040 | 6400 | 4500 | 
| R6G.large\* | 16 | 3400 | 450 | 200 | 1100 | 
| R6G.xlarge\* | 32 | 7000 | 450 | 400 | 2700 | 
| R6G.2xlarge\* | 64 | 14200 | 450 | 800 | 4500 | 
| R6G.4xlarge\* | 128 | 28400 | 760 | 1600 | 4500 | 
| R6G.8xlarge\* | 256 | 60000 | 1520 | 3200 | 4500 | 
| R6G.12xlarge\* | 384 | 60000 | 2280 | 4800 | 4500 | 
| R6G.16xlarge\* | 512 | 60000 | 3040 | 6400 | 4500 | 
| R8G.large | 16 | 3400 | 450 | 200 | 1100 | 
| R8G.xlarge | 32 | 7000 | 450 | 400 | 2700 | 
| R8G.2xlarge | 64 | 14200 | 450 | 800 | 4500 | 
| R8G.4xlarge | 128 | 28400 | 760 | 1600 | 4500 | 
| R8G.8xlarge | 256 | 60000 | 1520 | 3200 | 4500 | 
| R8G.12xlarge | 384 | 60000 | 2280 | 4800 | 4500 | 
| R8G.16xlarge | 512 | 60000 | 3040 | 6400 | 4500 | 
| R8G.24xlarge | 768 | 60000 | 4560 | 9600 | 4500 | 
| R8G.48xlarge | 1536 | 60000 | 9120 | 9600 | 4500 | 

\* including R6GD

------
#### [ Amazon DocumentDB 4.0 ]


| Instance type | Instance memory (GiB) | Connections (all) | Cursor quota | Open transactions | Connections (active) | 
| --- | --- | --- | --- | --- | --- | 
| T3.medium | 4 | 1000 | 30 | 50 | 102 | 
| T4G.medium | 4 | 1000 | 30 | 50 | 102 | 
| R5.large | 16 | 3400 | 450 | 200 | 1100 | 
| R5.xlarge | 32 | 7000 | 450 | 400 | 2700 | 
| R5.2xlarge | 64 | 14200 | 450 | 800 | 4500 | 
| R5.4xlarge | 128 | 28400 | 760 | 1600 | 4500 | 
| R5.8xlarge | 256 | 60000 | 1520 | 3200 | 4500 | 
| R5.12xlarge | 384 | 60000 | 2280 | 4800 | 4500 | 
| R5.16xlarge | 512 | 60000 | 3040 | 6400 | 4500 | 
| R6G.large\* | 16 | 3400 | 450 | 200 | 1100 | 
| R6G.xlarge\* | 32 | 7000 | 450 | 400 | 2700 | 
| R6G.2xlarge\* | 64 | 14200 | 450 | 800 | 4500 | 
| R6G.4xlarge\* | 128 | 28400 | 760 | 1600 | 4500 | 
| R6G.8xlarge\* | 256 | 60000 | 1520 | 3200 | 4500 | 
| R6G.12xlarge\* | 384 | 60000 | 2280 | 4800 | 4500 | 
| R6G.16xlarge\* | 512 | 60000 | 3040 | 6400 | 4500 | 

\* including R6GD

------
#### [ Amazon DocumentDB 3.6 ]


| Instance type | Instance memory (GiB) | Connections (all) | Cursor quota | Open transactions | Connections (active) | 
| --- | --- | --- | --- | --- | --- | 
| T3.medium | 4 | 500 | 30 | N/A | 102 | 
| R4.large | 15.25 | 1700 | 450 | N/A | 1100 | 
| R4.xlarge | 30.5 | 3400 | 450 | N/A | 2700 | 
| R4.2xlarge | 61 | 6800 | 450 | N/A | 4500 | 
| R4.4xlarge | 122 | 13600 | 725 | N/A | 4500 | 
| R4.8xlarge | 288 | 27200 | 1450 | N/A | 4500 | 
| R4.16xlarge | 488 | 30000 | 2900 | N/A | 4500 | 
| R5.large | 16 | 1700 | 450 | N/A | 1100 | 
| R5.xlarge | 32 | 3500 | 450 | N/A | 2700 | 
| R5.2xlarge | 64 | 7100 | 450 | N/A | 4500 | 
| R5.4xlarge | 128 | 14200 | 760 | N/A | 4500 | 
| R5.8xlarge | 256 | 28400 | 1520 | N/A | 4500 | 
| R5.12xlarge | 384 | 30000 | 2280 | N/A | 4500 | 
| R5.16xlarge | 512 | 30000 | 3040 | N/A | 4500 | 

------

You can monitor and alarm on the per instance limits using the following CloudWatch metrics. For more on Amazon DocumentDB CloudWatch metrics, see [Monitoring Amazon DocumentDB with CloudWatch](cloud_watch.md).


| Resource | CloudWatch quota metric | CloudWatch usage metric (1-min. max) | CloudWatch usage metric | 
| --- | --- | --- | --- | 
| Instance Memory | - | - | FreeableMemory | 
| Connections (all) | DatabaseConnectionsLimit | DatabaseConnectionsMax | DatabaseConnections | 
| Cursors | DatabaseCursorsLimit | DatabaseCursorsMax | DatabaseCursors | 
| Transactions | TransactionsOpenLimit | TransactionsOpenMax | TransactionsOpen | 

## Naming constraints
<a name="limits-naming_constraints"></a>

The following table describes naming constraints in Amazon DocumentDB.


| Resource | Default quota | 
| --- | --- | 
| Cluster identifier | +  Length is [1–63] letters, numbers, or hyphens. <br />+  First character must be a letter. <br />+  Cannot end with a hyphen or contain two consecutive hyphens. <br />+  Must be unique for all clusters (across Amazon RDS, Amazon Neptune, and Amazon DocumentDB) per AWS account, per Region.   | 
| Instance identifier | +  Length is [1–63] letters, numbers, or hyphens <br />+  First character must be a letter <br />+  Cannot end with a hyphen or contain two consecutive hyphens <br />+  Must be unique for all instances (across Amazon RDS, Amazon Neptune, and Amazon DocumentDB) per AWS account, per Region.   | 
| Collection name: <col> | Length is [1–255] characters (Amazon DocumentDB 5.0 and later).<br />Length is [1–57] characters (Amazon DocumentDB 4.0 and earlier). | 
| Database name: <db> | Length is [1–63] characters. | 
| Fully qualified collection name:<br />`<db>.<col>` | Length is [3–255] characters (Amazon DocumentDB 5.0 and later).<br />Length is [3–120] characters (Amazon DocumentDB 4.0 and earlier). | 
| Fully qualified index name:<br />`<db>.<col>$<index>` | Length is [6–511] characters (Amazon DocumentDB 5.0 and later).<br />Length is [6–127] characters (Amazon DocumentDB 4.0 and earlier). | 
| Index name | Length is [1–255] characters (Amazon DocumentDB 5.0 and later).<br />Length is [3–63] characters for the combined `<col>$<index>` (Amazon DocumentDB 4.0 and earlier). | 
| Primary password | +  Length is [8-100] printable ASCII characters. <br />+  Can use any printable ASCII characters except for the following:   **/** (forward slash)   **"** (double quotation mark)   **@** (at symbol)    | 
| Primary user name |  +  Length is [1-63] alphanumeric characters. <br />+  First character must be a letter. <br />+  Cannot be a word reserved by the database engine.   | 
| Parameter group name | +  Length is [1–255] alphanumeric characters. <br />+  First character must be a letter. <br />+  Cannot end with a hyphen or contain two consecutive hyphens.  | 

## TTL constraints
<a name="limits.ttl-constraints"></a>

Deletes from a TTL index are not guaranteed within a specific timeframe and are best effort. Factors like instance resource utilization, document size, and overall throughput can affect the timing of a TTL delete.

## Elastic cluster quotas
<a name="elastic.cluster.limits"></a>

The following table describes maximum quotas for Amazon DocumentDB elastic clusters.


| Resource | Quota | 
| --- | --- | 
| Elastic clusters per Region | 20 | 
| vCPU summed across all elastic clusters per Region | 1024 | 
| Manual cluster snapshots per Region | 20 | 
| Shards per cluster | 32 | 
| Storage per cluster (when data is evenly distributed by shard-key) | 4 PiB | 
| Connections to cluster | The lower value of either 300,000 or the number of shards x the connection quota associated with vCPU per shard | 
| UnSharded collection size | 32 TiB | 
| Sharded collection size (when data is evenly distributed by shard-key) | 1PB | 
| Databases per cluster | 10,000 | 
| UnSharded collections per cluster | 100,000 | 
| Sharded collections per cluster | 1000 | 
| Users per cluster | 100 | 
| Writes in a single batch command | 100,000 | 
| Indexes per collection | 64 | 
| Document nesting depth | 100 levels | 
| Document size | 16MB | 
| Index key size | 2048 bytes | 
| Keys in a compound index | 32 | 

## Elastic cluster shard quotas
<a name="elastic.cluster.shard.limits"></a>

The following table describes maximum shard quotas for Amazon DocumentDB elastic clusters.


| Resource | Quota | 
| --- | --- | 
| vCPU per shard instance | 64 | 
| Instances per shard | 16 | 
| Storage per shard | 128 TiB | 
| Storage per collection per shard | 32 TiB | 

## Elastic cluster CPU, memory, connection, and cursor quotas per shard
<a name="elastic.cluster.memory.limits"></a>

The following table describes maximum CPU, memory, connection, and cursor limits in Amazon DocumentDB elastic cluster shards.


| vCPUs per shard | Instance memory (GiB) | Connection quota | Cursor quota | 
| --- | --- | --- | --- | 
| 2 | 16 | 1700 | 450 | 
| 4 | 32 | 3500 | 450 | 
| 8 | 64 | 7100 | 450 | 
| 16 | 128 | 14200 | 760 | 
| 32 | 256 | 28400 | 1520 | 
| 48 | 384 | 30000 | 2280 | 
| 64 | 512 | 30000 | 3040 | 
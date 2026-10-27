

# Quotas and constraints for Amazon Aurora
<a name="CHAP_Limits"></a>

Following, you can find a description of the resource quotas and naming constraints for Amazon Aurora.

**Topics**
+ [Quotas in Amazon Aurora](#RDS_Limits.Limits)
+ [Naming constraints in Amazon Aurora](#RDS_Limits.Constraints)
+ [Amazon Aurora size limits](#RDS_Limits.FileSize.Aurora)

## Quotas in Amazon Aurora
<a name="RDS_Limits.Limits"></a>

Each AWS account has quotas, for each AWS Region, on the number of Amazon Aurora resources that can be created. After a quota for a resource has been reached, additional calls to create that resource fail with an exception.

The following table lists the resources and their quotas per AWS Region.


| Name | Default | Adjustable | Description | 
| --- | --- | --- | --- | 
| Authorizations per DB security group | Each supported Region: 20 | No | Number of security group authorizations per DB security group | 
| Custom endpoints per DB cluster | Each supported Region: 5 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-9372BAB3)  | The maximum number of custom endpoints that you can create per Aurora DB cluster in this account in the current Region. This value reflects the highest number of custom endpoints in a DB cluster in the account. Other DB clusters in the account might have a lower number of custom endpoints. | 
| Custom engine versions | Each supported Region: 40 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-A399AC0B)  | The maximum number of custom engine versions allowed in this account in the current Region | 
| DB cluster parameter groups | Each supported Region: 50 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-E4C808A8)  | The maximum number of DB cluster parameter groups | 
| DB clusters | Each supported Region: 40 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-952B80B8)  | The maximum number of Aurora clusters allowed in this account in the current Region | 
| DB instances | ap-south-1: 20<br />Each of the other supported Regions: 40 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-7B6409FD)  | The maximum number of DB instances allowed in this account in the current Region | 
| DB shard groups | Each supported Region: 5 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-75AC651F)  | The maximum number of DB shard groups for Aurora Limitless Database in this account in the current Region | 
| DB subnet groups | ap-south-1: 20<br />Each of the other supported Regions: 50 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-48C6BF61)  | The maximum number of DB subnet groups | 
| Data API HTTP request body size | Each supported Region: 4 Megabytes | No | The maximum size allowed for the HTTP request body. | 
| Data API maximum concurrent cluster-secret pairs | Each supported Region: 30 | No | The maximum number of unique pairs of Aurora Serverless v1 DB clusters and secrets in concurrent Data API requests for this account in the current AWS Region. | 
| Data API maximum concurrent requests | Each supported Region: 500 | No | The maximum number of Data API requests to an Aurora Serverless v1 DB cluster that use the same secret and can be processed at the same time. Additional requests are queued and processed as in-process requests complete. | 
| Data API maximum result set size | Each supported Region: 1 Megabytes | No | The maximum size of the database result set that can be returned by the Data API. | 
| Data API maximum size of JSON response string | Each supported Region: 10 Megabytes | No | The maximum size of the simplified JSON response string returned by the RDS Data API. | 
| Data API requests per second | Each supported Region: 1,000 per second | No | The maximum number of requests to the Data API per second allowed for this account in the current AWS Region. This quota only applies to Amazon Aurora Serverless v1 clusters. | 
| Event subscriptions | Each supported Region: 20 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-A59F4C87)  | The maximum number of event subscriptions | 
| IAM roles per DB cluster | Each supported Region: 5 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-E094F43D)  | The maximum number of IAM roles associated with a DB cluster | 
| IAM roles per DB instance | Each supported Region: 5 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-DD2301CA)  | The maximum number of IAM roles associated with a DB instance | 
| Integrations | Each supported Region: 100 | No | The maximum number of integrations allowed in this account in the current AWS Region | 
| Manual DB cluster snapshots | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-9B510759)  | The maximum number of manual DB cluster snapshots | 
| Manual DB instance snapshots | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-272F1212)  | The maximum number of manual DB instance snapshots | 
| Option groups | Each supported Region: 20 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-9FA33840)  | The maximum number of option groups | 
| Parameter groups | ap-south-1: 20<br />Each of the other supported Regions: 50 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-DE55804A)  | The maximum number of parameter groups | 
| Proxies | Each supported Region: 20 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-D94C7EA3)  | The maximum number of proxies allowed in this account in the current AWS Region | 
| Read replicas per primary | Each supported Region: 15 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-5BC124EF)  | The maximum number of read replicas per primary DB instance. This quota cant be adjusted for Amazon Aurora. | 
| Reserved DB instances | ap-south-1: 20<br />Each of the other supported Regions: 40 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-78E853F4)  | The maximum number of reserved DB instances allowed in this account in the current AWS Region | 
| Security groups | ap-south-1: 20<br />Each of the other supported Regions: 25 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-732153D0)  | The maximum number of DB security groups | 
| Subnets per DB subnet group | Each supported Region: 20 | No | The maximum number of subnets per DB subnet group | 
| Total storage for all DB instances | Each supported Region: 100,000 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/rds/quotas/L-7ADDB58A)  | The maximum total storage (in GB) on EBS volumes for all Amazon RDS DB instances added together. This quota does not apply to Amazon Aurora, which has a maximum cluster volume of 128 TiB for each DB cluster. | 

**Note**  
By default, you can have up to a total of 40 DB instances. RDS DB instances, Aurora DB instances, Amazon Neptune instances, and Amazon DocumentDB instances apply to this quota.  
If your application requires more DB instances, you can request additional DB instances by opening the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/dashboard). In the navigation pane, choose **AWS services**. Choose **Amazon Relational Database Service (Amazon RDS)**, choose a quota, and follow the directions to request a quota increase. For more information, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-increase.html) in the *Service Quotas User Guide*.  
For RDS for Oracle, you can create up to 15 read replicas per source DB instance in each Region, but we recommend limiting replicas to 5 to minimize replication lag.  
Backups managed by AWS Backup are considered manual DB clustersnapshots, but don't count toward the manual cluster snapshot quota. For information about AWS Backup, see the [*AWS Backup Developer Guide*](https://docs.aws.amazon.com/aws-backup/latest/devguide).

Amazon RDS also limits the rate of API requests for each AWS account in each AWS Region. These limits are separate from the resource quotas in the table and don't appear in Service Quotas. If you exceed them, API requests fail with a `ThrottlingException` error and the message `Rate exceeded`. For the default limits and how to request an increase, see [Request throttling for the Amazon RDS API](rds-api-throttling.md).

## Naming constraints in Amazon Aurora
<a name="RDS_Limits.Constraints"></a>

The naming constraints in Amazon Aurora are as follows:
+ DB cluster identifier:
  + Must contain 1–63 alphanumeric characters or hyphens.
  + First character must be a letter.
  + Can't end with a hyphen or contain two consecutive hyphens.
  + Must be unique for all DB instances per AWS account, per AWS Region.
+ Initial database name – Database name constraints differ between Aurora MySQL and Aurora PostgreSQL. For more information, see the available settings when creating each DB cluster.
+ Master username – Master username constraints differ for each database engine. For more information, see the available settings when creating the DB cluster.
+ Master password:
  + The password for the database master user can include any printable ASCII character except `/`, `'`, `"`, `@`, or a space.
  + The password can contain the following number of printable ASCII characters depending on the DB engine:
    + Aurora MySQL: 8–41
    + Aurora PostgreSQL: 8–99
+ DB parameter group:
  + Must contain 1–255 alphanumeric characters.
  + First character must be a letter.
  + Hyphens are allowed, but the name cannot end with a hyphen or contain two consecutive hyphens.
+ DB subnet group:
  + Must contain 1–255 characters.
  + Alphanumeric characters, spaces, hyphens, underscores, and periods are allowed.

## Amazon Aurora size limits
<a name="RDS_Limits.FileSize.Aurora"></a>

**Storage size limits**  
Aurora cluster volume maximum size varies by engine version:    
**256 TiB maximum:**  
+ Aurora PostgreSQL versions:
  + 17.5 and all higher versions
  + 16.9 and higher
  + 15.13 and higher
+ Aurora MySQL version 3.10 (compatible with MySQL 8.0.42) and higher  
**128 TiB maximum:**  
+ All earlier Aurora PostgreSQL versions
+ Aurora MySQL 3 versions lower than 3.10; Aurora MySQL version 2, versions 2.09 and higher
For more information on automatic storage scaling, see [How Aurora storage automatically resizes](Aurora.Overview.StorageReliability.md#aurora-storage-growth).  
To monitor the remaining storage space, you can use the `AuroraVolumeBytesLeftTotal` metric. For more information, see [Cluster-level metrics for Amazon Aurora](Aurora.AuroraMonitoring.Metrics.md#Aurora.AuroraMySQL.Monitoring.Metrics.clusters).

**SQL table size limits**  
For an Aurora MySQL DB cluster, the maximum table size is 64 tebibytes (TiB). For an Aurora PostgreSQL DB cluster, the maximum table size is 32 tebibytes (TiB). We recommend that you follow table design best practices, such as partitioning of large tables.

**Table space ID limits**  
The maximum table space ID for Aurora MySQL is 2147483647. If you frequently create and drop tables, make sure to be aware of your table space IDs and plan to use logical dumps. For more information, see [Logical migration from MySQL to Amazon Aurora MySQL by using mysqldump](AuroraMySQL.Migrating.ExtMySQL.mysqldump.md).
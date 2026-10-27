

# Quotas and constraints for Amazon RDS
<a name="CHAP_Limits"></a>

Following, you can find a description of the resource quotas and naming constraints for Amazon RDS.

**Topics**
+ [Quotas in Amazon RDS](#RDS_Limits.Limits)
+ [Naming constraints in Amazon RDS](#RDS_Limits.Constraints)
+ [Maximum number of database connections](#RDS_Limits.MaxConnections)
+ [File size limits in Amazon RDS](#RDS_Limits.FileSize)

## Quotas in Amazon RDS
<a name="RDS_Limits.Limits"></a>

Each AWS account has quotas, for each AWS Region, on the number of Amazon RDS resources that can be created. After a quota for a resource has been reached, additional calls to create that resource fail with an exception.

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
The following limitations apply to the Amazon RDS DB instances:  
10 for each SQL Server edition (Enterprise, Standard, Web, and Express) under the "license-included" model
10 for Oracle under the "license-included" model
40 for Db2 under the "bring-your-own-license" (BYOL) licensing model
40 for MySQL, MariaDB, or PostgreSQL
40 for Oracle under the "bring-your-own-license" (BYOL) licensing model
If your application requires more DB instances, you can request additional DB instances by opening the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/dashboard). In the navigation pane, choose **AWS services**. Choose **Amazon Relational Database Service (Amazon RDS)**, choose a quota, and follow the directions to request a quota increase. For more information, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-increase.html) in the *Service Quotas User Guide*.  
For RDS for Oracle, you can create up to 15 read replicas per source DB instance in each Region, but we recommend limiting replicas to 5 to minimize replication lag.  
Backups managed by AWS Backup are considered manual DB snapshots, but don't count toward the manual snapshot quota. For information about AWS Backup, see the [*AWS Backup Developer Guide*](https://docs.aws.amazon.com/aws-backup/latest/devguide).

Note that the default quota for cross-Region automated backups is 20 for an AWS account, the default quota for the number of concurrent snapshot copy requests is 20 for each Region for an AWS account, and the default quota for the number of concurrent cross-Region read replica requests is 20 for each Region for an AWS account.

Amazon RDS also limits the rate of API requests for each AWS account in each AWS Region. These limits are separate from the resource quotas in the table and don't appear in Service Quotas. If you exceed them, API requests fail with a `ThrottlingException` error and the message `Rate exceeded`. For the default limits and how to request an increase, see [Request throttling for the Amazon RDS API](rds-api-throttling.md).

## Naming constraints in Amazon RDS
<a name="RDS_Limits.Constraints"></a>

The naming constraints in Amazon RDS are as follows:
+ DB instance identifier:
  + Must contain 1–63 alphanumeric characters or hyphens.
  + First character must be a letter.
  + Can't end with a hyphen or contain two consecutive hyphens.
  + Must be unique for all DB instances per AWS account, per AWS Region.
+ Initial database name:
  + Database name constraints differ for each database engine. For more information, see the available settings when creating each DB instance.
  + SQL Server – Create your databases after creating your DB instance.
+ Master username – Master username constraints differ for each database engine. For more information, see the available settings when creating the DB instance.
+ Master password:
  + The password for the database master user can include any printable ASCII character except `/`, `'`, `"`, `@`, or a space.

    For Oracle, `&` is an additional character limitation.
  + The password can contain the following number of printable ASCII characters depending on the DB engine:
    + Db2: 8–255
    + MariaDB and MySQL: 8–41
    + Oracle: 8–30
    + SQL Server and PostgreSQL: 8–128
+ DB parameter group:
  + Must contain 1–255 alphanumeric characters.
  + First character must be a letter.
  + Hyphens are allowed, but the name cannot end with a hyphen or contain two consecutive hyphens.
+ DB subnet group:
  + Must contain 1–255 characters.
  + Alphanumeric characters, spaces, hyphens, underscores, and periods are allowed.

## Maximum number of database connections
<a name="RDS_Limits.MaxConnections"></a>

The maximum number of simultaneous database connections varies by the DB engine type and the memory allocation for the DB instance class. The maximum number of connections is generally set in the parameter group associated with the DB instance. The exception is Microsoft SQL Server, where it is set in the server properties for the DB instance in SQL Server Management Studio (SSMS).

Database connections consume memory. Setting one of these parameters too high can cause a low memory condition that might cause a DB instance to be placed in the **incompatible-parameters** status. For more information, see [Diagnosing and resolving incompatible parameters status for a memory limit](CHAP_Troubleshooting.md#CHAP_Troubleshooting.incompatible-parameters-memory).

If your applications frequently open and close connections, or keep a large number of long-lived connections open, we recommend that you use Amazon RDS Proxy. RDS Proxy is a fully managed, highly available database proxy that uses connection pooling to share database connections securely and efficiently. To learn more about RDS Proxy, see [Amazon RDS Proxy](rds-proxy.md).

**Note**  
For Oracle, you set the maximum number of user processes and user and system sessions.  
For Db2, you can't set maximum connections. The limit is 64000.

The following table shows information about the maximum database connections for different DB engines.


| DB engine | Parameter | Allowed values | Default value | Description | 
| --- | --- | --- | --- | --- | 
| MariaDB | max\_connections | 1–100000 |  +  For MariaDB 10.5 and higher versions, the default is: <br />LEAST({DBInstanceClassMemory/25165760},12000) <br />The formula is effectively equivalent to MB/25. <br />If the default value calculation results in a value greater than 12,000, Amazon RDS sets the limit to 12,000. <br />+  For MariaDB version 10.4: <br />{DBInstanceClassMemory/12582880} <br />The formula is effectively equivalent to MB/12.   | Number of simultaneous client connections allowed | 
| MySQL | max\_connections | 1–100000 | {DBInstanceClassMemory/12582880}<br />The formula is effectively equivalent to MB/12. | Number of simultaneous client connections allowed | 
| Oracle | processes | 80–20000 | LEAST({DBInstanceClassMemory/9868951}, 20000) | User processes | 
| Oracle | sessions | 100–65535 | Not applicable | User and system sessions | 
| PostgreSQL | max\_connections | 6–262143 | LEAST({DBInstanceClassMemory/9531392}, 5000) | Maximum number of concurrent connections | 
| SQL Server | user connections | 0–32767 | 0 (unlimited) | Maximum number of concurrent connections. For more information, see [Configure the user connections (server configuration option)](https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-the-user-connections-server-configuration-option?view=sql-server-ver16). | 

`DBInstanceClassMemory` is in bytes. For details about how this value is calculated, see [Specifying DB parameters](USER_ParamValuesRef.md). Because of memory reserved for the operating system and RDS management processes, this memory size is smaller than the value in gibibytes (GiB) shown in [Hardware specifications for DB instance classes](Concepts.DBInstanceClass.Summary.md).

For example, some DB instance classes have 8 GiB of memory, which is 8,589,934,592 bytes. For a MySQL DB instance running on a DB instance class with 8 GiB of memory, such as db.m7g.large, the equation that uses the total memory would be `8589934592/12582880=683`. However, the variable `DBInstanceClassMemory` automatically subtracts the amounts reserved to the operating system and the RDS processes that manage the DB instance. The remainder of the subtraction is then divided by 12,582,880. This calculation results in approximately 630 for the value of `max_connections` instead of 683. This value depends on the DB instance class and DB engine.

When a MariaDB or MySQL DB instance is running on a small DB instance class, such as db.t3.micro or db.t3.small, the total memory available is low. For these DB instance classes, RDS reserves a significant portion of the available memory, which affects the value `max_connections`. For example, the default maximum number of connections for a MySQL DB instance running on a db.t3.micro DB instance class is approximately 60. You can determine the `max_connections` value for your DB MariaDB or MySQL DB instance by connecting to it and running the following SQL command:

```
SHOW GLOBAL VARIABLES LIKE 'max_connections';
```

## File size limits in Amazon RDS
<a name="RDS_Limits.FileSize"></a>

File size limits apply to certain Amazon RDS DB instances. For more information, see the following engine-specific limits:
+ [MariaDB file size limits in Amazon RDS](CHAP_MariaDB.Limitations.md#RDS_Limits.FileSize.MariaDB)
+ [MySQL file size limits in Amazon RDS](MySQL.KnownIssuesAndLimitations.md#MySQL.Concepts.Limits.FileSize)
+ [Oracle file size limits in Amazon RDS](Oracle.Concepts.limitations.md#Oracle.Concepts.file-size-limits)
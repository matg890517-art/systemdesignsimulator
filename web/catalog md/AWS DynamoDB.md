

# Quotas in Amazon DynamoDB
<a name="ServiceQuotas"></a>

This section describes current quotas, formerly referred to as limits, within Amazon DynamoDB. Each quota applies on a per-Region basis unless otherwise specified.

**Note**  
All size measurements in DynamoDB use binary-based units. DynamoDB denotes 1 KB = 1024 bytes, 1 MB = 1024 KB, 1 GB = 1024 MB, 1 TB = 1024 GB.

**Topics**
+ [Read/write throughput](#default-limits-throughput-capacity-modes)
+ [Reserved Capacity](#reserved-capacity)
+ [Tables](#limits-tables)
+ [Global tables](#gt-limits-throughput)
+ [Secondary indexes](#limits-secondary-indexes)
+ [Vector indexes](#limits-vector-indexes)
+ [Projected secondary index attributes](#projected-secondary-index-attributes)
+ [DynamoDB Streams](#limits-dynamodb-streams)
+ [Import from Amazon S3](#import-limits)
+ [Table export to Amazon S3](#limits-table-export)
+ [Backup and restore](#limits-backup-restore)
+ [Contributor Insights](#contributor-insights-quotas)

## Read/write throughput
<a name="default-limits-throughput-capacity-modes"></a>

### Throughput default quotas
<a name="default-limits-throughput"></a>

AWS places some default quotas on the throughput that your account can provision and consume within a Region. 

The account-level read throughput and account-level write throughput quotas apply at the account level. These account-level quotas apply to the sum of the provisioned throughput capacity for all your account’s tables and global secondary indexes in a given Region. All the account's available throughput can be provisioned for a single table or across multiple tables. These quotas only apply to tables using the provisioned capacity mode.

The table-level read throughput and table-level write throughput quotas apply differently to tables that use the provisioned capacity mode, and tables that use the on-demand capacity mode.

For provisioned capacity mode tables and GSIs, the quota is the maximum amount of read and write capacity units that can be provisioned for any table or any of its GSIs in the Region. The total of any individual table and all its GSIs must also remain below the account-level read and write throughput quota. This is in addition to the requirement that the total of all provisioned tables and their GSIs must remain below the account-level read and write throughput quota. 

For on-demand capacity mode tables and GSIs, the table-level quota is the maximum read and write capacity units that are available for any table, or any individual GSI within that table. No account-level read and write throughput quotas are applied to tables in on-demand mode.

Following are the throughput quotas that apply on your account, by default.

**Note**  
All capacity unit and request unit quotas are measured per second. For example, a quota of 40,000 read capacity units means 40,000 reads per second.

**Note**  
You can request any number of read capacity units (RCU) or write capacity units (WCU) for your DynamoDB tables through a service quota increase. The values listed in the following table represent the initial default quotas. These are not maximum limits for your tables.


| Throughput quota name | On-Demand | Provisioned | Adjustable | 
| --- | --- | --- | --- | 
| Per table | 40,000 read request units and 40,000 write request units | 40,000 read capacity units and 40,000 write capacity units | Yes | 
| Per account | Not applicable | 80,000 read capacity units and 80,000 write capacity units | Yes | 
| Minimum throughput for any table or global secondary index | Not applicable | 1 read capacity unit and 1 write capacity unit | Yes | 

### Increasing or decreasing throughput (for provisioned tables)
<a name="decreasing-increasing-throughput"></a>

#### Increasing provisioned throughput
<a name="limits-increasing-provisioned-throughput"></a>

You can increase `ReadCapacityUnits` or `WriteCapacityUnits` as often as necessary, using the AWS Management Console or the `UpdateTable` operation. In a single call, you can increase the provisioned throughput for a table, for any global secondary indexes on that table, or for any combination of these. The new settings do not take effect until the `UpdateTable` operation is complete.

You can't exceed your per-account quotas when you add provisioned capacity, and DynamoDB doesn't allow you to increase provisioned capacity very rapidly. Aside from these restrictions, you can increase the provisioned capacity for your tables as high as you need. For more information about per-account quotas, see the preceding section, [Throughput default quotas](#default-limits-throughput).

#### Decreasing provisioned throughput
<a name="limits-decreasing-provisioned-throughput"></a>

For every table and global secondary index in an `UpdateTable` operation, you can decrease `ReadCapacityUnits` or `WriteCapacityUnits` (or both). The new settings don't take effect until the `UpdateTable` operation is complete. 

There is a default quota on the number of provisioned capacity decreases you can perform on your DynamoDB table per day. A day is defined according to Universal Time Coordinated (UTC). You start each day with 4 available decreases. Each hour, 1 additional decrease becomes available, up to the maximum of 4 available at any time. Over a full 24-hour day, this allows you to decrease up to 27 times (4 in the first hour, plus 1 for each of the remaining 23 hours).

**Important**  
Table and global secondary index decrease limits are decoupled, so any global secondary indexes for a particular table have their own decrease limits. However, if a single request decreases the throughput for a table and a global secondary index, it is rejected if either exceeds the current limits. Requests are not partially processed. 

**Example**  
In the first 4 hours of a day, a table with a global secondary index can be modified as follows:   
+  Decrease the table's `WriteCapacityUnits` or `ReadCapacityUnits` (or both) four times. 
+  Decrease the `WriteCapacityUnits` or `ReadCapacityUnits` (or both) of the global secondary index four times. 
 At the end of that same day, the table and the global secondary index throughput can potentially be decreased a total of 27 times each. 

## Reserved Capacity
<a name="reserved-capacity"></a>

 AWS places a default quota on the amount of active reserved capacity that your account can purchase. The quota limit is a combination of reserved capacity for write capacity units (WCUs) and read capacity units (RCUs). 


| Reserved capacity quota | Active reserved capacity | Adjustable | 
| --- | --- | --- | 
|  Per account  |  1,000,000 provisioned capacity units (WCUs \_ RCUs)  |  Yes  | 

 If you attempt to purchase more than 1,000,000 provisioned capacity units in a single purchase, you will receive an error for this service quota limit. If you have active reserved capacity and attempt to purchase additional reserved capacity that would result in more than 1,000,000 active provisioned capacity units, you will receive an error for this service quota limit.

## Tables
<a name="limits-tables"></a>

### Table size
<a name="limits-table-size"></a>

There is no practical limit on a table's size. Tables are unconstrained in terms of the number of items or the number of bytes.

### Maximum number of tables per account per region
<a name="limits-tables-per-account"></a>

For any AWS account, there is an initial quota of 2,500 tables per AWS Region.

If you need more than 2,500 tables for a single account, please reach out to your AWS account team to explore an increase up to a maximum of 10,000 tables. For more than 10,000, the recommended best practice is to setup multiple accounts, each of which can serve up to 10,000 tables.

## Global tables
<a name="gt-limits-throughput"></a>

The following default quotas apply when using global tables.


| Default global table quotas | On-Demand | Provisioned | 
| --- | --- | --- | 
| Number of MRSC global tables (See [Consistency modes](V2globaltables_HowItWorks.md#V2globaltables_HowItWorks.consistency-modes)) | 400 total MRSC global tables in any capacity mode | 400 total MRSC global tables in any capacity mode | 
| Throughput per table configured for multi-Region eventual consistency (MREC) | 40,000 read request units and 40,000 write request units | 40,000 read capacity units and 40,000 write capacity units | 
| Throughput per table configured for multi-Region strong consistency (MRSC) | 40,000 read request units and 40,000 write request units | 40,000 read capacity units and 40,000 write capacity units | 
| Backfilled data for new replicas per account, per Region, per day | 10 TB | 10 TB | 

**Note**  
There may be instances where you will need to request a quota limit increase through AWS Support. If any of the following apply to you, please see [https://aws.amazon.com/support](https://aws.amazon.com/support):  
Global table throughput quotas must be equal to or greater than per table throughput quotas for replica creation to succeed. There are separate global table throughput quotas for MREC and MRSC global tables.
If you are adding a replica or replicas to one destination Region within a 24-hour period with a combined total greater than 10TB, you must request a service quota increase for your add replica data backfill quota.
The table-level write throughput limit must be the same in every Region that has a replica. If you raise the table-level write throughput limit above the default in one Region, request a matching quota increase in every other replica Region before you add a replica. Otherwise, replica creation may fail with an error similar to the following:  
Cannot create a replica of table 'example\_table' in region 'example\_region\_A' because its exceeds your current account limit in region 'example\_region\_B'.
If you receive this error, make sure your table-level write throughput limits match across all Regions where you are adding a replica. You can adjust these limits yourself through the Service Quotas console. For the table-level write throughput quota, see [Read/write throughput](#default-limits-throughput-capacity-modes). If all Regions match and you still receive the error, contact AWS Support at [https://aws.amazon.com/support](https://aws.amazon.com/support), because additional allow-listing might be required.

## Secondary indexes
<a name="limits-secondary-indexes"></a>

You can define up to 5 local secondary indexes per table. 

 There is a default quota of 20 global secondary indexes per table.

## Vector indexes
<a name="limits-vector-indexes"></a>

The following quotas apply to vector indexes.


| Quota | Default | Adjustable | 
| --- | --- | --- | 
| Vector indexes per table | 5 | Yes (contact AWS Support) | 
| Maximum dimensions per vector index | 4,096 | No | 
| Maximum TopK per SearchVectors request | 100 | No | 
| Maximum partition keys (HASH) per vector index | 1 | No | 
| Vector search rate per partition key | 1 GBps | Yes (contact AWS Support) | 
| Vector index write rate per partition key | 10 MBps | Yes (contact AWS Support) | 
| Number of inline filters per vector index | 18 | No | 
| Maximum base table size for vector index creation without allowlisting | 600 GB | Yes (contact AWS Support) | 
| Concurrent vector index creations or deletions per table | 1 | No | 

**Example.** With a 768-dimensional embedding (such as Cohere Embed v3) and 1 KB of non-vector item data, each item is approximately 4 KB. At this item size, the per-partition-key throughput limits support approximately 250,000 vectors examined per second (1 GBps ÷ 4 KB) and 2,500 vector writes per second (10 MBps ÷ 4 KB). As the number of vectors in a partition grows, each search examines more data and you will approach the search limit sooner. Throughput scales linearly across partition key values. If your workload exceeds these limits, contact AWS Support.

## Projected secondary index attributes
<a name="projected-secondary-index-attributes"></a>

You can project up to 100 attributes combined for all of a table's local and global secondary indexes. This quota only applies to user-specified projected attributes.

For the `CreateTable` operation, if you specify a `ProjectionType` of `INCLUDE`, the total count of attributes specified in `NonKeyAttributes` summed across all secondary indexes must not exceed 100. Projecting the same attribute name into two different indexes counts as two distinct attributes toward the quota.

This quota doesn't apply to secondary indexes with a `ProjectionType` of `KEYS_ONLY` or `ALL`.

## DynamoDB Streams
<a name="limits-dynamodb-streams"></a>

### Simultaneous readers of a shard in DynamoDB Streams
<a name="limits-dynamodb-streams-simultaneous"></a>

For single-Region tables that are not global tables, you can design for up to two simultaneous processes to read from the same DynamoDB Streams shard at the same time. Exceeding this limit can result in request throttling. For global tables, we recommend you limit the number of simultaneous readers to one to avoid request throttling.

### Maximum write capacity for a table with DynamoDB Streams enabled
<a name="limits-dynamodb-streams-max-write-capacity"></a>

AWS places some default quotas on the write capacity for DynamoDB tables with DynamoDB Streams enabled. These default quotas are applicable only for tables in provisioned read/write capacity mode.
+ Per table – 40,000 write capacity units

## Import from Amazon S3
<a name="import-limits"></a>

DynamoDB Import from Amazon S3 can support up to 50 concurrent import jobs with a total import source object size of 15TB at a time in us-east-1, us-west-2, and eu-west-1 regions. In all other regions, up to 50 concurrent import tasks with a total size of 1TB is supported. Each import job can take up to 50,000 Amazon S3 objects in all regions. For more information on import and validation, see [ import format quotas and validation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/S3DataImport.Validation.html#S3DataImport.Validation.limits).

## Table export to Amazon S3
<a name="limits-table-export"></a>

Full export: up to 300 concurrent export tasks, or up to a total of 100TB from all in-flight table exports, can be exported. Both of these limits are checked before an export is queued.

Incremental export: DynamoDB Incremental Export to Amazon S3 can support up to 300 concurrent export jobs or up to a total of 100TB from all in-flight table exports. The export period window limits are 15 minutes minimum and 24 hours maximum.

## Backup and restore
<a name="limits-backup-restore"></a>

DynamoDB supports up to 50 concurrent restores totaling 50 TB through DynamoDB on-demand or continuous backups. AWS Backup supports up to 50 concurrent restores totaling 25 TB.

## Contributor Insights
<a name="contributor-insights-quotas"></a>

When you enable Customer Insights on your DynamoDB table, you're still subject to Contributor Insights rules limits. For more information, see [CloudWatch service quotas](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_limits.html).


# Quotas for Amazon Keyspaces (for Apache Cassandra)
<a name="quotas"></a>

This section describes current quotas and default values for Amazon Keyspaces (for Apache Cassandra).



**Topics**
+ [Amazon Keyspaces service quotas](#table)
+ [Increasing or decreasing throughput (for provisioned tables)](#decreasing-increasing-throughput)
+ [Amazon Keyspaces encryption at rest](#quotas-encryption)
+ [Quotas and default values for user-defined types (UDTs) in Amazon Keyspaces](#quotas-udts)

## Amazon Keyspaces service quotas
<a name="table"></a>

The following table contains Amazon Keyspaces (for Apache Cassandra) quotas and the default values. Information about which quotas can be adjusted is available in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console, where you can also request quota increases. For more information on quotas, contact AWS Support.


| Quota | Description | Amazon Keyspaces default | 
| --- | --- | --- | 
| Max keyspaces per AWS Region | The maximum number of keyspaces for this subscriber per Region. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console.  |  256  | 
| Max tables per AWS Region | The maximum number of tables across all keyspaces for this subscriber per Region. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  256  | 
| Max amount of data restored using `ADD REGION` operations | The maximum size of data that can be concurrently restored by `ADD REGION` operations. To increase the amount of data to be concurrently restored, contact Support.  |  10 TB  | 
| Max table schema size | The maximum size of a table schema.  |  350 KB  | 
| Max concurrent DDL operations | The maximum number of concurrent DDL operations allowed for this subscriber per Region.  |  50  | 
| Max queries per connection | The maximum number of CQL queries that can be processed by a single client TCP connection per second.  |  3000  | 
| Max row size | The maximum size of a row, excluding static column data. For details, see [Estimate row size in Amazon Keyspaces](calculating-row-size.md). |  1 MB  | 
| Max number of columns in `INSERT` and `UPDATE` statements | The maximum number of columns allowed in CQL `INSERT` or `UPDATE` statements. An `INSERT` or `UPDATE` statement supports up to 225 regular columns when Time to Live (TTL) is turned off. If TTL is turned on, up to 166 regular columns can be modified in a single operation. | 225/166 | 
| Max static data per logical partition | The maximum aggregate size of static data in a logical partition. For details, see [Calculate the static column size per logical partition in Amazon Keyspaces](static-columns-estimate.md). |  1 MB  | 
| Max subqueries per `IN` `SELECT` statement | The maximum number of subqueries you can use for the `IN` keyword in a `SELECT` statement. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. | 100 | 
| Max number of nested frozen collections per AWS Region | The maximum number of nested collections supported when you're using the `FROZEN` keyword for a column with a collection data type. For more information about frozen collections, see [Collection types](cql.elements.md#cql.data-types.collection). To increase the nesting level, contact Support.  | 8 | 
| Max number of statements in a logged batch | The maximum number of CQL statements supported when you're using a logged batch statment. For more information about batch statements, see [Use batch statements in Amazon Keyspaces](batchStatements.md). | 100 | 
| Max number of statements in a logged batch using static columns | The maximum number of CQL statements supported when you're using static columns in a logged batch statment. For more information about batch statements, see [Use batch statements in Amazon Keyspaces](batchStatements.md). | 50 | 
| Max size of logged batch statement | The maximum size of a logged batch statment. For more information about batch statements, see [Use batch statements in Amazon Keyspaces](batchStatements.md). | 4MB | 
| Max number of statements in an unlogged batch | The maximum number of CQL statements supported when you're using an unlogged batch statment. For more information about batch statements, see [Use batch statements in Amazon Keyspaces](batchStatements.md). | 30 | 
| Max read throughput per second | The maximum read throughput per second—read request units (RRUs) or read capacity units (RCUs)—that can be allocated to a table per Region. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  40,000  | 
| Max write throughput per second | The maximum write throughput per second—write request units (WRUs) or write capacity units (WCUs)—that can be allocated to a table per Region. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  40,000  | 
| Max write throughput for a table using change-data-capture (CDC) | The maximum write capacity for an Amazon Keyspaces table with CDC enabled. This default quota only applies to tables in provisioned read/write capacity mode. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  40,000  | 
| Account-level read throughput (provisioned) | The maximum number of aggregate read capacity units (RCUs) allocated for the account per Region. This is applicable only for tables in provisioned read/write capacity mode. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  80,000  | 
| Account-level write throughput (provisioned) | The maximum number of aggregate write capacity units (WCU) allocated for the account per Region. This is applicable only for tables in provisioned read/write capacity mode. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  80,000  | 
| Max number of scalable targets per Region per account | The maximum number of scalable targets for the account per Region. An Amazon Keyspaces table counts as one scalable target if auto scaling is enabled for read capacity, and as another scalable target if auto scaling is enabled for write capacity. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/application-autoscaling/quotas) console for Application Auto Scaling by choosing **Scalable targets for Amazon Keyspaces**. |  1,500  | 
| Max partition key size | The maximum size of the compound partition key. Up to 3 bytes of additional storage are added to the raw size of each column included in the partition key for metadata.  |  2048 bytes  | 
| Max clustering key size | The maximum combined size of all clustering columns. Up to 4 bytes of additional storage are added to the raw size of each clustering column for metadata.  |  850 bytes  | 
| Max concurrent table restores using Point-in-time Recovery (PITR) | The maximum number of concurrent table restores using PITR per subscriber is 4. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  4  | 
| Max amount of data restored using point-in-time recovery (PITR) | The maximum size of data that can be restored using PITR within 24 hours. You can adjust this default value in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console. |  5 TB  | 

## Increasing or decreasing throughput (for provisioned tables)
<a name="decreasing-increasing-throughput"></a>

### Increasing provisioned throughput
<a name="limits-increasing-provisioned-throughput"></a>

You can increase `ReadCapacityUnits` or `WriteCapacityUnits` as often as necessary by using the console or the `ALTER TABLE` statement. The new settings don't take effect until the `ALTER TABLE` operation is complete.

You can't exceed your per-account quotas when you add provisioned capacity. And you can increase the provisioned capacity for your tables as much as you need. For more information about per-account quotas, see the preceding section, [Amazon Keyspaces service quotas](#table).

### Decreasing provisioned throughput
<a name="limits-decreasing-provisioned-throughput"></a>

For every table in an `ALTER TABLE` statement, you can decrease `ReadCapacityUnits` or `WriteCapacityUnits` (or both). The new settings don't take effect until the `ALTER TABLE` operation is complete. 

A decrease is allowed up to four times, anytime per day. A day is defined according to Universal Coordinated Time (UTC). Additionally, if there was no decrease in the past hour, an additional decrease is allowed. This effectively brings the maximum number of decreases in a day to 27 (4 decreases in the first hour, and 1 decrease for each of the subsequent 1-hour windows in a day). 

## Amazon Keyspaces encryption at rest
<a name="quotas-encryption"></a>

You can change encryption options between an AWS owned AWS KMS key and a customer managed AWS KMS key up to four times within a 24-hour window, on a per table basis, starting from when the table was created. If there was no change in the past six hours, an additional change is allowed. This effectively brings the maximum number of changes in a day to eight (four changes in the first six hours, and one change for each of the subsequent six-hour windows in a day).

You can change the encryption option to use an AWS owned AWS KMS key as often as necessary, even if the earlier quota has been exhausted.

These are the quotas unless you request a higher amount. To request a service quota increase, see [Support](https://console.aws.amazon.com/support/home#/).

## Quotas and default values for user-defined types (UDTs) in Amazon Keyspaces
<a name="quotas-udts"></a>

### Amazon Keyspaces UDT quotas and default values
<a name="udt-table"></a>

The following table contains quotas and default values related to UDTs in Amazon Keyspaces. Information about which quotas can be adjusted is available in the [Service Quotas](https://console.aws.amazon.com/servicequotas/home#!/services/cassandra/quotas) console, where you can also request quota increases. For more information about these quotas, contact AWS Support.


| Quota | Description | Amazon Keyspaces default | 
| --- | --- | --- | 
| Max number of UDTs per AWS Region | The maximum number of UDTs across all keyspaces for this subscriber per Region.  |  256  | 
| Max number of tables per UDT | The maximum number of tables that can reference the same UDT.  |  100  | 
| Max number of UDTs per table | The maximum number of UDTs that a table can reference.  |  50  | 
| Max level of nesting of UDTs | The maximum nesting depth supported for UDTs.  |  8  | 
| Max amount of direct child UDTs per UDT | The maximum number of child UDTs supported for a UDT.  |  10  | 
| Max amount of direct parent UDTs per UDT | The maximum number of parent UDTs supported for a UDT. |  10  | 
| Max UDT schema size | The maximum size of the schema for a UDT.  |  25 KB  | 
| Max UDT name length | The maximum number of characters in the UDT name.  |  48  | 
| Max UDT field name length | The maximum number of characters in a UDT field name.  |  128  | 
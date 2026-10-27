

# Service Quotas
<a name="service-limits"></a>

**Note**  
The Service Quotas console provides information about Amazon Athena quotas. You can also use the Service Quotas console to [request quota increases](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/athena/quotas) for the quotas that are adjustable. For AWS Glue related schema limitations, see the [AWS Glue endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html) page. For general information about AWS service quotas, see [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html) in the *AWS General Reference*.

## Queries
<a name="service-limits-queries"></a>

Your account has the following query-related quotas for Amazon Athena. For details, see the [Amazon Athena endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/athena.html#amazon-athena-limits) page of the AWS General Reference.
+ **Active DDL queries** – The number of active DDL queries. DDL queries include `CREATE TABLE` and `ALTER TABLE ADD PARTITION` queries. 
+ **DDL query timeout** – The maximum amount of time in minutes a DDL query can run before it gets cancelled.
+ **Active DML queries** – The number of active DML queries. DML queries include `SELECT`, `CREATE TABLE AS` (CTAS), and `INSERT INTO` queries. The specific quotas vary by AWS Region.
+ **DML query timeout** – The maximum amount of time in minutes a DML query can run before it gets cancelled. You can request an increase in this timeout up to a maximum of 240 minutes.

To request quota increases, you can use the [Athena Service Quotas](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/athena/quotas) console.

Athena processes queries by assigning resources based on the overall service load and the number of incoming requests. Your queries may be temporarily queued before they run. Asynchronous processes pick up the queries from queues and run them on physical resources as soon as the resources become available and for as long as your account configuration permits.

The Active DML queries and Active DDL queries quotas include both running and queued queries. For example, if your Active DML query quota is 25 and your total of running and queued queries is 26, query 26 will result in a TooManyRequestsException error. 

**Note**  
If you would like to control concurrency directly for the queries you run in Athena, you can use capacity reservations. For more information, see [Manage query processing capacity](capacity-management.md).

### Query string length
<a name="service-limits-query-string-length"></a>

The maximum allowed query string length is 262144 bytes, where the strings are encoded in UTF-8. This is not an adjustable quota. However, you can work around this limitation by splitting long queries into multiple smaller queries. For more information, see [How can I increase the maximum query string length in Athena?](https://aws.amazon.com/premiumsupport/knowledge-center/athena-query-string-length/) in the AWS Knowledge Center.

## Workgroups
<a name="service-limits-workgroups"></a>

When you work with Athena workgroups, remember the following points:
+ Athena service quotas are shared across all workgroups in an account.
+ The maximum number of workgroups you can create per Region in an account is 1000.
+ The maximum number of prepared statements in a workgroup is 1000.
+ The maximum number of tags per workgroup is 50. For more information, see [Tag restrictions](tags.md#tag-restrictions). 

## Databases, tables, and partitions
<a name="service-limits-glue"></a>

Athena uses the AWS Glue Data Catalog. For service quotas on tables, databases, and partitions (for example, the maximum number of databases or tables per account), see [AWS Glue endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html). Note that, although Athena supports querying AWS Glue tables that have 10 million partitions, Athena cannot read more than 1 million partitions in a single scan.

## Amazon S3 buckets
<a name="service-limits-buckets"></a>

When you work with Amazon S3 buckets, remember the following points:
+ Amazon S3 has a default service quota of 10,000 buckets per account.
+ Athena requires a separate bucket to log results.
+ You can request a quota increase of up to one million Amazon S3 buckets per AWS account. 

## Per account API call quotas
<a name="service-limits-api-calls"></a>

Athena APIs have default quotas for the number of calls to the API per account (not per query). For a complete list of the default quotas, see [Service quotas](https://docs.aws.amazon.com/general/latest/gr/athena.html#amazon-athena-limits) table in the AWS General Reference guide.

If you use any of these APIs and exceed the default quota for the number of calls per second, or the burst capacity in your account, the Athena API issues an error similar to the following: ""ClientError: An error occurred (ThrottlingException) when calling the *<API\_name>* operation: Rate exceeded." Reduce the number of calls per second, or the burst capacity for the API for this account. 

You can change the Athena quota for per account API calls in the [Athena Service Quotas console](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/athena/quotas). 
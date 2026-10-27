

# Quotas and limits
<a name="service-sizes-and-limits"></a>

The following table describes stream and shard quotas and limits for Amazon Kinesis Data Streams.



<table>
<thead>
  <tr><th>Quota</th><th>On-demand mode</th><th>Provisioned mode</th></tr>
</thead>
<tbody>
  <tr><td>Number of data streams</td><td>There's no upper quota on the number of streams within your AWS account. By default, you can create up to 50 data streams with the on-demand capacity mode. If you require an increase of this quota, raise a <a href="https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase">support ticket</a>.</td><td>There's no upper quota on the number of streams with the provisioned mode within an account.</td></tr>
  <tr><td>Number of shards</td><td>There's no upper limit. Number of shards depends on the amount of data ingested and the level of throughput you require. Kinesis Data Streams automatically scales the number of shards in response to changes in data volume and traffic.</td><td>There's no upper limit. The default shard quota is 20,000 shards per AWS account for the following AWS Regions:<ul><li> <i>US East (N. Virginia)</i> </li><li> <i>US West (Oregon)</i> </li><li> <i>Europe (Ireland)</i> </li></ul><br />For all other Regions, the default shard quota is 1,000 or 6,000 shards per AWS account. You can view your account's shard quota and utilization through the Service Quotas console at <a href="https://console.aws.amazon.com/servicequotas/">https://console.aws.amazon.com/servicequotas/</a>.<br />To request an increase to the shard quota, use the Service Quotas console or AWS CLI. For more information, see <a href="https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html">Requesting a quota increase</a>.</td></tr>
  <tr><td>Data stream throughput</td><td>By default, new data streams created with the on-demand capacity mode have 4 MB/s of write and 8 MB/s of read throughput. In <i>US East (N. Virginia)</i>, <i>US West (Oregon)</i>, and <i>Europe (Ireland)</i> AWS Regions, data streams with the on-demand capacity mode scale up to 10 GB/s of write and 20 GB/s read throughput. For other Regions, data streams with the on-demand capacity mode scale up to 200 MB/s of write and 400 MB/s read throughput. If you require an increase up to 10 GB/s write and 20 GB/s read capacity for these Regions, submit a <a href="https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase">support ticket</a>.</td><td>There is no upper limit. Maximum throughput depends on the number of shards provisioned for the stream. Each shard can support up to 1 MB/sec or 1,000 records/sec write throughput or up to 2 MB/sec or 2,000 records/sec read throughput. If you need more ingest capacity, you can easily scale up the number of shards in the stream using the AWS Management Console or the <a href="https://docs.aws.amazon.com/kinesis/latest/APIReference/API_UpdateShardCount.html">UpdateShardCount</a> API.</td></tr>
  <tr><td>Data payload size</td><td colspan="2">The maximum size of the data payload of a record before <code>base64-encoding</code> is up to 10 MiB. Kinesis is designed to handle intermittent large records (1-10MiB in size) using burst capacity. </td></tr>
  <tr><td><code>GetRecords</code> transaction size</td><td colspan="2"> <a href="https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html">GetRecords</a> can retrieve up to 10 MB of data per call from a single shard, and up to 10,000 records per call. Each call to <code>GetRecords</code> is counted as one read transaction. Each shard can support up to five read transactions per second. Each read transaction can provide up to 10,000 records with an upper quota of 10 MB per transaction.</td></tr>
  <tr><td>Data read rate per shard</td><td colspan="2"> Each shard can support up to a maximum total data read rate of 2 MB per second via <a href="https://docs.aws.amazon.com/kinesis/latest/APIReference/API_GetRecords.html">GetRecords</a>. If a call to <code>GetRecords</code> returns 10 MB, subsequent calls made within the next 5 seconds throw an exception.</td></tr>
  <tr><td>Number of registered consumers per data stream</td><td colspan="2"> With Kinesis On-demand Advantage mode, you can create up to 50 registered consumers (Enhanced Fan-out). With Kinesis On-Demand Standard and Kinesis Provisioned modes, you can create up to 20 registered consumers (Enhanced Fan-out Limit) for each data stream.</td></tr>
  <tr><td>Switching between provisioned and on-demand modes </td><td colspan="2"> For each data stream in your AWS account, you can switch between the on-demand and provisioned capacity modes twice within 24 hours.  </td></tr>
  <tr><td>Streaming tables and Amazon S3 delivery</td><td>For quotas and limits that apply to streaming tables and Amazon S3 delivery, see <a href="data-delivery-quotas.md">Delivery quotas and limits</a>.</td><td>Not supported. Streaming tables and Amazon S3 delivery require on-demand capacity mode.</td></tr>
</tbody>
</table>


## API Limits
<a name="kds-api-limits"></a>

Like most AWS APIs, Kinesis Data Streams API operations are rate-limited. The following limits apply per AWS account per Region. For more information on Kinesis Data Streams APIs, see the [Amazon Kinesis API Reference](https://docs.aws.amazon.com/kinesis/latest/APIReference/). 

### KDS Control Plane API Limits
<a name="kds-api-limits-control"></a>

The following section describes limits for the KDS control plane APIs. KDS control plane APIs let you create and manage your data streams. These limits apply per AWS account per Region.


**Control Plane API Limits**  

| API | API call limit | Per Account/Stream  | Description | 
| --- | --- | --- | --- | 
| AddTagsToStream | 5 transactions per second (TPS) | Per Account | 50 tags per data stream | 
| CreateStream | 5 TPS | Per Account | There is no upper quota on the number of streams you can have in an account. You receive a `LimitExceededException` when making a `CreateStream` request when you try to do one of the following: + Have more than five streams in the `CREATING` state at any point in time.<br />+ Create more shards than are authorized for your account. | 
| DecreaseStreamRetentionPeriod | 5 TPS | Per Stream | The minimum value of a data stream's retention period is 24 hours.  | 
| DeleteResourcePolicy | 5 TPS | Per Account | If you require an increase of this limit, raise a [Support ticket](https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase). | 
| DeleteStream | 5 TPS | Per Account |  | 
| DeregisterStreamConsumer | 5 TPS | Per Stream |  | 
| DescribeAccountSettings | 5 TPS | Per account |  | 
| DescribeLimits | 1 TPS | Per Account |  | 
| DescribeStream | 10 TPS | Per Account |  | 
| DescribeStreamConsumer | 20 TPS | Per Stream |  | 
| DescribeStreamSummary | 20 TPS | Per Account |  | 
| DisableEnhancedMonitoring | 5 TPS | Per Stream |  | 
| EnableEnhancedMonitoring | 5 TPS | Per Stream |  | 
| GetResourcePolicy | 5 TPS | Per Account | If you require an increase of this limit, raise a [Support ticket](https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase). | 
| IncreaseStreamRetentionPeriod | 5 TPS | Per Stream | The maximum value of a stream's retention period is 8760 hours (365 days).  | 
| ListShards | 1000 TPS | Per Stream |  | 
| ListStreamConsumers | 5 TPS | Per Stream |  | 
| ListStreams | 5 TPS | Per Account |  | 
| ListTagsForStream | 5 TPS | Per Stream |  | 
| MergeShards | 5 TPS | Per Stream | Only applicable for provisioned. | 
| PutResourcePolicy | 5 TPS | Per Account | If you require an increase of this limit, raise a [Support ticket](https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase). | 
| RegisterStreamConsumer | 5 TPS | Per Stream | You can register up to 20 consumers per data stream. A given consumer can only be registered with one data stream at a time. Only 5 consumers can be created simultaneously. In other words, you cannot have more than 5 consumers in a CREATING status at the same time.  | 
| RemoveTagsFromStream | 5 TPS | Per Stream |  | 
| SplitShard | 5 TPS | Per Stream | Only applicable for provisioned | 
| StartStreamEncryption |  | Per Stream | You can successfully apply a new AWS KMS key for server-side encryption 25 times in a rolling 24-hour period.  | 
| StopStreamEncryption |  | Per Stream | You can successfully disable server-side encryption 25 times in a rolling 24-hour period.  | 
| UpdateShardCount |  | Per Stream | Only applicable for provisioned. The default limit on number of shards is 10,000. There are additional limits on this API. For more information, see [UpdateShardCount](https://docs.aws.amazon.com/kinesis/latest/APIReference/API_UpdateShardCount.html).  | 
| UpdateStreamMode |  | Per stream | For each data stream in your AWS account, you can switch between the on-demand and provisioned capacity modes twice within 24 hours. | 
| UpdateStreamWarmThroughput | 5 TPS | Per account | The maximum warm throughput that can be configured is the on-demand mode's data stream throughput limit for the account and Region. | 
| UpdateAccountSettings | 5 TPS | Per account | Enable or disable account settings, such as On-demand Advantage mode. | 

### KDS Data Plane API Limits
<a name="kds-api-limits-data"></a>

The following section describes the limits for the KDS data plane APIs. KDS data plane APIs enable you to use your data streams for collecting and processing data records in real time. These limits apply per shard within your data streams.


**Data Plane API limits**  

| API | API call limit | Payload limit | Additional details | 
| --- | --- | --- | --- | 
| GetRecords | 5 TPS | The maximum number of records that can be returned per call is 10,000. The maximum size of data that GetRecords can return is 10 MB.  | If a call returns this amount of data, subsequent calls made within the next 5 seconds throw ProvisionedThroughputExceededException. If there is insufficient provisioned throughput on the stream, subsequent calls made within the next 1 second throw ProvisionedThroughputExceededException. | 
| GetShardIterator | 5 TPS |  | A shard iterator expires 5 minutes after it is returned to the requester. If a GetShardIterator request is made too often, you receive a ProvisionedThroughputExceededException. | 
| PutRecord | 1000 TPS | Each shard can support writes up to 1,000 records per second, up to a maximum data write total of 10MiB per second. |  Kinesis is designed to handle intermittent large records (1-10MiB in size) using burst capacity. | 
| PutRecords |  | Each PutRecords request can support up to 500 records. Each record in the request can be as large as 10 MiB, up to a limit of 10 MiB for the entire request, including partition keys. Each shard can support writes up to 1,000 records per second, up to a maximum data write total of 1 MB per second.  |  Kinesis is designed to handle intermittent large records (1-10MiB in size) using burst capacity. | 
| SubscribeToShard | You can make one call to SubscribeToShard per second per registered consumer per shard.  |  | If you call SubscribeToShard again with the same ConsumerARN and ShardId within 5 seconds of a successful call, you'll get a ResourceInUseException.  | 

## Increasing Quotas
<a name="increasing-kds-limits"></a>

You can use Service Quotas to request an increase for a quota, if the quota is adjustable. Some requests are automatically resolved, while others are submitted to AWS Support. You can track the status of a quota increase request that is submitted to AWS Support. Requests to increase Service Quotas do not receive priority support. If you have an urgent request, contact AWS Support. For more information, see [What Is Service Quotas?](https://docs.aws.amazon.com/servicequotas/latest/userguide/intro.html)

To request a service quota increase, follow the procedure outlined in [Requesting a Quota Increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html).
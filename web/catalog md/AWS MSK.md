

# Amazon MSK quota
<a name="limits"></a>

Your AWS account has default quotas for Amazon MSK. Unless otherwise stated, each per-account quota is Region-specific within your AWS account.

**Topics**
+ [Requesting a quota increase in Amazon MSK](#request-msk-quota-increase)
+ [Amazon MSK Standard broker quota](#msk-provisioned-quota)
+ [Amazon MSK Express broker quota](#msk-express-quota)
+ [MSK Replicator quotas](#msk-replicator-quotas)
+ [MSK Serverless quota](#serverless-quota)
+ [MSK Connect quota](#mkc-quota)
+ [Amazon MSK Data Delivery quotas](#msk-data-delivery-quota)

## Requesting a quota increase in Amazon MSK
<a name="request-msk-quota-increase"></a>

You can request a quota increase for each Region using the Service Quotas console, AWS CLI, or a support case. If an adjustable quota isn't available in the Service Quotas console, use the AWS Support Center Console to create a [service quota increase case](https://console.aws.amazon.com/support/home#/).

Support could approve, deny, or partially approve your quota increase requests. Increases aren't granted immediately, and can take a few days to take effect.

**To request an increase using the Service Quotas console**

1. Open the Service Quotas console at [https://console.aws.amazon.com/servicequotas/](https://console.aws.amazon.com/servicequotas/).

1. From the navigation bar, select a Region.

1. In the left navigation pane, choose **AWS services**.

1. In the Find services box, type **msk**, and then choose **Amazon Managed Streaming for Apache Kafka (MSK)**.

1. In **Service quotas**, choose the **Quota name** for which you want to request an increase. For example, **Number of brokers per account**.

1. Choose **Request increase at account level**.

1. For **Increase quota value**, enter a new quota value.

1. Choose **Request**.

1. (Optional) To view any pending or recently resolved requests in the console, choose **Dashboard** in the left navigation pane. For pending requests, choose the status of the request to open the request receipt. The initial status of a request is **Pending**. After the status changes to **Quota requested**, you'll see the case number with Support. Choose the case number to open the ticket for your request.

For more information, including how to use the AWS CLI or SDKs to request a quota increase, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*.

## Amazon MSK Standard broker quota
<a name="msk-provisioned-quota"></a>

The following table describes the quotas for Standard brokers.


| Dimension | Quota | Notes | 
| --- | --- | --- | 
| Brokers per account  | 90 | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). | 
| Brokers per cluster  | 30 for ZooKeeper-based clusters 60 for KRaft-based clusters | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). | 
| Minimum storage per broker  | 1 GiB |  | 
| Maximum storage per broker | 16384 GiB |  | 
| Maximum TCP connections per broker ([IAM Access control](iam-access-control.md)) | 3000 | To increase this limit, you can adjust the `listener.name.client_iam.max.connections` or the `listener.name.client_iam_public.max.connections` configuration property using the Kafka `AlterConfig` API or the `kafka-configs.sh` tool. It's important to note that increasing either property to a high value can result in unavailability.<br />To monitor this quota, use the `ClientConnectionCount` CloudWatch metric with dimensions `Cluster Name`, `Broker ID`, and `Client Authentication` (set to `IAM`). Use the **Sum** statistic with a one-minute period. A single broker reports `ClientConnectionCount` as multiple data points across its network processors. Summing at the broker level aggregates across all network threads for the IAM listener to produce the total IAM connection count for that broker. | 
| Maximum TCP connections rate per broker (IAM)  | 100 per second (M5 and M7g instance sizes) 4 per second (t3 instance size) | To handle retries on failed connections, you can set the `reconnect.backoff.ms` configuration parameter on the client side. For example, if you want a client to retry connections after 1 second, set `reconnect.backoff.ms` to `1000`. For more information, see [reconnect.backoff.ms](https://kafka.apache.org/documentation/#producerconfigs_reconnect.backoff.ms) in the Apache Kafka documentation.<br />To monitor this quota, use the `ConnectionCreationRate` CloudWatch metric with dimensions `Cluster Name` and `Broker ID`. Use the **Sum** statistic with a one-minute period. A single broker reports `ConnectionCreationRate` as multiple data points across its network processors. Summing at the broker level aggregates across all network threads and client listeners to produce the total connection creation rate for that broker. | 
| Maximum TCP connections per broker (non-IAM) | N/A | MSK does not enforce connection limits for non-IAM auth. You should monitor other metrics such as CPU and memory usage to ensure you do not overload your cluster because of excessive connections. | 
| Configurations per account | 100 | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). To update the configuration or the Apache Kafka version of an MSK cluster, first ensure the number of partitions per broker is under the limits described in [Right-size your cluster: Number of partitions per Standard broker](bestpractices.md#partitions-per-broker). | 
| Configuration revisions per account | 50 |  | 

## Amazon MSK Express broker quota
<a name="msk-express-quota"></a>

The following table describes the quotas for Express brokers.


| Dimension | Quota | Notes | 
| --- | --- | --- | 
| Brokers per account  | 90 | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). | 
| Brokers per cluster  | 30 for ZooKeeper-based clusters 60 for KRaft-based clusters | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). | 
| Maximum storage  | Unlimited |  | 
| Maximum TCP connections per broker (IAM Access control) | 3000 | To increase the connection limit, adjust one of the following configuration properties using the Kafka AlterConfig API or the kafka-configs.sh tool:+  `listener.name.client_iam.max.connections` <br />+  `listener.name.client_iam_public.max.connections` <br />Setting these properties to a high value might result in cluster unavailability.<br />To monitor this quota, use the `ClientConnectionCount` CloudWatch metric with dimensions `Cluster Name`, `Broker ID`, and `Client Authentication` (set to `IAM`). Use the **Sum** statistic with a one-minute period. A single broker reports `ClientConnectionCount` as multiple data points across its network processors. Summing at the broker level aggregates across all network threads for the IAM listener to produce the total IAM connection count for that broker. | 
| Maximum TCP connections rate per broker (IAM)  | 100 per second | To handle retries on failed connections, you can set the `reconnect.backoff.ms` configuration parameter on the client side. For example, if you want a client to retry connections after 1 second, set `reconnect.backoff.ms` to `1000`. For more information, see [reconnect.backoff.ms](https://kafka.apache.org/documentation/#producerconfigs_reconnect.backoff.ms) in the Apache Kafka documentation.<br />To monitor this quota, use the `ConnectionCreationRate` CloudWatch metric with dimensions `Cluster Name` and `Broker ID`. Use the **Sum** statistic with a one-minute period. A single broker reports `ConnectionCreationRate` as multiple data points across its network processors. Summing at the broker level aggregates across all network threads and client listeners to produce the total connection creation rate for that broker. | 
| Maximum TCP connections per broker (non-IAM)  | N/A | MSK does not enforce connection limits for non-IAM auth. You should however monitor other metrics such as CPU and memory usage to ensure you do not overload your cluster because of excessive connections. | 
| Configurations per account  | 100 | To request higher quota, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas). To update the configuration or the Apache Kafka version of an MSK cluster, first ensure the number of partitions per broker is under the limits described in [Right-size your cluster: Number of partitions per Express broker](bestpractices-express.md#partitions-per-express-broker). | 
| Configuration revisions per account | 50 |  | 
| Max Ingress per broker  | Recommended: 15.6 - 500.0 MBps  | Based on instance size.  | 
| Max Egress per broker | Recommended: 31.2 - 1000.0 MBps  | Based on instance size.  | 
| Throughput per-partition | Max 15 MB/s |  | 

**Topics**
+ [Express broker throughput throttle limits by broker size](#msk-express-quota-broker-throughput)
+ [Express broker partition quota](#msk-express-broker-partition-quota)

### Express broker throughput throttle limits by broker size
<a name="msk-express-quota-broker-throughput"></a>

The following table lists the recommended and maximum throughput throttle limit related to ingress and egress for different broker sizes. In this table, the recommended throughput is represented as Sustained performance, which is the threshold up to which your applications won't experience any performance degradation. If you operate beyond these limits on either dimension, you might get more throughput, but you might also experience performance degradation. Maximum quota is the threshold at which your cluster will throttle read/write traffic. Your applications won't be able to operate beyond this threshold.


| Instance size | Sustained performance (MBps) for ingress | Maximum quota (MBps) for ingress | Sustained performance (MBps) for egress | Maximum quota (MBps) for egress | 
| --- | --- | --- | --- | --- | 
| express.m7g.large | 15.6 | 23.4 | 31.2 | 58.5 | 
| express.m7g.xlarge | 31.2 | 46.8 | 62.5 | 117 | 
| express.m7g.2xlarge | 62.5 | 93.7 | 125 | 234.2 | 
| express.m7g.4xlarge | 124.9 | 187.5 | 249.8 | 468.7 | 
| express.m7g.8xlarge | 250 | 375 | 500 | 937.5 | 
| express.m7g.12xlarge | 375 | 562.5 | 750 | 1406.2 | 
| express.m7g.16xlarge | 500 | 750 | 1000 | 1875 | 

### Express broker partition quota
<a name="msk-express-broker-partition-quota"></a>

The following table shows the recommended number of partitions (including leader and follower replicas) for each Express broker. You can't exceed the maximum number of partitions mentioned in the following table for each Express broker.

For information about the best practices to consider while assigning partitions to Express brokers, see [Right-size your cluster: Number of partitions per Express broker](bestpractices-express.md#partitions-per-express-broker).


| Broker size | Recommended number of partitions (including leader and follower replicas) per broker | Maximum number of partitions per broker | 
| --- | --- | --- | 
| `express.m7g.large` | 1000 | 1500 | 
| `express.m7g.xlarge` | 1000 | 2000 | 
| `express.m7g.2xlarge` | 2500 | 4000 | 
| `express.m7g.4xlarge` | 6000 | 8000 | 
| `express.m7g.8xlarge` | 12000 | 16000 | 
| `express.m7g.12xlarge` | 16000 | 24000 | 
| `express.m7g.16xlarge` | 20000 | 32000 | 

## MSK Replicator quotas
<a name="msk-replicator-quotas"></a>
+ A maximum of 15 MSK Replicators per account.
+ MSK Replicator only replicates up to 750 topics in sorted order. If you need to replicate more topics, we recommend that you create a separate Replicator. To request support for more than 750 topics per Replicator, contact AWS Support. You can monitor the number of topics being replicated using the `TopicCount` metric.
+ A maximum ingress throughput of 1 GB per second per MSK Replicator. To request a higher quota, contact AWS Support.
+ MSK Replicator record size — A maximum record size of 10 MB for cross-region replication and 20 MB for same-region replication (`message.max.bytes`). To request a higher quota, contact AWS Support.

## MSK Serverless quota
<a name="serverless-quota"></a>

The quotas specified in the following table are per cluster, unless otherwise stated.

**Note**  
If you experience any issue with service quota limits, create a support case with your use case and requested limit.


| Dimension | Quota | Quota violation result | 
| --- | --- | --- | 
| Maximum ingress throughput | 200 MBps | Slowdown with throttle duration in response | 
| Maximum egress throughput | 400 MBps | Slowdown with throttle duration in response | 
| Maximum retention duration | Unlimited | N/A | 
| Maximum number of client connections | 3000 | Connection close | 
| Maximum connection attempts | 100 per second | Connection close | 
| Maximum message size | 8 MiB | Request fails with ErrorCode: INVALID\_REQUEST | 
| Maximum request rate | 15,000 per second | Slowdown with throttle duration in response | 
| Maximum rate of topic management APIs requests rate | 2 per second | Slowdown with throttle duration in response | 
| Maximum fetch bytes per request | 55 MB | Request fails with ErrorCode: INVALID\_REQUEST | 
| Maximum number of consumer groups | 500 | JoinGroup request fails | 
| Maximum number of partitions (leaders) | 2400 for non-compacted topics. 120 for compacted topics. To request a service quota adjustment, create a support case with your use case and requested limit. | Request fails with ErrorCode: INVALID\_REQUEST | 
| Maximum rate of partition creation and deletion | 250 in 5 minutes | Request fails with ErrorCode: THROUGHPUT\_QUOTA\_EXCEEDED | 
| Maximum ingress throughput per partition | 5 MBps | Slowdown with throttle duration in response | 
| Maximum egress throughput per partition | 10 MBps | Slowdown with throttle duration in response | 
| Maximum partition size (for compacted topics) | 250 GB | Request fails with ErrorCode: THROUGHPUT\_QUOTA\_EXCEEDED | 
| Maximum number of client VPCs per serverless cluster | 5 |  | 
| Maximum number of serverless clusters per account | 10. To request a service quota adjustment, create a support case with your use case and requested limit. |  | 

## MSK Connect quota
<a name="mkc-quota"></a>
+ Up to 100 custom plugins.
+ Up to 100 worker configurations.
+ Up to 60 connect workers. If a connector is set up to have auto scaled capacity, then the maximum number of workers that the connector is set up to have is the number MSK Connect uses to calculate the quota for the account.
+ Up to 10 workers per connector.

To request higher quota for MSK Connect, go to the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/kafka/quotas).

## Amazon MSK Data Delivery quotas
<a name="msk-data-delivery-quota"></a>

The following quotas apply to Amazon MSK Data Delivery Channels.


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Channels per Amazon MSK cluster | 50 | Yes | 
| Channels per Kafka topic | 10 | Yes | 
| Maximum data freshness interval | 15 minutes | No | 
| Minimum data freshness interval | 5 minutes | No | 
| Minimum throughput for 5-minute freshness (S3 Tables) | 2.4 MB/s per Channel | No | 
| Maximum throughput per Channel | Up to 10 GB/s | No | 
| Maximum partitions per table (S3 Tables) | 100 | No | 
| Supported input formats (S3 Tables) | JSON, JSON\_SCHEMA\_GSR | No | 
| Supported input formats (S3 bucket) | JSON, ByteArray, String | No | 
| Output format (S3 Tables) | Apache Iceberg; Parquet files with ZSTD or Snappy compression | No | 
| Output compression (S3 bucket) | NONE, GZIP, or ZSTD | No | 
| Schema evolution | Not supported | No | 
| Maximum topic name length | 249 characters | No | 
| Maximum table name length | 255 characters | No | 

To request an increase for an adjustable quota, use the procedure in [Requesting a quota increase in Amazon MSK](#request-msk-quota-increase).


# Amazon Neptune Limits
<a name="limits"></a>

## Regions
<a name="limits-regions"></a>

Amazon Neptune is available in the following AWS Regions:
+ US East (N. Virginia):   `us-east-1`
+ US East (Ohio):   `us-east-2`
+ US West (N. California):   `us-west-1`
+ US West (Oregon):   `us-west-2`
+ Canada (Central):   `ca-central-1`
+ Canada West (Calgary):   `ca-west-1`
+ South America (São Paulo):   `sa-east-1`
+ Europe (Stockholm):   `eu-north-1`
+ Europe (Spain):   `eu-south-2`
+ Europe (Ireland):   `eu-west-1`
+ Europe (London):   `eu-west-2`
+ Europe (Paris):   `eu-west-3`
+ Europe (Frankfurt):   `eu-central-1`
+ Middle East (Bahrain):   `me-south-1`
+ Middle East (UAE):   `me-central-1`
+ Israel (Tel Aviv):   `il-central-1`
+ Africa (Cape Town):   `af-south-1`
+ Asia Pacific (Hong Kong):   `ap-east-1`
+ Asia Pacific (Tokyo):   `ap-northeast-1`
+ Asia Pacific (Seoul):   `ap-northeast-2`
+ Asia Pacific (Osaka):   `ap-northeast-3`
+ Asia Pacific (Singapore):   `ap-southeast-1`
+ Asia Pacific (Sydney):   `ap-southeast-2`
+ Asia Pacific (Jakarta):   `ap-southeast-3`
+ Asia Pacific (Melbourne):   `ap-southeast-4`
+ Asia Pacific (Malaysia):   `ap-southeast-5`
+ Asia Pacific (Mumbai):   `ap-south-1`
+ Asia Pacific (Hyderabad):   `ap-south-2`
+ China (Beijing):   `cn-north-1`
+ China (Ningxia):   `cn-northwest-1`
+ AWS GovCloud (US-West):   `us-gov-west-1`
+ AWS GovCloud (US-East):   `us-gov-east-1`

## Differences in China regions
<a name="limits-china-regions"></a>

As is true of many AWS services, Amazon Neptune operates slightly differently in China (Beijing) and China (Ningxia) than in other AWS regions.

For example, when Neptune ML uses Amazon API Gateway to create its export service, IAM authentication is enabled by default. In China regions, the process for changing that option is slightly different than it is in other regions.

These and other differences are [explained here](https://docs.amazonaws.cn/en_us/aws/latest/userguide/api-gateway.html#feature-diff).

## Maximum size of storage cluster volumes
<a name="limits-cluster-volume-size"></a>

A Neptune cluster volume can grow to a maximum size of 128 tebibytes (TiB) in all supported regions. See [Amazon Neptune storage, reliability and availability](feature-overview-storage.md).

## DB instance sizes supported
<a name="limits-instance-sizes"></a>

Neptune supports different DB instance classes in different AWS Regions. To find out what classes are supported in a given Region, see [Amazon Neptune Pricing](https://aws.amazon.com/neptune/pricing/) and choose the Region that you are interested in.

## Limits for each AWS account
<a name="limits-per-acount"></a>

For certain management features, Amazon Neptune uses operational technology that is shared with Amazon Relational Database Service (Amazon RDS). 

Each AWS account has limits for each Region on the number of Amazon Neptune and Amazon RDS resources that you can create. These resources include DB instances and DB clusters.

After you reach a limit for a resource, additional calls to create that resource fail with an exception. 

For a list of limits shared between Amazon Neptune and Amazon RDS, see [Limits in Amazon RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html#RDS_Limits.Limits) in the *Amazon RDS User Guide*.

## Connection to Neptune requires a VPC
<a name="limits-vpc-required"></a>

Amazon Neptune is a virtual private cloud (VPC)–only service.

Additionally, instances do not allow access from outside the VPC.

## Neptune requires SSL
<a name="limits-ssl-required"></a>

Beginning with engine version `1.0.4.0`, Amazon Neptune only allows Secure Sockets Layer (SSL) connections through HTTPS to any instance or cluster endpoint.

Neptune requires TLS version 1.2, using the following strong cipher suites:
+ `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`
+ `TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256`
+ `TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA384`
+ `TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256`
+ `TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA`
+ `TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA`

## Availability zones and DB subnet groups
<a name="limits-azs-subnets"></a>

Amazon Neptune requires a DB subnet group for each cluster that has subnets in at least two supported Availability Zones (AZs).

We recommend using three or more subnets in different Availability Zones.

## HTTP request payload maximum (150 MB)
<a name="limits-http"></a>

The total size of Gremlin and SPARQL HTTP requests must be less than 150 MB. If a request exceeds this size, Neptune returns `HTTP 400: BadRequestException`.

This limit does not apply to Gremlin WebSockets connections.

## Gremlin implementation differences
<a name="limits-gremlin"></a>

The Amazon Neptune Gremlin implementation has specific implementation details that might differ from other Gremlin implementations.

For more information, see [Gremlin standards compliance in Amazon Neptune](access-graph-gremlin-differences.md).

## Neptune does not support null characters in string data
<a name="limits-nulls"></a>

Neptune does not support null characters in strings. This is true in property-graph data for Gremlin and openCypher, and for RDF/SPARQL data.

## SPARQL UPDATE LOAD from URI
<a name="limits-sparql-update"></a>

`SPARQL UPDATE LOAD` from URI works only with resources that are within the same VPC.

This includes Amazon S3 URLs in the same Region as the cluster with an Amazon S3 VPC endpoint created.

The Amazon S3 URL must be HTTPS, and any authentication must be included in the URL. For more information, see [Authenticating Requests: Using Query Parameters](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html) in the *Amazon Simple Storage Service API Reference*.

For information about creating a VPC endpoint, see [Creating an Amazon S3 VPC Endpoint](bulk-load-data.md#bulk-load-prereqs-s3).

If you need to load data from a file, we recommend that you use the Amazon Neptune loader API. For more information, see [Using the Amazon Neptune bulk loader to ingest data](bulk-load.md).

**Note**  
The Amazon Neptune loader API is non-ACID.

## IAM authentication and access control
<a name="limits-auth-access"></a>

In Neptune engine versions prior to [release 1.2.0.0](engine-releases-1.2.0.0.md), IAM authentication and access control is only supported at the DB cluster level. From release `1.2.0.0` forward, however, you can control query-based access at a more granular level using condition keys in IAM policies. For more information, see [Using query actions in Neptune data-access policy statements](iam-data-access-policies.md#iam-data-query-actions) and [Authenticating your Amazon Neptune database with AWS Identity and Access Management](iam-auth.md)

The Amazon Neptune console requires **NeptuneReadOnlyAccess** permissions. You can restrict access to IAM users by revoking this access. For more information, see [Using AWS managed policies to access Amazon Neptune databases](security-iam-access-managed-policies.md)

Amazon Neptune does not support user name/password–based access control.

## WebSocket concurrent connections and maximum connection time
<a name="limits-websockets"></a>

There is a limit to the number of concurrent WebSocket connections per Neptune DB instance. When that limit is reached, Neptune throttles any request to open a new WebSocket connection in order to prevent using up all of the allocated heap memory.

For all larger instance types supported by Neptune and all serverless instances, the maximum number concurrent of WebSocket connections is 32K (32,768).

The maximum concurrent WebSocket connections for smaller instance types are listed in the table below:


| Instance Type | Maximum concurrent WebSocket connections | 
| --- | --- | 
| serverless | 32768 | 
| db.r4.4xlarge | 16384 | 
| db.r4.2xlarge | 8192 | 
| db.r4.xlarge | 4096 | 
| db.r4.large | 2048 | 
| db.r5.4xlarge | 16384 | 
| db.r5.2xlarge | 8192 | 
| db.r5.xlarge | 4096 | 
| db.r5.large | 2048 | 
| db.r5d.8xlarge | 32768 | 
| db.r5d.4xlarge | 16384 | 
| db.r5d.2xlarge | 8192 | 
| db.r5d.xlarge | 4096 | 
| db.r5d.large | 2048 | 
| db.t3.medium | 512 | 
| db.t4g.medium | 512 | 
| db.r6g.4xlarge | 16384 | 
| db.r6g.2xlarge | 8192 | 
| db.r6g.xlarge | 4096 | 
| db.r6g.large | 2048 | 
| db.r6gd.4xlarge | 16384 | 
| db.r6gd.2xlarge | 8192 | 
| db.r6gd.xlarge | 4096 | 
| db.r6gd.large | 2048 | 
| db.x2iezn.2xlarge | 16384 | 
| db.x2iedn.xlarge | 4096 | 
| db.x2gd.xlarge | 4096 | 
| db.x2gd.large | 2048 | 
| db.x2gd.4xlarge | 16384 | 
| db.x2gd.2xlarge | 8192 | 
| db.x2g.xlarge | 4096 | 
| db.x2g.large | 2048 | 
| db.x2g.4xlarge | 16384 | 
| db.x2g.2xlarge | 8192 | 
| db.x1e.xlarge | 4096 | 
| db.x1e.2xlarge | 16384 | 
| db.r6i.xlarge | 4096 | 
| db.r6i.large | 2048 | 
| db.r6i.2xlarge | 8192 | 
| db.r7g.4xlarge | 16384 | 
| db.r7g.2xlarge | 8192 | 
| db.r7g.xlarge | 4096 | 
| db.r7g.large | 2048 | 
| db.r8g.4xlarge | 16384 | 
| db.r8g.2xlarge | 8192 | 
| db.r8g.xlarge | 4096 | 
| db.r8g.large | 2048 | 
| db.r7i.large | 2048 | 
| db.r7i.xlarge | 4096 | 
| db.r7i.2xlarge | 8192 | 

**Note**  
Neptune no longer supports `R4` instance types.

When a client properly closes a connection, the closure is immediately reflected in the open connections count.

If the client doesn't close a connection, the connection may be closed automatically after a 20- to 25-minute idle timeout (the idle timeout is the time elapsed since the last message was received from the client). However, as long as the idle timeout is not reached, Neptune keeps the connection open indefinitely.

When IAM authentication is enabled, a WebSocket connection is always disconnected a few minutes more than 10 days after it was established, if it hasn't already been closed by then.

## Limits on properties and labels
<a name="limits-properties"></a>

There is no limit on the number of vertices and edges, or RDF quads you can have in a graph.

There is also no limit on the number of properties or labels that any one vertex or edge can have.

There is a size limit of 55 MB on the size of an individual property or label. In RDF terms, this means that the value in any column (S, P, O or G) of an RDF quad cannot exceed 55 MB.

If you need to associate a larger object such as an image with a vertex or node in your graph, you can store it as a file in Amazon S3 and use the Amazon S3 path as the property or label.

## Limits that affect the Neptune bulk loader
<a name="limits-bulk-load"></a>

You cannot queue up more than 64 Neptune bulk load jobs at a time.

Neptune only keeps track of the most recent 1,024 bulk load jobs.

Neptune only stores the last 10,000 error details per job.


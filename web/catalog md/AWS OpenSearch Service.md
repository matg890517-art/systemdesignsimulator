

# Amazon OpenSearch Service quotas
<a name="limits"></a>

Your AWS account has default quotas, formerly referred to as limits, for each AWS service. Unless otherwise noted, each quota is Region-specific.

To view the quotas for OpenSearch Service domains and instances, Amazon OpenSearch Serverless, and Amazon OpenSearch Ingestion, see [Amazon OpenSearch Service quotas](https://docs.aws.amazon.com/general/latest/gr/opensearch-service.html#opensearch-limits) in the *AWS General Reference*.

To view the quotas for OpenSearch Service in the AWS Management Console, open the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home). In the navigation pane, choose **AWS services** and select **Amazon OpenSearch Service**. To request a quota increase, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*. 

**Note**  
If you enable egress through your VPC on a VPC domain, reserve additional IP addresses in each selected subnet for the egress network interfaces that OpenSearch Service creates in your VPC. For more information, see [Limits and considerations](vpc-egress.md#vpc-egress-limits).

## Warm node storage quotas
<a name="limits-warm-node"></a>

The following table lists the warm node instance types and the maximum amount of storage that each type can use. For OpenSearch Optimized OI2 instances, 80% of the local storage is available as cache, and the maximum addressable warm storage is 5 times the cache storage size.

For example, if an OI2 instance has 468 GB of local storage:
+ Cache storage = 375 GB (80% of local storage)
+ Maximum addressable warm storage = 1875 GB (5 x 375 GB cache)


| Instance Type | Instance Storage (GB) | Cache Size (GB) | Max Addressable Warm Storage (GB) | 
| --- | --- | --- | --- | 
| oi2.large.search | 468 | 375 | 1875 | 
| oi2.xlarge.search | 937 | 750 | 3750 | 
| oi2.2xlarge.search | 1875 | 1500 | 7500 | 
| oi2.4xlarge.search | 3750 | 3000 | 15000 | 
| oi2.8xlarge.search | 7500 | 6000 | 30000 | 

### UltraWarm storage quotas
<a name="limits-ultrawarm"></a>

The following table lists the UltraWarm instance types and the maximum amount of storage that each type can use. For more information about UltraWarm, see [UltraWarm storage for Amazon OpenSearch Service](ultrawarm.md).


| Instance type | Maximum storage | 
| --- | --- | 
| ultrawarm1.medium.search | 1.5 TiB | 
| ultrawarm1.large.search | 20 TiB | 

## Number of data nodes per AZ
<a name="limits-number-per-az"></a>

The following table lists the total number of data nodes for AZ deployment is below, the overall limit signifies the number of data nodes per limit including both the hot and warm node count. storage that each type can use.


| AZ Configuration | Hot Node Count Limit | Warm Node Count Limit | Overall Limit (Hot \+ Warm) | 
| --- | --- | --- | --- | 
| 1 - AZ | 334 | 250 | 334 | 
| 2 - AZ | 668 | 500 | 668 | 
| 3 - AZ | 1002 | 750 | 1002 | 

## Total node limit by instance family
<a name="limits-total-node-instance-family"></a>

The following table lists the total node limit by instance family. 


| Instance family | ElasticSearch OpenSearch up to 2.15 | OpenSearch 2.17 and above | Default limit | 
| --- | --- | --- | --- | 
| T2 | 10 | 10 | 10 | 
| T3 | 10 | 10 | 10 | 
| M3, C4, M4, R4, C5, M5, R5, I2, I3  | 10 | 200 | 80 | 
| Graviton 2, Graviton 3, Graviton 4 | 200 | 400 | 80 | 
| C7i, R7i, M7i, i4i, i4g, i8g, i7i, i8ge | 200 | 400 | 80 | 
| OR1.medium.search<br />OR1.large.search<br />OR2.medium.search<br />OR2.large.search<br />OM2.large.search<br />OI2.large.search | 200 | 400 | 80 | 
| OR1.xlarge.search and above<br />OR2.xlarge.search and above<br />OM2.xlarge.search and above<br />OI2.xlarge.search and above | 200 | 1002 | 80 | 
| Ultrawarm1 | 150 | 750 | 150 | 

## EBS volume size quotas
<a name="ebsresource"></a>

The following table shows the minimum and maximum sizes for EBS volumes for each instance type that OpenSearch Service supports. For information about which instance types include instance storage and additional hardware details, see [Amazon OpenSearch Service pricing](https://aws.amazon.com/elasticsearch-service/pricing/).
+ If you choose magnetic storage under **EBS volume type** when creating your domain, the maximum volume size is 100 GiB for all instance types except t2.small and t2.medium, and all Graviton instances (M6g, C6g, R6g, and R6gd), which don't support magnetic storage. For the maximum sizes listed in the following table, choose one of the SSD options.
+ Some older-generation instance types include instance storage, but also support EBS storage. If you choose EBS storage for one of these instance types, the storage volumes are *not* additive. You can use either an EBS volume or the instance storage, not both.
+ For EBS gp3 volumes, the maximum supported limits are 80,000 IOPS and 2,000 MB/s throughput. Note that the effective limits for your domain may be lower depending on your instance type. For instance-specific maximum limits, see [instance type limits](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-optimized.html#current-general-purpose).


| Instance type | Minimum EBS size | Maximum EBS size (gp2) | Maximum EBS size (gp3) | 
| --- | --- | --- | --- | 
| t2.micro.search | 10 GiB | 35 GiB | N/A | 
| t2.small.search | 10 GiB | 35 GiB | N/A | 
| t2.medium.search | 10 GiB | 35 GiB | N/A | 
| t3.small.search | 10 GiB | 100 GiB | 100 GiB | 
| t3.medium.search | 10 GiB | 200 GiB | 200 GiB | 
| m3.medium.search | 10 GiB | 100 GiB | N/A | 
| m3.large.search | 10 GiB | 512 GiB | N/A | 
| m3.xlarge.search | 10 GiB | 512 GiB | N/A | 
| m3.2xlarge.search | 10 GiB | 512 GiB | N/A | 
| m4.large.search | 10 GiB | 512 GiB | N/A | 
| m4.xlarge.search | 10 GiB | 1 TiB | N/A | 
| m4.2xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| m4.4xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| m4.10xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| m5.large.search | 10 GiB | 512 GiB | 1 TiB | 
| m5.xlarge.search | 10 GiB | 1 TiB | 2 TiB | 
| m5.2xlarge.search | 10 GiB | 1.5 TiB | 3 TiB | 
| m5.4xlarge.search | 10 GiB | 3 TiB | 6 TiB | 
| m5.12xlarge.search | 10 GiB | 9 TiB | 18 TiB | 
| m6g.large.search | 10 GiB | 512 GiB | 1 TiB | 
| m6g.xlarge.search | 10 GiB | 1 TiB | 2 TiB | 
| m6g.2xlarge.search | 10 GiB | 1.5 TiB | 3 TiB | 
| m6g.4xlarge.search | 10 GiB | 3 TiB | 6 TiB | 
| m6g.8xlarge.search | 10 GiB | 6 TiB | 12 TiB | 
| m6g.12xlarge.search | 10 GiB | 9 TiB | 18 TiB | 
| c4.large.search | 10 GiB | 100 GiB | N/A | 
| c4.xlarge.search | 10 GiB | 512 GiB | N/A | 
| c4.2xlarge.search | 10 GiB | 1 TiB | N/A | 
| c4.4xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| c4.8xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| c5.large.search | 10 GiB | 256 GiB | 256 GiB | 
| c5.xlarge.search | 10 GiB | 512 GiB | 512 GiB | 
| c5.2xlarge.search | 10 GiB | 1 TiB | 1 TiB | 
| c5.4xlarge.search | 10 GiB | 1.5 TiB | 1.5 TiB | 
| c5.9xlarge.search | 10 GiB | 3.5 TiB | 3.5 TiB | 
| c5.18xlarge.search | 10 GiB | 7 TiB | 7 TiB | 
| c6g.large.search | 10 GiB | 256 GiB | 256 GiB | 
| c6g.xlarge.search | 10 GiB | 512 GiB | 512 GiB | 
| c6g.2xlarge.search | 10 GiB | 1 TiB | 1 TiB | 
| c6g.4xlarge.search | 10 GiB | 1.5 TiB | 1.5 TiB | 
| c6g.8xlarge.search | 10 GiB | 3 TiB | 3 TiB | 
| c6g.12xlarge.search | 10 GiB | 4.5 TiB | 4.5 TiB | 
| r3.large.search | 10 GiB | 512 GiB | N/A | 
| r3.xlarge.search | 10 GiB | 512 GiB | N/A | 
| r3.2xlarge.search | 10 GiB | 512 GiB | N/A | 
| r3.4xlarge.search | 10 GiB | 512 GiB | N/A | 
| r3.8xlarge.search | 10 GiB | 512 GiB | N/A | 
| r4.large.search | 10 GiB | 1 TiB | N/A | 
| r4.xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| r4.2xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| r4.4xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| r4.8xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| r4.16xlarge.search | 10 GiB | 1.5 TiB | N/A | 
| r5.large.search | 10 GiB | 1 TiB | 2 TiB | 
| r5.xlarge.search | 10 GiB | 1.5 TiB | 3 TiB | 
| r5.2xlarge.search | 10 GiB | 3 TiB | 6 TiB | 
| r5.4xlarge.search | 10 GiB | 6 TiB | 12 TiB | 
| r5.12xlarge.search | 10 GiB | 12 TiB | 24 TiB | 
| r6g.large.search | 10 GiB | 1 TiB | 2 TiB | 
| r6g.xlarge.search | 10 GiB | 1.5 TiB | 3 TiB | 
| r6g.2xlarge.search | 10 GiB | 3 TiB | 6 TiB | 
| r6g.4xlarge.search | 10 GiB | 6 TiB | 12 TiB | 
| r6g.8xlarge.search | 10 GiB | 8 TiB | 16 TiB | 
| r6g.12xlarge.search | 10 GiB | 12 TiB | 24 TiB | 
| r6gd.large.search | N/A | N/A | N/A | 
| r6gd.xlarge.search | N/A | N/A | N/A | 
| r6gd.2xlarge.search | N/A | N/A | N/A | 
| r6gd.4xlarge.search | N/A | N/A | N/A | 
| r6gd.8xlarge.search | N/A | N/A | N/A | 
| r6gd.12xlarge.search | N/A | N/A | N/A | 
| r6gd.16xlarge.search | N/A | N/A | N/A | 
| i2.xlarge.search | 10 GiB | 512 GiB | N/A | 
| i2.2xlarge.search | 10 GiB | 512 GiB | N/A | 
| i3.large.search  | N/A | N/A | N/A | 
| i3.xlarge.search | N/A | N/A | N/A | 
| i3.2xlarge.search | N/A | N/A | N/A | 
| i3.4xlarge.search | N/A | N/A | N/A | 
| i3.8xlarge.search | N/A | N/A | N/A | 
| i3.16xlarge.search | N/A | N/A | N/A | 
| or1.medium.search | 20 GiB | N/A | 768 GiB | 
| or1.large.search | 20 GiB | N/A | 1532 GiB | 
| or1.xlarge.search | 20 GiB | N/A | 3 TiB | 
| or1.2xlarge.search | 20 GiB | N/A | 6 TiB | 
| or1.4xlarge.search | 20 GiB | N/A | 12 TiB | 
| or1.8xlarge.search | 20 GiB | N/A | 16 TiB | 
| or1.12xlarge.search | 20 GiB | N/A | 24 TiB | 
| or1.16xlarge.search | 20 GiB | N/A | 36 TiB | 
| or2.medium.search | 20 GiB | N/A | 768 GiB | 
| or2.large.search | 20 GiB | N/A | 1532 GiB | 
| or2.xlarge.search | 20 GiB | N/A | 3 TiB | 
| or2.2xlarge.search | 20 GiB | N/A | 6 TiB | 
| or2.4xlarge.search | 20 GiB | N/A | 12 TiB | 
| or2.8xlarge.search | 20 GiB | N/A | 16 TiB | 
| or2.12xlarge.search | 20 GiB | N/A | 24 TiB | 
| or2.16xlarge.search | 20 GiB | N/A | 36 TiB | 
| om2.large.search | 20 GiB | N/A | 768 GiB | 
| om2.xlarge.search | 20 GiB | N/A | 2 TiB | 
| om2.2xlarge.search | 20 GiB | N/A | 3 TiB | 
| om2.4xlarge.search | 20 GiB | N/A | 6 TiB | 
| om2.8xlarge.search | 20 GiB | N/A | 12 TiB | 
| om2.12xlarge.search | 20 GiB | N/A | 18 TiB | 
| om2.16xlarge.search | 20 GiB | N/A | 24 TiB | 
| im4gn.large.search | N/A | N/A | N/A | 
| im4gn.xlarge.search | N/A | N/A | N/A | 
| im4gn.2xlarge.search | N/A | N/A | N/A | 
| im4gn.4xlarge.search | N/A | N/A | N/A | 
| im4gn.8xlarge.search | N/A | N/A | N/A | 
| im4gn.16xlarge.search | N/A | N/A | N/A | 
| C7g.large.search | 10 GiB | N/A | 256 GiB | 
| C7g.xlarge.search | 10 GiB | N/A | 512 GiB | 
| C7g.2xlarge.search | 10 GiB | N/A | 1 TiB | 
| C7g.4xlarge.search | 10 GiB | N/A | 1.5 TiB | 
| C7g.8xlarge.search | 10 GiB | N/A | 3 TiB | 
| C7g.12xlarge.search | 10 GiB | N/A | 4.5 TiB | 
| C7g.16xlarge.search | 10 GiB | N/A | 6 TiB | 
| M7g.medium.search | 10 GiB | N/A | 512 GiB | 
| M7g.large.search | 10 GiB | N/A | 768 GiB | 
| M7g.xlarge.search | 10 GiB | N/A | 2 TiB | 
| M7g.2xlarge.search | 10 GiB | N/A | 3 TiB | 
| M7g.4xlarge.search | 10 GiB | N/A | 6 TiB | 
| M7g.8xlarge.search | 10 GiB | N/A | 12 TiB | 
| M7g.12xlarge.search | 10 GiB | N/A | 18 TiB | 
| M7g.16xlarge.search | 10 GiB | N/A | 24 TiB | 
| R7g.medium.search | 10 GiB | N/A | 768 GiB | 
| R7g.large.search | 10 GiB | N/A | 1.5 TiB | 
| R7g.xlarge.search | 10 GiB | N/A | 3 TiB | 
| R7g.2xlarge.search | 10 GiB | N/A | 6 TiB | 
| R7g.4xlarge.search | 10 GiB | N/A | 12 TiB | 
| R7g.8xlarge.search | 10 GiB | N/A | 16 TiB | 
| R7g.12xlarge.search | 10 GiB | N/A | 24 TiB | 
| R7g.16xlarge.search | 10 GiB | N/A | 36 TiB | 
| R7gd.large.search | N/A | N/A | N/A | 
| R7gd.xlarge.search | N/A | N/A | N/A | 
| R7gd.2xlarge.search | N/A | N/A | N/A | 
| R7gd.4xlarge.search | N/A | N/A | N/A | 
| R7gd.8xlarge.search | N/A | N/A | N/A | 
| R7gd.12xlarge.search | N/A | N/A | N/A | 
| R7gd.16xlarge.search | N/A | N/A | N/A | 
| i4i.large.search | N/A | N/A | N/A | 
| i4i.xlarge.search | N/A | N/A | N/A | 
| i4i.2xlarge.search | N/A | N/A | N/A | 
| i4i.4xlarge.search | N/A | N/A | N/A | 
| i4i.8xlarge.search | N/A | N/A | N/A | 
| i4i.12xlarge.search | N/A | N/A | N/A | 
| i4i.16xlarge.search | N/A | N/A | N/A | 
| i4i.24xlarge.search | N/A | N/A | N/A | 
| i4i.32xlarge.search | N/A | N/A | N/A | 
| i4g.large.search | N/A | N/A | N/A | 
| i4g.xlarge.search | N/A | N/A | N/A | 
| i4g.2xlarge.search | N/A | N/A | N/A | 
| i4g.4xlarge.search | N/A | N/A | N/A | 
| i4g.8xlarge.search | N/A | N/A | N/A | 
| i4g.16xlarge.search | N/A | N/A | N/A | 
| i8g.large.search | N/A | N/A | N/A | 
| i8g.xlarge.search | N/A | N/A | N/A | 
| i8g.2xlarge.search | N/A | N/A | N/A | 
| i8g.4xlarge.search | N/A | N/A | N/A | 
| i8g.8xlarge.search | N/A | N/A | N/A | 
| i8g.12xlarge.search | N/A | N/A | N/A | 
| i8g.16xlarge.search | N/A | N/A | N/A | 
| i7i.large.search | N/A | N/A | N/A | 
| i7i.xlarge.search | N/A | N/A | N/A | 
| i7i.2xlarge.search | N/A | N/A | N/A | 
| i7i.4xlarge.search | N/A | N/A | N/A | 
| i7i.8xlarge.search | N/A | N/A | N/A | 
| i7i.12xlarge.search | N/A | N/A | N/A | 
| i7i.16xlarge.search | N/A | N/A | N/A | 
| i8ge.large.search | N/A | N/A | N/A | 
| i8ge.xlarge.search | N/A | N/A | N/A | 
| i8ge.2xlarge.search | N/A | N/A | N/A | 
| i8ge.3xlarge.search | N/A | N/A | N/A | 
| i8ge.6xlarge.search | N/A | N/A | N/A | 
| i8ge.12xlarge.search | N/A | N/A | N/A | 
| i8ge.18xlarge.search | N/A | N/A | N/A | 
| c7i.large.search | 10 GiB | N/A | 256 GiB | 
| c7i.xlarge.search | 10 GiB | N/A | 512 GiB | 
| c7i.2xlarge.search | 10 GiB | N/A | 1 TiB | 
| c7i.4xlarge.search | 10 GiB | N/A | 1.5 TiB | 
| c7i.8xlarge.search | 10 GiB | N/A | 3 TiB | 
| c7i.12xlarge.search | 10 GiB | N/A | 4.5 TiB | 
| c7i.16xlarge.search | 10 GiB | N/A | 6 TiB | 
| m7i.large.search | 10 GiB | N/A | 768 GiB | 
| m7i.xlarge.search | 10 GiB | N/A | 2 TiB | 
| m7i.2xlarge.search | 10 GiB | N/A | 3 TiB | 
| m7i.4xlarge.search | 10 GiB | N/A | 6 TiB | 
| m7i.8xlarge.search | 10 GiB | N/A | 12 TiB | 
| m7i.12xlarge.search | 10 GiB | N/A | 18 TiB | 
| m7i.16xlarge.search | 10 GiB | N/A | 24 TiB | 
| r7i.large.search | 10 GiB | N/A | 1.5 TiB | 
| r7i.xlarge.search | 10 GiB | N/A | 3 TiB | 
| r7i.2xlarge.search | 10 GiB | N/A | 6 TiB | 
| r7i.4xlarge.search | 10 GiB | N/A | 12 TiB | 
| r7i.8xlarge.search | 10 GiB | N/A | 16 TiB | 
| r7i.12xlarge.search | 10 GiB | N/A | 24 TiB | 
| r7i.12xlarge.search | 10 GiB | N/A | 36 TiB | 
| c8g.large | 10 GiB | N/A | 256 GiB | 
| c8g.xlarge | 10 GiB | N/A | 512 GiB | 
| c8g.2xlarge | 10 GiB | N/A | 1 TiB | 
| c8g.4xlarge | 10 GiB | N/A | 1.5 TiB | 
| c8g.8xlarge | 10 GiB | N/A | 3 TiB | 
| c8g.12xlarge | 10 GiB | N/A | 4.5 TiB | 
| c8g.16xlarge | 10 GiB | N/A | 6 TiB | 
| m8g.medium | 10 GiB | N/A | 512 GiB | 
| m8g.large | 10 GiB | N/A | 768 GiB | 
| m8g.xlarge | 10 GiB | N/A | 2 TiB | 
| m8g.2xlarge | 10 GiB | N/A | 3 TiB | 
| m8g.4xlarge | 10 GiB | N/A | 6 TiB | 
| m8g.8xlarge | 10 GiB | N/A | 12 TiB | 
| m8g.12xlarge | 10 GiB | N/A | 18 TiB | 
| m8g.16xlarge | 10 GiB | N/A | 24 TiB | 
| r8g.medium | 10 GiB | N/A | 768 GiB | 
| r8g.large | 10 GiB | N/A | 1532 GiB | 
| r8g.xlarge | 10 GiB | N/A | 3 TiB | 
| r8g.2xlarge | 10 GiB | N/A | 6 TiB | 
| r8g.4xlarge | 10 GiB | N/A | 12 TiB | 
| r8g.8xlarge | 10 GiB | N/A | 16 TiB | 
| r8g.12xlarge | 10 GiB | N/A | 24 TiB | 
| r8g.16xlarge | 10 GiB | N/A | 36 TiB | 
| r8gd.medium | N/A | N/A | N/A | 
| r8gd.large | N/A | N/A | N/A | 
| r8gd.xlarge | N/A | N/A | N/A | 
| r8gd.2xlarge | N/A | N/A | N/A | 
| r8gd.4xlarge | N/A | N/A | N/A | 
| r8gd.8xlarge | N/A | N/A | N/A | 
| r8gd.12xlarge | N/A | N/A | N/A | 
| r8gd.16xlarge | N/A | N/A | N/A | 
| oi2.large.search | N/A | N/A | N/A | 
| oi2.xlarge.search | N/A | N/A | N/A | 
| oi2.2xlarge.search | N/A | N/A | N/A | 
| oi2.4xlarge.search | N/A | N/A | N/A | 
| oi2.8xlarge.search | N/A | N/A | N/A | 
| oi2.12xlarge.search | N/A | N/A | N/A | 
| oi2.16xlarge.search | N/A | N/A | N/A | 

## Network quotas
<a name="network-limits"></a>

The following table shows the maximum size of HTTP request payloads.



| Instance type | Maximum size of HTTP request payloads | 
| --- | --- | 
| t2.micro.search | 10 MiB | 
| t2.small.search | 10 MiB | 
| t2.medium.search | 10 MiB | 
| t3.small.search | 10 MiB | 
| t3.medium.search | 10 MiB | 
| m3.medium.search | 10 MiB | 
| m3.large.search | 10 MiB | 
| m3.xlarge.search | 100 MiB | 
| m3.2xlarge.search | 100 MiB | 
| m4.large.search | 10 MiB | 
| m4.xlarge.search | 100 MiB | 
| m4.2xlarge.search | 100 MiB | 
| m4.4xlarge.search | 100 MiB | 
| m4.10xlarge.search | 100 MiB | 
| m5.large.search | 10 MiB | 
| m5.xlarge.search | 100 MiB | 
| m5.2xlarge.search | 100 MiB | 
| m5.4xlarge.search | 100 MiB | 
| m5.12xlarge.search | 100 MiB | 
| m6g.large.search | 10 MiB | 
| m6g.xlarge.search | 100 MiB | 
| m6g.2xlarge.search | 100 MiB | 
| m6g.4xlarge.search | 100 MiB | 
| m6g.8xlarge.search | 100 MiB | 
| m6g.12xlarge.search | 100 MiB | 
| m7g.medium.search | 10 MiB | 
| m7g.large.search | 10 MiB | 
| m7g.xlarge.search | 100 MiB | 
| m7g.2xlarge.search | 100 MiB | 
| m7g.4xlarge.search | 100 MiB | 
| m7g.8xlarge.search | 100 MiB | 
| m7g.12xlarge.search | 100 MiB | 
| m7g.16xlarge.search | 100 MiB | 
| c4.large.search | 10 MiB | 
| c4.xlarge.search | 100 MiB | 
| c4.2xlarge.search | 100 MiB | 
| c4.4xlarge.search | 100 MiB | 
| c4.8xlarge.search | 100 MiB | 
| c5.large.search | 10 MiB | 
| c5.xlarge.search | 100 MiB | 
| c5.2xlarge.search | 100 MiB | 
| c5.4xlarge.search | 100 MiB | 
| c5.9xlarge.search | 100 MiB | 
| c5.18xlarge.search | 100 MiB | 
| c6g.large.search | 10 MiB | 
| c6g.xlarge.search | 100 MiB | 
| c6g.2xlarge.search | 100 MiB | 
| c6g.4xlarge.search | 100 MiB | 
| c6g.8xlarge.search | 100 MiB | 
| c6g.12xlarge.search | 100 MiB | 
| c7g.large.search | 10 MiB | 
| c7g.xlarge.search | 100 MiB | 
| c7g.2xlarge.search | 100 MiB | 
| c7g.4xlarge.search | 100 MiB | 
| c7g.8xlarge.search | 100 MiB | 
| c7g.12xlarge.search | 100 MiB | 
| c7g.16xlarge.search | 100 MiB | 
| r3.large.search | 10 MiB | 
| r3.xlarge.search | 100 MiB | 
| r3.2xlarge.search | 100 MiB | 
| r3.4xlarge.search | 100 MiB | 
| r3.8xlarge.search | 100 MiB  | 
| r4.large.search | 100 MiB | 
| r4.xlarge.search | 100 MiB | 
| r4.2xlarge.search | 100 MiB | 
| r4.4xlarge.search | 100 MiB | 
| r4.8xlarge.search | 100 MiB | 
| r4.16xlarge.search | 100 MiB | 
| r5.large.search | 100 MiB | 
| r5.xlarge.search | 100 MiB | 
| r5.2xlarge.search | 100 MiB | 
| r5.4xlarge.search | 100 MiB | 
| r5.12xlarge.search | 100 MiB | 
| r6g.large.search | 100 MiB | 
| r6g.xlarge.search | 100 MiB | 
| r6g.2xlarge.search | 100 MiB | 
| r6g.4xlarge.search | 100 MiB | 
| r6g.8xlarge.search | 100 MiB | 
| r6g.12xlarge.search | 100 MiB | 
| r6gd.large.search | 100 MiB | 
| r6gd.xlarge.search | 100 MiB | 
| r6gd.2xlarge.search | 100 MiB | 
| r6gd.4xlarge.search | 100 MiB | 
| r6gd.8xlarge.search | 100 MiB | 
| r6gd.12xlarge.search | 100 MiB | 
| r6gd.16xlarge.search | 100 MiB | 
| r7g.medium.search | 100 MiB | 
| r7g.large.search | 100 MiB | 
| r7g.xlarge.search | 100 MiB | 
| r7g.2xlarge.search | 100 MiB | 
| r7g.4xlarge.search | 100 MiB | 
| r7g.8xlarge.search | 100 MiB | 
| r7g.12xlarge.search | 100 MiB | 
| r7g.16xlarge.search | 100 MiB | 
| r7gd.medium.search | 100 MiB | 
| r7gd.large.search | 100 MiB | 
| r7gd.xlarge.search | 100 MiB | 
| r7gd.2xlarge.search | 100 MiB | 
| r7gd.4xlarge.search | 100 MiB | 
| r7gd.8xlarge.search | 100 MiB | 
| r7gd.12xlarge.search | 100 MiB | 
| r7gd.16xlarge.search | 100 MiB | 
| i2.xlarge.search | 100 MiB | 
| i2.2xlarge.search | 100 MiB | 
| i3.large.search | 100 MiB | 
| i3.xlarge.search | 100 MiB | 
| i3.2xlarge.search | 100 MiB | 
| i3.4xlarge.search | 100 MiB | 
| i3.8xlarge.search | 100 MiB | 
| i3.16xlarge.search | 100 MiB | 
| or1.medium.search | 10 MiB | 
| or1.large.search | 100 MiB | 
| or1.xlarge.search | 100 MiB | 
| or1.2xlarge.search | 100 MiB | 
| or1.4xlarge.search | 100 MiB | 
| or1.8xlarge.search | 100 MiB | 
| or1.12xlarge.search | 100 MiB | 
| or1.16xlarge.search | 100 MiB | 
| or2.medium.search | 100 MiB | 
| or2.large.search | 100 MiB | 
| or2.xlarge.search | 100 MiB | 
| or2.2xlarge.search | 100 MiB | 
| or2.4xlarge.search | 100 MiB | 
| or2.8xlarge.search | 100 MiB | 
| or2.12xlarge.search | 100 MiB | 
| or2.16xlarge.search | 100 MiB | 
| om2.large.search | 10 MiB | 
| om2.xlarge.search | 100 MiB | 
| om2.2xlarge.search | 100 MiB | 
| om2.4xlarge.search | 100 MiB | 
| om2.8xlarge.search | 100 MiB | 
| om2.12xlarge.search | 100 MiB | 
| om2.16xlarge.search | 100 MiB | 
| im4gn.large.search | 100 MiB | 
| im4gn.xlarge.search | 100 MiB | 
| im4gn.2xlarge.search | 100 MiB | 
| im4gn.4xlarge.search | 100 MiB | 
| im4gn.8xlarge.search | 100 MiB | 
| im4gn.16xlarge.search | 100 MiB | 
| i4i.large.search | N/A | 
| i4i.xlarge.search | N/A | 
| i4i.2xlarge.search | N/A | 
| i4i.4xlarge.search | N/A | 
| i4i.8xlarge.search | N/A | 
| i4i.12xlarge.search | N/A | 
| i4i.16xlarge.search | N/A | 
| i4i.24xlarge.search | N/A | 
| i4i.32xlarge.search | N/A | 
| i4g.large.search | N/A | 
| i4g.xlarge.search | N/A | 
| i4g.2xlarge.search | N/A | 
| i4g.4xlarge.search | N/A | 
| i4g.8xlarge.search | N/A | 
| i4g.16xlarge.search | N/A | 
| i8g.large.search | N/A | 
| i8g.xlarge.search | N/A | 
| i8g.2xlarge.search | N/A | 
| i8g.4xlarge.search | N/A | 
| i8g.8xlarge.search | N/A | 
| i8g.12xlarge.search | N/A | 
| i8g.16xlarge.search | N/A | 
| i7i.large.search | 100 MiB | 
| i7i.xlarge.search | 100 MiB | 
| i7i.2xlarge.search | 100 MiB | 
| i7i.4xlarge.search | 100 MiB | 
| i7i.8xlarge.search | 100 MiB | 
| i7i.12xlarge.search | 100 MiB | 
| i7i.16xlarge.search | 100 MiB | 
| i8ge.large.search | 100 MiB | 
| i8ge.xlarge.search | 100 MiB | 
| i8ge.2xlarge.search | 100 MiB | 
| i8ge.3xlarge.search | 100 MiB | 
| i8ge.6xlarge.search | 100 MiB | 
| i8ge.12xlarge.search | 100 MiB | 
| i8ge.18xlarge.search | 100 MiB | 
| c7i.large.search | 100 MiB | 
| c7i.xlarge.search | 100 MiB | 
| c7i.2xlarge.search | 100 MiB | 
| c7i.4xlarge.search | 100 MiB | 
| c7i.8xlarge.search | 100 MiB | 
| c7i.12xlarge.search | 100 MiB | 
| c7i.16xlarge.search | 100 MiB | 
| m7i.large.search | 100 MiB | 
| m7i.xlarge.search | 100 MiB | 
| m7i.2xlarge.search | 100 MiB | 
| m7i.4xlarge.search | 100 MiB | 
| m7i.8xlarge.search | 100 MiB | 
| m7i.12xlarge.search | 100 MiB | 
| m7i.16xlarge.search | 100 MiB | 
| r7i.large.search | 100 MiB | 
| r7i.xlarge.search | 100 MiB | 
| r7i.2xlarge.search | 100 MiB | 
| r7i.4xlarge.search | 100 MiB | 
| r7i.8xlarge.search | 100 MiB | 
| r7i.12xlarge.search | 100 MiB | 
| r7i.16xlarge.search | 100 MiB | 
| c8g.large | 100 MiB | 
| c8g.xlarge | 100 MiB | 
| c8g.2xlarge | 100 MiB | 
| c8g.4xlarge | 100 MiB | 
| c8g.8xlarge | 100 MiB | 
| c8g.12xlarge | 100 MiB | 
| c8g.16xlarge | 100 MiB | 
| m8g.medium | 100 MiB | 
| m8g.large | 100 MiB | 
| m8g.xlarge | 100 MiB | 
| m8g.2xlarge | 100 MiB | 
| m8g.4xlarge | 100 MiB | 
| m8g.8xlarge | 100 MiB | 
| m8g.12xlarge | 100 MiB | 
| m8g.16xlarge | 100 MiB | 
| r8g.medium | 100 MiB | 
| r8g.large | 100 MiB | 
| r8g.xlarge | 100 MiB | 
| r8g.2xlarge | 100 MiB | 
| r8g.4xlarge | 100 MiB | 
| r8g.8xlarge | 100 MiB | 
| r8g.12xlarge | 100 MiB | 
| r8g.16xlarge | 100 MiB | 
| r8gd.medium | 100 MiB | 
| r8gd.large | 100 MiB | 
| r8gd.xlarge | 100 MiB | 
| r8gd.2xlarge | 100 MiB | 
| r8gd.4xlarge | 100 MiB | 
| r8gd.8xlarge | 100 MiB | 
| r8gd.12xlarge | 100 MiB | 
| r8gd.16xlarge | 100 MiB | 
| oi2.large.search | 100 MiB | 
| oi2.xlarge.search | 100 MiB | 
| oi2.2xlarge.search | 100 MiB | 
| oi2.4xlarge.search | 100 MiB | 
| oi2.8xlarge.search | 100 MiB | 
| oi2.12xlarge.search | 100 MiB | 
| oi2.16xlarge.search | 100 MiB | 

## Shard size quotas
<a name="shard-limits"></a>

The following section lists the maximum shard sizes for various instance families.



| Instance type | Multi-AZ without Standby | Multi-AZ with Standby | 
| --- | --- | --- | 
| R5, C5, M5, C7i, M7i, R7i | N/A | 65 GiB | 
| I3, i4i, i4g, i8g, i7i | N/A | 65 GiB | 
| R6g, C6g, M6g, R6gd, C7g,M7g, R7g, R7gd, C8g, M8g, R8g, R8gd | N/A | 65 GiB | 
| OR1, OR2, OM2, OI2 | N/A | N/A | 
| Im4gn, i8ge | N/A | 65 GiB | 

To request a quota increase, contact [AWS Support](https://aws.amazon.com/premiumsupport/).

## Shard count quotas
<a name="shard-count"></a>

The following section lists the maximum shard count for OpenSearch versions.



| Engine Version | Limit | Notes | 
| --- | --- | --- | 
| Elasticsearch 1.5 to 6.x | No default limit |  | 
| Elasticsearch 7.x | 1000 | Default limit can be changed via cluster. max\_shards\_per\_node setting. | 
| OpenSearch 1.x to 2.15 | 1000 | Default limit can be changed via cluster. max\_shards\_per\_node setting. | 
| OpenSearch 2.17 and above | 1000 per every 16 GB of heap to a max of 4000 | The default limit can't be changed. | 

## Java process quota
<a name="java-process-limit"></a>

OpenSearch Service limits Java processes memory to 50% of total available memory(max upto 32 GiB). The upper limit of 32 GB doesn't apply to r7g and OpenSearch optimized instances. 

**Note**  
While r7g and OpenSearch optimized (OR) instances support heap sizes above 32 GB, the increased heap allocation is not automatic. The default heap allocation remains 32 GB even on these instance types. Heap above 32 GB may be enabled via Auto-Tune (automatically, when Auto-Tune determines it beneficial) or by opening a support case with proper justification.

To request limit increase, contact [AWS Support](https://aws.amazon.com/premiumsupport/).

 Advanced users can also specify the percentage of the heap used for field data. For more information, see [Advanced cluster settings](createupdatedomains.html#createdomain-configure-advanced-options) and [JVM OutOfMemoryError](handling-errors.html#handling-errors-jvm_out_of_memory_error). 

## Domain policy quota
<a name="domain-policy-limit"></a>

OpenSearch Service limits [access policies on domains](ac.md#ac-types-resource) to 100 KiB.
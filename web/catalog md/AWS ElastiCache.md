

# Quotas for ElastiCache
<a name="quota-limits"></a>

Your AWS account has default quotas, formerly referred to as limits, for each AWS service. Unless otherwise noted, each quota is Region-specific. You can request increases for some quotas, and other quotas cannot be increased.

To view the quotas for ElastiCache, open the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home). In the navigation pane, choose **AWS services** and select **ElastiCache**.

To request a quota increase, see [Requesting a Quota Increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*. If the quota is not yet available in Service Quotas, use the [limit increase form](https://console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase).

Your AWS account has the following quotas related to ElastiCache.


| Name | Default value | Description | Metric Name | 
| --- | --- | --- | --- | 
| Nodes per Region | 300 | The maximum number of nodes across all clusters in a Region. This quota applies to your non-reserved nodes within the given Region. You can have up to 300 non-reserved nodes in the same Region. | NodesPerRegion | 
| Nodes per cluster (Memcached) | 60 | The maximum number of nodes in an individual Memcached cluster. | MemcachedNodesPerCluster | 
| Nodes per cluster (cluster mode enabled) | 90 | The maximum number of nodes in an individual Redis OSS or Valkey cluster. | NodesPerCluster | 
| Parameter groups per Region | 300 | The maximum number of parameters groups you can create in a Region. | ParameterGroup | 
| Subnet groups per Region | 300 | The maximum number of subnet groups you can create in a Region. | SubnetGroup | 
| Subnets per subnet group | 20 | The maximum number of subnets you can define for a subnet group. | SubnetsPerSubnetGroup | 
| Serverless caches per Region | 40 | The maximum number of serverless caches in a Region. | ServerlessCache | 
| Serverless snapshots per day per cache | 24 | The maximum number of serverless snapshots you can take per day for each serverless cache. | SnapshotsPerDayPerCache | 
| Users per Region | 2000 | The maximum total number of users you can create in a Region. | User | 
| User groups per Region | 200 | The maximum number of user groups you can create in a Region. | UserGroup | 
| Users per user group | 100 | The maximum number of users you can define for a user group. | UsersPerUserGroup | 
| User groups per replication group | 1 | The maximum number of user groups you can associate with a replication group. | UserGroupsPerReplicationGroup | 
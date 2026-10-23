This page describes quotas and request limits for Cloud Storage. You
can request increases to quotas, but limits cannot be adjusted.

Quotas and limits are subject to change.

## Buckets

| Limit | Value | Notes |
|---|---|---|
| Maximum [bucket name](https://docs.cloud.google.com/storage/docs/buckets#naming) size | 63 characters | If the name contains a dot (.), the limit is 222 characters. |
| Maximum bucket creation and deletion rate per project | Approximately one request every two seconds | Plan on fewer buckets and more objects in most cases. For example, a common design choice is to use one bucket per user of your project. However, if you're designing a system that adds many users per second, then design for many users in one bucket (with appropriate [permissions](https://docs.cloud.google.com/storage/docs/access-control/iam)) so that the bucket creation rate limit doesn't become a bottleneck. Highly available applications shouldn't depend on bucket creation, deletion, or list operations in the critical path of their application. Bucket names are part of a centralized and global namespace: any dependency on this namespace creates a single point of failure for your application. If a location is temporarily unavailable, the bucket list operation might return only a partial list of buckets. Due to these considerations and the bucket creation/deletion limit, the recommended practice for highly available services on Cloud Storage is to pre-create all the buckets necessary. |
| Maximum bytes of data that can be stored across all the zonal buckets per project, per zone This limit only applies to buckets that use [Rapid Bucket](https://docs.cloud.google.com/storage/docs/rapid/rapid-bucket). | 1 TB default limit, but might be lower or higher based on your project's billing account history | For more information about zonal buckets, see [Rapid Bucket](https://docs.cloud.google.com/storage/docs/rapid/rapid-bucket). |
| Maximum [bucket restoration](https://docs.cloud.google.com/storage/docs/use-soft-deleted-buckets) rate per project | Approximately one request every two seconds |   |
| Maximum rate of bucket metadata updates per bucket | One update per second | Rapid updates to a single bucket (for example, changing the CORS configuration) might result in throttling errors. |
| Maximum number of principals that can be granted IAM roles per bucket | 1,500 principals for all IAM roles 100 principals for [legacy IAM roles](https://docs.cloud.google.com/storage/docs/access-control/iam#acls) | See [Principal types](https://docs.cloud.google.com/storage/docs/access-control/iam#identities) for more information. |
| Maximum number of [Pub/Sub notification configurations](https://docs.cloud.google.com/storage/docs/pubsub-notifications) per bucket | 100 notification configurations |   |
| Maximum number of concurrent bucket relocations supported from the same location within a project | 5 buckets | See [Bucket relocation](https://docs.cloud.google.com/storage/docs/bucket-relocation/overview) for more information. |
| Maximum number of [Pub/Sub notification configurations](https://docs.cloud.google.com/storage/docs/pubsub-notifications#notification-configs) set to trigger for a specific event | 10 notification configurations |   |
| Maximum number of custom attributes in a [Pub/Sub notification configuration](https://docs.cloud.google.com/storage/docs/pubsub-notifications#notification-configs) | 10 custom attributes |   |
| Maximum retention period that can be set for [Bucket Lock](https://docs.cloud.google.com/storage/docs/bucket-lock) | 3,155,760,000 seconds (100 years) |   |
| Maximum [soft delete retention duration](https://docs.cloud.google.com/storage/docs/soft-delete#retention-duration) | 90 days |   |
| Maximum number of prefixes and suffixes in total when using [`matchesPrefix` and `matchesSuffix` lifecycle conditions](https://docs.cloud.google.com/storage/docs/lifecycle#matchesprefix-suffix) across all rules on a bucket. | 1,000 | For information about Object Lifecycle Management, see [Object Lifecycle Management](https://docs.cloud.google.com/storage/docs/lifecycle). |

## Objects

| Limit | Value | Notes |
|---|---|---|
| Maximum [object](https://docs.cloud.google.com/storage/docs/objects) size | 5 TiB | This limit applies regardless of write method, including [object composition](https://docs.cloud.google.com/storage/docs/composite-objects), [resumable uploads](https://docs.cloud.google.com/storage/docs/resumable-uploads), and [multipart uploading](https://docs.cloud.google.com/storage/docs/multipart-uploads). |
| Maximum combined size of all [custom metadata](https://docs.cloud.google.com/storage/docs/metadata#custom-metadata) keys and values per object | 8 KiB |   |
| Maximum [object name](https://docs.cloud.google.com/storage/docs/objects#naming) size for objects in a flat namespace bucket | 1024 bytes (UTF-8 encoded) |   |
| Maximum [object name](https://docs.cloud.google.com/storage/docs/objects#naming) size for objects in a hierarchical namespace enabled bucket | **Folder name**: 512 bytes (UTF-8 encoded) **Base name**: 512 bytes (UTF-8 encoded) |   |
| Maximum rate of writes to the same object name | One write per second | Writing to the same object name at a rate above the limit might result in throttling errors. For more information, see [Object immutability](https://docs.cloud.google.com/storage/docs/objects#immutability). |
| Maximum rate of object metadata updates to a single object | One update per second | Updating object metadata at a rate above the limit might result in throttling errors. |
| Maximum rate of object writes in a bucket | Unlimited | Includes uploading, updating, and deleting objects. Buckets initially support roughly 1,000 writes per second and then [scale as needed](https://docs.cloud.google.com/storage/docs/request-rate). |
| Maximum rate of object reads in a bucket | Unlimited | Includes reading object data, reading object metadata, and listing objects. Buckets initially support roughly 5,000 object reads per second and then [scale as needed](https://docs.cloud.google.com/storage/docs/request-rate). However, note that there are [bandwidth limits](https://docs.cloud.google.com/storage/quotas#bandwidth). |
| Maximum number of [access control list entries (ACLs)](https://docs.cloud.google.com/storage/docs/access-control/lists) | 100 ACLs per object | For more information, see [ACL scopes](https://docs.cloud.google.com/storage/docs/access-control/lists#scopes). |
| Maximum number of [source objects in an object composition](https://docs.cloud.google.com/storage/docs/composite-objects) | 32 objects in a single compose request |   |
| Maximum number of components that make up a [composite object](https://docs.cloud.google.com/storage/docs/composite-objects) | Unlimited | While there is no limit to the number of components that make up a composite object, the `componentCount` metadata associated with a composite object saturates at 2,147,483,647, and the final composite object must adhere to the 5 TiB size limit that applies to all objects in Cloud Storage. |
| Maximum retention time that can be set for [Object Retention Lock](https://docs.cloud.google.com/storage/docs/object-lock) | 3,155,760,000 seconds (100 years) from the current date and time |   |
| Maximum initial queries per second (QPS) limits for reading and writing objects in buckets with [hierarchical namespace enabled](https://docs.cloud.google.com/storage/docs/hns-overview) | Up to 8 times higher QPS compared to buckets without hierarchical namespace enabled | For information about optimizing performance when working with folders, see [Folder management.](https://docs.cloud.google.com/storage/docs/hns-buckets-best-practices#folder-management) |
| Maximum [contexts](https://docs.cloud.google.com/storage/docs/object-contexts) per object | 50 |   |
| Maximum combined size of all object context keys and values per object | 25 KiB (UTF-8 encoded) |   |
| Maximum length of an object context key | 256 bytes (UTF-8 encoded) |   |
| Maximum length of an object context value | 256 bytes (UTF-8 encoded) |   |

## Rapid Cache

| Limit | Value | Notes |
|---|---|---|
| Maximum [Rapid Cache](https://docs.cloud.google.com/storage/docs/rapid/rapid-cache) cache size | 1 PiB | The cache size automatically scales up or down to the amount of data stored in the cache, up to a maximum of 1 PiB. The cache size is equal to the amount of data ingested into the cache minus the amount of data evicted. For example, if a workload ingests 100 GiB of data, the cache size will grow to 100 GiB. If 50 GiB of data is subsequently evicted, the cache size will reduce to 50 GiB. Your cache size limit might be lower based on your project's billing account history. If resources are limited, cache creations can be halted or existing caches can stop growing and evict data on a least recently used (LRU) algorithm to make room for new data. You can request an increase of cache storage beyond 1 PiB by contacting your Technical Account Manager or Google representative. |
| Maximum [Rapid Cache](https://docs.cloud.google.com/storage/docs/rapid/rapid-cache) data usage bandwidth limit per-project, per-zone | 20 Tbps | The cache bandwidth limit automatically scales according to the amount of data stored in the cache at a rate of 20 Gbps per 1 TiB of data, with a base value of 100 Gbps. You can increase the starting or total amount of cache bandwidth by increasing the amount of data stored in the cache or creating more caches in a zone. You can also request increasing the rate of bandwidth by contacting your Technical Account Manager or Google representative. The cache bandwidth limit is separate from your project's [maximum bandwidth quota](https://docs.cloud.google.com/storage/quotas#bandwidth). Reading data from the cache counts towards the cache bandwidth limit until the limit is reached, at which point data reads begin counting towards the project's bandwidth quota. Cache misses don't count towards the cache bandwidth limit. Because the cache bandwidth limit applies on a per-project, per-zone basis, traffic from caches within the same project and zone count towards a common cache bandwidth limit, even if the caches are created for different buckets. For example, say Cache A is created in the zone `us-east1-b` for the bucket `example-bucket-1`, which is located in the project `my-project`. Cache B is created in `us-east1-b` for `example-bucket-2`, which is also located in `my-project`. Because Cache A and Cache B are both located in `us-east1-b` and `my-project`, traffic for both caches count towards the same cache bandwidth limit. > [!NOTE] > **Note:** Caches created for buckets in different location types don't count towards the same cache bandwidth limit, even if the caches are created in the same zone. For example, say both Cache A and Cache B are created in the `us-east1-b` zone, but Cache A belongs to a bucket in the `us-east1` region and Cache B belongs to a bucket in the `US` multi-region. The caches would have separate cache bandwidth limits because their associated buckets have different location types, where one is stored in a region and the other is stored in a multi-region. |
| Maximum number of [Rapid Cache](https://docs.cloud.google.com/storage/docs/rapid/rapid-cache) caches being created concurrently per project, per zone | 20 caches | The maximum number of caches that can be in the `creating` state at a given time. |

## Managed folders

| Limit | Value | Notes |
|---|---|---|
| Maximum [managed folder name](https://docs.cloud.google.com/storage/docs/managed-folders#managed_folder_names) size | 1024 bytes (UTF-8 encoded) |   |
| Maximum number of managed folders in a Cloud Storage bucket | Unlimited |   |
| Maximum [managed folder nesting limit](https://docs.cloud.google.com/storage/docs/managed-folders#managed_folder_names) | 15 |   |
| Maximum rate of [IAM policy](https://docs.cloud.google.com/storage/docs/managed-folders#managed-folder-iam) updates per managed folder | One update per second |   |
| Maximum number of principals that can be granted IAM roles per managed folder | 1,500 principals for all IAM roles | The number of principals granted an IAM role on a managed folder doesn't count towards the maximum number of principals that can be granted an IAM role on the bucket containing the managed folder, parent managed folders, or child managed folders. |

## JSON API requests

| Limit | Value | Notes |
|---|---|---|
| Maximum total request payload of a [batch request](https://docs.cloud.google.com/storage/docs/batch) | Less than 10 MiB | Don't include more than 100 calls in a single request. |
| Maximum size of an object listing [glob pattern](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/list#matchGlob) | 1024 bytes in UTF-8 encoding |   |

## XML API requests

| Limit | Value | Notes |
|---|---|---|
| Maximum combined size of request URL and HTTP headers | 16 KiB |   |
| Maximum number of buckets that can be returned when listing buckets | 1,000 buckets | The XML API returns buckets lexicographically by name. |
| Maximum number of parts in a [multipart upload](https://docs.cloud.google.com/storage/docs/multipart-uploads) | 10,000 parts | The object assembled from these parts must adhere to the 5 TiB size limit that applies to all objects in Cloud Storage. |
| Maximum size of an individual part in a [multipart upload](https://docs.cloud.google.com/storage/docs/multipart-uploads) | 5 GiB |   |
| Minimum size of an individual part in a [multipart upload](https://docs.cloud.google.com/storage/docs/multipart-uploads) | 5 MiB | There is no minimum size limit on the last part of a multipart upload. As a result, this limit is not enforced at the time a part is uploaded, but is instead enforced at the time you attempt to [complete the upload](https://docs.cloud.google.com/storage/docs/xml-api/post-object-complete). |
| Maximum length of time a [multipart upload](https://docs.cloud.google.com/storage/docs/multipart-uploads) and its uploaded parts can remain unfinished or idle in a bucket | Unlimited |   |
| Maximum number of different [multipart uploads](https://docs.cloud.google.com/storage/docs/multipart-uploads) that can simultaneously occur for an object | Unlimited |   |
| Maximum length of time to complete a [resumable upload session](https://docs.cloud.google.com/storage/docs/resumable-uploads) | 7 days | The length of time is measured starting from the resumable upload being initiated. |

## HMAC keys for service accounts

There is a limit of at most 10 [HMAC keys](https://docs.cloud.google.com/storage/docs/authentication/hmackeys) per service account. Deleted keys
don't count towards this limit.

## Inventory reports

There is a limit of at most 100 [inventory report configurations](https://docs.cloud.google.com/storage/docs/insights/inventory-reports#inventory-reports-overview) per source
bucket.

## Storage Intelligence

Storage Intelligence enforces rate quotas on [Intelligence Findings](https://docs.cloud.google.com/storage/docs/json_api/v1/intelligenceFindings) requests.

The following table lists the metric, API methods, and default limit for the quota:

| Metric | API methods | Default limit |
|---|---|---|
| `storage.googleapis.com/intelligence_findings_requests` | - `projects.locations.intelligenceFindings.get` (`GetIntelligenceFinding`) - `projects.locations.intelligenceFindings.list` (`ListIntelligenceFindings`) - `projects.locations.intelligenceFindings.summarize` (`SummarizeIntelligenceFindings`) - `projects.locations.intelligenceFindings.revisions.get` (`GetIntelligenceFindingRevision`) - `projects.locations.intelligenceFindings.revisions.list` (`ListIntelligenceFindingRevisions`) | 600 requests per minute per project |

## Storage batch operations jobs

This section describes the limits and quotas for storage batch operations jobs.

### Concurrent storage batch operations jobs

The following table describes the limit for concurrent in-progress
[`jobs`](https://docs.cloud.google.com/storage/docs/storagebatchoperations/reference/rest/v1/projects.locations.jobs):

| Limit type | Limit | Applies to |
|---|---|---|
| Concurrent jobs on a single bucket | 100 | Per project per location |
| Concurrent dry-run jobs on a single bucket | 100 | Per project per location |
| Concurrent jobs on multiple buckets | 5 | Globally per project |
| Concurrent dry-run jobs on multiple buckets | 5 | Globally per project |
| Concurrent bucket operations | 50 buckets | Per job on multiple buckets per location |

### Rate quotas

Storage batch operations enforces rate quotas on requests.

The following table lists the metric, API methods, and default limits for each quota:

| Metric | API methods | Default limits |
|---|---|---|
| `storagebatchoperations.googleapis.com/api-requests` | - `storagebatchoperations.jobs.create` - `storagebatchoperations.jobs.get` - `storagebatchoperations.jobs.list` - `storagebatchoperations.jobs.cancel` - `storagebatchoperations.jobs.delete` - `storagebatchoperations.jobs.bucketOperations.get` - `storagebatchoperations.jobs.bucketOperations.list` - `storagebatchoperations.operations.get` - `storagebatchoperations.operations.list` - `storagebatchoperations.operations.cancel` - `storagebatchoperations.operations.delete` | 1200 requests per minute per project |

### Queue limits

You can queue multiple storage batch operations jobs. The system enforces the following rate limits when you queue jobs:

- **Per project, per minute**: A maximum of 600 queued jobs per project.
- **Per project, per day**: A maximum of 5,000 queued jobs per project.

## Cloud Storage MCP server

This section describes limits and quotas for Cloud Storage MCP server. For instructions on how to use it, see [Use the Cloud Storage MCP server](https://docs.cloud.google.com/storage/docs/use-cloud-storage-mcp).

| Limit | Value |
|---|---|
| Maximum file size | 8 MiB |
| Supported endpoints | Global only |

The following table describes rate limits per tool:

| Quota | Value |
|---|---|
| Requests for `McpListBuckets`, `McpListObjects`, `McpReadText`, `McpGetObjectMetadata`, `McpReadObject`, `McpGetBucketMetadata`, `McpGetBucketIamPolicy`, and `McpTestBucketIamPermissions` | 600 per minute per project per region |
| Requests for `McpCreateBucket`, `McpWriteText`, and `McpDeleteObject` | 300 per minute per project per region |
| Requests for `McpDeleteBucket` and `McpSetBucketIamPolicy` | 100 per minute per project per region |

## Bandwidth

| Quota | Value | Notes |
|---|---|---|
| Maximum bandwidth for each [zone](https://docs.cloud.google.com/storage/docs/locations#location-z) that has data egress from Cloud Storage to Google services per project, per zone Only available with [Rapid Bucket](https://docs.cloud.google.com/storage/docs/rapid/rapid-bucket). | 1 Tbps default quota per project, per zone, but might be lower or higher based on your project's billing account history | You can [request quota increases by using the Google Cloud console](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project, per-zone basis. Alternatively, you can request quota increases by contacting your Technical Account Manager or Google representative. To learn how to view the Google egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Google egress usage for a project, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). For more information about zonal buckets, see [Rapid Bucket](https://docs.cloud.google.com/storage/docs/rapid/rapid-bucket). |
| Maximum bandwidth for each [region](https://docs.cloud.google.com/storage/docs/locations#location-r) that has data egress from Cloud Storage to Google services | 200 Gbps per region default quota for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN is exempt from this quota. You can [request quota increases](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. To learn how to view the Google egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Google egress usage for a project, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). |
| Maximum bandwidth for each [dual-region](https://docs.cloud.google.com/storage/docs/locations#location-dr) that has data egress from Cloud Storage to Google services | 200 Gbps default quota for each region within a dual-region for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN is exempt from this quota. You can [request a quota increase](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. To learn how to view the Google egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Google egress usage for a project, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). |
| Maximum bandwidth for each [multi-region](https://docs.cloud.google.com/storage/docs/locations#location-mr) that has data egress from Cloud Storage to Google services | 200 Gbps per region default quota for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN is exempt from this quota. Each region within the given multi-region has a separate quota. For example, say the project `my-project` has a multi-region Google egress bandwidth quota of 200 Gbps for all regions within it. In this scenario, the `us-east1` region has 200 Gbps of bandwidth when supporting data egress to Google services from buckets in the `us` multi-region, and the `us-west1` region has 200 Gbps of bandwidth when supporting data egress to Google services from buckets in the `us` multi-region. To learn how to view the Google egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Google egress usage for a project, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). You can [request a quota increase](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. Note that generally you should use buckets located in regions or dual-regions for workloads with high egress rates to Google services. For existing buckets in multi-regions that run large workloads in Google services, you can [use Storage Transfer Service to move your data](https://docs.cloud.google.com/storage/docs/moving-buckets) to a bucket in a region or dual-region. |
| Maximum egress bandwidth for Internet requests accessing data from buckets in a [region](https://docs.cloud.google.com/storage/docs/locations#location-r) | 200 Gbps per region default quota for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN due to [cache misses](https://docs.cloud.google.com/cdn/docs/overview#cache_hits_and_cache_misses) is included in this quota. To learn how to view the Internet egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Internet egress usage for a project, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). You can [request quota increases](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. |
| Maximum egress bandwidth for Internet requests accessing data from buckets in a [dual-region](https://docs.cloud.google.com/storage/docs/locations#location-dr) | 200 Gbps default quota for each region within a dual-region for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN due to [cache misses](https://docs.cloud.google.com/cdn/docs/overview#cache_hits_and_cache_misses) is included in this quota. To learn how to view the Internet egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Internet egress usage for a project by region, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). You can [request a quota increase](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. |
| Maximum egress bandwidth for Internet requests accessing data from buckets in a given [multi-region](https://docs.cloud.google.com/storage/docs/locations#location-mr) | 200 Gbps per region default quota for most projects, but might be lower based on your project's billing account history | Egress to Cloud CDN and Media CDN due to [cache misses](https://docs.cloud.google.com/cdn/docs/overview#cache_hits_and_cache_misses) is included in this quota. Regions within the multi-region have separate multi-region Internet egress quotas. For example, say `my-project` sends data from a bucket located in the `us` multi-region to customers around the world. In this scenario, different regions within the `us` multi-region use their own Internet egress quota as data is sent from the bucket to different parts of the world. Typically, Internet egress quota is counted against the region that's geographically closest to the data's destination. To learn how to view the Internet egress limits for a project, see [View and manage quotas](https://docs.cloud.google.com/docs/quotas/view-manage). To learn how to view Internet egress usage for a project by region, see [Bandwidth monitoring](https://docs.cloud.google.com/storage/docs/bandwidth-usage#bandwidth-monitoring). You can [request a quota increase](https://docs.cloud.google.com/storage/docs/bandwidth-usage#increase) on a per-project basis. |

When a project's bandwidth exceeds a certain quota, requests to affected
buckets can be throttled or can be rejected with a [retryable](https://docs.cloud.google.com/storage/docs/retry-strategy)
`429 - rateLimitExceeded` error that includes details of the exceeded quota.
See [Bandwidth usage](https://docs.cloud.google.com/storage/docs/bandwidth-usage) for information about monitoring your bandwidth.
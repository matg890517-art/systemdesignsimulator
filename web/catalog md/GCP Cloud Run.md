This page contains usage quota and limits that apply when using
Cloud Run.

The number of Cloud Run [resources](https://docs.cloud.google.com/run/docs/resource-model) is limited.
Quotas for Cloud Run encompass API rate limits, which affect
the rate at which you can call the [Cloud Run Admin API](https://docs.cloud.google.com/run/docs/reference/rest).

There is no direct limit for the following:

- The size of container images you can deploy.
- The number of concurrent requests that are served by a [Cloud Run service](https://docs.cloud.google.com/run/docs/resource-model#services).

## Resource limits for Cloud Run

The following limits set the maximum number of resources you can create in a
region. However, available quota doesn't guarantee resource availability. If a
resource is not available, or if the region you choose is limited on the
resource, you may not be able to create or scale resources of that type, even
if you have remaining quota in your region or project. For example, you might
still have quota to create jobs in `us-central1`, but there might not be
available resources in that region.

To go beyond limits that can be increased, [request a quota increase](https://docs.cloud.google.com/run/quotas#increase).
To go beyond per project limits that cannot be increased, create new resources in a different Google Cloud project or region.

| Resource | Description | Limit | Scope | Can be increased |
|---|---|---|---|---|
| Service | Maximum number of services | 1000 | per project and region | Yes |
| Job | Maximum number of jobs | 1000 | per project and region | Yes |
| Worker pool | Maximum number of worker pools | 1000 | per project and region | Yes |
| Instance | Maximum number of instances | 100 | per project and region | Yes |
| Instance | Maximum continuous execution time before automatic restart (requires `always` or `on-failure` restart policy) | 7 days | per instance | No |
| Instance | Baseline CPU allocation for shared CPU instances outside of burst budget | 6.25% | per instance | No |
| Job execution | Maximum number of running job executions | 1000 | per project and region | Yes |
| Revision | Number of revisions after which any non-addressable revisions are automatically deleted in historical order | 1000 | per service | No |
| Revision | Maximum number of revisions serving traffic | 4000 | per project and region | Yes |
| Revision tag | Maximum number of [revision tags](https://docs.cloud.google.com/run/docs/rollouts-rollbacks-traffic-migration#tags). When the revision tag limit is exceeded, Cloud Run executes tag cleanup on the service. For the service for which a new tag is being created, tags that don't have a specified traffic percentage are automatically deleted in historical order. | 2000 | per project and region | Yes |
| Job execution | Retention limit for completed job executions. When the number of completed executions for a job reaches this limit, executions are automatically deleted in historical order | 1,000 | per job | No |
| Job execution task^1^ | Maximum number of [tasks running in parallel](https://docs.cloud.google.com/run/docs/configuring/parallelism#limit) | Depends on selected region and [CPU](https://docs.cloud.google.com/run/docs/configuring/jobs/cpu) and [memory](https://docs.cloud.google.com/run/docs/configuring/jobs/memory-limits) configurations. This limit might be greater in high-capacity regions or lower in recently opened regions. You can view your quota in the [Quotas and system limits](https://console.cloud.google.com/iam-admin/quotas) console page. | per job execution | Yes |
| Job execution task | Maximum tasks timeout value | 168 hours (7 days), or 1 hour if using GPUs | per job execution | No |
| Job execution task | Maximum number of tasks in a single job | 10,000 | per job execution | No |
| Job execution task | Maximum number of task retries in a job | 10 | per job execution | No |
| Environment variables | Maximum number of environment variables for each container | 1000 | per job or per service | No |
| Command arguments | Maximum number of command arguments for each container | 1000 | per job or per service | No |
| Container instance^3^ | Maximum number of container instances using Direct VPC egress | 100-200, depending on selected [region](https://docs.cloud.google.com/run/docs/locations) configurations. | per revision and region | Yes |
| Container instance | [Startup](https://docs.cloud.google.com/run/docs/container-contract#startup) timeout, in minutes | 4 | per container instance | No |
| Memory | Maximum memory size, in GiB | 32 | per container instance | No |
| CPU | Maximum number of vCPU | 8 | per container instance | No |
| CPU^1^ | Maximum total CPU, in milli vCPU, allocated across all instances over a 1 minute period. | Depends on selected region. This limit might be greater in high-capacity regions or lower in recently opened regions. | per project and region | Yes |
| Memory^1^ | Maximum total memory, in bytes, allocated across all instances over a 1 minute period. | Depends on selected region. This limit might be greater in high-capacity regions or lower in recently opened regions. You can view your quota in the [Quotas and system limits](https://console.cloud.google.com/iam-admin/quotas) console page. | per project and region | Yes |
| GPU instance without zonal-redundancy guarantee^1^, ^4^ | Maximum number of container instances with GPU | 0^4^ | per project per region | Yes |
| GPU instance with zonal-redundancy guarantee^1^, ^4^ | Maximum number of container instances with GPU | 0^4^ | per project per region | Yes |
| Disk | Maximum [writable, in-memory filesystem](https://docs.cloud.google.com/run/docs/reference/container-contract#filesystem), limited by instance memory, in GiB | 32 | per container instance | No |
| Environment variable | Maximum variable length, in Kb | 32 | per variable | No |
| Domain mapping | Maximum number of SSL certificates | 50 | per top domain and per week | No |
| Domain mapping | Maximum number of duplicate SSL certificates | 5 | per top domain and per week | No |
| Access token | Maximum number of unique [access token](https://docs.cloud.google.com/run/docs/securing/service-identity#access_tokens) generated | 50 | per container instance per second | No |
| Identity token | Maximum number of unique [identity token](https://docs.cloud.google.com/run/docs/securing/service-identity#identity_tokens) generated | 50 | per container instance per second | No |
| Files opened | Maximum number of files that can be opened at the same time. Corresponds to `/proc/sys/fs/file-max`. | 25000 | per container instance | No |

^1^These regional [quotas](https://console.cloud.google.com/iam-admin/quotas?pageState=(%22allQuotasTable%22:(%22f%22:%22%255B%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fcpu_allocation_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22OR_5C_22_22_2C_22o_22_3Atrue%257D_2C%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fmem_allocation_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22OR_5C_22_22_2C_22o_22_3Atrue%257D_2C%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fnvidia_l4_gpu_allocation_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22OR_5C_22_22_2C_22o_22_3Atrue%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fnvidia_l4_gpu_allocation_no_zonal_redundancy_5C_22_22_2C_22s_22_3Atrue%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22OR_5C_22_22_2C_22o_22_3Atrue%257D_2C%257B_22k_22_3A_22_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Frun.googleapis.com%252Finstance_limit_regional_5C_22_22%257D%255D%22))) are used in a few cases where each controls:

- The maximum value that can be picked for
  the [maximum instance](https://docs.cloud.google.com/run/docs/configuring/max-instances) attribute of a
  revision. Once it is granted in a given region,
  all revisions in that region can go up to the granted limit.

- The maximum [parallelism](https://docs.cloud.google.com/run/docs/configuring/parallelism) of
  a job. Once it is granted in a given region, all jobs in that region can go
  up to the granted limit.

1.

   The total container instances for running job executions in a region.

^3^This regional [quota](https://console.cloud.google.com/iam-admin/quotas?metric=run.googleapis.com/instance_limit_with_direct_vpc_egress_regional&usage=ALL) is used in a few cases:

- It controls the maximum value that can be picked for
  the [maximum instance](https://docs.cloud.google.com/run/docs/configuring/max-instances) attribute of a
  revision using Direct VPC egress. Once it is granted in a given region,
  all revisions in that region can go up to the granted limit.

1.

   It controls the maximum [parallelism](https://docs.cloud.google.com/run/docs/configuring/parallelism) of a job using Direct VPC egress. Once it is granted in a given region, all jobs in that region can go up to the granted limit.

^4^ New projects creating a service with L4 GPUs will be automatically granted 3 [NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion](https://console.cloud.google.com/projectselector2/iam-admin/quotas?pageState=(%22allQuotasTable%22:(%22f%22:%22%255B%257B_22k_22_3A_22Service_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22Cloud%2520Run%2520Admin%2520API_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22serviceTitle_22%257D_2C%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fnvidia_l4_gpu_allocation_no_zonal_redundancy_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D%255D%22))). You can also request [NvidiaL4GpuAllocPerProjectRegion](https://console.cloud.google.com/projectselector2/iam-admin/quotas?pageState=(%22allQuotasTable%22:(%22f%22:%22%255B%257B_22k_22_3A_22Service_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22Cloud%2520Run%2520Admin%2520API_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22serviceTitle_22%257D_2C%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fnvidia_l4_gpu_allocation_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D%255D%22))) or [NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion](https://console.cloud.google.com/projectselector2/iam-admin/quotas?pageState=(%22allQuotasTable%22:(%22f%22:%22%255B%257B_22k_22_3A_22Service_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22Cloud%2520Run%2520Admin%2520API_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22serviceTitle_22%257D_2C%257B_22k_22_3A_22Metric_22_2C_22t_22_3A10_2C_22v_22_3A_22_5C_22run.googleapis.com%252Fnvidia_l4_gpu_allocation_no_zonal_redundancy_5C_22_22_2C_22s_22_3Atrue_2C_22i_22_3A_22metricName_22%257D%255D%22))) quota. If your peak GPU usage is not close to your quota, Google might decrease your quota.

## Networking limits for Cloud Run

### Request limits for Cloud Run

| Resource | Description | Limit | Scope | Notes |
|---|---|---|---|---|
| Services | Maximum number of concurrent requests | 1,000 | per instance |   |
| Instances | Maximum number of concurrent requests | 80 | per instance |   |
| Services and Instances | Maximum number of concurrent streams | 100 | per HTTP/2 client connection |   |
| Services | Maximum time before timeout | 60 minutes | per request |   |
| Services and Instances | Maximum HTTP/1 request size | 32 MiB | per request | Limit applies if using HTTP/1 server. No limit if using HTTP/2 server. |
| Services and Instances | Maximum HTTP/1 response size | 32 MiB | per response | Limit applies if not using `Transfer-Encoding: chunked` or streaming. |
| Services and Instances | Maximum number of open connections | 50,000 | per instance per egress type | Doesn't apply to Direct VPC egress traffic. |
| Services and Instances | Outbound connections | 700 | per second per instance | Doesn't apply to Direct VPC egress traffic sent to the VPC network. |
| Services and Instances | Outbound connections | 5,000 | per minute per instance | Doesn't apply to Direct VPC egress traffic sent to the VPC network. |
| Services and Instances | Outbound DNS resolutions | 1,000 | per second per instance |   |
| Services and Instances | Inbound requests | 800 | per second to an HTTP/1 container port per instance | Doesn't apply to HTTP/2 container ports. |

### Bandwidth limits for Cloud Run

The following bandwidth limits apply to Cloud Run services and
instances:

| Resource | Description | Limit | Scope | Notes |
|---|---|---|---|---|
| Services and Instances | Maximum bits for egress over [Direct VPC](https://docs.cloud.google.com/run/docs/configuring/vpc-direct-vpc) | 1 Gbps | per instance | Egress over Direct VPC egress to destinations on the VPC network. |
| Services and Instances | Maximum bits, excluding egress over Direct VPC | 600 Mbps | per instance | Based on the sum of ingress and egress bits, excluding egress over Direct VPC egress to destinations on the VPC network. |
| Services and Instances | Maximum total packet rate, excluding egress over Direct VPC | 64,000 packets per second | per instance | Based on the sum of ingress packets and egress packets, excluding egress over Direct VPC egress to destinations on the VPC network. |

If any of these limits are reached, the Cloud Run instance will
have limited bandwidth.

## Cloud Run Admin API rate Limits

The following rate limits apply to the [Cloud Run Admin API](https://docs.cloud.google.com/run/docs/reference/rest).
They do not apply to the requests reaching your deployed Cloud Run
services.

| Quota | Description | Limit | Can be increased | Scope |
|---|---|---|---|---|
| [Cloud Run Admin API read requests](https://console.cloud.google.com/iam-admin/quotas?metric=run.googleapis.com/read_regional&usage=ALL) | The number of *API* reads per 60 seconds per region. This is *not* the number of read requests to your Cloud Run services, which is not limited. | 3,000 per 60 seconds | Yes | per project and region |
| [Cloud Run Admin API write requests](https://console.cloud.google.com/iam-admin/quotas?metric=run.googleapis.com/write_regional&usage=ALL) | The number of *API* writes per 60 seconds per region. This is *not* the number of write requests to your Cloud Run services, which is not limited. | 180 per 60 seconds | Yes | per project and region |
| [Job Run](https://console.cloud.google.com/iam-admin/quotas?metric=run.googleapis.com/run_job_regional&usage=ALL) | Maximum number of times a job can be executed per 60 seconds per region. | 180 per 60 seconds | Yes | per project and region |

## How to increase quota

Cloud Quotas adjustment requests are subject to review. If your quota
adjustment request requires review, you receive an email acknowledging receipt
of your request. If you need further assistance, respond to the email. After
reviewing your request, you receive an email notification indicating whether
your request was approved.

### Console

To adjust a quota value, follow these steps:

1. In the Google Cloud console, go to the
   **IAM \& Admin \> Quotas \& System Limits** page:


   [Go to Quotas \& System Limits](https://console.cloud.google.com/iam-admin/quotas)
   If prompted to select a project, select the project that you want to adjust.

   <br />

2. Find the quota value that you want to update in the **Quota** column and
   select the checkbox next to the quota that you want to update.

   If needed, use the **Filter** search box to search for your quota.

   <br />

3. Click **Edit** and the **Quota changes** dialog appears.

4. Enter the quota value that you want in the **New value** field.
   Some quota values have a unit of measurement; if this applies, select the
   unit that you want in the adjacent list. Click **Done**.

   Optional: If you see a checkbox with the text `I understand that this
   request will remove any overrides`, it means that adjusting the quota value
   to a number equal to or greater than the default will remove the previous
   [quota override](https://docs.cloud.google.com/docs/quotas/view-manage#create_override). If this is what
   you want, select the checkbox and proceed.
5. To increase your quota value greater than the number indicated on the
   dialog, select **Apply for higher quota**.

   1. In the **Quota changes** form, enter the updated quota value that
      you want in the **New value** field. If a **Request description**
      field appears, enter a description. Click **Done**.

   2. If a **Next** button appears, click **Next** and fill out your contact
      details in the screen that follows.

6. Click **Submit request**.

If you find that you can't request an adjustment from the console, request the
increase from [Cloud Customer Care](https://docs.cloud.google.com/support).

To learn more about how the quota increase process works, see
[About quota adjustments](https://docs.cloud.google.com/docs/quotas/overview#about_increase_requests).

#### Batching requests for higher quota values

You can batch requests for higher quota by selecting the checkbox next to each
quota that you want to include. However, batching requests can increase the
amount of time it takes for Google Cloud to review your request.

To reduce review time, group quota adjustment requests by product and area. For
example, if you want to request adjustments to networking and Compute Engine
VM quotas, create one request for the networking quotas and another request for
the Compute Engine VM quotas.
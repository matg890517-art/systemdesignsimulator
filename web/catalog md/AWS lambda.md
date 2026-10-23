

# Lambda quotas
<a name="gettingstarted-limits"></a>

**Important**  
New AWS accounts have reduced concurrency and memory quotas for Lambda Functions and Lambda MicroVMs, and reduced vCPU and request rate quotas for Lambda Web Functions. AWS raises these quotas automatically based on your usage.

AWS Lambda is designed to scale rapidly to meet demand, allowing your functions to scale up to serve traffic in your application. Lambda is designed for short-lived compute tasks that do not retain or rely upon state between invocations. Code can run for up to 15 minutes in a single invocation (up to 90 minutes for Lambda Managed Instances functions invoked asynchronously or through any event source mapping except Amazon MQ and Amazon DocumentDB) and a single function can use up to 10,240 MB of memory.

It's important to understand the guardrails that are put in place to protect your account and the workloads of other customers. Service quotas exist in all AWS services and consist of hard limits, which you cannot change, and soft limits, which you can request increases for. By default, all new accounts are assigned a quota profile that allows exploration of AWS services.

To see the quotas that apply to your account, navigate to the [Service Quotas dashboard](https://console.aws.amazon.com/servicequotas/home). Here, you can view your service quotas, request a quota increase, and view current utilization. From here, you can drill down to a specific AWS service, such as Lambda:

![The Service Quotas console showing Lambda quotas with current utilization.](https://docs.aws.amazon.com/lambda/latest/dg/images/application-design-figure-1.png)


The following sections list default quotas and limits in Lambda by category.

**Topics**
+ [Compute and storage](#compute-and-storage)
+ [Function configuration, deployment, and execution](#function-configuration-deployment-and-execution)
+ [Lambda API requests](#api-requests)
+ [Durable functions](#durable-functions-quotas)
+ [Lambda MicroVMs](#microvms-quotas)
+ [Lambda Web Functions](#web-functions-quotas)
+ [Other services](#quotas-other-services)

## Compute and storage
<a name="compute-and-storage"></a>

Lambda sets quotas for the amount of compute and storage resources that you can use to run and store functions. Quotas for concurrent executions and storage apply per AWS Region. Elastic network interface (ENI) quotas apply per virtual private cloud (VPC), regardless of Region. The following quotas can be increased from their default values. For more information, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*.


| Resource | Default quota | Can be increased up to | 
| --- | --- | --- | 
| Concurrent executions | 1,000 | Tens of thousands | 
| Storage for uploaded functions (.zip file archives) and layers using Lambda-managed storage. Each function version and layer version consumes storage.<br />To avoid storage limits, you can configure your functions and layers to use [self-managed S3 code storage](configuration-self-managed-storage.md) instead.<br /> For best practices on managing your code storage, see [Monitoring Lambda code storage](https://serverlessland.com/content/service/lambda/guides/aws-lambda-operator-guide/code-storage) in Serverless Land. | 300 GB (unzipped) | Not increasable. Use [self-managed S3 code storage](configuration-self-managed-storage.md) for storage beyond this limit. | 
| Storage for functions defined as container images. These images are stored in Amazon ECR. | See [Amazon ECR service quotas](https://docs.aws.amazon.com/AmazonECR/latest/userguide/service-quotas.html). |   | 
| [Elastic network interfaces per virtual private cloud (VPC)](configuration-vpc.md) This quota is shared with other services, such as Amazon Elastic File System (Amazon EFS). See [Amazon VPC quotas](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html).  | 3,000 | Thousands | 

For details on concurrency and how Lambda scales your function concurrency in response to traffic, see [Understanding Lambda Event Function scaling](lambda-concurrency.md).

## Function configuration, deployment, and execution
<a name="function-configuration-deployment-and-execution"></a>

The following quotas apply to function configuration, deployment, and execution. Except as noted, they can't be changed.

**Note**  
The Lambda documentation, log messages, and console use the abbreviation MB (rather than MiB) to refer to 1,024 KB.


| Resource | Quota | 
| --- | --- | 
| Function [memory allocation](configuration-memory.md) | 128 MB to 10,240 MB, in 1-MB increments.<br />**Note:** Lambda allocates CPU power in proportion to the amount of memory configured. You can increase or decrease the memory and CPU power allocated to your function using the **Memory (MB)** setting. At 1,769 MB, a function has the equivalent of one vCPU. | 
| Function timeout | 900 seconds (15 minutes). For functions using AWS Lambda Managed Instances, asynchronous invocations and event source mapping invocations (except Amazon MQ and Amazon DocumentDB) support a maximum allowed value of 5,400 seconds (90 minutes). | 
| Function [environment variables](configuration-envvars.md) | 4 KB, for all environment variables associated with the function, in aggregate | 
| Function [resource-based policy](access-control-resource-based.md) | 20 KB | 
| Function [layers](chapter-layers.md) | 5 layers | 
| Function [concurrency scaling limit](scaling-behavior.md) | For each function, 1,000 execution environments every 10 seconds | 
| [Invocation payload](lambda-invocation.md) (request and response) | 6 MB each for request and response (synchronous)<br />200 MB for each [streamed response](configuration-response-streaming.md) (synchronous)<br />1 MB (asynchronous)<br />1 MB for the total combined size of request line and header values | 
| Bandwidth for [streamed responses](configuration-response-streaming.md) | Uncapped for the first 6 MB of your function's response<br />For responses larger than 6 MB, 2MBps for the remainder of the response | 
| Network bandwidth per execution environment | 625 Mbps. For functions not attached to a VPC, you can request an increase through the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home/services/lambda/quotas). After approval, network bandwidth scales proportionally with memory, starting at 2,048 MB of memory and reaching a maximum of up to 3,000 Mbps at 10,240 MB. | 
| [Deployment package (.zip file archive)](configuration-function-zip.md) size | 50 MB (zipped, when uploaded through the Lambda API or SDKs). Upload larger files with Amazon S3.<br />50 MB (when uploaded through the Lambda console)<br />250 MB The maximum size of the contents of a deployment package, including layers and custom runtimes. (unzipped)<br /> | 
| Container image settings size | 16 KB | 
| [Container image](images-create.md) code package size | 10 GB (maximum uncompressed image size, including all layers) | 
| Test events (console editor) | 10 | 
| `/tmp` directory storage | Between 512 MB and 10,240 MB, in 1-MB increments | 
| File descriptors | 1,024 Lambda Managed Instances use a higher file descriptor limit of 4,096. For more information, see [Understanding the Lambda Managed Instances execution environment](lambda-managed-instances-execution-environment.md).  | 
| Execution processes/threads | 1,024 Lambda Managed Instances use the default process and thread limits from [Bottlerocket](https://aws.amazon.com/bottlerocket/). For more information, see [Understanding the Lambda Managed Instances execution environment](lambda-managed-instances-execution-environment.md).  | 

## Lambda API requests
<a name="api-requests"></a>

The following quotas are associated with Lambda API requests.


| Resource | Quota | 
| --- | --- | 
| Invocation requests per function per Region (synchronous) | Each instance of your execution environment can serve up to 10 requests per second. In other words, the total invocation limit is 10 times your concurrency limit. See [Understanding Lambda Event Function scaling](lambda-concurrency.md). | 
| Invocation requests per function per Region (asynchronous) | Each instance of your execution environment can serve an unlimited number of requests. In other words, the total invocation limit is based only on concurrency available to your function. See [Understanding Lambda Event Function scaling](lambda-concurrency.md). | 
| Invocation requests per function version or alias (requests per second) | 10 x allocated [provisioned concurrency](configuration-concurrency.md) This quota applies only to functions that use provisioned concurrency.  | 
| [GetFunction](https://docs.aws.amazon.com/lambda/latest/api/API_GetFunction.html) API requests | 100 requests per second. Cannot be increased. | 
| [GetPolicy](https://docs.aws.amazon.com/lambda/latest/api/API_GetPolicy.html) API requests | 15 requests per second. Cannot be increased. | 
| Remainder of the control plane API requests (excludes invocation, GetFunction, and GetPolicy requests) | 15 requests per second across all APIs (not 15 requests per second per API). Cannot be increased. | 

## Durable functions
<a name="durable-functions-quotas"></a>

The following quotas apply to [durable functions](durable-functions.md). Quotas apply per AWS Region. Higher defaults apply in US East (N. Virginia), US West (Oregon), and Europe (Ireland), as noted in the table. Except as noted, these quotas can be increased. For more information, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*.


| Resource | Default quota | 
| --- | --- | 
| Maximum running durable executions | 5,000,000 per Region.<br />10,000,000 in US East (N. Virginia), US West (Oregon), and Europe (Ireland).<br />This is a soft limit that can be increased. | 
| Maximum number of durable operations per durable execution | 30,000<br />Cannot be increased. For more information, see [Available durable operations](durable-execution-sdk.md#durable-sdk-operations). | 
| Durable execution storage written in megabytes | 100 MB<br />Cannot be increased. Cumulative payload size persisted by durable functions per execution. For more information, see [persisted data per durable operation](durable-execution-sdk.md#durable-operations-checkpoint-consumption). | 
| Maximum payload size per durable operation | 1 MB<br />Cannot be increased. Applies to checkpoint and callback payloads. | 
| Function invocation rate to initiate durable executions | 3,000 requests per second.<br />6,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [CheckpointDurableExecution](https://docs.aws.amazon.com/lambda/latest/api/API_CheckpointDurableExecution.html) API requests | 10,000 requests per second.<br />20,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [GetDurableExecution](https://docs.aws.amazon.com/lambda/latest/api/API_GetDurableExecution.html) API requests | 30 requests per second. | 
| [GetDurableExecutionHistory](https://docs.aws.amazon.com/lambda/latest/api/API_GetDurableExecutionHistory.html) API requests | 15 requests per second. | 
| [GetDurableExecutionState](https://docs.aws.amazon.com/lambda/latest/api/API_GetDurableExecutionState.html) API requests | 10,000 requests per second.<br />20,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [ListDurableExecutionsByFunction](https://docs.aws.amazon.com/lambda/latest/api/API_ListDurableExecutionsByFunction.html) API requests | 15 requests per second. | 
| [SendDurableExecutionCallbackFailure](https://docs.aws.amazon.com/lambda/latest/api/API_SendDurableExecutionCallbackFailure.html) API requests | 3,000 requests per second.<br />6,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [SendDurableExecutionCallbackHeartbeat](https://docs.aws.amazon.com/lambda/latest/api/API_SendDurableExecutionCallbackHeartbeat.html) API requests | 3,000 requests per second.<br />6,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [SendDurableExecutionCallbackSuccess](https://docs.aws.amazon.com/lambda/latest/api/API_SendDurableExecutionCallbackSuccess.html) API requests | 3,000 requests per second.<br />6,000 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 
| [StopDurableExecution](https://docs.aws.amazon.com/lambda/latest/api/API_StopDurableExecution.html) API requests | 300 requests per second.<br />600 requests per second in US East (N. Virginia), US West (Oregon), and Europe (Ireland). | 

## Lambda MicroVMs
<a name="microvms-quotas"></a>

Lambda MicroVMs sets quotas for compute, storage, and API requests. Quotas marked as adjustable can be increased through the Service Quotas console.

**Note**  
Lambda MicroVMs support the ARM64 (AWS Graviton) architecture.

### Compute and storage
<a name="microvms-quotas-compute"></a>


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Memory allocated across all MicroVMs (per account, per Region) | 400 GB (that is, 200 MicroVMs at 2 GB configured memory each or 400 MicroVMs at 1 GB configured memory each).<br />1,024 GB in US East (N. Virginia), US West (Oregon), US East (Ohio), and Asia Pacific (Tokyo) (that is, 512 MicroVMs at 2 GB configured memory each or 1,024 MicroVMs at 1 GB configured memory each).<br />Burstable up to four times this quota. | Yes | 
| Maximum execution duration per MicroVM | 8 hours (28,800 seconds) | No | 

### Images and versions
<a name="microvms-quotas-images"></a>


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| MicroVM images per account per Region | 100 | Yes | 
| Versions per MicroVM image | 50 | Yes | 
| Concurrent image builds (per account, per Region) | 5<br />10 in US East (N. Virginia), US West (Oregon), US East (Ohio), and Asia Pacific (Tokyo) | Yes | 

### Per-MicroVM throughput
<a name="microvms-quotas-throughput"></a>


| Resource | Limit | Adjustable | 
| --- | --- | --- | 
| Concurrent connections per MicroVM | 8 (1 vCPU), 16 (2 vCPU), 32 (4 vCPU), 64 (8 vCPU), 128 (16 vCPU) | No | 
| Requests per second per MicroVM | 40 (4 vCPU / 8 GB), 160 (16 vCPU / 32 GB) | No | 

### API rate limits
<a name="microvms-quotas-api"></a>


| API operation | Rate (TPS) | Burst | Adjustable | 
| --- | --- | --- | --- | 
| RunMicrovm | 5 | 5 | Yes | 
| ResumeMicrovm | 5 | 5 | Yes | 
| SuspendMicrovm | 2 | 2 | Yes | 
| TerminateMicrovm | 10 | 10 | Yes | 
| GetMicrovm | 100 | 100 | Yes | 
| CreateMicrovmAuthToken | 50 | 50 | Yes | 
| CreateMicrovmShellAuthToken | 5 | 5 | Yes | 

**Note**  
TPS = transactions per second. These rate limits are per account, per Region. Retry throttled requests using exponential backoff with jitter.

## Lambda Web Functions
<a name="web-functions-quotas"></a>

With AWS Lambda Web Functions, you run web applications and API backends as serverless HTTP servers. Quotas are the maximum values for Web Functions resources and settings. Examples include the number of endpoints per Web Function, the memory of an execution environment, and the requests per second for your account. Knowing them before you deploy helps you design your application and size its endpoint scaling settings to fit. Most quotas have default values that work for typical workloads and can't be changed. You can request increases for the adjustable account quotas, which can vary by account.

Web Function quotas apply at the following scopes:
+ **Per Web Function** – Endpoints and revisions.
+ **Per endpoint** – Maximum environments, rate limit, and the number of revisions that share traffic.
+ **Per revision** – Deployment package size, environment variable size, and request timeout.
+ **Per execution environment** – vCPUs, memory, concurrent requests, `/tmp` directory size, file descriptors, processes and threads, and initialization timeout.
+ **Per request** – Request header size.
+ **Per account, in each AWS Region** – Requests per second and Arm64 vCPUs.

**Note**  
To see the account quota values that apply to your account in a Region, call `GetWebAccountSettings`. To monitor usage against these quotas, see [Regional usage and throttling metrics](web-functions-monitoring-metrics.md#web-functions-monitoring-metrics-usage).

### Web Function, revision, and execution environment quotas
<a name="web-functions-quotas-execution"></a>

The following table lists the quotas for each Web Function, revision, execution environment, and request.


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Endpoints per Web Function | 10 | No | 
| Revisions per Web Function | 50 (automatic cleanup target). The count can temporarily exceed 50. See [Revision limits and automatic cleanup](web-functions-revisions.md#web-functions-revisions-limits). | No | 
| Deployment package size | 512 MB (unzipped) | No | 
| Environment variable size | 32 KB | No | 
| Request header size | 128 KiB | No | 
| /tmp directory size | 512 MB | No | 
| vCPUs per execution environment | 2 | No | 
| Memory per execution environment | 2 GB | No | 
| Concurrent requests per environment (maxConcurrencyPerEnvironment) | 64 (range 1–128). See [Dynamic per-environment concurrency limit](web-functions-scaling.md#web-functions-scaling-dynamic-concurrency). | No | 
| Request timeout | 30 seconds (range 3–900) | No | 
| Initialization timeout (time for your server to start listening) | 10 seconds | No | 
| File descriptors per execution environment | 1,024 | No | 
| Processes and threads per execution environment | 1,024 | No | 

### Endpoint quotas
<a name="web-functions-quotas-endpoint"></a>

The following table lists the endpoint quotas.


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Maximum environments per endpoint (scalingConfig.maxEnvironments) | Optional. Not set by default. Valid values 2–10,000. Enforced in each Region. The account vCPU quota can limit the endpoint to fewer execution environments. | No | 
| Rate limit per endpoint (throttleConfig.rateLimit) | Optional. Not set by default. Valid values are 0, 100–1,000 in steps of 100, and 2,000–10,000 in steps of 1,000 requests per second. Lambda enforces this limit separately in each Region. A value of 0 blocks all traffic. When not set, the per-endpoint quota of 10,000 requests per second applies. | No | 
| Maximum revisions per endpoint (revision weights) | 2 | No | 
| Revision weight range | 1–100 | No | 

### Account quotas
<a name="web-functions-quotas-account"></a>

The following table lists the account quotas, which apply in each AWS Region.


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Requests per second per account | 100,000 | Yes | 
| Arm64 vCPUs for execution environments, per account, per Region | 2,000. Each execution environment uses 2 vCPUs. | Yes | 

### Networking constraints
<a name="web-functions-quotas-networking"></a>

The following constraints apply to Web Function networking.


| Item | Constraint | 
| --- | --- | 
| Egress network connectors per revision | 0 or 1 | 
| Connector reference | Version-qualified ARN | 
| Connector account and Region | Same as the Web Function | 
| Connector compute resource type | Exactly one; use WebFunction | 
| Changing a revision's connector | Create a new revision | 
| Revisions routed by one endpoint | 1 or 2 | 
| Endpoint types that support egress network connectors | HomeRegion only | 
| Automatic deployment | LatestRevision or Disabled for HomeRegion; Disabled only for MultiRegion and PerRegion | 
| Endpoint type and Region set | Fixed at endpoint creation | 
| Direct public egress | IPv4 only | 
| Private endpoint access with AWS PrivateLink | Not available | 

## Other services
<a name="quotas-other-services"></a>

Quotas for other services, such as AWS Identity and Access Management (IAM), Amazon CloudFront (Lambda@Edge), and Amazon Virtual Private Cloud (Amazon VPC), can impact your Lambda functions. For more information, see [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html) in the *Amazon Web Services General Reference*, and [Invoking Lambda with events from other AWS services](lambda-services.md).

Many applications involving Lambda use multiple AWS services. Because different services have different quotas for various features, it can be challenging to manage these quotas across your entire application. For example, API Gateway has a default throttle limit of 10,000 requests per second, whereas Lambda has a default concurrency limit of 1,000. Because of this mismatch, it's possible to have more incoming requests from API Gateway that Lambda can handle. You can resolve this by requesting a Lambda concurrency limit increase to match the expected level of traffic.

Load testing your application helps you monitor the performance of your application end-to-end before deploying to production. During a load test, you can identify any quotas that may act as a limiting factor for the traffic levels you expect and take action accordingly.
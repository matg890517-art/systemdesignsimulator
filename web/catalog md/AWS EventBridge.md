

# Amazon EventBridge quotas
<a name="eb-quota"></a>

The following quotas apply to the Custom Event Bus, to Custom Event Bus - Classic, to the API destinations and connections that both buses deliver to, to the schema registry, and to EventBridge Pipes.

**Note**  
If you use Custom Event Bus - Classic, the event bus that routes with rules and targets, see [Custom Event Bus - Classic quotas](#eb-limits).

**Topics**
+ [Custom Event Bus quotas](#eb-custom-bus-quotas)
+ [Custom Event Bus - Classic quotas](#eb-limits)
+ [API destinations and connections](#eb-quota-shared)
+ [EventBridge Schema Registry quotas](#schema-quotas)
+ [EventBridge Pipes quotas](#eb-pipes-limits)

**Note**  
For a list of the quotas for EventBridge Scheduler, see [Quotas for EventBridge Scheduler](https://docs.aws.amazon.com/scheduler/latest/UserGuide/scheduler-quotas.html) in the *EventBridge Scheduler User Guide.*

## Custom Event Bus quotas
<a name="eb-custom-bus-quotas"></a>

The Service Quotas console lists 6 quotas for the Custom Event Bus under Amazon EventBridge, each with an `[EventsV2]` prefix; 4 of them are adjustable. To raise the bus limit, for example, request an increase to `[EventsV2] Event Buses`. The other limits in this section are fixed values that the API enforces and are not adjustable. These quotas are separate from the Custom Event Bus - Classic quotas in [Custom Event Bus - Classic quotas](#eb-limits).

### Service Quotas
<a name="eb-custom-bus-quotas-service"></a>

The following table lists the quotas in the Service Quotas console, per account per Region.


| Quota | Default | Adjustable | 
| --- | --- | --- | 
| Event buses owned by the account. Buses shared with the account do not count | 5 | Yes | 
| Event sources owned by the account | 200 | Yes | 
| Subscribers per bus the account owns, counting every account the bus is shared with | 10,000 | Yes | 
| Size, in bytes, of the default resource policy of a bus the account owns. The AWS\_RAM policy that AWS RAM writes for a shared bus does not count | 20,480 | Yes | 
| Events per second per bus, counting every event source and every account the bus is shared with | 500,000 | No | 
| Ingestion per event group per second, counted as the number of events plus their total size in KB in any one-second window | 1,500 | No | 

Your account's bus count is also published as the `ResourceCount` metric in the `AWS/Usage` namespace, so you can alarm before you reach the limit; see [Observability for the Custom Event Bus: metrics, logs, and CloudTrail](eb-custom-bus-observability.md). Publishing and subscriber management are throttled separately for each account: `PutEvents` and `PutRawEvents` draw from one budget, and `CreateSubscriber` and `DeleteSubscriber` from another. Handle `ThrottlingException` with backoff and retry.

If the `default` policy in a `PutResourcePolicy` call exceeds the resource policy size quota, the call fails with `PolicyLengthExceededException`. See [Write a custom resource policy](eb-custom-bus-sharing.md#eb-custom-bus-access-policy).

### Fixed limits
<a name="eb-custom-bus-quotas-fixed"></a>

The following values are set by the API and cannot be raised. Where a setting takes a range, you choose any value in the range; the maximum is the fixed part.


| Setting | You choose | Fixed maximum or value | 
| --- | --- | --- | 
| StorageConfiguration.RetentionPeriodInDays | 1 to 365 days | 365 days | 
| RetryPolicy.MaxRetryAttempts | 0 to 185, default 5 | 185 | 
| RetryPolicy.MaxEventAgeInSeconds | 60 to 86,400, default 300 | 86,400 seconds | 
| BatchConfiguration.MaxBatchSize | 1 to 500 | 500 | 
| BatchConfiguration.MaxBatchWindowInSeconds | 0 to 300, default 0 | 300 seconds | 
| InvocationTimeoutSeconds on Lambda, Step Functions, and HTTP targets | 1 to 30, default 30 | 30 seconds | 
| Entries per PutEvents or PutRawEvents request | 1 to 100 | 100 | 
| Deduplication window | Not configurable | 300 seconds | 
| JSONata expression in a Transformer or a target parameter | Not configurable | 8,192 characters | 
| JSONata expression in a universal target's Input | Not configurable | 262,144 characters | 
| Filters in one FilterConfiguration | Up to 3, one per scope | 4,096 bytes across all filters; 1,000 $or combinations | 
| Filter changes per subscriber | Not configurable | 24 in any rolling 24 hours; see [Updating, pausing, and resuming a subscriber](eb-custom-bus-update.md) | 
| Subscriber creates or deletes in progress on one bus | Not configurable | 1 across all accounts; a second call fails with ConcurrentModificationException | 
| Subscribers replaying from a past position at the same time | Not configurable | Limited per bus; CreateSubscriber fails with LimitExceededException when reached | 
| errorMessage in a dead-letter record | Not configurable | 1,024 characters | 

## Custom Event Bus - Classic quotas
<a name="eb-limits"></a>

Custom Event Bus - Classic has the following quotas. The Service Quotas table also lists the API destination, connection, and global endpoint quotas, which are account-level resources.

The Service Quotas console provides information about EventBridge quotas. Along with viewing the default quotas, you can use the Service Quotas console to [request quota increases](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/events/quotas) for adjustable quotas.


| Name | Default | Adjustable | Description | 
| --- | --- | --- | --- | 
| Api destinations | Each supported Region: 3,000 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-FB1C3A6D)  | The maximum number of API destinations per account per Region. | 
| Connections | Each supported Region: 3,000 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-595D6D42)  | The maximum number of connections per account per Region. | 
| CreateEndpoint throttle limit in transactions per second | Each supported Region: 5 per second | No | The maximum number of requests per second for CreateEndpoint API. Additional requests are throttled. | 
| DeleteEndpoint throttle limit in transactions per second | Each supported Region: 5 per second | No | The maximum number of requests per second for DeleteEndpoint API. Additional requests are throttled. | 
| Endpoints | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-EAC9A2AC)  | The maximum number of endpoints per account per Region. | 
| Event bus policy size | Each supported Region: 10,240 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-FC354966)  | Maximum policy size, in characters. This policy size increases each time you grant access to another account. You can see your current policy and its size by using the DescribeEventBus API. | 
| Event buses | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-658A4FD9)  | Maximum event buses per account. | 
| Event pattern size | Each supported Region: 2,048 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-664C5505)  | Maximum size of an event pattern, in characters. | 
| Invocations throttle limit in transactions per second | us-east-1: 18,750 per second<br />us-east-2: 4,500 per second<br />us-west-1: 2,250 per second<br />us-west-2: 18,750 per second<br />ap-east-1: 1,100 per second<br />ap-northeast-1: 2,250 per second<br />ap-northeast-2: 1,100 per second<br />ap-south-1: 1,100 per second<br />ap-southeast-1: 2,250 per second<br />ap-southeast-2: 2,250 per second<br />ca-central-1: 1,100 per second<br />eu-central-1: 4,500 per second<br />eu-north-1: 1,100 per second<br />eu-south-2: 4,500 per second<br />eu-west-1: 18,750 per second<br />eu-west-2: 2,250 per second<br />eu-west-3: 1,100 per second<br />sa-east-1: 1,100 per second<br />Each of the other supported Regions: 750 per second |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-5540C5E3)  | An invocation is an event matching a rule and being sent on to the rules targets. After the limit is reached, the invocations are throttled; that is, they still happen but they are delayed. | 
| Number of rules | af-south-1: 100<br />eu-south-1: 100<br />Each of the other supported Regions: 300 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-244521F2)  | Maximum number of rules an account can have per event bus | 
| PutEvents throttle limit in transactions per second | us-east-1: 10,000 per second<br />us-east-2: 2,400 per second<br />us-west-1: 1,200 per second<br />us-west-2: 10,000 per second<br />ap-east-1: 600 per second<br />ap-northeast-1: 1,200 per second<br />ap-northeast-2: 600 per second<br />ap-south-1: 600 per second<br />ap-southeast-1: 1,200 per second<br />ap-southeast-2: 1,200 per second<br />ca-central-1: 600 per second<br />eu-central-1: 2,400 per second<br />eu-north-1: 600 per second<br />eu-south-2: 2,400 per second<br />eu-west-1: 10,000 per second<br />eu-west-2: 1,200 per second<br />eu-west-3: 600 per second<br />sa-east-1: 600 per second<br />Each of the other supported Regions: 400 per second |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-9B653E91)  | Maximum number of requests per second for PutEvents API. Additional requests are throttled. | 
| Rate of invocations per API destination | Each supported Region: 300 per second |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-755FD01C)  | The maximum number of invocations per second to send to each API destination endpoint per account per Region. Once the quota is met, future invocations to that API endpoint are throttled. The invocations will still occur, but are delayed. | 
| Targets per rule | Each supported Region: 5 | No | Maximum number of targets that can be associated with a rule | 
| Throttle limit in transactions per second for control plane APIs | Each supported Region: 50 per second | No | Maximum number of requests per second for EventBridge control plane API operations. Additional requests are throttled. | 
| UpdateEndpoint throttle limit in transactions per second | Each supported Region: 5 per second | No | The maximum number of requests per second for UpdateEndpoint API. Additional requests are throttled. | 
| [EventsV2] Combined ingestion throughput and count per Event Group per second | Each supported Region: 1,500 per second | No | The maximum event throughput per Event Group per Second. Counted as the sum of (number of events) \+ (total size of those events in KB) delivered to a given event group within any one-second window. | 
| [EventsV2] Event Buses | Each supported Region: 5 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-DF788473)  | The maximum number of V2 Event Buses owned by this account per Region. Does not include buses shared with this account. | 
| [EventsV2] Event Sources | Each supported Region: 200 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-D082A4F6)  | The maximum number of Event Sources owned by this account per Region. | 
| [EventsV2] Events per second per custom event bus | Each supported Region: 500,000 per second | No | The maximum number of events per second ingested per custom event bus, counted across all event sources and all accounts the bus is shared with. | 
| [EventsV2] Resource policy size per event bus | Each supported Region: 20,480 Bytes |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-5D1D13E3)  | The maximum size, in bytes, of the customer-managed (default) resource policy of a V2 event bus. Policies that AWS Resource Access Manager writes for a shared bus do not count against this quota. | 
| [EventsV2] Subscribers per V2 Event Bus | Each supported Region: 10,000 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/events/quotas/L-39263BDC)  | The maximum number of Subscribers that can be associated with each V2 Event Bus owned by this account, across all accounts it is shared with. | 

In addition, EventBridge has the following quotas that are not managed through the Service Quotas console.


| Name | Default | Description | 
| --- | --- | --- | 
| Rules containing wildcards | Each supported Region: 30 rules per event bus | Maximum number of rules, per event bus per account, that can contain event filters that include wildcards. This quota cannot be adjusted.<br />For more information on using wildcards in event patterns, see [Matching using wildcards](eb-create-pattern-operators.md#eb-filtering-wildcard-matching). | 
| Schema discovery levels | Each supported Region: 255 levels | Maximum number of levels schema discovery will infer events that are nested. Any events past 255 levels are ignored. | 
| Connections (Private) | Each supported Region: 20 | The maximum number of private connections per account per Region. | 

## API destinations and connections
<a name="eb-quota-shared"></a>

API destinations and connections belong to your account, not to a bus, and both buses use them: a Custom Event Bus - Classic rule targets an API destination, and a Custom Event Bus subscriber delivers to one through `HttpParameters`. A Custom Event Bus producer that publishes Avro or Protobuf with a Confluent schema registry also names a connection. One set of quotas covers all of that use. In the Service Quotas table in [Custom Event Bus - Classic quotas](#eb-limits), the rows *Api destinations*, *Connections*, and *Rate of invocations per API destination* are the account-wide values; the invocation rate is shared by every rule and subscriber that targets the same API destination. The fixed table in the same section lists the private connection limit.

## EventBridge Schema Registry quotas
<a name="schema-quotas"></a>

EventBridge Schema Registry has the following quotas.

The Service Quotas console provides information about EventBridge quotas. Along with viewing the default quotas, you can use the Service Quotas console to [request quota increases](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/events/quotas) for adjustable quotas.


| Name | Default | Adjustable | Description | 
| --- | --- | --- | --- | 
| DiscoveredSchemas | Each supported Region: 200 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/schemas/quotas/L-1738102F)  | The maximum number of schemas for a discovered schema registry that you can create in the current region | 
| Discoverers | Each supported Region: 10 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/schemas/quotas/L-037FC7C4)  | The maximum number of discoverers that you can create in the current region. | 
| Registries | Each supported Region: 10 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/schemas/quotas/L-85663EFB)  | The maximum number of registries that you can create in the current region. | 
| SchemaVersions | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/schemas/quotas/L-3C443A2A)  | The maximum number of versions per schema that you can create in the current region. | 
| Schemas | Each supported Region: 100 |  [Yes](https://console.aws.amazon.com/servicequotas/home/services/schemas/quotas/L-EE9E5FA9)  | The maximum number of schemas per registry that you can create in the current region. (Except Discovered Schema Registry) | 

## EventBridge Pipes quotas
<a name="eb-pipes-limits"></a>

EventBridge Pipes has the following quotas. If you have requirements for higher maximum limits, [contact support](https://console.aws.amazon.com/support/home?#/case/create?issueType=technical).


| Resource | Regions | Default limit | 
| --- | --- | --- | 
| Concurrent pipe executions per account |  +  AWS GovCloud (US-West) <br />+  AWS GovCloud (US-East) <br />+  China (Ningxia) <br />+  China (Beijing) <br />+  Asia Pacific (Osaka) <br />+  Africa (Cape Town) <br />+  Europe (Milan) <br />+  US East (Ohio) <br />+  Europe (Frankfurt) <br />+  US West (N. California) <br />+  Europe (London) <br />+  Asia Pacific (Sydney) <br />+  Asia Pacific (Tokyo) <br />+  Asia Pacific (Singapore) <br />+  Canada (Central) <br />+  Europe (Paris) <br />+  Europe (Stockholm) <br />+  South America (São Paulo) <br />+  Asia Pacific (Seoul) <br />+  Asia Pacific (Mumbai) <br />+  Asia Pacific (Hong Kong) <br />+  Middle East (Bahrain) <br />+  China (Ningxia) <br />+  China (Beijing) <br />+  Asia Pacific (Osaka) <br />+  Africa (Cape Town) <br />+  Europe (Milan)   | 1000 | 
| Concurrent pipe executions per account |  +  US East (N. Virginia) <br />+  US West (Oregon) <br />+  Europe (Ireland)   | 3000 | 
| Pipes per account | All | 1000 | 


# IVS Service Quotas \| Low-Latency Streaming
<a name="service-quotas"></a>

The following are service quotas and limits for Amazon Interactive Video Service (IVS) endpoints, resources, and other operations. Service quotas (also known as limits) are the maximum number of service resources or operations for your AWS account. That is, these limits are per AWS account, unless noted otherwise in the table. Also see [AWS Service Quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html).

You use an endpoint to connect programmatically to an AWS service. Also see [AWS Service Endpoints](https://docs.aws.amazon.com/general/latest/gr/rande.html).

All quotas are enforced per region.

**Important:** All accounts have limits on the number of concurrent views and concurrent streams. (A *view* is a unique viewing session which is actively downloading or playing video. For a more detailed definition, see the [IVS Glossary](ivs-glossary.md).) *Ensure that your limits are adequate and request an increase if needed, especially if you are planning a large streaming event*. 

## Service Quota Increases
<a name="quotas-increase"></a>

For quotas that are adjustable, you can request a rate increase through the [AWS console](https://console.aws.amazon.com/servicequotas/). Use the console to view information about service quotas too.

API call rate quotas are not adjustable.

## API Call Rate Quotas
<a name="quotas-call-rate"></a>


| Operation Type | Operation | Default | 
| --- | --- | --- | 
| Ad configuration | `CreateAdConfiguration` | 3 TPS | 
| Ad configuration | `DeleteAdConfiguration` | 3 TPS | 
| Ad configuration | `GetAdConfiguration` | 3 TPS | 
| Ad configuration | `InsertAdBreak` | 1 TPS | 
| Ad configuration | `ListAdConfigurations` | 3 TPS | 
| Channel | `BatchGetChannel` | 5 TPS | 
| Channel | `CreateChannel` | 5 TPS | 
| Channel | `DeleteChannel` | 5 TPS | 
| Channel | `GetChannel` | 5 TPS | 
| Channel | `ListChannels` | 5 TPS | 
| Channel | `UpdateChannel` | 5 TPS | 
| Failover slate | `CreateFailoverSlateConfiguration` | 5 TPS | 
| Failover slate | `DeleteFailoverSlateConfiguration` | 5 TPS | 
| Failover slate | `GetFailoverSlateConfiguration` | 5 TPS | 
| Failover slate | `ListFailoverSlateConfigurations` | 5 TPS | 
| Failover slate | `UpdateFailoverSlateConfiguration` | 5 TPS | 
| Playback restriction policy | `CreatePlaybackRestrictionPolicy` | 5 TPS | 
| Playback restriction policy | `DeletePlaybackRestrictionPolicy` | 5 TPS | 
| Playback restriction policy | `GetPlaybackRestrictionPolicy` | 5 TPS | 
| Playback restriction policy | `ListPlaybackRestrictionPolicies` | 5 TPS | 
| Playback restriction policy | `UpdatePlaybackRestrictionPolicy` | 5 TPS | 
| Private channel | `DeletePlaybackKeyPair` | 3 TPS | 
| Private channel | `GetPlaybackKeyPair` | 3 TPS | 
| Private channel | `ImportPlaybackKeyPair` | 3 TPS | 
| Private channel | `ListPlaybackKeyPairs` | 3 TPS | 
| Private channel | `BatchStartViewerSessionRevocation` | 2 TPS | 
| Private channel | `StartViewerSessionRevocation` | 10 TPS | 
| Recording configuration | `CreateRecordingConfiguration` | 3 TPS | 
| Recording configuration | `DeleteRecordingConfiguration` | 3 TPS | 
| Recording configuration | `GetRecordingConfiguration` | 3 TPS | 
| Recording configuration | `ListRecordingConfigurations` | 3 TPS | 
| Stream | `GetStream` | 5 TPS | 
| Stream | `GetStreamSession` | 5 TPS | 
| Stream | `ListStreams` | 5 TPS | 
| Stream | `ListStreamSessions` | 5 TPS | 
| Stream | `PutMetadata` | 5 TPS per channel<br />155 TPS per account | 
| Stream | `StopStream` | 5 TPS | 
| Stream key | `BatchGetStreamKey` | 5 TPS | 
| Stream key | `CreateStreamKey` | 5 TPS | 
| Stream key | `DeleteStreamKey` | 5 TPS | 
| Stream key | `GetStreamKey` | 5 TPS | 
| Stream key | `ListStreamKeys` | 5 TPS | 
| Tags | `ListTagsForResource` | 10 TPS | 
| Tags | `TagResource` | 10 TPS | 
| Tags | `UntagResource` | 10 TPS | 

## Other Quotas
<a name="quotas-other"></a>


| Resource or Feature | Default | Adjustable | Description | 
| --- | --- | --- | --- | 
| Ad configurations | 20 | No | Maximum number of ad configurations, per AWS Region. | 
| Channels | 5,000 | Yes | Maximum number of channels, per AWS Region. | 
| Concurrent streams | 100 | Yes | Maximum number of channels that can be streamed simultaneously, per AWS Region. If you exceed this threshold, the stream is rejected. | 
| Concurrent views | 15,000 | Yes | Maximum number of views allowed to play back a live channel, across all channels in an AWS Region. (A view is a unique viewing session which is actively downloading or playing video. See the Important note at the beginning of this page.) | 
| Failover slate configurations | 20 | Yes | Maximum number of failover slate configurations per account, per AWS Region. | 
| Ingest bitrate (if channel `type` is `BASIC)` | 1.5 Mbps or 3.5 Mbps | No | Maximum bits per second that can be streamed to a channel whose `type` is `BASIC`. +  If input video quality is 480p or less, the default quota is 1.5 Mbps. <br />+  If input video quality is more than 480p but less than 1080p, the default quota is 3.5 Mbps. <br />Warning: If you exceed this threshold, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest bitrate (if channel `type` is `STANDARD`, with single-track input) | 8.5 Mbps | No | Maximum bits per second that can be streamed to a channel whose `type` is `STANDARD` (the default), with single-track input. Warning: If you exceed this threshold, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest bitrate (if channel `type` is `STANDARD`, with multitrack input up to `FULL_HD` resolution) | 15 Mbps | No | Maximum bits per second that can be streamed to a channel whose `type` is `STANDARD` (the default), whose `multitrackInputConfiguration.maximumResolution` is `SD`, `HD`, or `FULL_HD`, with multitrack input. Warning: If you exceed this threshold, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest bitrate (if channel `type` is `ADVANCED_HD`) | 8.5 Mbps | No | Maximum bits per second that can be streamed to a channel whose type is `ADVANCED_HD`. Warning: If you exceed this threshold, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest bitrate (if channel `type` is `ADVANCED_SD`) | 8.5 Mbps | No | Maximum bits per second that can be streamed to a channel whose type is `ADVANCED_SD`. Warning: If you exceed this threshold, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest resolution (single-track input) | 1080p (2.1M total pixels, 1920 pixels/edge) | No | Maximum resolution in pixels that can be streamed to a channel (regardless of its `type`) with single-track input. There are two relevant thresholds: total pixels and pixels per edge. Warning: If you exceed either of these thresholds, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Ingest resolution (if channel `type` is `STANDARD`, with multitrack input) | see Description | No | Maximum resolution in pixels that can be streamed to an individual track on a channel whose `type` is `STANDARD`, with multitrack input. The default varies depending on the value of `multitrackInputConfiguration.maximumResolution`:+  `SD`: 480p (0.4M total pixels, 864 pixels/edge) <br />+  `HD`: 720p (0.9M total pixels, 1280 pixels/edge) <br />+  `FULL_HD`: 1080p (2.1M total pixels, 1920 pixels/edge)> <br />There are two relevant thresholds: total pixels and pixels per edge. Warning: If you exceed either of these thresholds, the stream probably will disconnect immediately. For details on channel `type`, see [Channel Types](https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html) in the *IVS Low-Latency Streaming API Reference*. | 
| Metadata payload | 1 KB | No | Maximum size of a `PutMetadata` request payload (Amazon IVS API). | 
| Playback authorization key pairs | 3 | No | Maximum number of playback authorization key pairs, per AWS Region. | 
| Playback restriction policies | 3 | No | Maximum number of playback restriction policies, per AWS Region. | 
| Playback restriction policy countries | 200 | No | Maximum size of the `allowedCountries` list in a playback restriction policy; that is, the maximum number of countries per policy. | 
| Playback restriction policy origins | 5 | No | Maximum size of the `allowedOrigins` list in a playback restriction policy; that is, the maximum number of origins per policy. | 
| Playback restriction policy origin length | 256 | No | Maximum size (in characters) of an entry in the `allowedOrigins` list in a playback restriction policy. | 
| Playback token size | 2 KB | No | Maximum size of the entire JSON web token (JWT) used to initiate playback. | 
| Recording configurations | 20 | Yes | Maximum number of recording configurations, per AWS Region. | 
| Stream key | 1 | No | Maximum number of stream keys, per channel. | 
| Stream takeovers | 100 | Yes | Maximum number of stream takeovers, per stream. | 

## Service Quotas Integration with CloudWatch Usage Metrics
<a name="quotas-cloudwatch-integration"></a>

You can use CloudWatch to proactively manage your service quotas, via CloudWatch *usage metrics*. You can use these metrics to visualize your current service usage on CloudWatch graphs and dashboards. Amazon IVS usage metrics correspond to Amazon IVS service quotas.

You can use a CloudWatch metric math function to display the service quotas for those resources on your graphs. You can also configure alarms that alert you when your usage approaches a service quota. 

To access usage metrics:

1. Open the Service Quotas console at [https://console.aws.amazon.com/servicequotas/](https://console.aws.amazon.com/servicequotas/)

1. In the navigation pane, select **AWS services**.

1. From the AWS services list, search for and select **Amazon Interactive Video Service**.

1. In the **Service quotas** list, select the service quota of interest. A new page opens with information about the service quota/metric.

Alternately, you can get to these metrics through the CloudWatch console. Under **AWS Namespaces**, choose **Usage**. Then, from the **Service** list, choose **IVS**. (See [Monitoring Amazon IVS Low-Latency Streaming](stream-health.md).)

In the **AWS/Usage** namespace, Amazon IVS provides the following metric:


| Metric Name | Description | 
| --- | --- | 
| `ResourceCount` | A count of the specified resources running in your account. The resources are defined by the dimensions associated with the metric.<br />Valid statistic: Maximum (the maximum number of resources used during the 1-minute period). | 

The following dimensions are used to refine the usage metric:


| Dimension | Description | 
| --- | --- | 
| Service | The name of the AWS service containing the resource. Valid value: `IVS`. | 
| Class | The class of resource being tracked. Valid value: `None`. | 
| Type | The type of resource being tracked. Valid value: `Resource`. | 
| Resource | The name of the AWS resource. Valid values: `ConcurrentStreams`, `ConcurrentViews`.<br /> The ConcurrentStreams and ConcurrentViews usage metrics are copies of the ones in the **AWS/IVS** namespace (with the None dimension), as described in [Monitoring Amazon IVS Low-Latency Streaming](stream-health.md). | 

### Creating a CloudWatch Alarm for Usage Metrics
<a name="quotas-cloudwatch-alarm"></a>

To create a CloudWatch alarm based on an Amazon IVS usage metric: 

1. From the Service Quotas console, select the service quota of interest, as described above. Currently, alarms can be created only for ConcurrentStreams and ConcurrentViews.

1. In the **Amazon CloudWatch alarms** section, choose **Create**.

1. From the **Alarm threshold** dropdown list, choose the percentage of your applied quota value that you want to set as the alarm value.

1. For **Alarm name**, enter a name for the alarm.

1. Select **Create**.
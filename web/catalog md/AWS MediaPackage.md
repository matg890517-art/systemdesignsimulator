

# Quotas in AWS Elemental MediaPackage
<a name="quotas"></a>

This section describes the quotas for AWS Elemental MediaPackage. For information about requesting an increase to soft quotas, see [AWS service quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html). You can't request an increase to hard quotas.

**Topics**
+ [Soft quotas](#live-soft-quotas)
+ [Hard quotas](#live-hard-quotas)

## Soft quotas
<a name="live-soft-quotas"></a>

The following table describes quotas in AWS Elemental MediaPackage that can be increased. For information about changing quotas, see [AWS Service Quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html). 

For some customers, your account quota might be below these published quotas. If you believe that you encountered a Resource limit exceeded error wrongfully, use the Service Quotas console to [request quota increases](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/mediapackagev2/quotas).


| Resource or operation | Default quota | 
| --- | --- | 
| Maximum active harvest jobs | 10 per channel group | 
| Maximum channel groups | 3 per account | 
| Maximum channels | 10 per channel group | 
| Maximum endpoints per channel | 10 per channel<br />Each origin endpoint represents the output package that you use. If one channel serves TS or TS encrypted, CMAF or CMAF encrypted content, then that channel has 4 endpoints and falls within the 10 endpoints quota. If you have 10 channels set up this same way, then you still haven't exceeded the quota because each channel uses only 4 endpoints. | 
| Maximum live manifest length | 15 minutes | 
| Maximum manifests per origin endpoint | 25 manifests per origin endpoint | 

## Hard quotas
<a name="live-hard-quotas"></a>

The following table describes quotas in AWS Elemental MediaPackage that can't be increased.


| Resource or operation | Quota | 
| --- | --- | 
| Maximum content age for time-shifted viewing | 336 hours (14 days) | 
| Maximum request rates per channel input | 200 requests per second  | 
| Maximum request rates per endpoint |  +  Media segments output: 500 requests per second <br />+  Manifests output: 10,000 requests per second  The per endpoint origination request rate quotas are indicative only and based on typical traffic patterns when using a properly configured CDN. The request rate quotas are applicable for live events, linear channels, and time-shifted viewing. The request rate quotas may be lower under certain conditions like misconfigured CDNs or players generating abnormal levels of origin requests with unique HTTP header values, or unique query string values appended to the playback URLs.  | 
| Maximum REST API requests |  +  Steady state: 20 requests per second <br />+  Bursting: 50 requests per second  This limit applies per AWS account. Requests that AWS services make on your behalf, such as AWS CloudFormation or AWS Config, count toward the same per-account rate.  | 
| Maximum time-shifted manifest length | 24 hours for all supported output formats | 
| Maximum tracks per ingest stream | 10<br />The maximum number of tracks (audio, video, subtitle, etc.) per stream that you can ingest. | 
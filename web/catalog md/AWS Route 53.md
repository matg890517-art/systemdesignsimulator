

# Quotas
<a name="DNSLimitations"></a>

Amazon Route 53 API requests and entities are subject to the following quotas (formerly called "limits").

**Topics**
+ [Using Service Quotas to view and manage quotas](#limits-service-quotas)
+ [Quotas on entities](#limits-api-entities)
+ [Maximums on API requests](#limits-api-requests)

## Using Service Quotas to view and manage quotas
<a name="limits-service-quotas"></a>

You can use the Service Quotas service to view quotas and to request quota increases for many AWS services. For more information, see the [Service Quotas User Guide](https://docs.aws.amazon.com/servicequotas/latest/userguide/). (You can use Service Quotas to view and manage domains, Route 53, and Route 53 VPC Resolver quotas.) 

**Note**  
To view quotas and request higher quotas for Route 53, you must change the Region to US East (N. Virginia). To view quotas and request higher quotas for VPC Resolver, change to the applicable Region.

## Quotas on entities
<a name="limits-api-entities"></a>

Amazon Route 53 entities are subject to the following quotas.

For information on getting current quotas (formerly called "limits"), see the following Route 53 actions:
+ [GetAccountLimit](https://docs.aws.amazon.com/Route53/latest/APIReference/API_GetAccountLimit.html) – Gets quotas on health checks, hosted zones, reusable delegation sets, traffic flow policies, and traffic flow policy records
+ [GetHostedZoneLimit](https://docs.aws.amazon.com/Route53/latest/APIReference/API_GetHostedZoneLimit.html) – Gets quotas on records in a hosted zone and on Amazon VPCs that you can associate with a private hosted zone
+ [GetReusableDelegationSetLimit](https://docs.aws.amazon.com/Route53/latest/APIReference/API_GetReusableDelegationSetLimit.html) – Gets the quota on the number of hosted zones that you can associate with a reusable delegation set

**Topics**
+ [Quotas on domains](#limits-api-entities-domains)
+ [Quotas on hosted zones](#limits-api-entities-hosted-zones)
+ [Quotas on records](#limits-api-entities-records)
+ [Quotas on Route 53 VPC Resolver](#limits-api-entities-resolver)
+ [Quotas on health checks](#limits-api-entities-health-checks)
+ [Quotas on query log configurations](#limits-api-entities-query-log-configs)
+ [Quotas on traffic flow policies and policy records](#limits-api-entities-traffic-flow)
+ [Quotas on reusable delegation sets](#limits-api-entities-reusable-delegation-sets)
+ [Quotas on Route 53 Profiles](#limits-api-entities-route53-profiles)

### Quotas on domains
<a name="limits-api-entities-domains"></a>


**Domain quotas**  

| Entity | Quota | 
| --- | --- | 
| Domains | 20\* per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 

**\***The limit is 20 for new customers as of March 2021.

If you have an existing account and your default limit is 50 now, it will remain at 50.

### Quotas on hosted zones
<a name="limits-api-entities-hosted-zones"></a>


**Hosted zone quotas**  

| Entity | Quota | 
| --- | --- | 
| Hosted zones | Initial quota of 500 per AWS account, but you can request a higher quota as needed.<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Hosted zones that can use the same reusable delegation set  | 100<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Amazon VPCs that you can associate with a private hosted zone per hosted zone | 300<br />If you want more than 300 associations, we recommend you use Route 53 Profiles. For more information, see [What are Amazon Route 53 Profiles?](profiles.md). | 
| Private hosted zones that you can associate a VPC with | No quota **\*** | 
| Authorizations that you can create so you can associate VPCs that were created by one account with a hosted zone that was created by another account | 1000 | 
| The number of key signing keys (KSK) that you can create per hosted zone | 2 | 

**\*** You can associate a VPC with any or all of the private hosted zones that you control through your AWS accounts. For example, suppose you have three AWS accounts and all three have the default quota of 500 hosted zones. If you create 500 private hosted zones for all three accounts, you can link a VPC with all 1,500 private hosted zones.

### Quotas on records
<a name="limits-api-entities-records"></a>


**Record quotas**  

| Entity | Quota | 
| --- | --- | 
| Records | 10,000 per hosted zone<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas).<br />For a quota greater than 10,000 records in a hosted zone, an additional charge applies.For more information, see [Amazon Route 53 Pricing](https://aws.amazon.com/route53/pricing/). | 
| Records in a record set | 400 per record set | 
| Geolocation, latency, multivalue answer, weighted, and IP-based records | 100 records that have the same name and type | 
| Geoproximity records | 30 records that have the same name and type | 
| CIDR collections | 5 per AWS account.<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| CIDR blocks | 1000 per CIDR collection.<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 

### Quotas on Route 53 VPC Resolver
<a name="limits-api-entities-resolver"></a>

This section includes all the Route 53 VPC Resolver quotas

#### Quotas on Route 53 VPC Resolver
<a name="increase-resolver-quotas"></a>

Use the following procedure to increase quotas for Route 53 VPC Resolver.<a name="increase-quota-procedure"></a>

**To increase Resolver quotas**

1.  Open the Service Quotas console at [https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas](https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas).

1. Go to the Region where you want to increase the limit.

1. Select the Route 53 VPC Resolver **Quota name** you want to increase.

1. Select **Request quota increase**, enter the quota value, and then select **Request**.

#### Quotas on Route 53 VPC Resolver endpoints
<a name="limits-api-entities-resolver-endpoints"></a>


**Resolver endpoint quotas**  

| Entity | Quota | 
| --- | --- | 
| Endpoints per AWS Region | 4 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas).<br /> | 
| IP addresses per endpoint | 6<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas). | 
| IP addresses per rule | 6 | 
| Rules per AWS Region | 1000 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas). | 
| Associations between rules and VPCs per AWS Region | 2000 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home/services/route53resolver/quotas).<br /> | 
| UDP Queries per second per IP address in an endpoint | 10,000\* | 

**\*** Each IP address in an endpoint can process up to 10,000 UDP DNS queries per second (QPS). The actual DNS QPS varies by the type of query, size of the response, health of the target name servers, query response times, round trip latency, and the protocol in use. For example, queries to a target name server that is slow to respond can reduce the capacity of the network interface. Also, to ensure high availability, Route 53 Resolver sends redundant outbound queries for each DNS request it receives. As a result, the QPS for each outbound network interface will not match the QPS sent to Route 53 VPC Resolver. Use CloudWatch metrics to measure how many queries are sent to each network interface. For more information, see [Metrics for Route 53 VPC Resolver IP addresses](monitoring-resolver-with-cloudwatch.md#cloudwatch-metrics-resolver-ip-address). If your maximum query rate exceeds 50% of the capacity for any network interface in the endpoint, you can add more network interfaces to increase the endpoint capacity.

Connections made through services like Network Load Balancer and AWS Lambda (for a full list see [Automatically tracked connections](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-connection-tracking.html#automatic-tracking) ) are tracked by default, even if the security group setup does not require tracking.

If connection tracking is enforced by restrictive security group rules or queries are routed through Network Load Balancer, the maximum queries per second per IP address for an inbound endpoint can be as low as 1500.

#### Quotas on Route 53 VPC Resolver query logs
<a name="limits-api-entities-resolver-query-logs"></a>


**Resolver query log quotas**  

| Entity | Quota | 
| --- | --- | 
| Query log configurations per AWS Region | 20<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Query log configuration VPC associations per AWS Region | 100 **\***<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Query log configuration VPC associations per account per AWS Region (including query long confgurations shared using RAM) for the account that the configuration was shared to. | 100<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 

**\*** This is a Regional limit that applies across all VPC Resolver query log configurations in a single Region. Creating more query log configurations in the same Region does not provide more VPC association capacity.

#### Quotas on Resolver DNS Firewall
<a name="limits-api-entities-resolver-dns-firewall"></a>


**DNS Firewall quotas**  

| Entity | Quota | 
| --- | --- | 
| Number of rule groups associated to a VPC for a single account per AWS Region |  5 | 
| Number of DNS Firewall domains in a single Amazon S3 file for a single account per AWS Region | 250,000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53resolver/quotas). | 
| Number of DNS Firewall rule groups for a single account per AWS Region | 1,000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53resolver/quotas). | 
| Number of rules within a rule group for a single account per AWS Region | 100<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53resolver/quotas). | 
| Number of domain lists for a single account per AWS Region | 1000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53resolver/quotas). | 
| The maximum number of domains that you can specify across all of the domain lists for a single account per AWS Region | 100,000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53resolver/quotas). | 

#### Quotas for Resolver on first-generation AWS Outposts
<a name="limits-api-entities-resolver-on-outposts"></a>


**Resolver on Outposts quotas**  

| Entity | Quota | 
| --- | --- | 
| Resolver on Outpost instance limit |  6 (with a minimum of 4 required) | 

<a name="formalpara"></a>**Resolver on Outpost instance types and the number of DNS queries per second each instance type can accommodate:**


**Queries per second by instance type**  

| Instance type | Queries per second | 
| --- | --- | 
| c5.large |  Up to 7,000 | 
| c5.xlarge | Up to 12,000 | 
| c5.2xlarge | Up to 24,000 | 
| c5.4xlarge | Up to 56,000 | 
| c5d.large | Up to 7,000 | 
| c5d.xlarge | Up to 12,000 | 
| c5d.2xlarge | Up to 24,000 | 
| c5d.4xlarge | Up to 56,000 | 
| m5.large | Up to 7,000 | 
| m5.xlarge | Up to 12,000 | 
| m5.2xlarge | Up to 24,000 | 
| m5.4xlarge | Up to 56,000 | 
| m5d.large | Up to 7,000 | 
| m5d.xlarge | Up to 12,000 | 
| m5d.2xlarge | Up to 24,000 | 
| m5d.4xlarge | Up to 56,000 | 
| r5.large | Up to 7,000 | 
| r5.xlarge | Up to 12,000 | 
| r5.2xlarge | Up to 24,000 | 
| r5.4xlarge | Up to 56,000 | 
| r5d.large | Up to 7,000 | 
| r5d.xlarge | Up to 12,000 | 
| r5d.2xlarge | Up to 24,000 | 
| r5d.4xlarge | Up to 56,000 | 

<a name="formalpara"></a>**Resolver on Outpost endpoint instance types and the number of DNS queries per second each instance type can accommodate:**


**Queries per second by endpoint instance type**  

| Instance type | Queries per second | 
| --- | --- | 
| c5.large |  Up to 5,000 | 
| c5.xlarge | Up to 10,000 | 
| c5.2xlarge | Up to 18,000 | 
| c5.4xlarge | Up to 30,000 | 
| c5d.large | Up to 5,000 | 
| c5d.xlarge | Up to 10,000 | 
| c5d.2xlarge | Up to 18,000 | 
| c5d.4xlarge | Up to 30,000 | 
| m5.large | Up to 5,000 | 
| m5.xlarge | Up to 10,000 | 
| m5.2xlarge | Up to 18,000 | 
| m5.4xlarge | Up to 30,000 | 
| m5d.large | Up to 5,000 | 
| m5d.xlarge | Up to 10,000 | 
| m5d.2xlarge | Up to 18,000 | 
| m5d.4xlarge | Up to 30,000 | 
| r5.large | Up to 5,000 | 
| r5.xlarge | Up to 10,000 | 
| r5.2xlarge | Up to 18,000 | 
| r5.4xlarge | Up to 30,000 | 
| r5d.large | Up to 5,000 | 
| r5d.xlarge | Up to 10,000 | 
| r5d.2xlarge | Up to 18,000 | 
| r5d.4xlarge | Up to 30,000 | 

#### Quotas for Resolver on second-generation AWS Outposts
<a name="limits-api-entities-resolver-on-outposts-second-gen"></a>

The following table lists the quota for Resolver on second-generation AWS Outposts.


**Resolver on second-generation AWS Outposts quotas**  

| Quota name | Quota value | 
| --- | --- | 
| DNS queries per second | Up to 75,000 | 

### Quotas on health checks
<a name="limits-api-entities-health-checks"></a>


**Health check quotas**  

| Entity | Quota | 
| --- | --- | 
| Health checks | 200 active health checks per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Child health checks that a calculated health check can monitor | 255 | 
| Maximum total length of headers in the response to a health check request | 16,384 bytes (16K) | 

### Quotas on query log configurations
<a name="limits-api-entities-query-log-configs"></a>


**Query log configuration quotas**  

| Entity | Quota | 
| --- | --- | 
| Query log configurations | 1 per hosted zone | 

### Quotas on traffic flow policies and policy records
<a name="limits-api-entities-traffic-flow"></a>


**Traffic flow quotas**  

| Entity | Quota | 
| --- | --- | 
| Traffic policies<br />For more information about Route 53 traffic flow, see [Using Traffic Flow to route DNS traffic](traffic-flow.md). | 50 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Traffic policy versions | 1,000 per traffic policy | 
| Traffic policy records (referred to as "policy instances" in the Route 53 API, AWS SDKs, AWS Command Line Interface, and AWS Tools for Windows PowerShell) | 5 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 

### Quotas on reusable delegation sets
<a name="limits-api-entities-reusable-delegation-sets"></a>


**Reusable delegation set quotas**  

| Entity | Quota | 
| --- | --- | 
| Reusable delegation sets | 100 per AWS account<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 

### Quotas on Route 53 Profiles
<a name="limits-api-entities-route53-profiles"></a>


**Route 53 Profile quotas**  

| Entity | Quota | 
| --- | --- | 
| Number of Route 53 Profiles per AWS account in a Region |  5<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Number of VPCs that can be associated to a Profile | 1000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Number of DNS Firewall rule groups per Profile |  5 | 
| Number of Resolver rules per Profile | 1000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Number of private hosted zones per a Profile | 5000<br />[Request a higher quota](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/services/route53/quotas). | 
| Number of VPC Resolver query logging configurations per Profile | 2 | 

## Maximums on API requests
<a name="limits-api-requests"></a>

Amazon Route 53 API requests are subject to the following maximums.

**Topics**
+ [Number of elements and characters in `ChangeResourceRecordSets` requests](#limits-api-requests-changeresourcerecordsets)
+ [Frequency of Amazon Route 53 API requests](#limits-api-requests-route-53)
+ [Frequency of Route 53 VPC Resolver API requests](#limits-api-requests-route-53-resolver)

### Number of elements and characters in `ChangeResourceRecordSets` requests
<a name="limits-api-requests-changeresourcerecordsets"></a>

**`ResourceRecord` elements**  
A request cannot contain more than 1,000 `ResourceRecord` elements (including alias records). When the value of the `Action` element is `UPSERT`, each `ResourceRecord` element is counted twice.

**Maximum number of characters**  
The sum of the number of characters (including spaces) in all `Value` elements in a request cannot exceed 32,000 characters. When the value of the `Action` element is `UPSERT`, each character in a `Value` element is counted twice.

### Frequency of Amazon Route 53 API requests
<a name="limits-api-requests-route-53"></a>

**All Amazon Route 53 API requests**  
Amazon Route 53 throttles API requests on a per-account basis to maintain service stability and ensure fair usage for all customers. Route 53 applies two independent limits:  
+ **Request rate:** the number of API requests per second.
+ **Change throughput:** the number of individual DNS record changes per second, aggregated across the API actions that modify DNS data.
A request can be throttled by either limit. When a request is throttled, Amazon Route 53 returns an HTTP 400 error (`Bad request`). The response header also includes a `Code` element with a value of `Throttling` and a `Message` element with a value of `Rate exceeded`.  
For the limits that apply to each API action, bucket sizes and refill rates, and requesting an increase, see [Throttling for Amazon Route 53 API requests](throttling-api-requests.md).  
If your application exceeds this limit, we recommend that you implement exponential backoff for retries. For more information, see [Error Retries and Exponential Backoff in AWS](https://docs.aws.amazon.com/general/latest/gr/api-retries.html) in the *Amazon Web Services General Reference*.

**`ChangeResourceRecordSets` requests**  
If Route 53 can't process a request before the next request arrives, it will reject subsequent requests for the same hosted zone and return an HTTP 400 error (`Bad request`). The response header also includes a `Code` element with a value of `PriorRequestNotComplete` and a `Message` element with a value of `The request was rejected because Route 53 was still processing a prior request.`

### Frequency of Route 53 VPC Resolver API requests
<a name="limits-api-requests-route-53-resolver"></a>

**All requests**  
Five requests per second per AWS account per Region. If you submit more than five requests per second in a Region, VPC Resolver returns an HTTP 400 error (`Bad request`). The response header also includes a `Code` element with a value of `Throttling` and a `Message` element with a value of `Rate exceeded`.  
If your application exceeds this limit, we recommend that you implement exponential backoff for retries. For more information, see [Error Retries and Exponential Backoff in AWS](https://docs.aws.amazon.com/general/latest/gr/api-retries.html) in the *Amazon Web Services General Reference*.
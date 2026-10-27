

# Quotas for your Application Load Balancers
<a name="load-balancer-limits"></a>

Your AWS account has default quotas, formerly referred to as limits, for each AWS service. Unless otherwise noted, each quota is Region-specific. You can request increases for some quotas, and other quotas cannot be increased.

To view the quotas for your Application Load Balancers, open the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home). In the navigation pane, choose **AWS services** and select **Elastic Load Balancing**. You can also use the [describe-account-limits](https://docs.aws.amazon.com/cli/latest/reference/elbv2/describe-account-limits.html) (AWS CLI) command for Elastic Load Balancing.

To request a quota increase, see [Requesting a quota increase](https://docs.aws.amazon.com/servicequotas/latest/userguide/request-quota-increase.html) in the *Service Quotas User Guide*. If the quota is not yet available in Service Quotas, submit a request for a [service quota increase](https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase).

**Topics**
+ [Load balancers](#load-balancers-quotas)
+ [Target groups](#target-groups-quotas)
+ [Rules](#rules-quotas)
+ [Trust stores](#trust-stores-quotas)
+ [Certificates](#certificates-quotas)
+ [HTTP headers](#http-headers-quotas)
+ [Load Balancer Capacity Units](#lcu-quotas)

## Load balancers
<a name="load-balancers-quotas"></a>

Your AWS account has the following quotas related to Application Load Balancers.


| Name | Default | Adjustable | 
| --- | --- | --- | 
|  Application Load Balancers per Region  |  50  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-53DA6B97) | 
|  Certificates per Application Load Balancer (excluding default certificates) |  25  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-9365A611) | 
|  Listeners per Application Load Balancer  |  50  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-B6DF7632) | 
|  Target Groups per Action per Application Load Balancer  |  5  | No | 
|  Target Groups per Application Load Balancer  |  100  | No | 
|  Targets per Application Load Balancer  |  1,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-7E6692B2) | 

## Target groups
<a name="target-groups-quotas"></a>

The following quotas are for target groups.


| Name | Default | Adjustable | 
| --- | --- | --- | 
|  Target Groups per Region  |  3,000 \* | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-B22855CB) | 
|  Targets per Target Group per Region (instances or IP addresses) |  1,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-A0D0B863) | 
|  Targets per Target Group per Region (Lambda functions) | 1 | No | 
| Load balancers per target group | 1 | No | 

**\*** This quota is shared by Application Load Balancers and Network Load Balancers.

## Rules
<a name="rules-quotas"></a>

The following quotas are for rules.


| Name | Default | Adjustable | 
| --- | --- | --- | 
|  Rules per Application Load Balancer (excluding default rules) |  100  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-7EED9B64) | 
|  Condition Values per Rule  |  5  | No | 
|  Condition Wildcards per Rule  |  6  | No | 
| Match evaluations per rule | 5 | No | 

## Trust stores
<a name="trust-stores-quotas"></a>

The following quotas are for trust stores.


| Name | Default | Adjustable | 
| --- | --- | --- | 
|  Trust stores per account  |  20  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-A8F7060B) | 
| Number of listeners using mTLS in verify mode, per load balancer. | 2 | No | 

## Certificates
<a name="certificates-quotas"></a>

The following quotas apply to certificates, including advertising CA certificate names and certificate revocation lists.


| Name | Default | Adjustable | 
| --- | --- | --- | 
| CA certificate size | 16 KB | No | 
|  CA certificates per trust store  |  25  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-43FE5A42) | 
|  CA certificates subject size per trust store  |  10,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-F31E307C) | 
| Maximum certificate chain depth | 4 | No | 
|  Revocation entries per trust store  |  500,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-37E1617B) | 
| Revocation list file size | 50 MB | No | 
|  Revocation lists per trust store  |  30  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-332EE142) | 
| TLS message size | 64 K | No | 

## HTTP headers
<a name="http-headers-quotas"></a>

The following are the size limits for HTTP headers.


| Name | Default | Adjustable | 
| --- | --- | --- | 
| Request line | 16 K | No | 
| Single header | 16 K | No | 
| Entire response header | 32 K | No | 
| Entire request header | 64 K | No | 

## Load Balancer Capacity Units
<a name="lcu-quotas"></a>

The following quotas are for Load Balancer Capacity Units (LCU).


| Name | Default | Adjustable | 
| --- | --- | --- | 
| Reserved Application Load Balancer Capacity Units (LCUs) per Application Load Balancer | 15,000 | Yes | 
|  Reserved Application Load Balancer Capacity Units (LCU) per Region  |  0  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/elasticloadbalancing/quotas/L-8A66D0E6) | 
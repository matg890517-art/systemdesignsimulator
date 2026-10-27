

**Introducing a new console experience for AWS WAF**

You can now use the updated experience to access AWS WAF functionality anywhere in the console. For more details, see [Working with the console](https://docs.aws.amazon.com/waf/latest/developerguide/working-with-console.html). 

# AWS WAF quotas
<a name="limits"></a>

**Note**  
This is the latest version of AWS WAF. For AWS WAF Classic, see [AWS WAF Classic](classic-waf-chapter.md).

AWS WAF is subject to the following quotas (formerly referred to as limits). These quotas are the same for all Regions in which AWS WAF is available. Each Region is subject to these quotas individually. The quotas are not cumulative across Regions.

AWS WAF has default quotas on the maximum number of entities you can have per account. You can [request an increase](https://console.aws.amazon.com/servicequotas/home/services/wafv2/quotas) in these quotas.


| Resource | Default quota per account per Region | 
| --- | --- | 
| Maximum number of protection packs (web ACLs) | 100 | 
| Maximum number of rule groups  | 100 | 
| Maximum number of IP sets  | 100 | 
| Maximum number of requests per second per protection pack (web ACL)  | 100,000 | 
| Maximum number of custom request headers per protection pack (web ACL) or rule group | 100 | 
| Maximum number of custom response headers per protection pack (web ACL) or rule group | 100 | 
| Maximum number of custom response bodies per protection pack (web ACL) or rule group | 50 | 
| Maximum number of token domains in a protection pack (web ACL) token domain list | 10 | 
| Maximum number of regex pattern sets  | 10 | 
| Maximum number of Application Load Balancer associations per protection pack (web ACL) | 100  | 
| Maximum number of Amazon API Gateway REST API associations per protection pack (web ACL) | 100 | 
| Maximum number of Amazon Cognito user pool associations per protection pack (web ACL) | 100 | 
| Maximum number of AWS AppSync GraphQL API associations per protection pack (web ACL) | 100 | 
| Maximum number of AWS App Runner service associations per protection pack (web ACL) | 100 | 
| Maximum number of AWS Verified Access instance associations per protection pack (web ACL) | 100 | 
| Maximum number of AWS Amplify associations per protection pack (web ACL) | 100 | 
| Maximum number of Amazon Bedrock AgentCore Gateway associations per protection pack (web ACL) | 100 | 

The maximum requests per second (RPS) allowed for AWS WAF on CloudFront is set by CloudFront and described in the [CloudFront Developer Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html).

AWS WAF has fixed quotas on the following entity settings per account per Region. These quotas can't be changed.


| Resource | Quota per account per Region | 
| --- | --- | 
| Maximum protection pack (web ACL) capacity units (WCUs) per protection pack (web ACL)\* | 5,000 | 
| Maximum WCUs per rule group | 5,000 | 
| Maximum number of reference statements per rule group. In a rule group, a reference statement can reference an IP set or a regex pattern set. | 50 | 
| Maximum number of reference statements per protection pack (web ACL). In a protection pack (web ACL), a reference statement can reference a rule group, an IP set, or a regex pattern set. | 50 | 
| Maximum number of IP addresses in CIDR notation per IP set | 10,000 | 
| Maximum number of rate-based rules per protection pack (web ACL)  | 10 | 
| Maximum number of rate-based rules per rule group | 4 | 
| Minimum request rate that can be defined for a rate-based rule | 10 | 
| Maximum number of unique IP addresses that can be rate limited per rate-based rule | 10,000 | 
| Maximum number of characters in a string match statement | 200 | 
| Maximum number of characters in each regex pattern | 200 | 
| Maximum number of unique regex patterns per regex pattern set | 10 | 
| Maximum size of a web request body that can be inspected for Application Load Balancer and AWS AppSync protections | 8 KB | 
| Maximum size of a web request body that can be inspected for Amazon Bedrock AgentCore Gateway protections | 16 KB | 
| Maximum size of a web request body that can be inspected for CloudFront, API Gateway, Amazon Cognito, App Runner, Verified Access, and Amazon Bedrock AgentCore Gateway protections\*\* | 64 KB | 
| Maximum number of text transformations per rule statement | 10 | 
| Maximum size of the custom response body content for a single custom response definition | 4 KB | 
| Maximum number of custom headers for a single custom response definition | 10 | 
| Maximum number of custom headers for a single custom request definition | 10 | 
| Maximum combined size of all response body content for a single rule group or a single protection pack (web ACL) | 50 KB | 
| Maximum number of Geo match country codes inside a single GeoMatchStatement | 50 | 

\*Using more than 1,500 WCUs in a protection pack (web ACL) incurs costs beyond the basic protection pack (web ACL) price. For more information, see [Web ACL capacity units (WCUs) in AWS WAF](aws-waf-capacity-units.md) and [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/).

\*\*By default, the body inspection limit is set to 16 KB for CloudFront, API Gateway, Amazon Cognito, App Runner, Verified Access, and Amazon Bedrock AgentCore Gateway resources, but you can increase this for any of these resources in your protection pack (web ACL) configuration, up to the listed maximum. For more information, see [Considerations for managing body inspection in AWS WAF](web-acl-setting-body-inspection-limit.md).

AWS WAF has the following fixed quotas on calls per account per Region. These quotas apply to the total calls to the service through any available means, including the console, CLI, AWS CloudFormation, the REST API, and the SDKs. These quotas can't be changed.


| Call type | Quota per account per Region | 
| --- | --- | 
| Maximum number of calls to AssociateWebACL | One request every 2 seconds  | 
| Maximum number of calls to DisassociateWebACL | One request every 2 seconds  | 
| Maximum number of calls to GetWebACLForResource  | One request per second | 
| Maximum number of calls to ListResourcesForWebACL | One request per second | 
| Maximum number of calls to GetDecryptedAPIKey | One request every 2 seconds | 
| Maximum number of calls to any individual Get or List action, if no other quota is defined for it  | Five requests per second | 
| Maximum number of calls to any individual Create, Put, or Update action, if no other quota is defined for it  | One request per second | 

AWS WAF has the following fixed quotas on calls by all accounts in a single organization in AWS Organizations. These quotas apply to the total calls to the service through any available means, including the console, CLI, AWS CloudFormation, the REST API, and the SDKs. These quotas can't be changed.


| Call type | Quota per organization in a single Region | 
| --- | --- | 
| Maximum number of calls by all accounts in an organization to ListResourcesForWebACL, in any single Region for the Regions US East (N. Virginia) (us-east-1), US West (Oregon) (us-west-2), or Europe (Ireland) (eu-west-1).  | 12 requests per second | 
| Maximum number of calls by all accounts in an organization to ListResourcesForWebACL, in any single Region that doesn't have a different quota listed in this table.  | 6 requests per second | 

AWS WAF has the following quotas for AI traffic monetization features. Quotas marked as adjustable can be increased through a [quota increase request](https://console.aws.amazon.com/servicequotas/home/services/wafv2/quotas).


| Resource | Default quota | Adjustable | 
| --- | --- | --- | 
| Protection packs per account | 25 | Yes | 
| Protection packs per protection pack (web ACL) | 10 | Yes | 
| Pricing tiers per protection pack | 20 | No | 
| Content zones per protection pack | 50 | Yes | 
| Payment providers per protection pack | 3 | No | 
| Minimum price per request | $0.00001 (10^-5 USD) | No | 
| Maximum price per request | $100 | No | 
| Access token TTL range | 60-86400 seconds | No | 
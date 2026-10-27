

# Amazon API Gateway quotas
<a name="limits"></a>

The following quotas apply for all Amazon API Gateway API types.

## API Gateway account-level quotas, per Region
<a name="apigateway-account-level-limits-table"></a>

The following quotas apply per account, per Region in Amazon API Gateway.


| Resource or operation | Default quota | Can be increased | 
| --- | --- | --- | 
| Throttle quota per account, per Region across HTTP APIs, REST APIs, WebSocket APIs, and WebSocket callback APIs | 10,000 requests per second (RPS) with an additional burst capacity provided by the [token bucket algorithm](https://en.wikipedia.org/wiki/Token_bucket), using a maximum bucket capacity of 5,000 requests. \* The burst quota is determined by the API Gateway service team based on the overall RPS quota for the account in the Region. It is not a quota that a customer can control or request changes to.  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/apigateway/quotas/L-8A5B8E43) | 
| Throttle quota without access control per account per Region for a portal | 250,000 requests per second | No | 
| Throttle quota with access control per account per Region for a portal | 10,000 requests per second | No | 

\* For the following Regions, the default throttle quota is 2500 RPS and the default burst quota is 1250 RPS: Africa (Cape Town), Europe (Milan), Asia Pacific (Jakarta), Middle East (UAE), Asia Pacific (Hyderabad), Asia Pacific (Melbourne), Europe (Spain), Europe (Zurich), Israel (Tel Aviv), Canada West (Calgary), Asia Pacific (Malaysia), Asia Pacific (Thailand), and Mexico (Central).

## API Gateway quotas for creating, deploying and managing an API
<a name="api-gateway-control-service-limits-table"></a>

The following fixed quotas apply to creating, deploying, and managing an API in API Gateway, using the AWS CLI, the API Gateway console, or the API Gateway REST API and its SDKs. These quotas can't be increased.


| Action | Default quota | Can be increased | 
| --- | --- | --- | 
| [CreateApiKey](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateApiKey.html) | 5 requests per second per account | No | 
| [CreateDeployment](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateDeployment.html) | 1 request every 5 seconds per account | No | 
| [CreateDocumentationVersion](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateDocumentationVersion.html) | 1 request every 20 seconds per account | No | 
| [CreateDomainName](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateDomainName.html) | 1 request every 30 seconds per account | No | 
| [CreateResource](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateResource.html) | 5 requests per second per account | No | 
| [CreateRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateRestApi.html) for Regional or private API | 1 request every 3 seconds per account | No | 
| [CreateRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_CreateRestApi.html) for edge-optimized API | 1 request every 30 seconds per account | No | 
|  [CreateVpcLink](https://docs.aws.amazon.com/apigatewayv2/latest/api-reference/vpclinks.html#CreateVpcLink) (V2)  | 1 request every 15 seconds per account | No | 
| [DeleteApiKey](https://docs.aws.amazon.com/apigateway/latest/api/API_DeleteApiKey.html) | 5 requests per second per account | No | 
| [DeleteDomainName](https://docs.aws.amazon.com/apigateway/latest/api/API_DeleteDomainName.html) | 1 request every 30 seconds per account | No | 
| [DeleteResource](https://docs.aws.amazon.com/apigateway/latest/api/API_DeleteResource.html) | 5 requests per second per account | No | 
| [DeleteRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_DeleteRestApi.html) | 1 request every 30 seconds per account | No | 
| [GetResources](https://docs.aws.amazon.com/apigateway/latest/api/API_GetResources.html) | 5 requests every 2 seconds per account | No | 
|  [DeleteVpcLink](https://docs.aws.amazon.com/apigatewayv2/latest/api-reference/vpclinks.html#DeleteVpcLink) (V2)  | 1 request every 30 seconds per account | No | 
| [ImportDocumentationParts](https://docs.aws.amazon.com/apigateway/latest/api/API_ImportDocumentationParts.html) | 1 request every 30 seconds per account | No | 
| [ImportRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_ImportRestApi.html) for Regional or private API | 1 request every 3 seconds per account | No | 
| [ImportRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_ImportRestApi.html) for edge-optimized API  | 1 request every 30 seconds per account | No | 
| [PutRestApi](https://docs.aws.amazon.com/apigateway/latest/api/API_PutRestApi.html) | 1 request per second per account | No | 
| [UpdateAccount](https://docs.aws.amazon.com/apigateway/latest/api/API_UpdateAccount.html) | 1 request every 20 seconds per account | No | 
| [UpdateDomainName](https://docs.aws.amazon.com/apigateway/latest/api/API_UpdateDomainName.html) | 1 request every 30 seconds per account | No | 
| [UpdateUsagePlan](https://docs.aws.amazon.com/apigateway/latest/api/API_UpdateUsagePlan.html) | 1 request every 20 seconds per account | No | 
| Create Portal | 1 request every 3 seconds | No | 
| Update Portal | 2 requests per minute | No | 
| Get Portal | 10 requests per second | No | 
| List Portals | 10 requests per second | No | 
| Publish Portal | 2 requests per minute | No | 
| DeletePortal | 2 requests per minute | No | 
| PreviewPortal | 1 request every 3 seconds | No | 
| DisablePortal | 2 requests per minute | No | 
| GetPortalProduct | 10 requests per second | No | 
| ListPortalProduct | 5 requests per second | No | 
| CreatePortalProduct | 2 requests per second | No | 
| UpdatePortalProduct | 0.5 requests per second | No | 
| DeletePortalProduct | 1 request per second | No | 
| PutPortalProductSharingPolicy | 1 request every 3 seconds | No | 
| GetPortalProductSharingPolicy | 10 requests per second | No | 
| DeletePortalProductSharingPolicy | 1 request every 3 seconds | No | 
| CreateProductRestEndpointPage | 1 request every 3 seconds | No | 
| GetProductRestEndpointPage | 10 requests per second | No | 
| UpdateProductRestEndpointPage | 1 request every 3 seconds | No | 
| DeleteProductRestEndpointPage | 1 request every 3 seconds | No | 
| ListProductRestEndpointPages | 10 requests per second | No | 
| CreateProductPage | 1 request every 3 seconds | No | 
| GetProductPage | 10 requests per second | No | 
| UpdateProductPage | 1 request every 3 seconds | No | 
| DeleteProductPage | 1 request every 3 seconds | No | 
| ListProductPages | 10 requests per second | No | 
| Other operations | No quota up to the total account quota. | No | 
| Total operations | 10 requests per second with a burst quota of 40 requests per second. | No | 
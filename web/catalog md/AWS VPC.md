

# Amazon VPC quotas
<a name="amazon-vpc-limits"></a>

The following tables list the quotas, formerly referred to as limits, for Amazon VPC resources for your AWS account. Unless indicated otherwise, these quotas are per Region.

If you request a quota increase that applies per resource, we increase the quota for all resources in the Region. 

## VPC and subnets
<a name="vpc-limits-vpcs-subnets"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  VPCs per Region  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-F678F1CE) | Increasing this quota increases the quota on internet gateways per Region by the same amount.<br />You can increase this limit so that you can have hundreds of VPCs per Region. | 
|  Subnets per VPC  |  200  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-407747CB) |  | 
|  IPv4 CIDR blocks per VPC  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-83CA0A9D)(up to 50) | This primary CIDR block and all secondary CIDR blocks count toward this quota. | 
|  IPv6 CIDR blocks per VPC  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-085A6257)(up to 50) | The number of CIDRs you can allocate to a single VPC. | 
| VPC Block Public Access exclusions per account per Region | 50 | Yes. To request an increase, see [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the AWS Support User Guide. | The number of [VPC BPA exclusions](security-vpc-bpa-basics.md#security-vpc-bpa-exclusions) you can create in an account. | 

## DNS
<a name="vpc-limits-dns"></a>

Each EC2 instance can send 1024 packets per second per network interface to Route 53 Resolver (specifically the .2 address, such as 10.0.0.2 and 169.254.169.253). This quota cannot be increased. The number of DNS queries per second supported by Route 53 Resolver varies by the type of query, the size of the response, and the protocol in use. For more information and recommendations for a scalable DNS architecture, see the [AWS Hybrid DNS with Active Directory](https://d1.awsstatic.com/whitepapers/aws-hybrid-dns-with-active-directory.pdf) Technical Guide.

## Elastic IP addresses
<a name="vpc-limits-eips"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
| Elastic IP addresses per Region |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/ec2/quotas/L-0263D0A3) | This quota applies to individual AWS account VPCs and shared VPCs. | 
| Elastic IP addresses per public NAT gateway |  2  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-5F53652F) | You can request a quota increase up to 8. | 

## Gateways
<a name="vpc-limits-gateways"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  Egress-only internet gateways per Region  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-45FE3B85) | To increase this quota, increase the quota for VPCs per Region. You can attach only one egress-only internet gateway to a VPC at a time. | 
|  Internet gateways per Region  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-A4707A72) | To increase this quota, increase the quota for VPCs per Region. You can attach only one internet gateway to a VPC at a time. | 
|  NAT gateways per Availability Zone  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-FE5A380F) | NAT gateways only count toward your quota in the pending, active, and deleting states. | 
|  Private IP address quota per NAT gateway  |  8  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-DFA99DE7) |  | 
| Carrier gateways per VPC | 1 | No |  | 

## Customer-managed prefix lists
<a name="vpc-quotas-managed-prefix-lists"></a>

While the default quotas for customer-managed prefix lists are adjustable, you cannot request an increase using the Service Quotas console. You must open a support case. See [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the *AWS Support User Guide*.


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
| Prefix lists per Region | 100 | Yes |  | 
| Versions per prefix list | 1,000 | Yes | If a prefix list has 1,000 stored versions and you add a new version, the oldest version is removed so that the new version can be added. | 
| Maximum number of entries per prefix list | 1,000 | Yes | You can resize a customer-managed prefix list up to 1000. For more information, see [Resize a prefix list](work-with-cust-managed-prefix-lists.md#resize-managed-prefix-list). When you reference a prefix list in a resource, the maximum number of entries for the prefix lists counts against the quota for the number of entries for the resource. For example, if you create a prefix list with 20 maximum entries and you reference that prefix list in a security group rule, this counts as 20 security group rules. | 
| References to a prefix list per resource type | 10,000 | Yes | This quota applies per resource type that can reference a prefix list. For example, you can have 10,000 references to a prefix list across all of your security groups plus 10,000 references to a prefix list across all of your subnet route tables. If you share a prefix list with other AWS accounts, the other accounts' references to your prefix list count toward your quota. | 

## Network ACLs
<a name="vpc-limits-nacls"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  Network ACLs per VPC  |  200  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-B4A6D682) | You can associate one network ACL to one or more subnets in a VPC. | 
|  Rules per network ACL  |  20  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-2AEEBF1A) | This quota determines both the maximum number of inbound rules and the maximum number of outbound rules. This quota can be increased up to a maximum of 40 inbound rules and 40 outbound rules (for a total of 80 rules), but network performance might be impacted.  | 

## Network interfaces
<a name="vpc-limits-enis"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
| Network interfaces per instance | Varies by instance type | No | For more information, see [Network interfaces per instance type](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html#AvailableIpPerENI). | 
|  Network interfaces per Region  |  5,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-DF5E4CA3) | This quota applies to individual AWS account VPCs and shared VPCs. This limit is enforced per Availability Zone (AZ). If, for example, the network interfaces are in three AZs, each AZ will have a limit of 5,000 limit and the Region will have a limit of 15,000. | 

## Route tables
<a name="vpc-limits-route-tables"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  Route tables per VPC  |  200  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-589F43AA) | The main route table counts toward this quota. Note that if you request a quota increase for route tables, you may also want to request a quota increase for subnets. While route tables can be shared with multiple subnets, a subnet can only be associated with a single route table. | 
|  Routes per route table (non-propagated routes) |  500  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-93826ACB) | You can increase this quota up to a maximum of 1,000; however, network performance might be impacted. This quota is enforced separately for IPv4 routes and IPv6 routes. If you have more than 125 routes, we recommend that you paginate calls to describe your route tables for better performance. | 
|  Propagated routes per route table  | 100 | No | If you require additional prefixes, advertise a default route. | 

## Route servers
<a name="vpc-limits-route-servers"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
| Route servers per VPC | 5 | Yes. To request an increase, see [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the AWS Support User Guide. |  | 
| Route server endpoints per route server | 10 | Yes. To request an increase, see [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the AWS Support User Guide. |  | 
| Peering sessions per network interface | 20 | Yes. To request an increase, see [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the AWS Support User Guide. |  | 
| Route server endpoints per route server and subnet | 2 | No | You can only have two endpoints in the same subnet for the same route server for redundancy. | 
| Routes per route server peer | 100 | No | This is the number of routes that can be dynamically advertised over a route server peer | 
| Routes per route server | 100 | No | This is the number of routes that can be installed in the Forwarding Information Base (FIB) of a route server. | 

## Security groups
<a name="vpc-limits-security-groups"></a>


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  VPC security groups per Region  |  2,500  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-E79EC296) | This quota applies to individual AWS account VPCs and shared VPCs. If you increase this quota to more than 5,000 security groups in a Region, we recommend that you paginate calls to describe your security groups for better performance. | 
|  Inbound or outbound rules per security group  |  60  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-0EA8095F) | This quota is enforced separately for inbound and outbound rules. For an account with the default quota of 60 rules, a security group can have 60 inbound rules and 60 outbound rules. In addition, this quota is enforced separately for IPv4 rules and IPv6 rules. For an account with the default quota of 60 rules, a security group can have 60 inbound rules for IPv4 traffic and 60 inbound rules for IPv6 traffic. For more information, see [Security group size](security-group-rules.md#security-group-size). A quota change applies to both inbound and outbound rules. This quota multiplied by the quota for security groups per network interface cannot exceed 1,000. | 
|  Security groups per network interface  |  5  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-2AFB9258)(up to 16) | This quota multiplied by the quota for rules per security group cannot exceed 1,000. To reduce the security groups per network interface quota below the default value of 5, see [Request a service quota increase](https://docs.aws.amazon.com/awssupport/latest/user/create-service-quota-increase.html) in the AWS Support User Guide. You use the same process to request a decrease as you do to request an increase. | 

## VPC subnet sharing
<a name="vpc-share-limits"></a>

All standard VPC quotas apply to shared VPC subnets.


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  Participant accounts per VPC  |  100  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-2C462E13) | The maximum number of distinct participant accounts that subnets in a VPC can be shared with. This is a per VPC quota and applies across all the subnets shared in a VPC.VPC owners can view the network interfaces and security groups that are attached to the participant resources. | 
|  Subnets that can be shared with an account  |  100  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-44499CD2) | This is the maximum number of subnets that can be shared with an AWS account. | 

## Network Address Usage
<a name="vpc-size-limits"></a>

Network Address Usage (NAU) is comprised of IP addresses, network interfaces, and CIDRs in managed prefix lists. NAU is a metric applied to resources in a VPC to help you plan for and monitor the size of your VPC. For more information, see [Network Address Usage](network-address-usage.md).

The resources that make up the NAU count have their own individual service quotas. Even if a VPC has NAU capacity available, you won't be able to launch resources into the VPC if the resources have exceeded their service quotas.


| Name | Default | Adjustable | Comments | 
| --- | --- | --- | --- | 
|  Network Address Usage  |  64,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-BB24F6E5) (up to to 256,000) | The maximum number of NAU units per VPC. | 
|  Peered Network Address Usage  |  128,000  | [Yes](https://console.aws.amazon.com/servicequotas/home/services/vpc/quotas/L-CD17FD4B) (up to 512,000) | The maximum number of NAU units for a VPC and all of its intra-Region peered VPCs. VPCs that are peered across different Regions do not contribute to this number. | 

## Amazon EC2 API throttling
<a name="api-limits"></a>

For information about Amazon EC2 throttling, see [Request throttling](https://docs.aws.amazon.com/ec2/latest/devguide/ec2-api-throttling.html) in the *Amazon EC2 Developer Guide*.

## Additional quota resources
<a name="additional-quotas"></a>

For more information, see the following:
+ [AWS Client VPN quotas](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/limits.html) in the *AWS Client VPN Administrator Guide*
+ [Direct Connect quotas](https://docs.aws.amazon.com/directconnect/latest/UserGuide/limits.html) in the *AWS Direct Connect User Guide*
+ [Peering quotas](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-connection-quotas.html) in the *Amazon VPC Peering Guide*
+ [PrivateLink quotas](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-limits-endpoints.html) in the *AWS PrivateLink Guide*
+ [Site-to-Site VPN quotas](https://docs.aws.amazon.com/vpn/latest/s2svpn/vpn-limits.html) in the *AWS Site-to-Site VPN User Guide*
+ [Traffic Mirroring quotas](https://docs.aws.amazon.com/vpc/latest/mirroring/traffic-mirroring-quotas.html) in the *Amazon VPC Traffic Mirroring Guide*
+ [Transit gateway quotas](https://docs.aws.amazon.com/vpc/latest/tgw/transit-gateway-quotas.html) in the *Amazon VPC Transit Gateways Guide*
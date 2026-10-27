

# Direct Connect quotas
<a name="limits"></a>

The following table lists the quotas related to Direct Connect.


| Component | Quota | Comments | 
| --- | --- | --- | 
| Private or public virtual interfaces per Direct Connect dedicated connection | 50 | This limit cannot be increased. | 
| Transit virtual interfaces per Direct Connect dedicated connection.Transit virtual interfaces can be used to connect to an Transit Gateway or an AWS Cloud WAN core network. For more information, see [Direct Connect gateways](direct-connect-gateways.md). | 4 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Private or public virtual interfaces per Direct Connect dedicated connection and transit virtual interfaces per Direct Connect dedicated connection | 51 | When AWS Direct Connect support for Amazon VPC Transit Gateways was launched, a quota of one (1) transit virtual interface was added to the quota of 50 private or public virtual interfaces per dedicated connection. The number of transit virtual interfaces allowed is now four (4) and is counted against the maximum of 51 virtual interfaces per dedicated connection. This limit cannot be increased. | 
| Private, public, or transit virtual interfaces per Direct Connect hosted connection | 1 | This limit cannot be increased. | 
| Active Direct Connect connections per Direct Connect location per Region per account | 10 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Number of virtual interfaces per Link Aggregation Group (LAG) | 51 | When AWS Direct Connect support for Amazon VPC Transit Gateways was launched, a quota of one (1) transit virtual interface was added to the quota of 50 private or public virtual interfaces per LAG. The number of transit virtual interfaces allowed is now four (4) and is counted against the maximum of 51 virtual interfaces per LAG. This limit cannot be increased. | 
| Rate Limiters per Dedicated connection | 10 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Routes per Border Gateway Protocol (BGP) session on a private virtual interface or transit virtual interface from on-premises to AWS.<br />If you advertise more route prefixes than your configured allocations for IPv4 and IPv6 over the BGP session, the BGP session will go into an idle state and be reported with BGP session status DOWN. | Default of 100 each for IPv4 and IPv6. Can be increased [using prefix controls](prefix-controls.md) up to 1,000 each for IPv4 and IPv6. | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Routes per Border Gateway Protocol (BGP) session on a public virtual interface | 1,000 | This limit cannot be increased. | 
| Dedicated connections per link aggregation group (LAG) | 4 when the port speed is less than 100G 2 when the port speed is 100G |  | 
| Link aggregation groups (LAGs) per Region | 10 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Direct Connect gateways per account | 200 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Virtual private gateways per Direct Connect gateway | 20 | This limit cannot be increased. | 
| Transit Gateways per Direct Connect gateway  | 6 | This limit cannot be increased. | 
| Maximum number of advertised route prefixes from an AWS Cloud WAN core network Direct Connect gateway attachment to on-premises. All transit virtual interfaces attached to that Direct Connect gateway will receive all route prefixes advertised by the core network.  | 5,000 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Virtual interfaces (private or transit) per Direct Connect gateway | 30 | This limit cannot be increased. | 
| Number of prefixes per AWS Transit Gateway from AWS to on-premise on a transit virtual interface | 200 combined total for IPv4 and IPv6 | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 
| Number of virtual interfaces per virtual private gateway | There is no limit. |  | 
| Number of Direct Connect gateways associated to a Transit Gateway | 20 | This limit cannot be increased. | 
| SiteLink prefix limit | Up to 1,000 each for IPv4 and IPv6, configured on your private or transit virtual interface [using prefix controls](prefix-controls.md). | Contact your Solutions Architect (SA) or Technical Account Manager (TAM) for further assistance. | 

Direct Connect supports these port speeds over single-mode fiber: 1 Gbps: 1000BASE-LX (1310 nm), 10 Gbps: 10GBASE-LR (1310 nm) , 100Gbps: 100GBASE-LR4, and 400 Gbps: 400GBASE-LR4.

## Load balance considerations
<a name="load-balance-considerations"></a>

If you want to use load balancing with multiple public VIFs, all the VIFs must be in the same Region.
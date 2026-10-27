

# AWS Storage Gateway quotas
<a name="resource-gateway-limits"></a>

In this topic, you can find information about volume and tape quotas, configuration, and performance limits for Storage Gateway.

**Topics**
+ [Quotas for volumes](#resource-volume-limits)
+ [Recommended local disk sizes for your gateway](#disk-sizes)

## Quotas for volumes
<a name="resource-volume-limits"></a>

The following table lists quotas for volumes.


| Description | Cached volumes | Stored volumes | 
| --- | --- | --- | 
| Maximum size of a volume If you create a snapshot from a cached volume that is more than 16 TiB in size, you can restore it to a Storage Gateway volume but not to an Amazon Elastic Block Store (Amazon EBS) volume.  | 32 TiB | 16 TiB | 
| Maximum number of volumes per gateway | 32 | 32 | 
| Total size of all volumes for a gateway | 1,024 TiB | 512 TiB | 

## Recommended local disk sizes for your gateway
<a name="disk-sizes"></a>


| Gateway Type | Cache (Minimum) | Cache (Maximum) | Upload Buffer (Minimum) | Upload Buffer (Maximum) | 
| --- | --- | --- | --- | --- | 
| Tape gateway | 150 GiB | 64 TiB | 150 GiB | 2 TiB | 

**Note**  
You can configure one or more local drives for your cache and upload buffer, up to the maximum capacity.  
When adding cache or upload buffer to an existing gateway, it's important to create new disks in your host (hypervisor or Amazon EC2 instance). Don't change the size of existing disks if the disks have been previously allocated as either a cache or upload buffer.
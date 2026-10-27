

# Amazon EFS quotas
<a name="limits"></a>

Following, you can find out about quotas when working with Amazon EFS.

**Topics**
+ [Amazon EFS quotas that you can increase](#soft-limits)
+ [Amazon EFS resource quotas that you cannot change](#limits-efs-resources-per-account-per-region)
+ [Quotas for NFS clients](#limits-client-specific)
+ [Quotas for Amazon EFS file systems](#limits-fs-specific)
+ [Unsupported NFSv4.0 and 4.1 features](#nfs4-unsupported-features)
+ [Additional considerations](#limits-additional-considerations)
+ [Troubleshooting file operation errors related to quotas](troubleshooting-efs-fileop-errors.md)

## Amazon EFS quotas that you can increase
<a name="soft-limits"></a>

Service Quotas is an AWS service that helps you manage your quotas, or limits, from one location. In the [Service Quotas console](https://console.aws.amazon.com/servicequotas/home?region=us-east-1#!/dashboard), you can view Amazon EFS limit values and request a quota increase for the number of EFS ﬁle systems in an AWS Region and the read IOPS for frequently accessed data.

You can also request an increase for the following Amazon EFS quotas by contacting AWS Support. To learn more, see [Requesting a quota increase](#request-limit-increase). The Amazon EFS service team reviews each request individually.
+ Number of file systems for each customer account. 
+ Number of access points for each file system.
+ Maximum read IOPS per file system using Elastic throughput. When the read IOPS for frequently accessed file systems is increased, both the read IOPS for infrequently accessed file systems and the write IOPS are also increased. 
+ Elastic throughput per Regional file system for all connected clients in an AWS Region.
+ Provisioned throughput per Regional file system for all connected clients in an AWS Region.

The following table lists general default resource quotas that you can request to change.



- **Number of file systems for each customer account in an AWS Region**
  - 1,000

- **Number of access points for each file system**
  - 10,000

- **Maximum IOPS per file system using Elastic throughputYou can request an increase of up to 10 times the default quota of read IOPS for frequently accessed data. Increases in the read IOPS for frequently accessed data also results in an increase of the read IOPS for infrequently accessed data and the write IOPS.**
  - Infrequently accessed data read: 90,000
  - Frequently accessed data read: 250,000
  - Write: 50,000

<a name="ElasticTPLimits"></a>

The following table lists Elastic throughput quotas per file system for all connected clients in each AWS Region.


**Regional file systems – Total default Elastic throughput per file system for all connected clients in each AWS Region**  

| AWS Region | Maximum read throughput  | Maximum write throughput (metered throughput) | 
| --- | --- | --- | 
| US East (Ohio) Region<br />US East (N. Virginia) Region<br />US West (Oregon) Region<br />Asia Pacific (Mumbai) Region<br />Asia Pacific (Seoul) Region<br />Asia Pacific (Singapore) Region<br />Asia Pacific (Sydney) Region<br />Asia Pacific (Tokyo) Region<br />Europe (Frankfurt) Region<br />Europe (Ireland) Region <br />Europe (London) Region | 60 gibibytes per second (GiBps) | 5 GiBps | 
| All other AWS Regions | 20 GiBps | 1 GiBps | <a name="ProvisionedTPLimits"></a>

The following table lists the Provisioned throughput quotas per file system for all connected clients in each AWS Region.


**Regional file systems – Total default Provisioned throughput per file system for all connected clients in each AWS Region**  

| AWS Region | Maximum read throughput | Maximum write throughput (metered throughput) | 
| --- | --- | --- | 
| US East (Ohio) Region<br />US East (N. Virginia) Region<br />US West (Oregon) Region<br />Europe (Ireland) Region | 10 GiBps | 3.33 GiBps | 
| All other AWS Regions | 3 GiBps | 1 GiBps | 

 

### Requesting a quota increase
<a name="request-limit-increase"></a>

To request an increase for these quotas through AWS Support, take the following steps. The Amazon EFS team reviews each quota increase request. 

**To request a quota increase through AWS Support**

1. Open the [AWS Support Center](https://console.aws.amazon.com/support/home#/) page, and sign in if necessary. Then choose **Create Case**.

1. Under **Create case**, choose **Service Limit Increase**.

1. For **Limit Type**, choose the type of limit to increase. Fill in the necessary fields in the form, and then choose your preferred method of contact.

## Amazon EFS resource quotas that you cannot change
<a name="limits-efs-resources-per-account-per-region"></a>

Quotas for several Amazon EFS resources cannot be changed, including:
+ Quotas for general resources, such as the number of connections for each file system. 
+ Elastic and Provisioned throughput quotas per One Zone file system for all connected clients in an AWS Region.
+ Bursting throughput quotas per Regional or One Zone file system for all connected clients in an AWS Region.

The following table lists the general resource quotas that cannot be changed.<a name="ResourceHardLimits"></a>


**General resource quotas that cannot be changed**  

| Resource | Quota | 
| --- | --- | 
| Number of connections for each file system | 25,000 | 
| Number of mount targets for each file system in an Availability Zone | 1 | 
| Number of mount targets for each virtual private cloud (VPC) | 1,400 | 
| Number of security groups for each mount target | 5 | 
| Number of tags for each file system | 50 | 
| Number of VPCs for each file system | 1 | 

**Note**  
Clients can also connect to mount targets that are in an account or VPC that is different from that of the file system. For more information, see [Mounting EFS file systems from another AWS account or VPC](manage-fs-access-vpc-peering.md).

The following table lists the total default Elastic and Provisioned throughput limits per file system for all connected clients in each AWS Region.


**One Zone file systems – Total default Elastic and Provisioned throughput per file system for all connected clients in each AWS Region**  

| AWS Region | Maximum read throughput | Maximum write throughput (metered throughput) | 
| --- | --- | --- | 
| All AWS Regions | 3 GiBps | 1 GiBps | 

The following table lists the total Bursting throughput limits per file system for all connected clients in each AWS Region.


**Regional and One Zone file systems – Total Bursting throughput per file system for all connected clients in each AWS Region**  

| AWS Region | Maximum read throughput | Maximum write throughput | 
| --- | --- | --- | 
| US East (Ohio) Region<br />US East (N. Virginia) Region<br />US West (Oregon) Region<br />Asia Pacific (Sydney) Region<br />Europe (Ireland) Region | 5 GiBps | 3 GiBps | 
| All other AWS Regions | 3 GiBps | 1 GiBps | 

## Quotas for NFS clients
<a name="limits-client-specific"></a>

The following quotas for NFS clients apply, assuming a Linux NFSv4.1 client:
+ Maximum combined read and write throughput is 1,500 mebibytes per second (MiBps) for file systems using Elastic throughput and mounted using version 2.0 or later of the Amazon EFS client (amazon-efs-utils version) or the Amazon EFS CSI Driver (aws-efs-csi-driver). Maximum throughput for all other file systems is 500 MiBps. For more information about performance, see [Performance summary](performance.md#performance-overview). NFS client throughput is calculated as the total number of bytes that are sent and received, with a minimum NFS request size of 4 KB (after applying a 1/3 metering rate for read requests).
+ Up to 65,536 active users for each client can have files open at the same time.
+ Up to 65,536 files open at the same time on the instance. Listing directory contents doesn't count as opening a file.
+ Each unique mount on the client can acquire up to a total of 65,536 locks per connection.
+ When connecting to Amazon EFS, NFS clients located on-premises or in another AWS Region can observe lower throughput than when connecting to EFS from the same AWS Region. This effect is because of increased network latency. Network latency of 1 ms or less is required to achieve maximum per-client throughput. Use the DataSync data migration service when migrating large datasets from on-premises NFS servers to EFS. 
+ The NFS protocol supports a maximum of 16 group IDs (GIDs) per user and any additional GIDs are truncated from NFS client requests. For more information, see [Access denied to allowed files on NFS file system](troubleshooting-efs-general.md#nfs-16-group-limit).
+ Using Amazon EFS with Microsoft Windows isn't supported.

## Quotas for Amazon EFS file systems
<a name="limits-fs-specific"></a>

The following quotas are specific to Amazon EFS file systems.


| Resource | Quota | 
| --- | --- | 
| File name length, in bytes | 255 | 
| Symbolic link (symlink) length, in bytes | 4,080 | 
| Number of hard links to a file | 177 | 
| Size of a single file | 52,673,613,135,872 bytes (47.9 TiB) | 
| Number of levels for directory depth | 1,000 | 
| Number of locks on a single file across all instances and users | 512 | 
| Character limit for each file system policy | 20,000 | 
| \*Number of file operations per second for General Purpose mode | 250,000 | 

\*For more information about the number of file operations per second for General Purpose mode, see [Performance summary](performance.md#performance-overview).

## Unsupported NFSv4.0 and 4.1 features
<a name="nfs4-unsupported-features"></a>

Although Amazon EFS doesn't support NFSv2, or NFSv3, it does support both NFSv4.1 and NFSv4.0, except for the following features:
+ pNFS
+ Exended attributes
+ Client delegation or callbacks of any type
  + Operation OPEN always returns `OPEN_DELEGATE_NONE` as the delegation type. 
  + The operation OPEN returns `NFSERR_NOTSUPP` for the `CLAIM_DELEGATE_CUR` and `CLAIM_DELEGATE_PREV` claim types.
+ Mandatory locking

  All locks in Amazon EFS are advisory, which means that read and write operations don't check for conflicting locks before the operation is executed. 
+ Deny share

  NFS supports the concept of a share deny. A *share deny *is primarily used by Windows clients for users to deny others access to a particular file that has been opened. Amazon EFS doesn't support this, and returns the NFS error `NFS4ERR_NOTSUPP` for any OPEN commands specifying a share deny value other than `OPEN4_SHARE_DENY_NONE`. Linux NFS clients don't use anything other than `OPEN4_SHARE_DENY_NONE`.
+ Access control lists (ACLs)
+ Amazon EFS doesn't update the `time_access` attribute on file reads. Amazon EFS updates `time_access` in the following events:
  + When a file is created (an inode is created)
  + When an NFS client makes an explicit `setattr` call 
  + On a write to the inode caused by, for example, file size changes or file metadata changes
  + Any inode attribute is updated
+ Namespaces
+ Persistent reply cache
+ Kerberos based security
+ NFSv4.1 data retention
+ SetUID on directories
+ Unsupported file types when using the CREATE operation: Block devices (NF4BLK), character devices (NF4CHR), attribute directory (NF4ATTRDIR), and named attribute (NF4NAMEDATTR).
+ Unsupported attributes: FATTR4\_ARCHIVE, FATTR4\_FILES\_AVAIL, FATTR4\_FILES\_FREE, FATTR4\_FILES\_TOTAL, FATTR4\_FS\_LOCATIONS, FATTR4\_MIMETYPE, FATTR4\_QUOTA\_AVAIL\_HARD, FATTR4\_QUOTA\_AVAIL\_SOFT, FATTR4\_QUOTA\_USED, FATTR4\_TIME\_BACKUP, and FATTR4\_ACL.

   An attempt to set these attributes results in an `NFS4ERR_ATTRNOTSUPP` error that is sent back to the client. 

## Additional considerations
<a name="limits-additional-considerations"></a>

In addition, note the following:
+ For a list of AWS Regions where you can create Amazon EFS file systems, see the [AWS General Reference User Guide](https://docs.aws.amazon.com/general/latest/gr/Welcome.html).
+ Amazon EFS does not support the `nconnect` mount option.
+ You can mount an Amazon EFS file system from on-premises data center servers using Direct Connect and VPN. For more information, see [Tutorial: Mounting with on-premises clients](mounting-fs-mount-helper-direct.md).
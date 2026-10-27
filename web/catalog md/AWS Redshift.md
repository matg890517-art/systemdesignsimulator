

 Amazon Redshift will no longer support the use of Python UDFs after June 30, 2026. We will start enforcing it in phases. For more information on the details of Python end of life and migration options, see the [ blog post ](https://aws.amazon.com/blogs/big-data/amazon-redshift-python-user-defined-functions-will-reach-end-of-support-after-june-30-2026/) that was published on June 30, 2025. 

# Quotas and limits in Amazon Redshift
<a name="amazon-redshift-limits"></a>

Amazon Redshift has quotas that limit the use of several resources in your AWS account per AWS Region. There is a default value for each quota and some quotas are adjustable.

## Quotas for Amazon Redshift objects
<a name="amazon-redshift-limits-quota"></a>

Amazon Redshift has quotas that limit the use of several object types. There is a default value for each.


| Quota name | AWS default value | Adjustable | Description | 
| --- | --- | --- | --- | 
| AWS accounts that you can authorize to restore a snapshot per snapshot  | 20 | No | The maximum number of AWS accounts that you can authorize to restore a snapshot, per snapshot.  | 
| AWS accounts that you can authorize to restore a snapshot per AWS KMS key | 100 | No | The maximum number of AWS accounts that you can authorize to restore a snapshot, per KMS key. That is, if you have 10 snapshots that are encrypted with a single KMS key, then you can authorize 10 AWS accounts to restore each snapshot, or other combinations that add up to 100 accounts and do not exceed 20 accounts for each snapshot.  | 
| Cluster IAM roles for Amazon Redshift to access other AWS services | 501 | No | The maximum number of IAM roles that you can associate with a cluster to authorize Amazon Redshift to access other AWS services for the user that owns the cluster and IAM roles.<br />1The quota is 10 in the following AWS Regions: us-iso-east-1, us-iso-west-1, us-isob-east-1. | 
| Concurrency level (query slots) for all user-defined manual WLM queues | 50 | No | The maximum query slots for all user-defined queues defined by manual workload management.  | 
| Concurrency scaling clusters | 10 | Yes | The maximum number of concurrency scaling clusters.  | 
| DC2 nodes in a cluster | 128 | Yes | The maximum number of DC2 nodes that you can allocate to a cluster. For more information about node limits for each node type, see [Clusters and nodes in Amazon Redshift](working-with-clusters.md#rs-about-clusters-and-nodes).  | 
| Event subscriptions | 20 | Yes | The maximum number of event subscriptions for this account in the current AWS Region.  | 
| Nodes | 200 | Yes | The maximum number of nodes across all database instances for this account in the current AWS Region.  | 
| Parameter groups | 20 | No | The maximum number of parameter groups for this account in the current AWS Region. | 
| RG nodes in a cluster | 128 | Yes | The maximum number of RG nodes that you can allocate to a cluster. For more information about node limits for each node type, see [Clusters and nodes in Amazon Redshift](working-with-clusters.md#rs-about-clusters-and-nodes). | 
| RA3 nodes in a cluster | 128 | Yes | The maximum number of RA3 nodes that you can allocate to a cluster. For more information about node limits for each node type, see [Clusters and nodes in Amazon Redshift](working-with-clusters.md#rs-about-clusters-and-nodes). | 
| Redshift-managed VPC endpoints connected to a cluster | 30 | Yes | The maximum number of Redshift-managed VPC endpoints that you can connect to a cluster. For more information about Redshift-managed VPC endpoints, see [Redshift-managed VPC endpoints](managing-cluster-cross-vpc.md). | 
| Grantees to cluster accessed through a Redshift-managed VPC endpoint | 10 | Yes | The maximum number of grantees that a cluster owner can authorize to create a Redshift-managed VPC endpoint for a cluster. For more information about Redshift-managed VPC endpoints, see [Redshift-managed VPC endpoints](managing-cluster-cross-vpc.md). | 
| Redshift-managed VPC endpoints per authorization | 10 | Yes | The maximum number of Redshift-managed VPC endpoints that you can create per authorization. For more information about Redshift-managed VPC endpoints, see [Redshift-managed VPC endpoints](managing-cluster-cross-vpc.md). | 
| Reserved nodes | 200 | Yes | The maximum number of reserved nodes for this account in the current AWS Region. | 
| Schemas in each database per cluster | 9,900 | No | The maximum number of schemas that you can create in each database, per cluster. However, `pg_temp_*` schemas do not count towards this quota. | 
| Security groups | 20 | Yes | The maximum number of security groups for this account in the current AWS Region. | 
| Single row size when loading by COPY | 64 | No | The maximum size (in MB) of a single row when loading by using the COPY command. This is the maximum size of a single unparsed record that the COPY command can scan; an individual SUPER object within the row is independently limited to 16 MB. | 
| Snapshots | 700 | Yes | The maximum number of user snapshots for this account in the current AWS Region. | 
| Subnet groups | 50 | Yes | The maximum number of subnet groups for this account in the current AWS Region. | 
| Subnets in a subnet group | 20 | Yes | The maximum number of subnets for a subnet group.  | 
| Tables for `rg.large` cluster node type with a single-node cluster | 9,900 | No | The maximum number of tables for the `rg.large` cluster node type with a single-node cluster. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `rg.large` cluster node type with a multi-node cluster | 20,000 | No | The maximum number of tables for the `rg.large` node type with a multi-node cluster. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `rg.xlarge` cluster node type. | 20,000 | No | The maximum number of tables for the `rg.xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `rg.4xlarge` cluster node type | 200,000 | No | The maximum number of tables for the `rg.4xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `rg.12xlarge` cluster node type | 200,000 | No | The maximum number of tables for the `rg.12xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `ra3.large` cluster node type | 9,900 | No | The maximum number of tables for the `ra3.large` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `ra3.xlplus` cluster node type with a single-node cluster. | 9,900 | No | The maximum number of tables for the `ra3.xlplus` cluster node type with a single-node cluster. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `ra3.xlplus` cluster node type with a multiple-node cluster. | 20,000 | No | The maximum number of tables for the `ra3.xlplus` cluster node type with a multiple-node cluster. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `ra3.4xlarge` cluster node type | 200,000 | No | The maximum number of tables for the `ra3.4xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `ra3.16xlarge` cluster node type | 200,000 | No | The maximum number of tables for the `ra3.16xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `dc2.large` cluster node type | 9,900 | No | The maximum number of tables for the `dc2.large` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Tables for `dc2.8xlarge` cluster node type | 200,000 | No | The maximum number of tables for the `dc2.8xlarge` cluster node type. This limit includes permanent tables, temporary tables, datashare tables, and materialized views. External tables are counted as temporary tables. Temporary tables include user-defined temporary tables and temporary tables created by Amazon Redshift during query processing or system maintenance. Views and system tables aren't included in this limit. | 
| Number of databases  | 60 | No | The maximum allowed count of databases in an Amazon Redshift cluster. This excludes databases created from datashares. | 
| Timeout for idle or inactive sessions | 4 hours | No | This setting applies to the cluster. For information about setting the idle-session timeout value for a user, see [ ALTER USER](https://docs.aws.amazon.com/redshift/latest/dg/r_ALTER_USER.html) in the *Amazon Redshift Database Developer Guide*. The user setting takes precedence over the cluster setting. | 
| Timeout for idle transactions | 6 hours | No | The maximum period of inactivity for an open transaction before Amazon Redshift ends the session associated with the transaction. This setting takes precedence over any user-defined idle timeout setting. It applies to the cluster. | 
| Stored procedures in a database | 10,000 | No | The maximum number of stored procedures. See [Limits and differences for stored procedure support](https://docs.aws.amazon.com/redshift/latest/dg/stored-procedure-constraints.html) for more limits. | 
| Maximum number of connections for RG nodes | 2,000 | No | The maximum number of connections to an RG cluster. This is a hard limit that applies to all RG node types and can't be increased. | 
| Maximum number of connections for RA3 nodes | 2,000 | No | The maximum number of connections to an RA3 cluster. This is a hard limit that applies to all RA3 node types and can't be increased. | 
| Maximum number of connections for DC2 nodes | Varies | No | The maximum number of connections to a dc2.large cluster is 500. The maximum number of connections to a dc2.8xlarge cluster is 2000. | 
| Number of Amazon Redshift roles in a cluster | 1,000 | Yes | The maximum number of Amazon Redshift roles that you can create per cluster. For more information about role-based access control (RBAC) roles see [Role-based access control (RBAC)](https://docs.aws.amazon.com/redshift/latest/dg/t_Roles.html) in the *Amazon Redshift Database Developer Guide* | 

## Quotas for Amazon Redshift Serverless objects
<a name="serverless-limits-account"></a>

Amazon Redshift has quotas that limit the use of several object types in your Amazon Redshift Serverless namespace. There is a default value for each.


| Quota name | AWS default value | Adjustable | Description | 
| --- | --- | --- | --- | 
| Number of databases | 100 | No | The maximum allowed count of databases in an Amazon Redshift Serverless namespace. This excludes databases created from datashares. | 
| Number of schemas | 9,900 | No | The maximum allowed count of schemas in an Amazon Redshift Serverless namespace. | 
| Number of tables | 200,000 | No | The maximum allowed count of tables in an Amazon Redshift Serverless namespace. | 
| Redshift Managed storage units for data warehouses using 4 Redshift Processing Units (RPUs) | up to 32 TB | No | The maximum RMS storage supported for a data warehouse with 4 RPUs. Within the 32 TB limit, Amazon Redshift uses a few hundred MBs of storage internally.  | 
| Redshift Managed storage units for data warehouses using 8, 16, or 24 Redshift Processing Units (RPUs) | up to 128 TB | No | The maximum RMS storage supported for a data warehouse with 8, 16, or 24 RPUs. Within the 128 TB limit, Amazon Redshift uses a few hundred MBs of storage internally. | 
| Timeout for idle or inactive sessions | 1 hour | No | For information about setting the idle-session timeout value for a user, see [ ALTER USER](https://docs.aws.amazon.com/redshift/latest/dg/r_ALTER_USER.html) in the *Amazon Redshift Database Developer Guide*. The user setting takes precedence. | 
| Timeout for a running query | 86,399 seconds (24 hours) | No | The maximum time for a running query before Amazon Redshift ends it. | 
| Timeout for idle transactions | 6 hours | No | The maximum period of inactivity for an open transaction before Amazon Redshift Serverless ends the session associated with the transaction. This setting takes precedence over any user-defined idle timeout setting. | 
| Number of maximum connections | 2000 | No | The maximum number of connections allowed to connect to a workgroup. | 
| Number of workgroups | 25 | Yes | The number of workgroups supported. | 
| Number of namespaces | 25 | Yes | The number of namespaces supported. | 
| Number of Amazon Redshift roles in a workgroup | 1,000 | Yes | The maximum number of Amazon Redshift roles that you can create per workgroup. For more information about role-based access control (RBAC) roles see [Role-based access control (RBAC)](https://docs.aws.amazon.com/redshift/latest/dg/t_Roles.html) in the *Amazon Redshift Database Developer Guide* | 
| Base Redshift Processing Units (RPUs) per AWS account | The greater of either 3,200 RPUs or 1.5 times your maximum aggregate base RPUs from the previous six months. | Yes | The AWS account quota for Redshift Serverless base RPUs is the greater of either 3,200 RPUs or 1.5 times your maximum aggregate base RPUs from the previous six months.<br />. | 

For more information about how Amazon Redshift Serverless billing is affected by timeout configuration, see [Billing for Amazon Redshift Serverless](serverless-billing.md).

## Quotas for Amazon Redshift Data API
<a name="data-api-quotas-account"></a>

Amazon Redshift has quotas that limit the use of the Redshift Data API. There is a default value for each. For more information about Amazon Redshift Data API, see [Using the Amazon Redshift Data API](data-api.md).


| Quota name | AWS default value | Adjustable | Description | 
| --- | --- | --- | --- | 
| Transactions per second (TPS) for the `BatchExecuteStatement` API | 20 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `CancelStatement` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `DescribeStatement` API | 100 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `DescribeTable` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `ExecuteStatement` API | 30 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `GetStatementResult` API | 20 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `ListDatabases` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `ListSchemas` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `ListStatements` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 
| Transactions per second (TPS) for the `ListTables` API | 3 | No | The maximum number of operation requests you can make per second without being throttled. | 

## Quotas for query editor v2 objects
<a name="query-editor-limits-account"></a>

Amazon Redshift has quotas that limit the use of several object types in your Amazon Redshift query editor v2. There is a default value for each.


| Quota name | AWS default value | Adjustable | Description | 
| --- | --- | --- | --- | 
| Connections | 500 | Yes | Maximum number of connections that you can create using the query editor v2 in this account in the current Region.  | 
| Active principals per account | 50 | Yes | Maximum number of simultaneous principals who can use query editor v2 in this account in the current Region.  | 
| Saved queries | 2,500 | Yes | Maximum number of saved queries that you can create using the query editor v2 in this account in the current Region.  | 
| Query versions | 20 | Yes | Maximum number of versions per query that you can create using the query editor v2 in this account in the current Region.  | 
| Saved charts | 500 | Yes | Maximum number of saved charts that you can create using the query editor v2 in this account in the current Region.  | 
| Data fetched size per query | 100 | No | Maximum size, in megabytes, of the data fetched per query by the query editor v2 in this account in the current Region.  | 
| Data fetched size per 100 rows | 5 | No | Maximum size, in megabytes, of the data fetched per one query results page (100 rows) by the query editor v2 in this account and current Region. | 
| Maximum concurrent connections | 3 | No | Maximum database connections per user (includes isolated sessions). This value can be set from 1–10 by the query editor v2 administrator in **Account settings**. If you reach the limit set by your administrator, consider using shared sessions instead of isolated sessions when running your SQL. For more information about connections, see [Opening query editor v2](query-editor-v2-open.md). For more information about setting the limit, see [Account settings](query-editor-v2-open.md#query-editor-v2-settings). | 

## Quotas and limits for Amazon Redshift Spectrum objects
<a name="amazon-redshift-limits-spectrum"></a>

Amazon Redshift Spectrum has the following quotas and limits: 
+ The maximum number of databases per AWS account when using an AWS Glue Data Catalog. For this value, see [AWS Glue service quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html#limits_glue) in the *Amazon Web Services General Reference*. 
+ The maximum number of tables per database when using an AWS Glue Data Catalog. For this value, see [AWS Glue service quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html#limits_glue) in the *Amazon Web Services General Reference*. 
+ The maximum number of partitions per table when using an AWS Glue Data Catalog. For this value, see [AWS Glue service quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html#limits_glue) in the *Amazon Web Services General Reference*. 
+ The maximum number of partitions per AWS account when using an AWS Glue Data Catalog. For this value, see [AWS Glue service quotas](https://docs.aws.amazon.com/general/latest/gr/glue.html#limits_glue) in the *Amazon Web Services General Reference*. 
+ The maximum number of columns for external tables when using an AWS Glue Data Catalog, 1,597 when pseudocolumns are enabled, and 1,600 when pseudocolumns aren't enabled. 
+ The maximum size of a string value in an ION or JSON file when using an AWS Glue Data Catalog is 16 KB. The string can be truncated if you reach this limit.
+ You can add a maximum of 100 partitions using a single ALTER TABLE statement.
+ All S3 data must be located in the same AWS Region as the Amazon Redshift cluster. 
+ Timestamps in ION and JSON must use [ISO8601](https://www.iso.org/iso-8601-date-and-time-format.html) format. 
+ External compression of ORC files is not supported. 
+ Text, OpenCSV, and Regex SERDEs do not support octal delimiters larger than '\\177'. 
+ You must specify a predicate on the partition column to avoid reads from all partitions. 

  For example, the following predicate filters on the column `ship_dtm`, but doesn't apply the filter to the partition column `ship_yyyymm`:

  `WHERE ship_dtm > '2018-04-01'`.

  To skip unneeded partitions you need to add a predicate `WHERE ship_yyyymm = '201804'`. This predicate limits read operations to the partition `\ship_yyyymm=201804\`.

These limits don't apply to an Apache Hive metastore.

## Naming constraints
<a name="amazon-redshift-limits-naming"></a>

 The following table describes naming constraints within Amazon Redshift. 


|  |  | 
| --- |--- |
| Cluster identifier |  +  A cluster identifier must contain only lowercase characters.  <br />+  It must contain 1–63 alphanumeric characters or hyphens.  <br />+  Its first character must be a letter.  <br />+  It cannot end with a hyphen or contain two consecutive hyphens.  <br />+  It must be unique for all clusters within an AWS account.    | 
| Database name |  +  A database name must contain 1–64 alphanumeric characters.  <br />+  It must contain only lowercase letters.  <br />+  It cannot be a reserved word. For a list of reserved words, see [ Reserved words](https://docs.aws.amazon.com/redshift/latest/dg/r_pg_keywords.html) in the *Amazon Redshift Database Developer Guide*.    | 
| Endpoint name of a Redshift-managed VPC endpoint |  +  An endpoint name must contain 1–30 characters.  <br />+  Valid characters are A-Z, a-z, 0-9, and hyphen(-).  <br />+  The first character must be a letter.  <br />+  The name can't contain two consecutive hyphens or end with a hyphen.    | 
| Admin user name |  +  An admin user name must contain only lowercase characters.  <br />+  It must contain 1–128 alphanumeric characters. <br />+  Its first character must be a letter.  <br />+  It cannot be a reserved word. For a list of reserved words, see [Reserved words](https://docs.aws.amazon.com/redshift/latest/dg/r_pg_keywords.html) in the *Amazon Redshift Database Developer Guide*.    | 
| Admin password |  +  An admin password must contain 8–64 characters.  <br />+  It must contain at least one uppercase letter.  <br />+  It must contain at least one lowercase letter.  <br />+  It must contain one number.  <br />+  It can use any ASCII characters with ASCII codes 33–126, except ' (single quote), " (double quote), \\, /, or @.   | 
| Parameter group name |  +  A parameter group name must contain 1–255 alphanumeric characters or hyphens.  <br />+  It must contain only lowercase characters.  <br />+  Its first character must be a letter.  <br />+  It can't end with a hyphen or contain two consecutive hyphens.   | 
| Cluster security group name |  +  A cluster security group name must contain no more than 255 alphanumeric characters or hyphens.  <br />+  It must contain only lowercase characters.  <br />+  It must not be **Default**.  <br />+  It must be unique for all security groups that are created by your AWS account.   | 
| Subnet group name |  +  A subnet group name must contain no more than 255 alphanumeric characters or hyphens.  <br />+  It must contain only lowercase characters.  <br />+  It must not be **Default**. <br />+  It must be unique for all subnet groups that are created by your AWS account.   | 
| Cluster snapshot identifier |  +  A cluster snapshot identifier must contain no more than 255 alphanumeric characters or hyphens. <br />+  It must contain only lowercase characters.  <br />+  It must not be **Default**. <br />+  It must be unique for all snapshot identifiers that are created by your AWS account.   | 
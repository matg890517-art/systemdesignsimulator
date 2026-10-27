

# Quotas in Amazon MQ
<a name="amazon-mq-limits"></a>

This topic lists limits within Amazon MQ. Many of the following limits can be changed for specific AWS accounts. To request an increase for a limit, see [AWS Service Quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html) in the *Amazon Web Services General Reference*. Updated limits will not be visible even after the limit increase has been applied. For more information on viewing current connection limits in Amazon CloudWatch, see [ Monitoring Amazon MQ brokers using Amazon CloudWatch](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/security-logging-monitoring-cloudwatch.html).

**Topics**
+ [Brokers](#broker-limits)
+ [Configurations](#configuration-limits)
+ [Users](#activemq-user-limits)
+ [Data Storage](#data-storage-limits)
+ [API Throttling](#api-throttling-limits)

## Brokers
<a name="broker-limits"></a>

The following table lists quotas related to Amazon MQ brokers.


| Limit | Description | 
| --- | --- | 
| Broker name |  +  Must be unique in your AWS account. <br />+  Must be 1-50 characters long. <br />+  Must contain only characters specified in the [ASCII Printable Character Set](https://en.wikipedia.org/wiki/ASCII#Printable_characters). <br />+  Can contain only alphanumeric characters, dashes, periods, underscores, and tildes (`- . _ ~`).   | 
| Number of brokers, per region | 200 | 
| Wire-level connections per broker (ActiveMQ) |  300 for mq.\*.micro instance type brokers, per wire-level protocol.  | 
| Wire-level connections per broker (ActiveMQ) |  2,000 for mq.\*.\*large instance type brokers, per wire-level protocol.  | 
| Connections per node (RabbitMQ) | Connection limits for RabbitMQ brokers are applied *per node* and are determined by the broker's instance type. These limits cannot be overridden by customers. The `max-connections` vhost limit configured via the Management UI restricts connections per vhost but does not override the per-node limit enforced by the broker.<br />For the complete list of per-node connection limits by instance type, see [Amazon MQ for RabbitMQ sizing guidelines](rabbitmq-sizing-guidelines.md). | 
| Security groups per broker | 5 | 
| ActiveMQ destinations (queues, and topics) monitored in CloudWatch | CloudWatch monitors only the first 1000 destinations.  | 
| RabbitMQ destinations (queues) monitored in CloudWatch | CloudWatch monitors only the first 500 destinations, ordered by number of consumers. | 
| Tags per broker | 50 | 

## Configurations
<a name="configuration-limits"></a>

The following table lists quotas related to Amazon MQ configurations.


| Limit | Description | 
| --- | --- | 
| Configuration name |  +  Must be 1-150 characters long. <br />+  Must contain only characters specified in the [ASCII Printable Character Set](https://en.wikipedia.org/wiki/ASCII#Printable_characters). <br />+  Can contain only alphanumeric characters, dashes, periods, underscores, and tildes (`- . _ ~`).   | 
| Revisions per configuration | 300 | 

## Users
<a name="activemq-user-limits"></a>

The following table lists quotas related to Amazon MQ ActiveMQ broker users.


| Limit | Description | 
| --- | --- | 
| Username |  +  Must be 1-100 characters long. <br />+  Must contain only characters specified in the [ASCII Printable Character Set](https://en.wikipedia.org/wiki/ASCII#Printable_characters). <br />+  Can contain only alphanumeric characters, dashes, periods, underscores, and tildes (`- . _ ~`). <br />+  Must not contain commas (`,`).   | 
| Password |  +  Must be 12-250 characters long. <br />+  Must contain only characters specified in the [ASCII Printable Character Set](https://en.wikipedia.org/wiki/ASCII#Printable_characters). <br />+  Must contain at least 4 unique characters. <br />+  Must not contain commas (`,`).   | 
| Users per broker (simple auth) | 250 | 
| Groups per user (simple auth) | 20 | 

## Data Storage
<a name="data-storage-limits"></a>

The following table lists quotas related to Amazon MQ data storage.


| Limit | Description | 
| --- | --- | 
| Storage capacity per smaller broker | 20 GB for mq.\*.micro instance type brokers. For more information regarding Amazon MQ instance types, see [Amazon MQ for ActiveMQ broker instance types](broker-instance-types.md). | 
| Storage capacity per larger broker | 200 GB for mq.m5.\* instance type brokers. For more information regarding Amazon MQ instance types, see [Amazon MQ for ActiveMQ broker instance types](broker-instance-types.md). | 
| Job scheduler usage limit per broker [backed by Amazon EBS](broker-storage.md) |   Does not apply to RabbitMQ brokers.  50 GB. For more information about job scheduler usage, see [JobSchedulerUsage](https://activemq.apache.org/maven/apidocs/org/apache/activemq/usage/JobSchedulerUsage.html) in the Apache ActiveMQ API Documentation.  | 
| Temporary storage capacity per smaller broker. |   Does not apply to RabbitMQ brokers.  5 GB for mq.\*.micro instance type brokers.  | 
| Temporary storage capacity per larger broker. |   Does not apply to RabbitMQ brokers.  50 GB for mq.m5.\* instance type brokers.  | 

## API Throttling
<a name="api-throttling-limits"></a>

The following throttling quotas are aggregated per AWS account, *across all Amazon MQ APIs* to maintain service bandwidth. For more information about Amazon MQ APIs, see the *[Amazon MQ REST API Reference](https://docs.aws.amazon.com/amazon-mq/latest/api-reference/)*.

**Important**  
These quotas don't apply to Amazon MQ for ActiveMQ or Amazon MQ for RabbitMQ broker messaging APIs. For example, Amazon MQ doesn't throttle the sending or receiving of messages.


| API burst limit | API rate limit | 
| --- | --- | 
| 100 | 15 | 
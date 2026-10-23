---
layout: Conceptual
title: Blob Storage Scalability and Performance Targets - Azure Storage | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets
breadcrumb_path: /azure/bread/toc.json
feedback_help_link_url: https://learn.microsoft.com/answers/tags/125/azure-blob-storage/
feedback_help_link_type: get-help-at-qna
feedback_product_url: https://feedback.azure.com/d365community/forum/a8bb4a47-3525-ec11-b6e6-000d3a4f0f84
feedback_system: Standard
permissioned-type: public
recommendations: true
recommendation_types:
- Training
- Certification
uhfHeaderId: azure
ms.suite: office
adobe-target: true
learn_banner_products:
- azure
manager: akashdubey
ms.reviewer: akashdubey-ms
description: Learn Azure Blob Storage scalability and performance targets, understand service limits, and design applications for optimal performance.
author: normesta
ms.service: azure-blob-storage
ms.topic: concept-article
ms.date: 2026-07-24T00:00:00.0000000Z
ms.author: normesta
locale: en-us
document_id: 6e4afa9a-beb6-eeca-b93d-65da14d7f19b
document_version_independent_id: eb6dd405-a34d-eec5-70b7-85a80dde27a8
updated_at: 2026-07-27T22:17:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/azure-docs-pr/blob/live/articles/storage/blobs/scalability-targets.md
gitcommit: https://github.com/MicrosoftDocs/azure-docs-pr/blob/c6a0c73175b46ac6608bb44ecca48748725c33bd/articles/storage/blobs/scalability-targets.md
git_commit_id: c6a0c73175b46ac6608bb44ecca48748725c33bd
site_name: Docs
depot_name: Azure.azure-documents
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/Azure.azure-documents/{branchName}{pdfName}
word_count: 709
asset_id: storage/blobs/scalability-targets
moniker_range_name: 
monikers: []
item_type: Content
source_path: articles/storage/blobs/scalability-targets.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/de8ce683-cbe1-461b-bae7-77db0888ec6d
- https://authoring-docs-microsoft.poolparty.biz/devrel/ea957f26-244e-4bd1-9b19-105f0a0a73d6
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/a06cf482-4ca9-4582-a142-bcf842258d42
- https://authoring-docs-microsoft.poolparty.biz/devrel/85dd85bb-c2e5-412e-96b2-f2765a3fe51c
platformId: 2489f42c-f966-c79a-641a-d9f11a111839
---

# Blob Storage Scalability and Performance Targets - Azure Storage | Microsoft Learn

This reference details scalability and performance targets for Azure Storage. The scalability and performance targets listed here are high-end targets, but they're achievable. In all cases, the request rate and bandwidth that your storage account achieves depend on the size of objects stored, the access patterns used, and the type of workload your application performs.

Test your service to determine whether its performance meets your requirements. If possible, avoid sudden spikes in the rate of traffic and ensure that traffic is well-distributed across partitions.

When your application reaches the limit of what a partition can handle for your workload, Azure Storage begins to return error code 503 (Server Busy) or error code 500 (Operation Timeout) responses. If 503 errors occur, consider modifying your application to use an exponential backoff policy for retries. The exponential backoff decreases the load on the partition and eases spikes in traffic to that partition.

For the service-level agreement (SLA) for Azure Storage accounts, see [SLA for Storage Accounts](https://azure.microsoft.com/support/legal/sla/storage/v1_5/).

## Scale targets for Blob storage

| Resource | Target |
| --- | --- |
| Maximum size of single blob container | Same as maximum storage account capacity |
| Maximum number of blocks in a block blob or append blob | 50,000 blocks |
| Maximum size of a block in a block blob | 4,000 MiB |
| Maximum size of a block blob | 50,000 x 4,000 MiB (approximately 190.7 TiB) |
| Maximum size of a block in an append blob | 4 MiB |
| Maximum size of an append blob | 50,000 x 4 MiB (approximately 195 GiB) |
| Maximum size of a page blob | 8 TiB^2^ |
| Maximum number of stored access policies per blob container | 5 |
| Target request rate for a single block blob | Up to 3,000 requests per second |
| Target request rate for a single page blob | Up to 500 requests per second |
| Target throughput for a single page blob | Up to 60 MiB per second^2^ |
| Target throughput for a single block blob | Up to storage account ingress/egress limits^1^ |

^1^ Throughput for a single blob depends on several factors. These factors include but aren't limited to concurrency, request size, performance tier, speed of source for uploads, and destination for downloads. To take advantage of the performance enhancements of [high-throughput block blobs](https://azure.microsoft.com/blog/high-throughput-with-azure-blob-storage/), upload larger blobs or blocks. Specifically, call the [Put Blob](/en-us/rest/api/storageservices/put-blob) or [Put Block](/en-us/rest/api/storageservices/put-block) operation with a blob or block size that's greater than 256 KiB.

^2^ Page blobs aren't yet supported in accounts that have a hierarchical namespace enabled.

The following table describes the maximum block and blob sizes permitted by service version.

| Service version | Maximum block size (via Put Block) | Maximum blob size (via Put Block List) | Maximum blob size via single write operation (via Put Blob) |
| --- | --- | --- | --- |
| Version 2019-12-12 and later | 4,000 MiB | Approximately 190.7 TiB (4,000 MiB x 50,000 blocks) | 5,000 MiB |
| Version 2016-05-31 through version 2019-07-07 | 100 MiB | Approximately 4.75 TiB (100 MiB x 50,000 blocks) | 256 MiB |
| Versions prior to 2016-05-31 | 4 MiB | Approximately 195 GiB (4 MiB x 50,000 blocks) | 64 MiB |

## Hot partitions: detection, monitoring, and mitigation

Azure Blob Storage distributes data and requests across partitions to help scale workloads. A storage account can have available capacity and throughput while workloads that concentrate traffic on a narrow range of partition keys experience partition-level throughput constraints.

When a single partition receives significantly more traffic than other partitions, it becomes a *hot partition*. The partition key for a blob combines the storage account name, container name, and blob name, so sequential or append-only naming schemes can concentrate traffic on a single partition.

When a partition becomes hot, your application might observe increased latency and receive HTTP 503 (Server Busy) or HTTP 500 (Operation Timeout) responses before the storage account approaches its documented scalability limits.

To mitigate hot partitions:

- Avoid sequential or append-only blob naming schemes that concentrate traffic on a single partition.
- Use an exponential backoff retry strategy when throttling errors occur.
- Increase request rates gradually when you introduce new workloads.

To detect throttling and identify the source of excessive demand, use Azure Monitor metrics and resource logs.

For more information, see [Mitigate hot partitions in Azure Blob Storage](storage-performance-mitigate-hot-partitions).
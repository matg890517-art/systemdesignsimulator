---
layout: Conceptual
title: Quotas for Azure Container Apps | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/azure/container-apps/quotas
breadcrumb_path: /azure/bread/toc.json
feedback_help_link_url: https://learn.microsoft.com/answers/tags/418/azure-container-apps/
feedback_help_link_type: get-help-at-qna
feedback_product_url: https://feedback.azure.com/d365community/forum/79b1327d-d925-ec11-b6e6-000d3a4f06a4
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
description: Learn about quotas for Azure Container Apps.
services: container-apps
author: craigshoemaker
ms.service: azure-container-apps
ms.topic: limits-and-quotas
ms.date: 2026-10-09T00:00:00.0000000Z
ms.author: cshoe
locale: en-us
document_id: 79eb2c12-e84d-a4a6-86ae-907e6196ad67
document_version_independent_id: 75ec0744-1ce8-4b51-7b29-0ae95c856f39
updated_at: 2026-10-16T22:20:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/azure-docs-pr/blob/live/articles/container-apps/quotas.md
gitcommit: https://github.com/MicrosoftDocs/azure-docs-pr/blob/b74f83cf9f73eea021c6d808f3261bd0ded238e2/articles/container-apps/quotas.md
git_commit_id: b74f83cf9f73eea021c6d808f3261bd0ded238e2
site_name: Docs
depot_name: Azure.azure-documents
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/Azure.azure-documents/{branchName}{pdfName}
word_count: 794
asset_id: container-apps/quotas
moniker_range_name: 
monikers: []
item_type: Content
source_path: articles/container-apps/quotas.md
cmProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/32e8f006-5597-4144-9ccc-778e20833eca
- https://authoring-docs-microsoft.poolparty.biz/devrel/68ec7f3a-2bc6-459f-b959-19beb729907d
spProducts:
- https://microsoft-devrel.poolparty.biz/DevRelOfferingOntology/bfbda2e5-bc4e-4e83-8c2a-41b7c4914a07
- https://authoring-docs-microsoft.poolparty.biz/devrel/90370425-aca4-4a39-9533-d52e5e002a5d
platformId: f3fab609-4449-0a5a-4042-0ddf98110016
---

# Quotas for Azure Container Apps | Microsoft Learn

Azure Container Apps quotas can apply to a subscription and region, a managed environment, or an application. The request process depends on whether the quota applies to the selected subscription and region or to one managed environment.

| Request path | Description | Scope | Submit requests through |
| --- | --- | --- | --- |
| [Subscription quota requests](quota-requests#subscription-quota-requests) | The request might be fulfilled automatically or routed to Azure Support for further review. | Subscription and region | [Azure Quota Management System](https://ms.portal.azure.com/#view/Microsoft_Azure_Capacity/QuotaMenuBlade/%7E/myQuotas) |
| [Managed environment quota requests](quota-requests#managed-environment-quota-requests) | The request might be fulfilled automatically or routed to Azure Support for further review. You must create a managed environment before you can request a quota limit that applies to it. | One managed environment | The environment's **Quota** page |

Note

A quota request might be routed to Azure Support as part of the review process.

## View current quota levels

You can view subscription quota usage through the [Azure Quota Management System](https://ms.portal.azure.com/#view/Microsoft_Azure_Capacity/QuotaMenuBlade/%7E/myQuotas). You can view managed environment quota usage on the environment's **Quota** page and through the Azure CLI.

In the Azure portal, select **Azure Container Apps** for **Provider**.

![Screenshot of provider and subscription dropdowns in the quota window.](media/quotas/azure-container-apps-quota-header.png)

Use the following command to view your quotas on a per-environment basis.

Before you run the following command, make sure to replace the placeholders surrounded by `<>` with your own values.

```azurecli
az containerapp env list-usages \
  --resource-group <RESOURCE_GROUP_NAME> \
  --name <ENVIRONMENT_NAME>
```

## When to request quota

If an environment or subscription reaches a quota limit, you might encounter:

- Scaling restrictions on an app
- Provisioning time-outs
- Container Apps environment or workload profile creation failures

Your default quotas depend on factors that include the age and type of your subscription and your service usage. If your app could receive thousands of requests per minute, check your current quota allocations before moving it into production.

If you encounter a *Maximum Allowed Cores exceeded for the Managed Environment* error, similar to the following example, you need to request a quota increase.

```text
Maximum Allowed Cores exceeded for the Managed Environment.

Please check https://learn.microsoft.com/en-us/azure/container-apps/quotas for resource limits
```

Other error messages could indicate that you've reached an environment or other quota limit. The Azure Quota Management System allows you to [monitor and alert](/en-us/azure/quotas/monitoring-alerting) on quota usage to proactively prevent constraints.

Note

An environment creation error caused by limited regional capacity isn't a quota issue. Increasing quota doesn't resolve a capacity constraint. If the error message links to [Troubleshoot environment capacity errors in Azure Container Apps](troubleshoot-environment-capacity), follow the retry and deployment planning guidance in that article.

## Quota types

Azure Container Apps implements different categories of quotas that govern resource allocation across different aspects of your apps. These quotas are organized into basic quotas that control fundamental resource limits, GPU quotas for applications requiring specialized compute capabilities, dynamic sessions quotas for session-based workloads, and quotas for Sandboxes and Express.

### Basic quotas

The following table lists the most requested quota changes. Subscription quotas apply per subscription, per region. Managed environment quotas require a separate request for each environment.

| Quota | Scope | Request | View | Remarks |
| --- | --- | --- | --- | --- |
| Managed Environment Count | Subscription and region | [Submit a subscription quota request](quota-requests#submit-a-subscription-quota-request) | Portal | The number of environments per region. |
| Managed Environment Consumption Cores | One managed environment | [Submit a managed environment quota request](quota-requests#submit-a-managed-environment-quota-request) | [Portal](quota-requests#submit-a-managed-environment-quota-request) or CLI | The maximum number of consumption cores allocated to the environment. This value is the sum of cores requested by each active replica across all apps in the environment. |
| Managed Environment General Purpose Cores | One managed environment | [Submit a managed environment quota request](quota-requests#submit-a-managed-environment-quota-request) | [Portal](quota-requests#submit-a-managed-environment-quota-request) or CLI | The total cores available to all general purpose (D-series) profiles within an environment. |
| Managed Environment Memory Optimized Cores | One managed environment | [Submit a managed environment quota request](quota-requests#submit-a-managed-environment-quota-request) | [Portal](quota-requests#submit-a-managed-environment-quota-request) or CLI | The total cores available to all memory optimized (E-series) profiles within an environment. |

### GPU quotas

| Quota | Scope | Request | View | Remarks |
| --- | --- | --- | --- | --- |
| Managed Environment Consumption NCA100 GPUs | One managed environment | [Submit a managed environment quota request](quota-requests#submit-a-managed-environment-quota-request) | [Portal](quota-requests#submit-a-managed-environment-quota-request) or CLI | The maximum number of consumption A100 GPUs available for serverless GPUs within an environment. |
| Managed Environment Consumption T4 GPUs | One managed environment | [Submit a managed environment quota request](quota-requests#submit-a-managed-environment-quota-request) | [Portal](quota-requests#submit-a-managed-environment-quota-request) or CLI | The maximum number of consumption T4 GPUs available for serverless GPUs within an environment. |
| Subscription NCA 100 GPUs | Subscription and region | [Submit a subscription quota request](quota-requests#submit-a-subscription-quota-request) | Portal | The maximum number of dedicated A100 GPUs that environments across this region can use. |

### Dynamic sessions quotas

| Quota | Scope | Request | View | Remarks |
| --- | --- | --- | --- | --- |
| Session pools | Subscription and region | [Submit a subscription quota request](quota-requests#submit-a-subscription-quota-request) | Portal | The maximum number of dynamic session pools per region. |

### Sandboxes and Express quotas

Note

Sandboxes and Express are limited to 2,000 cores. Express apps are limited to 30 replicas, and you can create up to 200 Express environments per region. Updates to the quota request pipeline are planned in the coming months. To request more quota, open a support request or work with your Microsoft account representative.
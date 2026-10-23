---
layout: Conceptual
title: Routing limits - Azure Front Door | Microsoft Learn
canonicalUrl: https://learn.microsoft.com/en-us/azure/frontdoor/front-door-routing-limits
breadcrumb_path: /azure/bread/toc.json
feedback_help_link_url: https://learn.microsoft.com/answers/tags/96/azure-front-door/
feedback_help_link_type: get-help-at-qna
feedback_product_url: https://feedback.azure.com/d365community/forum/8ae9bf04-8326-ec11-b6e6-000d3a4f0789?c=d47b0f41-8326-ec11-b6e6-000d3a4f0789
feedback_system: Standard
permissioned-type: public
recommendations: true
recommendation_types:
- Training
- Certification
uhfHeaderId: azure
ms.suite: office
adobe-target: true
author: halkazwini
learn_banner_products:
- azure
ms.collection: networking
ms.reviewer: halkazwini
description: This article helps you understand the composite limits around routing for Azure Front Door.
ms.author: halkazwini
ms.service: azure-frontdoor
ms.topic: concept-article
ms.date: 2025-09-25T00:00:00.0000000Z
locale: en-us
document_id: 79bbaba9-ac1a-1568-9dd5-03bba798292c
document_version_independent_id: a660a262-0bcc-d18f-3f07-bf085bdcd933
updated_at: 2026-07-17T22:12:00.0000000Z
original_content_git_url: https://github.com/MicrosoftDocs/azure-docs-pr/blob/live/articles/frontdoor/front-door-routing-limits.md
gitcommit: https://github.com/MicrosoftDocs/azure-docs-pr/blob/8fc2084444a0b3eea1d6fa93d477508422a272bf/articles/frontdoor/front-door-routing-limits.md
git_commit_id: 8fc2084444a0b3eea1d6fa93d477508422a272bf
site_name: Docs
depot_name: Azure.azure-documents
page_type: conceptual
toc_rel: toc.json
pdf_url_template: https://learn.microsoft.com/pdfstore/en-us/Azure.azure-documents/{branchName}{pdfName}
word_count: 507
asset_id: frontdoor/front-door-routing-limits
moniker_range_name: 
monikers: []
item_type: Content
source_path: articles/frontdoor/front-door-routing-limits.md
cmProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/b5e53e15-0a76-4936-b270-8b2badca62ac
spProducts:
- https://authoring-docs-microsoft.poolparty.biz/devrel/6908a4c7-0b59-4f8b-a00e-59c83ae0a04a
platformId: 38a0f6ab-7677-4f75-f6cf-2f54ae95338a
---

# Routing limits - Azure Front Door | Microsoft Learn

**Applies to:** ✔️ Front Door Standard ✔️ Front Door Premium ✔️ Front Door (classic)

Important

Azure Front Door (classic) retires on **March 31, 2027**. Because the service is retiring, it no longer supports profile creation, new domain onboarding, or managed certificates. To avoid service disruption, ⁠[**migrate to Azure Front Door Standard or Premium**](migrate-tier). For more information, see ⁠[**Azure Front Door (classic) retirement**](https://azure.microsoft.com/updates?id=azure-front-door-classic-will-be-retired-on-31-march-2027).

Each Front Door profile has a *composite route limit*.

Your Front Door profile's composite route metric is derived from the number of routes, and the front end domains, protocols, and paths associated with that route.

The composite route metric for each Front Door profile can't exceed 5000.

Tip

Most Front Door profiles don't approach the composite route limit. However, if you have a large Front Door profile, consider whether you could exceed the limit and plan accordingly.

The number of origin groups, origins, and endpoints don't affect your composite routing limit. However, there are other limits that apply to these resources. For more information, see [Azure subscription and service limits, quotas, and constraints](../azure-resource-manager/management/azure-subscription-service-limits#azure-front-door-standard-and-premium-service-limits).

## Calculate your profile's composite limit

The composite limit of a profile is the sum of the composite routes. Each route has a composite route metric, which is computed as follows:

### Composite route calculation

1. Select a route from your profile.
    1. Multiply the number of HTTP domains by the number of HTTP paths.
    2. Multiply the number of HTTPS domains by the number of HTTPS paths.
    3. Add the results of steps 1a and 1b together to give the composite route metric for this individual route.
2. Repeat these steps for each route in your profile.

### Example

Suppose you have two routes in your Front Door profile. The routes are named *Route 1* and *Route 2*. You plan to configure the routes as follows:

- *Route 1* has 50 domains associated to it, and requires HTTPS for all inbound requests. *Route 1* specifies 80 paths.
- *Route 2* has 25 domains associated to it. *Route 2* specifies 25 paths, and supports both the HTTP and HTTPS protocols.

The following calculation illustrates how to determine the composite route metric for this scenario:

```
Profile composite route metric = Route 1 composite route metric + Route 2 composite route metric
= Route 1 [HTTPS (50 Domains * 80 Paths)] + Route 2 [HTTP (25 Domains * 25 Paths) + HTTPS(25 Domains * 25 Paths)] 
= [50 * 80] + [(25 * 25) + (25 * 25)]
= 5250
```

The calculated metric of 5250 exceeds the limit of 5000, so you can't configure a Front Door profile in this way.

## Mitigation

If your profile's composite route metric exceed 5000, consider the following mitigation strategies:

- Deploy multiple Front Door profiles, and spread your routes across them. The composite route limit applies within a single profile.
- Use [wildcard domains](front-door-wildcard-domain) instead of specifying subdomains individually, which might help to reduce the number of domains in your profile.
- Require HTTPS for inbound traffic, which reduces the number of HTTP routes in your profile and also improves your solution's security.
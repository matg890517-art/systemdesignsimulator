# Catalogs and evidence

The engine contains **no provider-specific code** (F16). Provider catalogs are data plus adapters that map a real service onto canonical behavior.

## Three levels when you drop a tile

| Level | User chooses | Example |
| --- | --- | --- |
| 1. Kind | Generic behavior | Database |
| 2. Service | Real implementation | Cloud SQL vs Bigtable vs RDS |
| 3. Configuration | Capacity of that service | `n`, mean `S`, region, scaling |

The palette lists **services**, so placing a tile fixes kind. Services of one kind are not interchangeable (Lambda vs GKE).

Canonical kinds include: traffic generator (Clients), load balancer, gateway, service, worker, queue, event bus, cache, relational / NoSQL database, object storage, CDN.

Software engines such as PostgreSQL or Redis are **not** palette items; they are configuration of a service (for example the engine of RDS).

## Catalog files

| Path | Role |
| --- | --- |
| `web/src/features/catalog/entries.ts` | Service list (id, name, provider, category, docs URL, limits-on-page) |
| `web/src/features/catalog/verified-limits.ts` | Recorded Vendor-figure rows |
| `web/src/features/catalog/catalog.ts` | Palette grouping; Generic is the nine blocks |
| `web/src/features/catalog/provider-maps.ts` | 9-block AWS / Azure / GCP bindings |
| `web/src/features/catalog/limit-type-map.ts` | Limit-type mapping |
| [`component-links.md`](../component-links.md) | Same rows as a link + status table |
| `web/catalog md/` | Copied official pages used as reading notes |

Auth/Postgres are **not** the catalog. They wait for product Phase 4 persistence.

## Status labels

| Status | Meaning |
| --- | --- |
| **Verified** | Limits read and recorded (or the Oct 18 AWS spot check: Lambda, SQS, S3, CloudFront) |
| **Partial** | Page states some limits, or figures are guidance rather than quotas |
| **Listed (not checked)** | Official page is linked; figures not yet recorded |
| **No limits on page** | Linked page states no limits |

Reducing Listed is human work: open the page, quote the figure, URL, and date. Do not invent SKU prices, latencies, or quotas.

**Canonical 18** (first provider compare, Decision 3, amended Oct 23) is a recorded-figure set, not “only these tiles exist”: Lambda, ECS, Aurora, RDS, ElastiCache, MemoryDB, CloudFront, Application Load Balancer, SQS; AKS, Azure SQL, Cache for Redis, Service Bus; GKE, Cloud SQL, Memorystore, Cloud Load Balancing, Pub/Sub. Other Verified services (for example AWS Batch) sit outside that 18.

## Limit types (F26)

Every catalog value has a limit type:

- `hard_limit` — may ceiling the engine
- `adjustable_quota` — may ceiling the engine
- `best-effort` — default the user can override; **never** caps
- `performance guidance` — **never** caps

Unknown never caps.

## Calibration vs catalog

| | Catalog | Calibration profile |
| --- | --- | --- |
| Says | What a service **can** be configured to do | How a number **measured** |
| Holds | Kind mapping, supported fields, quotas, docs URL | Source URL, date, version, tier, region, request class, confidence |
| Is not | Proof of latency or throughput | A substitute for the catalog |

Calibration is a **full page** (`/calibration`): one profile per live Workspace card (titles and catalog icons). Unbound leftover names stay out of the list.

## Confidence (F28)

| Confidence | How it gets that label |
| --- | --- |
| **Unknown** | Empty. Shown as unknown. Does not cap. |
| **Estimated** | Typed by hand, or example `n` / `S` on palette drop / YouTube / Generic. No source URL. |
| **Vendor figure** | Source URL attached. “Source not checked” until confirmed. |
| **Measured** | Imported load-test CSV from a **real** run. Never from typed numbers. |

A fit of `S` and SCV from typed p50/p95 is still Estimated (Decision 16: no full distribution family in v1). P95 must be at least the median. Reset restores the example, not an empty card.

## Cost

C0: typed `$/hr` only. KPI shows partial N of M, `$/day` = ×24, `$/mo` = ×730 h. Not Simulated duration. Empty stays unknown.

C1–C4 (sourced SKUs, usage × λ, egress, compare) stay later. Decision 2: first provider compare is **capacity and limits only**. Do not guess prices from Catalog.

## Mixed providers (F29)

Each component carries its own provider. A hop that leaves a provider is marked; latency and capacity stay Estimated until measured.

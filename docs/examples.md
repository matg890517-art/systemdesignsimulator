# Examples

Two Load templates share the same engine. Both ship Estimated `n` and mean `S` so a Run has a queueing model. Those numbers are kind examples, not catalog quotas, not vendor quotes, not Measured.

## Generic 9-block

Canonical blocks: Clients, CDN, load balancer, service, cache, database, queue, worker pool, object store.

Load **Generic** (or AWS / Azure / GCP) for the same wiring with catalog bindings only. A modest example workload (about 290 rps mixed classes) keeps 8 × 20 ms services visible. The generic reference wires Read/Write toward CDN and Async/Bulk toward Queue.

This stack is the Phase 1 / Phase 5 reference. **Closing those phases still needs a real load test of this 9-block** (Decision 6). J12 A/B stay blocked until that recording exists.

On the 9-block both **CDN** and **Cache** are present on purpose:

- CDN hit rate splits HTTP reads; miss continues to origin.
- Cache hit rate splits application reads; miss continues to the database.

See [Engine — cache hit rate](engine.md#cache-hit-rate).

## YouTube (GCP)

Quoted design rebuilt from **palette GCP tiles**, not AWS and not Borg / Colossus / Argos (those are not catalog tiles).

Workload (Estimated, quoted daily rates / 86 400, rounded to 2 decimals):

- **100 000 000 views / day** ≈ 1 157.41 rps Read (watch path sized around that)
- **1 000 000 uploads / day** ≈ 11.57 rps Write / Bulk

Cache hit on Media CDN stays **unknown**. Do not type the informal “90%+” note.

### Tiles

Client sits outside one GCP environment (4×2). Titles are Config labels; catalog kind stays.

| Canvas title | Catalog tile |
| --- | --- |
| Client | Generic Clients |
| Cloud Load Balancing | Cloud Load Balancing |
| Upload Service | GKE |
| Video Consumer | GKE |
| Media CDN | Media CDN |
| Cloud Storage | Cloud Storage |
| Transcoder | Transcoder API |
| Metadata Processor | Cloud Run |
| Bigtable | Bigtable |

Node ids `glb` and `mediacdn` avoid colliding with the generic 9-block `lb` / `cdn` profiles.

### Hops (upload vs streaming)

```
Client → Cloud Load Balancing     R / W / B
         ├─ Write/Bulk → Upload Service → Cloud Storage (Bulk)
         │                 Cloud Storage → Transcoder (Bulk, async)
         │                 Transcoder → Cloud Storage (Write; not Bulk — avoids a Jackson loop gain ≥ 1)
         │                 Transcoder → Metadata Processor (Bulk) → Bigtable
         └─ Read → Video Consumer
                      ├─ Media CDN (Read, broadcast)
                      │     └─ miss · Read → Cloud Storage
                      └─ Bigtable (Read, broadcast)
```

There is **no Memorystore** on this example. Media CDN already has a cache-hit field for origin offload. A Cache tile would be a second layer (consumer → Redis → Bigtable). Add it only if you want to model that hop.

Simulated 60 s is under the 5 000 000-arrival guard. One day at these rates is not — use Analytic.

# Glossary

| Term | Meaning |
| --- | --- |
| **Offered** | Arrives at a component or hop |
| **Admitted** | Accepted into service or the queue |
| **Completed** | Finished successfully |
| **Dropped / rejected** | Lost at the node or refused |
| **ρ (util)** | λ / (`c` μ). Stable when ρ &lt; 1 |
| **S** | Mean service time |
| **n / c** | Server or slot count (concurrency) |
| **SCV** | Squared coefficient of variation (Allen-Cunneen) |
| **Jackson** | Linear traffic system λ = γ + Pᵀ λ |
| **Erlang C** | M/M/c wait probability / mean wait |
| **Allen-Cunneen** | G/G/c approximation using two SCVs |
| **Hockey-stick** | Wait exploding as ρ → 1 even while ρ &lt; 1 |
| **Headroom** | Max rps by bisection before SLO or the 70% util ceiling, plus N+1 |
| **Analytic** | Closed-form solve; percentiles labeled Analytic |
| **Simulated** | Seeded DES of the same scenario |
| **Instantaneous** | Canvas view of the last closed dt |
| **Average** | Canvas view 0 → playhead |
| **Unknown** | Empty field; does not cap |
| **Estimated** | Typed or example value; no source URL |
| **Vendor figure** | Source URL attached; not a load test |
| **Measured** | Imported real load test only |
| **hard_limit / adjustable_quota** | May ceiling the engine |
| **best-effort / guidance** | Never ceiling |
| **Kind** | Canonical behavior (cache, CDN, service, …) |
| **Catalog tile** | Real provider service mapped onto a kind |
| **Hop** | One directed edge; classes live on it |
| **Broadcast** | Copy the class to every target |
| **Weighted split** | Share the class by weight (not copy) |
| **Miss hop** | CDN/cache miss continuing to origin |
| **Traveling dots** | View of hop rps; not 1:1 with requests |
| **9-block** | Generic reference stack used for Phase 1 / 5 |
| **C0** | Typed `$/hr` cost only |
| **F / N / J** | Functional, non-functional, and test IDs in `full plan.md` |
| **E1–E4** | Engine slices; they do not renumber product phases 0–5 |

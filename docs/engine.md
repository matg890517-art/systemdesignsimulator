# Engine

Package: `web/packages/engine` (`@sds/engine`). Plain TypeScript. Nothing in this package imports React, MUI, the DOM, or TanStack. Workspace talks to it through typed messages; Simulated Run uses a Web Worker with 8 ms yields and cancel.

Product phases stay **0–5**. Engine slices **E1–E4** do not renumber them.

| Slice | What | Product phase |
| --- | --- | --- |
| **E1** | Closed-form steady state. Jackson + Erlang C + Allen-Cunneen. Hockey-stick, Analytic percentiles, headroom | Phase 1 |
| **E2** | Seeded DES as verifier of E1 (N7), then deeper runs | End of Phase 1, into Phase 2 |
| **E3** | Bursts, failures, retries, autoscale lag | Phase 4 (F8, F9) |
| **E4** | Monte Carlo ranges | Later — not product Phase 4 |

The fluid **rate** stepper is the **overload** branch only (ρ ≥ 1). It is not the sizing answer.

## Analytic (E1)

For each request class, solve Jackson traffic:

λᵢ = γᵢ + Σⱼ λⱼ · pⱼᵢ

Fan-out, cache hit ratio, read/write split, and replica weights become routing probabilities. Payload size is a bandwidth **check**, not a silent cap on λ. Cycles are allowed when loop gain &lt; 1; otherwise compile reports an infinite loop and stops.

Per node: servers `c`, mean service time `S`, μ = 1/`S`, ρ = λ / (`c` μ).

- **ρ &lt; 1:** Erlang C wait for M/M/c. Non-Poisson arrivals and service use Allen-Cunneen G/G/c with arrival and service SCV. Mean latency W = Wq + S. Queue length from Little’s law. Wait tail is closed-form M/M/c (approximate when SCV ≠ 1). Label **Analytic**.
- **Finite buffer:** M/M/c/K blocking; dropped = λ · Pb.
- **ρ ≥ 1:** status **Unstable**. No finite latency. Throughput = `c` μ. Bounded buffer → drops; unbounded → backlog growth.

Only catalog **hard_limit** and **adjustable_quota** may ceiling `c` or μ. Best-effort and guidance never cap. **Unknown never caps.**

Object store is M/G/c (`n` and `S`), so ρ is shown. External / cross-provider links are delay-only and Estimated until measured (Decision 17).

### Hockey-stick (J14)

Load 290 rps, each server μ = 50 rps (S = 20 ms). “Capacity ≥ load” says all three rows are fine. Erlang C does not.

| Servers | ρ | Mean latency W | p95 wait | Old rate model |
| --- | --- | --- | --- | --- |
| 6 | 97% | 111 ms | 290 ms | “OK, 300 ≥ 290” |
| 7 | 83% | 29 ms | 40 ms | “OK” |
| 8 | 73% | 23 ms | 17 ms | “OK” |

6 servers is technically stable and about 5× slower. That table is the Phase 1 acceptance case. It is **not** enough to close product Phase 1.

## Simulated (E2)

Seeded discrete-event of the same scenario schema. Own PRNG (`xoshiro128**`), one stream per (stable node id, purpose). Ties by `(time, seq)`. Same topology version, workload, mode, seed, and calibration give an identical timeline (N2).

- Duration is the DES clock. Do not split it into a short sample window vs a reporting horizon.
- Analytic ρ / wait / p99 are the same at 60 s or 1 day (steady state). Totals scale with T (requests = λ × T).
- Canvas paint is one tick per dt, live-paced. Not every DES event. Not 60 FPS.
- KPI latency is **mean wait from samples**, post-warm-up — not Analytic p99 relabeled.

UI guard: refuse Simulated when expected arrivals exceed **5 000 000**. This is tab safety, not a closed N6 and not a speed claim. The engine itself takes an `eventBudget` (design default 50 000 000). Rust/WASM is an option only if a named-machine benchmark requires it.

## Cache hit rate

CDN and Cache both expose a **cache hit rate** field. It is routing, not a second box:

- At hit rate `h`, fraction `h` stops at that node; `1 − h` continues downstream.
- **CDN** (Media CDN, CloudFront) is the edge HTTP cache. Miss goes to origin (object store / app).
- **Cache** (Memorystore, ElastiCache) is an application key-value store. Miss goes to a database.

They sit on different hops. A hit rate on Media CDN does not model Redis in front of Bigtable. Analytic uses the configured aggregate `h`. Zipf working-set is E2 against that `h`; it does not invent a Measured hit ratio. Do not type a quoted “90%+” unless it is sourced and labeled.

## Labels (never mix these)

| Label | When |
| --- | --- |
| **Unknown** | Empty field. Does not cap. |
| **Estimated** | Typed by hand, or example `n` / `S` on a drop. No source URL. |
| **Vendor figure** | A source URL is attached (“source not checked” until confirmed). |
| **Measured** | Only from a real imported load-test CSV. |
| **Analytic** | p50 / p95 / p99 from the closed-form solver. |

A result’s evidence is the **weakest** label among its inputs. Never invent SKU prices, latencies, or quotas. Do not claim 92% fidelity.

## What still blocks Phase 1 close

- Real load test of the 9-block reference stack (Decision 6)
- J12 A/B until that recording exists
- Named-machine DES benchmark before dropping the 5M UI guard
- N7 agreement tolerances frozen after that work (starting guess was ±5% mean / ±10% p99; current light-load graphs use mean 8% and p99 wait 30% when Analytic p99 ≥ 10 ms at ρ ≤ 0.85)

Details: [`engine-design.md`](../engine-design.md).

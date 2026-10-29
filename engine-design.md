# Real-base Core Engine: Design (v1)

Status: proposed, Oct 28, 2026. Replaces the engine text of Decision 18 once merged into the Full Plan.
Scope of this document: the engine only (model, solvers, simulator, outputs, tests). UI, cost and catalog content are referenced, not redefined.

## 1. Decisions this document makes

| # | Decision | Replaces |
|---|---|---|
| D19 | The core engine is a **hybrid**: an analytic queueing solver and a seeded discrete-event simulator (DES) share one scenario schema. Results are labeled **Analytic** or **Simulated**. | Decision 18 (rate model as core). The rate model survives only as the overload branch. |
| D20 | Engine is plain TypeScript in a Web Worker, independent of React. Rust/WASM only if a benchmark shows TypeScript cannot meet the targets in section 9. | Discrete-event cap of 20,000 arrivals (Decision 8). Replaced by an event budget. |
| D21 | Own PRNG (xoshiro128**) with one stream per (stable node id, purpose). No library randomness, no `Math.random`. | none |
| D22 | A result's evidence label is the weakest label among its inputs (Estimated < Vendor figure < Measured). Only calibrated, imported load-test data can produce Measured. | none |
| D23 | Analytic E1 is **steady state only**: constant load, no faults. Simulated may show the empty-system transient and a Ramp (0→target); N7 still compares the post-warm-up window. Step, spike, faults and Monte Carlo come later (section 10). | none |

## 2. Goals and non-goals

Goals
- Given a workload and an architecture, report stability, utilization, latency percentiles, queues, errors, bottleneck and headroom per component.
- Be reproducible: the same scenario JSON and seed always give a byte-identical result.
- Be checkable: every analytic number can be compared to a simulated number of the same scenario.
- Never silently cap or hide overload.

Non-goals (for v1)
- Cost (deferred; see plan).
- Faults, retries, autoscaling lag, circuit breakers (phase E3).
- Multi-region WAN modeling, GC pauses, CPU cache effects.
- Any speed claim (no "60 FPS", no "N events/s") until measured on a recorded benchmark.

## 3. Package layout

```
engine/
  schema/      scenario + result types, JSON schema, version constant
  compile/     validation, graph normalization, catalog binding
  analytic/    traffic solver, queue formulas, percentile sampler, headroom
  des/         clock, heap, PRNG, distributions, node/edge processes, metrics
  verify/      Little, conservation, analytic-vs-DES comparison
  worker/      message protocol, chunked run loop, cancellation
```
Rules: nothing in `engine/` imports React, MUI, the DOM or TanStack. The UI talks to the worker through typed messages only.

## 4. Scenario schema (input)

```
Scenario {
  schemaVersion, seed,
  run: { duration_s, warmup_s, replications, eventBudget },
  classes: [{ id, name }],                 // Read, Write, Async, Bulk + custom
  nodes:   [Node],
  edges:   [Edge],
  workload:[{ clientId, classId, profile: 'constant'|'ramp', rate_rps, ramp_s? }]
      // Analytic always uses rate_rps. Simulated Ramp: λ(t)=rate_rps*min(1, t/ramp_s)
  targets: { sloP99_ms?, utilizationCeiling }                       // default ceiling 0.70
}

Node {
  id (stable, never an array index), kind, catalogId?, provider?,
  servers: { instances, concurrencyPerInstance },       // c = instances * concurrency
  service: { dist: 'lognormal'|'exp'|'det'|'gamma'|'empirical',
             mean_ms | p50_ms+p95_ms, scv?, evidence },
  limits:  [{ type: 'hard'|'quota'|'best-effort'|'guidance', value, unit, source, readOn }],
  buffer:  { K | null },                                // null = unbounded
  timeout_ms?,
  kind-specific: cache{ workingSet, cacheSize, zipfS }, lb{ imbalance }, queue{ consumers }
}

Edge {
  from, to,
  perClass: { [classId]: { routing:'single'|'weighted'|'broadcast', weight, calls (m_e, default 1),
                           kind:'sync'|'async', parallel:boolean, latency:{dist, mean_ms, evidence} } }
}
```
Notes
- An empty class map on an edge is zero flow (existing plan rule).
- Only `hard` and `quota` limits may cap `servers` or service rate. `best-effort` and `guidance` figures are defaults the user can override and never cap anything (existing plan rule).
- Provider is chosen per component; the engine contains no provider-specific code (F16).

## 5. Compile step (shared by both solvers)

1. Drop edges whose endpoints do not exist; dedupe parallel A->B edges per class. Canvas “can A connect to B?” is the F1 kind matrix; compile does not drop hops by kind. Jackson still conserves cycles on legal hops when loop gain < 1.
2. Entry nodes = clients with outgoing edges. Disconnected nodes receive no traffic and are reported as "not wired".
3. Async edges carry flow but are excluded from user-facing path latency; async chains get their own latency report.
4. Detect cycles. A cycle is allowed only when the loop gain is below 1 (retry/feedback); otherwise report "infinite loop" and stop.
5. Bind catalog defaults (c, service time, limits) and stamp each number with its evidence label and source.
6. Output a normalized model plus a list of warnings. Warnings never block a run unless the model is invalid.

## 6. Analytic solver (steady state)

### 6.1 Traffic equations (per class)
For each class: lambda = gamma + P^T lambda, where `P[j][i]` = routing probability times fan-out m_e from j to i.
- DAG: one topological pass.
- Feedback: solve the linear system (I - P^T) lambda = gamma by Gaussian elimination; reject if the spectral radius of P is 1 or more.
- Weighted routing: probabilities from weights. Broadcast: probability 1 on every target. Fan-out multiplies the rate on that edge.

### 6.2 Per node
- Service rate per server mu = 1 / mean service time. Offered load a = lambda / mu. Utilization rho = lambda / (c * mu).
- **rho < 1 (stable)**
  - Erlang C: C(c, a) = [ a^c / c! * 1/(1 - rho) ] / [ sum_{k<c} a^k / k! + a^c / c! * 1/(1 - rho) ].
  - M/M/c mean wait: Wq = C / (c*mu - lambda).
  - General arrivals and service (Allen-Cunneen): Wq ~ Wq(M/M/c) * (ca^2 + cs^2) / 2.
  - Mean time in node W = Wq + S. Mean number in node L = lambda * W (Little).
  - Wait tail (M/M/c): P(Wq > t) = C * exp(-(c*mu - lambda) * t). For G/G/c use the same form with rate C / Wq so the mean matches. Marked approximate.
  - Output variability for the next node (Whitt QNA linking): cd^2 = 1 + (1 - rho^2)(ca^2 - 1) + rho^2 (cs^2 - 1) / sqrt(c). Approximate.
- **Finite buffer** (K total places): M/M/c/K blocking probability Pb; throughput = lambda * (1 - Pb); dropped = lambda * Pb.
- **rho >= 1 (unstable)**
  - Status = Unstable. No finite latency is shown.
  - Throughput = c * mu (capped). Excess flow = lambda - c*mu.
  - Bounded buffer: excess becomes drops at that rate. Unbounded: backlog grows at that rate (req/s) and the UI shows time to exhaust a stated memory or queue limit if one is set.
  - Downstream nodes receive only the capped flow.
- **Timeout**: error fraction = P(W > timeout), counted as an error (no retry in v1).

### 6.3 Component kinds
| Kind | Model |
|---|---|
| Server pool / service | M/G/c as above |
| Load balancer | Two or more non-broadcast hops split by weight (Single backends share equally). `imbalance` d makes the hottest member see (1 + d) * lambda / n |
| Cache | All requests visit the cache; hit ratio h = H(C, s) / H(N, s) with H(n, s) = sum_{i=1..n} i^(-s) (Zipf, static popularity, ideal policy). Misses continue downstream; writes follow their class edges |
| Database | M/G/c with c = connection pool (or hard limit); read and write classes may have different service times |
| Queue / broker | Producer rate versus consumer capacity. Reports steady lag (M/M/c wait of consumers) or backlog growth if rho >= 1 |
| CDN | Hit ratio offloads origin; edge capacity from catalog quota |
| External | Fixed latency distribution, no queue |

### 6.4 Path latency
- Per class, per sync path: sum of visit ratio x node sojourn time, plus edge latencies.
- Percentiles come from a **seeded sampler** (default 20,000 draws, own PRNG): draw each node's sojourn (wait mixture + service distribution) and each edge latency independently; sum along sequential hops; take the max across `parallel` branches. Independence is an assumption and is labeled.
- Means are exact sums; percentiles are sampled. Both are labeled Analytic.

### 6.5 System outputs
- Stability: Stable, Saturating (rho above ceiling), Unstable.
- Bottleneck: highest rho; and the first node whose removal of one server unit most reduces path p99 (sensitivity).
- Headroom: bisection on a common scale factor s on all client rates until a target breaks (utilization ceiling or SLO p99). Reports max rps and the first-failing node. 2x, 5x and 10x are shortcut scale buttons.
- N+1 check: re-solve with one unit removed per tier; report which tiers fail.

### 6.6 Status thresholds (defaults, adjustable)
Healthy rho < 0.70; Warning 0.70 to 0.85; Critical 0.85 to under 1; Unstable 1 or more.

## 7. Discrete-event simulator

### 7.1 Clock and queue
- Time is integer microseconds held in a JS number (safe to about 285 years of simulated time).
- Event heap: binary min-heap in typed arrays, ordered by (time, seq). `seq` is a monotonically increasing counter, so ties are deterministic.
- Single-threaded loop inside the worker. The loop processes events in slices of at most about 8 ms of wall time, then yields so cancel and progress messages work.

### 7.2 Randomness
- PRNG: xoshiro128**, seeded through splitmix32. Implemented in the engine, not imported.
- One stream per (stable node id, purpose): arrivals, service, routing, network, cache. Stream seed = splitmix(seed XOR hash(id, purpose)). Adding or removing an unrelated node does not change other nodes' streams (common random numbers, so alternative designs compare fairly).
- Distributions: exponential (inverse CDF), lognormal (Box-Muller, spare value cached deterministically), gamma (Marsaglia-Tsang), deterministic, empirical (inverse CDF of an imported sample), Zipf (precomputed CDF + binary search).
- Lognormal fit from median and p95: sigma = ln(p95 / p50) / 1.6449, mu_ln = ln(p50); mean = exp(mu_ln + sigma^2 / 2); cs^2 = exp(sigma^2) - 1.

### 7.3 Entities and processes
- Requests live in structure-of-arrays typed arrays with a free list: id, class, birth, current node, parent, deadline.
- Arrival at a node: if busy servers < c, start service and schedule a departure; else if queue length < K, enqueue (FIFO in v1); else drop and count a buffer error.
- Departure: route by the edge rules (single/weighted/broadcast, m_e calls), draw an edge latency, schedule arrival at the next node.
- Sync fan-out: the parent waits for a join counter (all children, or max if `parallel`). Async edges are fire-and-forget with their own latency series.
- Timeout (v1): a request that finishes after its deadline is counted as a timeout error. Cancellation of in-flight work arrives with E3.

### 7.4 Metrics collection (constant memory)
- Latency: log-linear bucket histogram per node, class and path, 1 percent relative error, giving p50, p95, p99, p99.9 without storing samples.
- Utilization and queue length: time-weighted integrals.
- Counters: arrived, completed, dropped (buffer), timed out, in flight.
- Time series for charts and playback: sampled every `dt`, decimated for display.

### 7.5 Statistics
- Warm-up: discard everything before `warmup_s` (default 20 percent of the run); optional MSER-5 detection.
- Batch means: split the post-warm-up period into 20 batches, report mean with a 95 percent interval (t = 2.093).
- Replications: R seeds (default 5); report across-replication intervals. Seeds derive from the base seed.
- Event budget (default 50,000,000, to be tuned by benchmark): the run stops with a clear message instead of freezing the tab.

### 7.6 Built-in self-checks (run on every simulation)
1. Little: |L - lambda * W| / L under 1 percent per node.
2. Conservation: arrived = completed + dropped + timed out + in flight.
3. Utilization identity: busy time / (c * T) matches lambda * S / c within the interval.
Any failure marks the run "Invalid" and shows which check failed.

## 8. Result schema (output)

```
Result {
  engineVersion, schemaVersion, seed, mode:'analytic'|'simulated', evidence, warnings[],
  nodes[id]:  { lambda, rho, status, Wq_ms, W_ms, p50, p95, p99, L, Lq, throughput, dropRate, timeoutRate },
  edges[id]:  { flow_rps per class },
  classes[id]:{ pathLatency{mean,p50,p95,p99}, errorRate, asyncLatency? },
  system:     { stability, bottleneck, headroom_rps, firstFailing, sensitivity[], nPlusOne[] },
  interval?:  { ci95 per metric, replications },     // simulated only
  checks?:    { little, conservation, utilization }   // simulated only
}
```
Evidence rule (D22): `evidence` = weakest input label. The result badge shows that label next to Analytic or Simulated. Measured appears only when every service-time input came from an imported load test (Calibration). No percent-accuracy claim is ever shown.

## 9. Verification and acceptance

Textbook cases (exact)
- M/M/1, S = 20 ms, rho = 0.8: W = S / (1 - rho) = 100 ms (5 x S).
- M/D/1: Wq = rho * S / (2 * (1 - rho)).
- M/M/c reference, lambda = 290 rps, mu = 50 rps per server: c = 6 gives rho 0.967, C 0.909, mean time in node 110.9 ms; c = 7 gives rho 0.829, C 0.548, 29.1 ms; c = 8 gives rho 0.725, C 0.312, 22.8 ms.
- M/M/1/K blocking probability and M/M/c/K match the closed forms.
- Two-tier tandem (Jackson): node latencies add.

Property tests
- Little's law and flow conservation hold on random graphs.
- Latency never decreases as load rises.
- Adding a server never increases any node's rho.
- Weighted routing sums to 1; broadcast duplicates flow.

Determinism tests
- Same scenario and seed twice: byte-identical result.
- Adding an unconnected node leaves every other node's numbers unchanged (stream isolation).
- Event ties resolve by seq.

Agreement test (analytic vs simulated)
- Five reference architectures (generic web tier, cache-aside, queue worker, three-tier with LB, fan-out service).
- Initial target: mean latency within 3 percent and p99 within 8 percent when rho is 0.85 or below. Tolerances are confirmed or revised after the first runs and then frozen as regression limits. Outside that band the UI shows both numbers rather than hiding the gap.

Benchmark (recorded, not claimed)
- Events per second and peak memory for the five architectures on a named machine and browser. Published numbers must name that machine. If TypeScript misses the budget, revisit Rust/WASM (D20).

## 10. Build order and gates

| Step | Deliverable | Gate |
|---|---|---|
| E1.1 | Schema, compile, evidence labels | Invalid inputs rejected with clear messages |
| E1.2 | Traffic solver | Conservation tests pass |
| E1.3 | Queue formulas (Erlang C, Allen-Cunneen, M/M/c/K) | Textbook cases pass to 4 digits |
| E1.4 | Component kinds incl. Zipf cache | Cache hit ratio matches closed form |
| E1.5 | Path sampler, headroom, sensitivity | The 6/7/8-server reference reproduced exactly |
| E1.6 | DES core (clock, heap, PRNG, nodes, metrics) | Determinism tests pass |
| E1.7 | Self-checks, warm-up, batch means, replications | Little and conservation pass on all five architectures |
| E1.8 | Worker protocol, progress, cancel, event budget | Cancel works mid-run; no UI freeze |
| E1.9 | UI wiring: Analytic/Simulated toggle, results, hockey-stick chart | Both views show the same scenario |
| E1.10 | Calibration fit (median/p95, empirical CSV) | Only imported tests can show Measured |
| E1.11 | Agreement test + benchmark | Tolerances recorded |

Later phases
- **E2** Workload dynamics: Poisson, step, spike (Ramp pulled forward for Simulated; Analytic still constant).
- **E3** Faults and control loops: crash, latency injection, link cut, packet drop, partitions, retries with budgets, circuit breakers, autoscale lag, request cancellation.
- **E4** Monte Carlo ranges (e.g. "p99 under 300 ms in 94 percent of runs"), sensitivity sweeps, 2x/5x/10x scenario runs.
- Cost: C0 is typed `$/hr` (day ×24, month ×730 h) in calibration; catalog has no SKU prices. C1+ reads sourced pages with URL and date (Decision 2). Engine does not use cost.

## 11. UI mapping

- Run bar: **Analytic | Simulated** replaces Fluid | Discrete.
- Workload tab: constant is the Analytic λ. Simulated may Ramp 0→target over ramp seconds (default = warm-up). Poisson/step/spike stay later E2.
- Fault section: visible but disabled, labeled "Phase E3".
- Results: per-node card with utilization gauge and p50/p95/p99; hockey-stick chart (latency versus load per component); bottleneck and headroom banner; stability chip; evidence badge.
- F30: Analytic hockey-stick is the proof. Simulated playback reads the decimated DES series (including warm-up ticks). Show mode Instantaneous = last 1 s of simulated time (not dt); Average = 0→playhead (lerped). Queue depth is live; traveling dots follow the painted hop rate. Visual only; no accuracy claim. Analytic has no timeline.

## 12. Known limits and risks

- Allen-Cunneen and the QNA linking are approximations; error grows at rho near 1 and with high variability. The agreement test and the side-by-side display are the control.
- Path percentiles assume independent hops; correlated slowdowns (shared dependency) are not captured until E3.
- Zipf hit ratio assumes static popularity and an ideal policy; LRU/LFU differences (for example the Che approximation) are a later refinement.
- FIFO only in v1; priority and processor-sharing disciplines are later.
- Catalog numbers capped as hard limits or quotas are only as current as their read date; the UI shows that date.

## 13. Edits this implies in the Full Plan (for the merge step)

- Decision 18: replace with D19 to D23; mark Decision 18 superseded on Oct 28, 2026.
- Decision 8 (Discrete cap of 20,000 arrivals) and N6: replace with the event budget.
- N4: remove "60 FPS canvas"; state that no frame-rate or speed claim is made.
- F5: constant profile for Analytic; Simulated may Ramp 0→target. Other profiles stay later E2.
- F8: moves to E3; Fault section disabled until then.
- F30: Analytic hockey-stick; Simulated playback reads the decimated series.
- Architecture and stack table: align with the tech stack file (TanStack Start, Store/Charts marked Evaluate, Drizzle Evaluate); remove Zustand and Redis rows unless re-decided.
- Roadmap: insert E1.1 to E1.11, then E2 to E4.
- Changelog: Oct 28, 2026 row for the engine redesign.

# System Design Simulator: Full Plan

Oct 13, 2026 · @Iron Bunny

A browser-based simulator where engineers draw an architecture, set a workload, and see where it saturates, fails or costs too much, using calibrated real-world numbers.

## Vision and scope

The simulator is a capacity-planning tool: users model an architecture, apply a workload, and learn where it saturates, fails or costs too much before anything is built.

- **Users:**~~ ~~engineers and architects sizing and validating distributed systems.
- **Core promise:** results come from calibrated real-world numbers (service times, pool sizes, throughput limits), not from guesses.
- **Two source specs:** the Enterprise System Design Simulator blueprint (product shell, canvas, node types, fault injection) and SysLab Architect (graph and matrix model, fluid-flow versus discrete-event modes, invariants). This plan merges them. **Phase 1 engine (Decision 19, Oct 28; SysSimulator pages read Oct 28):** one schema, two views. Analytic (Jackson, Erlang C, Allen-Cunneen) is the sizing answer. Seeded discrete-event is the verifier, then bursts and faults. The fluid rate stepper is the overload branch only. SysSimulator’s public speed claims are not copied.
- **Assumption:** "real-base" is read as "grounded in real benchmark data". Confirm or correct this in the open decisions.

**Out of scope for v1:** exporting Terraform or CloudFormation, multi-region network modeling, and team collaboration features.

## Competitive landscape

Our target is to beat four existing simulators by combining what each does best with something none of their pages show: simulation numbers that come from cited, calibrated data. Findings below come from screenshots you supplied on 14 Oct 2026, so they show one screen of each product and nothing I could click or run.

| Simulator | Learn from it | What the screenshot shows | Gap we can exceed |
| --- | --- | --- | --- |
| [SyDe](https://syde.cc/) (v1.8) | More detailed components | Three stages (Design, Dev Guided, Prod Sim) plus Wiki and Community tabs; palette grouped by category (Client-Side 10 types, Infrastructure 7); Flow View filter for Read, Write and Async traffic; Lanes view; Security layer with a posture score (36/100, high risk, 4 modeled threats, 24 controls); quick-start templates (E-Commerce, AI RAG, Payments, Secure Multi-Site); import from Terraform, Kubernetes, JSON, XML or Mermaid; step-by-step design analysis guide | The config panel was not open, so per-component parameter depth is unconfirmed; several palette entries share one generic icon; no run metrics visible |
| [SysSimulator](https://syssimulator.com/simulator) | Clean UI | Dark canvas; each node shows live rps, p99 and a utilization bar; edges labeled by protocol (HTTPS, SQL queries, Load balanced) with animated flow; top bar with RPS, latency, error rate and bottleneck count; Simulate, Chaos, Cost, Metrics and Blueprints buttons; speed and traffic controls; AI-era components (Agent Runtime, MCP Tool Server, Vector Store, Tool Registry) | Top bar says 100 RPS but the client node shows 20 rps, and I cannot reconcile the figures from one frame; no source shown for latency numbers |
| [SysLab](https://syslabs.app/) | Tutorial guideline | Scenario workspace ("Design a File Storage Service") with Brief, Practice Mode, a countdown timer (119m left), Evaluate, AI Mentor, plus Scenarios and Learn tabs; each node shows utilization and estimated cost per hour; results panel with a health score (56), RPS, average, p50 and p95 latency, a 60-second throughput and latency chart, and a bottleneck list with advice (a worker at 87% utilization; "queueing delay starts compounding past roughly 75%") | The 75% threshold looks like a rule of thumb with no source or calibration shown; the auto-laid-out canvas is crowded with crossing edges |
| [SystemLore](https://systemlore.com/) | Game-like framework | Endless "Keep it alive" mode with a HUD (RPS, P95 against a 300 ms target, error %, cache hit %, cash, running cost per second, score); random incidents such as viral traffic with response choices (add app servers, rate-limit everyone, cache the hot pages, serve a static fallback); a shop bar pricing each component ($17 to $40); animated request particles | Abstract circles and game money rather than an engineering model; no per-class traffic |

**What we take from each:**

| ID | Requirement | Learned from | Priority |
| --- | --- | --- | --- |
| C1 | Clean canvas: live rps, Analytic p99 and utilization on every node, protocol-labeled hops, one summary bar. Animated edges are not Phase 1 (Decision 18–19: hockey-stick, not particles) | SysSimulator | P0 |
| C2 | Scenario-based tutorials: brief, hints, an evaluate step, an optional timer, and a mentor that explains each result | SysLab | P1 |
| C3 | Challenge mode: incident events with response choices, a running cost, a score and a post-mortem | SystemLore | P2 |
| C4 | Deep component models: every behavior-changing parameter configurable and explained in a config panel; palette grouped by category | SyDe | P0 |
| C5 | Blueprint and quick-start template library, each with its calibration source | SysSimulator, SyDe | P1 |
| C6 | Bottleneck explainer: for each bottleneck show the cause, the numbers (utilization, queue length, expected wait from the queueing model) and a suggested fix, derived from the model rather than a flat threshold | SysLab | P0 |
| C7 | Canvas filter by request class (read, write, async) | SyDe | P1 |
| C8 | Import a topology from Terraform, Kubernetes, Mermaid or JSON (import only; export stays out of v1) | SyDe | P2 |

**Where we exceed all four (the model, not the demo):** every number shows its source and confidence (calibration library); edges carry typed requests instead of one traffic number; two run modes on one topology (analytic steady-state, then discrete-event); deterministic replay and flow-conservation checks; **hockey-stick wait** (Erlang C) so 6 servers at 97% util is not “OK” just because 300 ≥ 290. Fidelity against a real load test is still blocked (Decision 6). C1’s **animated edges** are not the Phase 1 answer (Decision 18 amended). C1 to C8 are merged into the requirements table: C1 into F7 and F30, C4 into F3, and C2, C3, C5, C6, C7, C8 as F20, F21, F22, F23, F24, F25.

Sources: [SysSimulator](https://syssimulator.com/simulator), [SystemLore](https://systemlore.com/), [SyDe](https://syde.cc/), [SysLab](https://syslabs.app/) (page not readable). Screenshots of all four simulators were supplied by you on 14 Oct 2026.

## Multi-cloud: one engine, provider catalogs as data

The simulator is cloud-agnostic: one simulation engine for distributed-system behavior, with AWS, Azure, GCP, Kubernetes and generic components added as catalogs of data and capability adapters. AWS is one supported environment, never the core model.

**Generic core and catalogs.** Every component is defined once in a canonical, provider-neutral model (concurrency or server count, service time per request class, queue capacity, throughput limit, scaling policy, failure settings, payload size, cost inputs). A catalog entry maps a real service onto that model and keeps its own constraints (SKU, region, quotas, scaling limits, consistency and durability behavior). Services from different providers are never treated as exact equivalents, and unknown fields are shown as unknown.

**Catalog and calibration stay separate.** A catalog entry says what a service can be configured to do. A calibration profile says how it measured: source URL or dataset, capture date, software or service version, region and tier, request class, configuration, and a label of Measured, Vendor figure or Estimated. A catalog entry is never proof of a latency or throughput value, and no benchmark, price or quota is invented. Provider comparisons use the same workload and topology shape, with capacity, tiers, quotas and costs set from sourced inputs.

**Both run modes use the same canonical behavior,** even when a service exposes only part of it. The first validation target is one reference architecture built from generic components, then mapped to AWS, Azure and GCP.

The requirements for this section are F15 to F19 in the Requirements table.

**Decisions so far**

- Default request classes are Read, Write, Async event and Bulk, and users can add custom classes.
- Calibration is a full page, not a side panel. It is where every number's source, date and confidence is kept.
- **T**he provider is chosen per component, not per project. The Workspace palette lists provider services directly (AWS, Azure, GCP, Kubernetes) plus a Generic group, so one design can mix providers. The Catalog page is for browsing catalogs and comparing providers; a design does not have to start there.
- **Delete a component.** Select it, then press Delete or Backspace, or use Delete in the toolbar or Config panel. Attached edges go with the node. Deleting a service leaves its environment box. Deleting a selected environment ungroups; the services stay. Typing in a field does not delete.
- **Environment boxes.** Drop Environment from AWS, Azure, GCP or Kubernetes only. Generic has no Environment tile and no Environment inspector option — Generic is the nine canonical blocks, not a cloud account. Group still makes a Subsystem box. Same behavior as the YouTube example boxes: drag the box and contained services move with it; drag a corner or type width/height to resize; rename and recolor in Config. The box is a background layer: every service card paints above it. Drop or drag a service onto the box to contain it; drag it out of the box, or Config “Remove from environment”, to disconnect. One drop creates one box. One level only. The box is layout, not an engine node, and is not F13 nested-as-one-node.
- **Connect components.** Drag from a source handle (right or bottom) to a target handle (left or top), or click Connect and then two components. Clients only emit load: they cannot be a target, and two Clients cannot connect. One directed hop per pair; extra request classes live on that edge (F4, F19), not a second parallel line. Cross-provider edges stay Estimated (Decision 17). Kind-to-kind is a product matrix (not Jackson): any-to-any was not the engine model. Families: Clients, CDN, Load balancer, Service/worker (gateway included), Cache, Database, Object store, Queue (event bus included). Environment boxes are never hops. Jackson still allows cycles on *legal* hops (service → LB retry) when loop gain < 1. The matrix keeps the Generic 9-block and YouTube example legal, including CDN origin miss (Media CDN → Cloud Storage) and Cloud Storage → Transcoder.

| From → To | Clients | CDN | LB | Service/worker | Cache | DB | Object | Queue |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Clients | — | yes | yes | yes | yes | yes | yes | yes |
| CDN | — | yes | yes | yes | yes | yes | yes | — |
| Load balancer | — | yes | yes | yes | yes | yes | yes | yes |
| Service/worker | — | yes | yes | yes | yes | yes | yes | yes |
| Cache | — | yes | yes | yes | — | yes | yes | — |
| Database | — | — | yes | yes | — | — | yes | yes |
| Object store | — | yes | yes | yes | — | — | yes | yes |
| Queue | — | — | yes | yes | — | yes | yes | yes |
- **Icons.** Follow Real-base DS/Icons. Palette tiles and canvas cards always show a 20px / 16px glyph. Service is the original service mark; Normal is the generic kind shape. Switch with Icons → Service | Normal under the palette search row.
- **Two palette layouts.** The ▦ / ☰ control is in the palette search row, next to Search services. ▦ is button view (icon above, label below, 68px tile, status dot top-right). ☰ is list view (16px icon, name, limits word) and is the default. One provider folder is open at a time; Generic starts open; categories collapse under it. Search opens every matching folder. Load at the bottom replaces the canvas with Generic, AWS, Azure or GCP (same 9-block wiring, catalog bindings only) or the YouTube example.
- **Run mode.** Phase 1 default is **Analytic** (closed-form steady state). Discrete-event sits next to it as the verifier (engine slice E2) and later for bursts and faults (E3). The Fluid/Discrete toggle in the shipped UI is the old pair; wiring Analytic is Decision 19. Same topology either way. Analytic p50/p95/p99 are labeled **Analytic**, never Measured. Discrete KPI latency is mean wait from samples. The fluid **rate** stepper is not deleted: it is the overload branch when ρ ≥ 1.
- **Node cards.** After a Phase 1 run each card shows ρ, wait, Analytic percentiles, queue length (Little’s law) and throughput. Status is Stable, Saturating or Unstable. A traffic generator emits; it is not scored as 100% loss. Rename a service in Config **Title**; the catalog kind does not change (YouTube Client is Generic Clients; Upload Service and Video Consumer are GKE; Transcoder is Transcoder API; metadata is Bigtable).
- **Edge classes.** Click the line, not the node. The Edge tab turns Read / Write / Async / Bulk on or off and sets routing (single, weighted, broadcast), weight, call kind, fan-out and latency. Clients rates come from the **Workload tab** (already its own tab): one rate block per Clients card, all four classes, empty class = 0. Duration, dt and seed are one run clock (60 s, 0.1 s, 4821). Phase 1 Analytic uses the **constant** profile plus arrival SCV for Allen-Cunneen (this is λ). Simulated may use **Ramp** (offered 0 → target over ramp seconds, then hold). Poisson, step and spike wait for later E2. The generic reference wires R/W to CDN and A/B to Queue. Class chips above the canvas only hide paths.
- **Faults tab.** Already its own Workspace tab (not buried in Config). Phase 1 ignores faults. The tab stays visible and is labeled engine slice **E3** (product Phase 4, F8): node crash, latency spike, link cut, packet drop. Do not run faults through the steady-state solver.
- **Discrete-event guard.** Discrete Run is refused when expected arrivals exceed 5_000_000, so the tab does not freeze. YouTube 60 s Simulated (~71k from 100M views/day + 1M uploads/day) is allowed. YouTube 1 day (~102M) and 9-block 1 day at 290 rps (~25M) are still refused — use Analytic. This is tab safety, not a closed N6 and not a 60 FPS claim.
- **How a Run looks (Decision 18 + 19, amended Oct 29).** Analytic is steady-state: frozen hops that add up (290 = 240 + 50) are Jackson conservation, not a bug. The professional Analytic proof is the **hockey-stick**: 6 servers at 290 rps / 20 ms is technically stable (ρ = 97%) and about 5× slower than 8 servers. Simulated is the time series of the same scenario: DES events span the full Workload **Duration**; the canvas paints **one tick per dt** as that time becomes due (queues fill from empty; Ramp starts offered load at 0). **Show mode** (not the engine): Instantaneous paints ρ as % of limit and hop `/s` in the last **dt**. Average paints 0→now and lerps between samples. Instantaneous holds each closed dt sample and does not paint the empty t=0 snapshot (0 s window). No VCR scrubber. Not every DES event, not 60 FPS. Analytic ignores Show mode (one solve). Traveling dots are a view of the painted rate, not a second engine. KPI stays post-warm-up.
- **Duration is the DES clock (Oct 29, 2026).** Do **not** split Duration into a short sample window vs a 1-day reporting horizon. Simulated `duration_s` is the Workload Duration. Analytic ρ, wait and p99 are the same at 60 s or 1 day (steady state); totals scale with T (requests = λ × T). The 5 000 000-arrival **guard still refuses** Simulated when `Σ class rps × peakFactor × durationSec > 5_000_000` (9-block 290 rps × 1 day ≈ 25M is blocked; YouTube 60 s ≈ 71k is not; YouTube 1 day ≈ 102M is blocked). Use Analytic for day-scale. No 60 FPS claim. No Measured. Do not close Phase 1.
- **Live pacing (Oct 29, 2026).** Simulated paints **with the clock**, not all ticks in one dump then a VCR. The DES emits one tick per dt; the page holds each tick until wall time catches `t_sim` at 1× (1 s simulated ≈ 1 s on the desk). Duration stays the full run clock; a 1-day Simulated run at 1× would sit 24 h **and** hit the arrival guard at 9-block rates — the guard is the stop, not a hidden sample window. Analytic stays one solve. Not 60 FPS. Not a second engine. Not Measured.
- **Same-class hops share (Oct 29, 2026).** Two or more non-broadcast hops of the same class from the **same source** split by weight — Clients → two CDNs share 240, not copy it. Broadcast still copies. One backend stays 100%. Object store is M/G/c (`n` and `S`); it is not a delay-only External. Palette drops get a blank profile so Unknown stays Unknown and does not cap.

## Requirements

The tool must let a user build a topology, run it under load, and trust the answer; P0 is the minimum for a usable first version. This is the single list of requirements. IDs are stable: F for functional, N for non-functional. Source says where each one came from; "Proposed" and "Open" items still need your confirmation.

| ID | Requirement | Area | Priority | Source |
| --- | --- | --- | --- | --- |
| F1 | Node-link canvas: drag, connect from source (right/bottom) to target (left/top) or click Connect then two nodes, pan, zoom, grid snap. Clients only emit; kind-to-kind hop matrix (Connect notes); one hop per pair. Delete selected components and edges with Delete/Backspace, the toolbar, or Config; attached edges drop with the node | Canvas | P0 | Blueprint |
| F2 | Component palette: provider services listed directly under AWS, Azure, GCP and Kubernetes, plus a Generic group (clients, load balancer, service, cache, database, queue, worker pool, CDN, object store). File explorer: one provider folder open at a time, collapsible categories, sticky search, ☰ list default, ▦ button view. Icons follow Real-base DS/Icons (Service original glyph vs Normal kind shape) on tiles and on canvas cards; each service shows whether its limits are checked. Load picks Generic / AWS / Azure / GCP (same 9-block) or the YouTube example | Canvas | P0 | Blueprint, SyDe |
| F3 | Per-component configuration: instance title, concurrency, pool size, service time per request class, capacity. Title is the card label; catalog kind stays. Every behavior-changing parameter is configurable and explained in the panel | Model | P0 | Blueprint, SyDe |
| F4 | Typed edges: request classes, rates, payload sizes, call semantics (see System model). Classes are switched on the selected edge (on/off). Clients rates come from Workload, one block per Clients card. An empty class map is zero flow, not every class | Model | P0 | Proposed |
| F5 | Workload definition: one Workspace tab; one rate block per Clients card, Read / Write / Async / Bulk. Phase 1 Analytic uses constant load plus arrival SCV (Allen-Cunneen). Simulated may Ramp offered load from 0 to the target over ramp seconds, then hold. Analytic still solves the target rate. Poisson, step and spike remain later E2. Duration is the full run clock (no sample-window split). Simulated refuses when expected arrivals Σ class rps × peakFactor × duration > 5_000_000. dt and seed stay one run clock. Empty class map is zero flow | Run | P0 | Blueprint; Decision 19; Oct 29 duration |
| F6 | Two run modes on the same topology: Analytic steady-state (Phase 1 default) and discrete-event (verifier, then E2/E3). Analytic paints one solve. Simulated paints as simulated time becomes due (live pacing: wall clock × speed), not a full dump then replay. The fluid rate stepper is the overload branch (ρ ≥ 1), not the sizing answer. Switch sits next to Run; Workload repeats it | Run | P0 | SysLab Architect spec; Decision 19; Oct 29 live pacing |
| F7 | Live metrics on every node: ρ, wait, Analytic p50/p95/p99, queue length, throughput, status (Stable / Saturating / Unstable), heatmap, labeled hops, one summary bar. Analytic percentiles are labeled Analytic, never Measured. Card p99 stays empty when wait rounds to 0 ms or Show mode is Instantaneous (a tail needs 0→t). Discrete KPI latency is mean wait from samples (post-warm-up). A generator is not 100% loss. Unknown service time keeps wait unknown. Simulated Show mode Instantaneous = last dt; Average = 0→now. No VCR scrubber. Traveling dots on hops are a view of rate, not Analytic proof | Results | P0 | Both specs, SysSimulator; Decision 19; Oct 29 Simulated time |
| F8 | Fault injection: node crash, latency spike, link cut, packet drop. Engine slice E3 / product Phase 4. The Faults tab stays visible in Phase 1 and does not feed the steady-state solver | Run | P1 | Blueprint; Decision 19 |
| F9 | Blast-radius view: components impacted by a failed node | Results | P1 | SysLab Architect spec |
| F10 | Calibration library as a full page: one profile per Workspace canvas component, same titles and catalog icons, with source, date, version, tier, region and confidence (Measured, Vendor figure or Estimated); load-test CSV import | Calibration | P0 | Proposed |
| F11 | Cost estimate from instance and pricing inputs. C0 (Oct 29): typed $/hr, partial N of M, $/day = ×24, $/mo = ×730 h; unknown stays unknown; catalog has no SKU prices. C1–C4 sourced SKUs, usage lines, egress, and provider-compare cost stay later (Decision 2). Not a 24 h DES bill. | Providers | P2 | Proposed; Decision 2; Oct 29 C0 |
| F12 | Save, load and share topologies | Platform | P1 | Blueprint |
| F13 | Nested sub-systems (cluster as one node) | Platform | P2 | Blueprint |
| F14 | Export to IaC and API specs | Platform | P3 | Blueprint, deferred |
| F15 | Canonical provider-neutral component schema, with unknown fields shown explicitly | Providers | P0 | Multi-cloud brief |
| F16 | Generic catalog as the default palette; the engine contains no provider-specific code | Providers | P0 | Multi-cloud brief |
| F17 | Provider catalogs (AWS, Azure, GCP, Kubernetes) as data and capability adapters that keep each service's own constraints. The provider is chosen per component in the Workspace, so one design can mix providers; each component is a provider service with a configuration (instance class, count, region, scaling), and the generic kind is its type | Providers | P1 | Multi-cloud brief |
| F18 | Same topology and workload compared across providers, with source and confidence beside each key value | Providers | P1 | Multi-cloud brief |
| F19 | Edge semantics defined before build: routing versus fan-out, offered/admitted/completed/dropped/retried counts, bandwidth, retry budget, circuit breaker | Model | P0 | Multi-cloud brief |
| F20 | Scenario-based tutorials: brief, hints, an evaluate step, an optional timer, and a mentor that explains each result | Learning | P1 | SysLab |
| F21 | Challenge mode: incident events with response choices, a running cost, a score and a post-mortem | Learning | P2 | SystemLore |
| F22 | Blueprint and quick-start template library, each with its calibration source | Learning | P1 | SysSimulator, SyDe |
| F23 | Bottleneck explainer: highest ρ, which component breaks the SLO first, Erlang-C wait, queue length (Little’s law), headroom (max rps by bisection before SLO or the 70% util ceiling), N+1 check, and a suggested fix. Derived from the queueing model, not a flat “capacity ≥ load” tick | Results | P0 | SysLab; Decision 19 |
| F24 | Canvas filter by request class (read, write, async, bulk) | Canvas | P1 | SyDe |
| F25 | Import a topology from Terraform, Kubernetes, Mermaid or JSON (import only; export stays out of v1) | Platform | P2 | SyDe |
| F30 | Analytic Results: hockey-stick chart of latency against load per component, plus headroom (the professional proof). Simulated Workspace: one tick per dt, live-paced to wall time (including warm-up), visual only, no accuracy claim. Show mode Instantaneous = last dt; Average = 0→now (lerped). Queue depth is live; traveling dots follow the painted hop rate. No VCR scrubber. Does not stamp Measured, close Phase 1/5, or claim 60 FPS | Results | P0 | Stakeholder Oct 28–29, C1; Decision 18–19 |
| N1 | Fidelity: simulated bottleneck predictions are checked against actual load-test results. The Blueprint's numeric target (Simulation Fidelity Ratio, over 92% correlation with staging load-test benchmarks) is dropped for now. Open KPI until the metric, dataset and method are defined | Quality | P0 | Blueprint KPI |
| N2 | Deterministic replay: same topology version, workload, mode, seed and calibration give an identical timeline | Quality | P0 | SysLab Architect spec |
| N3 | Conservation of flow: Jackson traffic λᵢ = γᵢ + Σ λⱼ·pⱼᵢ at steady state; overload branch keeps offered = admitted + rejected + network drop and ΔB = (admitted − completed) Δt. Retries and drops defined. Throughput never exceeds offered load | Quality | P0 | SysLab Architect spec; Decision 19 |
| N4 | UI stays responsive: simulation off the main thread, 60 FPS canvas | Quality | P0 | SysLab Architect spec |
| N5 | Time to build and evaluate a design under 4 hours | Quality | P1 | Blueprint KPI |
| N6 | Limits: maximum nodes per canvas, simulated duration, browser support, discrete-event request volume. Interim tab-safety guard: Discrete refuses above 5_000_000 expected arrivals. Other numbers not yet set (Decision 8) | Quality | P1 | Open |
| N7 | Mode agreement: Analytic vs discrete-event on stable, light-load scenarios within a stated tolerance (starting guess ±5% mean, ±10% p99, fixed when tests are written). Documented cases where they should differ (bursts, faults, ρ ≥ 1) | Quality | P0 | Multi-cloud brief; Decision 19 |
| F26 | Every catalog value carries a limit type: hard limit, adjustable quota, best-effort target or performance guidance. Only the first two may act as a hard ceiling in the engine | Calibration | P0 (proposed) | AWS check, Oct 18, 2026 |
| F27 | Every catalog value stores unit, scope, conditions (API type, engine, execution model), source URL, retrieval date and status. Provider entries are split where behavior differs (API Gateway types, SQS Standard and FIFO, ECS and EKS configurations, MemoryDB as a database profile) | Calibration, Catalog | P0 (proposed) | AWS check, Oct 18, 2026; Provider catalogs, Catalog value rules |
| F28 | Every calibration value can be typed by hand: median and P95 service time per request class, arrival and service SCV (Allen-Cunneen), connection pool and other capacity inputs, plus custom request classes. The label follows the evidence: no source is Estimated, a source link is Vendor figure, an imported load-test CSV is Measured. A fit of S and SCV from typed p50/p95 is Estimated (Decision 16: no full distribution family in v1). P95 must be at least the median; Reset to default restores the starting values. The CSV is optional | Calibration | P0 (proposed) | Your request, Oct 19, 2026; Calibration screen; Decision 19 |
| F29 | Mixed-provider designs: each component carries its own provider, so one topology can use AWS, Azure and GCP together. A connection that leaves a provider is marked, and its latency and capacity are Estimated until measured | Canvas, Providers | P0 (proposed) | Your request, Oct 19, 2026; Workspace screen |

## System model

Terms used from here on: **offered** (arrives at a component or edge), **admitted** (accepted into service or the queue), **completed** (finished successfully), **dropped** (lost or rejected), **retried** (a repeat attempt after a failure). Each is a separate count.

Every component on the canvas is one canonical component with an optional provider binding. The engine reads only the canonical part. The provider binding is data for the UI, for cost, and for checking limits.

A component has four parts:

1. **Identity:** an id, a name and a canonical kind (traffic generator, load balancer, gateway, service, worker, queue, event bus, cache, relational database, NoSQL database, object storage, CDN).
2. **Behavior (shared across providers):** the fields the engine uses.
3. **Provider binding (optional):** which real service this stands for and its own constraints.
4. **Calibration references:** pointers to profiles that supply measured values.

| Behavior field | Meaning | Notes |
| --- | --- | --- |
| `servers` | Concurrency: parallel workers, slots, connections | c in the queueing model |
| `serviceTime[class]` | Time to serve one request of a class | Mean S for Analytic (Erlang C / Allen-Cunneen); optional SCV; sampled in discrete-event. Unknown S keeps wait unknown |
| `queueCapacity` | Waiting room size; beyond it, requests are rejected | Finite or unbounded |
| `throughputLimit` | Hard cap on requests or bytes per second, if the service has one | Optional |
| `scaling` | Fixed, or autoscaled with minimum, maximum and delay | Delay matters during spikes |
| `availability` | Failure behavior: crash rate, recovery time | Used by fault injection |
| `payload[class]` | Request and response bytes per class | Feeds bandwidth |
| `cost` | Unit prices and billing basis | Only from sourced inputs |

Every value is one of three states: **set** (with a source and a confidence label), **unknown**, or **not applicable**. An unknown field is shown as unknown on screen and blocks a run only if the engine truly needs it; the user can then enter an estimate, which is labeled Estimated.

**Provider binding** holds what only that service has: provider, service name, SKU or instance family, region, pricing model, quotas, scaling limits, durability and consistency notes, and links to the provider's documentation with the date read. These are never merged into the behavior fields by guess.

**A catalog entry** is data with three parts: the canonical kind it maps to, the list of behavior fields the service supports (it may support only a subset), and the schema of its provider-specific fields. An **adapter** turns a user's choices for that service (for example a SKU and a count) into canonical behavior fields, and reports which fields it could not fill.

The catalog says what a service can be set to do. A calibration profile (see Calibration) says how it measured. Neither stands in for the other.

**Choosing a component takes three levels.** A provider does not offer one service per category, and the simulator must not pretend it does. The palette lists services directly, so the user starts at level 2 and the kind follows from the service.

| Level | The user chooses | Example |
| --- | --- | --- |
| 1. Kind | The generic behavior to model | Database |
| 2. Service | The real implementation, from the chosen provider's catalog | Relational (RDS, Aurora) or NoSQL (DynamoDB) |
| 3. Configuration | Capacity and operating details of that service | Instance class, count, region, scaling |

The palette lists provider services directly, so placing one fixes its kind. The inspector then asks for the configuration. Different services of one kind expose different settings: a serverless function shows concurrency and duration limits where a container service shows instance size and count. Their simulated behavior differs accordingly, and services of one kind are never treated as interchangeable.

### Shared edge contract

An edge is defined once, statically. Analytic mode solves Jackson traffic on it. Discrete-event and the overload rate stepper derive runtime state from the same contract (see Simulation engine). The contract has six groups.

| Group | Fields | Rule |
| --- | --- | --- |
| Endpoints | `from`, `to` | Directed. A pair may have several edges |
| Routing | `mode` (single, weighted, broadcast, conditional), `weight`, `condition`, `fanOut` | Defined below |
| Classes | per class: `active`, `requestBytes`, `responseBytes`, `cacheable` | A class not routed on an edge carries zero flow there |
| Network | `latencyMs`, `bandwidthBps`, `bandwidthApplies` (request, response, both), `lossProb`, `serialization` (on or off) | Loss is a network drop (see C4) |
| Call | `kind` (sync or async), `timeoutMs`, `deadlineMs` | Async calls do not wait for the response |
| Resilience | `retry` {max, backoff, baseMs, jitter, budget, onlyIdempotent}, `breaker` {errorThreshold, windowMs, openMs, probes} | Retries and breaker states are counted separately |

**Routing and fan-out, defined.** Let a component admit rate λ of a class. An outgoing edge e then receives the offered rate below. Fan-out `m_e` is the number of calls made on edge e per request that takes that edge; it is not a probability, and the default is 1.

$$\text{single: } \lambda_e = m_e\,\lambda \qquad \text{weighted: } \lambda_e = \frac{w_e}{\sum_{j\in G} w_j}\, m_e\,\lambda \qquad \text{broadcast: } \lambda_e = m_e\,\lambda \text{ for every edge}$$

In weighted routing the weights are normalized across the outgoing edges that carry that class (group G), so they do not have to sum to 1. In broadcast every edge gets the full rate. Conditional routing sends a class (v1: by request class only) to an edge, and the fraction is the share of that class. An edge with no active classes carries zero flow; it must not be compiled as "every class" (that made the generic A/B line steal half of Read/Write).

**Worked examples** (illustrative numbers, not benchmarks)

| Case | Setup | Result |
| --- | --- | --- |
| Weighted | App service sends 800 rps of reads to a primary database (weight 1) and a replica (weight 3) | Primary 200 rps, replica 600 rps |
| Broadcast | Event bus admits 150 events per second and broadcasts to an email worker and an analytics worker | 150 per second to each, 300 offered downstream in total |
| Fan-out | App service calls an auth service twice per request (`m` = 2) at 200 rps of writes | 400 calls per second to auth |
| Retries | Failure chance per attempt f = 0.1, up to 2 retries | Attempts per request = 1 + 0.1 + 0.01 = 1.11, so offered load is 11% higher |
| Bandwidth | 400 rps, 2 KB request, 20 KB response, 100 Mbit/s link | Request side 6.4 Mbit/s; response side 64 Mbit/s (64% of the link); serialization of one response 1.6 ms |
| Cache | 800 rps of reads, hit rate 0.85 at the cache | 680 rps answered by the cache; 120 rps continue to the database |

The retry factor is the sum of f to the power i, for i from 0 to the retry limit r:

$$A = \sum_{i=0}^{r} f^{i} = \frac{1-f^{\,r+1}}{1-f}$$

A retry budget caps retries at a fraction of first attempts, so a failing dependency cannot be flooded by its own callers. The budget value, and the exact circuit-breaker transitions, are decisions to confirm before they are asserted in tests (see Validation and tests).

## Provider catalogs

A catalog lists provider services directly, grouped by category. Each service maps onto one canonical kind and fills the shared behavior fields it can; anything else stays in its provider fields. The lists below come from the providers' official product pages (found Oct 19, 2026). Each service carries one of four statuses: Verified, Partial, Listed (not checked) or No limits on page (see Components by provider). Every entry stores the official page and the date read (Oct 20, 2026) before it ships.

| Canonical kind | AWS | Azure | GCP | Kubernetes / self-hosted | Check per service before shipping |
| --- | --- | --- | --- | --- | --- |
| Gateway | API Gateway | API Management | API Gateway, Apigee | Ingress or gateway controller | Rate limits, timeouts, payload limits |
| Load balancer | ALB, NLB | Load Balancer, Application Gateway | Cloud Load Balancing | Service, ingress | Layer, connection limits, scaling behavior |
| Service | EC2, ECS, EKS | AKS, Container Apps | GKE, Cloud Run | Deployment | Concurrency per instance, scaling delay, instance sizes |
| Function | Lambda | Functions | Cloud Run functions | Function runtime | Concurrency, cold starts, duration limits |
| Queue | SQS | Service Bus | Pub/Sub | Broker deployment | Ordering, delivery guarantee, size and retention limits |
| Event bus (publish and subscribe, routing) | SNS, EventBridge | Event Grid | Pub/Sub | Broker deployment | Fan-out limits, delivery semantics |
| Cache | ElastiCache, MemoryDB | Cache for Redis | Memorystore | Cache deployment | Node sizes, eviction, replication, durability |
| Relational database | RDS, Aurora | Azure SQL | Cloud SQL, Spanner | Database deployment | Connection limits, replicas, failover |
| NoSQL database | DynamoDB | Cosmos DB | Firestore | Database deployment | Partition and throughput limits, consistency |
| Object storage | S3 | Blob Storage | Cloud Storage | Object store | Request-rate limits, consistency |
| CDN | CloudFront | Front Door, CDN | Cloud CDN | CDN or cache proxy | Cache behavior, origin limits |

**What the mapping does.** Each row's services all map onto the same canonical kind and fill the shared behavior fields they can. Anything a service has that the model lacks (for example a partition limit or a throughput unit) goes in its provider fields and is used for limit warnings and cost, not guessed into the engine.

**Limits of the mapping**

- Services in a row are alike for simulation, not equal. A Lambda function and an ECS service are both "compute" to the engine; their scaling and billing differ.
- A service may support only some behavior fields. Unsupported fields show as not applicable; unknown ones show as unknown.
- Managed services can hide their internals. Where a value cannot be known, we ask for a load test, not an assumption.
- Pricing and quotas change. Each is stored with a source link and a date and is flagged when old.

Block and file storage that attaches to compute (for example EBS or EFS) is modeled in v1 as a property of the database or service that uses it, not as a separate node. Object storage and CDN stay separate nodes because they serve requests on their own.

### Components by provider

The Workspace palette and the Catalog page list these services directly. Software engines such as PostgreSQL or Redis are not palette items: they are a configuration of a service (for example the engine of RDS). The AWS and GCP lists confirm candidate names against the official product pages; the Azure list is the full official list. Every service name links to the official page used to verify it, read Oct 20, 2026. A link shows where to look; it does not mean the limits were read. Dataset licenses are not checked. The same list, with every link, status and note, is saved as component-links.md in the Project.

**Catalog files** (this is the catalog, not a Postgres database; auth/Postgres stay out until Phase 4):

- `web/src/features/catalog/entries.ts` — the 137 services (id, name, provider, category, docsUrl, limitsOnPage)
- `web/src/features/catalog/verified-limits.ts` — recorded Vendor-figure rows for Verified and Partial readings
- `web/src/features/catalog/catalog.ts` — palette grouping (Generic is the nine blocks; Environment tiles only on AWS, Azure, GCP, Kubernetes)
- `web/src/features/catalog/provider-maps.ts` — 9-block AWS / Azure / GCP bindings
- `web/src/features/catalog/limit-type-map.ts` — M1 + Decision 11 mapping
- `component-links.md` — the same 137 rows as a link + status table
- this plan’s Components by provider and Verified limits tables

**Status labels**

- **Verified:** limits read and recorded in the Verified limits table or the Oct 18, 2026 AWS spot check (Lambda, SQS, S3, CloudFront).
- **Partial:** the page states some limits but not all, or the figures are guidance rather than quotas.
- **Listed (not checked):** an official limits page exists and is linked, but its figures are not yet recorded. Reducing this grey set is in-scope human work (Oct 23, 2026): open the linked page, quote the figure, URL and date; the agent encodes it. Do not invent SKU prices, latencies or quotas. The 18 Verified remain the recorded-figure set for the first provider compare. Phase 1 and Phase 5 still need a real load test of the 9-block reference stack.
- **No limits on page:** the linked official page states no limits (concept or overview pages).

**Changes on Oct 20, 2026**

- 17 services were marked "limits checked" without a recorded reading. 13 of them are now Listed (not checked): AWS DynamoDB, API Gateway, SNS, EventBridge; Azure Functions, Blob Storage, Cosmos DB, Event Grid, API Management; GCP Cloud Run, Cloud Run functions, Cloud Storage, Firestore. The other 4 (Azure Front Door, Azure Content Delivery Network, Cloud CDN, Apigee) take the status their pages support, in the next point.
- 6 services changed because of what their pages state (the 4 above plus S3 and Azure Load Balancer): S3, Azure Front Door, Azure Load Balancer, Cloud CDN and Apigee are now Partial; Azure Content Delivery Network is now No limits on page.
- GCP Pub/Sub: the old link returned 404. It is replaced by the confirmed official page https://docs.cloud.google.com/pubsub/quotas ("Pub/Sub quotas and limits").
- GCP Dataproc: Google renamed it "Managed Service for Apache Spark"; the old link redirects to https://docs.cloud.google.com/managed-spark/quotas. The catalog keeps the name Dataproc and notes the new name.
- Naming: use "Application Load Balancer" everywhere; "ALB" is allowed only as a short label. The canvas sources "Viewers" and "Uploaders" are labels on the Generic Clients component, not catalog services. ECR is not a catalog entry.
- Kubernetes: the 7 objects are kinds with no limits on their pages. Cluster size limits get their own row ("Kubernetes scalability thresholds", Partial).

**Counts**

| Provider | Services | Verified | Partial | Listed (not checked) | No limits on page |
| --- | --- | --- | --- | --- | --- |
| AWS | 50 | 12 | 1 | 37 | 0 |
| Azure | 44 | 6 | 4 | 32 | 2 |
| Google Cloud | 35 | 7 | 2 | 26 | 0 |
| Kubernetes | 8 | 0 | 1 | 0 | 7 |
| Total | 137 | 25 | 8 | 95 | 9 |

**AWS (50 services)**

| Category | Service (links to its official page) | Limits on page | Status | Note |
| --- | --- | --- | --- | --- |
| Compute | [EC2](https://docs.aws.amazon.com/general/latest/gr/ec2-service.html) | yes | Listed (not checked) |  |
|  | [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html) | yes | Verified | Quotas page read 2026-10-23. Concurrency default 1,000 is now recorded. Stays in the canonical 18. |
|  | [Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/throttling.html) | yes | Verified | Token-bucket launch rates. Read 2026-10-23. Outside the canonical 18. |
|  | [Batch](https://docs.aws.amazon.com/batch/latest/userguide/service_limits.html) | yes | Verified | Unchanged quotas, each Region-specific. Read 2026-10-23. Outside the canonical 18. |
|  | [App Runner](https://docs.aws.amazon.com/general/latest/gr/apprunner.html) | yes | Listed (not checked) |  |
|  | [Elastic Beanstalk](https://docs.aws.amazon.com/general/latest/gr/elasticbeanstalk.html) | yes | Listed (not checked) |  |
|  | [Lightsail](https://docs.aws.amazon.com/general/latest/gr/lightsail.html) | yes | Listed (not checked) |  |
| Containers | [ECS](https://docs.aws.amazon.com/general/latest/gr/ecs-service.html) | yes | Verified |  |
|  | [EKS](https://docs.aws.amazon.com/eks/latest/best-practices/known_limits_and_service_quotas.html) | yes | Listed (not checked) | Supplied file is other-service quotas that can hit EKS (IAM, VPC, ELB, EC2). Cluster quotas are on a different article. |
| Storage | [S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html) | partial | Partial | Performance guidance, not quotas. Read 2026-10-23: 3,500 PUT and 5,500 GET per prefix. Not a ceiling. AWS S3 (2).md is the same page, not a quotas article. |
|  | [EBS](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-resource-quotas.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
|  | [EFS](https://docs.aws.amazon.com/efs/latest/ug/limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
|  | [FSx](https://docs.aws.amazon.com/fsx/latest/WindowsGuide/limits.html) | yes | Listed (not checked) | Indirect: FSx for Windows only. Quota md supplied 2026-10-26. Not recorded. |
|  | [Storage Gateway](https://docs.aws.amazon.com/storagegateway/latest/vgw/resource-gateway-limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
| Database | [Aurora](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_Limits.html) | yes | Verified |  |
|  | [RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Limits.html) | yes | Verified |  |
|  | [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ServiceQuotas.html) | yes | Verified | Quotas page read 2026-10-23. Default 40,000 RCU/WCU per table. Outside the canonical 18. |
|  | [DocumentDB](https://docs.aws.amazon.com/documentdb/latest/devguide/limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
|  | [Neptune](https://docs.aws.amazon.com/neptune/latest/userguide/limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26 (file named Nepture). Not recorded. |
|  | [Keyspaces](https://docs.aws.amazon.com/keyspaces/latest/devguide/quotas.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
|  | [Timestream](https://docs.aws.amazon.com/timestream/latest/developerguide/ts-limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26 (file named Timesteam). Not recorded. |
|  | [Redshift](https://docs.aws.amazon.com/redshift/latest/mgmt/amazon-redshift-limits.html) | yes | Listed (not checked) | Quota md supplied 2026-10-26. Not recorded. |
| Cache | [ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/quota-limits.html) | yes | Verified |  |
|  | [MemoryDB](https://docs.aws.amazon.com/memorydb/latest/devguide/quota-limits.html) | yes | Verified |  |
| Network and CDN | [CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-limits.html) | yes | Verified | Quotas page read 2026-10-26. Default 250,000 rps and 150 Gbps per distribution (adjustable). Stays in the canonical 18. Not wired as node throughput. |
|  | [Route 53](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/DNSLimitations.html) | yes | Listed (not checked) |  |
|  | [Application Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-limits.html) | yes | Verified |  |
|  | [Network Load Balancer](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-limits.html) | yes | Listed (not checked) |  |
|  | [API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html) | yes | Listed (not checked) |  |
|  | [Global Accelerator](https://docs.aws.amazon.com/global-accelerator/latest/dg/limits-global-accelerator.html) | yes | Listed (not checked) |  |
|  | [VPC](https://docs.aws.amazon.com/vpc/latest/userguide/amazon-vpc-limits.html) | yes | Listed (not checked) |  |
|  | [Direct Connect](https://docs.aws.amazon.com/directconnect/latest/UserGuide/limits.html) | yes | Listed (not checked) |  |
|  | [WAF](https://docs.aws.amazon.com/waf/latest/developerguide/limits.html) | yes | Listed (not checked) |  |
|  | [Shield](https://docs.aws.amazon.com/waf/latest/developerguide/shield-limits.html) | yes | Listed (not checked) |  |
| Messaging and integration | [SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html) | yes | Verified |  |
|  | [SNS](https://docs.aws.amazon.com/general/latest/gr/sns.html) | yes | Listed (not checked) |  |
|  | [EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-quota.html) | yes | Listed (not checked) |  |
|  | [Kinesis Data Streams](https://docs.aws.amazon.com/streams/latest/dev/service-sizes-and-limits.html) | yes | Listed (not checked) |  |
|  | [MSK](https://docs.aws.amazon.com/msk/latest/developerguide/limits.html) | yes | Listed (not checked) |  |
|  | [Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html) | yes | Listed (not checked) |  |
|  | [MQ](https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/amazon-mq-limits.html) | yes | Listed (not checked) |  |
|  | [AppSync](https://docs.aws.amazon.com/general/latest/gr/appsync.html) | yes | Listed (not checked) |  |
| Analytics | [OpenSearch Service](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/limits.html) | yes | Listed (not checked) | Supplied file defers domain/instance quotas to the AWS General Reference. Warm-node SKU storage is on this page. |
|  | [Athena](https://docs.aws.amazon.com/athena/latest/ug/service-limits.html) | yes | Listed (not checked) |  |
|  | [EMR](https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-service-limits-what-are.html) | partial | Listed (not checked) | Supplied file explains burst vs rate; example AddInstanceFleet 5 calls/s burst, 0.5/s replenish. Resource quota table is not on this page. |
|  | [Glue](https://docs.aws.amazon.com/general/latest/gr/glue.html) | yes | Listed (not checked) |  |
| Media | [MediaConvert](https://docs.aws.amazon.com/general/latest/gr/mediaconvert.html) | yes | Listed (not checked) |  |
|  | [MediaLive](https://docs.aws.amazon.com/general/latest/gr/medialive_region.html) | yes | Listed (not checked) |  |
|  | [MediaPackage](https://docs.aws.amazon.com/mediapackage/latest/userguide/quotas.html) | yes | Listed (not checked) |  |
|  | [IVS](https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/service-quotas.html) | yes | Listed (not checked) |  |

**Azure (44 services)**

| Category | Service (links to its official page) | Limits on page | Status | Note |
| --- | --- | --- | --- | --- |
| Compute | [Virtual Machines](https://learn.microsoft.com/en-us/azure/virtual-machines/quotas) | partial | Listed (not checked) |  |
|  | [VM Scale Sets](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-faq) | yes | Listed (not checked) | Indirect: FAQ page. |
|  | [App Service](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits) | yes | Listed (not checked) | Generic Azure subscription limits page. |
|  | [Functions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale) | yes | Listed (not checked) |  |
|  | [Batch](https://learn.microsoft.com/en-us/azure/batch/batch-quota-limit) | yes | Listed (not checked) |  |
|  | [Container Instances](https://learn.microsoft.com/en-us/azure/container-instances/container-instances-resource-and-quota-limits) | yes | Listed (not checked) |  |
| Containers | [AKS](https://learn.microsoft.com/en-us/azure/aks/quotas-skus-regions) | yes | Verified |  |
|  | [Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/quotas) | partial | Partial | Most defaults not on the page. Recorded Express 2,000 cores, 30 replicas, 200 environments. Read 2026-10-23. |
| Storage | [Blob Storage](https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets) | yes | Verified | Scalability-targets page read 2026-10-23. Block 50,000 × 4,000 MiB; target 3,000 rps per block blob. Account ingress/egress not on this page. Outside the canonical 18. |
|  | [Files](https://learn.microsoft.com/en-us/azure/storage/files/storage-files-scale-targets) | yes | Listed (not checked) |  |
|  | [Disk Storage](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-scalability-targets) | yes | Listed (not checked) |  |
|  | [NetApp Files](https://learn.microsoft.com/en-us/azure/azure-netapp-files/azure-netapp-files-resource-limits) | yes | Listed (not checked) |  |
|  | [Data Lake Storage](https://azure.microsoft.com/en-us/products/storage/data-lake-storage) | no | No limits on page | Product page, no limits. |
|  | [Elastic SAN](https://learn.microsoft.com/en-us/azure/storage/elastic-san/elastic-san-scale-targets) | yes | Listed (not checked) |  |
| Database | [Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/concepts-limits) | yes | Listed (not checked) |  |
|  | [Azure SQL](https://learn.microsoft.com/en-us/azure/azure-sql/database/resource-limits-vcore-single-databases?view=azuresql) | yes | Verified | vCore single-database limits only. |
|  | [SQL Managed Instance](https://learn.microsoft.com/en-us/azure/azure-sql/managed-instance/resource-limits?view=azuresql) | yes | Listed (not checked) |  |
|  | [Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/configure-maintain/concepts-limits) | yes | Verified | Flexible-server limits read 2026-10-23. Default max_connections by SKU; 15 reserved. Outside the canonical 18. |
|  | [Database for MySQL](https://learn.microsoft.com/en-us/azure/mysql/flexible-server/concepts-limitations) | partial | Listed (not checked) |  |
|  | [Managed Instance for Apache Cassandra](https://learn.microsoft.com/en-us/azure/managed-instance-apache-cassandra/faq) | partial | Listed (not checked) |  |
| Cache | [Cache for Redis](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits) | yes | Verified | Generic Azure subscription limits page. Basic, Standard, Premium retire Sep 30, 2028. |
|  | [Managed Redis](https://learn.microsoft.com/en-us/azure/redis/plan-tiers-and-capacity) | partial | Listed (not checked) |  |
| Network and CDN | [Front Door](https://learn.microsoft.com/en-us/azure/frontdoor/front-door-routing-limits) | partial | Partial | Composite route 5,000. Other resource limits are on another page. Read 2026-10-23. |
|  | [Content Delivery Network](https://learn.microsoft.com/en-us/azure/cdn/cdn-overview) | no | No limits on page | Overview page, no limits. |
|  | [Application Gateway](https://learn.microsoft.com/en-us/azure/application-gateway/application-gateway-autoscaling-zone-redundant) | yes | Partial | Autoscaling article, not a quota table. Instance 0–125, Basic ~200 cps. Read 2026-10-23. |
|  | [Load Balancer](https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-tcp-idle-timeout) | partial | Partial | Indirect: idle-timeout how-to. |
|  | [Traffic Manager](https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-faqs) | partial | Listed (not checked) | Indirect: FAQ page. |
|  | [DNS](https://learn.microsoft.com/en-us/azure/dns/dns-zones-records) | yes | Listed (not checked) |  |
|  | [ExpressRoute](https://learn.microsoft.com/en-us/azure/expressroute/expressroute-faqs) | yes | Listed (not checked) |  |
|  | [Firewall](https://learn.microsoft.com/en-us/azure/firewall/firewall-performance) | yes | Listed (not checked) |  |
|  | [Web Application Firewall](https://learn.microsoft.com/en-us/azure/web-application-firewall/ag/waf-engine) | partial | Listed (not checked) |  |
|  | [VPN Gateway](https://learn.microsoft.com/en-us/azure/vpn-gateway/about-gateway-skus) | yes | Listed (not checked) |  |
| Messaging and integration | [Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-quotas) | yes | Verified |  |
|  | [Event Grid](https://learn.microsoft.com/en-us/azure/event-grid/quotas-limits) | yes | Listed (not checked) |  |
|  | [Event Hubs](https://learn.microsoft.com/en-us/azure/event-hubs/event-hubs-quotas) | yes | Listed (not checked) |  |
|  | [Queue Storage](https://learn.microsoft.com/en-us/azure/storage/queues/scalability-targets) | yes | Listed (not checked) |  |
|  | [API Management](https://learn.microsoft.com/en-us/azure/api-management/service-limits) | yes | Listed (not checked) |  |
|  | [Logic Apps](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config) | yes | Listed (not checked) |  |
|  | [Web PubSub](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-scale-manual-scale) | partial | Listed (not checked) |  |
| Analytics | [Data Explorer](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits) | yes | Listed (not checked) | Generic Azure subscription limits page. |
|  | [Stream Analytics](https://learn.microsoft.com/en-us/azure/stream-analytics/stream-analytics-streaming-unit-consumption) | partial | Listed (not checked) |  |
|  | [Synapse Analytics](https://learn.microsoft.com/en-us/azure/synapse-analytics/sql-data-warehouse/sql-data-warehouse-service-capacity-limits) | yes | Listed (not checked) |  |
|  | [Databricks](https://learn.microsoft.com/en-us/azure/databricks/admin/account-settings/serverless-quotas) | partial | Listed (not checked) |  |
|  | [Data Factory](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/azure-subscription-service-limits) | yes | Listed (not checked) | Generic Azure subscription limits page. |

**Google Cloud (35 services)**

| Category | Service (links to its official page) | Limits on page | Status | Note |
| --- | --- | --- | --- | --- |
| Compute | [Compute Engine](https://docs.cloud.google.com/compute/quotas-limits) | partial | Listed (not checked) |  |
|  | [Cloud Run](https://docs.cloud.google.com/run/quotas) | yes | Verified | Quotas page read 2026-10-23. 1,000 concurrent requests per service instance. Outside the canonical 18. |
|  | [Cloud Run functions](https://docs.cloud.google.com/functions/quotas) | yes | Listed (not checked) |  |
|  | [App Engine](https://docs.cloud.google.com/appengine/docs/standard/quotas) | yes | Listed (not checked) |  |
|  | [Batch](https://docs.cloud.google.com/batch/quotas) | yes | Listed (not checked) |  |
| Containers | [GKE](https://docs.cloud.google.com/kubernetes-engine/quotas) | yes | Verified |  |
| Storage | [Cloud Storage](https://docs.cloud.google.com/storage/quotas) | yes | Verified | Quotas page read 2026-10-23. Object 5 TiB; bucket writes/reads unlimited after scale. Outside the canonical 18. |
|  | [Persistent Disk](https://docs.cloud.google.com/compute/docs/disks/performance) | yes | Listed (not checked) |  |
|  | [Filestore](https://docs.cloud.google.com/filestore/docs/limits) | yes | Listed (not checked) |  |
|  | [Hyperdisk](https://docs.cloud.google.com/compute/docs/disks/hyperdisk-perf-limits) | yes | Listed (not checked) |  |
| Database | [Cloud SQL](https://docs.cloud.google.com/sql/docs/quotas) | yes | Verified |  |
|  | [AlloyDB](https://docs.cloud.google.com/alloydb/quotas) | yes | Listed (not checked) |  |
|  | [Spanner](https://docs.cloud.google.com/spanner/quotas) | yes | Listed (not checked) |  |
|  | [Bigtable](https://docs.cloud.google.com/bigtable/quotas) | yes | Listed (not checked) |  |
|  | [Firestore](https://docs.cloud.google.com/firestore/quotas) | yes | Listed (not checked) |  |
| Cache | [Memorystore](https://docs.cloud.google.com/memorystore/docs/redis/quotas) | yes | Verified |  |
| Network and CDN | [Cloud CDN](https://docs.cloud.google.com/cdn/docs/caching) | partial | Partial | Caching page, not a quota table. Max cached body 100 GiB with byte ranges, else 10 MiB. Read 2026-10-23. |
|  | [Media CDN](https://docs.cloud.google.com/media-cdn/quotas) | yes | Listed (not checked) |  |
|  | [Cloud Load Balancing](https://docs.cloud.google.com/load-balancing/docs/quotas) | yes | Verified |  |
|  | [Cloud DNS](https://docs.cloud.google.com/dns/quotas) | yes | Listed (not checked) |  |
|  | [Cloud Armor](https://docs.cloud.google.com/armor/quotas) | yes | Listed (not checked) |  |
|  | [Cloud NAT](https://docs.cloud.google.com/nat/quota) | yes | Listed (not checked) |  |
|  | [Cloud Interconnect](https://docs.cloud.google.com/network-connectivity/docs/interconnect/quotas) | yes | Listed (not checked) |  |
| Messaging and integration | [Pub/Sub](https://docs.cloud.google.com/pubsub/quotas) | yes | Verified | Link fixed: the old URL returned 404; new page confirmed Oct 20, 2026. |
|  | [Cloud Tasks](https://docs.cloud.google.com/tasks/docs/quotas) | yes | Listed (not checked) |  |
|  | [Eventarc](https://docs.cloud.google.com/eventarc/docs/quotas) | yes | Listed (not checked) |  |
|  | [Workflows](https://docs.cloud.google.com/workflows/quotas) | yes | Listed (not checked) |  |
|  | [Cloud Scheduler](https://docs.cloud.google.com/scheduler/quotas) | yes | Listed (not checked) |  |
|  | [Apigee](https://docs.cloud.google.com/apigee/docs/api-platform/reference/subscription-entitlements) | partial | Partial |  |
|  | [API Gateway](https://docs.cloud.google.com/api-gateway/docs/quotas) | yes | Listed (not checked) |  |
| Analytics | [BigQuery](https://docs.cloud.google.com/bigquery/quotas) | yes | Listed (not checked) |  |
|  | [Dataflow](https://docs.cloud.google.com/dataflow/quotas) | yes | Listed (not checked) |  |
|  | [Dataproc](https://docs.cloud.google.com/managed-spark/quotas) | yes | Listed (not checked) | Renamed by Google: "Managed Service for Apache Spark"; link updated. |
| Media | [Transcoder API](https://docs.cloud.google.com/transcoder/quotas) | yes | Listed (not checked) |  |
|  | [Live Stream API](https://docs.cloud.google.com/livestream/docs/quotas) | yes | Listed (not checked) |  |

**Kubernetes (7 objects) and Generic (9 components)**

| Category | Service (links to its official page) | Limits on page | Status | Note |
| --- | --- | --- | --- | --- |
| Kubernetes object | [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/) | no | No limits on page |  |
|  | [StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) | no | No limits on page |  |
|  | [Job](https://kubernetes.io/docs/concepts/workloads/controllers/job/) | no | No limits on page |  |
|  | [Service](https://kubernetes.io/docs/concepts/services-networking/service/) | no | No limits on page |  |
|  | [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) | no | No limits on page |  |
|  | [HorizontalPodAutoscaler](https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/) | no | No limits on page |  |
|  | [PersistentVolumeClaim](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) | no | No limits on page |  |
| Cluster limits | [Kubernetes scalability thresholds](https://kubernetes.io/docs/setup/best-practices/cluster-large/) | partial | Partial |  |

| Group | Components |
| --- | --- |
| Generic | Clients, Load balancer, Service, Cache, Database, Queue, Worker pool, CDN, Object store (no provider page: generic building blocks; limits Not set until entered). The canvas labels "Viewers" and "Uploaders" are Clients. |

### Catalog value rules

These rules decide how a catalog value is stored. They were set after checking AWS documentation: 11 figures (Lambda, SQS, S3, CloudFront) were checked on Oct 18, 2026 and all 11 match. The other claims in the source answer are not checked. The workbook aws\_catalog\_verification.xlsx holds the full list, and your Azure and GCP checks go in its last sheet.

**What changes**

| # | Change | Replaces | Status of the evidence |
| --- | --- | --- | --- |
| M1 | Every catalog value carries a limit type: hard limit, adjustable quota, best-effort target or performance guidance | Confidence label alone | Spot-checked: S3 rates are guidance, Lambda concurrency is adjustable |
| M2 | Every catalog value also stores unit, scope, conditions, source URL and retrieval date | Value plus confidence plus source id | Proposed by ChatGPT; adopted here |
| M3 | API Gateway splits into REST, HTTP and WebSocket entries | One entry | ChatGPT; not checked by me |
| M4 | SQS splits into Standard and FIFO | One entry | Size and retention checked; delivery semantics not |
| M5 | EC2, ECS and EKS each need their own configuration (launch model, resources, scaling policy) | Treated as one kind of service | ChatGPT; not checked by me |
| M6 | Lambda limits are stored per execution model; 900 s applies to ordinary functions only | One duration limit | Checked: Managed Instances allow 5,400 s for asynchronous and event-source-mapping invocations |
| M7 | MemoryDB is a durable database profile; ElastiCache is not labelled non-durable in general | One cache entry | ChatGPT; not checked by me |
| M8 | DynamoDB is modeled by capacity mode, item size, indexes and access pattern, not one partition limit | Partition limit | ChatGPT; not checked by me |
| M9 | RDS and Aurora get no queries-per-second value without engine, instance class, workload and a benchmark source | None | ChatGPT; not checked by me |
| M10 | Scaling delay has no default; it is configurable or measured | A delay field | ChatGPT; not checked by me |

**Catalog value type**

This compiled under tsc --strict, and the worked check returned the expected values: a Lambda timeout of 900 for a standard function, 5,400 for Managed Instances asynchronous invocation, and S3 request rates refused as a hard ceiling.

```ts
type LimitType = 'hard_limit' | 'adjustable_quota' | 'best_effort_target' | 'performance_guidance';
type Status = 'documented' | 'measured' | 'estimated' | 'unknown';

interface CatalogValue {
  value: number;
  unit: string;
  scope: 'function' | 'account' | 'region' | 'distribution' | 'queue' | 'message' | 'prefix' | 'invocation';
  limitType: LimitType;
  conditions: Record<string, string>; // API type, engine, instance family, execution model
  sourceUrl: string;
  retrievedOn: string; // YYYY-MM-DD
  status: Status;
}

// Rule: only hard limits and adjustable quotas may act as a ceiling in the engine.
function usableAsCeiling(v: CatalogValue): boolean {
  return v.limitType === 'hard_limit' || v.limitType === 'adjustable_quota';
}
```

**Rule proposed, not confirmed:** performance guidance and best-effort targets are shown in the UI and used as defaults a user can override, but they are never enforced as a hard cap. The confidence labels in Calibration map onto status: Measured to measured, Vendor figure to documented, Estimated to estimated.

**Provider-mapping rows, with the configuration each needs**

| Kind | AWS entries | Configuration required |
| --- | --- | --- |
| Gateway | API Gateway REST, HTTP, WebSocket | API type, throttling, payload, timeout |
| Load balancer | ALB, NLB | Layer and protocol, targets, connections |
| Service | EC2; ECS by launch model; EKS by compute and pod settings | Capacity, orchestration, scaling policy, warmup |
| Function | Lambda | Execution model, invocation type, concurrency, initialization |
| Queue | SQS Standard, SQS FIFO | Delivery semantics, ordering, message size, retention |
| Event bus | EventBridge, SNS | Routing versus topic fan-out, retries, dead-letter handling |
| Cache | ElastiCache; MemoryDB as a database profile | Engine, node type, eviction, replication, durability |
| Relational database | RDS by engine; Aurora by compatibility | Instance class, connections, replicas, failover |
| NoSQL database | DynamoDB | Capacity mode, item size, indexes, access pattern, consistency |
| Object storage | S3 | Request mix, prefix distribution, object size |
| CDN | CloudFront | Cache behavior, hit ratio, origin behavior, quotas |

**Decided Oct 19, 2026: the Azure and GCP names were checked against official pages (linked under Components by provider); Pub/Sub is one entry listed under both Queue and Event bus**.

### Verified limits

**Canonical 18** is the first provider compare (Decision 3, amended Oct 23). It is Lambda, ECS, Aurora, RDS, ElastiCache, MemoryDB, CloudFront, Application Load Balancer, SQS; AKS, Azure SQL, Cache for Redis, Service Bus; GKE, Cloud SQL, Memorystore, Cloud Load Balancing, Pub/Sub. The Components by provider counts are no longer equal to that 18: AWS Batch was read on Oct 23, 2026 and is Verified in the status table, and it stays outside the 18.

The table below is a **figure reading**, not the status list. SQS is one Verified service with Standard and FIFO rows. Lambda’s 900 s and 5,400 s timeouts were first recorded in the Oct 18, 2026 spot check (M6); the Oct 23, 2026 quotas page confirms them and adds the rest of that page, including a default concurrency of 1,000. CloudFront quotas were recorded on Oct 26, 2026 from the official limits page (default 250,000 rps and 150 Gbps per distribution, adjustable). **Azure Load Balancer is Partial** (Oct 20 changelog): idle timeout is recorded here as a configurable setting; it is not one of the 18. Azure Partial after the Oct 23 readings is Front Door, Load Balancer, Application Gateway, and Container Apps. **AWS Batch**, **AWS Fargate**, **DynamoDB**, **Azure Blob Storage**, **Azure Database for PostgreSQL**, **Cloud Run**, and **Cloud Storage** are later readings (Oct 23, 2026), Verified in the status table, and outside the 18. Lambda stays inside the 18. S3 and Cloud CDN stay Partial (guidance / caching pages).

Unknown in Still open means the page read did not state a value, not that no limit exists. The pages were read through a page-summary tool; sources are in verify\_checklist.xlsx; re-check any figure before it ships. Do not invent a quota. These figures are Vendor figure (documented), not Measured. Phase 1 and Phase 5 stay open until a real load test of the reference stack exists.

| Service | Verified | Still open |
| --- | --- | --- |
| AWS CloudFront | Default 150 Gbps and 250,000 rps per distribution (adjustable; not on flat-rate plans); 500 distributions per account; 100 origins; 75 cache behaviors; 100 CNAMEs; request/URL 32,768 / 8,192 bytes; cacheable GET 50 GB; request body 64 GB; distribution chain 2 (else 403); Functions 100 per account, 10 KB; invalidations 150 paths/s and 1 wildcard/s; WebSocket idle 10 min; Lambda@Edge timeout 30 s | Files per distribution: no quota. Concurrent executions point at Lambda. Not wired as node throughput. |
| AWS ALB | Idle timeout 60 s default, range 1 to 4,000 s; 1,000 targets, 50 listeners, 100 rules (adjustable) | Scaling time; connection rate |
| AWS ECS | 5,000 tasks per service, 5,000 services per cluster (fixed); 10 tasks per RunTask; Fargate launch 20 per second sustained (adjustable) | Cooldown defaults; warm-up |
| AWS SQS Standard | At-least-once delivery, best-effort order, nearly unlimited API calls | Numeric quota |
| AWS SQS FIFO | Strict order within a message group; 5-minute deduplication; 3,000 messages per second per partition batched, 300 unbatched (guidance); 120,000 in flight | Regional total |
| AWS ElastiCache | Asynchronous replication, writes resume in seconds after failover; serverless caches 65,000 clients | Node-based connections and eviction |
| AWS MemoryDB | Multi-AZ transaction log; no data lost on failover | Node sizes, connections, eviction |
| AWS RDS | Multi-AZ instance is failover only; Multi-AZ cluster also serves reads; 15 read replicas per primary | Per-instance storage; consistency |
| AWS Aurora | Up to 15 replicas; failover usually under 60 s; MySQL connection defaults by class | Storage (128 or 256 TiB, pages differ) |
| Azure Load Balancer | Idle timeout 4 min default, 4 to 100 (outbound 4 to 120) | Limits; scaling |
| Azure AKS | 5,000 nodes, 1,000 per pool, 100 pools, 250 pods per node; autoscaler scan 10 s | Scale-up time |
| Azure Service Bus | Peek-lock at-least-once; sessions give ordering | Throughput quota |
| Azure Cache for Redis | Connections 256 to 40,000 by tier; volatile-lru; asynchronous replication | Retires Sep 30, 2028 (Basic, Standard, Premium) and Mar 31, 2027 (Enterprise) |
| Azure SQL | 30,000 sessions; 150 and 600 workers (serverless General Purpose); Business Critical up to 3 secondaries | Failover time; other tiers |
| GCP Cloud Load Balancing | Backend timeout 30 s default; 50 backends per backend service | Connection rate; scaling |
| GCP GKE | Standard 65,000 nodes, Autopilot 5,000; 512 pods per node | Autoscaler timing |
| GCP Pub/Sub | At-least-once, optional ordering, exactly-once supported; 4 GB/s per region publish in large regions | None found |
| GCP Memorystore | 65,000 clients; asynchronous, about 30 s unavailable on repair; acknowledged writes can be lost | Memory sizes |
| GCP Cloud SQL | Synchronous HA, about 60 s failover; PostgreSQL connection sum up to 262,142; storage up to 64 TB | Standby reads; consistency |
| AWS Batch | Unchanged, Region-specific: 50 job queues; 50 compute environments across ECS and EKS; 5 per EKS cluster; 3 per job queue; 20 job dependencies; job definition 24 KiB; SubmitJob payload 30 KiB; array size 10,000; 1,000,000 jobs in SUBMITTED; SubmitJob 50 TPS per account; 50,000 consumable resources (page writes 50k); 50 service environments; 1 per job queue; 1 job queue per quota-management service environment; 20 quota shares; SubmitServiceJob request 30 KiB; payload 10 KiB; SubmitServiceJob 5 TPS per account; 10 retry attempts | EC2, ECS, and EKS quotas may also apply; those numbers are not on this page. Not applied as worker throughput or server count. |
| AWS Lambda | Quotas page read 2026-10-23. Ordinary timeout 900 s; Managed Instances async and event-source mapping 5,400 s except Amazon MQ and Amazon DocumentDB; concurrent executions default 1,000 per Region (adjustable; “tens of thousands” is not a number; new accounts are reduced, with no figure); zip storage 300 GB not increasable; memory 128–10,240 MB (1,769 MB ≈ 1 vCPU); env 4 KB; policy 20 KB; 5 layers; 1,000 execution environments per 10 s; sync payload 6 MB request and response, streamed response 200 MB, async payload 1 MB; streamed bandwidth uncapped for the first 6 MB then 2 MBps; network 625 Mbps (non-VPC increase up to 3,000 Mbps at 10,240 MB); zip 50 MB API and console, 250 MB unzipped; image settings 16 KB; image 10 GB; 10 test events; /tmp 512–10,240 MB; file descriptors 1,024 (Managed Instances 4,096); processes/threads 1,024. Sync: 10 rps per environment. GetFunction 100 rps, GetPolicy 15 rps, other control-plane APIs 15 rps combined, none increasable. Durable, MicroVM, and Web Function tables are recorded in full in the catalog, including Web Function account defaults of 100,000 rps and 2,000 Arm64 vCPUs. | Container-image storage points at ECR and states no number. Managed Instances process and thread limits point at Bottlerocket and state no number. “Tens of thousands” and “thousands” are not stored as numbers. The page’s API Gateway 10,000 rps example is not a Lambda quota. Not applied as throughput or server count. |
| AWS Fargate | Per account per Region, adjustable: On-Demand burst 100 and sustained 20 launches/s; Spot burst 100 and sustained 20 launches/s; EKS-pods-only accounts burst 20 and sustained 20 on the platform versions named elsewhere; RunTask API 20 calls/s burst and sustained; each RunTask call can launch up to 10 tasks | The 10-tasks-per-call maximum does not say whether it can be changed. Image pull, health checks, and load balancer registration change observed launch rate; the page states no separate number. Not applied as completed-request throughput. Outside the canonical 18. |
| AWS S3 | Guidance, not quotas: at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD per prefix; no prefix count limit; 10-prefix example 55,000 reads/s; small-object latency roughly 100–200 ms; single-instance transfer up to 100 Gb/s | Scaling is gradual; 503 may appear. SSE-KMS rates are on the KMS page. Not a hard ceiling. Stays Partial. |
| AWS DynamoDB | Per Region. Default 40,000 read/write units per table (on-demand RRU/WRU or provisioned RCU/WCU), adjustable; account provisioned 80,000; min 1 RCU and 1 WCU; 4 decreases at start of UTC day, up to 27/day; reserved capacity 1,000,000 units; no practical table-size limit; 2,500 tables/Region (account team up to 10,000); 400 MRSC global tables; replica backfill 10 TB/day; 5 LSI; 20 GSI default; vector and streams tables recorded | Contributor Insights points at CloudWatch. RCU/WCU not wired as completed rps. Outside the canonical 18. |
| Azure Front Door | Composite route metric 5,000 per profile | Other origin/endpoint limits are on the subscription-limits page, not this file. Classic retires 31 March 2027. Stays Partial. |
| Azure Application Gateway | Autoscaling min 0–100; instance count 0–125 (default max 10); manual 1–125; each instance ~10 Capacity Units; scale-in drain 5 min; provision ~3–5 min; Basic ~200 connections/s (estimated, RSA 2048 TLS) | Autoscaling article, not a quota table. Stays Partial. |
| Azure Container Apps | Express/Sandbox 2,000 cores; Express 30 replicas; 200 Express environments per region | Default environment/core/GPU numbers depend on the subscription and are not on the page. Regional capacity is not a quota. Stays Partial. |
| GCP Cloud Run | 1,000 services/jobs/worker pools per project+region (adjustable); 100 instances default; 1,000 concurrent requests per service instance; 80 per Cloud Run instance; request timeout 60 min; HTTP/1 body 32 MiB; memory 32 GiB; 8 vCPU; GPU default 0 (new L4 projects granted 3); Admin API 3,000 reads and 180 writes per 60 s | No direct limit on image size or service-wide concurrency. Regional CPU/memory totals have no number on the page. Not wired as node throughput. Outside the canonical 18. |
| GCP Cloud Storage | Object 5 TiB; bucket writes and reads unlimited after scale (initial ~1,000 writes/s and ~5,000 reads/s); bucket create/delete ~1 per 2 s; Google and Internet egress default 200 Gbps per region (CDN exempt on Google egress) | Bandwidth may be lower by billing history. Rapid Cache and XML multipart rows are in the catalog. Outside the canonical 18. |
| GCP Cloud CDN | Default TTLs 3,600 s client and default, max 86,400 s; serve-while-stale 86,400 s; expiration cap 2,592,000 s; eviction by 30 days unused; cached body 100 GiB with byte ranges, else 10 MiB | Caching page, not a quota table. Stays Partial. |
| Azure Blob Storage | 50,000 blocks per block or append blob. Block in a block blob 4,000 MiB; block blob ≈ 190.7 TiB. Append block 4 MiB; append blob ≈ 195 GiB. Page blob 8 TiB (not with hierarchical namespace). 5 stored access policies per container. Target 3,000 rps per block blob; 500 rps and 60 MiB/s per page blob. Put Blob single write 5,000 MiB on 2019-12-12+. High-throughput Put Block > 256 KiB. | Account capacity and account ingress/egress are not on this page. Request rates are high-end targets, not ceilings. 503/500 on a hot partition. Not wired as node throughput. Outside the canonical 18. |
| Azure Database for PostgreSQL | Flexible server. 15 connections reserved (can change). Default max_connections by SKU, e.g. B1ms 50 (35 user), B2s 429, up to 5,000 on larger D/E SKUs. Set at provision; later compute change does not update the default. Hardware maximum cannot be changed; max_connections is a restart setting and the page advises against raising it. PgBouncer start at vCores × 2–5. Storage 2× scale-up only; read-only at 95% or <5 GiB free. Stopped server autostarts after 7 days. | Compute/storage GB and prices are on other articles. Burstable has no built-in PgBouncer. Not wired as server count. Outside the canonical 18. |

**Limit type from Verified-limits prose (M1 + Decision 11)**

| Plan cue | limitType | May cap |
| --- | --- | --- |
| "fixed" | hard_limit | yes, if a number is stated |
| "adjustable" | adjustable_quota | yes, if a number is stated |
| "best-effort" | best_effort_target | no |
| "guidance" | performance_guidance | no |
| a default or range the operator sets | configurable_setting | no |
| delivery, failover, ordering, replication, durability | documented_behavior | no |
| a stated number with no "fixed" or "adjustable" | quota_adjustability_unknown | no |

If the plan text does not state a number, omit the value and set status unknown. Only hard_limit or adjustable_quota may cap, and only when the value is present.

**Rules this adds to the catalog (proposed)**

- Status gains "Partial" (some of the item found). Limit type gains "configurable setting", "documented behavior" and "quota, adjustability not checked".
- A value can depend on the deployment: ElastiCache serverless versus node-based, Aurora engine version, Azure SQL tier. Store that as a condition, not a footnote.
- Pub/Sub is one catalog entry offered under both Queue and Event bus. Not yet confirmed by you.
- A variant carries a retirement status and date (for example Azure Cache for Redis).
- Figures that only ChatGPT reported, such as a Google load balancer timeout maximum of 86,400 s, stay unverified until a page confirms them.

## Simulation engine

Product phases stay **0–5** (roadmap). Inside the engine, slices are **E1–E4** so “Phase 4 Monte Carlo” never replaces product Phase 4 persistence.

| Slice | What | Product phase |
| --- | --- | --- |
| **E1** | Closed-form **steady state**. Nothing failing, nothing bursting. Jackson traffic + M/M/c (Erlang C) + G/G/c (Allen-Cunneen). Hockey-stick wait, Analytic percentiles, headroom. | Phase 1 |
| **E2** | Seeded discrete-event as **verifier** of E1 (N7), then deep runs | End of Phase 1, into Phase 2 |
| **E3** | Bursts, failures, retries, autoscale lag | Phase 4 (F8, F9). Faults tab stays visible in E1, unused |
| **E4** | Monte Carlo ranges | Later. Not product Phase 4 |

|  | Analytic (E1 default) | Discrete-event (E2+) |
| --- | --- | --- |
| Data unit | Closed-form λ, ρ, wait | Individual request objects |
| Cost | Cheap | Grows with request count |
| Answers | Stable / Saturating / Unstable; ρ; mean wait; Analytic p50/p95/p99; queue length; headroom | Sampled tails, bursts, faults |
| Use it for | Sizing at a stable load | Checking E1, then E3 |

Do **not** use Kahn topological order as the traffic solver. Cycles (retries) are normal; Jackson is a linear system. Graph tests: disconnected nodes do not steal load; duplicate hops do not double-count; async is excluded from user-facing sync latency; cycle members still conserve flow.

### Why this is not +/- (hockey-stick)

Load 290 rps, each server μ = 50 rps (S = 20 ms). Capacity ≥ load says all three rows are fine. Erlang C does not.

| Servers | ρ | Mean latency W | p95 wait | Old rate model |
| --- | --- | --- | --- | --- |
| 6 | 97% | 111 ms | 290 ms | “OK, 300 ≥ 290” |
| 7 | 83% | 29 ms | 40 ms | “OK” |
| 8 | 73% | 23 ms | 17 ms | “OK” |

6 servers is technically stable and about 5× slower. That table is the Phase 1 acceptance case (J14).

### E1 Analytic runtime

**Traffic.** Solve λᵢ = γᵢ + Σⱼ λⱼ·pⱼᵢ (Jackson). Fan-out, cache hit ratio, read/write split and replica multipliers are routing probabilities. Payload size is a bandwidth check on the edge, not a silent cap on λ.

**Component.** Servers c, service time S, μ = 1/S, ρ = λ/(cμ). Wait uses Erlang C for M/M/c. Non-Poisson arrivals and service use Allen-Cunneen G/G/c with two SCV inputs (arrival Ca², service Cs²). Mean latency W = Wq + S. Queue length from Little’s law. Catalog **hard_limit** and **adjustable_quota** may cap c or μ; best-effort and guidance never cap; unknown never caps.

**Percentiles.** M/M/c wait tail has a closed form. End-to-end p50/p95/p99 is a moment-matched gamma along the path. Means add exactly; percentiles do not. Label **Analytic**. Check against discrete-event (N7). Not Measured. Not a 92% claim.

**Overload branch (old fluid rate stepper).** If ρ ≥ 1, status **Unstable**. Bounded buffer → drop probability (M/M/c/K). Unbounded queue → growth rate. This is where rate subtraction survives:

$$\text{offered} = \text{admitted} + \text{rejected} + \text{network drop},\qquad \Delta B = (\text{admitted} - \text{completed})\,\Delta t$$

**Component library (canonical kinds, still provider-agnostic)**

| Kind | Model |
| --- | --- |
| Server pool / service / worker | M/M/c |
| Load balancer | Split with an imbalance factor |
| Cache / CDN | Hit ratio splits the flow |
| Database | Connection pool as c; read/write service times |
| Queue / broker | Consumer rate vs arrival; lag growth when unstable |
| External / cross-provider link | Fixed latency, Estimated until measured (Decision 17) |

**Inputs.** Arrival rate and mix (Workload tab), payload size, S and SCV per component (each Estimated / Vendor / Measured), SLO latency, utilization ceiling (default 70%). Phase 1 Analytic profile is **constant**. Simulated may **Ramp** 0→target.

**Outputs.** Status Stable / Saturating / Unstable. Per component: ρ, wait, Analytic p50/p95/p99, queue length, throughput. Bottleneck: highest ρ and which component limits the SLO first. Headroom: max rps before SLO or ceiling (bisection) plus N+1. Hockey-stick chart: latency vs load. Cost C0 is typed `/hr` with 24 h / 730 h rollups; catalog has no SKU prices. Sourced F11 (C1–C4) stays later (Decision 2).

**Runtime.** TypeScript in `web/packages/engine` (provider-agnostic, no React). Layout: `schema/`, `compile/`, `analytic/`, `des/`, `verify/`, `worker/`. A Web Worker protocol exists; Workspace Run uses it with 8 ms Simulated yields and cancel. Decision 8’s 5,000,000-arrival Simulated **UI** guard stays until a recorded named-machine benchmark. The engine itself takes an `eventBudget` (design default 50,000,000). Rust/WASM is an option only if that benchmark requires it. Do not claim 10K+ RPS, 0 GC pauses, 200 ms for 60 s, 92% fidelity, or 60 FPS.

**Build order (engine-design.md E1.1–E1.11).** Schema+compile → Jackson traffic → queue formulas → Zipf/kinds → path sampler + headroom → DES core → self-checks → worker yield/cancel → UI Analytic/Simulated → calibration fit → agreement+benchmark. E1.1–E1.9 and E1.11 agreement (mean 8% frozen after first runs; p99 wait 30% when Analytic p99 ≥ 10 ms, ρ ≤ 0.85) are in the engine package and Workspace/Results. E1.10 calibration fit and a named-machine DES benchmark stay next. Decision 8’s 5M Simulated UI guard stays until that benchmark. Product phases stay 0–5.

**Acceptance (necessary, not sufficient to close product Phase 1).** The 6/7/8-server table is reproduced exactly. Little’s law, Jackson conservation, latency never decreases as load rises. Unstable is always flagged, never silently capped. Analytic vs discrete within the stated N7 tolerance on five reference graphs is E2. **Closing product Phase 1 still requires a real load test of the 9-block reference stack (Decision 6).** J12 A/B stay blocked until that recording exists.

### Overload rate stepper (kept)

The existing fluid Δt loop is the overload branch, not the sizing answer. Hop labels that add up (290 = 240 + 50) are Jackson conservation. They must not be presented as “the engine.”

**Worked example: unbounded overload** (illustrative). 16 slots, 100 ms per event, μ = 160 /s, K = 50.

| Offered | ρ | What happens |
| --- | --- | --- |
| 150 /s | 94% | Analytic: Stable; Erlang-C wait (J4) |
| 200 /s | 125% | Unstable; backlog grows 40 /s; fills 50 places in 1.25 s; then 40 /s rejected |

### Discrete-event runtime model (E2 verifier, then E3)

Discrete-event mode follows individual requests. It answers "do the Analytic formulas match a seeded run?" (E2) and later "what do queues, bursts, retries, timeouts and failures do to the tail?" (E3). It reads the same topology and the same component and edge definitions as Analytic mode.

**A request** carries: a request id and a trace id, its class, request and response bytes, creation time, deadline and priority (when set), attempt count, and the path taken so far. Retries keep the trace id and increase the attempt count.

**The scheduler** is a min-heap of events ordered by `(time, sequence number)` so equal timestamps stay deterministic. Time is simulated, not wall time. There is no blocking loop: the engine pops the next event, handles it, and may schedule new ones. Components and edges are arrays with fixed ids; iteration never depends on hash-map order. Randomness is one seeded `xoshiro128**` stream inside the engine (not a library `SmallRng` whose output can change between versions). Seed + topology + workload is the whole scenario. The first discrete run is constant Poisson, no faults; a warm-up interval is discarded from **N7 histograms and KPI numbers** before comparing to Analytic. Warm-up ticks are **kept** for the Simulated canvas so queues are seen filling from empty. Simulated may Ramp offered λ from 0 to the Workload target; Analytic still solves the target. Several seeds and confidence intervals come with E2, not E1.

| Event | What it does |
| --- | --- |
| `arrive` | A request reaches a component. If a server is free it starts service; else it joins the queue; if the queue is full it is rejected (application rejection) |
| `start-service` | Draws a service time from the class distribution and schedules `finish-service` |
| `finish-service` | Frees the server, takes the next queued request (by priority, then arrival), and routes the finished one along its edges |
| `send` | Applies network latency, loss (a network drop), serialization if on, and bandwidth queueing; schedules `arrive` at the target |
| `timeout` | Fires when a sync call has waited too long. The request is marked timed out; a retry is scheduled if eligible |
| `retry` | Schedules a new attempt after the backoff, within the retry budget and the deadline |
| `breaker-change` | Moves a circuit breaker between closed, open and half-open |
| `fault` | Starts or ends an injected fault: crash, latency spike, link cut, loss |

**Deadlines and priority.** A request past its deadline is dropped at the next event and counted as expired. Within a queue, higher priority goes first.

**Cache.** Analytic uses the configured aggregate hit ratio `h` (miss fraction `1 − h` loads the origin). Discrete-event must reproduce that same `h` in steady state. A Zipf working-set key model is the E2 way to get miss storms; it does not replace `h` in E1 and it does not invent a measured hit ratio.

**Metrics.** Every request logs its path and timestamps, so sampled P50, P90 and P99, queue depth over time, and per-class counts all come from the same record, and a single trace can be opened and replayed. These sample tails check Analytic percentiles (N7); they do not stamp Measured.

**Where the modes differ, on purpose.** Under bursts, priorities, deadlines, finite queues, faults and random variation, discrete-event mode will show higher tail latency and earlier rejections than Analytic. That is the reason E2/E3 exist. They are compared only in stable, light-load cases (N7). ρ ≥ 1 is Unstable in E1, not a silent cap.

**What Results and the canvas show (E1).** Status Stable / Saturating / Unstable. Cards: ρ, wait, Analytic p50/p95/p99, queue length, throughput. Card p99 is empty when wait rounds to 0 ms or Show mode is Instantaneous. Summary bar: load, Analytic latency, errors, bottleneck, cost unknown until typed `$/hr` (partial N of M; day ×24, month ×730 h; not Simulated duration; not catalog SKUs). Hockey-stick (F30): latency vs load; headroom and N+1. A `traffic_generator` counts offered as emitted and loss as 0. Light-load Generic reference (Read 200, Write 40, Async 30, Bulk 20) should agree on utilization within N7 (CDN ~3%, Service ~6%, Queue ~5%, Worker ~19%, Object store ~3% = 20 rps × 5 ms / 4 servers). Object store is M/G/c, not a delay-only External. Analytic has no timeline. Simulated emits one tick per dt and live-paces 1× (including warm-up). No VCR scrubber. Show mode Instantaneous is the last dt; Average is 0→now. Queue depth is live. KPI after Simulated is the post-warm-up window.

## Calibration

A number is trusted in proportion to its evidence, and the screen always shows which evidence it has. The simulator ships no invented benchmark: a value either has a source, or it is an estimate the user typed, labeled Estimated.

**Confidence labels, in order of trust**

| Label | Meaning | Example source |
| --- | --- | --- |
| Measured | Taken from a load test of this service, with the setup recorded | A user's imported CSV; a published test with its raw data |
| Vendor figure | Published by the provider or the software's maintainers | A documented quota or a vendor benchmark page |
| Estimated | Entered or defaulted, with no external evidence | A user's best guess; a placeholder to replace |

When several profiles apply to one component, the simulator uses the most trusted one and shows the others as alternatives. It never blends them silently.

**A profile records:** the component kind, source URL or dataset name, capture date, software or service version, region and tier or SKU, request class, the configuration under test, the values (mean service time S, optional arrival and service SCV, saturation point, limits), the label, and who added it. Phase 1 Analytic reads S and SCV. Unknown S keeps wait unknown.

**Calibration screen (Phase 1).** The user types measured p50/p95 from a load test of **this** service. The engine may derive S and SCV for Allen-Cunneen. That fit is **Estimated** unless an imported load-test CSV of this service exists (Measured). Decision 16 still: no full distribution-family fit in v1; discrete-event resamples the CSV when present. Only calibrated results may carry a Measured stamp. Fitting does not close J12.

**Three files, do not mix them.**

| File | Where | What it does today |
| --- | --- | --- |
| Calibration profile CSV | Calibration page | Merges typed fields onto profiles. A `measured` column is a library dump, not a k6 log |
| Load-test CSV (`timestamp,requestClass,latencyMs,status,rps`) | Engine parser; Decision 14 mapping screen not built | Reads rps and latency points. Does not label a profile Measured |
| Recorded-test JSON (schema 1, `kind: lab`) | Results → Load recorded test | Fills J12 A/B inputs. Does not stamp Measured on profiles. A/B stay blocked without a lab recording (Decision 6) |

**Importing a load test.** The intended user flow is still a CSV of requests or of intervals (F10, F28). A proposed minimum is below; the mapping screen with JMeter and k6 presets is Decision 14 and is not built.

| Column | Needed for |
| --- | --- |
| `timestamp` | Ordering and arrival rate |
| `requestClass` | Service time per class |
| `latencyMs` | Service-time distribution |
| `status` | Error and rejection rates |
| `concurrency` or `rps` | Where latency starts to climb: the saturation point |

Decision 16 (Oct 19): no **distribution family** fit in the first release. Show median and P95 from the data and let discrete-event resample the measured values. Low-sample files get the low-sample label. **Amended Oct 28 for E1:** Allen-Cunneen needs two SCV numbers. Deriving S and SCV from typed or imported p50/p95 is allowed and stays Estimated unless the CSV is a real load test of this service (Measured). That is not a gamma/lognormal package fit. The latency-knee rps is the throughput where latency climbs (J12 B, tolerance after the first measurement).

**Typing values by hand (F28, decided Oct 19, 2026).** A user does not need a load test. Each profile has editable fields for the median and P95 service time per request class, the connection pool and other capacity inputs, and can add custom request classes. The label follows the evidence: no source gives Estimated, a source link gives Vendor figure, an imported CSV gives Measured. Typed values never get the Measured label. The writes-per-second bound is calculated from the typed values, not typed. The CSV hint reads "concurrency or requests per second", matching the table above. Decided Oct 19, 2026: any valid link is accepted and its date recorded; the label shows Vendor figure with "source not checked" until confirmed.

**Checking the simulator against real data.** Fidelity (N1) is measured by simulating a recorded test's workload and comparing which components saturate first. The correlation metric and the dataset are open decisions (see Decisions). The Blueprint's 92% target is dropped for now, and the app claims no fidelity number until the metric and dataset are set.

**Freshness.** Profiles show their age. Provider quotas and prices carry a read date and are flagged after a set time (to be decided).

**Separation rule.** The service catalog says what a service can be configured to do. The calibration library says what it measured. A catalog entry is never used as a measurement.

## Validation and tests

Every test below is written before the code it checks. Where a tolerance cannot be known before a first measurement, the Status column says so; it is fixed once and recorded before any comparison run, because a tolerance picked after seeing results proves nothing.

| # | Test | Setup | Pass when | Status |
| --- | --- | --- | --- | --- |
| J1 | Flow conservation, overload branch | Any topology, every step, every component and class | offered = admitted + rejected + network drop, and ΔB = (admitted − completed) Δt, to floating-point precision | Defined |
| J2 | Flow conservation, discrete-event | Any run | Requests created = completed + rejected + dropped + expired + still in flight at the end | Defined |
| J3 | Deterministic replay | Same topology version, workload, mode, seed and calibration, run twice | The two event logs are byte-identical | Defined |
| J4 | Queueing theory | One component, Poisson arrivals, exponential service times, c servers | Analytic ρ = λ/(cμ); wait matches Erlang C (exact formula). Discrete-event mean wait matches within N7 over many seeds. M/M/1 at ρ = 0.8 gives W = 5·S | Decided: very tight tolerance (exact formula) |
| J5 | Mode agreement | Stable, light load (utilization below about 50%) on the reference architecture | Analytic vs discrete utilization, throughput and mean wait agree within the tolerance | Decided: 5% mean / 10% p99 to start (labeled guess), fixed when tests are written |
| J6 | Routing examples | Weighted, broadcast, fan-out; plus disconnected nodes, duplicate hops, async off the sync latency path, cycles | Offered rates match the worked numbers; disconnected nodes steal no load; duplicates do not double-count; cycles conserve (Jackson, not Kahn) | Defined |
| J7 | Retry behavior | Failing dependency with f = 0.1 and 2 retries | Attempts per request converge to 1.11; retries never exceed the budget | Budget value fixed after the first measurement |
| J8 | Cache hit rate | Discrete-event cache with a key distribution | Measured hit rate reproduces the configured aggregate within the tolerance | Tolerance fixed after the first measurement |
| J9 | Fault: node crash | Crash a component mid-run | Its inflow becomes rejections or timeouts from that moment; blast radius lists the affected components | Defined |
| J10 | Fault: link cut, loss, latency spike | Cut a link; set loss p; add a delay | A cut gives 100% network drop on that edge; measured loss approaches p; latency rises by the added delay | Defined |
| J11 | Circuit breaker | Failing dependency | Transitions follow the rule below | Decided Oct 19, 2026 |
| J12 | Fidelity | Recorded load test of the reference architecture | Simulated and measured bottleneck ranking correlate above the KPI | Decided: A and B pass, C diagnostic; B tolerance after the first measurement. Blocked until a lab recording exists (Decision 6) |
| J13 | Jackson traffic | Multi-node graph with cache hit, fan-out, R/W split | Solved λ matches the linear system; throughput never exceeds offered | Defined |
| J14 | Hockey-stick table | 290 rps, S = 20 ms, c = 6, 7, 8 | ρ, mean W and p95 wait match the Phase 1 table; 6 servers is not reported “OK” | Defined |
| J15 | Little’s law and monotonic wait | One M/M/c swept in load | L = λW; wait never falls as λ rises | Defined |
| J16 | Unstable never silent | ρ ≥ 1, bounded and unbounded | Status Unstable; drop probability or growth rate; no silent cap | Defined |

**Circuit-breaker rule (decided Oct 19, 2026).** Closed to open when the error rate over a sliding window reaches the threshold and at least a minimum number of requests were seen. Open to half-open after the open duration. In half-open, a small number of probe requests are allowed: if they succeed the breaker closes, and if one fails it opens again. Requests rejected while open are counted as breaker rejections, separate from application rejections. All parameters are configurable with documented defaults.

An example in J4, from the earlier worked numbers: 16 servers, 100 ms service time and 150 arrivals per second give utilization 93.75% and an expected wait of about 73 ms. The test recomputes this value; it is not assumed. J14 is the 6/7/8-server hockey-stick at 290 rps.

## Architecture and stack

The simulation runs in the browser and the backend only stores data, so v1 needs four layers. Where the two source docs disagree, this table picks one and says why.

| Layer | Choice | Why | Status |
| --- | --- | --- | --- |
| UI | React 18, TypeScript, React Flow canvas | Both docs agree | Source |
| UI state | Zustand for visual state; engine state kept inside the worker | Prevents re-render storms from simulation ticks | Source: blueprint |
| Engine language | TypeScript in a Web Worker first, behind a stable engine interface; port the hot loop to Rust/WASM only if profiling shows it is needed | Docs disagree (Rust/WASM versus TypeScript). TypeScript is faster to build and validate; the interface keeps the later swap cheap | Proposed |
| UI to engine messaging | Batched snapshots by message passing; move to SharedArrayBuffer only if measured necessary | SharedArrayBuffer needs cross-origin isolation headers on hosting | Proposed |
| Charts | Recharts or Chart.js; choose one in Phase 2 | Blueprint lists both | Open |
| Backend | Node.js API: auth, topology save and load, calibration library, CSV import | Matches blueprint; no simulation runs here | Source |
| Storage | PostgreSQL; add Redis only when sessions or caching need it | Blueprint lists Redis for sessions; not required for a first version | Proposed |

The blueprint's WebSocket or gRPC-Web link between the engine and backend has no purpose while the simulation is client-side, so it is dropped from v1 and kept as an option for server-side runs of very large models.

### Engine interfaces

The types below follow the System model and Simulation engine sections. They compile under `tsc --strict`, and the checks at the end reproduce the worked numbers of the shared edge contract (all six returned true when run). Values that wait on a first measurement are marked in a comment. Nothing in the core names a cloud provider; the provider appears only in the optional binding.

**Component and value types**

```typescript
export type RequestClassId = string; // defaults: read, write, async, bulk; custom allowed
export type Confidence = "measured" | "vendor" | "estimated";

/** Set (with evidence), unknown, or not applicable. Never silently defaulted. */
export type Value<T> =
  | { state: "set"; value: T; confidence: Confidence; sourceId?: string }
  | { state: "unknown" }
  | { state: "not_applicable" };

export type Distribution =
  | { kind: "constant"; ms: number }
  | { kind: "exponential"; meanMs: number }
  | { kind: "lognormal"; medianMs: number; sigma: number };

export type CanonicalKind =
  | "traffic_generator" | "gateway" | "load_balancer" | "service" | "worker"
  | "queue" | "event_bus" | "cache" | "relational_db" | "nosql_db"
  | "object_storage" | "cdn";

export interface Component {
  id: string;
  name: string;
  kind: CanonicalKind;
  behavior: {
    servers: Value<number>;
    serviceTime: Record<RequestClassId, Value<Distribution>>;
    queueCapacity: Value<number | "unbounded">;
    throughputLimitRps: Value<number>;
    scaling: Value<{ min: number; max: number; delaySec: number } | "fixed">;
    cacheHitRate?: Value<number>; // caches only
  };
  providerBinding?: ProviderBinding;
  calibrationProfileIds: string[];
}

export interface ProviderBinding {
  provider: "aws" | "azure" | "gcp" | "kubernetes" | "self_hosted";
  service: string; // catalog entry id
  sku?: string;
  region?: string;
  quotas: { name: string; value: number; sourceUrl: string; readOn: string }[];
}
```

**Shared edge contract**

```typescript
export type Routing =
  | { mode: "single" }
  | { mode: "weighted"; weight: number }
  | { mode: "broadcast" }
  | { mode: "conditional"; classes: RequestClassId[] }; // v1: by class only

export interface Edge {
  id: string;
  from: string;
  to: string;
  routing: Routing;
  fanOut: number; // calls per routed request, default 1; not a probability
  classes: Record<RequestClassId, { requestBytes: number; responseBytes: number }>;
  network: {
    latencyMs: number;
    bandwidthBps?: number;
    bandwidthApplies: "request" | "response" | "both";
    lossProb: number; // network drop only
    serialization: boolean;
  };
  call: { kind: "sync" | "async"; timeoutMs?: number; deadlineMs?: number };
  retry?: { max: number; backoff: "fixed" | "exponential"; baseMs: number;
            budget: number /* fixed after first measurement */; onlyIdempotent: boolean };
  breaker?: { errorThreshold: number; windowMs: number; openMs: number; probes: number }; // rule decided Oct 19, 2026
}
```

**Runtime state, both modes**

```typescript
/** Fluid mode: rates per second, one record per edge and class. */
export interface FluidEdgeState {
  offered: number;
  delivered: number; // after network loss and bandwidth
  admitted: number;  // accepted by the receiver
  completed: number;
  retried: number;
} // dropped is derived (offered minus delivered is network drop; delivered minus admitted is rejection), never stored

/** Discrete-event mode. */
export interface SimRequest {
  id: string; traceId: string; classId: RequestClassId;
  requestBytes: number; responseBytes: number;
  createdAtMs: number; deadlineMs?: number; priority?: number;
  attempt: number; path: string[];
}

export type SimEvent =
  | { t: number; seq: number; type: "arrive"; req: SimRequest; at: string }
  | { t: number; seq: number; type: "finish-service"; req: SimRequest; at: string }
  | { t: number; seq: number; type: "timeout"; req: SimRequest; edge: string }
  | { t: number; seq: number; type: "retry"; req: SimRequest; edge: string }
  | { t: number; seq: number; type: "breaker-change"; edge: string; to: "closed" | "open" | "half_open" };
```

**Worked examples as checks**

```typescript
export function offeredRate(
  routing: Routing, fanOut: number, admitted: number, group: number[] = [],
): number {
  switch (routing.mode) {
    case "single":
    case "broadcast": return fanOut * admitted;
    case "weighted": {
      const sum = (group.length ? group : [routing.weight]).reduce((a, b) => a + b, 0);
      return (routing.weight / sum) * fanOut * admitted;
    }
    case "conditional": return fanOut * admitted; // admitted is already the class share
  }
}

/** Attempts per request: sum of f^i for i = 0..r. */
export const attemptsPerRequest = (f: number, r: number): number =>
  f === 1 ? r + 1 : (1 - Math.pow(f, r + 1)) / (1 - f);

export function conservationHolds(
  s: { offered: number; admitted: number; rejected: number; networkDrop: number },
  eps = 1e-9,
): boolean {
  return Math.abs(s.offered - (s.admitted + s.rejected + s.networkDrop)) <= eps;
}

// Expected: weighted 200 and 600; broadcast 150; fan-out 400; retries 1.11; conservation true
```

Before building: `FluidEdgeState`'s drop counts are derived from the stored rates (overload branch). J4, J5 and J13–J16 need their tolerances recorded before comparison runs. Analytic percentiles stay labeled Analytic.

## Data model

Seven entities cover v1: a topology owns components and edges, a workload and a run use them, and calibration profiles feed the components.

| Entity | Holds | Links to |
| --- | --- | --- |
| Topology | name, owner, version, canvas layout | Has many Components and Edges |
| Component | type, position, concurrency, capacity, per-class service times, failure settings | Belongs to a Topology; references a Calibration profile |
| Edge | source, target, fan-out multiplier, routing probability, latency, bandwidth, per-class rate, payload size, call semantics | Connects two Components |
| Request class | name, default cost and cacheability | Used by Edges, Workloads and Profiles |
| Workload | load shape (constant, Poisson, step, spike), parameters, per-class mix, seed | Applies to a Topology |
| Calibration profile | component type, request class, service-time distribution, pool size, max throughput, hardware, version, date, source, confidence | Referenced by Components |
| Run | topology version, workload, mode, seed, metrics time series, invariant results | Belongs to a Topology; reproducible from its seed |

A Run stores the topology version and seed it used, so any past result can be replayed exactly.

## Roadmap

Build the engine and prove it against theory and one real stack first, then add the canvas around it. Each phase ends only when its exit criteria pass. Durations are left open until the team size is known.

| Phase | Scope | Exit criteria |
| --- | --- | --- |
| 0. Lock requirements | Apply the decisions in Decisions; fix request classes and limits (N6); sign off the edge contract and the circuit-breaker rule | Decisions recorded; requirements table signed off |
| 1. Engine core and validation | **E1 Analytic:** Jackson traffic, Erlang C, Allen-Cunneen, canonical schema (F15), generic catalog (F16), edge contract (F19), tests J4, J6, J13–J16 (hockey-stick table). Overload rate stepper kept for ρ ≥ 1 (J1). **E2 starts:** discrete-event kernel as verifier (J2, J3, J5), not the sizing UI. One 9-block reference. | Hockey-stick table reproduced; Little’s law; unstable never silently capped; M/M/c matches theory. **Close still needs a real 9-block load test (Decision 6).** |
| 2. Canvas, config and telemetry | React Flow canvas, provider services, config (unknown shown), Workload tab (constant + SCV), request-class filter (F24), worker, ρ/wait/Analytic percentiles on cards, hockey-stick and headroom (F30, F23) | A user builds the reference stack, runs Analytic, sees Stable/Saturating/Unstable and the 6-vs-8-server wait story. 60 FPS unclaimed (Decision 8) |
| 3. Calibration and catalogs | Calibration library with CSV import, typed S/SCV (F28, F10), bottleneck explainer (F23), J8, first provider catalog as data (F17). Discrete remains the verifier | Every number in a run shows its profile source; N7 agreement on a stable scenario |
| 4. Faults and persistence | Fault injection and blast radius (F8, F9) = engine slice **E3**; save/load; **auth/Postgres only in this phase**; templates and tutorials (F22, F20); F18 capacity/limits; F11 cost; more catalogs. Monte Carlo is Later (E4), not this phase | Chaos checks trip upstream breakers; topologies survive reload and replay exactly |
| 5. Fidelity validation and hardening | Compare reference architectures with real load tests, including the reference mapped to each provider; enforce limits; test J12 | Bottleneck predictions checked against real load tests; gaps documented per profile |
| Later | Nested sub-systems, IaC export, multi-region, server-side runs, challenge mode (F21), topology import (F25), Monte Carlo (E4) | Scheduled after Phase 5 results |

## Risks

The biggest risk is a simulator that looks precise but is wrong; the calibration layer and early validation exist to address it.

| Risk | Effect | Mitigation |
| --- | --- | --- |
| Calibration data is thin or stale | Confident but wrong predictions | Show source and confidence on every number; import the user's own load tests; early validation loop |
| A run looks like frozen arithmetic (rps labels, 300 ≥ 290) | Reviewers call it a toy and stop trusting the engine | Decision 19: E1 hockey-stick (Erlang C). Decision 18: do not fake professionalism with particles. Rate stepper is overload-only |
| Fidelity goal is hard to define or measure | KPI cannot be proven | Define the correlation measure in Phase 0; report fidelity per profile |
| Discrete-event runs are too slow at large scale | Poor interactivity | Use Analytic for scale; Discrete as verifier then E3; Decision 8 guard; profile before Rust/WASM |
| Models too simple (capacity ≥ load) miss the wait hockey-stick | 6 servers reported OK at 97% util | E1 Erlang C / Allen-Cunneen; J14 table |
| Scope grows toward a general infrastructure tool | Build never finishes | Keep IaC export and nested systems out of v1 |

## Decisions

Every open design and architecture item in this plan, grouped for discussion. Items 1 to 17 were decided on Oct 19, 2026 by accepting my recommendation; each shows its decision under the item. Decision 18 (how a run is shown) and Decision 19 (Phase 1 engine is Analytic steady-state) were added Oct 28, 2026 after a stakeholder review that called the rate model a toy. Decision 20 (same day) records what to copy from SysSimulator’s DES pages and what not to claim. Who the users are is out of scope for now (Oct 19, 2026): decisions here follow from the design and architecture alone.

Each item has four lines: what it is, the options, my recommendation, and what it blocks. To change one, tell me in chat and I will update the item and what it blocks.

### Group 1. Design and architecture choices

#### 1. Which provider ships first

- **What it is.** The engine and generic catalog are cloud-agnostic (F16). The first release still needs one provider catalog filled in with sourced data (F17).
- **Options.** AWS, Azure, GCP or Kubernetes. Priority 1 checking so far: AWS has 26 rows (10 verified, 9 partial, 7 unknown), Azure 16 (7, 6, 3), GCP 16 (10, 2, 4). Kubernetes has not been checked.
- **Recommendation.** AWS first. It has the most rows checked, and the Phase 1 catalog entries (Lambda, SQS, S3, CloudFront) are AWS. The cost is its 7 unknown rows, which I finish before release.
- **Blocks.** Which catalog entries the first release loads, and which services are P0 (item 3).

**Decided Oct 19, 2026.** AWS ships first.

#### 2. Cost in the first provider comparison

- **What it is.** F11 (cost estimate from instance and pricing inputs) is P1. F18 compares one topology across providers. The question is whether the first comparison also shows cost.
- **Options.** (a) No: the first comparison covers capacity and limits only. (b) Yes: every catalog entry also needs a sourced price with a read date and a freshness rule.
- **Recommendation.** (a). Prices change often and need their own sourcing rules. The first release's strength is sourced capacity, so add cost afterward.
- **Blocks.** Whether catalog records need a price field now, and the size of the catalog phase.

**Decided Oct 19, 2026.** (a): the first comparison covers capacity and limits only; cost comes afterward.

**Amended Oct 29, 2026.** Cost is how “reduce usage” is priced. It is not a 24 h DES recording. Slices: **C0** typed `$/hr`, partial N of M, `$/day` = ×24, `$/mo` = ×730 h, unknown stays unknown, catalog never fills the number (shipped). **C1** AWS 9-block on-demand `$/hr` from official pages the user quotes (Vendor figure). **C2** usage lines (request / GB / GB-s) × Analytic λ × 1 h or 1 d. **C3** cross-provider egress, typed then sourced (Decision 17). **C4** provider-compare cost only after C1/C2. Do not invent SKUs. Do not copy SysSimulator `t4g.medium` arithmetic. Engine does not use cost. F11 is not closed by C0. Phase 1/5 still need Decision 6.

#### 3. Which services are P0

- **What it is.** P0 means the service must exist in the first catalog. The 18 Verified services are those with Status = Verified in Components by provider (not the figure table, which splits SQS and includes Azure Load Balancer as a Partial reading).
- **Options.** Keep all 18. Shrink to what the reference topology needs (load balancer, app compute, cache, relational database, queue and worker). Or add priority 2 services.
- **Recommendation.** Treat the 18 as the ceiling for the first provider, and build in the order the reference topology needs so the first demo does not wait for all 18. A service with an engine-capping limit still marked Unknown does not ship until that row is resolved.
- **Blocks.** Catalog build order, and how many Unknown and Partial rows I must close first.

**Decided Oct 19, 2026.** The 18 are the ceiling, built in reference-topology order; a service with an engine-capping limit still Unknown does not ship.

**Amended Oct 23, 2026.** The 18 Verified stay the recorded-figure set for the first provider compare (capacity and limits only; Decision 2). Reducing Listed (not checked) by reading official pages is now in-scope: quote the figure, URL and date; do not invent numbers. Kubernetes objects that are “no limits on page” stay that way until an official limits page exists. SKU prices stay out of the first compare. Closing Phase 1 or Phase 5 still requires a real load test of the 9-block reference stack (Decision 6), not more catalog greys.

#### 4. Pub/Sub as one entry under Queue and Event bus

- **What it is.** Google Pub/Sub works as a queue (pull) and as an event bus (push, fan-out). The catalog has the kinds Queue and Event bus.
- **Options.** (a) One entry listed under both kinds, with its configuration choosing pull or push. (b) Two entries.
- **Recommendation.** (a). The limits are the same service's limits, so two entries would duplicate records and drift apart. The cost is that the kind model must let one service sit in two kinds.
- **Blocks.** The canonical component schema (System model), and how GCP is shown.

**Decided Oct 19, 2026.** (a): Pub/Sub is one entry listed under both kinds.

#### 5. Engine language

- **What it is.** The simulation engine runs in a Web Worker so the canvas stays responsive (N4). The question is what it is written in.
- **Options.** TypeScript: one language across UI, engine and tests, and the Engine interfaces types already compile; slower on very large discrete-event runs. Rust compiled to WebAssembly: faster for large runs, but two languages, a slower start and harder debugging.
- **Recommendation.** TypeScript first, behind a stable engine interface, and measure it in Phase 1. If the discrete-event limits (item 8) turn out too tight, the core can be swapped to Rust/WASM later without touching the UI.
- **Blocks.** Starting Phase 1.

**Decided Oct 19, 2026.** TypeScript first behind a stable engine interface; measure in Phase 1, swap the core to Rust/WASM later only if needed.

### Group 2. Validation and quality

#### 6. Validation data

- **What it is.** Fidelity needs a real system to compare against. Public datasets have latency and, for the Alibaba trace, container CPU and memory, but no saturation ground truth. They describe microservice meshes, not databases, caches or queues. Licenses are unchecked.
- **Options.** (a) Public data only, with a narrow claim: the simulated latency-versus-load curve of an app service stays within a stated error. (b) Public data plus one small reference test for the bottleneck check. Reference topology: load balancer, app service, cache, Postgres, queue and worker pool.
- **Recommendation.** (b). It supports the full goal at small cost. You chose public data on Oct 19, so (a) is the fallback if you do not want to run a test.
- **Blocks.** Item 7, and the first Measured profiles.

**Decided Oct 19, 2026.** (b): public data plus one small reference test. Until that test is run, no profile is labeled Measured.

#### 7. How fidelity is measured

- **What it is.** N1 has no number now (the Blueprint's 92% is dropped). It still needs a definition of "accurate".
- **Options.** A: the simulator names the same first-saturating component as the real test, as a match rate over scenarios. B: the predicted load at which latency climbs is within a stated error of the measured load. C: rank correlation of the order in which components saturate.
- **Recommendation.** A and B as the pass checks, C as a diagnostic only. Choose the tolerance for B after the first real measurement. With public data only (item 6a), neither A nor B can be computed.
- **Blocks.** N1 wording, and the Results screen's fidelity column.

**Decided Oct 19, 2026.** A and B are the pass checks, C is a diagnostic. The tolerance for B is set after the first real measurement.

#### 8. Numeric limits (N6)

- **What it is.** Maximum nodes per canvas, simulated duration, supported browsers and discrete-event request volume. N4 asks for 60 FPS and a responsive UI.
- **Options.** Set numbers now by estimate, or set them after measuring a Phase 1 prototype.
- **Recommendation.** Measure first. Until then the app makes no limit claims. For browsers, plan on current desktop Chrome, Firefox and Safari.
- **Blocks.** The engine language check (item 5), and what the app tells a user who goes past a limit.

**Decided Oct 19, 2026.** Measure first; no limit claims until then. Browsers: current desktop Chrome, Firefox and Safari.

**Oct 22, 2026.** Discrete Run refuses above 20_000 expected arrivals so the tab does not freeze. That is an interim guard, not a closed N6, and not a 60 FPS claim. Nodes per canvas, duration and other volume limits stay unset.

**Amended Oct 29, 2026.** UI guard raised to 5_000_000 (Worker + 8 ms yields). YouTube 60 s Simulated is allowed. 9-block 1 day at 290 rps is still refused. Day-scale answers stay Analytic. N6 still open. No 60 FPS claim.

#### 9. Test tolerances

- **What it is.** Tests J1 to J12 and N7 compare numbers. They need a stated tolerance for "equal".
- **Options.** Tight tolerances where the answer is exact (for example the M/M/c example, 16 servers at 150 per second giving 93.75% utilization and about 73 ms). Looser tolerances where fluid-flow and discrete-event modes are expected to differ.
- **Recommendation.** Exact-formula tests get a very tight tolerance. Cross-mode tests start with a looser starting guess (5% on utilization and latency, labeled a guess) and tighten once we see real differences.
- **Blocks.** Writing J1 to J4 for Phase 1.

**Decided Oct 19, 2026.** Exact-formula tests get a very tight tolerance; cross-mode tests start at 5% (a guess, labeled) and tighten later.

#### 10. The circuit-breaker rule

- **What it is.** Validation and tests defines the breaker states. The rule is decided: it opens on the error rate over a sliding window with a minimum request count.
- **Options.** Error rate over a sliding window with a minimum request count; consecutive failures; or either one. Then how many probe requests the half-open state allows.
- **Recommendation.** Error rate over a sliding window with a minimum request count, plus a fixed number of half-open probes. All parameters stay configurable with documented defaults.
- **Blocks.** The edge contract (F19) and the retry-storm tests.

**Decided Oct 19, 2026.** Error rate over a sliding window with a minimum request count, plus a fixed number of half-open probes; all parameters configurable with documented defaults.

### Group 3. Calibration and catalog rules (proposed, not confirmed)

#### 11. Status "Partial" and the extra limit types

- **What it is.** The verification found values that do not fit the first limit types: documented but adjustability not checked, or a setting rather than a ceiling.
- **Options.** Add the status Partial and the types configurable setting, documented behavior, and quota with adjustability not checked. Or fold them into Unknown.
- **Recommendation.** Add them. The engine rule stays the same: only a hard limit or an adjustable quota may cap a component, so the new types can never silently limit a simulation.
- **Blocks.** F26 and F27 wording, and the Catalog screen's chips.

**Decided Oct 19, 2026.** Add the status Partial and the extra limit types; only a hard limit or an adjustable quota may cap a component.

#### 12. Conditions and retirement

- **What it is.** One service can have different limits by variant: for example 65,000 clients for ElastiCache serverless caches while node-based clusters are Unknown. Variants also retire: Azure Cache for Redis Basic, Standard and Premium retire on September 30, 2028.
- **Options.** Conditions as structured fields the engine can match, or as free text. A retirement status and date per variant, or none.
- **Recommendation.** Structured conditions, so the engine picks the value that matches the user's configuration, plus a retirement status and date per variant shown on the Catalog screen.
- **Blocks.** The limit-record type in Catalog value rules, and the configuration step of the three-level component choice.

**Decided Oct 19, 2026.** Structured conditions the engine can match, plus a retirement status and date per variant.

#### 13. Typed values (F28): is a source link checked

- **What it is.** A user who types values and adds a link earns the label Vendor figure. A link proves nothing by itself.
- **Options.** No check; a format check; a reachability check; or a human review.
- **Recommendation.** Accept any valid link and record the date, but show the label as Vendor figure with "source not checked" until someone confirms it. This keeps the label honest.
- **Blocks.** The wording of the confidence labels on the Calibration screen.

**Decided Oct 19, 2026.** Accept any valid link and record the date; show Vendor figure with "source not checked" until confirmed.

#### 14. Load-test CSV: columns and mapping

- **What it is.** The minimum columns are timestamp, request class, latency in ms, status, and concurrency or requests per second. Tools name their columns differently.
- **Options.** A strict header the user must match; a mapping screen; or a mapping screen with presets for common tools.
- **Recommendation.** A mapping screen with presets for JMeter and k6, with the strict header as the default if the file already matches.
- **Blocks.** The import flow on the Calibration screen.

**Decided Oct 19, 2026.** A mapping screen with presets for JMeter and k6; the strict header is the default when the file already matches.

#### 15. How old a profile or quota may be

- **What it is.** Provider limits and measurements age. The plan says profiles show their age and are flagged after a set time.
- **Options.** One fixed age; an age per source type; or flag when the provider page changes (needs monitoring).
- **Recommendation.** One default age (6 months is a starting guess), adjustable per profile, with no automatic monitoring in the first release.
- **Blocks.** The freshness flag on the Calibration and Catalog screens.

**Decided Oct 19, 2026.** One default age (6 months, a starting guess), adjustable per profile; no automatic monitoring in the first release.

#### 16. How to fit service times from a CSV

- **What it is.** The import must turn raw latencies into something the engine can sample.
- **Options.** A statistics package that fits a distribution; our own small fit; or no fit, sampling directly from the measured values.
- **Recommendation.** No fit in the first release. Show median and P95 from the data and let discrete-event mode resample the measured values, which avoids guessing a distribution shape. Low-sample files get the low-sample label. Add a fitted distribution later if the engine needs one.
- **Blocks.** The engine's service-time model, and Phase 1 scope.

**Decided Oct 19, 2026.** No distribution-family fit in the first release: show median and P95 and resample measured values; low-sample files get the low-sample label.

**Amended Oct 28, 2026 (Decision 19).** Allen-Cunneen needs Ca² and Cs². Deriving S and SCV from p50/p95 is allowed and stays Estimated unless the CSV is a real load test of this service (Measured). Still not a gamma/lognormal package.

#### 17. Cross-provider connections

- **What it is.** A design can now span providers. A connection between components on different providers crosses the internet or a private link and has its own latency, bandwidth and charges. The catalog describes services, not links between providers.
- **Options.** (a) A normal edge with user-entered latency and capacity, labeled Estimated, and no catalog values. (b) A link catalog with sourced values for common provider pairs (egress price, documented bandwidth), with latency still unmeasured. (c) No direct cross-provider edges: the user must place a modeled gateway component.
- **Recommendation.** (a) first, plus a link profile in the calibration library so a measured value can replace the estimate. Add (b) later. The Workspace example already works this way: the Azure to AWS copy link shows its capacity as Estimated.
- **Blocks.** The edge contract (F19, Shared edge contract), which needs a link capacity field, and the cost estimate (item 2), because egress is charged.

**Decided Oct 19, 2026.** (a): a normal edge with user-entered latency and capacity, labeled Estimated, plus a link profile in the calibration library; a link catalog comes later.

### Group 4. How a run is shown, and which engine (added Oct 28, 2026; Decision 20 same day)

#### 18. Professional simulator vs frozen rps labels

- **What it is.** A stakeholder ran (or watched) Fluid on the canvas and said the product is only plus-and-minus calculation (examples: 290 rps, 240 rps, 50 rps), the animation is stopped, nothing changes, and they need a professional simulator, not a toy. Decision 6 fallback (a) still holds: no lab, public/vendor data only, no Measured stamp.
- **What is true.** Hop rates that add up are conservation (N3 / Jackson). That is not a missing engine, and it is not a lab.
- **What is also true.** “300 ≥ 290, therefore OK” is the toy. 6 servers at 97% util is technically stable and about 5× slower than 8 (hockey-stick). Particle overlay on a constant load would move without telling that story.
- **Options.** (a) Keep the rate stepper as the product and decorate it with F30 motion. (b) Motion only, still capacity ≥ load. (c) Default Discrete (Decision 8 guard). (d) Stop until a lab exists. (e) **Analytic E1** (Erlang C / Allen-Cunneen) as the product; hockey-stick and headroom as F30; rate stepper only when ρ ≥ 1; particles later as a view.
- **Recommendation.** **(e)**, which is Decision 19. Reject (a) and (b) as the professional answer. Reject (c) as the default. Reject (d). Do not claim 92% or 60 FPS. Do not close Phase 1 or Phase 5.
- **Blocks.** F7, F23, F30, C1, how we demo a Run.

**Decided Oct 28, 2026 (amended same day).** (e): the professional **Analytic** output is the hockey-stick, not moving dashes. F30 in Phase 1 Analytic is latency vs load and headroom. Particles if needed are a view of ρ(λ), not the engine. No lab, no Measured, no Phase 1/5 close.

**Amended Oct 29, 2026.** Frozen hops after Analytic are Jackson, not a bug. Simulated emits one tick per dt, live-paced to wall time (empty queues filling; optional Ramp 0→target). Show mode is a view, not a third engine: Instantaneous = % of limit and hop `/s` in the last dt; Average = 0→now. DES is still event-driven; dt is the canvas sample, not one DES event. No VCR after the live run. Analytic stays one solve plus hockey-stick. N7 numbers stay post-warm-up. Ramp is a load-test stage, not a more accurate λ than constant Poisson. No 92%, no 60 FPS, no Phase 1/5 close.

#### 19. Phase 1 engine is closed-form steady state

- **What it is.** E1 reports whether a constant load is Stable / Saturating / Unstable, with ρ, Erlang-C (or Allen-Cunneen) wait, Analytic percentiles, queues and headroom. Failures and bursts are out of E1. Product phases 0–5 do not get renumbered: E3 faults map to product Phase 4; E4 Monte Carlo is Later, not persistence.
- **Options.** (a) Keep fluid Δt as the sizing engine. (b) Discrete-only. (c) Analytic Jackson + M/M/c + G/G/c; rate stepper as overload; discrete as verifier then E3.
- **Recommendation.** **(c).** Do not copy Kahn DAG solvers. Workload tab stays (already shipped) and feeds λ plus SCV; Phase 1 profile is constant. Faults tab stays visible, unused until E3. Decision 16: SCV from p50/p95 is Estimated, not a distribution-family fit. Decision 6: analytic-vs-sim on five graphs is necessary and not sufficient to close Phase 1.
- **Blocks.** F6, F7, F23, F30, J4, J13–J16, N7, Calibration SCV fields, Results copy.

**Decided Oct 28, 2026.** (c): Phase 1 is Analytic steady-state queueing. Overload rate model survives only for ρ ≥ 1. Discrete starts as verifier (E2). Faults are E3 / product Phase 4. No silent cap. No 92%. No Measured from typed numbers.

**Amended Oct 28, 2026 (SysSimulator pages).** Hybrid (c) stays. It does **not** replace Decision 18 (how a run is shown). SysSimulator is a fast DES in the browser; we keep event queue + simulated clock, seed + config as the scenario, Poisson arrivals, node capacity / service time / buffer drops, edge latency, Little’s law, and post-run percentiles. We do not copy `rand::SmallRng`, hash-map iteration, unverified speed claims, or the cost page’s SKU arithmetic. Own `xoshiro128**`; ties by `(time, seq)`; warm-up before N7; Zipf cache in E2 against Analytic `h`; cost still deferred (F11) with catalog source links later. Chaos library is E3 / Phase 4.

#### 20. SysSimulator as a DES recipe, not a product claim

- **What it is.** Public pages (How it works, Distributed systems simulator, AWS cost estimator) describe a Rust/WASM DES, a seeded PRNG, Zipf caches, a 28-scenario chaos library, and an AWS cost panel. The pages do not say how equal timestamps are ordered, do not give a steady-state oracle, and do not name a pricing source. “10K+ RPS”, “0 GC pauses”, and “200 ms for 60 s” are self-reported with no hardware.
- **What we copy.** Event queue, simulated time, seed + JSON scenario, log-normal service as a *family* (values stay Estimated / Vendor / Measured), Poisson / burst / spike / ramp as workload shapes, cache miss loading the origin, Little’s law, 2×/5×/10× bottleneck runs (cost still unknown until sourced).
- **What we do not copy.** Library RNG; HashMap node order; speed or GC claims; SKU prices or “8 × t4g.medium at ~1,200 RPS”; the “~85%” CloudFront saving (it is the whole-bill $12,000 → $1,800 difference, and 8 × 1,200 is 9,600 not 10K headroom); Flutter/WASM as a requirement; 28 chaos scenarios in Phase 1.
- **Recommendation.** Keep Decision 19 (c). First DES run: constant Poisson, no faults, warm-up discarded, must match Analytic. Decision 8 guard until we benchmark. Rust/WASM only if the benchmark requires it.
- **Blocks.** E2 kernel, N6, N7, F11, J8 cache.

**Decided Oct 28, 2026.** (c) hybrid stands. Decision 18 is display. Decision 8 is still a guard, not a performance claim.

**Merged Oct 28, 2026 (`engine-design.md`).** D19–D23 in that file are the engine spec. Mapping: D19 = this Decision 19 (hybrid; does **not** supersede Decision 18). D20 = TypeScript worker + event budget; Decision 8 UI guard remains until E1.11 records a benchmark. D21 = `xoshiro128**` one stream per (node id, purpose). D22 = result evidence is the weakest input; Measured only from imported load tests. D23 = E1 is steady state, constant load, no faults. Code is in the repo, not in this plan.

## Changelog

| Date | Change |
| --- | --- |
| Oct 20, 2026 | Catalog audit applied. "Components by provider" rewritten: one table per provider with a verify link per service (read Oct 20, 2026), the limits-on-page value and four statuses (Verified, Partial, Listed (not checked), No limits on page) replacing the "Limits checked" column. 17 services that were marked checked without a recorded reading were reclassified (13 to Listed (not checked); Azure Front Door, Cloud CDN, Apigee to Partial; Azure Content Delivery Network to No limits on page), plus S3 and Azure Load Balancer to Partial. Pub/Sub link fixed to https://docs.cloud.google.com/pubsub/quotas. Dataproc noted as renamed to Managed Service for Apache Spark (new quotas link). Kubernetes cluster size limits get their own row (Kubernetes scalability thresholds, Partial). Naming: "Application Load Balancer" (ALB only as a short label); canvas "Viewers" and "Uploaders" are the Generic Clients component; ECR is not a catalog entry. Counts: 137 services, 18 Verified, 6 Partial, 104 Listed (not checked), 9 No limits on page. Provider catalogs intro, Verified limits intro and the P0 services decision updated to match. |
| Oct 21, 2026 | Component link file merged: the earlier link list and the Oct 20 catalog PDF were compared and combined into one file, component-links.md (Project). Both list the same 137 services with the same limits-on-page values; the only link differences were Pub/Sub and Dataproc, and the plan already uses the confirmed new links. The plan tables match the merged file row for row. |
| Oct 22, 2026 | Workspace canvas UX written into F1/F2 and the product notes: easy delete (Delete/Backspace, toolbar, Config; edges drop with the node), easy connect (four-side handles plus Connect then two clicks), icons on every tile and card from Real-base DS/Icons (Service vs Normal), and the two palette layouts as the ▦ / ☰ toggle in the search row — not hidden text links. Same day: Worker pool icon path was a self-overlapping gear that filled as a blob (nonzero fill, inner circle not a hole). Connection rule: Clients only emit; one hop per pair; source handles right/bottom, target left/top — any-to-any was not the engine model. |
| Oct 22, 2026 | Canonical Verified 18 is the Components-by-provider counts table, not the Verified-limits figure table. Azure Load Balancer stays Partial; idle timeout is a recorded configurable_setting. Limit-type mapping for plan prose (M1 + Decision 11) added. CatalogValue rows encoded from stated figures only; unknown stays unknown; no Phase 1/5 or Measured claim. |
| Oct 22, 2026 | Workspace run and palette behavior written into F2, F4, F6, F7, N6 and the product notes: palette is a one-folder-open file explorer (☰ default) with Load Generic/AWS/Azure/GCP/YouTube; Fluid/Discrete sit next to Run; cards show completed rate not "unknown · fluid"; generators are not 100% loss; KPI tails stay unknown in fluid; Discrete refuses above 20_000 arrivals (tab safety, Decision 8 still open). Generic reference edges set R/W vs A/B explicitly; empty class map is zero flow. Load-test CSV, calibration CSV and recorded-test JSON stay three different files; none of them close J12 or stamp Measured. |
| Oct 22, 2026 | Environment boxes are droppable layout groups: drag, resize, rename, provider color, services join on drop. Deleting a box ungroups. Not F13 nested-as-one-node. |
| Oct 23, 2026 | Generic Environment removed completely (no palette tile, no inspector option, no drop). Provider Environment boxes contain a service on drop or drag-in and disconnect on drag-out or Config remove. Decision 3 amended: reducing Listed (not checked) by reading official pages is in-scope human work; 18 Verified remains the recorded-figure set; Phase 1/5 still need a real 9-block load test. Catalog files listed under Components by provider. |
| Oct 23, 2026 | New Environment boxes match YouTube parenting: zone stays before its children in the node list so dragging the box moves contained services; palette drop onto a box joins the same way. |
| Oct 23, 2026 | Environment stacking is per group: a box sits behind the services it contains, not behind every card. Uncontained nodes (Clients) can pass under the box. |
| Oct 23, 2026 | Palette drop of Environment is a single handler (no duplicate boxes). Environments stay a background layer under every service card; selecting a box no longer pulls it over the cards. |
| Oct 23, 2026 | AWS Batch service quotas recorded from the official page (read 2026-10-23): 19 unchanged Region-specific figures. Status moves from Listed (not checked) to Verified. Counts: 19 Verified, 103 Listed (not checked). Batch stays outside the canonical 18 used for the first provider compare. Figures are Vendor figure, not Measured, and are not applied as worker throughput or server count. |
| Oct 23, 2026 | Lambda quotas page and Fargate throttling page recorded from supplied copies (read 2026-10-23). Lambda stays in the canonical 18; concurrency default is now 1,000. Fargate moves from Listed (not checked) to Verified and stays outside the 18. Counts: 20 Verified, 102 Listed (not checked). Neither reading is applied as throughput or server count. |
| Oct 23, 2026 | YouTube Viewers and Uploaders bind to generic-clients. Titles stay role names; catalog kind is Clients. Generator classes come from outgoing edges (Viewers R/W, Uploaders Bulk), not extra catalog rows. |
| Oct 23, 2026 | Config Title renames a service card. Catalog kind is unchanged. Environment boxes still use Name. |
| Oct 23, 2026 | Workload lists one rate block per Clients card on the live canvas. Two Clients (YouTube Viewers and Uploaders) show two blocks; classes follow outgoing edges. Shared class mix is only the fallback for cards without their own rates. |
| Oct 23, 2026 | 9-block greys recorded from supplied official pages. DynamoDB, Cloud Run, and Cloud Storage become Verified (outside the canonical 18). S3, Front Door, and Cloud CDN stay Partial with recorded guidance. Application Gateway and Container Apps move Listed → Partial (autoscaling / missing defaults). Blob Storage and Azure Database for PostgreSQL not recorded: supplied files were Container Apps copies. Counts: 23 Verified, 8 Partial, 97 Listed (not checked). Vendor catalog figures are the right input while a lab load test is hard; they still do not stamp Measured or close Phase 1/5. None of these rows are wired as throughput or server count. |
| Oct 23, 2026 | Azure Database for PostgreSQL flexible-server limits recorded from the supplied page (read 2026-10-23). Status Listed → Verified. Default max_connections by SKU; 15 reserved. Counts: 24 Verified, 8 Partial, 96 Listed (not checked). Outside the canonical 18. Not wired as server count. Blob Storage still not recorded: Azure Blob Storage.md is the Cloud CDN caching page, not https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets. |
| Oct 23, 2026 | Azure Blob Storage scalability-targets page recorded from the supplied copy (read 2026-10-23). Status Listed → Verified. 50,000 blocks; target 3,000 rps per block blob. Account ingress/egress not on this page. Counts: 25 Verified, 8 Partial, 95 Listed (not checked). Outside the canonical 18. Request rates are guidance, not a ceiling. Not wired as node throughput. |
| Oct 23, 2026 | Workload duration, dt and seed are one run clock with the same default on Viewers, Uploaders and Clients (60 s, 0.1 s, 4821). Each Clients block shows those fields; editing one updates all. |
| Oct 26, 2026 | CloudFront quotas page recorded from the supplied copy (read 2026-10-26). Canonical 18; default 250,000 rps and 150 Gbps per distribution. Counts unchanged (already Verified with no number). Not wired as node throughput. AWS S3 (2).md is a duplicate of the S3 performance page; S3 stays Partial. Other new AWS md files are real quota pages but not yet recorded (stay Listed): EKS (other-service quotas, not the EKS cluster table), EBS, EFS, FSx, Storage Gateway, DocumentDB, Neptune (file named Nepture), Keyspaces, Timestream (file named Timesteam), Redshift, Route 53, NLB, API Gateway, Global Accelerator, VPC, Direct Connect, WAF, Shield, EventBridge, Kinesis, MSK, Step Functions, MQ, OpenSearch (defers to General Reference), Athena, EMR (burst/rate explainer), MediaPackage, IVS. Missing md vs the AWS 50: EC2, App Runner, Elastic Beanstalk, Lightsail, SNS, AppSync, Glue, MediaConvert, MediaLive. Azure/GCP 9-block Partials were not replaced: Front Door is still routing-limits, Application Gateway still autoscaling, Cloud CDN still caching. |
| Oct 27, 2026 | Calibration lists the live Workspace canvas cards (titles and catalog icons), not leftover seed profile names such as AKS transcode workers. Unbound edge profiles stay out of the component list. |
| Oct 28, 2026 | Palette On canvas lists every live card (Azure Front Door included) so Load does not hide a 9-block service inside a collapsed Network folder. Load opens the provider categories that hold those catalog ids. YouTube Viewers emit Async on the viewer path (R/W/A); Workload shows Read, Write, Async and Bulk on every Clients card, same as the Class chips. AWS 9-block LB title matches Application Load Balancer; Azure DB title matches Database for PostgreSQL. |
| Oct 28, 2026 | Stakeholder review of a Fluid run: “only + and − calculation” (290 / 240 / 50 rps) and “stopped animation / no changing / toy, not a professional simulator.” Decision 18 amended to (e): the professional output is the hockey-stick, not particle overlay. Decision 19: Phase 1 engine is Analytic steady-state (Jackson, Erlang C, Allen-Cunneen). Fluid Δt survives only as the ρ ≥ 1 overload branch. Discrete is verifier (E2) then faults (E3). Product phases 0–5 unchanged: E3 faults = Phase 4; Monte Carlo = Later, not persistence. Workload stays its own tab (constant + SCV in E1). Faults tab stays visible, unused in E1. Analytic p50/p95/p99 labeled Analytic, never Measured. J13–J16 added. Decision 6 still closes Phase 1. Decision 16 amended only for SCV, not a distribution-family fit. No 92%, no 60 FPS. |
| Oct 28, 2026 | SysSimulator pages read (How it works, Distributed systems simulator, AWS cost estimator). Hybrid engine confirmed: Analytic + seeded DES on one schema; does not replace Decision 18. Own `xoshiro128**`; ties by (time, seq); array iteration; Little’s law; J14 hockey-stick in engine tests. No speed/GC claims. Decision 8 20k Discrete guard stays until a benchmark. Zipf cache is E2 against Analytic h. Cost stays deferred; their SKU arithmetic is not copied. Chaos is E3. Engine code lives in `web/packages/engine`, not in this plan. |
| Oct 28, 2026 | `engine-design.md` implemented as the main engine (E1.1–E1.7): Scenario schema, compile, Jackson (I−Pᵀ), Erlang C / Allen-Cunneen / M/M/c/K / M/D/1, Zipf hit ratio, path sampler, headroom, DES heap+(time,seq), isolated RNG streams, Little/conservation checks. Textbook M/M/1 W=100 ms and J14 6/7/8-server table pass. UI still Fluid/Discrete until E1.9. Event budget is in the schema; the 20k UI guard stays until E1.11. No speed claim. No Measured from typed numbers. |
| Oct 28, 2026 | E1.8–E1.9 and E1.11: DES cancel + 8 ms worker slices; Workspace Run toggle Analytic \| Simulated (Fluid/Discrete still parse); cards paint EngineResult; Results hockey-stick vs offered rps; default workload is Analytic + constant. Five light-load graphs freeze mean 8% (revised after first runs) and p99 wait 30% when Analytic p99 ≥ 10 ms, at ρ ≤ 0.85. No named-machine speed claim. 20k Simulated UI guard stays. Faults stay unused in E1. J12 A/B and Phase 1 closer still need a real 9-block load test. |
| Oct 28, 2026 | Load balancer with two or more non-broadcast hops splits the class by weight (Single backends share equally; Broadcast still copies). Workspace drops the Simulated-time playback bar: Analytic is steady-state and E1 Simulated is one tick, so F30 stays the hockey-stick, not a timeline. |
| Oct 29, 2026 | Simulated time series. Analytic stays one constant solve plus hockey-stick (Decision 18/19, D23). Frozen hops after Analytic are Jackson. Simulated plays decimated ticks (queues fill from empty) and may Ramp offered load 0→target (Analytic still solves the target). Show mode Instantaneous vs Average is a canvas view of those ticks (sample window vs 0→playhead); not every DES event; 48-frame cap ≈ 10 dt on a 60 s / 0.1 s run. Playback bar is Simulated-only. N7 histograms stay post-warm-up. Step/spike remain later E2. No Measured, no 92%, no 60 FPS, no Phase 1/5 close. |
| Oct 29, 2026 | “Can A connect to B?” defined as a kind-to-kind hop matrix on F1 / Connect notes (Oct 22 any-to-any was not the engine model). Canvas refuses illegal pairs; Jackson still conserves cycles on legal hops. Generic 9-block and YouTube (including DynamoDB → GKE and Blob → CloudFront) stay legal. Engine compile does not drop hops by kind. |
| Oct 29, 2026 | Card p99: 0 ms is not a tail. Instantaneous leaves the slot empty. Average/Analytic paint p99 only when wait rounds to at least 1 ms. Empty histogram is NaN, not 0. Clients still show rps in that slot. |
| Oct 29, 2026 | Simulated timeline playback lerps util, hop `/s` and queue between DES samples. Slider is continuous (1 ms step). Canvas paint ~32 ms. Traveling dots no longer remount on every rate change. Not extra engine ticks, not 60 FPS. |
| Oct 29, 2026 | Instantaneous window is Workload dt (default 0.1 s). Average still 0→playhead and lerps. Instantaneous holds each closed dt sample. 60 s default run → 0.1 s steps (601 ticks) live-paced 1×. Not 60 FPS. |
| Oct 29, 2026 | Instantaneous does not paint the t=0 empty snapshot (0 s window). Until the first closed dt sample, it holds that sample. DES event heartbeats without a tick do not wipe the canvas. |
| Oct 29, 2026 | Cost C0: typed $/hr on nodes, KPI and Results show partial N of M plus $/day (×24) and $/mo (×730 h). Not Simulated duration. Empty stays unknown, not $0. Catalog still has no SKU prices. C1–C4 (sourced SKUs, usage × λ, egress, compare) stay later. Decision 2 unchanged: first provider compare is capacity and limits only. F11 not closed. No invented SKUs. |
| Oct 29, 2026 | Duration is the DES clock (no sample-window split). Analytic wait is unchanged (steady state). Simulated still refuses when Σ class rps × peakFactor × duration > 20_000 (Decision 8 guard). 1 day at 9-block rates is blocked; lower rate / duration, or use Analytic. |
| Oct 29, 2026 | Simulated UI guard raised 20_000 → 5_000_000 arrivals. YouTube 60 s (~3.2M) can Run Simulated. 9-block 1 day (~25M) still blocked. Not a closed N6. Day-scale stays Analytic. Simulated VCR timeline (scrub/replay bar) removed; live pacing and Instant/Average stay. Analytic has no timeline. |
| Oct 29, 2026 | Simulated toolbar shows current time / Workload Duration (`12.3s / 60s`) with a fill. Clock only, no scrub or replay. Analytic still has no timeline. |
| Oct 29, 2026 | Simulated time snackbar: Pause/Play plus 0.5× / 1× / 2× / 5× / 10×. Pause holds the clock; toolbar Stop still aborts. No scrubber. Analytic has no player. Not 60 FPS. |
| Oct 29, 2026 | Live pacing (Simulated): one tick per dt, paint as due, wait so 1 s sim ≈ 1 s wall. Do not dump then VCR. Duration stays full. Arrival guard is the stop, not a hidden window. Analytic stays one solve. No 60 FPS. |
| Oct 29, 2026 | Same-class hops from **any** source split by weight (Clients → two CDNs share 240; not only load balancers). Broadcast still copies. Object store is M/G/c (n and S), so ρ is shown; External stays delay-only for third-party APIs. Palette drops write a blank profile (Unknown does not cap). Instantaneous p99 stays empty; post-run 0% prints `0%` not `—`. |
| Oct 29, 2026 | Live hop and Clients rates print `0 rps` when the number is zero (Ramp start, Instantaneous empty window, pause). Do not hide the rate so the changing number is visible. YouTube example stays until a quoted source. |
| Oct 29, 2026 | YouTube example rebuilt as GCP palette tiles (Generic Clients + Cloud Load Balancing, GKE Upload Service, GKE Video Consumer, Media CDN, Cloud Storage, Transcoder API, Cloud Run Metadata Processor, Bigtable). Topology is the quoted upload vs streaming split. Workload is 100M views/day and 1M uploads/day (Estimated). Cache hit stays unknown (the 90%+ note is not typed). No Borg, Colossus, or Argos VCU nodes — those are not catalog tiles. |

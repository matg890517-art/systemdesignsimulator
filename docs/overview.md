# Overview

System Design Simulator (SDS) is a **capacity-planning** tool. Engineers draw a topology from real provider tiles (or Generic blocks), type a workload, and Run. The answer is where the design saturates, waits, drops, or costs too much — **before** anything is built.

## Promise

Results come from a queueing model plus sourced catalog data, not from a “capacity ≥ load” tick.

- **Analytic** (Phase 1 default) is closed-form steady state: Jackson traffic, Erlang C, Allen-Cunneen. That is the sizing answer.
- **Simulated** is a seeded discrete-event verifier of the same scenario, then later bursts and faults.
- Every number carries a confidence label. Unknown stays unknown and does **not** cap the engine.
- Analytic p50 / p95 / p99 are labeled **Analytic**, never **Measured**.

The professional Analytic proof is the **hockey-stick**: 6 servers at 290 rps / 20 ms is technically stable (ρ ≈ 97%) and about 5× slower than 8 servers. Hop labels that add up (290 = 240 + 50) are Jackson conservation, not a second engine.

## Users

Engineers and architects sizing distributed systems. Challenge mode and game HUD are later (F21), not the v1 core.

## One engine, catalogs as data

The engine is provider-agnostic TypeScript. AWS, Azure, GCP, Kubernetes, and Generic are **catalogs of data** mapped onto canonical kinds (service, cache, CDN, database, …). Mixing providers on one canvas is allowed. Cross-provider hops stay Estimated until measured.

A catalog entry is not a latency, SKU price, or throughput proof. Calibration (source, date, confidence) is separate.

## Competitive position (what we keep)

The plan compared SyDe, SysSimulator, SysLab, and SystemLore. What SDS is supposed to exceed is the **model**, not the demo:

- Source and confidence on every number
- Typed request classes on edges (Read / Write / Async / Bulk)
- Two run modes on one topology
- Deterministic replay and flow conservation
- Hockey-stick wait, not “300 ≥ 290 is OK”

Traveling dots on hops are a **view of painted rate**, not Phase 1 proof and not one circle per request. Do not claim 92% fidelity or 60 FPS. Fidelity against a real load test of the 9-block reference stack is still blocked (Decision 6).

## Out of v1

- Terraform / CloudFormation / IaC **export**
- Real nested-as-one-node (F13)
- Auth and Postgres (those wait for product Phase 4 persistence)
- Multi-region WAN modeling
- Team collaboration
- Invented SKU prices, latencies, or quotas

Prefer SDS JSON over Terraform/Mermaid until F25 (import only, later).

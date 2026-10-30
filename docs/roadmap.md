# Roadmap

Product phases stay **0–5**. Engine slices E1–E4 do not replace them: E3 faults = Phase 4; E4 Monte Carlo is Later, not persistence.

Durations in the plan are open until team size is known. Each phase ends only when its exit criteria pass.

| Phase | Scope | Exit criteria (short) |
| --- | --- | --- |
| **0** Lock requirements | Decisions, request classes, N6 limits, edge contract | Decisions recorded; table signed off |
| **1** Engine core | E1 Analytic (Jackson, Erlang C, Allen-Cunneen), generic catalog, J4/J6/J13–J16, overload branch, E2 DES kernel as verifier, one 9-block | Hockey-stick table; Little’s law; unstable never silently capped. **Close still needs a real 9-block load test (Decision 6)** |
| **2** Canvas and telemetry | React Flow, provider tiles, Workload tab, worker, cards, F30 hockey-stick | User builds the reference, runs Analytic, sees Stable / Saturating / Unstable and 6-vs-8 wait. 60 FPS unclaimed |
| **3** Calibration and catalogs | F10/F28, F23 explainer, J8, first provider catalog as data, N7 | Every number shows its profile; N7 on a stable scenario |
| **4** Faults and persistence | F8/F9 = E3; save/load; **auth/Postgres only here**; F22/F20; F18 capacity/limits; F11 cost | Chaos trips upstream breakers; topologies reload and replay |
| **5** Fidelity | Real load tests including the reference mapped per provider; J12 | Bottleneck predictions checked; gaps per profile |
| **Later** | Nested sub-systems, IaC export, multi-region, server-side runs, F21 challenge, F25 import, E4 Monte Carlo | After Phase 5 |

## What is not closed

Do not “complete” a requirement by shipping a thinner stand-in:

- **Phase 1 / Phase 5** — blocked on Decision 6 (recorded 9-block load test)
- **J12 A/B** — same recording
- **F20 / F21 / F18** — tutorials, challenge, provider compare as specified, not a stub
- **F11** beyond C0 — no invented SKUs
- **N4 60 FPS** — unclaimed
- **N1 92% fidelity** — dropped as a numeric target until metric, dataset, and method exist
- **N6** — 5 000 000-arrival Simulated guard is interim tab safety, not a closed limit set

## Decision index (high signal)

Recorded in `full plan.md`. Items 1–17: Oct 19, 2026. 18–20: Oct 28.

| # | Decision |
| --- | --- |
| 1 | AWS ships first as the filled provider catalog |
| 2 | First provider compare is **capacity and limits only**; cost later |
| 6 | Phase 1 close needs a real reference-stack load test |
| 8 | Simulated UI arrival guard (now 5 000 000) until a named-machine benchmark |
| 16 | No full distribution-family fit in v1; SCV is the extra |
| 17 | Cross-provider hops Estimated until measured |
| 18 | How a Run looks: hockey-stick, not particles; Simulated is live-paced time series |
| 19 | Phase 1 engine is Analytic steady-state; fluid is ρ ≥ 1 only |
| 20 | Copy DES ideas from SysSimulator pages; do not copy speed/GC claims or SKU arithmetic |

When the plan’s table and a Decision disagree, prefer the Oct 19 Decision and note the mismatch.

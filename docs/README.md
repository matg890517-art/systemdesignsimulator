# System Design Simulator — docs

Browser tool for capacity planning: draw an architecture, set a workload, and see where it saturates, fails, or costs too much, using sourced numbers instead of guesses.

These pages describe how the product works **today**. The coach and source of truth for IDs F/N/J, phases 0–5, and Decisions is [`full plan.md`](../full%20plan.md) at the repo root. If this folder and that file disagree, follow the plan (and the Oct 19 Decisions when a table and a Decision conflict).

## Read in this order

| Page | What it covers |
| --- | --- |
| [Overview](overview.md) | Promise, users, what is in and out of v1 |
| [Getting started](getting-started.md) | Install, run, tests, first Analytic run |
| [Workspace](workspace.md) | Canvas, palette, hops, workload, Run, playback |
| [Engine](engine.md) | Analytic vs Simulated, labels, hockey-stick, guards |
| [Catalogs and evidence](catalogs-and-evidence.md) | Providers as data, Unknown, Estimated / Vendor / Measured |
| [Examples](examples.md) | Generic 9-block and GCP YouTube |
| [Architecture](architecture.md) | Repo layout, engine vs UI |
| [Roadmap](roadmap.md) | Product phases 0–5, engine slices E1–E4, what is not closed |
| [Glossary](glossary.md) | Terms used on the canvas and in results |

## Other source files (not this folder)

| File | Role |
| --- | --- |
| [`full plan.md`](../full%20plan.md) | Requirements, Decisions, catalogs, validation |
| [`engine-design.md`](../engine-design.md) | Engine schema, solvers, DES, tests |
| [`teck-stack.md`](../teck-stack.md) | Intended libraries (some still Evaluate) |
| [`component-links.md`](../component-links.md) | Catalog rows with official URLs and status |
| [`web/catalog md/`](../web/catalog%20md/) | Copied provider quota pages used as reading notes |

Do not treat `web/README.md` as product documentation; it is the TanStack Start scaffold.

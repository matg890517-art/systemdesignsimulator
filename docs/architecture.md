# Architecture

## Layout

```
.
├── full plan.md              Product coach (F/N/J, phases, Decisions)
├── engine-design.md          Engine schema and solvers
├── teck-stack.md             Intended libraries
├── component-links.md        Catalog URL + status table
├── docs/                     This documentation
└── web/                      App
    ├── packages/engine/      @sds/engine (no React)
    ├── catalog md/           Copied provider quota pages
    └── src/
        ├── routes/           TanStack Router pages
        └── features/
            ├── workspace/    Canvas, Run, inspector
            ├── catalog/      Catalog data and Catalog page
            ├── calibration/  Calibration library UI
            ├── results/      Hockey-stick, headroom, cost
            ├── learn/
            └── challenge/
```

## Split: engine vs UI

| | Engine (`@sds/engine`) | Workspace UI |
| --- | --- | --- |
| Language | TypeScript | React + MUI + React Flow |
| Knows | Scenario schema, compile, Analytic, DES, verify | Palette, canvas, hop matrix, live paint, playback |
| Does not | React, MUI, DOM, TanStack, SKU prices | Invent λ, ρ, wait, or Measured |

Compile in the UI maps canvas nodes/edges + profiles + workload into the engine scenario. Canvas “can A connect to B?” is the F1 kind matrix. Compile does **not** drop hops by kind; Jackson still conserves legal cycles.

Simulated Run: worker job, 8 ms slices, cancel via Stop. Live pacing is on the **page** (`live-pace.ts`). Worker `pace: 0` means compute as fast as possible; the UI waits so 1× matches wall time. Do not pass UI speed 0 into DES wait (that dumps ticks). Pause is a separate flag.

## App shell

TanStack Start + Vite + React 19. Routes are files under `web/src/routes`. Workspace is `/` with `ssr: false`.

Tech-stack notes that are **not** in this phase: PostgreSQL, Drizzle, auth. Do not add them until product Phase 4 persistence is in scope. Several TanStack packages in `teck-stack.md` are still **Evaluate**.

## Persistence today

Local snapshots, File menu, share URL. A Run stores topology version, mode, seed, and ticks so Simulated can replay. Hop follow after Analytic does not need a server.

## Invariants the UI must not break

- Unknown does not cap
- Analytic percentiles stay labeled Analytic
- Traveling dots are a view, not proof
- Same-class non-broadcast hops split by weight
- Store-back on a GCS ↔ transcoder cycle must not reuse Bulk if that makes Jackson loop gain ≥ 1 (YouTube uses Write for encoded store-back)
- Do not paint a Generic run onto a YouTube canvas (run must fit live node ids)

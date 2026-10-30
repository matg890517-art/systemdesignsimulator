# Getting started

The app lives in `web/`. The engine is `web/packages/engine` (`@sds/engine`) and must stay independent of React and MUI.

## Install and run

Requires Node.js and npm.

```bash
cd web
npm install
npm run dev
```

Vite serves on [http://localhost:3000/](http://localhost:3000/). If that port is taken, the next free port is used (the terminal prints the URL).

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm test` | Vitest (`vitest run`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write + ESLint fix |
| `npm run check` | Prettier check |

There is no auth and no Postgres in this phase. Topologies persist in the browser (local save / share URL), not a server database.

## First run

1. Open Workspace (`/`).
2. Load a template from the palette footer: **Generic**, **AWS**, **Azure**, **GCP** (same 9-block wiring, catalog bindings only) or **YouTube**.
3. Leave mode on **Analytic**.
4. Click **Run**.

You should see utilization, wait, hop `/s`, and (on Results) a hockey-stick of latency against load. Analytic percentiles are labeled Analytic.

Then try **Simulated** on a short Duration (default 60 s, dt 0.1 s, seed 4821). The canvas paints one tick per dt, live-paced to wall time at 1×. Pause / 0× hide traveling dots; they are not the engine.

Day-scale Simulated at 9-block rates is refused by the 5 000 000-arrival guard. Use Analytic for that.

## What not to expect

- A Measured stamp from typed example `n` and `S`
- Catalog SKU prices
- Faults affecting the Analytic solve (the Faults tab is visible, unused in E1)
- Closing Phase 1 or Phase 5 without a recorded 9-block load test

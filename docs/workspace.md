# Workspace

Workspace (`/`) is the editor: palette, canvas, inspector, workload, faults, and Run.

## Palette

Provider folders: Generic, AWS, Azure, GCP, Kubernetes. One folder open at a time; Generic starts open. Search opens every matching folder.

- **☰** list view is the default (name + limits word).
- **▦** button view is the 68px tile.
- Icons follow Real-base DS/Icons. **Service** is the original glyph; **Normal** is the kind shape.
- Drop a service onto the canvas. Cards ship with **Estimated** example `n` and mean service time so a Run has a queueing model. Cost, queue `K`, and p95 stay unknown until typed. Those examples are not catalog quotas and not Measured.
- **Environment** tiles exist on AWS, Azure, GCP, and Kubernetes only. Generic has no Environment box. The box is layout, not an engine node. One level; drag a service in or out to contain it.

Load at the bottom of the palette replaces the canvas with Generic / AWS / Azure / GCP (same 9-block) or the YouTube example.

## Connect and delete

- Drag from a **source** handle (right or bottom) to a **target** (left or top), or click **Connect** then two nodes.
- Clients only emit. They cannot be a target. Two Clients cannot connect.
- One directed hop per pair. Extra request classes live on that edge, not a second parallel line.
- Kind-to-kind is a **product matrix** (not Jackson). Environment boxes are never hops. Jackson still allows cycles on *legal* hops (for example service → LB retry) when loop gain &lt; 1.

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

Delete selected nodes or edges with Delete / Backspace, the toolbar, or Config. Attached edges drop with the node. Deleting a service leaves its environment box. Deleting the environment ungroups; services stay.

## Edges and classes

Click the **line**, not the node. The Edge tab turns Read / Write / Async / Bulk on or off and sets routing (single, weighted, broadcast), weight, call kind, fan-out, and latency.

- Empty class map is **zero flow**, not every class.
- Same-class hops from one source **split by weight**. Broadcast still copies.
- Class chips above the canvas only **hide** paths; they do not change the solve.

Clients rates come from the **Workload** tab: one rate block per Clients card, all four classes. Duration, dt, and seed are one run clock (defaults 60 s, 0.1 s, seed 4821).

Phase 1 Analytic uses the **constant** profile plus arrival SCV (Allen-Cunneen). Simulated may **Ramp** offered load 0 → target, then hold. Analytic still solves the target rate. Poisson, step, and spike wait for later E2.

## Run

Toggle **Analytic** | **Simulated** next to Run.

- **Analytic** is one steady-state solve. Frozen hops that add up are Jackson. After a Run, connect / delete-edge / hop class change **re-solves immediately**. Unconnected drop and Inspector `n` / `S` do not auto-run.
- **Simulated** does not hot-patch (N2 topology version). A hop change **stops** the DES, clears hop rates, and the next Run starts t = 0.
- Simulated paints **one tick per dt** as wall time catches `t_sim` (live pacing). 1× means 1 s simulated ≈ 1 s on the desk. Not a dump-then-VCR. Not 60 FPS.
- Simulated is refused when `Σ class rps × peakFactor × durationSec > 5_000_000`. YouTube 60 s is allowed; YouTube 1 day and 9-block 1 day at ~290 rps are not. Use Analytic for day-scale.

**Show mode** is a canvas view, not the engine:

- **Instantaneous** = last closed dt window. Does not paint the empty t = 0 snapshot.
- **Average** = 0 → playhead, lerped between samples.
- Analytic ignores Show mode (one solve).

## Playback and traveling dots

The time snackbar is **Simulated-only**: Pause/Play plus 0× / 0.5× / 1× / 2× / 5× / 10×. Pause holds the clock. Toolbar **Stop** aborts. There is no scrubber.

Traveling dots are a **view of hop `flowRps`**, not one circle per request and not a second engine.

- **0 rps** (≤ 0.05, same as the hop label `0 rps`): no circles.
- **0×** and **Pause**: no circles.
- At 1×, trip time is about **0.7–2.4 s** and **2–5** dots, faster and denser on busier hops. 2× halves the trip.
- Do not set DES pace to 0 (that dumps ticks). Freeze with Pause / 0×.

## Inspector and cards

Rename in Config **Title**. Catalog kind does not change (YouTube “Client” is Generic Clients; Upload Service and Video Consumer are GKE).

After a run, a card shows ρ, wait, Analytic percentiles (when wait rounds to at least 1 ms), queue length (Little’s law), and throughput. Status is Stable, Saturating, or Unstable. A traffic generator emits; it is not scored as 100% loss. Unknown service time keeps wait unknown. Instantaneous leaves p99 empty (a tail needs 0 → t).

## Cost (C0)

Type `$/hr` on nodes. KPI and Results show partial N of M, plus `$/day` (×24) and `$/mo` (×730 h). Empty stays unknown, not $0. Catalog still has no SKU prices. First provider compare is capacity and limits only (Decision 2).

## Other pages

| Route | Page |
| --- | --- |
| `/` | Workspace |
| `/results` | Hockey-stick, headroom, cost rollup |
| `/calibration` | One profile per canvas card: source, date, confidence |
| `/catalog` | Browse catalogs; not required to start a design |
| `/projects` | Local projects / snapshots |
| `/learn` | Tutorials (F20 is not closed by a thin stand-in) |
| `/challenge` | Challenge shell (F21 later) |

## Faults

The Faults tab is visible in Phase 1 and labeled engine slice **E3** (product Phase 4). It does not feed the Analytic solver. Do not run faults through steady state.

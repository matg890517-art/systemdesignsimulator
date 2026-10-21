# System Design Simulator — Tech Stack

| ID | Name | Stack | Description |
|---:|---|---|---|
| 1 | Full-Stack Framework | TanStack Start | Explore full-stack React applications, server functions, routing, SSR, and server-side data loading. |
| 2 | Frontend Framework | React + TypeScript + Vite | Build the interactive simulator with a typed component architecture. Vite is part of the development/build tooling; TanStack Start manages the application framework. |
| 3 | UI Component Library | Material UI (MUI) | Build accessible UI components, forms, dialogs, themes, and dashboards. |
| 4 | Architecture Editor | React Flow | Create interactive system architecture diagrams with nodes, edges, and connections. |
| 5 | Routing | TanStack Router | Learn file-based routing, type-safe navigation, route loaders, search parameters, and route context. Use the routing capabilities integrated with TanStack Start rather than installing a separate router unnecessarily. |
| 6 | Server State | TanStack Query | Manage asynchronous server data, caching, mutations, invalidation, and synchronization. |
| 7 | Client State | TanStack Store — Evaluate | Explore reactive state management for editor state, selected components, and simulation controls. Verify the current package and API maturity before committing to it. |
| 8 | Database State | TanStack DB — Evaluate | Explore reactive collections, live queries, and synchronized application data where appropriate. |
| 9 | Data Tables | TanStack Table | Build tables for component configurations, simulation results, metrics, and logs. |
| 10 | Form Management | TanStack Form | Manage complex forms for configuring system components, workloads, traffic patterns, and failure scenarios. |
| 11 | Virtualized Lists | TanStack Virtual | Efficiently render large component lists, event logs, and simulation traces. |
| 12 | Client-Side Simulation Engine | TypeScript | Simulate system behavior, traffic, latency, throughput, failures, capacity, and bottlenecks. |
| 13 | Background Computation | Web Workers | Run intensive simulations without blocking the main UI thread. |
| 14 | Charts & Visualization | TanStack Charts — Evaluate | Investigate TanStack's charting ecosystem for simulation metrics and interactive visualizations. Confirm package availability and maturity before implementation. |
| 15 | Backend Runtime | Node.js + TypeScript | Execute server-side application logic and APIs through TanStack Start. |
| 16 | API & Server Functions | TanStack Start Server Functions | Learn type-safe client-server calls, server-only code, validation, and secure server-side operations. |
| 17 | API Contracts | OpenAPI — Optional | Document external REST APIs and generate typed clients when an explicit API contract is needed. |
| 18 | Database | PostgreSQL | Persist users, projects, architecture definitions, simulation configurations, and saved results. |
| 19 | Database Access | Drizzle ORM — Evaluate | Explore type-safe database schemas, queries, migrations, and PostgreSQL integration. |
| 20 | Authentication | TanStack Start + Authentication Library — Evaluate | Implement sessions, protected routes, and authorization using a suitable authentication solution. |
| 21 | Package Management | npm | Manage dependencies, scripts, and workspace packages. |
| 22 | Version Control | Git + GitHub | Track changes, review code, manage branches, and maintain project documentation. |
| 23 | Testing | Vitest + React Testing Library | Test simulation algorithms, state behavior, utilities, and UI components. |
| 24 | End-to-End Testing | Playwright | Test complete workflows, such as creating an architecture, running a simulation, and saving results. |
| 25 | Code Quality | ESLint + Prettier | Enforce code quality and consistent formatting. |
| 26 | Cloud Architecture Models | AWS + Azure + GCP + Generic Distributed Systems | Model cloud services and generic infrastructure components as interchangeable simulation environments. |

## Architecture Principles

- Learn TanStack by using its libraries where they provide real value.
- Prefer TanStack Start's integrated routing and server capabilities over independently assembling a separate full-stack framework.
- Keep the simulation engine independent of React and UI libraries.
- Separate server state, client state, persistent data, and simulation runtime state.
- Avoid adding multiple libraries that solve the same problem without a clear reason.
- Keep deployment and hosting decisions out of the initial scope.
- Verify each TanStack package's current status, API, and compatibility before adopting it.

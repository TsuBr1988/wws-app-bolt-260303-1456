# Performance Optimizer Agent Playbook (wws-hub)

## Mission

Improve perceived and measured performance of **wws-hub** by:
- Finding bottlenecks in **data fetching (Supabase hooks/services)**, **service orchestration**, and **render-heavy React components**.
- Shipping optimizations that are **safe, measurable, and maintainable**, with clear before/after evidence.
- Preventing regressions via **lightweight performance checks**, documentation, and code conventions.

Engage this agent when:
- Pages feel slow (TTI/INP), data loads are sluggish, or UI stutters during interactions.
- Supabase queries are heavy, repeated, or poorly scoped.
- Dashboard-like screens render large tables/charts and show re-render cascades.
- A PR introduces new data fetching, transformations, or charts/tables and needs a performance review.

---

## Responsibilities

- **Profile & measure**
  - Establish baseline metrics (load time, number of requests, payload sizes, re-render counts, query latency).
  - Identify hottest paths in services/hooks/components.

- **Optimize data flow**
  - Reduce redundant Supabase calls, overfetching, and repeated client-side aggregation.
  - Introduce memoization, caching, pagination/windowing, and server-side aggregation where appropriate.

- **Optimize rendering**
  - Reduce re-renders, expensive computations in render, and unnecessary state updates.
  - Optimize tables/charts and large lists (virtualization, pagination, stable props).

- **Improve service efficiency**
  - Consolidate requests, parallelize safely, reduce N+1 patterns.
  - Add guards for repeated calls and ensure idempotent operations.

- **Add performance “safety rails”**
  - Lightweight diagnostics toggles (dev-only logging/timers).
  - Documented conventions for fetching, caching, and memoization.

- **Hand-off with evidence**
  - Provide a short report: baseline → change → measured improvement → risks → follow-ups.

---

## Repository Starting Points (where performance issues typically live)

### Data Types / Schemas
- `src/types/database.ts`  
  Source of truth for many data shapes (e.g., `FinRevenue`, `ComSales`, `ContractTableRow`). Useful for ensuring you don’t accidentally expand payloads or serialize large objects unnecessarily.

### Service Layer (business logic & orchestration)
Performance issues here are often **query fan-out**, **serialization**, or **heavy transformations**.
- `src/services/`
  - `src/services/dashboardService.ts` — likely aggregates data for dashboards.
  - `src/services/dreService.ts` — DRE calculations/queries; potential heavy aggregation.
  - `src/services/dreSpreadsheetService.ts` — spreadsheet parsing/export; can be CPU/memory heavy.
  - `src/services/aiChatService.ts` — latency-sensitive; watch payload size and request frequency.

- Feature services (domain-specific):
  - `src/components/Comercialpublico2/src/services/` (goals/config)
  - `src/components/Comercialprivado2/src/services/` (KPI, marketing, minutes, costs, actions)
  - `src/components/Comercialprivado2/src/components/Orçamentos/src/services/` (budget computations/config)

### Hooks / Supabase access (high impact)
Repeated queries, overfetching, and refetch loops often originate here.
- `src/components/Comercialpublico2/src/hooks/useSupabase.ts`
- `src/components/Comercialprivado2/src/hooks/useSupabase.ts`
- `src/components/Comercialprivado2/src/components/Budgets/useBudgetsSupabase.ts`

### Shared utils (hidden CPU costs)
- `src/lib/months.ts` — date range generation; ensure memoization when used in render loops.
- `src/lib/contractUtils.ts` — contract data manipulation; watch repeated parsing/formatting.
- `src/lib/utils.ts` (`cn`) — generally cheap; not usually a target.

---

## Key Files (with performance focus)

- **Dashboards / Aggregation**
  - `src/services/dashboardService.ts`  
    *Purpose:* orchestrates dashboard data.  
    *Perf risks:* multiple sequential calls, heavy client-side reduction, repeated fetching per widget.

- **DRE computation & listing**
  - `src/services/dreService.ts`  
    *Purpose:* query/compose DRE lines and contracts.  
    *Perf risks:* wide selects, N+1 contract/category fetching, repeated computation per render.

- **Spreadsheet operations**
  - `src/services/dreSpreadsheetService.ts`  
    *Purpose:* read/write spreadsheet-like DRE data.  
    *Perf risks:* large in-memory transforms; synchronous loops; duplicate parsing; unnecessary intermediate arrays.

- **AI chat**
  - `src/services/aiChatService.ts`  
    *Purpose:* chat orchestration.  
    *Perf risks:* oversized message histories, frequent calls, lack of debouncing.

- **Commercial modules**
  - `src/components/Comercialprivado2/src/services/costsService.ts`  
    *Purpose:* rolling 12 months, cost computation.  
    *Perf risks:* repeated range computations and reductions; expensive time-series transforms.
  - `src/components/Comercialprivado2/src/services/marketingService.ts`  
    *Purpose:* metrics fetch/transform.  
    *Perf risks:* pulling too much raw data and aggregating client-side.

- **Supabase hooks**
  - `src/components/**/src/hooks/useSupabase.ts`, `useBudgetsSupabase.ts`  
    *Purpose:* centralize data fetching.  
    *Perf risks:* refetch on every render (unstable deps), missing caching, unnecessary select fields.

---

## Architecture Context (what to optimize and where)

### Repositories / Data Access
**Directories:**  
`src/types`, `src/components/Comercialpublico2/src/lib`, `src/components/Comercialpublico2/src/data`, `src/components/Comercialprivado2/src/lib`, `src/modules/financas/components/Features/contract_sheets`, `src/components/okr`

**Optimization focus:**
- Ensure queries return **only required fields** (avoid `select *` patterns).
- Prefer **server-side aggregation** for dashboards when possible.
- Normalize repeated mapping logic into single utilities to avoid duplication and repeated work.

### Services (business logic)
**Directories:**  
`src/services`, `src/modules/financas/services`, `src/components/Comercialpublico2/src/services`, `src/components/Comercialprivado2/src/services`, `src/components/Comercialprivado2/src/components/Orçamentos/src/services`

**Optimization focus:**
- Identify sequential awaits that can be **parallelized**.
- Reduce repeated transformations across services (cache intermediate results per request).
- Avoid “fetch-then-filter” on the client; push filters into Supabase.

### Utils (shared helpers)
**Directories:**  
`src/lib`, `src/modules/financas`, `src/components/**/src/utils`, `src/components/**/src/lib`

**Optimization focus:**
- Memoize expensive pure computations (month ranges, series generation) at call sites.
- Avoid rebuilding identical arrays/objects in tight loops or renders.

---

## Key Symbols for This Agent (hotspots to inspect first)

### Core services
- `DashboardService` — `src/services/dashboardService.ts`
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
- `buscarDREPorContrato`, `listarContratosDRE`, `DRELinha` — `src/services/dreService.ts`
- `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`

### Supabase-related
- `useSupabase` hooks:
  - `src/components/Comercialpublico2/src/hooks/useSupabase.ts`
  - `src/components/Comercialprivado2/src/hooks/useSupabase.ts`
- `useBudgetsSupabase`:
  - `src/components/Comercialprivado2/src/components/Budgets/useBudgetsSupabase.ts`

### High-frequency types (payload control)
- `FinRevenue`, `ComSales`, `ContractTableRow`, `HrHeadcount`, etc. — `src/types/database.ts`

---

## Performance Workflows (step-by-step)

### 1) Triage: determine whether it’s network, CPU, or rendering
**Goal:** classify the bottleneck before changing code.

1. **Reproduce** the slow path (page, widget, interaction).
2. **Network check**
   - Count requests; note long TTFB/transfer.
   - Identify repeated requests triggered by the same UI state.
3. **CPU/render check**
   - Look for long tasks during interactions.
   - Identify components re-rendering frequently (especially tables/charts).
4. **Data-shape check**
   - Inspect payload sizes and overfetching: are we selecting unused columns or returning large histories?

**Deliverable:** a short triage note: “Primary bottleneck = (network | CPU | renders)”, with 2–3 concrete observations.

---

### 2) Supabase query optimization workflow (hooks/services)
**Goal:** fewer queries, smaller payloads, and stable fetch lifecycles.

1. **Locate the query origin**
   - Start in `useSupabase.ts` (publico/privado) or a feature service.
2. **Reduce overfetching**
   - Select only needed fields (avoid returning entire rows when only 2–3 fields are used).
3. **Push filters to the database**
   - Apply date ranges, contract filters, status filters server-side.
4. **Prevent refetch loops**
   - Ensure dependencies in hooks are stable (avoid recreating filter objects each render).
   - If the hook accepts params, ensure callers `useMemo` param objects.
5. **Batch & parallelize**
   - Combine compatible requests; use `Promise.all` where safe.
6. **Cache strategically**
   - Cache per-view results in the hook/service layer (in-memory for session scope) when data is not highly volatile.
   - Prefer a single source of truth to avoid duplicated caches.

**Quick checks for common regressions**
- Does the hook refetch on every keystroke? Add debounce or “Apply filters” pattern.
- Are there N+1 calls (e.g., fetch list, then fetch details per item)? Replace with a join/select expansion or a single query.

---

### 3) Service-layer transformation optimization workflow
**Goal:** make heavy computations linear, avoid repeated passes, and eliminate intermediate allocations.

Targets: `dashboardService.ts`, `dreService.ts`, `dreSpreadsheetService.ts`, `costsService.ts`.

Steps:
1. **Find heavy transformations**
   - Multiple `.map().filter().reduce()` chains on the same arrays.
   - Repeated sorting, grouping, or date parsing.
2. **Consolidate passes**
   - Replace multi-pass chains with a single loop where it improves readability and performance.
3. **Memoize static/reference data**
   - Month ranges from `src/lib/months.ts` should not be regenerated repeatedly for the same period.
4. **Avoid repeated date parsing**
   - Parse once, store numeric timestamps, reuse.
5. **Stream/iterate instead of cloning**
   - Avoid building large intermediate arrays unless needed.
6. **Guard for empty/invalid inputs early**
   - Prevent expensive work on empty datasets.

**Acceptance criteria:** CPU time decreases measurably in the slow path; logic remains testable and readable.

---

### 4) React rendering optimization workflow (tables/charts/dashboards)
**Goal:** fewer renders, cheaper renders, stable props.

1. **Identify re-render sources**
   - Props changing identity (new arrays/objects/functions each render).
   - Global state updates triggering wide re-renders.
2. **Stabilize inputs**
   - Wrap derived arrays/objects in `useMemo`.
   - Wrap callbacks in `useCallback` only when it prevents real re-renders.
3. **Move expensive work out of render**
   - Precompute in services or in memoized selectors.
4. **Paginate/virtualize**
   - For large tables/lists: render a window, not the full dataset.
5. **Defer non-critical UI**
   - Lazy-load heavy sections if appropriate (route-level or widget-level splitting).
6. **Avoid “render all widgets then fetch per widget”**
   - Prefer a single aggregated fetch in `DashboardService` (or a dashboard hook) and distribute results.

**Acceptance criteria:** interaction becomes smooth (no jank), reduced re-render counts, faster commit times.

---

### 5) AI chat responsiveness workflow
Target: `src/services/aiChatService.ts`

1. **Reduce payload size**
   - Limit message history sent per request (summarize or truncate).
2. **Debounce user-driven calls**
   - Avoid firing on each token/keystroke.
3. **Parallelism**
   - If it does retrieval + generation, overlap independent steps.
4. **Caching**
   - Cache retrieval results for the same query within a short TTL.

---

## Best Practices (tailored to this codebase)

### Data fetching & services
- Prefer **service-layer orchestration** (e.g., `DashboardService`, `DRE*`) instead of scattering fetching across many components.
- Keep query results aligned with `src/types/database.ts` but **don’t overfetch** to “match” a big type—define narrow selects where possible.
- Avoid N+1 patterns across commercial/finance modules; consolidate at the service/hook layer.

### Utilities and date/month computations
- `src/lib/months.ts` functions are useful, but in dashboards they can be called frequently—**memoize month lists** for stable ranges.
- When building time series (rolling 12 months, weekly metrics), prefer **single-pass aggregation** and stable month-key formats.

### Rendering
- Avoid computing chart series and table rows inside component render if the dataset is non-trivial. Compute in:
  - a service (best for reuse), or
  - a memoized selector/hook.

### Safety & correctness
- Optimization must preserve semantics: validate totals (DRE, costs) and row counts after changes.
- Introduce instrumentation in a dev-only manner; do not leave noisy logs enabled by default.

---

## Performance Checklist (use during PR review)

### Data / network
- [ ] Queries select only required columns.
- [ ] Filters applied server-side (date ranges, contract ids, status).
- [ ] No repeated fetch due to unstable dependency objects.
- [ ] No N+1 fetching pattern introduced.

### CPU / transformations
- [ ] Heavy transformations are not repeated per render.
- [ ] Multi-pass array transforms consolidated where it improves performance without harming clarity.
- [ ] Sorting/grouping done once, not in multiple components.

### UI / render
- [ ] Large lists/tables paginated or virtualized.
- [ ] Derived props stabilized (`useMemo`) when passed to child components.
- [ ] Expensive components are lazy-loaded if appropriate.

### Evidence
- [ ] Before/after metrics captured (at least one of: request count, payload size, query time, render time).
- [ ] Risks and regressions documented.

---

## Common Hotspots & What to Look For

### Dashboard aggregation (high probability)
- **Symptom:** dashboard loads slowly; multiple spinners; CPU spike.
- **Likely causes:** multiple service calls; repeated aggregation; wide datasets.
- **Fix patterns:** aggregate server-side; single dashboard fetch; memoize derived series.

### DRE listing and per-contract drill-down (high probability)
- **Symptom:** contract list loads, then each contract detail is slow.
- **Likely causes:** sequential awaits; N+1; repeated computation per contract.
- **Fix patterns:** batch fetching; precompute categories; cache by contract id.

### Rolling 12 months / metrics pages (medium-high probability)
- **Symptom:** slow chart interaction and filter changes.
- **Likely causes:** regenerating month ranges; recomputing series on each render.
- **Fix patterns:** memoize month keys; compute series once per filter; avoid repeated date parsing.

---

## Documentation Touchpoints

If present, link and keep updated:
- `README.md` (root) — project overview and run instructions.
- `AGENTS.md` — agent conventions and collaboration norms.
- Any performance-related docs under `docs/` (add one if missing: `docs/performance.md`).

Recommended addition (if the repo lacks it):
- `docs/performance.md` containing:
  - profiling steps
  - query guidelines (Supabase)
  - dashboard aggregation conventions
  - “known hotspots” and how they were fixed

---

## Collaboration Checklist (end-to-end agent workflow)

- [ ] Confirm the slow path (page/feature) and define success metrics.
- [ ] Identify bottleneck category (network vs CPU vs render).
- [ ] Trace to source file(s): hook → service → util → component.
- [ ] Implement minimal change with measurable impact.
- [ ] Validate correctness (totals, counts, edge cases).
- [ ] Capture before/after evidence and summarize in PR description.
- [ ] Add/adjust documentation and (if applicable) a small regression guard.

---

## Hand-off Notes (template)

**Optimized area:** (e.g., Dashboard DRE widget / Costs rolling 12 months)  
**Files changed:** (list)  
**Baseline:** (requests, query time, render time, etc.)  
**Change:** (what was done: batching, memoization, reduced select, virtualization)  
**Result:** (measured improvement)  
**Risks:** (cache staleness, edge case data ranges, pagination changes)  
**Follow-ups:** (optional larger refactor, add tests, add docs)

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

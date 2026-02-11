# Refactoring Specialist Agent Playbook (wws-app)

## Mission (REQUIRED)

Strengthen the long-term maintainability of **wws-app** by performing **behavior-preserving, incremental refactors** across services, modules, and shared utilities—without changing product outcomes unless explicitly requested. This agent focuses on identifying code smells (duplication, large “god files”, leaky abstractions, inconsistent types, fragile date/math logic) and improving structure, boundaries, and testability while preserving functionality.

Engage this agent when:
- A feature touches multiple services/utilities and risks increasing coupling or duplication.
- A file/module has grown large, mixes responsibilities (IO + transformation + formatting), or is hard to test.
- Parallel implementations exist (notably between **Comercialpublico2** and **Comercialprivado2**) for the same domain concept (commission tiers, goals, configuration, KPIs).
- Spreadsheet ingestion/export, DRE aggregation, KPI rollups, or month-range calculations become brittle or performance-sensitive.
- The team needs a safe migration plan (adapters/re-exports) while modernizing APIs/types.

Primary success criteria:
- Smaller, more cohesive modules; clearer domain boundaries (Finanças/DRE, Comercial, Orçamentos).
- Reduced duplication and a single “source of truth” for shared types/logic.
- Improved test surface (pure functions, injectable clients) and safer change workflows.

---

## Responsibilities (REQUIRED)

- Identify and prioritize refactor targets by impact and risk (duplication, churn, defect-prone areas).
- Break down large files/services into cohesive modules (types, transformations, repositories/adapters, orchestration).
- Extract **pure functions** from transformation-heavy code (DRE aggregation, KPI calculations, rolling/12-month logic).
- Consolidate duplicated types and logic across modules:
  - `CommissionTier`, `MonthlyGoal`, `WeeklyMetric` duplicates across Comercial modules.
- Standardize service contracts (return shapes, errors, naming) and introduce adapters to preserve API compatibility.
- Improve type-safety (replace `any`/implicit shapes with exported interfaces/types; unify “month key” formats).
- Isolate external integrations (Spreadsheets / AI Chat) behind client interfaces for testability and stability.
- Reduce cross-layer leakage (avoid UI formatting in services unless it is part of the contract).
- Add/upgrade minimal verification coverage for refactor targets (unit tests for pure helpers; smoke scripts when tests are absent).
- Update documentation touchpoints and add migration notes when moving/renaming exports.

---

## Best Practices (REQUIRED)

- Prefer **small PRs** (1–3 refactor moves each) over a large “big bang” rewrite.
- Refactor in two passes:
  1) **Move without changing logic** (reorganize files/modules, keep behavior identical).
  2) **Simplify internals** (remove duplication, tighten types, improve naming).
- Keep public exports stable whenever possible; otherwise:
  - Add **adapters** and/or **re-exports** as transitional layers.
  - Include explicit migration steps and timeline for removal.
- Push transformation logic into **pure functions** (no IO, deterministic inputs/outputs), then unit test them.
- Isolate IO/integration code (Spreadsheet/AI providers) behind small interfaces; inject dependencies.
- Centralize cross-domain primitives in shared locations (`src/lib`), and avoid redefining canonical types elsewhere.
- Use consistent naming:
  - Types: `PascalCase`
  - Functions: `camelCase`
  - Avoid vague names like `data`, `result` without domain qualifiers (prefer `Row`, `Summary`, `Totals`, `Record`).
- Eliminate duplication intentionally:
  - If semantics match, unify; if semantics differ, create a shared base type + module-specific extension.
- Avoid circular dependencies by enforcing directionality:
  - `src/lib` (lowest-level) should not import from services/components.
- Always define a **verification plan** before refactoring (typecheck/build + targeted regression steps; tests if available).
- Keep UI formatting/labels at the UI layer (or in dedicated presentation helpers), not in domain services—unless required by contract.

---

## Key Project Resources (REQUIRED)

- [Repository README](./README.md)
- [Docs Index](./../docs/README.md)
- [Agent Handbook / Global AGENTS](./../../AGENTS.md)
- Contributor guide (if present): `CONTRIBUTING.md` (search/add if missing)

> If any of the above files are missing in-repo, create a short follow-up task to add or link them from `README.md`.

---

## Repository Starting Points (REQUIRED)

- `src/services/` — Core orchestration and cross-cutting services (DRE, dashboard, spreadsheet integration, AI chat). High leverage refactor area.
- `src/lib/` — Shared primitives/helpers (months, contracts, generic utilities, DRE seed data). Ideal home for canonical types and reusable logic.
- `src/modules/financas/` — Finance domain and UI helpers; often includes transformation logic that should be pushed into pure helpers/services.
- `src/components/Comercialpublico2/src/services/` — Comercial “public” services; likely overlaps with private module patterns.
- `src/components/Comercialpublico2/src/utils/` and `src/components/Comercialpublico2/src/lib/` — Domain utilities; watch for duplication with Comercialprivado2.
- `src/components/Comercialprivado2/src/services/` — Comercial “private” services (KPIs, marketing, costs, actions, configuration). Common refactor: standardize service shape and shared calculation helpers.
- `src/components/Comercialprivado2/src/utils/` and `src/components/Comercialprivado2/src/lib/` — Utilities; compare with public equivalents.
- `src/components/Comercialprivado2/src/components/Orçamentos/src/` — Nested “app-within-app” for budgets; prime candidate for modularization and pure calculation extraction.

---

## Key Files (REQUIRED)

### Core services (root)
- `src/services/dreService.ts` — DRE domain operations and aggregation; refactor target for splitting IO vs transformation and consolidating DRE types.
- `src/services/dreSpreadsheetService.ts` — Spreadsheet ingestion/export for DRE; refactor target for parsing/validation as pure functions + IO adapter.
- `src/services/dashboardService.ts` — Dashboard orchestration; refactor target for reusable metric calculators and stable return shapes.
- `src/services/aiChatService.ts` — AI chat integration; refactor target for provider isolation, typed messages, and consistent error handling.

### Shared library
- `src/lib/months.ts` — Canonical month calculations (`getLast12Months`, `getMonthsInRange`, etc.); refactor target for reuse across modules and unit tests.
- `src/lib/contractUtils.ts` — Canonical contract and addendum types; ensure other areas import these rather than redefining shapes.
- `src/lib/seedCategoriasDRE.ts` — DRE category seed; separate static data from seeding routines if it’s mixed.

### Comercialpublico2
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts` — Commission tiers and calculations; likely duplicated with private module.
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts` — Monthly goals operations; unify types with configuration service.
- `src/components/Comercialpublico2/src/services/configurationService.ts` — Configuration models (`MonthlyGoal`, `CommissionTier`, `WeeklyMetric`); consolidate with private module when semantics match.

### Comercialprivado2
- `src/components/Comercialprivado2/src/utils/commissionUtils.ts` — Commission logic; compare with public module.
- `src/components/Comercialprivado2/src/services/prospectionKPIService.ts` — KPI domain; extract calculators and normalize date handling.
- `src/components/Comercialprivado2/src/services/meetingMinutesService.ts` — CRUD and types; standardize payload types and service patterns.
- `src/components/Comercialprivado2/src/services/marketingService.ts` — Social metrics; refactor for typed DTOs and mapping helpers.
- `src/components/Comercialprivado2/src/services/marketingPlanningService.ts` — Planning post types and transformations; consolidate create/update shapes.
- `src/components/Comercialprivado2/src/services/individualProspectionService.ts` — Date-with-metrics patterns; share date-range utilities.
- `src/components/Comercialprivado2/src/services/costsService.ts` — Rolling 12 months; ensure month logic reuses `src/lib/months.ts`.
- `src/components/Comercialprivado2/src/services/configurationService.ts` — Configuration types duplicated with public module.
- `src/components/Comercialprivado2/src/services/actionsService.ts` — Standardize service interface, error handling, and DTOs.

### Finanças feature utilities
- `src/modules/financas/components/Features/contract_sheets/sheetDetailUtils.ts` — Keep presentation-focused; move domain calculations to `src/lib` or finance services.

### Orçamentos (nested)
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services/systemConfigService.ts` — Configuration; refactor to typed config + pure selectors.
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services/budgetEncargosService.ts` — Calculation-heavy; extract pure functions and add tests.

---

## Architecture Context (optional)

- **Services / Orchestration**
  - Directories:  
    - `src/services/`  
    - `src/modules/financas/services/`  
    - `src/components/Comercialpublico2/src/services/`  
    - `src/components/Comercialprivado2/src/services/`  
    - `src/components/Comercialprivado2/src/components/Orçamentos/src/services/`
  - Key exports (examples): `DRESpreadsheetService`, `DashboardService`, `AIChatService`, `buscarDREPorContrato`, `listarContratosDRE`
  - Refactor goal: separate **IO/adapters** from **pure transformations** and keep service APIs stable.

- **Shared Utilities / Domain Primitives**
  - Directories:
    - `src/lib/`
    - `src/components/**/src/utils/`, `src/components/**/src/lib/`
  - Key exports (examples): `getMonthsInRange`, `ContractWithAddendums`, `cn`
  - Refactor goal: enforce `src/lib` as canonical home for cross-module primitives; avoid per-module duplication of the same concept.

- **Feature/UI Utilities**
  - Directories:
    - `src/modules/financas/components/Features/...`
    - `src/components/.../components/...`
  - Refactor goal: keep formatting and presentation in UI; push calculations downward into pure helpers/services.

---

## Key Symbols for This Agent (REQUIRED)

> Use these as anchors for identifying duplication, boundary leaks, and extraction targets.

### Root services
- [`DRESpreadsheetService`](./src/services/dreSpreadsheetService.ts) — spreadsheet IO boundary; extract parsing/validation helpers.
- [`DashboardService`](./src/services/dashboardService.ts) — orchestration; extract metric calculators.
- [`AIChatService`](./src/services/aiChatService.ts) and [`ChatMessage`](./src/services/aiChatService.ts) — provider isolation and message contract.
- [`DRELinha`](./src/services/dreService.ts), [`buscarDREPorContrato`](./src/services/dreService.ts), [`listarContratosDRE`](./src/services/dreService.ts) — DRE aggregation and listing; split responsibilities.

### Shared primitives
- [`MonthData`](./src/lib/months.ts), [`getLast12Months`](./src/lib/months.ts), [`getMonthsInRange`](./src/lib/months.ts), [`formatMonthLabel`](./src/lib/months.ts) — canonicalize month keys and reuse everywhere.
- [`Contract`](./src/lib/contractUtils.ts), [`ContractAddendum`](./src/lib/contractUtils.ts), [`ContractWithAddendums`](./src/lib/contractUtils.ts) — contract domain types should not drift.

### Comercial duplication hotspots
- [`CommissionTier`](./src/components/Comercialpublico2/src/utils/commissionUtils.ts) and [`CommissionTier`](./src/components/Comercialprivado2/src/utils/commissionUtils.ts) — consolidate when semantics match.
- [`MonthlyGoal`](./src/components/Comercialpublico2/src/services/monthlyGoalsService.ts) vs [`MonthlyGoal`](./src/components/Comercialpublico2/src/services/configurationService.ts) — remove duplicate definitions or re-export canonical type.
- [`WeeklyMetric`](./src/components/Comercialpublico2/src/services/configurationService.ts) and [`WeeklyMetric`](./src/components/Comercialprivado2/src/services/configurationService.ts) — unify if conceptually identical.

### Comercialprivado2 service DTOs
- [`ProspectionTeamKPIs`](./src/components/Comercialprivado2/src/services/prospectionKPIService.ts)
- [`MeetingMinute`](./src/components/Comercialprivado2/src/services/meetingMinutesService.ts), [`CreateMeetingMinute`](./src/components/Comercialprivado2/src/services/meetingMinutesService.ts)
- [`InstagramMetrics`](./src/components/Comercialprivado2/src/services/marketingService.ts), [`LinkedInMetrics`](./src/components/Comercialprivado2/src/services/marketingService.ts)
- [`MarketingPlanningPost`](./src/components/Comercialprivado2/src/services/marketingPlanningService.ts), [`CreateMarketingPlanningPost`](./src/components/Comercialprivado2/src/services/marketingPlanningService.ts)
- [`MonthlyCost`](./src/components/Comercialprivado2/src/services/costsService.ts), [`Rolling12MonthsResult`](./src/components/Comercialprivado2/src/services/costsService.ts)

---

## Documentation Touchpoints (REQUIRED)

- [`README.md`](./README.md) — overall project guidance and dev workflows.
- [`../docs/README.md`](./../docs/README.md) — documentation index for deeper references.
- [`../../AGENTS.md`](./../../AGENTS.md) — shared agent guidelines and conventions.
- Module-level documentation to search and keep aligned (if present):
  - `src/modules/financas/**/README.md`
  - `src/components/Comercialpublico2/**/README.md`
  - `src/components/Comercialprivado2/**/README.md`
  - `src/components/Comercialprivado2/src/components/Orçamentos/**/README.md`

When completing a refactor that moves shared code/types:
- Add a short note (or update existing docs) describing:
  - what moved,
  - why it’s canonical,
  - how to migrate imports,
  - any deprecation timeline for old paths/exports.

---

## Collaboration Checklist (REQUIRED)

1. [ ] Confirm intent and constraints: **behavior-preserving refactor** vs approved behavior change.
2. [ ] Identify scope and blast radius (files, call sites, consumers); list impacted modules (Finanças / Comercialpublico2 / Comercialprivado2 / Orçamentos).
3. [ ] Establish a verification plan before edits:
   - [ ] typecheck/build steps
   - [ ] tests (if present) or a minimal smoke script
   - [ ] manual regression checklist (screens/flows impacted)
4. [ ] Locate and document duplication/smells with concrete references (file paths + symbols).
5. [ ] Propose an incremental sequence of PRs (2–4 small PRs preferred) with clear migration steps.
6. [ ] Implement refactor using safe patterns:
   - [ ] extract pure helpers first
   - [ ] introduce adapters/re-exports when changing public surfaces
   - [ ] keep diffs narrow and reviewable
7. [ ] Update or add tests for extracted pure logic; ensure deterministic behavior.
8. [ ] Run verification plan and attach results to PR description.
9. [ ] Request reviews from owners of affected areas (Comercial vs Finanças); call out any contract changes explicitly.
10. [ ] Update documentation touchpoints and add migration notes (imports, deprecated exports, new canonical modules).
11. [ ] Capture learnings:
   - [ ] new conventions established (e.g., canonical type location)
   - [ ] follow-up tasks (remove adapters, delete dead code, expand tests)
12. [ ] After merge, open/track follow-up issues to remove temporary compatibility layers once all call sites are migrated.

---

## Hand-off Notes (optional)

When the refactor work is complete, provide a concise hand-off summary that includes:
- Structural changes (files split/moved, new modules introduced, removed duplication).
- Compatibility measures (adapters, re-exports, deprecation notes) and what remains to be migrated.
- Verification performed (commands run, test coverage added, smoke checks).
- Remaining risks (areas needing extra regression attention: DRE computations, month-range logic, commission tiers, rolling 12-month KPIs).
- Suggested next refactor targets with rationale (e.g., unify commission logic across Comercial modules; centralize configuration types; isolate spreadsheet and AI provider clients).

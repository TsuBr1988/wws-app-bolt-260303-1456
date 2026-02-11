# Backend Specialist Playbook (wws-hub)

## Mission

Own and evolve the “backend” behavior of this repository—primarily implemented as **TypeScript service modules** that orchestrate data access, calculations, spreadsheet/document parsing, and external integrations—ensuring correctness, resilience, and maintainability.

Engage this agent when:
- Adding or changing **service-layer logic** (financial DRE, dashboards, OCR parsing, KPI calculations, goals/config).
- Introducing or refactoring **data models** in `src/types/database.ts`.
- Integrating external systems (spreadsheets, AI chat, OCR, marketing metrics) or improving error handling/observability.
- Standardizing patterns across duplicated domains (`Comercialpublico2`, `Comercialprivado2`, `financas`).

---

## Responsibilities

- Implement and refactor **service-layer modules** in `src/services/**` and domain service folders under `src/components/**/src/services/**`.
- Maintain **type safety** and shared contracts in `src/types/database.ts` and local service DTOs.
- Ensure data transformations are consistent for:
  - **DRE / financial reporting** (`dreService.ts`, `dreSpreadsheetService.ts`)
  - **Dashboards/aggregations** (`dashboardService.ts`, finance modules)
  - **AI chat orchestration** (`aiChatService.ts`)
  - **Commercial KPIs and planning** (public/private services)
- Improve **resilience**: input validation, explicit error surfaces, edge-case handling, safe parsing.
- Create/adjust **API-facing controller utilities** where present (notably OCR handlers and tasks API types).
- Provide implementation notes and update relevant documentation touchpoints when behavior changes.

---

## Key Project Resources

- `src/services/*` – shared/core services (DRE, dashboard, AI chat).
- `src/types/database.ts` – canonical shared data types used across modules.
- `src/components/Comercialpublico2/src/services/*` – “public commercial” domain services.
- `src/components/Comercialprivado2/src/services/*` – “private commercial” domain services and utilities (OCR, tasks).
- `src/modules/financas/services/*` – finance domain services (module-scoped).
- `src/modules/financas/components/Features/contract_sheets/*` – contract sheets feature (data + transformations).

---

## Repository Starting Points (What to Focus On)

### 1) Core shared services (highest leverage)
- `src/services/dreService.ts`  
  Financial DRE logic (fetching, grouping, aggregations).
- `src/services/dreSpreadsheetService.ts`  
  Spreadsheet-centric DRE parsing/reading/writing orchestration (DREData).
- `src/services/dashboardService.ts`  
  Aggregation logic used to build dashboard data.
- `src/services/aiChatService.ts`  
  AI chat message types and orchestration.

### 2) Domain services (commercial + finance)
- `src/components/Comercialpublico2/src/services/*`  
  Monthly goals, configuration (tiers/weekly metrics).
- `src/components/Comercialprivado2/src/services/*`  
  Prospection KPIs, meeting minutes, marketing metrics/planning, costs, actions, configuration.
- `src/modules/financas/services/*`  
  Finance module logic (module-local patterns may differ slightly).

### 3) Controller-ish utilities (API boundary behavior)
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`  
  OCR pipeline handlers: `runOcr`, `detectTemplate`, and parsers (`parseConexoes`, `parsePerfil`, `parseMetas`, etc.).
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`  
  Task API types and DTO definitions (contracts for task-related operations).

### 4) Shared types (system-wide contracts)
- `src/types/database.ts`  
  Central domain types such as `HrHeadcount`, `FinRevenue`, `ComSales`, `HrTurnover`, `ContractTableRow`, etc.

---

## Key Files (Purpose + When to Edit)

- `src/types/database.ts`  
  **Purpose:** Shared structural types for “tables” and chartable data.  
  **Edit when:** Adding new columns/fields, standardizing row shapes, aligning service outputs.

- `src/services/dreService.ts`  
  **Purpose:** Domain-level DRE operations and computation (e.g., `buscarDREPorContrato`, `listarContratosDRE`).  
  **Edit when:** Changing DRE business rules, line grouping, contract list behavior, filtering logic.

- `src/services/dreSpreadsheetService.ts`  
  **Purpose:** Spreadsheet IO/transformations for DRE (type `DREData`).  
  **Edit when:** Spreadsheet structure changes, mapping updates, import/export behavior, parsing resilience.

- `src/services/dashboardService.ts`  
  **Purpose:** Build dashboard-friendly outputs from typed inputs.  
  **Edit when:** New dashboard cards/series are introduced; performance improvements needed.

- `src/services/aiChatService.ts`  
  **Purpose:** Chat orchestration and message typing (`ChatMessage`, `AIChatService`).  
  **Edit when:** Changing prompt structure, adding system tools, enforcing message validation/limits.

- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts`  
  **Purpose:** Monthly goals read/write & transformations (`MonthlyGoal`).  
  **Edit when:** Goals model changes, additional rollups/validations required.

- `src/components/Comercialpublico2/src/services/configurationService.ts`  
  **Purpose:** Public commercial config (tiers, weekly metrics).  
  **Edit when:** Commission tiers, weekly metrics, or config schemas change.

- `src/components/Comercialprivado2/src/services/*` (examples)
  - `prospectionKPIService.ts` (`ProspectionTeamKPIs`)
  - `meetingMinutesService.ts` (`MeetingMinute`, `CreateMeetingMinute`)
  - `marketingService.ts` (`InstagramMetrics`, `LinkedInMetrics`)
  - `marketingPlanningService.ts` (`MarketingPlanningPost`, `CreateMarketingPlanningPost`)
  - `individualProspectionService.ts` (`IndividualProspectionRow`, `DateWithMetrics`)
  - `costsService.ts` (`MonthlyCost`, `Rolling12MonthsResult`)
  - `actionsService.ts` (`Action`, `CreateAction`, `ActionComment`, `CreateActionComment`)
  
  **Purpose:** Domain-specific business services.  
  **Edit when:** Adding fields, changing calculations, enforcing constraints, improving IO resilience.

- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`  
  **Purpose:** OCR parsing and template detection; shaping raw OCR output into structured data.  
  **Edit when:** OCR templates change, parsing rules evolve, need better error reporting.

- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`  
  **Purpose:** API-facing types: `Task`, `TaskCounts`, `TaskFormData`.  
  **Edit when:** Task API contracts change or validation requirements shift.

---

## Architecture Context (How This Codebase “Does Backend”)

### Services (primary backend layer)
- **Directories:**
  - `src/services`
  - `src/modules/financas/services`
  - `src/components/Comercialpublico2/src/services`
  - `src/components/Comercialprivado2/src/services`
  - `src/components/Comercialprivado2/src/components/Orçamentos/src/services`
- **Pattern:** “Service layer” modules encapsulate business logic. Expect functions/classes to:
  - Accept typed inputs/DTOs
  - Transform/aggregate
  - Interact with data sources (often indirectly—spreadsheet, storage, or component data modules)
  - Return typed, UI-ready data shapes

### Repositories / Data access (diffuse but type-driven)
- **Directories (as observed):**
  - `src/types`
  - `src/components/Comercialpublico2/src/lib`, `src/components/Comercialpublico2/src/data`
  - `src/components/Comercialprivado2/src/lib`
  - `src/modules/financas/components/Features/contract_sheets`
  - `src/components/okr`
- **Pattern:** Data access appears embedded per-domain. The backend specialist should:
  - Keep IO boundaries explicit (parse/validate at edges)
  - Use shared types (`src/types/database.ts`) for consistency
  - Avoid leaking raw external formats beyond service boundaries

### Controllers / API boundary utilities (limited but important)
- **Directories:**
  - `src/components/Comercialprivado2/src/utils`
  - `src/components/Comercialprivado2/src/components/Tasks`
- **Pattern:** Utilities act like controllers: take raw input (OCR/API), normalize it, and pass to services.

---

## Key Symbols for This Agent (Entry Points)

### Shared core
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
- `DashboardService` — `src/services/dashboardService.ts`
- `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`
- `buscarDREPorContrato`, `listarContratosDRE`, `DRELinha` — `src/services/dreService.ts`

### Shared domain types
From `src/types/database.ts`:
- `HrHeadcount`, `HrTurnover`, `HrContractEmployees`, `HrAbsenteeism`
- `FinRevenue`, `FinRevenueTableRow`
- `ComSales`
- `ChartDataPoint`, `EditableRowData`, `ContractTableRow`

### Comercial Público
- `MonthlyGoal` — `monthlyGoalsService.ts`, `configurationService.ts`
- `CommissionTier`, `WeeklyMetric` — `configurationService.ts`

### Comercial Privado
- `ProspectionTeamKPIs` — `prospectionKPIService.ts`
- `MeetingMinute`, `CreateMeetingMinute` — `meetingMinutesService.ts`
- `InstagramMetrics`, `LinkedInMetrics` — `marketingService.ts`
- `MarketingPlanningPost`, `CreateMarketingPlanningPost` — `marketingPlanningService.ts`
- `IndividualProspectionRow`, `DateWithMetrics` — `individualProspectionService.ts`
- `MonthlyCost`, `Rolling12MonthsResult` — `costsService.ts`
- `Action`, `CreateAction`, `ActionComment`, `CreateActionComment` — `actionsService.ts`

### OCR / Tasks boundary
- `runOcr`, `detectTemplate`, parsing helpers — `ocrHandlers.ts`
- `Task`, `TaskCounts`, `TaskFormData` — `tasks.api.ts`

---

## Standard Workflows (Actionable Steps)

### Workflow A — Add/Change a Service Feature (new computation, new endpoint-like function)
1. **Locate the correct domain service folder**
   - Shared/core: `src/services/*`
   - Public commercial: `src/components/Comercialpublico2/src/services/*`
   - Private commercial: `src/components/Comercialprivado2/src/services/*`
   - Finance module: `src/modules/financas/services/*`
2. **Define/extend types first**
   - If the shape is broadly shared, add to `src/types/database.ts`.
   - If domain-local, define DTOs/types in the relevant service module (keep exported types stable).
3. **Implement logic with explicit boundaries**
   - Separate: input normalization → core computation → output shaping.
   - Keep external-format specifics (spreadsheet cells, OCR tokens) at the edges.
4. **Return UI-ready, typed outputs**
   - Prefer arrays of typed rows (e.g., `FinRevenueTableRow`, `ContractTableRow`) or chart-friendly points (`ChartDataPoint`).
5. **Add safeguards**
   - Validate assumptions (required fields, date formats, numeric parsing).
   - Provide deterministic handling for missing data (default values, explicit `null`, or empty arrays—choose consistently within the module).
6. **Update any dependent configuration services**
   - Commission tiers, weekly metrics, operational costs etc. live in configuration service files—keep them in sync.
7. **Document behavior changes**
   - Update module-level comments or any docs referenced by the team (see “Documentation Touchpoints”).

### Workflow B — Modify DRE Logic (Financial reporting)
1. Start in `src/services/dreService.ts`
   - Identify if change affects `buscarDREPorContrato` (contract-specific) or `listarContratosDRE` (listing/selection).
2. If the source/format is spreadsheet-driven, also review:
   - `src/services/dreSpreadsheetService.ts`
3. Apply changes in three layers:
   - **Mapping** (how raw data becomes `DRELinha`/domain categories)
   - **Aggregation** (grouping, totals, derived metrics)
   - **Presentation** (final ordering, labels, normalization)
4. Ensure backward compatibility:
   - Keep exported function signatures stable unless coordinating refactors.
   - If adding new fields, make them optional initially when feasible.
5. Add regression checks:
   - If no formal test suite exists, add lightweight validation helpers in the service (e.g., invariants: totals match sums; month range length; no NaN leaks).

### Workflow C — Add a New Data Type / Table Row Shape
1. Prefer canonical definitions in `src/types/database.ts` when:
   - Multiple modules will use it, or it represents a “table row” used across features.
2. Keep naming consistent with existing patterns:
   - `XTableRow` for table outputs; `ChartDataPoint`-like for charts; `EditableRowData` for inline-edit tables.
3. Update services to return the canonical type:
   - Avoid parallel “almost same” local types unless strictly domain-private.

### Workflow D — OCR Template/Parsing Change
1. Edit `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
2. Maintain the pipeline order:
   - `runOcr` → `detectTemplate` → template-specific parse (`parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`, etc.)
3. Hardening rules:
   - Treat OCR output as untrusted: guard every field access.
   - Normalize decimals, dates, and percent values consistently.
4. Improve debuggability:
   - Prefer returning structured parse results that can carry warnings (even if optional).
   - Keep template detection deterministic and explainable.

### Workflow E — Add/Change AI Chat Behavior
1. Work in `src/services/aiChatService.ts`
2. Keep `ChatMessage` strict:
   - Enforce role + content expectations; avoid leaking raw objects to the consumer.
3. Add constraints:
   - Message length limits, truncation strategy, and safe handling of missing content.
4. If adding new “tools” or capabilities:
   - Keep orchestration in the service; keep domain logic in separate services and call them.

### Workflow F — Configuration / Goals Updates (Public + Private)
1. Public commercial config:
   - `src/components/Comercialpublico2/src/services/configurationService.ts`
2. Private commercial config:
   - `src/components/Comercialprivado2/src/services/configurationService.ts`
3. Ensure both remain consistent where concepts overlap:
   - `MonthlyGoal`, `CommissionTier`, `WeeklyMetric` exist in both domains—avoid silent divergence unless intentional.

---

## Best Practices (Derived from Current Structure)

### Type-first development
- Use `src/types/database.ts` as the canonical reference for cross-feature row types.
- Export types from service modules when they represent stable contracts (`CreateMeetingMinute`, `ProspectionTeamKPIs`, etc.).
- Avoid `any`; prefer narrow unions and explicit optional properties for evolving schemas.

### Keep IO formats at the edges
- Spreadsheet and OCR parsing should not leak raw formats through the service boundary.
- Normalize into domain DTOs early; compute on DTOs; output typed view models.

### Prefer deterministic, stable outputs
- Stable ordering for lists/tables (sorting rules inside the service).
- Explicit handling for empty/missing data (no implicit `undefined` fields in arrays unless documented).

### Minimize cross-domain coupling
- If logic is shared, move it to `src/services/*` (or a shared lib folder) and consume from both Comercialpublico2/privado2.
- Avoid duplicating the same calculation in multiple service files.

### Make changes traceable
- When altering business logic (DRE, KPI formulas), add:
  - Inline comment stating the rule and date/change reason
  - A small “sanity check” helper or example input/output (if tests aren’t present)

### Consistent naming
- Services: `XService` for classes; verbs for exported functions (`listar*`, `buscar*`).
- DTOs: `CreateX` for create payloads; `XRow`/`XTableRow` for tabular outputs.

---

## Documentation Touchpoints

If present in the repository, keep these aligned with behavior changes:
- `README.md` (root)
- `docs/README.md` (documentation index)
- `AGENTS.md` (agent guidelines)
- Any module-level README under `src/modules/**` or `src/components/**` (common in larger repos)

(If any of these files are missing or outdated, add a short section describing the service you changed and its inputs/outputs.)

---

## Collaboration Checklist (Definition of Done)

- [ ] Confirm which domain owns the change: shared (`src/services`) vs domain (`Comercialpublico2`, `Comercialprivado2`, `financas`).
- [ ] Identify and update the authoritative types (`src/types/database.ts` or local DTO exports).
- [ ] Implement logic with clear IO boundaries (parse/normalize → compute → shape output).
- [ ] Ensure error handling is explicit (no silent NaN/undefined propagation).
- [ ] Check for duplicated concepts across public/private config services; reconcile if needed.
- [ ] Update any dependent services and keep exported contracts stable (or coordinate breaking changes).
- [ ] Add notes in docs/PR description: what changed, why, edge cases, and expected outputs.

---

## Hand-off Notes (What to Leave Behind After Work)

When completing a task, leave:
- A concise summary of **what changed** (files + exports affected).
- The **new/updated types** (and whether they’re shared or domain-specific).
- Any **migration notes** (e.g., “field X is now optional”, “new category added to DRE output”).
- Known risks/edge cases (e.g., OCR template ambiguity, missing spreadsheet columns).
- Suggested follow-ups (tests to add, refactors to de-duplicate logic).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

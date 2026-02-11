# Architect Specialist Playbook (wws-hub)

## Mission

Own and evolve the system architecture of **wws-hub** by:
- Defining and enforcing module boundaries, layering rules, and shared conventions.
- Reducing coupling across domains (TI, Finanças, Comercial Público/Privado, Orçamentos).
- Standardizing service patterns, types, and configuration constants.
- Guiding larger refactors and integration work (AI chat, spreadsheets/DRE, OCR pipelines, dashboards).
- Ensuring changes are “architecturally safe”: maintainable, testable, and consistent with existing patterns.

Engage this agent when:
- Adding a new module/service with non-trivial data flow.
- Integrating external systems (spreadsheets, OCR, AI, marketing APIs).
- Refactoring cross-module dependencies.
- Introducing new configuration constants/types or shared UI/service abstractions.
- Addressing performance, reliability, or scaling issues in service orchestration.

---

## Responsibilities

1. **Architecture & Boundaries**
   - Define and document module boundaries for:
     - `src/modules/ti/*`
     - `src/modules/financas/*`
     - `src/components/Comercialpublico2/*`
     - `src/components/Comercialprivado2/*` (including `Orçamentos`)
   - Enforce layer separation: configuration/constants → services → “controllers/handlers”/UI.

2. **Service Layer Governance**
   - Keep service interfaces consistent (naming, return types, error handling strategy).
   - Identify common service concerns (caching, retries, logging, timeouts, data validation) and propose shared utilities.

3. **Cross-Domain Modeling**
   - Establish canonical domain types where duplication appears (e.g., `MonthlyGoal`, `CommissionTier`, `WeeklyMetric` exist in multiple subtrees).
   - Define translation/adapters when multiple domains share similar concepts but differ in semantics.

4. **Integration Architecture**
   - AI: keep `AIChatService` usage isolated behind an interface to prevent leakage of provider-specific logic.
   - Spreadsheets/DRE: ensure `DRESpreadsheetService` and `dreService` remain the single “source of truth” for DRE computation and extraction rules.
   - OCR: ensure `ocrHandlers.ts` remains a stable pipeline with explicit stages and typed outputs.

5. **Documentation & Decision Records**
   - Maintain architecture notes and lightweight ADRs (Architecture Decision Records) when significant changes occur (new domain, new external integration, major refactor).

6. **Review & Risk Management**
   - Review PRs for architecture drift: cyclic dependencies, duplicated types/config, services doing UI work, inconsistent constants.
   - Propose incremental migration plans (strangler-style) rather than “big bang” rewrites.

---

## Repository Starting Points (Where to Focus)

### Core Services (system-wide business logic)
- `src/services/`
  - `dreSpreadsheetService.ts` — spreadsheet extraction/interaction for DRE data.
  - `dreService.ts` — DRE domain computation and queries.
  - `dashboardService.ts` — orchestration for dashboard data.
  - `aiChatService.ts` — AI chat integration and message model.

### Domain Modules (configuration + domain rules)
- `src/modules/ti/`
  - `chamadosConstants.ts` — TI ticketing constants (`ChamadoTipo`, `ChamadoPrioridade`, `ChamadoStatus`, etc.).
- `src/modules/financas/` — finance domain module area (services + constants; treat as bounded context).

### Commercial Components (feature sub-apps with their own services)
- `src/components/Comercialpublico2/src/services/`
  - `monthlyGoalsService.ts`
  - `configurationService.ts` (exports `MonthlyGoal`, `CommissionTier`, `WeeklyMetric`)
- `src/components/Comercialprivado2/src/services/`
  - `prospectionKPIService.ts`, `meetingMinutesService.ts`, `marketingService.ts`,
    `marketingPlanningService.ts`, `individualProspectionService.ts`,
    `costsService.ts`, `configurationService.ts`, `actionsService.ts`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/`
  - `types.ts` — Orçamentos type system (key for stabilization).
  - `services/systemConfigService.ts`, `budgetEncargosService.ts`, `budgetBenefitsService.ts`

### Controller/Handler-like utilities (workflow pipelines)
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - `runOcr`, `detectTemplate`, and parsing stages (`parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`)

### Configuration UI (permissions/users)
- `src/components/config/UsersManagementCard.tsx`
- `src/components/config/PermissionsMatrix.tsx`

---

## Key Files & Their Purposes (Architecture Lens)

### Configuration & Constants
- `src/modules/ti/chamadosConstants.ts`
  - Canonical enum-like constants for TI “Chamados”.
  - Architecture rule: constants live here; avoid duplicating string literals elsewhere.

### Services (core)
- `src/services/dreSpreadsheetService.ts`
  - Boundary: external spreadsheet I/O + mapping to internal DRE structures.
  - Keep provider mechanics here (auth, spreadsheet format assumptions), not spread across UI.
- `src/services/dreService.ts`
  - Boundary: pure-ish finance logic + DRE aggregation (`buscarDREPorContrato`, `listarContratosDRE`).
  - Architecture rule: DRE calculations must remain centralized to avoid divergent formulas.
- `src/services/dashboardService.ts`
  - Boundary: aggregate multiple domain/service calls into dashboard-ready shape.
  - Architecture rule: avoid embedding domain calculations; prefer delegation to domain services.
- `src/services/aiChatService.ts`
  - Boundary: AI provider interactions and message shaping (`ChatMessage`, `AIChatService`).
  - Architecture rule: all AI calls should flow through this layer (or an interface it implements).

### Services (commercial feature subtrees)
- `src/components/Comercialpublico2/src/services/*`
- `src/components/Comercialprivado2/src/services/*`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services/*`
  - Architecture rule: these are bounded contexts. Avoid importing across contexts unless through explicit shared abstractions.

### OCR Pipeline
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - Boundary: OCR workflow pipeline (detect → parse → normalize).
  - Architecture rule: keep each stage typed and deterministic; avoid UI/stateful concerns here.

---

## Architecture Context (Current Layering & Patterns)

### 1) Config/Constants Layer
**Primary locations**
- `.`
- `src/modules/ti/`
- `src/modules/financas/`

**Key exports**
- `ChamadoTipo`, `ChamadoPrioridade`, `ChamadoStatus`, `ChamadoModulo`, `ChamadoEstimativa` in `src/modules/ti/chamadosConstants.ts`

**Rules**
- Constants should be imported and used; do not re-encode values as string literals.
- Domain constants belong near the domain module, not in feature UI.

### 2) Service Layer (dominant pattern)
**Primary locations**
- `src/services/`
- `src/modules/financas/services/`
- `src/components/Comercialpublico2/src/services/`
- `src/components/Comercialprivado2/src/services/`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services/`

**Observed pattern**
- “Service classes” and “service modules” encapsulating orchestration and external interactions.
- Exposed types near services (`DRELinha`, `ChatMessage`, multiple `MonthlyGoal` types).

**Rules**
- Services should provide stable, typed interfaces.
- Orchestration lives in services; UI components should not replicate business logic.
- Prefer composition: Dashboard service aggregates, domain services compute.

### 3) Controller/Handler Layer (workflow utilities)
**Primary locations**
- `src/components/Comercialprivado2/src/utils/` (OCR handlers)
- `src/components/Comercialprivado2/src/components/Tasks/` (API-like exports)

**Rules**
- Handlers should be stateless and stage-oriented (input → output).
- Avoid mixing parsing logic with persistence or UI behavior.

---

## Key Symbols for This Agent (High-Leverage Touchpoints)

### Core domain/integration
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
- `buscarDREPorContrato`, `listarContratosDRE`, `DRELinha` — `src/services/dreService.ts`
- `DashboardService` — `src/services/dashboardService.ts`
- `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`

### Commercial configuration (duplication hotspot)
- `MonthlyGoal`, `CommissionTier`, `WeeklyMetric`
  - Public: `src/components/Comercialpublico2/src/services/configurationService.ts`
  - Private: `src/components/Comercialprivado2/src/services/configurationService.ts`

### OCR pipeline (workflow hotspot)
- `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
  - `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`

### Operational features
- `ProspectionTeamKPIs` — `src/components/Comercialprivado2/src/services/prospectionKPIService.ts`
- `MeetingMinute`, `CreateMeetingMinute` — `src/components/Comercialprivado2/src/services/meetingMinutesService.ts`
- `MarketingPlanningPost`, `CreateMarketingPlanningPost` — `src/components/Comercialprivado2/src/services/marketingPlanningService.ts`
- `MonthlyCost`, `Rolling12MonthsResult` — `src/components/Comercialprivado2/src/services/costsService.ts`
- `Action`, `CreateAction`, `ActionComment`, `CreateActionComment` — `src/components/Comercialprivado2/src/services/actionsService.ts`

---

## Standard Workflows (Actionable Steps)

### Workflow A — Introduce a New Service (or major expansion)
1. **Placement decision**
   - If cross-cutting/core: add to `src/services/`.
   - If domain-specific: add under the domain subtree (`src/modules/<domain>/...` or the specific component subtree).
2. **Define the contract**
   - Export minimal types/interfaces required by consumers.
   - Keep input/output strongly typed and stable.
3. **Separate concerns**
   - External I/O logic (APIs, spreadsheets, AI provider calls) stays in the service file.
   - Transformations and pure computations either:
     - remain in the domain service (if core), or
     - become helper functions co-located but clearly separated.
4. **Error strategy**
   - Normalize error shapes returned/thrown by the service (pick one approach and be consistent within that module).
   - Don’t leak raw provider errors to UI; wrap with context.
5. **Add usage example**
   - Add a small “call-site” pattern in the consuming layer (dashboard aggregation, UI hook, etc.) showing intended usage.
6. **Architecture check**
   - Ensure no imports from UI into services.
   - Avoid importing between `Comercialpublico2` and `Comercialprivado2` directly.

### Workflow B — Refactor to Reduce Duplication (Types/Config)
Common case here: duplicated exports like `MonthlyGoal`, `CommissionTier`, `WeeklyMetric` across public/private commercial services.

1. **Inventory**
   - Identify duplicated symbols and compare semantics (are fields identical? same units? same constraints?).
2. **Decide: unify vs. keep separate**
   - If truly same semantics → create a shared “domain types” module (prefer within a neutral location, e.g., a shared services/types area) and re-export from each feature.
   - If similar but not identical → create adapters/mappers to a canonical internal representation.
3. **Create a migration path**
   - Add new canonical type + conversion functions.
   - Update one consumer at a time.
4. **Deprecate old exports**
   - Re-export canonical types under old names where feasible to minimize churn.
   - Document changes in an ADR note.

### Workflow C — Add/Change Dashboard Aggregation
1. **Locate domain sources**
   - Prefer pulling computed values from domain services (`dreService`, commercial services).
2. **Keep DashboardService “thin”**
   - `DashboardService` should orchestrate calls and shape outputs; avoid embedding domain formulas.
3. **Stability**
   - Define a typed DTO for dashboard output to prevent accidental breaking changes to UI.

### Workflow D — Extend OCR Pipeline
1. **Treat OCR as a pipeline**
   - Stages: `detectTemplate` → parse stage(s) → normalization (`pickWeeklyFields`).
2. **Add a new template**
   - Extend `detectTemplate` with clear rules.
   - Add a new parser function that returns a typed result.
3. **Keep parsing deterministic**
   - Avoid side effects; no persistence inside parsers.
4. **Validation**
   - Add guards for missing/ambiguous fields; return partial results with explicit “unknowns” rather than silent failures.

### Workflow E — Integrate/Modify AI Chat Behavior
1. **All provider calls flow through `AIChatService`**
   - Do not call AI providers directly from UI/services elsewhere.
2. **Message model**
   - Use/extend `ChatMessage` as the stable “wire format” for prompts/responses.
3. **Safety**
   - Add explicit prompt boundaries and system instructions in a single place.
   - Ensure errors/timeouts are handled and surfaced with context.

### Workflow F — Architecting Permissions/Users Changes
1. **Identify coupling**
   - Changes in `UsersManagementCard.tsx` and `PermissionsMatrix.tsx` often imply data model/API constraints.
2. **Separate policy from presentation**
   - Permission rules should be data-driven and ideally centralized (not hard-coded into UI components).
3. **Consistency**
   - Define a canonical permission matrix shape (type/interface) and reuse it across views.

---

## Best Practices (Derived From This Codebase’s Shape)

### 1) Preserve the Service Boundary Pattern
- The repo strongly centers business logic in services (`src/services/*` and feature subtree services). Keep it that way.
- Ensure each service has a clear responsibility and does not become a “god service”.

### 2) Avoid Cross-Feature Imports Between Commercial Subtrees
- `Comercialpublico2` and `Comercialprivado2` are parallel bounded contexts.
- If sharing is necessary, extract to a shared neutral location and depend “inward”.

### 3) Centralize Domain Constants
- TI “Chamados” values are standardized in `src/modules/ti/chamadosConstants.ts`.
- For new domains, follow the same approach: constants/types in the domain module, not scattered.

### 4) Stabilize and Normalize Types at Boundaries
- External I/O boundaries (spreadsheets, AI, OCR) should map into internal canonical types immediately.
- Return typed DTOs from services; keep UI as a consumer of those DTOs.

### 5) Make Orchestration Explicit
- Aggregators like `DashboardService` should coordinate, not compute.
- Computation belongs to domain services like `dreService` and feature services.

### 6) Prefer Incremental Refactors
- When architecture drift is found (duplicated types, mixed concerns), apply a staged plan:
  - introduce adapters → migrate consumers → deprecate old paths.

---

## Architecture Guardrails (Rules to Enforce in Reviews)

- **No UI imports in services** (services must not depend on React components).
- **No business formulas in UI**; UI only renders and triggers service calls.
- **No direct AI/OCR/spreadsheet provider usage outside their dedicated services/handlers.**
- **No cross-imports between bounded contexts** unless via shared extracted module.
- **Types are single-source-of-truth**; avoid redefining the same type in multiple places without a strong reason.
- **Prefer explicit exports** (types and functions) over “reach into internals”.

---

## Review Checklist (Use in PRs)

- [ ] Does the change respect module boundaries (core vs feature subtree vs domain module)?
- [ ] Are new constants/types placed in the correct domain/config area?
- [ ] Are service contracts typed, minimal, and stable?
- [ ] Are external integrations isolated (AI via `AIChatService`, spreadsheets via `DRESpreadsheetService`, OCR via `ocrHandlers`)?
- [ ] Is there duplicated modeling (`MonthlyGoal`, `CommissionTier`, `WeeklyMetric`) introduced or worsened?
- [ ] Does `DashboardService` remain orchestration-only (no hidden business rules)?
- [ ] Are parsing stages deterministic and testable (OCR changes)?
- [ ] Are permissions/user changes policy-driven rather than UI-hardcoded?

---

## Documentation Touchpoints (Keep Updated)

- `AGENTS.md` (root) — agent index and operating guidelines (link below).
- `docs/README.md` — documentation index (link below).
- Create/maintain lightweight ADRs (recommended location: `docs/adr/` if it exists; otherwise propose adding it).

When making significant architectural decisions, record:
- Context/problem
- Decision
- Alternatives considered
- Consequences/migration plan

---

## Collaboration Checklist (Day-to-Day)

- [ ] Confirm domain ownership: TI vs Finanças vs Comercial Público/Privado vs Orçamentos.
- [ ] Identify affected services and types; map dependencies before coding.
- [ ] Propose a boundary-safe design (interfaces/DTOs) before implementation.
- [ ] Review for duplication hotspots (especially configuration/types across subtrees).
- [ ] Ensure integration points are centralized (AI/spreadsheets/OCR).
- [ ] Request targeted reviews from owners of impacted bounded contexts.
- [ ] Update docs/ADRs and leave follow-up tasks for incremental migrations.

---

## Hand-off Notes (What to Leave Behind After Work)

Include in the final output of any architecture task:
- **Updated dependency map** (which services call which; where the boundary is).
- **List of new/changed contracts** (types, DTOs, public service methods).
- **Migration plan** if refactoring (phases, deprecations, compatibility shims).
- **Risks and mitigations**
  - e.g., duplicated types left temporarily, known coupling, performance concerns, provider limits.
- **Verification steps**
  - what to run/check manually (OCR sample inputs, DRE contract list sanity, dashboard views, permission matrix behaviors).

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

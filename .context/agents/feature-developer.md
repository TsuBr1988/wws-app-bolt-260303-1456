# Feature Developer Playbook (wws-hub)

## Mission
Deliver end-to-end product features (UI + services + integrations) in the **wws-hub** codebase with minimal regressions, aligned with existing module boundaries and conventions. Engage this agent when a feature requires:
- New UI flows/pages/components
- New or extended service-layer business logic
- Changes to domain types and data mapping
- Cross-module wiring (Comercial Público/Privado, Finanças, shared UI)
- Safe refactors needed to enable the feature

---

## Responsibilities
- Implement features across **components**, **services**, and **types** while preserving module boundaries.
- Extend and reuse **service-layer** orchestration (e.g., DRE/Dashboard/AI Chat and module services).
- Maintain and evolve domain **types** (especially Comercialpublico2/Comercialprivado2 types) and keep UI/service contracts consistent.
- Add error handling and resilience (e.g., ErrorBoundary usage patterns).
- Provide developer-facing artifacts: clear PR description, follow-up notes, and updated docs where relevant.

---

## Repository Starting Points (where to work)
### 1) Shared app services (core business orchestration)
- `src/services/`
  - Cross-cutting and shared services used across pages/modules.
  - Examples: DRE, dashboards, spreadsheets, AI chat.

### 2) Product modules (feature-rich verticals)
- `src/modules/financas/`
  - Finanças pages + feature components + services.
- `src/components/Comercialpublico2/`
  - Comercial Público module: UI, hooks, services, types, contexts.
- `src/components/Comercialprivado2/`
  - Comercial Privado module: UI, hooks, services, types, contexts, OCR utilities.

### 3) Shared UI primitives & utilities
- `src/components/ui/`
  - Shared UI helpers (e.g., toast state manager).
- `src/components/layout/`, `src/components/dashboard/`, `src/components/charts/`, etc.
  - Shared view-level components and layouts.

---

## Key Files (what they’re for)
### Core services
- `src/services/dreService.ts`
  - DRE domain operations and aggregation.
  - Key exports: `DRELinha`, `buscarDREPorContrato`, `listarContratosDRE`.
- `src/services/dreSpreadsheetService.ts`
  - Spreadsheet-related DRE extraction/export orchestration.
  - Key export: `DRESpreadsheetService`.
- `src/services/dashboardService.ts`
  - Dashboard aggregation and KPI retrieval.
  - Key export: `DashboardService`.
- `src/services/aiChatService.ts`
  - AI chat orchestration and message model.
  - Key exports: `AIChatService`, `ChatMessage`.

### Comercial Público (module)
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts`
  - Monthly goals operations (`MonthlyGoal`).
- `src/components/Comercialpublico2/src/services/configurationService.ts`
  - Configuration and commission tiers.
  - Key exports: `MonthlyGoal`, `CommissionTier`.
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts`
  - Commission tier calculations/utilities.
  - Key export: `CommissionTier`.
- `src/components/Comercialpublico2/src/hooks/useNotificacoesDashboard.ts`
  - Dashboard notification retrieval/state pattern for the module.
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - UI-level fault isolation pattern (wrap risky feature sections).
- `src/components/Comercialpublico2/src/types/`
  - Module domain types:
  - `notificacao.ts` exports `SituacaoNotificacao`, `Notificacao`, `NotificacaoFormData`.
  - `index.ts` exports core domain models (Employee, Campaign, Reward, etc.).
- `src/components/Comercialpublico2/src/lib/database.types.ts`
  - DB typing surface for module data access (treat as source of truth for schema-shaped types).

### Comercial Privado (module)
- `src/components/Comercialprivado2/src/services/`
  - Examples: `prospectionKPIService.ts`, `meetingMinutesService.ts`, `marketingService.ts`.
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - OCR pipeline handlers.
  - Key exports: `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`.
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`
  - Task API models and form contracts:
  - Key exports: `Task`, `TaskCounts`, `TaskFormData`.
- `src/components/Comercialprivado2/src/utils/commissionUtils.ts`
  - Privado commission computation utilities.
- `src/components/Comercialprivado2/src/types/`
  - Module domain models (e.g., `prospection.ts`, `index.ts`).

### Shared UI utilities
- `src/components/ui/use-toast.ts`
  - Toast state/store utilities (common UX feedback mechanism).
  - Key export: internal `State` type; follow existing usage for notifications.

---

## Architecture Context (practical mental model)
### Service Layer (primary place for business logic)
**Directories**
- `src/services`
- `src/modules/financas/services`
- `src/components/Comercialpublico2/src/services`
- `src/components/Comercialprivado2/src/services`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services`

**How to use**
- Put non-trivial logic (aggregation, transformation, orchestration) in services.
- Keep components thin: they call services, render results, manage local UI state.

### Components Layer (pages, feature widgets, module UI)
**Directories (high signal)**
- `src/pages` (top-level routing views, if present in your feature)
- `src/modules/financas/pages` + `src/modules/financas/components/Features/*`
- `src/components/Comercialpublico2/src/components/*`
- `src/components/Comercialprivado2/src/components/*`
- `src/components/ui` (shared primitives)

**How to use**
- Add feature UI in the relevant module folder first (avoid cross-polluting modules).
- Promote to shared components only if reused by multiple modules.

### “Controllers” / handlers
This repo uses handler-like utilities rather than classic controllers in some areas:
- OCR handlers in `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
- Task API models in `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`

Use these patterns when adding parsing pipelines, adapters, or request/response contracts.

---

## Key Symbols for This Agent (reuse before reinventing)
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
- `buscarDREPorContrato`, `listarContratosDRE`, `DRELinha` — `src/services/dreService.ts`
- `DashboardService` — `src/services/dashboardService.ts`
- `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`
- `ErrorBoundary` — `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
- `use-toast` utilities — `src/components/ui/use-toast.ts`
- Comercial Público domain types — `src/components/Comercialpublico2/src/types/*`
- Comercial Privado OCR handlers — `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`

---

## Standard Feature Workflow (end-to-end)

### Phase P — Plan (before writing code)
1. **Locate the feature’s home**
   - Finanças feature → `src/modules/financas/components/Features/<feature>/`
   - Comercial Público → `src/components/Comercialpublico2/src/components/<FeatureArea>/`
   - Comercial Privado → `src/components/Comercialprivado2/src/components/<FeatureArea>/`
   - Cross-cutting logic → `src/services/` (only if shared)

2. **Identify the data contract**
   - Prefer existing exported types in:
     - `src/components/Comercialpublico2/src/types/*`
     - `src/components/Comercialprivado2/src/types/*`
     - `src/components/Comercialpublico2/src/lib/database.types.ts` (schema-aligned)
   - If you need a new type, define it in the module’s `types/` and export it consistently.

3. **Decide where logic belongs**
   - UI formatting and interaction: component/hook.
   - Aggregation, calculations, orchestration, external calls: service.
   - Parsing pipelines/adapters: utils/handlers (see OCR patterns).

4. **Define acceptance criteria**
   - User-visible behaviors (states: loading/empty/error/success).
   - Error handling strategy (toast + ErrorBoundary where appropriate).
   - Data validation expectations (especially for forms like `NotificacaoFormData`, `TaskFormData`).

---

### Phase E — Execute (implementation steps)
#### 1) Add/extend service-layer functionality
Use existing service patterns:
- Place shared logic in `src/services/*` if multiple modules will use it.
- Place module-specific logic in that module’s `src/services/*`.

Guidelines:
- Keep service methods deterministic where possible; isolate side effects (I/O) to clear boundaries.
- Return typed results (avoid `any`); model with exported types.

Common tasks:
- **Extend DRE functionality**
  - Check `src/services/dreService.ts` for existing aggregation functions before adding new ones.
- **Add dashboard metrics**
  - Extend `src/services/dashboardService.ts` rather than duplicating metric composition in UI.
- **Add AI chat feature**
  - Extend `AIChatService` and `ChatMessage` usage patterns in `src/services/aiChatService.ts`.

#### 2) Build UI components in the correct module
- Prefer module-local components first.
- Reuse existing UI primitives from `src/components/ui` where possible.
- Ensure each feature view handles:
  - loading state
  - empty state
  - error state (toast and/or boundary)
  - success state

If the feature area is complex or failure-prone:
- Wrap the feature container with:
  - `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`

#### 3) Hook patterns (data fetching / view-model state)
Where hooks exist (e.g., `useNotificacoesDashboard.ts`), follow the convention:
- Keep fetch/refresh logic in hooks (module-level hooks directory).
- Keep data transformation in services/utils unless it’s purely presentational.

#### 4) Forms & contracts
- Reuse existing `*FormData` models when present:
  - `NotificacaoFormData` (Comercial Público)
  - `TaskFormData` (Comercial Privado Tasks)
- Validate required fields close to the UI boundary, but keep cross-field/domain validation in services.

#### 5) User feedback (toasts)
- Use `src/components/ui/use-toast.ts` patterns for consistent feedback.
- Toast usage rules:
  - Success toast after a user-triggered mutation completes.
  - Error toast when an action fails; include actionable text.

---

## Common Feature Recipes

### Recipe A: Add a new dashboard card (metric + UI)
1. Add/extend metric computation in `src/services/dashboardService.ts`.
2. Define/extend a typed result model (module types or shared type if cross-module).
3. Render in the appropriate dashboard component directory:
   - Comercial Público: `src/components/Comercialpublico2/src/components/Dashboard/*`
   - Comercial Privado: `src/components/Comercialprivado2/src/components/Dashboard/*`
   - Finanças: `src/modules/financas/components/Features/dashboard/*`
4. Add loading + error handling (toast and/or ErrorBoundary).

### Recipe B: Add a new DRE view/filter/export
1. Check `src/services/dreService.ts` for existing DRE query functions:
   - Prefer extending `buscarDREPorContrato` / `listarContratosDRE` usage patterns.
2. If spreadsheet export/import is involved, use/extend:
   - `src/services/dreSpreadsheetService.ts` (`DRESpreadsheetService`)
3. Create the UI in the relevant module/page folder (Finanças often owns DRE-like financial views).

### Recipe C: Add/extend Comercial Público notifications
1. Update types in:
   - `src/components/Comercialpublico2/src/types/notificacao.ts`
2. Update data retrieval/state in:
   - `src/components/Comercialpublico2/src/hooks/useNotificacoesDashboard.ts`
3. Add UI updates under:
   - `src/components/Comercialpublico2/src/components/Notificacoes/*`
4. Ensure consistent error containment:
   - Use toast for action feedback
   - Use `ErrorBoundary` for high-level rendering protection

### Recipe D: Extend Comercial Privado OCR parsing
1. Add parsing logic in:
   - `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
2. Prefer adding a new `parseX` function following existing naming patterns (`parsePerfil`, `parseMetas`, etc.).
3. Keep template detection in `detectTemplate`; avoid mixing parsing and detection logic.
4. Update relevant UI components to surface parsing issues with clear errors/toasts.

---

## Best Practices (derived from this codebase)
- **Respect module boundaries**: Comercialpublico2 and Comercialprivado2 each have their own services/types/utils—don’t cross-import casually. If logic is truly shared, promote it to `src/services` or a shared utilities area.
- **Services own business rules**: Calculations like commissions should live in `commissionUtils.ts` (module-specific) or service utilities, not inside components.
- **Type-first changes**: Update/introduce types before wiring UI. Use existing exported types (`Notificacao`, `TaskFormData`, etc.) as the contract backbone.
- **Error containment**:
  - Use `ErrorBoundary` to prevent whole-section crashes for complex UIs.
  - Use toast for user-visible failure feedback.
- **Prefer extension over duplication**:
  - DRE logic → extend `dreService.ts`/`dreSpreadsheetService.ts`.
  - Dashboard aggregation → extend `dashboardService.ts`.
  - AI chat orchestration → extend `aiChatService.ts`.

---

## PR / Delivery Checklist (collaboration)
- [ ] Feature placed in the correct module directory (Finanças vs Comercial Público vs Comercial Privado vs shared).
- [ ] Service logic implemented in the appropriate `services/` file(s) (no heavy business logic in components).
- [ ] Types updated/added in module `types/` (and exported), avoiding inline `any`.
- [ ] UI handles loading/empty/error/success states.
- [ ] Toast feedback added for user-triggered actions (using `src/components/ui/use-toast.ts` patterns).
- [ ] ErrorBoundary added where failure risk is non-trivial (`ErrorBoundary.tsx`).
- [ ] No cross-module imports that violate boundaries unless intentionally shared and documented.
- [ ] Key files updated have clear names and minimal scope (small, reviewable diff chunks).
- [ ] Hand-off notes included in PR description (what changed, how to test, risks).

---

## Documentation Touchpoints (update when applicable)
- Module-level documentation (if present) under:
  - `src/components/Comercialpublico2/` (look for docs/scripts conventions)
  - `src/components/Comercialprivado2/`
  - `src/modules/financas/`
- If adding a reusable pattern (hook/service utility), document briefly in a nearby README or module docs index (if one exists).

---

## Hand-off Notes Template (paste into PR)
**What shipped**
- …

**Where**
- Services: …
- UI: …
- Types: …

**How to test**
- …

**Edge cases / known limitations**
- …

**Follow-ups**
- …

---

## Related Resources
- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

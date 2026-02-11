# Code Reviewer Agent Playbook (wws-hub)

## Mission

Ensure every change merged into **wws-hub** is correct, secure, maintainable, and consistent with established patterns across services, modules, and embedded components. The reviewer agent focuses on catching regressions (logic, typing, data integrity), enforcing conventions (layering, utilities, typing), and verifying that changes are testable and safe for production—especially around financial data (DRE), dashboards, OCR flows, and Supabase functions.

Engage this agent:
- On every PR affecting `src/services`, `src/modules/**`, Supabase functions, or shared `src/lib/**`.
- On any PR touching DRE/Dashboard logic, auth, database typing, or AI/OCR features.
- When changes cross boundaries between embedded components (`Comercialpublico2`, `Comercialprivado2`, `Orçamentos`) and root app code.

---

## Responsibilities

- **Architecture & layering compliance**
  - Verify business logic stays in services (e.g., `src/services/**`) rather than UI components or ad-hoc utilities.
  - Ensure shared utilities go into `src/lib/**` (or component-local `src/**/lib|utils` when truly component-scoped).

- **Correctness & data integrity**
  - Validate DRE calculations/import flows don’t introduce silent changes to numbers, categories, month ranges, or contract mappings.
  - Confirm dashboard aggregations and chart data shapes match expected types.

- **Type safety & API contracts**
  - Ensure new/changed functions export correct types and keep backward compatibility where required.
  - Validate database row shapes use `src/types/database.ts` and module types use `src/modules/**/types.ts`.

- **Security & privacy**
  - Check auth gates where needed (especially around financial data and AI chat).
  - Ensure OCR/AI inputs aren’t persisted or logged improperly and that external calls are handled safely.

- **Error handling & resilience**
  - Ensure robust error boundaries and user-facing error messaging patterns are followed.
  - Confirm Supabase functions and service methods have predictable error behavior.

- **Maintainability & consistency**
  - Enforce conventions around naming, file structure, exports, and utility usage (`cn`, month helpers, contract utils).
  - Request documentation touchups when behavior changes.

---

## Repository Starting Points (where to focus first)

### 1) Root Services (high risk / high impact)
**Directory:** `src/services/`  
**Typical concerns:** business logic correctness, data transformation, external integration.

Key files:
- `src/services/dreService.ts` — DRE retrieval/listing and domain logic.
- `src/services/dreSpreadsheetService.ts` — DRE spreadsheet import/export transformations.
- `src/services/dashboardService.ts` — dashboard aggregation logic and chart shaping.
- `src/services/aiChatService.ts` — AI chat message shape (`ChatMessage`) and service integration.

### 2) Core Shared Utilities (cross-cutting)
**Directory:** `src/lib/`  
Key files:
- `src/lib/utils.ts` — `cn` helper (className composition); verify consistent usage in UI code.
- `src/lib/months.ts` — month range utilities (review carefully for off-by-one, timezone, label formatting).
- `src/lib/contractUtils.ts` — contract typing and helpers (`Contract`, `ContractAddendum`).
- `src/lib/seedCategoriasDRE.ts` — DRE categories seed logic; changes can affect reporting integrity.

### 3) Finance Module (domain correctness)
**Directory:** `src/modules/financas/`  
Key files:
- `src/modules/financas/types.ts` — finance-specific types (should align with DRE/services and DB types).
- `src/modules/financas/services/**` — module-local orchestration; check boundaries with root services.

### 4) Embedded Commercial Components (separate “sub-app” conventions)
**Directories:**
- `src/components/Comercialpublico2/src/**`
- `src/components/Comercialprivado2/src/**`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/**`

Key areas:
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts` — goals logic.
- `src/components/Comercialpublico2/src/services/configurationService.ts` — configuration, commission tiers.
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts` — commission computation utilities.
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx` — error boundary conventions.
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts` — OCR controller-like parsing/templating (high risk: parsing correctness).
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts` — task API types/contracts.

### 5) Database Types (contract of truth)
**File:** `src/types/database.ts`  
Used broadly; review any changes here as **breaking changes** unless fully audited.

### 6) Supabase Functions (production edge runtime)
**Directory:** `supabase/functions/`  
Key file:
- `supabase/functions/importar-dre/index.ts` — DRE import pipeline; review for idempotency, validation, error handling.

---

## Key Files and Their Purposes (review anchors)

- `src/services/dreService.ts`
  - Exports: `DRELinha`, `buscarDREPorContrato`, `listarContratosDRE`
  - Reviewer focus: numeric aggregation correctness, filtering, performance (large contract lists), stable output shapes.

- `src/services/dreSpreadsheetService.ts`
  - Exports: `DRESpreadsheetService`
  - Reviewer focus: spreadsheet parsing/formatting, validation, locale/currency issues, column mapping drift.

- `src/services/dashboardService.ts`
  - Exports: `DashboardService`
  - Reviewer focus: chart points, date bucket alignment, handling missing data, predictable ordering.

- `src/services/aiChatService.ts`
  - Exports: `ChatMessage`, `AIChatService`
  - Reviewer focus: sanitization, prompt/response handling, secrets management, failure modes.

- `src/lib/months.ts`
  - Exports: `MonthData`, `getLast12Months`, `formatMonthLabel`, `getCurrentYearMonth`, `getMonthsInRange`, `convertMonthYmsToMonthData`
  - Reviewer focus: time boundaries, inclusivity/exclusivity, sorting, localization of labels.

- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - Exports: `ErrorBoundary`
  - Reviewer focus: consistent error display, logging approach, no sensitive data leakage.

- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - Exports: `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
  - Reviewer focus: parsing determinism, template detection reliability, null/undefined safety, defensive coding.

- `src/types/database.ts`
  - Exports: many table row types (e.g., `FinRevenue`, `ContractTableRow`, etc.)
  - Reviewer focus: strictness, naming consistency, compatibility with Supabase responses.

---

## Architecture Context (what “good” looks like here)

### Services (Business logic & orchestration)
**Where:**  
- `src/services/**`  
- `src/modules/financas/services/**`  
- component services under `src/components/**/src/services/**`

**Expectations:**
- Services expose typed methods and avoid direct UI concerns.
- Domain transformations and validations occur here (not in React components).
- Shared patterns: exported service classes (`DRESpreadsheetService`, `DashboardService`, `AIChatService`).

### Utils / Lib (Shared helpers)
**Where:**  
- `src/lib/**` (root shared)  
- `src/components/**/src/utils|lib/**` (component-scoped)

**Expectations:**
- Utilities are pure where possible (no hidden IO).
- Date/month utilities are centralized in `src/lib/months.ts`.
- Contract shapes use `src/lib/contractUtils.ts`.

### “Controllers” / Handlers (Request-like flows)
**Where:**  
- OCR handlers and tasks API typings inside `Comercialprivado2`

**Expectations:**
- Parsing functions should be deterministic and heavily validated.
- Avoid mixing parsing with persistence; keep boundaries clear.

### Supabase Functions
**Where:** `supabase/functions/**`

**Expectations:**
- Validate inputs strictly, return consistent responses, avoid leaking internals.
- Prefer idempotent behavior for import flows (safe retries).

---

## Key Symbols to Watch in Reviews

- DRE domain/services:
  - `DRELinha` — ensure schema changes are propagated and non-breaking.
  - `buscarDREPorContrato` — verify filtering and contract scoping.
  - `listarContratosDRE` — performance and sorting stability.
  - `DRESpreadsheetService` — spreadsheet schema drift, mapping correctness.

- Dashboard:
  - `DashboardService` — consistent chart bucket logic and type alignment with `ChartDataPoint`-like shapes.

- AI:
  - `ChatMessage`, `AIChatService` — ensure message schema stability and safe handling.

- Commercial public:
  - `MonthlyGoal`, `CommissionTier` — consistent types across configuration and goals services.
  - `commissionUtils.ts` — math accuracy, rounding rules.

- OCR:
  - `detectTemplate`, `parse*` functions — robust handling of partial/dirty OCR results.

---

## Review Workflows (step-by-step)

### Workflow A — Standard PR Review (default)
1. **Scope & risk classification**
   - Identify touched areas: `services`, `months/contract utils`, `database types`, Supabase functions, OCR/AI.
   - Mark PR risk: **High** if it touches DRE, database types, import functions, months/date logic, or OCR parsing.

2. **Contract check**
   - Confirm exported symbols’ signatures remain compatible or are versioned/migrated.
   - Ensure changes in `src/types/database.ts` are intentional and reflected in any callers.

3. **Layering check**
   - Business rules in services, not in UI.
   - Shared logic moved into `src/lib/**` if used across modules/components.

4. **Correctness pass**
   - Validate assumptions: month ranges, currency/decimal operations, category mapping, contract boundaries.
   - Look for off-by-one in `getMonthsInRange` usage and label formatting mismatches.

5. **Error handling**
   - Ensure meaningful errors are thrown/returned.
   - No silent failures for imports/parsers; avoid swallowing exceptions without telemetry or UI indication.

6. **Security & data handling**
   - No secrets committed; no sensitive data logged (financials, OCR extracts, chat content).
   - Auth checks where required (especially service calls that fetch financial/contract data).

7. **Performance sanity**
   - Watch for N+1 loops over contracts/months.
   - Ensure list endpoints/functions don’t repeatedly compute expensive transforms.

8. **Tests / verification expectations**
   - If no tests exist, require at least:
     - deterministic helper extraction,
     - sample input/output assertions (especially for OCR parsing and month utilities),
     - “golden file” style checks for spreadsheet mappings where practical.

9. **Review output**
   - Provide: required changes, suggested improvements, and “risk notes” for maintainers.

---

### Workflow B — Reviewing DRE / Finance Changes
Applies to:
- `src/services/dreService.ts`
- `src/services/dreSpreadsheetService.ts`
- `supabase/functions/importar-dre/index.ts`
- `src/lib/seedCategoriasDRE.ts`
- `src/modules/financas/**`

Checklist:
1. **Numeric correctness**
   - Confirm consistent rounding strategy (don’t mix string formatting with arithmetic).
   - Watch for floating-point pitfalls; prefer integers (cents) or controlled rounding if established.

2. **Category integrity**
   - Any change to DRE category seed (`seedCategoriasDRE`) must be reviewed for:
     - migrations/backfill needs,
     - impact on historical reports,
     - backward compatibility in UI filters.

3. **Date/month alignment**
   - Ensure month keys and labels come from `src/lib/months.ts` helpers.
   - Confirm inclusive/exclusive ranges; ensure sorted outputs (chronological).

4. **Import idempotency**
   - For Supabase import function: re-running should not duplicate rows or corrupt data.
   - Validate input schema and reject unknown columns/fields where possible.

5. **Performance**
   - Ensure contract lists and month loops scale; look for repeated DB calls in loops.

---

### Workflow C — Reviewing Month/Date Utility Changes
Applies to `src/lib/months.ts` and any caller changes.

Checklist:
- Confirm timezone assumptions (local vs UTC) are explicit and consistent.
- Ensure `getLast12Months` and `getMonthsInRange` produce stable, predictable ordering.
- Validate label formatting changes (`formatMonthLabel`) don’t break dashboards or exports.
- Require sample-based verification: at least a few fixed dates and expected outputs.

---

### Workflow D — Reviewing OCR Parsing Changes
Applies to `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`.

Checklist:
- **Determinism:** same input => same output; no hidden global state.
- **Validation:** guard against missing fields; return partial results with explicit markers rather than throwing unpredictably (unless callers handle).
- **Template detection:** `detectTemplate` changes must include examples of templates and failure cases.
- **Safety:** avoid logging raw OCR text if it may contain sensitive client data.

---

### Workflow E — Reviewing AI Chat Changes
Applies to `src/services/aiChatService.ts`.

Checklist:
- Ensure `ChatMessage` schema changes are backward compatible or migrated.
- No secrets in code; confirm env-based configuration.
- Handle rate limits/network errors gracefully; ensure user-facing errors don’t leak internals.
- Ensure prompts do not embed sensitive data unless explicitly required and approved.

---

## Codebase Conventions to Enforce

### Types & exports
- Prefer exported types from:
  - `src/types/database.ts` for DB tables/rows
  - `src/modules/**/types.ts` for module domain types
  - component `src/types/**` for component-scoped domain models (e.g., `Comercialpublico2` types)

### Utilities placement
- Root-wide helpers: `src/lib/**`
- Component-only helpers: `src/components/<Component>/src/utils|lib/**`
- Avoid “misc util” sprawl: if a helper is used in multiple places, promote it to the appropriate shared layer.

### Error handling patterns
- UI-level resilience uses component error boundaries (see `ErrorBoundary.tsx`).
- Service-level functions should:
  - validate inputs early,
  - throw/return actionable errors,
  - avoid returning partially invalid shapes silently.

### Consistent month handling
- Prefer using `src/lib/months.ts` helpers rather than re-implementing date math in features.

---

## Review Comment Templates (useful, consistent output)

### Required change (blocking)
- **Issue:** (what is wrong, concretely)
- **Risk:** (data corruption, wrong totals, security, runtime error)
- **Where:** `path/to/file.ts:line` (or function name)
- **Fix:** (specific suggested approach)

### Suggestion (non-blocking)
- **Suggestion:** (small refactor/cleanup)
- **Why:** (readability, reuse, future-proofing)
- **Optional patch:** (small snippet or pseudo-code)

### Verification request
- **Please verify:** (example inputs/expected outputs)
- **Reason:** (month boundary, parsing edge cases, rounding)

---

## Best Practices (derived from this repo’s shape)

- Treat **DRE + import + category seed** as a single integrity domain: changes in one often require review of the others.
- Keep business logic in service classes/functions (`src/services/**`, module services, component services).
- Centralize month/date logic through `src/lib/months.ts` to prevent subtle drift across dashboards, exports, and reporting.
- Use and maintain the DB contract types in `src/types/database.ts`; do not “wing it” with `any` or ad-hoc row shapes.
- For OCR parsing, favor defensive parsing and explicit outputs over fragile assumptions—OCR is inherently noisy.
- For AI chat, assume inputs/outputs may contain sensitive context; minimize logging and ensure error handling is safe.

---

## Documentation Touchpoints (update when behavior changes)

- Any repository-level docs (if present): `README.md`, `docs/**`, `AGENTS.md`
- If PR changes:
  - DRE import formats → document expected columns/format near the import function or service.
  - Month label formats → document in `src/lib/months.ts` header comment.
  - OCR templates → document supported templates and examples near `ocrHandlers.ts`.

(If these docs are missing or outdated, request adding/refreshing inline module documentation in the touched files.)

---

## Collaboration Checklist (for each PR)

- [ ] Identify touched domains (DRE/Dashboard/AI/OCR/DB types/month utils)
- [ ] Classify risk and ensure appropriate depth of review
- [ ] Verify layering: services vs UI vs utils
- [ ] Validate type contracts and exports (especially `src/types/database.ts`)
- [ ] Check month/date logic uses `src/lib/months.ts`
- [ ] Confirm error handling and non-leaky messages/logging
- [ ] Assess performance traps (loops + DB calls, repeated transforms)
- [ ] Require verification artifacts for high-risk changes (examples, fixtures, minimal tests)
- [ ] Request doc updates for behavior/format changes
- [ ] Summarize outcomes: blockers, suggestions, and residual risk

---

## Hand-off Notes (what to leave behind after review)

Include in final review summary:
- **What was reviewed:** files and key flows (e.g., “DRE import + dashboard aggregation”).
- **Required changes:** concise list with locations.
- **Non-blocking improvements:** refactors, naming, doc suggestions.
- **Residual risk:** what could still go wrong (e.g., “OCR template edge cases not covered”).
- **Recommended follow-ups:** tests to add, monitoring/logging to improve, documentation tasks.

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

# Bug Fixer Agent Playbook (wws-hub)

## Mission

Keep the product stable by turning bug reports, runtime errors, and failing tests into **reproducible cases**, **root-cause analyses**, and **minimal, safe patches** with **regression protection**.

Engage this agent when:
- A user reports incorrect values/flows (especially finance/DRE, dashboards, OCR parsing).
- The app throws runtime errors in React (caught by `ErrorBoundary`) or server/service exceptions.
- A PR introduces regressions or CI fails.
- Data transformations (months/contracts/OCR) produce unexpected output.

---

## Responsibilities

- **Triage & reproduction**
  - Convert bug reports/logs into deterministic reproduction steps and a smallest failing scenario.
  - Identify whether the bug is in **services**, **utils**, **UI**, or **OCR parsing**.

- **Root-cause analysis**
  - Trace data flow across relevant layers:
    - UI component → service → utils → data formatting/normalization.
  - Determine whether the issue is logic, parsing/formatting, boundary conditions, or incorrect assumptions.

- **Implement minimal fix**
  - Prefer the smallest code change that resolves the issue and minimizes blast radius.
  - Maintain existing patterns (service layer, shared utils, type shapes).

- **Add regression coverage**
  - Add/adjust unit tests where possible.
  - If tests are scarce, add a lightweight test or “executable repro” (script, fixture, or targeted assertions) aligned with current tooling.

- **Document & handoff**
  - Record root cause, fix rationale, and any follow-ups (tech debt, monitoring, needed refactors).

---

## Repository Starting Points (Focus Areas)

Prioritize these directories for bug investigations:

### 1) Core Services (business logic, orchestration)
- `src/services`
  - DRE, dashboards, AI chat orchestration and related business logic.
- `src/modules/financas/services`
  - Finance module services (often sensitive to rounding, month ranges, contract rules).
- Component-scoped services:
  - `src/components/Comercialpublico2/src/services`
  - `src/components/Comercialprivado2/src/services`
  - `src/components/Comercialprivado2/src/components/Orçamentos/src/services`

**Bug patterns you’ll see here**
- Incorrect aggregations / missing month entries
- Contract filtering/selection mistakes
- Spreadsheet export/import mismatches
- Incorrect goal/commission configurations

### 2) Shared Utilities / Transformations
- `src/lib` (global utilities)
- `src/modules/financas` (finance helpers)
- Component utilities/libs:
  - `src/components/Comercialpublico2/src/utils`, `src/components/Comercialpublico2/src/lib`
  - `src/components/Comercialprivado2/src/utils`, `src/components/Comercialprivado2/src/lib`
  - `src/components/Comercialprivado2/src/components/Orçamentos/src/utils`, `.../src/lib`
  - `src/modules/financas/components/Features/contract_sheets`
  - `src/components/Comercialpublico2/src/lib/proposals`

**Bug patterns**
- Month arithmetic & ranges (off-by-one, timezone, formatting)
- Currency/number parsing (pt-BR formatting)
- Contract addendum edge cases

### 3) Controllers / “API-ish” handlers (OCR & tasks)
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`

**Bug patterns**
- OCR template detection errors
- Numeric parsing from OCR output (thousand separators, missing decimals, stray characters)
- Partial/optional fields becoming `NaN` or wrong integers

### 4) UI Error Containment
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`

**Bug patterns**
- Crashes due to undefined/null data
- Unexpected component props/state causing render exceptions
- Missing error context making debugging harder

---

## Key Files (and what they’re for)

### Services (core)
- `src/services/dreService.ts`
  - DRE domain logic; includes exported types and queries such as:
    - `DRELinha`
    - `buscarDREPorContrato`
    - `listarContratosDRE`
- `src/services/dreSpreadsheetService.ts`
  - Spreadsheet-related logic for DRE:
    - `DRESpreadsheetService`
- `src/services/dashboardService.ts`
  - Dashboard computation/orchestration:
    - `DashboardService`
- `src/services/aiChatService.ts`
  - AI chat integration/service:
    - `AIChatService`, `ChatMessage`

### Utilities (global)
- `src/lib/utils.ts`
  - Shared helpers; includes `cn` (commonly className composition for UI).
- `src/lib/months.ts`
  - Month calculations & formatting:
    - `MonthData`
    - `getLast12Months`, `formatMonthLabel`, `getCurrentYearMonth`, `getMonthsInRange`, `convertMonthYmsToMonthData`
- `src/lib/seedCategoriasDRE.ts`
  - DRE category seeding: `seedCategoriasDRE`
- `src/lib/contractUtils.ts`
  - Contract types and helper logic:
    - `Contract`, `ContractAddendum`

### OCR + task layer
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - OCR processing pipeline:
    - `toNumberBr` (pt-BR number normalization)
    - `normalizeInts` (coerce OCR fields to valid ints)
    - `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`
  - Task models/types used by tasks features:
    - `Task`, `TaskCounts`, `TaskFormData`

### Error containment
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - React error boundary (`ErrorBoundary`)—useful for locating crash points and improving error visibility.

---

## Architecture Context (how to debug effectively)

### Service Layer (primary)
**Where:** `src/services`, plus module/component service directories  
**Role:** Orchestrates business logic and ties data transformations together.  
**Typical fix:** Correct computation, handle missing inputs, enforce invariants, adjust filtering, improve typing.

### Utils Layer (shared transformations)
**Where:** `src/lib` and component-specific `lib/utils`  
**Role:** Parsing/formatting, month math, contract helpers, shared UI utilities.  
**Typical fix:** Edge-case handling (nulls, empty strings, locale separators), consistent month key formats, safer coercions.

### Handler/Controller-like layer (OCR)
**Where:** `ocrHandlers.ts`  
**Role:** Converts semi-structured OCR output into structured data.  
**Typical fix:** Robust parsing, improved template detection, defensive defaults, logging context when parsing fails.

### UI containment (ErrorBoundary)
**Where:** `ErrorBoundary.tsx`  
**Role:** Prevent full app crashes and provide diagnostics.  
**Typical fix:** Add missing guards in components; improve boundary reporting (include route/state summary if applicable).

---

## Key Symbols for This Agent

Use these as “jump points” during investigations:

### Finance / DRE
- `DRELinha` — `src/services/dreService.ts`
- `buscarDREPorContrato` — `src/services/dreService.ts`
- `listarContratosDRE` — `src/services/dreService.ts`
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`

### Dashboard / AI
- `DashboardService` — `src/services/dashboardService.ts`
- `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`

### Months / contracts
- `MonthData`, `getMonthsInRange`, `getLast12Months`, `formatMonthLabel`, `convertMonthYmsToMonthData` — `src/lib/months.ts`
- `Contract`, `ContractAddendum` — `src/lib/contractUtils.ts`

### OCR parsing
- `toNumberBr`, `normalizeInts`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas` — `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`

### UI crash reporting
- `ErrorBoundary` — `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`

---

## Workflows (common bug types)

### Workflow A — Runtime crash in UI (React)
**Goal:** Stop the crash and prevent recurrence.

1. **Collect crash details**
   - Stack trace (browser console / monitoring).
   - Route/page, user action, input data (contract ID, month, uploaded file, etc.).
2. **Check ErrorBoundary**
   - Locate the failing component via stack trace and see how `ErrorBoundary` reports errors.
   - If the boundary lacks context, add *minimal* additional context logging (component name/route/ids).
3. **Trace data dependencies**
   - Identify the service/util feeding the component (often `DashboardService`, DRE services, month utilities).
4. **Fix strategy**
   - If data can be legitimately missing: add **guards** (null checks, fallback UI).
   - If data must exist: enforce invariant in service (throw a controlled error with actionable message).
5. **Regression**
   - Add a test or fixture reproducing the missing/invalid data scenario.
   - Add a UI-level test only if the project already uses it; otherwise prefer service/util tests.

### Workflow B — Wrong numbers (DRE/Dashboard/Goals/Commission)
**Goal:** Correct logic without breaking other calculations.

1. **Lock down expected output**
   - Identify the source-of-truth rule (business expectation).
   - Extract concrete inputs: contract, month range, categories, addendums.
2. **Find the computation point**
   - DRE: `src/services/dreService.ts`, `dreSpreadsheetService.ts`
   - Dashboard: `src/services/dashboardService.ts`
   - Configuration (public commercial): `src/components/Comercialpublico2/src/services/*`
3. **Validate month handling**
   - Check `src/lib/months.ts` usage for range boundaries and formatting keys.
   - Watch for off-by-one in inclusive/exclusive ranges.
4. **Validate locale parsing**
   - If values originate from user input/OCR/spreadsheets, ensure pt-BR parsing is correct (decimal comma vs dot).
5. **Implement minimal change**
   - Prefer localized fix at the source (one service function or util).
   - Avoid rewriting multiple layers unless necessary.
6. **Regression**
   - Add a unit test around the specific function that produced wrong numbers.
   - Include an edge-case test: empty months, partial months, zero values, negative/discounts if relevant.

### Workflow C — OCR parsing bugs (template detection, wrong fields, NaN)
**Goal:** Make OCR robust against real-world noisy inputs.

1. **Capture samples**
   - Save the raw OCR output payload (redacted if needed).
   - Identify template expected vs detected: `detectTemplate`.
2. **Reproduce deterministically**
   - Create a fixture object representing OCR output and run:
     - `detectTemplate` → relevant parse function (`parseConexoes`, `parsePerfil`, `parseMetas`) → `normalizeInts`.
3. **Harden parsing**
   - Use `toNumberBr` for numeric fields consistently.
   - Treat empty strings, whitespace, and undefined as `0` or `null` per downstream expectations.
   - Avoid `parseInt` on formatted numbers without normalization.
4. **Validate output schema**
   - Ensure downstream consumers expect the types you return (integers vs floats).
5. **Regression**
   - Add fixture-based tests for:
     - Thousand separators (`1.234`)
     - Decimal comma (`1.234,56`)
     - Mixed noise (`R$ 1.234,56`, trailing text)
     - Missing fields (undefined/empty)

### Workflow D — Month/range bugs (missing months, wrong labels, ordering)
**Goal:** Ensure consistent month keys and correct ranges.

1. **Identify month key format**
   - Determine whether code uses `YYYY-MM`, `YYYYMM`, or a structured type.
2. **Use the canonical utilities**
   - Prefer `getMonthsInRange`, `getLast12Months`, `convertMonthYmsToMonthData`, `formatMonthLabel` from `src/lib/months.ts`.
3. **Check inclusivity**
   - Confirm whether range endpoints should include start/end month.
4. **Timezones**
   - Avoid relying on local `Date` parsing of strings without specifying behavior; prefer explicit conversions already present in the months utilities.
5. **Regression**
   - Add tests for year boundaries (Dec → Jan), leap years if applicable, and single-month ranges.

---

## Best Practices (tailored to this codebase)

### Keep fixes close to the layer that owns the invariant
- Business rules: fix in **services** (e.g., `dreService.ts`, `dashboardService.ts`).
- Parsing/formatting rules: fix in **utils** (e.g., `months.ts`, OCR helpers).
- UI should primarily guard rendering and display errors, not silently “correct” domain data.

### Prefer existing utilities and types
- Use `MonthData` and the month helpers rather than re-implementing month math.
- Use `Contract` / `ContractAddendum` types for contract-related transformations.
- For UI class composition, reuse `cn` rather than manual string concatenation.

### Be defensive with external/semi-structured inputs
- OCR outputs are unreliable: normalize early (`toNumberBr`, `normalizeInts`) and validate.
- Spreadsheet imports/exports: ensure consistent numeric parsing and category mapping.

### Make errors actionable
- When throwing or logging, include:
  - contract identifiers, month/range, template type (OCR), and the failing field name
- Prefer controlled errors over silent miscalculations.

### Minimize blast radius
- Avoid broad refactors in bug-fix PRs.
- Touch the smallest number of files consistent with correctness.

---

## Debugging Checklists

### Quick triage checklist
- [ ] Can you reproduce locally with deterministic steps or fixture input?
- [ ] Is the bug in services, utils, OCR handlers, or UI?
- [ ] Is it data-dependent (specific contract/month/template)?
- [ ] Are month keys and locale number formats involved?
- [ ] Do we have an existing utility/type that should be used instead of ad-hoc logic?

### Root-cause checklist
- [ ] Identify the *first* function that produces incorrect output (not the last place it’s visible).
- [ ] Verify assumptions at boundaries:
  - undefined/null
  - empty arrays
  - “0” vs missing
  - string-number conversion
- [ ] Confirm whether the bug is:
  - parsing issue
  - off-by-one date range
  - rounding/precision
  - wrong filter/join
  - stale cached state (if applicable)

### Pre-merge safety checklist
- [ ] Regression test added or updated (or a documented executable repro if tests are not present).
- [ ] No unrelated formatting refactors.
- [ ] Error messages/logs don’t leak sensitive data (especially OCR payloads).
- [ ] Verify behavior for edge cases (empty data, year boundary months, missing fields).

---

## Documentation Touchpoints (what to consult/update)

- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - Update if adding diagnostic context or improving crash reporting behavior.
- `src/lib/months.ts`
  - Add notes/comments if you discover a tricky edge case; keep behavior consistent.
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - Add inline documentation for template assumptions and parsing rules when adjusting logic.
- Any existing docs referenced in repository navigation:
  - `README.md`
  - `AGENTS.md`
  - `docs/README.md` (if present/used)

(If these docs exist but are outdated, include updates as part of bug-fix PR when the fix introduces a new invariant.)

---

## Collaboration Checklist (end-to-end bug-fix workflow)

- [ ] Confirm reproduction steps and expected behavior with reporter/PM (if ambiguous).
- [ ] Create a minimal repro (fixture, test, or documented steps).
- [ ] Identify owner layer: service vs util vs UI vs OCR.
- [ ] Implement smallest safe fix with clear commit message.
- [ ] Add regression coverage.
- [ ] Note any follow-up refactor/tech debt separately (do not bundle).
- [ ] Summarize root cause + fix + risk in PR description.

---

## Hand-off Notes (what to leave behind after a fix)

Include in PR description or a short “bug fix report” comment:

- **Symptom:** what user saw (error message, wrong value).
- **Root cause:** exact function/module and incorrect assumption.
- **Fix:** what changed and why it is minimal.
- **Regression coverage:** test/fixture added and what it asserts.
- **Remaining risks:** related edge cases not covered, suggested follow-ups.

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

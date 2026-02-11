# Test Writer Agent Playbook (wws-app)

## Mission (REQUIRED)

Write, expand, and maintain a high-signal automated test suite that increases confidence in changes across **services**, **utilities**, and **parsing/handler logic** in `wws-app`. This agent is engaged whenever changes introduce new business rules, transform financial data (DRE/dashboard), manipulate date/month ranges, orchestrate AI chat flows, or parse semi-structured OCR inputs.

Engage this agent when:
- A PR changes code under `src/services/**`, finance module services, or commercial module services.
- Utility functions change under `src/lib/**` or component/module `utils/**`.
- Bugs are fixed: add a regression test that fails without the fix.
- New edge cases are discovered in month/date logic, contract/addendum modeling, financial calculations, or OCR parsing.
- Coverage drops or new code paths are introduced without tests.

Primary goals:
- Catch regressions early with deterministic unit tests.
- Provide focused integration tests for critical flows at service boundaries.
- Keep tests maintainable through shared fixtures, factories, and clear arrange/act/assert structure.

---

## Responsibilities (REQUIRED)

- Add **unit tests** for pure utilities and transformations:
  - `src/lib/months.ts`, `src/lib/utils.ts`, `src/lib/seedCategoriasDRE.ts`, `src/lib/contractUtils.ts`
  - Component/module utilities under commercial and finance folders
- Add **unit tests** for service logic with mocked I/O:
  - DRE aggregation/filtering (`buscarDREPorContrato`, `listarContratosDRE`)
  - Dashboard KPI computations (`DashboardService`)
  - AI chat orchestration and message ordering (`AIChatService`)
  - Spreadsheet mapping logic (`DRESpreadsheetService`) without writing real files
- Add **integration tests** where a real boundary is stable and cheap:
  - “Service + adapter” flows using in-memory stubs (avoid network/filesystem)
  - Parsing pipelines (OCR fixtures → parser → normalized output)
- Create and maintain **fixtures** for:
  - Financial line items and category seeds
  - Month ranges and year boundaries
  - OCR sample texts (clean + noisy)
- Enforce **test determinism**:
  - Mock time (`Date`) and randomness
  - Avoid reliance on locale/system timezone unless explicitly tested
- Ensure tests are **readable and resilient**:
  - Prefer invariant assertions over brittle full-object snapshots for large outputs
  - Add helper factories for repetitive domain objects
- Document new test utilities/patterns where they’re introduced (README in tests folder if present; otherwise minimal inline docs).

---

## Best Practices (REQUIRED)

- **Mirror repo conventions**: follow existing test runner, file naming (`*.test.*` / `*.spec.*`), and folder layout found in this codebase.
- **Test boundaries explicitly**:
  - Unit tests: mock all external I/O and focus on returned values and error behavior.
  - Integration tests: include multiple modules only when the boundary is stable and adds confidence.
- **Prefer deterministic assertions**:
  - Freeze time for `months.ts`-driven logic (`getCurrentYearMonth`, `getLast12Months`).
  - Compare floats carefully—prefer integer money representations if used; otherwise use tolerances.
- **Write “shape-first” tests for service outputs**:
  - Assert required keys, counts, ordering, and a few representative totals.
  - Avoid asserting entire deeply nested structures unless output is a stable contract.
- **Cover the trifecta** per meaningful unit:
  - Happy path
  - Boundary case(s) (empty arrays, missing months, year change, negative values)
  - Error/invalid inputs (nullish values, malformed month strings, missing fields in OCR)
- **Lock regressions with minimal repro inputs**:
  - One small fixture that previously broke the code.
  - One adjacent edge case if likely (e.g., Dec→Jan transition).
- **Keep OCR tests fixture-driven**:
  - Store representative OCR text samples (including whitespace/noise).
  - Assert normalized outputs (trimmed, parsed numbers, defaults) rather than intermediate parsing steps.
- **Mock dependencies at the module boundary**:
  - Mock provider clients and side-effect APIs; don’t mock internal helper functions unless unavoidable.
- **Name tests by business intent**, not implementation:
  - “aggregates DRE by month and preserves stable ordering” beats “calls reduce twice”.

---

## Key Project Resources (REQUIRED)

- [Root README](./README.md)
- [Docs index](./../docs/README.md)
- [Agent handbook / conventions](./../../AGENTS.md)

> If any of these files are missing or incomplete, treat existing test files and package scripts as the source of truth for how to run tests and how to structure them.

---

## Repository Starting Points (REQUIRED)

- `src/services/` — Core business services (DRE, dashboard, AI chat, spreadsheets). High ROI for unit tests with mocked I/O.
- `src/lib/` — Shared utilities (months/date helpers, className helper, seed data). Best candidates for deterministic unit tests.
- `src/modules/financas/` — Finance module utilities/services and transformation-heavy logic.
- `src/components/Comercialpublico2/src/services/` — Public commercial services (goals/configuration/commission-related behavior).
- `src/components/Comercialpublico2/src/utils/` and `src/components/Comercialpublico2/src/lib/` — Component-level utilities and helpers.
- `src/components/Comercialprivado2/src/services/` — Private commercial services.
- `src/components/Comercialprivado2/src/utils/` — Includes OCR handlers/parsers; fixture-based tests recommended.
- `src/components/Comercialprivado2/src/components/Orçamentos/src/` — Budget-related libs/utils/services; test calculations and transformations.
- `src/components/Comercialprivado2/src/components/Tasks/` — Task API types/logic; test any mappers/validators if present.

---

## Key Files (REQUIRED)

### Services (core orchestration)
- `src/services/dreService.ts` — DRE domain logic.
  - Exports: `DRELinha`, `buscarDREPorContrato`, `listarContratosDRE`
- `src/services/dreSpreadsheetService.ts` — Spreadsheet mapping/generation.
  - Export: `DRESpreadsheetService`
- `src/services/dashboardService.ts` — Dashboard KPI calculations.
  - Export: `DashboardService`
- `src/services/aiChatService.ts` — AI chat orchestration/provider integration.
  - Exports: `ChatMessage`, `AIChatService`

### Utilities (pure + deterministic)
- `src/lib/months.ts` — Month range and formatting helpers.
- `src/lib/utils.ts` — `cn` className helper.
- `src/lib/seedCategoriasDRE.ts` — seed data invariants for DRE categories.
- `src/lib/contractUtils.ts` — contract/addendum types and helpers.

### Handlers / parsing (fixture-driven)
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts` — OCR pipeline and parsers.
  - Exports: `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts` — Task API types/contracts.
  - Exports: `Task`, `TaskCounts`, `TaskFormData`

---

## Architecture Context (optional)

- **Services layer**
  - Directories: `src/services`, `src/modules/financas/services`, `src/components/**/src/services`
  - Key exports to target:
    - `DRESpreadsheetService`, `DashboardService`, `AIChatService`
    - `buscarDREPorContrato`, `listarContratosDRE`
  - Testing focus: aggregation, grouping, ordering, error handling; mock external calls and side effects.

- **Utils layer**
  - Directories: `src/lib`, module/component `utils` and `lib` folders
  - Key exports to target:
    - `getLast12Months`, `getMonthsInRange`, `formatMonthLabel`, `convertMonthYmsToMonthData`
    - `seedCategoriasDRE`, `cn`
  - Testing focus: year/month boundaries, input validation, formatting stability, idempotency and invariants.

- **Handlers/controllers**
  - Directories: OCR handlers and Tasks contracts under `src/components/Comercialprivado2/src/**`
  - Testing focus: fixture-based parsing, tolerance to OCR noise, safe defaults on partial inputs.

---

## Key Symbols for This Agent (REQUIRED)

### Services
- [`DRESpreadsheetService`](./src/services/dreSpreadsheetService.ts) — spreadsheet mapping/generation
- [`DRELinha`](./src/services/dreService.ts) — DRE line type/contract used in aggregation tests
- [`buscarDREPorContrato`](./src/services/dreService.ts) — DRE retrieval/aggregation per contract (unit tests + regression tests)
- [`listarContratosDRE`](./src/services/dreService.ts) — contract listing/aggregation behavior
- [`DashboardService`](./src/services/dashboardService.ts) — KPI computation and grouping
- [`ChatMessage`](./src/services/aiChatService.ts) — message contract for AI chat flows
- [`AIChatService`](./src/services/aiChatService.ts) — prompt construction, message ordering, provider call contract

### Utilities
- [`cn`](./src/lib/utils.ts) — className composition helper
- [`seedCategoriasDRE`](./src/lib/seedCategoriasDRE.ts) — seeded category structure invariants
- [`MonthData`](./src/lib/months.ts) — month data model used across date helpers
- [`getLast12Months`](./src/lib/months.ts) — time-dependent; requires frozen time tests
- [`formatMonthLabel`](./src/lib/months.ts) — formatting stability and boundary tests
- [`getCurrentYearMonth`](./src/lib/months.ts) — time-dependent; mock Date
- [`getMonthsInRange`](./src/lib/months.ts) — inclusivity/exclusivity and year-boundary tests
- [`convertMonthYmsToMonthData`](./src/lib/months.ts) — invalid input handling and parsing correctness
- [`Contract`](./src/lib/contractUtils.ts) — contract type used in service fixtures
- [`ContractAddendum`](./src/lib/contractUtils.ts) — addendum type used in contract-related edge cases

### OCR / parsing / tasks
- [`runOcr`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — orchestration; mock OCR engine dependencies if any
- [`detectTemplate`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — multi-template detection tests
- [`parseConexoes`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — parser with noisy input fixtures
- [`parsePerfil`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — parser with partial/missing fields fixtures
- [`parseMetas`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — parser with numeric extraction edge cases
- [`pickWeeklyFields`](./src/components/Comercialprivado2/src/utils/ocrHandlers.ts) — field selection logic; boundary tests
- [`Task`](./src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts) — contract/type expectations
- [`TaskCounts`](./src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts) — ensure any mapping logic remains stable
- [`TaskFormData`](./src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts) — validate shape/serialization if applicable

---

## Documentation Touchpoints (REQUIRED)

- [Project overview and scripts](./README.md)
- [Documentation index](./../docs/README.md)
- [Agent rules / contribution workflow](./../../AGENTS.md)

Also check (if present in-repo):
- Any `docs/**` pages describing architecture, finance/DRE concepts, or testing strategy.
- Any contributor guide (often `CONTRIBUTING.md`) and code style configs (e.g., ESLint/Prettier) to match patterns in tests.

---

## Collaboration Checklist (REQUIRED)

1. [ ] Confirm assumptions: identify changed modules and expected behavior (from PR diff + linked ticket/issue).
2. [ ] Locate existing tests and match conventions (runner, naming, setup/teardown patterns, mocking style).
3. [ ] Define test scope per change:
   - [ ] Unit tests for pure logic
   - [ ] Integration tests only where they add confidence and remain deterministic
4. [ ] Identify dependencies and boundaries to mock (network, filesystem, time, randomness, provider SDKs).
5. [ ] Create/refresh fixtures and factories:
   - [ ] Keep fixtures minimal and representative
   - [ ] Add “noisy” OCR fixtures for parsing changes
6. [ ] Implement tests with coverage of:
   - [ ] Happy path
   - [ ] Boundary conditions
   - [ ] Error/invalid inputs (throw or graceful fallback—match existing behavior)
7. [ ] Run the narrowest relevant test command locally; then run the full suite if feasible.
8. [ ] Review for maintainability:
   - [ ] Avoid brittle snapshots of large objects unless output is a stable contract
   - [ ] Prefer explicit assertions on invariants (ordering, totals, keys)
9. [ ] Update documentation touchpoints if new test helpers/patterns are introduced (brief notes near tests or in docs).
10. [ ] Capture learnings in the PR description:
   - [ ] What is covered
   - [ ] What is not covered and why
   - [ ] Follow-up suggestions (integration coverage gaps, missing fixtures, flaky boundary risks)

---

## Hand-off Notes (optional)

When completed, provide:
- A concise list of added/updated test files and the symbols/paths they cover (especially in `dreService`, `months`, and `ocrHandlers`).
- Any remaining risks:
  - Untestable boundaries without environment access (real OCR engine, external providers, file output)
  - Financial rounding/precision assumptions not encoded in code
  - Locale/timezone sensitivities in month formatting
- Suggested follow-ups:
  - Add in-memory integration coverage for DRE/dashboard flows if adapters exist
  - Expand OCR fixture library as new templates are encountered
  - Introduce shared factories for contracts/DRE lines if repetition grows

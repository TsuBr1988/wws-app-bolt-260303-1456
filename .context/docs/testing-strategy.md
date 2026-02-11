# Testing Strategy

This repository is a multi-module React + TypeScript application with several “sub-apps” and feature packages under:

- `src/modules/*` (e.g., `financas`, `ti`, `qualidade`)
- `src/components/Comercialpublico2/*`
- `src/components/Comercialprivado2/*`
- shared layers: `src/lib`, `src/services`, `src/types`
- backend automation: `supabase/functions/*` (Supabase Edge Functions)

Because business rules are spread across **utilities**, **services**, and **UI**, the project follows a **testing pyramid** and enforces **clear test boundaries** so tests stay fast, deterministic, and maintainable.

---

## Goals

1. **Fast feedback on PRs**: unit + integration tests must run quickly and reliably.
2. **Confidence in business rules**: calculations, mappers, and finance logic should be covered at the lowest possible level.
3. **Confidence in critical user journeys**: a small set of E2E tests validates end-to-end flows without turning the suite into a bottleneck.
4. **Deterministic execution**: avoid “works on my machine” issues (timezone, locale, real network calls, randomness).

---

## Core Principles

### Test behavior, not implementation
Prefer assertions on:
- returned values / transformed data
- rendered UI text and user-visible states
- observable side effects (e.g., service calls made with expected params)

Avoid over-coupling to internal component state or private helper structure.

### Keep modules isolated
Most tests should exercise one module/package at a time:
- `src/modules/financas/**` tests should not require Comercial sub-apps to run.
- cross-sub-app flows belong in E2E only.

### Make external boundaries explicit
Unit/integration tests must not accidentally call:
- Supabase
- `fetch`/network
- time-dependent APIs without control (`Date`, timezone)
- randomness (`Math.random`)

Mock or inject these boundaries.

### Determinism > convenience
- Freeze time when needed (`useFakeTimers`, mocked system time).
- Prefer stable fixtures over ad-hoc inline objects.
- Force a known timezone in CI and optionally locally.

---

## What to Test Where (Testing Pyramid)

### 1) Unit Tests (most tests)
**Best for:** pure logic and small domain utilities.

#### High-leverage targets in this repo
- `src/lib/**` (shared domain helpers)
  - Example: `src/lib/contractUtils.ts` (date/value rules, contract status logic)
  - Example: `src/lib/months.ts` (month range helpers)
- `src/modules/*/utils*`
  - Example: `src/modules/financas/utils.ts` (finance-specific helpers)
- `src/components/**/utils/*.ts`
  - Example: sorting, status mapping, date badges (common sources of regressions)

#### Naming conventions
- `*.test.ts` for non-React logic
- `*.test.tsx` for React component unit tests (when used)
- Either co-locate tests next to code (`foo.ts` + `foo.test.ts`) or use `__tests__/` consistently per area.

#### Typical assertions
- For date/currency formatting utilities: verify normalized outputs and edge cases (end-of-month, leap years, rounding).
- For mappers/reducers: verify mapping tables and unknown/default behavior.

---

### 2) Integration Tests (some tests)
**Best for:** service/data interactions and feature “slices” across multiple layers (service → hook/state → component), while still mocking external systems.

#### Recommended integration scenarios
- **Services that talk to Supabase**  
  Validate:
  - correct filters and ordering
  - correct handling of `null`, empty results
  - error handling paths
- **Finance/DRE workflows**  
  Validate:
  - mapping from imported rows to domain types
  - computed subtotals and category grouping
- **Feature-level flows inside a module**  
  E.g., a finance feature that combines multiple helpers and a service.

#### Naming conventions
- `*.int.test.ts` / `*.integration.test.ts`
- `*.int.test.tsx` for feature-level React integration

#### Boundary strategy (important)
- Prefer mocking the module that creates the Supabase client (centralize client creation).
  - Likely candidates to mock: `src/lib/supabase.ts` (and similar wrappers inside Comercial packages).
- Mock `fetch` when used (e.g., with a request mocking library or a simple stub).

#### Fixtures
Store realistic payloads (especially for finance/DRE) under:
- `test/fixtures/**`, or
- `__fixtures__/` alongside the tests

Use fixtures to prevent “fixture drift” and make edge cases repeatable.

---

### 3) End-to-End (E2E) Tests (few tests)
**Best for:** validating the most critical user journeys in a real browser.

#### Keep E2E small and high-value
Target:
- authentication (login/logout) and role-based access
- navigation to major dashboards (Comercial*, Qualidade, Finanças)
- key finance workflows (“money-moving”/decision-driving flows)
  - e.g., contract sheet viewing, simulations, report exports
- proposal/budget flows where applicable (create/update/status transitions)

#### Tooling
Standardize on **one** E2E framework configured in the repo (commonly Playwright or Cypress).

Naming conventions:
- Playwright: `e2e/**/*.spec.ts`
- Cypress: `cypress/e2e/**/*.cy.ts`

#### Data environment rules
- Prefer a dedicated **staging/test Supabase project** or isolated **schema**.
- Seed deterministic data for each run (or reset test schema).
- Never run E2E against production data.

#### Stability practices
- Use robust selectors: role/text/test-id (avoid brittle CSS selectors).
- Disable/avoid animation timing issues where possible.
- Enable traces/screenshots on failure in CI; allow retries in CI if supported.

---

## How to Run Tests

> Exact commands depend on `package.json` scripts. Use these patterns and map to the project’s scripts.

### Run all tests
```bash
npm run test
```

### Watch mode (local)
```bash
npm run test -- --watch
```

### Coverage
```bash
npm run test -- --coverage
```

### Run a single test file
```bash
npm run test -- path/to/file.test.ts
```

### Run tests by name/pattern
```bash
npm run test -- -t "should calculate months remaining"
```

### Run integration tests only (by convention)
If using `*.integration.test.*`:
```bash
npm run test -- --testPathPattern=integration
```

If using `*.int.test.*`:
```bash
npm run test -- --testPathPattern=int
```

### Run E2E (examples)
Playwright:
```bash
npm run e2e
# or
npx playwright test
```

Cypress:
```bash
npm run e2e
# or
npx cypress run
```

---

## Quality Gates (PR/CI Expectations)

### Coverage thresholds (minimums)
**Global minimum (repository-wide):**
- Lines: ≥ 70%
- Statements: ≥ 70%
- Branches: ≥ 60%
- Functions: ≥ 70%

**Higher standards for critical logic (increase over time):**
- `src/lib/**` and `src/modules/**/utils*`: Lines ≥ 80%, Branches ≥ 70%
- Service modules implementing business rules: Lines ≥ 75%

Notes:
- Coverage is a **floor**, not a goal. Prefer meaningful assertions over chasing metrics.
- Consider excluding generated types and “barrel-only” exports from coverage to reduce noise.

### Linting & formatting
Must pass before merge:
```bash
npm run lint
```

If formatting checks exist:
```bash
npm run format:check
```

### Type safety
Must pass before merge:
```bash
npm run typecheck
```

Guidelines:
- Avoid `any` in new code; if unavoidable, document why and keep scope narrow.

### PR testing requirements
- Changes to business logic in `src/lib`, `utils`, and services: **unit tests required**
- Changes affecting data fetching/mutations: **integration tests required**
- Changes impacting critical user journeys: **E2E tests required** (or explicitly justified)
- Bug fixes should include a regression test that fails before the fix.

### Stability rules
- Do not commit `it.skip`, `describe.skip`, or `test.only`.
- Tests must be deterministic (control time, timezone, randomness, and external I/O).

---

## Troubleshooting Common Failures

### Timezone/locale issues
Many utilities format dates/currency; failures can differ by OS locale/timezone.

Mitigations:
- Force timezone in the test runner (CI and optionally local), e.g.:
  - `TZ=UTC`
- Mock system time for time-dependent tests.
- Assert on normalized formats (avoid asserting locale-dependent strings unless explicitly required).

### Accidental Supabase/network usage in unit/integration tests
Symptoms: slow tests, flaky failures, failures when offline.

Mitigations:
- Centralize Supabase client creation (so it can be mocked).
- Mock modules that perform queries.
- Prefer dependency injection for services where feasible.

### Slow React tests due to huge renders
Mitigations:
- Test at the service/hook boundary when possible.
- Mock heavy child components in integration tests.
- Use Testing Library queries appropriately (`findBy*` only when necessary).

### Intermittent E2E failures
Mitigations:
- Reset/seed known data each run.
- Prefer robust selectors (role/text/test-id).
- Enable traces/screenshots; keep the suite small.

---

## Suggested Focus Areas in This Codebase

If you’re adding tests and want maximum impact:

1. **Unit tests** for pure helpers:
   - `src/lib/contractUtils.ts`
   - `src/lib/months.ts`
   - `src/modules/financas/utils.ts`
   - utility modules under `src/components/**/utils/`

2. **Integration tests** for service layers and finance flows:
   - `src/services/**`
   - `src/modules/*/services/**`
   - DRE/financial transformations and grouping logic

3. **E2E tests** for critical “happy paths”:
   - auth + landing dashboards
   - finance workflows (contract sheets/simulations/reports)
   - proposal/budget flows where relevant

---

## Related Documentation

- [`development-workflow.md`](./development-workflow.md)

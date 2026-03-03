# Database Specialist Agent Playbook (WWS Hub)

## Mission

Own the *data contract* between application code and persistent storage: define and evolve schemas safely, implement and run migrations, keep TypeScript database types accurate, and ensure data access patterns are reliable, performant, and auditable.

Engage this agent when:
- Adding/changing DB fields, tables, views, or import formats
- Creating/running migrations (especially in `Comercialprivado2`, `Comercialpublico2`, and `Orçamentos`)
- Debugging data inconsistencies, missing fields, or broken dashboards/KPIs caused by schema drift
- Optimizing query patterns used by services and dashboards (DRE, contracts, headcount, revenue, turnover, OKRs)

---

## Responsibilities

1. **Schema & data contract stewardship**
   - Maintain and evolve DB shapes represented in `src/types/database.ts`.
   - Ensure service-layer expectations match persisted data (fields, nullability, enum-like strings, date formats).

2. **Migration design and execution**
   - Author safe migrations (idempotent when possible).
   - Run and verify existing migration scripts in:
     - `src/components/Comercialprivado2/*.js`
     - `src/components/Comercialpublico2/scripts/*.js`
     - `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`

3. **Data access & transformation review**
   - Review query/filter/aggregation logic in services that build business KPIs and DRE outputs.
   - Prevent “silent” data bugs: mismatched keys, duplicated joins/rows, incorrect time bucketing, rounding, currency scaling.

4. **Data quality and integrity**
   - Define integrity rules (uniqueness, required fields, referential constraints if supported).
   - Provide backfills and validation scripts for legacy data.

5. **Performance & reliability**
   - Recommend indexing/partitioning strategies (where applicable).
   - Reduce heavy client-side aggregation by moving logic to the data layer or caching.

---

## Repository Starting Points (where to work)

### Typed DB contract
- `src/types/database.ts`  
  Canonical TypeScript types for key datasets used throughout the app (HR, Finance, Commercial, Contracts, charts).

### Migration scripts (critical)
- `src/components/Comercialprivado2/apply-multiple-roles-migration.js`  
  Applies a migration related to “multiple roles” in private commercial area.
- `src/components/Comercialprivado2/apply-margem-migration.js`  
  Applies a migration related to margin (“margem”) data.
- `src/components/Comercialprivado2/apply-cidade-migration.js`  
  Applies a migration related to city (“cidade”) data.
- `src/components/Comercialpublico2/scripts/apply-migrations.js`  
  Orchestrates/runs a set of migrations for the public commercial area.
- `src/components/Comercialpublico2/scripts/apply-contracts-migration.js`  
  Migration focused on contracts in public commercial area.
- `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`  
  Migrations for budgets (“Orçamentos”).

### Service layer consumers (where schema changes surface)
- `src/services/dreService.ts`  
  DRE querying/aggregation logic (functions include `buscarDREPorContrato`, `listarContratosDRE`).
- `src/services/dreSpreadsheetService.ts`  
  Spreadsheet import/export mapping for DRE; sensitive to column formats and types.
- `src/services/dashboardService.ts`  
  Aggregates and returns data used by dashboards; often impacted by schema/field changes.

### Module-specific data areas
- `src/components/Comercialprivado2/src/lib` and `src/components/Comercialprivado2/src/services`  
  Private commercial data access patterns, KPIs (e.g., prospection).
- `src/components/Comercialpublico2/src/lib`, `src/components/Comercialpublico2/src/data`, `src/components/Comercialpublico2/src/services`  
  Public commercial data layer and migrations.
- `src/modules/financas/services` and `src/modules/financas/components/Features/contract_sheets`  
  Finance domain computations and contract sheet outputs.
- `src/components/okr`  
  OKR-related persistence and metrics—verify schema consistency with chart/data types.

---

## Key Types & Symbols (data contract anchors)

From `src/types/database.ts` (treat as “public API” for persistence-backed data):
- `HrHeadcount`
- `FinRevenue`
- `FinRevenueTableRow`
- `ComSales`
- `HrTurnover`
- `HrContractEmployees`
- `HrAbsenteeism`
- `ContractTableRow`
- `ChartDataPoint`
- `EditableRowData`

Migration entrypoints (do not change lightly without validation):
- `applyMigration` in:
  - `src/components/Comercialprivado2/apply-multiple-roles-migration.js`
  - `src/components/Comercialprivado2/apply-margem-migration.js`
  - `src/components/Comercialprivado2/apply-cidade-migration.js`
  - `src/components/Comercialpublico2/scripts/apply-contracts-migration.js`
- `applyMigrations` in:
  - `src/components/Comercialpublico2/scripts/apply-migrations.js`
  - `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`

Service layer hot-spots:
- `buscarDREPorContrato` (`src/services/dreService.ts`)
- `listarContratosDRE` (`src/services/dreService.ts`)
- `DRESpreadsheetService` (`src/services/dreSpreadsheetService.ts`)
- `DashboardService` (`src/services/dashboardService.ts`)

---

## Common Workflows (step-by-step)

### 1) Adding a new persisted field (end-to-end)
**Goal:** introduce a new column/property used by UI/services with minimal regressions.

1. **Locate the owning dataset type**
   - Update the relevant type in `src/types/database.ts` (e.g., `ComSales`, `ContractTableRow`, `FinRevenueTableRow`).
2. **Identify all consumers**
   - Search in:
     - `src/services/*`
     - `src/modules/financas/**/*`
     - `src/components/Comercialprivado2/**/*`
     - `src/components/Comercialpublico2/**/*`
3. **Design a migration**
   - Prefer *additive* changes first (new nullable field, then backfill, then enforce constraints later if desired).
   - Decide: private commercial vs public commercial vs budgets migrations:
     - If it’s in private commercial data → `src/components/Comercialprivado2/apply-*.js`
     - If public commercial → `src/components/Comercialpublico2/scripts/*`
     - If budgets (“Orçamentos”) → `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`
4. **Backfill & defaults**
   - If the field is required by UI/KPIs, backfill historical records deterministically.
5. **Update import/export mappings**
   - If spreadsheets/CSV are involved, update `src/services/dreSpreadsheetService.ts` or any module-specific importers.
6. **Validate**
   - Run migration in a safe environment copy.
   - Validate representative queries and dashboards (DRE per contract; contract listing; KPI pages).
7. **Document**
   - Record the new field semantics (units, rounding, allowed nulls, source of truth) in the PR description and any local docs.

**Acceptance checklist**
- Type added in `src/types/database.ts`
- Migration applied successfully and is repeat-safe (or guarded)
- Services compile and return correct shapes
- Dashboards/KPIs render without undefined/null surprises

---

### 2) Creating or modifying a migration script
**Goal:** deliver a predictable, re-runnable migration.

1. **Pick the correct migration runner**
   - Private commercial: `src/components/Comercialprivado2/apply-<topic>-migration.js`
   - Public commercial: `src/components/Comercialpublico2/scripts/apply-migrations.js` or `apply-contracts-migration.js`
   - Orçamentos: `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`
2. **Make it observable**
   - Ensure clear logging (start/end, counts of updated rows/docs, key identifiers).
3. **Make it safe**
   - Prefer idempotent operations:
     - “If field missing → add”
     - “If value absent → compute and set”
     - “If already migrated → skip”
4. **Dry-run capability (recommended pattern)**
   - Add a `DRY_RUN` environment toggle if not present, to print intended changes without writing.
5. **Run locally on a copy**
   - Capture before/after snapshots for a small subset.
6. **Verify invariants**
   - Example invariants:
     - Contract identifiers remain stable
     - Revenue totals don’t change unexpectedly
     - Role counts don’t explode due to duplication

**Migration output expectations**
- Clear statement of what changed
- Number of records affected
- Any records skipped and why
- Any data anomalies encountered

---

### 3) Debugging a data inconsistency in dashboards/KPIs
**Goal:** identify whether bug is schema drift, migration gap, or aggregation error.

1. **Start from the contract**
   - Check `src/types/database.ts` for expected fields and optionality.
2. **Trace the service**
   - Identify which service populates the widget/page:
     - DRE: `src/services/dreService.ts`
     - Dashboards: `src/services/dashboardService.ts`
     - Prospection KPIs: `src/components/Comercialprivado2/src/services/prospectionKPIService.ts`
3. **Check transformation points**
   - Look for:
     - Date parsing/time zones
     - Group-by keys (contract id vs name)
     - Currency scaling (cents vs reais) and rounding
     - Null handling (`undefined` vs `null`)
4. **Compare raw vs aggregated**
   - Validate raw record counts and totals before aggregation.
5. **Confirm migration coverage**
   - Verify relevant migration scripts were run and succeeded for the environment.
6. **Fix**
   - If schema mismatch → migration + type updates
   - If aggregation bug → service fix + regression test (or fixture data check)

---

### 4) Changing DRE/Finance structures safely
**Goal:** avoid breaking DRE contract computations and exports.

1. **Understand DRE usage**
   - `src/services/dreService.ts` is the source of truth for DRE queries and contract-level DRE views.
   - `src/services/dreSpreadsheetService.ts` maps to spreadsheet formats—treat column names and ordering as external interface.
2. **Version changes**
   - Prefer additive changes: new lines/fields rather than renaming existing ones.
3. **Keep export stable**
   - If a rename is required, consider supporting both fields for a transition period and map old → new.
4. **Reconcile totals**
   - Validate that totals match expected accounting rules after any changes.

---

### 5) Multi-project Supabase / split schema troubleshooting
**Goal:** avoid "phantom bugs" caused by querying the wrong Supabase project.

Use this workflow when you see:
- PostgREST 404s like `relation does not exist` / `Could not find the table`
- HTTP 200 with `[]` where data is known to exist
- Module works in one area (e.g. Comercial Privado) but fails in another (e.g. Oramentos)

Steps:
1. **Identify the module context**
  - Confirm whether code path is `Comercialpublico2`, `Comercialprivado2`, `financas`, or a feature-local client.
2. **Confirm which client is used**
  - Prefer `getDatabase('<MODULE>')` via `src/lib/databaseResolver.ts`.
  - Also check for feature-local clients (some features have their own `supabase.ts`).
3. **Probe table existence**
  - Minimal select against key tables (limit 1).
  - If you get 404 with "relation does not exist", the schema is missing in that project.
4. **Differentiate empty vs RLS**
  - `200 []` can be real emptiness, filters, or RLS.
  - Verify auth/session context and confirm policies for that table.
5. **Choose a remediation path**
  - Best: migrate/unify schema so the module's project is authoritative.
  - Transitional: add a dedicated env client for the feature.
  - Last-resort transitional: multi-source read detection + explicit UI guardrails.
6. **Document**
  - Record which tables exist in which project and the chosen resolution (including planned cleanup/migration).

Reference: `.context/skills/supabase-multi-project/SKILL.md`

---

## Codebase-Specific Best Practices (derived from repo structure)

1. **Treat `src/types/database.ts` as the canonical schema contract**
   - If a field is persisted and used broadly, it must appear here with correct optionality and type.
   - Prefer explicit types for rows used in tables (`*TableRow`) to avoid accidental coupling to raw DB records.

2. **Keep migrations close to their domain module**
   - Private vs public commercial and budgets have separate migration runners—use the existing ones rather than inventing a new pattern.

3. **Idempotence over cleverness**
   - Multiple “apply migration” scripts exist; assume migrations may be re-run. Guard against double updates and duplication.

4. **Preserve business keys**
   - Contracts and DRE are sensitive to identifiers. Avoid changes that alter join keys or generate new IDs unless the plan includes a full backfill and consumer update.

5. **Be strict about dates and numbers**
   - Explicitly define:
     - Date granularity (day/month) and timezone assumptions
     - Currency unit (integers in cents vs floats) and rounding rules
   - Enforce these in transformation layers and/or migration scripts.

6. **Prefer small, auditable transformations**
   - When backfilling, update only the required fields and keep a log of affected records and counts.

---

## Key Files & Their Purposes (quick reference)

### Types
- `src/types/database.ts`  
  Shared data shapes for HR/Finance/Commercial datasets; used by services/components.

### Services (data consumers/aggregators)
- `src/services/dreService.ts`  
  Builds DRE datasets and contract DRE views; primary place where schema drift causes failures.
- `src/services/dreSpreadsheetService.ts`  
  Spreadsheet mapping/interop; column-level changes must be coordinated here.
- `src/services/dashboardService.ts`  
  KPI and dashboard aggregation; sensitive to missing fields and performance.

### Migrations
- `src/components/Comercialprivado2/apply-multiple-roles-migration.js`  
  Migration runner for role-related data shape changes.
- `src/components/Comercialprivado2/apply-margem-migration.js`  
  Migration runner for margin-related changes.
- `src/components/Comercialprivado2/apply-cidade-migration.js`  
  Migration runner for city-related changes.
- `src/components/Comercialpublico2/scripts/apply-migrations.js`  
  Batch migration runner for public commercial module.
- `src/components/Comercialpublico2/scripts/apply-contracts-migration.js`  
  Contract-specific migration for public commercial module.
- `src/components/Comercialprivado2/src/components/Orçamentos/apply-migrations.js`  
  Migration runner for budgets domain.

---

## Review Checklist (PRs touching data layer)

- [ ] Updated `src/types/database.ts` for any persisted shape change
- [ ] Migration included (or explicit reason why not)
- [ ] Migration is safe to re-run (guards / checks)
- [ ] Backfill strategy included for existing records
- [ ] DRE and dashboard services validated (`dreService.ts`, `dashboardService.ts`)
- [ ] Spreadsheet mappings reviewed if relevant (`dreSpreadsheetService.ts`)
- [ ] Clear notes on units, nullability, and business meaning of new/changed fields
- [ ] Evidence of verification: before/after counts, sample records, totals

---

## Hand-off Notes (what to leave behind after completing work)

When finishing a DB-focused task, leave:
- A brief “data contract” summary:
  - fields added/changed, nullability, units, allowed values
- Migration run instructions (and environment prerequisites)
- Validation results:
  - counts, totals, impacted modules/pages
- Known risks:
  - partial migrations, legacy records, edge cases, required follow-up cleanup

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

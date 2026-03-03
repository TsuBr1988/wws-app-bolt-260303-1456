```skill
---
type: skill
name: Supabase Multi-Project Debugging
description: Diagnose and handle "split" schemas/data across multiple Supabase projects (multi-client resolution, table existence, RLS vs empty results)
skillSlug: supabase-multi-project
phases: [E, V]
generated: 2026-02-24
status: filled
scaffoldVersion: "2.0.0"
---

# Supabase Multi-Project Debugging (WWS)

## When to use
Use this skill when a screen/feature:
- Returns **HTTP 404** like `relation does not exist` / `Could not find the table` for a table that “should exist”.
- Returns **HTTP 200 []** (empty list) in an environment where data is known to exist.
- Works in one module (e.g. Comercial Privado) but fails in another (e.g. Orçamentos), suggesting **different Supabase projects**.
- Has legacy tables (`system_config`, `config_*`, `budget_*`) that may exist only in one project.

## Core principle
In this repo, data is distributed across **multiple Supabase projects** and clients are chosen by module.
A "bug" can be: wrong client, missing schema in that project, or RLS blocking reads.

## What to check (fast checklist)
1. **Which module/page is failing?** (Publico vs Privado vs Finanças vs Orçamentos)
2. **Which Supabase client is being used?**
   - Prefer `getDatabase('<MODULE>')` via `src/lib/databaseResolver.ts`.
   - Watch for feature-specific clients (e.g. `Orçamentos/src/lib/supabase.ts`).
3. **Does the table exist in that project?**
   - Quick probe: `from('<table>').select('id').limit(1)`.
   - If error indicates "relation does not exist", the schema is missing in that project.
4. **If the table exists but returns empty:**
   - Confirm if the data is truly absent vs **RLS** denial.
   - Check if the UI is authenticated (session present) and if the policy is environment-specific.
5. **If schema/data are split:**
   - Reads may need **multi-source detection**.
   - Writes must be **consistent** (same source) or **blocked** with a clear UI message.

## Recommended diagnostic procedure
### A) Identify the active client(s)
- Search for `getDatabase(` and confirm the module argument.
- Search for local `createClient(...)` or `supabase.ts` under the feature.

### B) Probe existence and row counts
Use a minimal select. Prefer `select('id', { count: 'exact', head: true })` when available.

Heuristics:
- **404 "relation does not exist"** ⇒ table is not present in that project.
- **200 []** ⇒ either no rows, filters exclude rows, or RLS blocks rows.

### C) REST probe template (no secrets)
When you need to validate outside the app, use Supabase PostgREST:

- URL pattern: `https://<project-ref>.supabase.co/rest/v1/<table>?select=id&limit=1`
- Headers:
  - `apikey: <ANON_KEY>`
  - `Authorization: Bearer <ANON_KEY>` (or a user JWT if testing session-based RLS)

Compare results across the candidate projects.

## Handling strategy (for legacy/split features)
1. **Prefer a dedicated environment pair** when available (example pattern):
   - `VITE_BUDGETS_SUPABASE_URL`
   - `VITE_BUDGETS_SUPABASE_ANON_KEY`
2. **If dedicated env is missing, fall back intentionally** to the project that actually contains the legacy schema.
3. **Multi-source reads:**
   - Probe both sources.
   - Choose the one that:
     - has compatible schema (key legacy tables exist), and
     - has more data.
4. **Guardrails:**
   - If the chosen source is incompatible, disable actions that depend on missing tables.
   - Show a clear banner describing the selected source and why.

## Output expectations (what you must write down)
When you finish debugging, record:
- Which client(s) were queried.
- Which tables exist in which project.
- Whether the issue was schema-missing vs RLS vs truly-empty.
- The chosen source-selection rule (if any) and user-facing messaging.


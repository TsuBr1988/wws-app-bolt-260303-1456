# Project Overview (WWS Hub)

WWS Hub is a web-based internal hub that consolidates multiple business “modules” into a single portal—commercial (public and private), finance, quality, TI (IT tickets), culture, dashboards, and related operational features. The goal is to centralize workflows, provide shared UI patterns, and expose common services/utilities so teams can ship features consistently across modules.

This repository is primarily a **TypeScript + React (TSX)** frontend, with **Supabase** used for data access and backend automation via **Edge Functions**.

---

## What this repo contains

### Primary business areas (high level)
- **Commercial (Public)**: pipeline/proposals, tasks, challenges, commissions, notifications, contracts, rankings, and more  
  Code center: `src/components/Comercialpublico2/`
- **Commercial (Private)**: proposals, marketing, KPIs, actions/tasks, commissions, dashboards  
  Code center: `src/components/Comercialprivado2/`
  - Includes a dedicated **Budgets/Orçamentos** sub-application  
    Code center: `src/components/Comercialprivado2/src/components/Orçamentos/src/`
- **Finance (Finanças)**: contract sheets, contract analysis, KPI dashboards, files, delinquency, simulations, settings, DRE import/processing  
  Code center: `src/modules/financas/`
- **Quality (Qualidade)**: quality-focused workflows and data types  
  Code center: `src/modules/qualidade/`
- **IT / Ticketing (TI)**: chamados (tickets), constants/types, related UI  
  Code center: `src/modules/ti/`
- **Shared hub features**: dashboards, auth, charts, culture, contracts, layouts, indicators, UI primitives  
  Code center: `src/components/` and `src/pages/`

---

## Repository structure

At a glance:

- `src/` — Main application source (React + TypeScript)
  - `src/pages/` — Route-level pages (screen entry points)
  - `src/components/` — Shared UI + feature areas (also hosts large module trees like `Comercialpublico2/` and `Comercialprivado2/`)
  - `src/modules/` — Business modules organized by domain (`financas`, `qualidade`, `ti`)
  - `src/services/` — Shared service layer (domain logic, integrations, data access)
  - `src/lib/` — Shared utilities/helpers used across modules
  - `src/types/` — Shared typing and database-facing models
- `supabase/` — Supabase configuration + Edge Functions (`supabase/functions/*`)
- `docs/` — Project documentation (this file and related docs)
- `public/` — Static assets (if present)

---

## Architectural conventions (practical)

This codebase commonly follows a layered organization:

- **Components**: UI and screens  
  Examples:
  - `src/components/ui/` (primitives like buttons/toasts)
  - `src/modules/financas/components/Features/...` (finance feature UIs)
  - `src/components/Comercialpublico2/src/components/...` (public commercial UIs)

- **Services**: data access + business logic (often module-specific)  
  Examples:
  - `src/services/` (shared services)
  - `src/modules/financas/services/` (finance services)
  - `src/components/Comercialpublico2/src/services/` (commercial public services)
  - `src/components/Comercialprivado2/src/services/` (commercial private services)

- **Utils / Lib**: reusable helpers (formatting, dates, domain calculations)  
  Examples:
  - `src/lib/contractUtils.ts` (contract calculations and formatting)
  - module `utils.ts` files for feature-specific helpers

- **Types**: domain and database shapes  
  Examples:
  - `src/types/database.ts` (broad set of typed table row interfaces)
  - module-specific `types.ts` files

For more on layering and boundaries, see: [architecture.md](./architecture.md).

---

## Key entry points (“start here”)

These files are commonly useful when orienting yourself:

### Route-level pages
- `src/pages/AtasAcoesPage.tsx` — a frequently imported routing-level page

### Module app shells
These are module-level entrypoints composed into the overall UI:
- `src/components/Comercialpublico2/src/App.tsx`
- `src/components/Comercialprivado2/src/App.tsx`
- `src/modules/qualidade/App.tsx`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/App.tsx` (budgets sub-app)

### Supabase Edge Functions (backend automation)
- `supabase/functions/importar-dre/index.ts` — DRE spreadsheet import/processing
- `src/components/Comercialpublico2/supabase/functions/notificar_proxima_acao/index.ts` — notification automation for “next action”

---

## Representative exports you’ll see often

This repository has **hundreds of exports** (components, hooks, services, types, helpers). A few that are referenced frequently:

### Services
- **AI chat integration**
  - `AIChatService` — `src/services/aiChatService.ts`
- **Dashboards**
  - `DashboardService` — `src/services/dashboardService.ts`
- **Finance / DRE**
  - `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
  - `buscarDREPorContrato`, `listarContratosDRE` — `src/services/dreService.ts`

### Shared utilities
- `cn` (className utility) — `src/lib/utils.ts`
- Contract helpers — `src/lib/contractUtils.ts`
- Month/date helpers — `src/lib/months.ts`

### Auth / identity
- `useAuth` and related types — `src/hooks/useAuth.ts`

If you need the full exported symbol list with file/line references, use: [`codebase-map.json`](./codebase-map.json).

---

## How to navigate the codebase by goal

### “I want to add a UI feature”
1. Find the owning module or area:
   - Finance: `src/modules/financas/...`
   - Commercial Public: `src/components/Comercialpublico2/...`
   - Commercial Private: `src/components/Comercialprivado2/...`
2. Locate the module’s entry `App.tsx` and trace routing/menu composition.
3. Prefer:
   - shared primitives in `src/components/ui/`
   - module-specific components in that module’s `components/` folder

### “I want to change data access / business logic”
1. Find the relevant `services/` folder:
   - shared: `src/services/`
   - module-specific: `src/modules/<module>/services/`, `src/components/<module>/src/services/`
2. Check for shared types in `src/types/` or module `types.ts`.
3. If the behavior is tied to imports/automation, inspect `supabase/functions/*`.

---

## Technology stack summary

- **Frontend**: React + TypeScript (TSX)
- **Backend / data layer**: Supabase (client usage + Edge Functions)
- **Pattern**: modular architecture with shared UI primitives and service abstractions

Tooling/scripts are defined by the repository configuration (see `package.json` and root configs). For developer workflow details:
- [development-workflow.md](./development-workflow.md)
- [tooling.md](./tooling.md)

---

## Getting started (developer checklist)

1. **Install prerequisites**
   - Node.js (LTS recommended)
   - Use the package manager specified/compatible with the repo (see `package.json`)
   - Obtain required environment variables (Supabase URL/keys, etc.)

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run locally**
   ```bash
   npm run dev
   ```

4. **Validate core flows**
   - Navigate to key areas (dashboards, commercial modules, finance)
   - Confirm authentication/login behavior for your environment

5. **(Optional) Work with Supabase Edge Functions**
   - Review `supabase/functions/*`
   - Use the repo’s Supabase workflow described in [tooling.md](./tooling.md)

---

## Related documentation

- [architecture.md](./architecture.md) — conventions, layering, boundaries
- [development-workflow.md](./development-workflow.md) — day-to-day dev loop
- [tooling.md](./tooling.md) — scripts, tooling, environment notes
- [codebase-map.json](./codebase-map.json) — symbol index, dependency map, analysis output

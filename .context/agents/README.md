# Feature Developer Agent Playbook — `wws-hub`

> Implement new features end-to-end (UI + services + types) while matching the repository’s existing patterns (service layer, modular components, shared UI utilities, typed domain models).

---

## 1) Mission & Scope

### What you own
- Building **new user-facing features** and **enhancing existing flows**.
- Implementing/adjusting:
  - **Service-layer orchestration** (data fetching, business logic, calculations).
  - **UI components/pages** (feature screens, feature widgets, dialogs, tables).
  - **Typed models** and shared utilities (types, hooks, constants).
  - **Error and UX handling** (toasts, error boundaries, empty states).

### What you should not do by default
- Large-scale refactors, architecture rewrites, or style overhauls unless explicitly requested.
- Renaming broad public APIs without a migration plan.
- Introducing new libraries/frameworks without alignment.

---

## 2) Codebase Map: Where to Work

This repo is organized by **services**, **components**, and **domain modules** (notably “Comercialpublico2”, “Comercialprivado2”, and “financas”).

### A) Core services (business logic / orchestration)
Focus here when the feature needs new data, transformations, exports, or integrations.

**Primary directories**
- `src/services/`
- `src/modules/financas/services/`
- `src/components/Comercialpublico2/src/services/`
- `src/components/Comercialprivado2/src/services/`
- `src/components/Comercialprivado2/src/components/Orçamentos/src/services/`

**Key existing services**
- `src/services/dreSpreadsheetService.ts` — `DRESpreadsheetService` (spreadsheet-related DRE operations)
- `src/services/dreService.ts` — `buscarDREPorContrato`, `listarContratosDRE`, plus `DRELinha` types
- `src/services/dashboardService.ts` — `DashboardService` (dashboard aggregation)
- `src/services/aiChatService.ts` — `AIChatService`, `ChatMessage` (AI chat / messages)
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts` — `MonthlyGoal` and goals logic
- `src/components/Comercialpublico2/src/services/configurationService.ts` — `MonthlyGoal`, `CommissionTier` configuration

### B) UI components & pages
Focus here when the feature is user-facing.

**Primary directories**
- `src/pages/` — app-level pages
- `src/components/` — shared and feature components
- `src/components/ui/` — shared UI primitives and utilities
- `src/modules/financas/pages/` and `src/modules/financas/components/Features/**`
- `src/components/Comercialpublico2/src/components/**`
- `src/components/Comercialprivado2/src/components/**`

**Notable UI infrastructure**
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx` — `ErrorBoundary` for resilient UI
- `src/components/ui/use-toast.ts` — toast state/dispatch utilities (use for success/error feedback)

### C) Types, hooks, utilities
Use these for consistent domain modeling and shared behavior.

**Primary locations**
- `src/components/Comercialpublico2/src/types/` (e.g., `notificacao.ts`, `contracts.ts`, `index.ts`)
- `src/components/Comercialprivado2/src/types/`
- `src/components/Comercialpublico2/src/hooks/` (e.g., `useNotificacoesDashboard.ts`)
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts` (commission rules/types)
- `src/components/Comercialprivado2/src/utils/commissionUtils.ts`

**Database typing**
- `src/components/Comercialpublico2/src/lib/database.types.ts` — DB type definitions (likely Supabase-derived)

### D) “Controller-like” handlers
When implementing OCR/task endpoints or “API modules” used by UI.

**Key files**
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts` — `runOcr`, `detectTemplate`, `parseConexoes`, etc.
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts` — `Task`, `TaskCounts`, `TaskFormData`

---

## 3) Default Development Workflow (Feature Lifecycle)

### Step 0 — Clarify the feature contract
Before coding, pin down:
- **User story** and acceptance criteria
- **Target module**: `Comercialpublico2` vs `Comercialprivado2` vs `financas` vs global
- **Data source**: existing service? DB types? new API?
- **Permissions/roles** (if relevant): who can see/do what
- **Success UX**: toasts, redirects, new widgets, downloads, etc.

Deliverable: a short checklist of acceptance criteria + impacted files/areas.

---

### Step 1 — Identify the right “home” for the feature
Use these heuristics:

**If it’s a finance feature** (DRE, KPIs, statements, simulations, etc.)
- UI: `src/modules/financas/components/Features/<feature>/...`
- Services: `src/modules/financas/services/...` (or `src/services/*` if shared)

**If it’s Public Commercial (Comercialpublico2)**
- UI: `src/components/Comercialpublico2/src/components/...`
- Services: `src/components/Comercialpublico2/src/services/...`
- Types: `src/components/Comercialpublico2/src/types/...`

**If it’s Private Commercial (Comercialprivado2)**
- UI: `src/components/Comercialprivado2/src/components/...`
- Services: `src/components/Comercialprivado2/src/services/...`
- Utilities: `src/components/Comercialprivado2/src/utils/...`

**If it’s cross-cutting**
- Prefer `src/services/` for service logic and `src/components/ui/` or `src/components/` for shared UI.

---

### Step 2 — Model the domain (types first)
Add or extend types where they already live:

- Notifications: `src/components/Comercialpublico2/src/types/notificacao.ts`
  - `SituacaoNotificacao`, `Notificacao`, `NotificacaoFormData`
- Commercial domain types: `src/components/Comercialpublico2/src/types/index.ts`
  - `Employee`, `Campaign`, `Reward`, `Recognition`, `DashboardStats`, etc.
- DB-backed types: consider `database.types.ts` as source-of-truth if you’re mapping DB results.

Rules:
- Prefer **explicit exported types** for feature payloads and form data.
- Add “FormData” types for UI forms (pattern exists: `NotificacaoFormData`, `TaskFormData`).

---

### Step 3 — Implement service-layer changes (business logic)
Most features should route logic through services rather than embedding in components.

**When to add a service function/class**
- Aggregations (dashboard stats, DRE summaries)
- Complex calculations (commission tiers, goals)
- Orchestration across multiple queries/data sources
- Export (spreadsheets, CSV, etc.)
- AI/chat processing

**How to align with existing patterns**
- Follow the “service layer encapsulation” pattern (observed across `DRESpreadsheetService`, `DashboardService`, `AIChatService`).
- Keep UI components focused on:
  - calling the service
  - rendering
  - local UI state (loading/error)
  - user interactions

**Recommended conventions**
- Name clearly (`<Domain>Service` or `<verb><Domain>`).
- Export only what is needed by UI.
- Return typed data structures (use exported types).

---

### Step 4 — Build UI components/pages (feature shell → inner components)
Structure UI as:
- A **feature container** (page/tab) that:
  - calls service/hook
  - handles loading/error/empty states
  - passes typed props down
- Smaller components for:
  - tables/cards
  - dialogs/forms
  - filters
  - charts

**Error handling**
- Use `ErrorBoundary` where a feature can fail without taking down the full app:
  - `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`

**User feedback**
- Use toast utilities:
  - `src/components/ui/use-toast.ts`
- Toast on: create/update/delete success, recoverable failures, and “export completed”.

---

### Step 5 — Add hooks when state becomes reusable
If multiple components need the same data & state (loading/errors/refetch), prefer a hook:
- Example pattern exists: `src/components/Comercialpublico2/src/hooks/useNotificacoesDashboard.ts`

Guidelines:
- Hook should return `{ data, isLoading, error, refetch }` (or similar).
- Keep network/business logic in services; hooks orchestrate lifecycle and caching/refetch decisions.

---

### Step 6 — Validate: edge cases, permissions, and regression checks
Checklist:
- Loading state visible and non-blocking where possible
- Empty states (no rows, no notifications, no DRE for contract)
- Error states:
  - show toast for user-action errors
  - optionally fallback UI via `ErrorBoundary`
- Confirm feature works in the correct module context (public vs private commercial vs finance)

---

## 4) Common Feature Workflows (Concrete Recipes)

### A) Add a new dashboard widget (stats card / chart)
1. Identify which dashboard:
   - global dashboard (likely `src/services/dashboardService.ts`)
   - Comercialpublico2 dashboard components under `src/components/Comercialpublico2/src/components/Dashboard/...`
   - Comercialprivado2 dashboard under `src/components/Comercialprivado2/src/components/Dashboard/...`
2. Extend the stats type:
   - For Comercialpublico2: `DashboardStats` in `src/components/Comercialpublico2/src/types/index.ts`
3. Add/extend a service method:
   - `DashboardService` to compute or fetch the new metric
4. Update the UI component:
   - render new card/chart
   - show skeleton/loading, and fallback if missing data
5. Add toast only if user action triggers the computation/export; dashboards typically don’t toast on load.

---

### B) Add a new form-based CRUD feature (create/update)
1. Create/extend `FormData` type:
   - Follow patterns like `NotificacaoFormData` or `TaskFormData`
2. Add a service method:
   - `createX`, `updateX`, `deleteX`, `listX`
3. Build UI:
   - form component (controlled inputs)
   - submit handler calls service
   - on success: toast + close dialog + refresh list
   - on error: toast with actionable message
4. Add list/table view:
   - filters/search if expected data size is large
5. Ensure type-safe mapping between service return and UI props.

---

### C) Add/modify commission or goal logic
1. Locate domain utilities/services:
   - `src/components/Comercialpublico2/src/utils/commissionUtils.ts`
   - `src/components/Comercialprivado2/src/utils/commissionUtils.ts`
   - `configurationService.ts` (commission tiers / configs)
   - `monthlyGoalsService.ts`
2. Add types if needed (`CommissionTier`, `MonthlyGoal`)
3. Implement logic in utility/service, not directly in UI
4. Update affected screens:
   - Commissions / Goals / Rankings components in the relevant module tree
5. Validate with realistic boundary cases:
   - tier thresholds, rounding, missing configuration, zero totals

---

### D) Implement a finance (DRE) enhancement
1. Identify whether the change is:
   - spreadsheet export/import → `DRESpreadsheetService` (`src/services/dreSpreadsheetService.ts`)
   - contract DRE retrieval/listing → `src/services/dreService.ts` (`buscarDREPorContrato`, `listarContratosDRE`, `DRELinha`)
2. Add/extend types (`DRELinha`, other data structures)
3. Ensure UI renders categories/lines robustly:
   - handle missing categories
   - show proper totals
4. If exporting:
   - provide user feedback via toast (“download started/completed”)
   - ensure file naming is consistent and deterministic

---

### E) Add an OCR-driven workflow (Private Commercial)
1. Check existing OCR handlers:
   - `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
   - functions: `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
2. Add a new parser function if needed:
   - keep it pure (input → structured output)
   - return typed results
3. Wire into UI:
   - upload/select document
   - call `runOcr` / parser
   - preview parsed data before saving
4. Provide error handling for:
   - unknown template
   - partial extraction
   - invalid fields (show which fields need manual fill)

---

## 5) Repository Best Practices (Derived from Existing Code)

### Service-layer first
- Prefer adding logic to service classes/functions:
  - `DashboardService`, `AIChatService`, `DRESpreadsheetService`
- UI should orchestrate and render, not compute complex business rules.

### Type everything that crosses boundaries
- Service inputs/outputs should use exported types.
- Create `FormData` types for forms (pattern already present).

### Use shared UI patterns for resiliency and feedback
- Wrap risky feature surfaces with:
  - `ErrorBoundary` (`src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`)
- Use toasts for user actions:
  - `src/components/ui/use-toast.ts`

### Keep module boundaries clean
- Commercial Public/Private components and services live within their module directories.
- Avoid importing Public module types into Private module features unless explicitly shared.

### Prefer hooks for reusable data lifecycle
- Use hooks for data fetching + lifecycle (example: `useNotificacoesDashboard.ts`).
- Keep hooks thin; business logic belongs in services.

---

## 6) Key Files & What They’re For (Quick Reference)

### Core services
- `src/services/dreService.ts`
  - DRE domain retrieval/listing; exports `DRELinha`, `buscarDREPorContrato`, `listarContratosDRE`
- `src/services/dreSpreadsheetService.ts`
  - Spreadsheet-related DRE handling; `DRESpreadsheetService`
- `src/services/dashboardService.ts`
  - Dashboard aggregation; `DashboardService`
- `src/services/aiChatService.ts`
  - AI chat orchestration; `AIChatService`, `ChatMessage`

### Comercialpublico2
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts`
  - Goals operations and `MonthlyGoal` model
- `src/components/Comercialpublico2/src/services/configurationService.ts`
  - Configuration including commission tiers
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts`
  - Commission calculations and `CommissionTier` typing
- `src/components/Comercialpublico2/src/types/notificacao.ts`
  - Notifications domain types
- `src/components/Comercialpublico2/src/types/index.ts`
  - Main domain types (employees, campaigns, rewards, stats, etc.)
- `src/components/Comercialpublico2/src/hooks/useNotificacoesDashboard.ts`
  - Dashboard notifications hook pattern
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - UI error containment

### Comercialprivado2
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - OCR pipeline + parsing functions
- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`
  - Task API/types: `Task`, `TaskCounts`, `TaskFormData`
- `src/components/Comercialprivado2/src/services/*`
  - KPI, marketing, meeting minutes, prospection services

### Shared UI
- `src/components/ui/use-toast.ts`
  - Toast state management and usage patterns

---

## 7) Feature Delivery Checklist (Definition of Done)

### Functional
- Meets acceptance criteria with correct module placement (financas / public / private / shared)
- Works with realistic data volumes and missing-data scenarios
- No unhandled promise rejections; errors surfaced via toast or boundary

### Code quality
- Logic placed in appropriate service/util (minimal duplication)
- Types added/updated in correct `types/` file
- Components are composable, readable, and not overly stateful

### UX
- Loading + empty + error states implemented
- User actions provide feedback (toast) and keep UI consistent (refresh/reload data)

### Safety
- Does not break existing exports used elsewhere (avoid renaming exported symbols without migration)
- Avoids cross-module coupling unless explicitly intended

---

## 8) Working Agreements for the Agent (Operational Guidelines)

- **Always start by locating the closest existing feature** in the same module and mimic its structure.
- **Prefer incremental PRs**: types → service → UI → polish.
- **When unsure about placement**, default to:
  - domain logic → service in the module
  - shared UI primitives → `src/components/ui`
  - shared business logic used by both public/private → `src/services` (or a deliberately shared `src/components/...` utility if that’s the established convention)

---

## 9) Suggested “Feature Implementation Template” (Copy/Paste)

Use this as a consistent execution plan per feature:

1. **Spec**
   - User story:
   - Acceptance criteria:
   - Module: (financas / Comercialpublico2 / Comercialprivado2 / shared)
2. **Types**
   - Add/modify: `.../types/...`
3. **Service**
   - Add/modify: `.../services/...`
   - Exports:
4. **Hook (optional)**
   - Add/modify: `.../hooks/...`
5. **UI**
   - Add/modify: `.../components/...` or `.../pages/...`
   - States: loading / empty / error
6. **Feedback & resilience**
   - Toast usage (`src/components/ui/use-toast.ts`)
   - ErrorBoundary usage (`ErrorBoundary.tsx`)
7. **Regression scan**
   - Confirm impacted screens still compile and render
   - Validate edge cases

---

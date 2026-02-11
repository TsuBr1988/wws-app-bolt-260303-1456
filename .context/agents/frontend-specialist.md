# Frontend Specialist Agent Playbook (wws-hub)

## Mission

Deliver reliable, consistent UI/UX across the app by implementing and refining React/TypeScript screens and reusable components, integrating with existing service-layer APIs, and maintaining shared UI patterns (toasts, error boundaries, utilities). Engage this agent whenever changes affect:

- User-facing components, layouts, navigation, or styling
- Form and table behavior, dashboards, charts, and interactions
- Frontend ↔ service integration (fetching, state, errors, loading, notifications)
- UI consistency across “Comercialpublico2”, “Comercialprivado2”, and shared modules

---

## Responsibilities

1. **Implement features in React/TSX**
   - Create/modify pages, views, and reusable components.
   - Maintain consistency with existing UI components in `src/components/ui`.

2. **Integrate UI with service layer**
   - Use existing service classes/functions instead of embedding business logic in components.
   - Handle loading, empty, and error states consistently.

3. **Enforce UI patterns & resilience**
   - Use `ErrorBoundary` where needed for complex screens.
   - Use toast notifications via `src/components/ui/use-toast.ts`.

4. **Type-safe UI**
   - Use shared types from `src/components/**/src/types` and `src/lib/*`.
   - Avoid `any`; extend types near the domain module that owns them.

5. **Cross-module consistency**
   - Ensure similar behaviors and visuals between `Comercialpublico2` and `Comercialprivado2` when implementing parallel features (e.g., commissions, goals, tasks).

---

## Repository Starting Points (Where to Work)

### Shared / cross-app UI and helpers
- `src/components/ui/` — shared UI primitives and hooks (notably toasts).
- `src/components/` — common app-level feature areas (dashboard, chat, charts, layout, auth, etc.).
- `src/lib/` — shared utilities and domain helpers (notably `cn`, month helpers, contract helpers).

### “Comercialpublico2” app area
- `src/components/Comercialpublico2/src/components/` — primary UI screens (Dashboard, Settings, Contracts, etc.).
- `src/components/Comercialpublico2/src/services/` — feature services (monthly goals, configuration).
- `src/components/Comercialpublico2/src/types/` — domain types (notifications, employees, contracts, etc.).
- `src/components/Comercialpublico2/src/hooks/` — UI hooks (e.g., dashboard notifications).

### “Comercialprivado2” app area
- `src/components/Comercialprivado2/src/components/` — primary UI screens (Dashboard, Proposals, Settings, etc.).
- `src/components/Comercialprivado2/src/services/` — feature services (prospection KPI, marketing, etc.).
- `src/components/Comercialprivado2/src/types/` — domain types.

### Finance module UI
- `src/modules/financas/pages/` and `src/modules/financas/components/Features/` — finance UI features (dashboard, kpis, files, contract analysis, etc.).
- `src/modules/financas/` and `src/lib/` — shared finance utilities and helpers.

---

## Key Files (What they do and when to use them)

### Error handling & UX feedback
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - Use to protect complex routes/widgets from taking down the whole UI.
  - Wrap high-risk trees (dashboards, charts, heavy tables).

- `src/components/ui/use-toast.ts`
  - Central toast state/store and API.
  - Use for success/error notifications after user actions (save, delete, submit, sync).

### Shared utilities
- `src/lib/utils.ts` (`cn`)
  - Use for conditional className composition; prefer this over manual string concat.

- `src/lib/months.ts`
  - Standard month formatting and ranges (`getLast12Months`, `formatMonthLabel`, etc.).
  - Use in dashboards/KPI time series to avoid inconsistent date labels.

- `src/lib/contractUtils.ts`
  - Shared contract shapes/utilities (`Contract`, `ContractAddendum`).
  - Prefer these types/helpers for contract UI where applicable.

### Domain types (UI contracts)
- `src/components/Comercialpublico2/src/types/index.ts`
  - Primary types for public commercial domain (Employee, Campaign, Reward, DashboardStats, etc.).

- `src/components/Comercialpublico2/src/types/notificacao.ts`
  - Notification types and form data (`Notificacao`, `NotificacaoFormData`, `SituacaoNotificacao`).

- `src/components/Comercialpublico2/src/types/contracts.ts`
  - Contract types including addendums.

- `src/components/Comercialprivado2/src/types/index.ts`, `src/components/Comercialprivado2/src/types/prospection.ts`
  - Private commercial domain types (prospection/KPI-related).

### Service layer entry points (frontend integrations)
- `src/services/aiChatService.ts` (`AIChatService`, `ChatMessage`)
  - Chat UI integration; ensure streaming/async handling is user-friendly.

- `src/services/dashboardService.ts` (`DashboardService`)
  - Shared dashboards; build UI that tolerates partial/slow data.

- `src/services/dreService.ts` (`buscarDREPorContrato`, `listarContratosDRE`, etc.)
  - Finance/DRE UI; ensure correct empty/error rendering.

- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts`
  - Goals UI integration; consistent form validation + optimistic updates where safe.

- `src/components/Comercialpublico2/src/services/configurationService.ts`
  - Configuration-driven UI: tiers, goals, weekly metrics.

- `src/components/Comercialprivado2/src/services/*`
  - KPI, marketing, meeting minutes, costs, configuration.
  - UI should remain thin; call services and render results.

---

## Architecture Context (Frontend-relevant layers)

### Components (UI)
- Distributed across:
  - `src/components/**`
  - `src/components/Comercialpublico2/src/components/**`
  - `src/components/Comercialprivado2/src/components/**`
  - `src/modules/financas/**`
- Expect to find parallel implementations between `Comercialpublico2` and `Comercialprivado2`.
- **Rule**: keep “smart” logic minimal in components; delegate to hooks and services.

### Services (business logic orchestration)
- Central: `src/services/*`
- Domain-specific: `src/components/Comercialpublico2/src/services/*`, `src/components/Comercialprivado2/src/services/*`, `src/modules/financas/services/*`
- **Rule**: UI calls services; services return typed results; UI handles presentation + UX states.

### Utils / Lib
- `src/lib/*` plus per-module `lib`/`utils` directories.
- **Rule**: if you need formatting, month ranges, classnames, or shared mapping logic—look here first.

---

## Key Symbols for This Agent (Use/extend these rather than reinventing)

### UI resilience & notifications
- `ErrorBoundary` — `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
- `State` (toast store) — `src/components/ui/use-toast.ts`

### Shared helpers
- `cn` — `src/lib/utils.ts`
- Month helpers — `src/lib/months.ts` (`getLast12Months`, `formatMonthLabel`, etc.)

### Important domain types
- Notifications — `Notificacao`, `NotificacaoFormData`, `SituacaoNotificacao`
- Public commercial — `Employee`, `Campaign`, `Reward`, `Recognition`, `DashboardStats`, `ProbabilityScores`, etc.
- Contracts — `Contract`, `ContractAddendum`, `ContractWithAddendums`

### Services frequently used by UI
- `AIChatService`, `DashboardService`
- DRE: `buscarDREPorContrato`, `listarContratosDRE`
- Public commercial config/goals: `configurationService`, `monthlyGoalsService`
- Private commercial: `prospectionKPIService`, `marketingService`, `meetingMinutesService`, `costsService`

---

## Standard Workflows (Actionable step-by-step)

### 1) Add or change a screen (page/view)
1. **Locate the owning module**
   - Public commercial: `src/components/Comercialpublico2/src/components/...`
   - Private commercial: `src/components/Comercialprivado2/src/components/...`
   - Finance: `src/modules/financas/components/Features/...` or `pages/`

2. **Confirm data source**
   - Find the closest service in the same module (`src/components/**/src/services/`) before adding new API calls.
   - If none exists, add a service function/class in the appropriate `services/` folder.

3. **Create/adjust UI component**
   - Keep UI presentational; isolate data fetching in hooks when reused.
   - Add loading, empty, and error states.

4. **Add UX feedback**
   - Use `use-toast` for success/failure of user actions.
   - Wrap risky UI sections in `ErrorBoundary` when failures shouldn’t break the page.

5. **Type everything**
   - Reuse types from the module’s `types/` or from `src/lib/*`.
   - If adding fields, update the domain types in that module (not in the component).

---

### 2) Integrate a form (create/update flows)
1. **Define form shape**
   - Prefer existing `*FormData` types (e.g., `NotificacaoFormData`).
   - If missing, add a dedicated form type in the module’s `types/`.

2. **Validation & submission**
   - Validate client-side with clear inline errors.
   - On submit: call the relevant service and handle:
     - Disable button + show loading
     - Success toast + UI refresh
     - Error toast + preserve user input

3. **Post-submit refresh strategy**
   - If the screen is list-based, refetch via a hook/service call.
   - Consider optimistic update only if rollback is straightforward.

---

### 3) Add a new reusable UI component
1. **Check existing primitives**
   - Search in `src/components/ui/` and shared `src/components/`.
2. **Decide placement**
   - App-wide reusable: `src/components/ui/` or `src/components/`.
   - Domain-specific reusable: `src/components/Comercialpublico2/src/components/common/` (or similar), or the equivalent in `Comercialprivado2`.
3. **Expose minimal API**
   - Props should be typed; avoid leaking service details into the component API.
4. **Styling consistency**
   - Use `cn` for class composition and follow existing CSS/Tailwind patterns used in nearby files.

---

### 4) Implement dashboards / charts / KPIs
1. **Use existing time helpers**
   - Use `src/lib/months.ts` for month labels and ranges.
2. **Defensive rendering**
   - Handle missing data gracefully (partial responses, empty series).
3. **Performance considerations**
   - Memoize derived series and heavy computations.
   - Avoid re-render loops from inline object/array creation in props.

---

### 5) Add notifications / user feedback
1. **Toasts**
   - Use `src/components/ui/use-toast.ts` for:
     - “Saved successfully”
     - “Failed to load”
     - “Action completed”
2. **Error boundaries**
   - Wrap complex UI subtrees with `ErrorBoundary` rather than letting a render exception blank the page.

---

## Best Practices (Derived from this codebase structure)

### Keep business logic in services
- This repo already uses service classes/functions (e.g., `DashboardService`, `AIChatService`, DRE services, module configuration services).
- **UI components should not** embed orchestration or mapping logic that belongs in services/utilities.

### Prefer module-local types and utilities
- Public vs Private commercial areas have their own `types/`, `services/`, `utils/`.
- Extend types where they live to avoid cross-module coupling.

### Standardize time-series formatting
- Use `src/lib/months.ts` helpers to prevent inconsistent month keys/labels across dashboards.

### Use shared utilities for classnames and formatting
- Use `cn` for conditional classes (avoids mismatched patterns across files).

### Resilience and user trust
- Add loading states and error states everywhere data is fetched.
- Use toasts consistently; don’t silently fail.

---

## Quality Bar (Definition of Done for frontend work)

- UI compiles and is type-safe (no `any` introduced without strong reason).
- Loading/empty/error states are implemented and visually acceptable.
- User actions provide feedback (toast or inline messages).
- No service logic duplicated inside components.
- Changes are localized to the correct module (`Comercialpublico2`, `Comercialprivado2`, `financas`, or shared).
- High-risk trees wrapped in `ErrorBoundary` where appropriate.

---

## Collaboration Checklist (Use on every task)

- [ ] Identify target module and confirm you’re editing the right “app area” (public/private/financas/shared).
- [ ] Locate existing service(s) for the feature; reuse before creating new.
- [ ] Confirm or define TypeScript types in the module’s `types/` directory.
- [ ] Implement UI with explicit loading/empty/error states.
- [ ] Add toasts for mutations and meaningful failures.
- [ ] Validate that behavior matches parallel module patterns when applicable (public vs private).
- [ ] Update/extend shared utilities only when truly cross-cutting.
- [ ] Leave brief hand-off notes in PR description: what changed, what to test, and known limitations.

---

## Documentation Touchpoints

If present in the repository, prefer these in order (add them if missing):
- `README.md` — project setup and run commands.
- `AGENTS.md` — agent coordination and conventions.
- Any module-specific docs under `src/components/Comercialpublico2/` or `src/components/Comercialprivado2/`.

---

## Hand-off Notes Template (paste into PR)

- **Scope**: (screens/components touched)
- **Services used/updated**: (files in `services/`)
- **Types added/updated**: (files in `types/`)
- **UX states**: loading / empty / error covered? (yes/no)
- **Toasts**: success/error cases (list)
- **Risk areas**: (edge cases, partial data, permissions)
- **Manual test checklist**:
  - Navigate to …
  - Create/update/delete …
  - Validate dashboard numbers/labels …
  - Verify errors show toast and UI remains stable …

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

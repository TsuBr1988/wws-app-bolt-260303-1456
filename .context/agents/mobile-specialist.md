# Mobile Specialist Agent Playbook (wws-hub)

## Mission

Deliver a **mobile-ready experience** for the WWS Hub by ensuring key user journeys work reliably on small screens, touch input, variable network conditions, and mobile browsers (PWA-like constraints). This agent focuses on:

- Mobile usability (layout, navigation, touch targets, keyboard behavior)
- Performance on mobile devices (bundle weight, re-render hotspots, charts/tables)
- Offline/poor-network resilience where feasible (loading states, retries, optimistic UX)
- Mobile-specific bugs (viewport, scroll locking, modals, toasts, form UX)

This repository appears to be a **web app** (React/TS) with large feature areas (Comercial Público/Privado, Finanças). “Mobile specialist” here means **mobile web specialist**, not native iOS/Android—unless a separate mobile app exists (none detected in provided context).

Engage this agent when:
- A feature must be “mobile-first” or breaks on phones/tablets
- A dashboard/table/chart needs a mobile variant
- There are touch/scroll/keyboard issues
- Performance is poor on mid/low-end devices
- You’re creating reusable mobile-friendly UI patterns (responsive table, bottom sheet, etc.)

---

## Responsibilities

1. **Mobile UX audits & fixes**
   - Ensure pages in `src/pages` and feature components under `src/components/**` render correctly from ~360px width upwards.
   - Improve navigation ergonomics for mobile (compact headers, collapsible sidebars, accessible menus).

2. **Mobile performance tuning**
   - Identify expensive components (charts, large tables, heavy dashboards).
   - Reduce unnecessary renders; propose memoization boundaries; split code where appropriate.

3. **Responsive component patterns**
   - Provide reusable patterns for:
     - Responsive tables (stacked rows/cards)
     - Filters/search panels (drawer)
     - Mobile-friendly modals (full-screen or bottom sheet behavior)
     - Pagination/infinite scroll patterns

4. **Form & interaction reliability**
   - Fix issues with mobile keyboard covering inputs, focus trapping, scroll-to-field behavior.
   - Ensure touch targets meet accessibility size and spacing guidance.

5. **Error handling & feedback loops**
   - Ensure errors are surfaced in mobile-friendly ways (toasts, inline errors).
   - Leverage existing `ErrorBoundary` where appropriate for crash containment.

---

## Key Project Resources

- `src/components/ui/` — reusable UI primitives (toasts and other shared UI live here)
- `src/lib/utils.ts` — shared utilities (e.g., `cn` for className composition)
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx` — error boundary pattern used in the app
- `src/services/` — core services (e.g., `AIChatService`, dashboards, DRE)
- `src/modules/financas/` — finance module with pages/components that often contain dense tables/charts (high mobile risk)

---

## Repository Starting Points (mobile-relevant)

### 1) App UI & Layout
- `src/components/layout/` and `src/components/dashboard/`  
  Likely contains global layout patterns that impact mobile navigation (sidebars, headers).

### 2) Shared UI primitives
- `src/components/ui/`  
  Includes `use-toast.ts` and likely other shadcn-like primitives. Mobile improvements here benefit the whole app.

### 3) Feature-heavy “dense UI” areas (highest mobile risk)
- `src/modules/financas/components/Features/**`  
  Charts, tables, simulations, statements, contract analysis/sheets.
- `src/components/Comercialpublico2/src/components/**`
- `src/components/Comercialprivado2/src/components/**` (including `Orçamentos/`)

---

## Key Files (and why they matter for mobile)

- `src/lib/utils.ts`
  - Provides `cn` helper (className merging). Mobile work often involves conditional responsive classes; standardize with `cn`.
- `src/components/ui/use-toast.ts`
  - Toast behavior on mobile is critical (stacking, safe areas, click-to-dismiss, not blocking UI).
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - Use to prevent mobile users from hitting blank screens due to runtime errors; ensure fallback UI is mobile-friendly.
- `src/services/dashboardService.ts`
  - Dashboard data feeding heavy UI; coordinate loading states/skeletons for mobile perceived performance.
- `src/services/aiChatService.ts`
  - Chat UIs are especially sensitive on mobile (scroll anchoring, keyboard, input docking).
- `src/services/dreService.ts` and `src/services/dreSpreadsheetService.ts`
  - DRE and spreadsheet-like UIs are typically hard on mobile—expect to build condensed/mobile variants.

Feature-specific high value files:
- `src/components/Comercialpublico2/src/hooks/useNotificacoesDashboard.ts`
  - Notification panels on mobile should be concise and tappable with proper spacing.
- `src/components/Comercialpublico2/src/utils/commissionUtils.ts`
- `src/components/Comercialprivado2/src/utils/commissionUtils.ts`
  - Ensure calculations are reflected correctly in mobile UI; keep formatting consistent.

---

## Architecture Context (what to change, where)

### UI Components
- Primary directories:
  - `src/components/**`
  - `src/pages/**`
  - `src/modules/**/components/**`
- Mobile work typically happens here: responsive layouts, interactions, component refactors.

### Services (business logic)
- Primary directories:
  - `src/services`
  - `src/modules/financas/services`
  - `src/components/Comercialpublico2/src/services`
  - `src/components/Comercialprivado2/src/services`
- Keep mobile concerns **out** of services. Services provide data; UI adapts.

### Shared utils/types
- `src/lib/**`, `src/components/**/src/lib/**`, `src/components/**/src/utils/**`
- Ensure formatting helpers (dates/month labels, currency formatting, labels) work well in compact mobile contexts.

---

## Key Symbols for This Agent

Use these as anchors when improving mobile UX across the app:

- **UI resilience**
  - `ErrorBoundary` — `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
- **User feedback**
  - Toast state handling — `State` in `src/components/ui/use-toast.ts`
- **Core utilities**
  - `cn` — `src/lib/utils.ts`
  - Month helpers — `getLast12Months`, `formatMonthLabel`, `getMonthsInRange` in `src/lib/months.ts`
- **Service APIs that feed dense screens**
  - `DashboardService` — `src/services/dashboardService.ts`
  - `AIChatService`, `ChatMessage` — `src/services/aiChatService.ts`
  - `buscarDREPorContrato`, `listarContratosDRE` — `src/services/dreService.ts`

---

## Mobile Quality Bar (definition of “done”)

A change is considered mobile-ready when:

- Works at 360×640, 390×844, 768×1024 (portrait + tablet)
- No horizontal scrolling (unless explicitly intended for data tables with affordances)
- All primary actions have comfortable touch targets
- Modals/drawers are scrollable and don’t trap content behind the keyboard
- Loading and error states are visible without relying on hover
- Performance: no obvious jank when scrolling a dashboard/list on a mid-range device

---

## Common Workflows

### Workflow A — Mobile regression check for a page/feature
1. Identify the entry component:
   - `src/pages/**` or feature route container under `src/components/**` / `src/modules/**`
2. Map dense subcomponents:
   - tables, charts, filter bars, dialogs, action toolbars
3. Check responsive behavior:
   - Is the layout using a sidebar that collapses?
   - Do tables overflow? Are there responsive alternatives?
4. Verify interactions:
   - Tap targets, dropdowns, date pickers, multi-selects
   - Toasts/alerts readability
5. Validate error handling:
   - If service fails, does the UI show a mobile-friendly state?
   - Wrap unstable areas with `ErrorBoundary` where appropriate.
6. Add/adjust responsive styles using `cn` and existing patterns.
7. Document any new mobile pattern in the relevant component folder README (if present) or in the PR description.

**Deliverable:** PR that includes before/after screenshots for 1–2 mobile breakpoints.

---

### Workflow B — Convert a dense table into a mobile-friendly experience
Target areas: Finanças features, DRE, Contracts, Dashboards.

1. Locate the table component (likely under `src/modules/financas/components/Features/**` or `src/components/**/components/**`)
2. Decide a mobile strategy:
   - **Card/stacked rows** for <640px (recommended)
   - Horizontal scroll with sticky first column (only if required)
   - Progressive disclosure (tap row to expand details)
3. Implement with minimal API changes:
   - Keep data fetching/services unchanged (e.g., `listarContratosDRE`, dashboard services)
4. Preserve sorting/filtering:
   - On mobile, move filter controls into a drawer/panel above list
5. Add empty/loading states:
   - Skeletons sized for cards
6. Ensure accessibility:
   - Card headings, labels, and focus order

**Deliverable:** A responsive component that switches between table (desktop) and cards (mobile) without duplicating business logic.

---

### Workflow C — Mobile-friendly modals & forms (keyboard-safe)
1. Identify modal/dialog usage in the feature area.
2. Ensure the modal:
   - Has internal scroll (content scrolls, header/footer pinned if needed)
   - Doesn’t rely on hover tooltips for critical info
3. Fix keyboard overlap:
   - Ensure focused input scrolls into view (container uses `overflow-auto`)
   - Avoid fixed-position footers that cover inputs without spacing
4. Validate validation UX:
   - Inline errors visible without scrolling too far
   - Submit button reachable
5. Use toasts (`use-toast`) for transient feedback; inline messages for actionable errors.

**Deliverable:** Form flow usable one-handed on mobile; no “can’t click submit” issues.

---

### Workflow D — Mobile performance pass on dashboards/charts
1. Identify heavy screens:
   - Dashboards under `src/components/**/Dashboard` and `src/modules/financas/components/Features/dashboard`
2. Check data shaping:
   - Services (e.g., `DashboardService`) should return ready-to-render structures when possible.
3. Reduce re-render hotspots:
   - Memoize expensive chart props
   - Avoid creating new arrays/objects in render loops
4. Progressive rendering:
   - Render top summary first, lazy render heavy sections
5. Ensure loading skeletons:
   - Avoid layout shift on mobile.

**Deliverable:** Smoother scroll + faster first meaningful paint on mobile.

---

### Workflow E — Mobile chat experience hardening (AI chat)
Target: `src/services/aiChatService.ts` consumers (chat UI likely under `src/components/chat/**`).

1. Ensure message list scroll behavior:
   - Anchor to bottom on new messages
   - Avoid jumping when images/markdown load
2. Keyboard-safe input:
   - Input stays visible above keyboard
   - Send button reachable
3. Network failure states:
   - Retry send, show pending state
4. Token/streaming UI (if applicable):
   - Throttle updates to avoid jank on mobile.

**Deliverable:** Chat usable on mobile without scroll/keyboard frustration.

---

## Best Practices (tailored to this repo)

1. **Keep business logic in services; keep mobile logic in UI**
   - Services like `DashboardService`, `AIChatService`, DRE services should not contain viewport/device branching.
   - Mobile adaptations belong in components/layout.

2. **Use shared utilities consistently**
   - Use `cn` (`src/lib/utils.ts`) for conditional classes and responsive variants.
   - Use month utilities (`src/lib/months.ts`) for compact labels (mobile needs shorter labels—prefer `formatMonthLabel` when available).

3. **Prefer resilient UI boundaries**
   - Wrap volatile feature blocks with `ErrorBoundary` rather than letting a single crash blank the page.
   - Ensure fallback content is readable on mobile (no giant stack traces, no overflow).

4. **Design for touch + no hover**
   - Replace hover-only affordances with explicit labels, icons + text, or tap-to-reveal.

5. **Avoid horizontal overflow by default**
   - If horizontal scrolling is unavoidable (e.g., spreadsheets), provide:
     - clear affordance (fade edge/“scroll” hint),
     - sticky key column,
     - condensed typography and truncation with tap-to-expand.

6. **Feedback must be non-blocking**
   - Toasts (`use-toast`) should not cover primary controls on small screens.
   - Prefer bottom-safe placement and avoid excessive stacking.

---

## “Where to Look” Cheatsheet (by feature)

- **Finanças (tables/charts heavy)**  
  `src/modules/financas/components/Features/**` + `src/modules/financas/pages/**`
- **Comercial Público (broad feature suite)**  
  `src/components/Comercialpublico2/src/components/**`
- **Comercial Privado (broad feature suite)**  
  `src/components/Comercialprivado2/src/components/**`  
  Budgets/Orçamentos: `src/components/Comercialprivado2/src/components/Orçamentos/**`
- **Global UI primitives**  
  `src/components/ui/**`, `src/lib/**`

---

## Documentation Touchpoints

If present in the repo, consult and update:
- `README.md` (root)
- `AGENTS.md`
- Any feature-level READMEs under `src/modules/**` or `src/components/**`

(If these docs don’t exist or are sparse, add brief “Mobile considerations” notes in the PR description and/or create a `docs/mobile.md` proposal.)

---

## Collaboration Checklist

- [ ] Confirm which “mobile” is required: mobile web vs PWA vs native wrapper, target devices, and must-support browsers.
- [ ] Identify the user journey(s) and the specific screens (paths/components) involved.
- [ ] List the top 3 mobile risks (tables, modals, charts, navigation, chat).
- [ ] Make changes in UI layers first; avoid touching services unless needed for performance or payload shaping.
- [ ] Add screenshots for at least two mobile breakpoints and one tablet breakpoint.
- [ ] Verify error/loading/empty states on mobile (including offline/poor network simulation if possible).
- [ ] Request review from a feature owner (Finanças / Comercial Público / Comercial Privado).
- [ ] Record any new responsive pattern (table→cards, filter drawer, bottom action bar) in a shared location (PR notes or docs).

---

## Hand-off Notes (what to leave behind after work)

Include in PR/hand-off:
- Screens/components touched (full paths)
- Before/after screenshots (mobile)
- Any new shared component/pattern added (and where it lives)
- Known follow-ups (e.g., “needs virtualization for 1k+ rows”, “chart library still heavy on mobile”)
- Testing notes: devices/emulators used, any remaining edge cases (keyboard overlap, iOS Safari quirks)

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

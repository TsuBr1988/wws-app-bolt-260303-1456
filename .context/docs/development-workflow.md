# Development Workflow

This document defines a practical, team-friendly workflow for day-to-day development in this repository. The goal is to keep iteration fast while ensuring changes are safe across modules, reviewable, and deployable.

## Repository Overview (Why workflow matters here)

This codebase is a multi-module web application under `src/` with:

- **Shared layers**
  - `src/lib/**` — shared utilities and domain helpers (e.g., contract utilities)
  - `src/services/**` — shared service/data access logic
  - `src/types/**` — shared TypeScript types (including database-facing types)
- **Feature/module areas**
  - `src/modules/financas/**` — finance domain (DRE, contract sheets, etc.)
  - `src/modules/ti/**` — TI domain (chamados, etc.)
  - `src/modules/qualidade/**` — quality domain
  - `src/components/Comercialpublico2/**` and `src/components/Comercialprivado2/**` — large commercial feature sets

Because multiple modules can depend on the same shared code, changes to `src/lib/**`, `src/services/**`, and `src/types/**` are **high-impact** and should be approached with extra validation and clear PR communication.

---

## Daily Development Loop (Recommended)

### 1) Start from an issue/ticket
Before coding, make sure the work is well-defined:

- Problem statement and expected behavior
- Acceptance criteria (including edge cases)
- Any UI/DB/API implications
- If the change crosses module boundaries (e.g., `src/services/**` used by multiple modules), **call it out** in the ticket and later in the PR description.

### 2) Create a short-lived branch
Branch from the default branch (typically `main`) using conventions in **Branching & Releases**.

Guidelines:
- Keep scope narrow
- Prefer multiple small PRs over one large PR
- Avoid “mega-branches” that drift from `main`

### 3) Implement with module boundaries in mind
Place code where it naturally belongs:

- **UI**
  - Module UI: `src/modules/<module>/components/**`
  - Shared or global UI: `src/components/**` (including `src/components/ui/**`)
  - Commercial feature sets: `src/components/Comercialpublico2/**`, `src/components/Comercialprivado2/**`
- **Shared utilities**
  - Shared helpers: `src/lib/**`
  - Module helpers: e.g. `src/modules/financas/utils.ts`
- **Service/data access**
  - Shared services: `src/services/**`
  - Module-specific services: e.g. `src/modules/financas/services/**`
- **Types**
  - Shared types: `src/types/**`
  - Feature-local types: module/component `types.ts` or `types/**`

**Rule of thumb:** if more than one module will use it, prefer shared layers (`src/lib`, `src/services`, `src/types`). If it’s truly module-specific, keep it local.

### 4) Run locally and validate impacted flows
After implementation:

- Start the dev server and walk through the user flows you changed.
- For changes in shared code (`src/services/**`, `src/lib/**`, `src/types/**`), validate at least **one consumer in each impacted feature area**.

### 5) Add/adjust tests where practical
Follow: **[testing-strategy.md](./testing-strategy.md)**

- Bug fixes: add a regression test when feasible.
- If testing is not practical (e.g., heavy UI interaction or external dependency), document manual verification steps clearly in the PR.

### 6) Prepare the PR
A good PR description includes:

- **What** changed (summary)
- **Why** it changed (motivation / ticket link)
- **How to test** (steps and/or commands)
- UI changes: screenshots or short recordings
- Callouts for:
  - Environment variables
  - DB changes/migrations
  - Supabase changes (tables/policies/functions)
  - Any risky rollout considerations

### 7) Respond to review and land cleanly
- Address review comments with follow-up commits
- Rebase/update if the branch diverged significantly (team preference)
- Squash/rebase if required by your team’s convention
- Ensure trunk (`main`) remains deployable

---

## Branching & Releases

### Branching model: Trunk-based development
- `main` is intended to be **deployable** at all times.
- Work happens in short-lived branches merged back quickly.

### Branch naming conventions (recommended)
- `feature/<short-description>` — new functionality
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — refactors/tooling/deps
- Optional ticket prefix:
  - `feature/ABC-123-short-description`

### Pull request size and lifetime
- Prefer PRs reviewable “in one sitting”
- Avoid long-lived branches
- If work is large:
  - split into staged PRs, or
  - merge behind a feature flag (if applicable in your setup)

### Release cadence
- Prefer continuous delivery: merge to trunk regularly and release frequently.
- If releases are batched (e.g., weekly), still merge continuously; cut releases from trunk.

### Tagging conventions (recommended)
- Semantic versioning: `vMAJOR.MINOR.PATCH` (e.g., `v1.4.2`)
- If module-scoped releases are required by deployment:
  - `financas/v1.2.0`, `ti/v0.8.1`

### Hotfixes
- Branch from the release tag or `main` (depending on incident process):
  - `fix/<...>`
- Keep the fix minimal; follow up with refactors/tests after stabilization.

---

## Local Development

> Commands may vary by project scripts—use what exists in `package.json` as the source of truth.

### Prerequisites (typical)
- Node.js (LTS recommended)
- npm (or the team-standard package manager)
- Required environment variables/secrets (team/internal source)
- Any backend dependencies (commonly Supabase)

### Install dependencies
```bash
npm install
```

### Run the dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build (if supported)
```bash
npm run preview
```

### Lint / format / typecheck
```bash
npm run lint
npm run format
npm run typecheck
```

### Run tests
See **[testing-strategy.md](./testing-strategy.md)** for authoritative guidance.
```bash
npm test
```

### Tooling notes
For standards around formatting, linting, editors, and CI expectations, see:
- **[tooling.md](./tooling.md)**

If you introduce or change tooling/scripts:
- update `tooling.md`
- explain the rationale in the PR

---

## Code Review Expectations

Code review exists to ensure correctness across modules, maintainability, and safe delivery. Reviewers should prioritize high-risk areas first (data access, permissions, critical business flows), then focus on readability and consistency.

### What every PR should include

#### Clear intent
- Explains *what* changed and *why*
- Includes verification steps
- Includes screenshots/recordings for UI changes

#### Scope control
- Keep PRs focused
- Avoid mixing unrelated cleanups unless trivial and low-risk

#### Correctness and safety
- Handle edge cases
- Verify loading/error/empty states
- Prefer shared utilities/services over duplicating logic across modules

#### Type safety and contracts
- Update or introduce proper types (shared: `src/types/**`, local: module/component `types`)
- Avoid widening types just to satisfy the compiler (e.g., `any`) unless justified

#### Testing
- Add/update tests per **[testing-strategy.md](./testing-strategy.md)**
- If no automated tests, include explicit manual test steps

#### Performance and UX
- Be mindful in dashboards and large lists
- Avoid unnecessary rerenders and repeated service calls

#### Security and data handling
- Don’t log secrets or sensitive user data
- Re-check authorization assumptions when changing access/role behavior

### Approvals and “domain owner” escalation
Follow team standard for approvals (commonly 1–2). Escalate to domain owners for:

- Cross-cutting shared changes:
  - `src/services/**`, `src/lib/**`, `src/types/**`
- Finance calculations and contract logic:
  - `src/modules/financas/**`
  - `src/lib/contractUtils.ts`
  - DRE-related services
- Auth/permissions:
  - `src/hooks/useAuth.ts`
  - access context / permission layers

### Agent collaboration (if applicable)
If using coding agents, align responsibilities and handoffs via `AGENTS.md`. Agent-assisted PRs must still meet the same standards:
- readable commits
- clear PR description
- reproducible verification steps

---

## Onboarding Tasks (Optional but recommended)

1. **Run the app locally**
   - Install deps and run `npm run dev`
   - Navigate the modules relevant to your role

2. **Learn the module layout**
   - Shared services: `src/services/**`
   - Shared utilities: `src/lib/**`
   - Finance: `src/modules/financas/**`
   - TI: `src/modules/ti/**`
   - Qualidade: `src/modules/qualidade/**`
   - Commercial: `src/components/Comercialpublico2/**`, `src/components/Comercialprivado2/**`

3. **Run lint/tests once**
   - Use **[testing-strategy.md](./testing-strategy.md)** and **[tooling.md](./tooling.md)** to resolve setup issues early.

4. **Start with “safe” issues**
   - UI tweaks, copy updates, small bug fixes, adding tests
   - Ask maintainers for starter tasks if your tracker doesn’t label them

---

## Related Resources

- **[testing-strategy.md](./testing-strategy.md)**
- **[tooling.md](./tooling.md)**

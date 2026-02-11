# Tooling & Productivity Guide

This guide centralizes the tooling, scripts, and editor/automation practices used in this repository so contributors can stay consistent and fast. It complements the day-to-day process described in **[development-workflow.md](./development-workflow.md)**.

At a high level, this is a **TypeScript + React** codebase with multiple feature areas:

- Modules: `src/modules/financas`, `src/modules/ti`, `src/modules/qualidade`
- Large component suites: `src/components/Comercialpublico2`, `src/components/Comercialprivado2`
- Supabase code (edge functions, etc.): `supabase/functions/*` (e.g. `supabase/functions/importar-dre`)

Productivity in this repo comes from:

- fast install/build cycles
- consistent formatting/linting
- reliable type-checking
- repeatable env setup for Supabase + local development
- optional automation (pre-commit hooks, watch modes) to reduce regressions

---

## Required tooling

Install the following tools before contributing. Versions below are **recommended minimums**; prefer the versions pinned in `package.json` / lockfiles if present.

### Git

- **Why:** source control, branching, code review workflow.
- **Install:**
  - Windows: https://git-scm.com/download/win
  - macOS: `brew install git`
  - Linux: use your distro package manager
- **Verify:**
  ```bash
  git --version
  ```

### Node.js (LTS) + npm

- **Why:** runs build/dev tooling and installs dependencies.
- **Recommended:** Node **18+** (or current LTS).
- **Install:** https://nodejs.org/en/download
  - If you switch Node versions often, use a version manager:
    - Windows: `nvm-windows`
    - macOS/Linux: `nvm`, `fnm`, or `asdf`
- **Verify:**
  ```bash
  node -v
  npm -v
  ```

### Install repo dependencies

- **Typical install:**
  ```bash
  npm install
  ```
- **Deterministic install (CI-like; requires lockfile):**
  ```bash
  npm ci
  ```

### Supabase CLI

Required if you run edge functions, migrations, or local Supabase.

- **Why:** this repo includes Supabase edge functions (for example `supabase/functions/importar-dre/index.ts`) and may rely on Supabase schema/types during development.
- **Install:** https://supabase.com/docs/guides/cli
- **Verify:**
  ```bash
  supabase --version
  ```

### Editor

- **VS Code recommended** for TypeScript language services, lint/format integration, and debugging.
- Install: https://code.visualstudio.com/

### (Optional) PowerShell 7 (Windows)

- **Why:** improved scripting compatibility and terminal experience.
- Install: https://learn.microsoft.com/powershell/

---

## Project scripts (npm)

List scripts available in your branch:

```bash
npm run
```

Common scripts you should expect (names may vary; use the closest equivalent in `package.json`):

### Dev server (watch mode)

```bash
npm run dev
```

Use for UI development with hot reload.

### Production build

```bash
npm run build
```

### Preview production build (if supported by the bundler)

```bash
npm run preview
```

### Type-check

```bash
npm run typecheck
```

If there is no dedicated script:

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

Common alternative:

```bash
npx prettier --write .
```

#### Recommended local routine

Before pushing, run at least:

```bash
npm run typecheck && npm run lint
```

This is especially important when working in highly reused areas like:

- `src/components/Comercialpublico2/**`
- `src/components/Comercialprivado2/**`
- shared helpers in `src/lib/**`
- module utilities like `src/modules/financas/utils.ts`

---

## Recommended automation

This section documents automation that keeps the codebase healthy. If some scripts/hooks are not present in your branch, treat these as a recommended baseline and align with what exists in `package.json`.

### Pre-commit hooks (recommended)

Typical setup:

- **husky** to install hooks
- **lint-staged** to run checks only on changed files

Recommended pre-commit behavior:

- format staged files (Prettier)
- lint staged TS/TSX (ESLint)
- optionally run a fast type-check (project-wide or scoped to affected packages)

Example `lint-staged` configuration:

```json
{
  "*.{ts,tsx,js,jsx,json,css,md}": ["prettier --write"],
  "*.{ts,tsx}": ["eslint --fix"]
}
```

If Husky is present, it’s commonly enabled via:

```bash
npm run prepare
```

> Tip: Keep pre-commit fast. Prefer `lint-staged` over running `npm run build` on every commit.

---

## Supabase workflows (local + functions)

Because the repo contains Supabase edge functions (for example `supabase/functions/importar-dre/index.ts`), these commands are commonly used:

### Start local Supabase

```bash
supabase start
```

### Stop local Supabase

```bash
supabase stop
```

### Serve edge functions locally (if used)

```bash
supabase functions serve
```

### Notes on schema/types

If the project generates TypeScript types from Supabase schemas (common in TS apps), ensure there is a documented workflow in your branch (often an npm script such as `supabase:types` or similar). After changing DB schema/migrations, regenerate types and commit them if the repo expects that.

Cross-reference relevant code:
- Supabase function example: `supabase/functions/importar-dre/index.ts`
- Shared DB types (widely referenced): `src/types/database.ts`

---

## “Fast feedback” command combos

Add these as shell aliases or npm scripts to reduce friction.

### Verify before push

```bash
npm run typecheck && npm run lint && npm run build
```

### Format everything

```bash
npm run format
```

---

## Keeping modules consistent

Given the repo’s modular structure, consistency matters across:

- shared utilities: `src/lib/**` and module `utils.ts` files (e.g. `src/modules/financas/utils.ts`)
- service layers: `src/services/**` plus module/service folders (e.g. `src/modules/financas/services/**`)
- shared UI primitives: `src/components/ui/**`

Recommended practice:

- When adding a new “service” in `src/services/*`, keep return types consistent and prefer explicit types for public methods.
- Avoid duplicating shared date/formatting logic across component suites unless necessary.
  - Example utilities exist in both suites (e.g. `src/components/Comercialpublico2/src/utils/**`), so prefer extracting to `src/lib/**` if the logic is truly shared.
- Watch for circular imports in deeply nested `utils/services/components` trees.

---

## IDE / Editor setup (VS Code)

### Recommended extensions

- **ESLint** (`dbaeumer.vscode-eslint`) — inline lint errors + autofix
- **Prettier** (`esbenp.prettier-vscode`) — consistent formatting
- **EditorConfig** (`EditorConfig.EditorConfig`) — consistent indentation/newlines (if `.editorconfig` exists)
- **TypeScript and JavaScript Language Features** (built-in) — navigation/refactors
- **GitLens** (optional) — blame/history insights in large shared components

### Recommended VS Code settings

Add to `.vscode/settings.json` (repo) or your user settings:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

### Useful VS Code tasks (optional)

If you maintain `.vscode/tasks.json`, define tasks for:

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `supabase start` / `supabase stop`

---

## Productivity tips

### Prefer symbol navigation and targeted search

This repository is large and contains repeated patterns across modules and component suites. Use:

- VS Code: **Go to Symbol in Workspace** to jump to exports (services/types)
- **Find all references** before refactoring widely used types (notably in `src/types/database.ts`)
- ripgrep-style searches for feature-specific logic:
  - `contract_sheets` (finance feature area)
  - `dreService` / DRE features (finance)
  - `importar-dre` (Supabase function)

### Shell aliases for routine checks

**bash/zsh**
```bash
alias nr="npm run"
alias check="npm run typecheck && npm run lint"
alias fix="npm run format && npm run lint -- --fix"
```

**PowerShell**
```powershell
Set-Alias nr "npm"
function check { npm run typecheck; if ($LASTEXITCODE -eq 0) { npm run lint } }
```

### Keep Supabase workflows repeatable

If you work on edge functions or DB-dependent features:

- keep a local `.env` (never commit secrets)
- prefer `supabase start` for a known-good baseline
- document required seed data and expected tables alongside the feature/module docs

### Refactor safely in shared component suites

`src/components/Comercialpublico2/**` and `src/components/Comercialprivado2/**` are large and reused:

- run **typecheck** after moving/renaming files
- avoid circular imports
- keep “public API” exports stable (types/services imported across modules)

---

## Related resources

- **[development-workflow.md](./development-workflow.md)**

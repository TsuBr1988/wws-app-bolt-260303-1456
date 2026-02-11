# WWS Hub — Documentation Hub (`docs/README.md`)

This folder contains the **living documentation** for the `wws-hub` repository. Use it as the entry point to understand how the system is organized, how to develop locally, and where the main domain modules live.

If you’re new to the codebase, start with **Project Overview**, then **Architecture Notes**, then **Development Workflow**.

---

## Quick links (recommended reading order)

### Core Guides

- **[Project Overview](./project-overview.md)**  
  What the product is, what’s inside this monorepo-like frontend, and the primary user-facing areas.

- **[Architecture Notes](./architecture.md)**  
  How the code is structured (modules/components/services/utils), major dependency directions, and conventions.

- **[Development Workflow](./development-workflow.md)**  
  Running locally, environment setup, common scripts, linting/formatting, and build notes.

- **[Testing Strategy](./testing-strategy.md)**  
  What to test, how tests are structured, and guidance for adding coverage safely.

- **[Glossary & Domain Concepts](./glossary.md)**  
  Domain vocabulary used across modules (Finanças / Comercial / TI / Qualidade, etc.), plus key entities.

- **[Data Flow & Integrations](./data-flow.md)**  
  How data moves through the app (client → services → Supabase/functions), plus integration touchpoints.

- **[Security & Compliance Notes](./security.md)**  
  Authentication/authorization model, handling secrets, and security-sensitive patterns.

- **[Tooling & Productivity Guide](./tooling.md)**  
  Useful repo scripts, IDE tips, debugging, and workflow accelerators.

---

## Repository orientation (what you’re looking at)

This repository is a TypeScript/Vite React application with multiple feature areas and “sub-apps” under `src/components` and `src/modules`. It also includes Supabase functions under `supabase/`.

### Top-level structure (high signal)

- `docs/` — The documentation you are reading now.
- `src/` — Application source (React components, modules, services, utilities, types).
- `supabase/` — Supabase functions and related backend tooling (serverless workflows).
- `public/` — Static assets.
- `server.mjs/` — Local/server runtime entry (used depending on deployment setup).
- `vite.config.ts`, `tsconfig*.json`, `tailwind.config.js`, `eslint.config.js` — Tooling and build configuration.

There are also multiple `.zip/` snapshots in the repo root—treat them as **artifacts** (not source of truth) unless your team’s workflow explicitly depends on them.

---

## Architectural map (how code is typically organized)

The codebase generally follows these layers (names reflect existing directories and patterns):

### 1) Config
Configuration lives across:
- `src/modules/ti`
- `src/modules/financas`
- and some root-level configuration files.

**Goal:** keep feature configuration close to the owning module.

### 2) Components
Most UI and feature pages are implemented as components under:
- `src/components/*`
- `src/pages/*`
- module-specific component trees, e.g.:
  - `src/modules/financas/components/Features/*`
  - `src/modules/qualidade/components/*`
  - `src/modules/ti/components/*`

Two major feature “suites” exist and are heavily used:
- `src/components/Comercialpublico2/...`
- `src/components/Comercialprivado2/...`

These include their own `services`, `types`, `lib`, `utils`, and sometimes `supabase/functions`.

### 3) Services
Service layers encapsulate data access and API/Supabase calls:
- `src/services/*`
- plus module/component-specific service trees:
  - `src/modules/financas/services/*`
  - `src/components/Comercialpublico2/src/services/*`
  - `src/components/Comercialprivado2/src/services/*`

**Dependency direction (typical):** UI Components → Services → (Supabase/API)  
Services may depend on types and utilities.

### 4) Utils / Lib
Shared helpers and domain utilities are found in:
- `src/lib/*`
- and feature-specific utility folders, e.g.:
  - `src/components/Comercialpublico2/src/utils/*`
  - `src/components/Comercialprivado2/src/utils/*`
  - `src/modules/financas/utils.ts`

### 5) Types
Strong typing is widely used. Core types can be found in:
- `src/types/*` (including database-related types)
- feature-specific types under each feature suite (Comercialpublico2/Comercialprivado2/modules)

---

## Where to find key domains

This repo implements multiple business domains. Common “jump points”:

### Finanças
- Types: `src/modules/financas/types.ts`
- Feature UI: `src/modules/financas/components/Features/*`
- Utilities: `src/modules/financas/utils.ts`
- Services: `src/modules/financas/services/*` and `src/services/*` (shared)

### Comercial (Público / Privado)
- Público: `src/components/Comercialpublico2/src/*`
- Privado: `src/components/Comercialprivado2/src/*`

Each has:
- `components/` (UI/pages)
- `services/` (data operations)
- `types/` (domain models)
- `utils/` + `lib/` (helpers)

### TI (Chamados)
- `src/modules/ti/*`  
Includes types/constants like chamados status, prioridade, etc.

### Qualidade
- `src/modules/qualidade/*`  
Includes types and app-level module structure.

---

## Supabase & backend functions

The repository includes serverless/edge-like function code under:

- `supabase/functions/*`

Example: DRE import logic exists under `supabase/functions/importar-dre/index.ts` and is referenced by finance-related flows.

When documenting or changing data flows, cross-check:
- front-end services in `src/services/*` / module services
- types in `src/types/*` and module types
- Supabase function implementations under `supabase/functions/*`

---

## Documentation conventions (how to extend this folder)

When adding new docs:

1. Prefer **task-oriented** documents (how to do X) rather than purely descriptive text.
2. Include:
   - “When to use”
   - “Where in the code”
   - “Example”
   - “Edge cases / gotchas”
3. Cross-link related documents in this folder.
4. Keep file names **kebab-case** (e.g., `data-flow.md`, `development-workflow.md`).

If you add a new guide, update this `docs/README.md` to include it in **Quick links**.

---

## Suggested starting paths (by role)

### New developer
1. [Project Overview](./project-overview.md)  
2. [Architecture Notes](./architecture.md)  
3. [Development Workflow](./development-workflow.md)  
4. [Tooling & Productivity Guide](./tooling.md)

### Working on Finanças
1. [Data Flow & Integrations](./data-flow.md)  
2. `src/modules/financas/components/Features/*`  
3. `src/modules/financas/types.ts` and `src/modules/financas/utils.ts`  
4. Supabase functions related to imports/exports under `supabase/functions/*`

### Working on Comercial (Público/Privado)
1. [Glossary & Domain Concepts](./glossary.md)  
2. `src/components/Comercialpublico2/src/*` or `src/components/Comercialprivado2/src/*`  
3. Feature-specific services and types under each suite

### Working on auth/security-sensitive code
1. [Security & Compliance Notes](./security.md)  
2. Auth hooks and client initialization under `src/hooks/*` and `src/lib/*` (plus suite-specific `lib/supabase.ts`)

---

## Related (outside `docs/`)

- Root README: `../README.md` (project-level quickstart; may be more concise than these guides)
- Source root: `../src/`
- Supabase functions: `../supabase/`

---

## Maintainership notes

This documentation is intended to evolve alongside the code. If you change:
- module boundaries,
- service entrypoints,
- Supabase functions and their contracts,
- key domain types,

…update the relevant guide(s) and ensure this index still points developers to the right place.

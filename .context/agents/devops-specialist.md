# DevOps Specialist Agent Playbook (wws-hub)

## Mission

Own the delivery, reliability, and operational readiness of **wws-hub** across environments (local → staging → production). This agent is engaged whenever changes impact:

- Build and release automation (CI/CD)
- Runtime configuration (env vars, secrets, feature flags)
- Hosting, networking, storage, database connectivity/migrations
- Observability (logs/metrics/traces), error reporting, SLOs
- Security posture (dependency scanning, secret management, access control)

The codebase is a TypeScript/React-style application with strong **service-layer patterns** (e.g., `src/services/*` and component-scoped services). The DevOps specialist ensures these patterns are buildable, testable, and deployable consistently.

---

## Responsibilities

### CI/CD & Release Engineering
- Design and maintain pipelines for:
  - install → lint → typecheck → test → build → deploy
  - preview deployments for PRs (if supported)
  - versioning and release notes (if used)
- Standardize artifact generation and caching (node_modules, build outputs).

### Environment & Configuration Management
- Define required environment variables and defaults (local vs CI vs prod).
- Ensure secrets are never committed; integrate a secret store (CI secrets, vault).
- Maintain `.env.example` / environment documentation and validation.

### Reliability & Production Readiness
- Ensure deploys are repeatable and rollbackable.
- Implement smoke tests and health checks.
- Define operational runbooks: incidents, rollback, database outages.

### Security & Compliance Basics
- Add dependency scanning and secret scanning to CI.
- Enforce least privilege for deployment credentials.
- Ensure `src/types/database.ts` and any generated database types remain consistent with migrations/DB schema.

### Observability
- Ensure runtime logs are structured and searchable.
- Track error boundaries (`ErrorBoundary.tsx`) and route errors to monitoring.
- Define dashboards/alerts for key endpoints and job-like services (e.g., spreadsheet/dashboard services).

---

## Repository Starting Points (What to focus on)

### 1) Application Source
- `src/` — core app code, services, types, and utilities.
- `src/services/` — central service layer (business logic) likely used by UI and API calls.
  - Examples: `dreSpreadsheetService.ts`, `dashboardService.ts`, `aiChatService.ts`

### 2) Domain Modules & Component Packages
- `src/modules/` — domain modules (e.g., `financas`, `ti`) with constants and config-like elements.
- `src/components/Comercialpublico2/src/` and `src/components/Comercialprivado2/src/`
  - Each contains its own `services/`, `utils/`, `types/` and can have build implications (path aliases, tsconfig references, bundling).

### 3) Types & DB Contract
- `src/types/database.ts` — strongly indicates a typed DB schema contract. Treat changes as breaking unless proven otherwise.

### 4) Error Handling Boundary
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`
  - Operationally relevant for capturing client-side runtime failures (integrate with monitoring).

> Note: CI/CD configuration files are not included in the provided context. Part of this agent’s job is to *discover or introduce* standard pipeline/config files (e.g., GitHub Actions, Dockerfile, infra manifests) in a repo-consistent way.

---

## Key Files and Their Purposes (Operational view)

### Service Layer (deployment-impacting)
- `src/services/dreSpreadsheetService.ts`  
  Likely interacts with spreadsheets/exports; may require credentials, API quotas, background processing considerations.
- `src/services/dashboardService.ts`  
  Aggregation logic; often performance-sensitive and may require caching.
- `src/services/aiChatService.ts`  
  External AI provider calls; requires API keys, rate-limit handling, and observability.

### DB & Schema Contracts
- `src/types/database.ts`  
  Central DB types; treat as the source of truth for compatibility checks between app and DB.

### Frontend Stability/Monitoring Hook
- `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`  
  Instrumentation target for frontend error reporting (Sentry, LogRocket, etc.).

### Configuration/Constants (env & runtime behavior)
- `src/modules/ti/chamadosConstants.ts`  
  Enumerations/constants; changes may affect migrations, seed data, and UI logic.

### Shared Utilities (build/test impact)
- `src/lib/utils.ts` (`cn`)  
  Shared helper; breaking changes can ripple broadly.
- `src/lib/months.ts`, `src/lib/contractUtils.ts`  
  Shared data utilities; ensure deterministic behavior across Node/browser in builds.

---

## Architecture Context (what DevOps should infer)

### Service Layer Pattern (high confidence)
- Services encapsulate business logic and likely call:
  - DB client / external APIs
  - internal utility functions
- DevOps must ensure:
  - env vars for external APIs are defined
  - network egress rules allow required calls
  - timeouts/retries/circuit breakers are standardized
  - logs are emitted with enough context (service + operation + correlation id)

### Modular component “sub-app” structure
- `Comercialpublico2` and `Comercialprivado2` have their own `services`, `types`, `utils`.
- DevOps concerns:
  - TypeScript path resolution/build performance
  - Duplicated configuration requirements across subtrees
  - Bundle size and build-time regressions

---

## Common Workflows (Step-by-step)

## 0) Hostinger deployment (runbook)
**Goal:** publish the Vite SPA reliably and avoid common 403/SPA routing pitfalls.

Use the repo runbook:
- `docs/DEPLOY_HOSTINGER.md`

Use the skill checklist:
- `.context/skills/hostinger-deploy/SKILL.md`

Quick rule of thumb for **403 Forbidden** (subdomains):
- Verify the subdomain **Document root** points to a folder that actually contains `index.html` + `assets/`.
- If `public_html/` has no `index.html` and directory listing is disabled, Hostinger will return **403**.
- If you see `ws://localhost:8081/` or `@vite/client` in page source, the server is likely not serving the built `dist/` output.

## 1) Bootstrap a CI pipeline (baseline)
**Goal:** every PR runs consistent checks and produces a build artifact.

1. **Discover existing tooling**
   - Look for: `package.json`, lockfile, `tsconfig.json`, `eslint`, `vitest/jest`, `next.config`, `vite.config`, etc.
2. **Define standard pipeline steps**
   - Install dependencies (with lockfile)
   - Lint
   - Typecheck
   - Unit tests
   - Build
3. **Add caching**
   - Cache package manager directories and build cache directories (framework-specific).
4. **Fail fast**
   - Lint/typecheck should fail the job quickly before build/deploy.
5. **Upload artifacts**
   - Store build outputs for deploy jobs (or rebuild in deploy job if required).
6. **Enforce PR gates**
   - Require pipeline checks to pass before merge.

**Deliverables**
- CI config file(s) (e.g., GitHub Actions workflow)
- Documented “CI contract” in repo docs: required scripts, required env vars for tests/build

---

## 2) Add environment variable governance
**Goal:** deployments never fail because of missing/incorrect env configuration.

1. **Inventory required env vars**
   - Search services for usage of env access patterns (e.g., `process.env.*`).
   - Prioritize:
     - AI provider keys (from `AIChatService`)
     - Spreadsheet integration credentials (from `DRESpreadsheetService`)
     - DB connection strings (implied by `database.ts` usage)
2. **Create/Update `.env.example`**
   - Include variable names, short description, and safe defaults where possible.
3. **Add validation**
   - Introduce a runtime env validation module (e.g., `zod`-based) and load early.
4. **Map env vars per environment**
   - Local: `.env`
   - CI: secrets store
   - Production: managed secrets/config
5. **Prevent leakage**
   - Ensure `.env` is gitignored
   - Add secret scanning pre-commit or CI job

**Deliverables**
- `.env.example`
- `docs/environment.md` (or similar)
- CI step that fails if required env vars are missing for build/test stages (where applicable)

---

## 3) Production deployment workflow (blueprint)
**Goal:** safe deploy with rollback plan.

1. **Build once**
   - Create immutable artifact (container image or build folder artifact).
2. **Run smoke tests**
   - Hit:
     - homepage/app shell
     - key API/service routes if present
     - a lightweight dashboard endpoint (if exists)
3. **Deploy with progressive exposure**
   - If supported: canary or phased rollout
4. **Monitor**
   - Track error rates (frontend `ErrorBoundary` signals + backend logs)
   - Track latency for dashboard aggregation calls
5. **Rollback**
   - Must be a single command/action (redeploy previous artifact)
6. **Post-deploy verification**
   - Confirm no new client error spikes
   - Confirm external API quotas not exceeded (AI/spreadsheet)

**Deliverables**
- Deployment runbook
- Rollback runbook
- Health check / smoke test script

---

## 4) Observability integration workflow
**Goal:** actionable signals for incidents.

1. **Logging**
   - Ensure server/runtime logs include:
     - timestamp, level, service name, operation name
     - request id / correlation id if applicable
2. **Frontend errors**
   - Instrument `ErrorBoundary.tsx` to:
     - report errors to monitoring
     - include route/module metadata (publico2 vs privado2)
3. **Service instrumentation**
   - Add timing metrics around:
     - dashboard aggregation
     - spreadsheet export calls
     - AI calls (token usage, latency, errors)
4. **Alerts**
   - Error rate alert (client + server)
   - Latency alert for dashboard endpoints
   - External provider failures (AI/spreadsheet)

**Deliverables**
- Monitoring configuration + docs
- Minimal dashboard with RED metrics (Rate, Errors, Duration)

---

## 5) Dependency and supply-chain hygiene
**Goal:** predictable builds and reduced security risk.

1. **Lockfile enforcement**
   - CI should fail if lockfile missing or out-of-date.
2. **Automated dependency scanning**
   - Run on PR and scheduled.
3. **SBOM (optional, recommended)**
   - Generate SBOM artifact for releases.
4. **License policy**
   - Flag forbidden licenses if required by org policy.

**Deliverables**
- CI jobs for security scanning
- Policy doc: allowed Node versions, package manager, update cadence

---

## Best Practices (tailored to this repo’s patterns)

### Respect the service layer boundaries
- Prefer adding timeouts/retries and logging *within* service classes (`src/services/*` and component-scoped `services/*`) rather than scattering operational concerns across UI components.

### Treat typed DB contracts as deployment gates
- Any change touching `src/types/database.ts` should trigger:
  - compatibility review
  - migration check (if migrations exist)
  - staging verification before production deploy

### Normalize configuration across component subtrees
- `Comercialpublico2` and `Comercialprivado2` duplicate patterns (`services`, `utils`, `types`).
- DevOps should:
  - avoid introducing divergent build steps per subtree unless necessary
  - centralize environment documentation so both subtrees share the same env contract

### Instrument error boundaries for operational visibility
- `ErrorBoundary.tsx` is the main catch-all for client errors; it should emit monitoring events with enough context to triage.

### Prefer deterministic utilities in CI
- Utilities like `months.ts` and contract helpers should behave the same in Node and browser.
- Ensure CI runs tests/typechecks in a Node version matching production.

---

## Key Symbols for This Agent (what to be aware of)

- `ErrorBoundary` — `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`  
  Hook for client-side error reporting.
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`  
  External integration risk (credentials, quotas, retries).
- `DashboardService` — `src/services/dashboardService.ts`  
  Performance/caching considerations; high operational importance.
- `AIChatService` — `src/services/aiChatService.ts`  
  Secret management, rate limiting, cost monitoring.
- `BscItem`, `FinancialContractMargin`, `FinancialStationResults` — `src/types/database.ts`  
  Strong signal of DB-driven features; changes imply DB schema compatibility concerns.
- `ChamadoTipo`, `ChamadoPrioridade`, `ChamadoStatus`, `ChamadoModulo`, `ChamadoEstimativa` — `src/modules/ti/chamadosConstants.ts`  
  Constant sets; changes may require coordinated deploy and data updates.

---

## Documentation Touchpoints (create/maintain)

If these do not exist, create them as part of DevOps enablement:

- `docs/environment.md` — required env vars, examples, where they are set in each environment
- `docs/deploy.md` — how deployments work, artifact format, manual steps (if any)
- `docs/observability.md` — logging conventions, error reporting, dashboards, alert thresholds
- `docs/runbooks/rollback.md` — exact rollback steps
- `docs/runbooks/incidents.md` — triage flow, contacts, escalation, known failure modes (AI API down, spreadsheet API quota, DB connectivity)

---

## Collaboration Checklist (use per PR / task)

- [ ] Confirm target environments (local/staging/prod) and hosting model before changing CI/CD
- [ ] Identify env vars affected (new/removed/renamed); update `.env.example` + `docs/environment.md`
- [ ] Verify service-layer integrations (`AIChatService`, spreadsheet/dashboard services) have timeouts and observable errors
- [ ] Ensure pipeline runs: lint + typecheck + tests + build (no “works on my machine”)
- [ ] Add/adjust smoke tests for the touched features
- [ ] Validate rollback path exists and is documented
- [ ] For any `src/types/database.ts`-related change: require schema/migration verification and staging test
- [ ] Capture decisions in docs (deploy/observability/runbooks) and link them in PR description

---

## Hand-off Notes (what to leave behind)

When finishing a DevOps task, leave:

- A short “Ops Summary” in the PR:
  - what changed (pipeline/env/deploy)
  - how to validate (commands + expected output)
  - rollback steps
- Updated docs (environment/deploy/observability) reflecting the new reality
- A list of follow-ups (e.g., add canary deploys, add dashboard latency alert, add env validation)

---

## Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

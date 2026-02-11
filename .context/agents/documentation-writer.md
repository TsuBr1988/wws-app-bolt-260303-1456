# Mission

Provide accurate, discoverable, and maintainable documentation for **wws-hub**, focusing on:
- Explaining **what the system does** (features and user flows) and **how it is built** (architecture, modules, services).
- Capturing **operational knowledge** (setup, configuration, troubleshooting, data fixes, scripts).
- Keeping docs synchronized with implementation in `src/**` and existing historical notes in `docs/**`.

Engage this agent when:
- A feature/service/module is added or changed.
- A workflow needs a runbook (e.g., financial reports/DRE, proposals/orçamentos printing, OCR parsing, AI chat).
- A bugfix involves scripts under `docs/legacy/**` or any production data procedure that must be recorded.
- Teams need onboarding, glossary, or cross-module architecture explanations.

---

# Responsibilities

- **Maintain documentation structure and navigation**
  - Keep a clear docs index (where to start, what’s current vs legacy).
  - Add cross-links between feature docs, services, and scripts.

- **Document business domains and key modules**
  - Finance (`src/modules/financas/**`), Quality (`src/modules/qualidade/**`), Commercial Public/Private components.
  - Explain entities/types and domain language in Portuguese where used in code (e.g., *DRE, Contrato, Orçamento, Metas*).

- **Document service-layer APIs and usage**
  - Capture purpose, inputs/outputs, side effects, and example usage for services like:
    - `DRESpreadsheetService` (`src/services/dreSpreadsheetService.ts`)
    - DRE operations (`src/services/dreService.ts`)
    - `DashboardService` (`src/services/dashboardService.ts`)
    - `AIChatService` (`src/services/aiChatService.ts`)

- **Create and maintain runbooks**
  - Data fixes and scripts (notably `docs/legacy/apply-fix-orcamentos.js`).
  - “How to reproduce / verify” steps and rollback considerations.

- **Document UI-support utilities & printing/OCR workflows**
  - Proposal printing utilities (`printProposalUtils.ts`) and resulting HTML expectations.
  - OCR handlers and templates (how templates are detected and parsed).

- **Review PRs for documentation completeness**
  - Identify doc gaps for new exports/types, changed flows, and breaking behavior.

---

# Repository Starting Points (what to focus on)

## 1) Core application and shared utilities
- `src/services/**` — central business logic/services used across the app.
- `src/lib/**` — shared helpers and core utilities (months, contracts, classnames helper).

## 2) Domain modules
- `src/modules/financas/**` — finance domain (reports, spreadsheets, contract sheets, etc.).
- `src/modules/qualidade/**` — quality domain types and documentation structures (`InformacaoDocumentada`).

## 3) Feature components (Commercial)
- `src/components/Comercialpublico2/src/**` — public commercial dashboards/goals/configuration.
- `src/components/Comercialprivado2/src/**` — private commercial flows including tasks, OCR parsing, and proposal/orçamentos.

## 4) Documentation and scripts
- `docs/**` — existing docs, including **legacy operational scripts** and historical notes.

---

# Key Files (and how to document them)

## Services (business logic)
- `src/services/dreSpreadsheetService.ts`
  - Document: what spreadsheet is generated, input data sources, output format, error modes, and expected consumers.
  - Include “verification steps” (how to validate a generated DRE spreadsheet).

- `src/services/dreService.ts`
  - Key exports: `DRELinha`, `buscarDREPorContrato`, `listarContratosDRE`.
  - Document: domain meaning of DRE lines, contract filtering, time periods, and any aggregation rules.

- `src/services/dashboardService.ts`
  - Document: metrics surfaced, data dependencies, and performance considerations.

- `src/services/aiChatService.ts`
  - Key exports: `ChatMessage`, `AIChatService`.
  - Document: message schema, conversation lifecycle, limitations, and where prompts/guardrails live (if present).

## Shared utilities (used broadly; frequently break docs when changed)
- `src/lib/utils.ts` — `cn` helper
  - Document: when to use it, typical pattern in components, and examples.

- `src/lib/months.ts` — month conversion/labels/ranges utilities
  - Document: canonical “month” representation (`MonthData`), formatting rules, and range semantics.

- `src/lib/contractUtils.ts` — `Contract`, `ContractAddendum`
  - Document: canonical contract shapes and addendum rules/assumptions.

- `src/lib/seedCategoriasDRE.ts`
  - Document: seeded DRE category taxonomy, intended usage, and how to update safely.

## Commercial Public (goals/config)
- `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts` — `MonthlyGoal`
- `src/components/Comercialpublico2/src/services/configurationService.ts` — `MonthlyGoal`, `CommissionTier`
  - Document: configuration model, tier semantics, and where configuration is edited/loaded.

## Commercial Private (OCR, tasks, proposals/orçamentos)
- `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
  - Key exports: `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`.
  - Document: template detection strategy, each parser’s expected input/output, failure behavior, and examples of extracted fields.

- `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`
  - Key exports: `Task`, `TaskCounts`, `TaskFormData`.
  - Document: task lifecycle, fields, and any API expectations.

- `src/components/Comercialprivado2/src/components/Orçamentos/src/utils/printProposalUtils.ts`
  - Key symbol: `createPrintDocument`
  - Document: printing pipeline (inputs → HTML → print), layout assumptions, and supported proposal sections.

## Legacy operational script (must be documented as runbook)
- `docs/legacy/apply-fix-orcamentos.js`
  - Key symbols: `executeSql`, `executeViaPgRest`, `main`.
  - Document: intent, preconditions, required credentials/config, dry-run strategy (if any), and rollback plan.

## Quality module types (docs-friendly structures)
- `src/modules/qualidade/types.ts`
  - Key export: `InformacaoDocumentada`
  - Document: how “documented information” is represented and where it is used.

---

# Architecture Context (what to explain in docs)

## Service Layer (primary orchestration)
**Where**: `src/services/**` and additional service folders under modules/components.  
**Doc focus**:
- Service responsibilities and boundaries.
- Inputs/outputs, side effects (I/O, remote calls), and error handling.
- How services are consumed (components, scripts, modules).

## Controllers/Handlers (feature-specific request/task handlers)
**Where**: particularly in `src/components/Comercialprivado2/src/utils/**` and `src/components/Comercialprivado2/src/components/Tasks/**`.  
**Doc focus**:
- Handler entry points and how data flows through parsing/detection.
- Examples (template → parsed fields).

## Utils/Lib (shared, cross-cutting)
**Where**: `src/lib/**`, component `src/lib/**`, and `src/**/utils/**`.  
**Doc focus**:
- Canonical data shapes (MonthData, Contract).
- Reusable formatting/transform logic.
- Avoid duplicating logic across docs; link to canonical definitions.

---

# Key Symbols for This Agent (document these first)

## Finance / DRE
- `DRESpreadsheetService` — `src/services/dreSpreadsheetService.ts`
- `DRELinha` — `src/services/dreService.ts`
- `buscarDREPorContrato` — `src/services/dreService.ts`
- `listarContratosDRE` — `src/services/dreService.ts`
- `seedCategoriasDRE` — `src/lib/seedCategoriasDRE.ts`

## Dashboards / AI
- `DashboardService` — `src/services/dashboardService.ts`
- `ChatMessage` — `src/services/aiChatService.ts`
- `AIChatService` — `src/services/aiChatService.ts`

## Commercial Public
- `MonthlyGoal` — `src/components/Comercialpublico2/src/services/monthlyGoalsService.ts`
- `CommissionTier` — `src/components/Comercialpublico2/src/services/configurationService.ts`

## Commercial Private
- `runOcr`, `detectTemplate`, `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields` — `src/components/Comercialprivado2/src/utils/ocrHandlers.ts`
- `Task`, `TaskCounts`, `TaskFormData` — `src/components/Comercialprivado2/src/components/Tasks/tasks.api.ts`
- `createPrintDocument` — `src/components/Comercialprivado2/src/components/Orçamentos/src/utils/printProposalUtils.ts`

## Quality
- `InformacaoDocumentada` — `src/modules/qualidade/types.ts`

---

# Documentation Touchpoints (where to write / extend docs)

- `docs/**`
  - Add/maintain: feature guides, runbooks, architecture notes, and changelogs.
- `docs/legacy/**`
  - Keep legacy scripts documented as **runbooks** with clear “still used?” status.
- Module-/feature-level docs (recommended to introduce/standardize if missing):
  - `src/modules/<domain>/README.md`
  - `src/components/<feature>/README.md`

If a docs index doesn’t exist yet, create:
- `docs/README.md` — “Start here” index with sections:
  - Architecture overview
  - Domain guides (Finanças, Comercial, Qualidade)
  - Runbooks (scripts, migrations, data fixes)
  - Legacy notes (what is deprecated, and why)

---

# Standard Doc Templates (copy/paste)

## 1) Service Documentation Template
Use for classes/functions in `src/services/**` and module/component services.

**File**: `docs/services/<service-name>.md`
- **Purpose**
- **Where used** (link to calling modules/components if known)
- **Exports / API**
  - Signature(s), types, expected inputs/outputs
- **Business rules**
- **Data sources** (DB, API, files; note if unknown)
- **Error handling**
- **Examples**
- **Testing / verification**
  - Manual checks and automated tests (if present)
- **Change notes**
  - Breaking changes & migration notes

## 2) Runbook Template (Operational / Scripts)
Use for anything under `docs/legacy/**` or one-off fixes.

**File**: `docs/runbooks/<topic>.md`
- **Goal**
- **Risk level** (low/medium/high) and impact scope
- **Preconditions**
  - Access, env vars, backups, maintenance window
- **Procedure**
  - Step-by-step commands and expected outputs
- **Validation**
  - How to confirm success
- **Rollback**
- **Post-incident notes**
  - Links to PRs/issues and lessons learned

## 3) Feature Guide Template (User + Dev)
Use for commercial dashboards/goals/tasks/OCR/proposals.

**File**: `docs/features/<feature>.md`
- **Overview**
- **User workflow**
- **Key data objects**
- **Implementation map**
  - Components, services, handlers
- **Edge cases**
- **FAQ / Troubleshooting**

---

# Workflows (step-by-step)

## Workflow A — Document a Service Change (e.g., DRE or Dashboard)
1. **Locate the service** under `src/services/**` (or component/module services).
2. **Identify exported API** (classes, functions, types). Record:
   - Parameters, return type, async behavior.
3. **Describe business intent** in domain terms:
   - For DRE: what lines mean, how contracts are selected, time period logic.
4. **Add examples**:
   - Minimal example call (pseudocode ok).
   - Example output structure.
5. **Update cross-links**:
   - Link from `docs/README.md` (or create it) to the new service doc.
6. **Add verification steps**:
   - How a developer validates correctness without deep context.
7. **Capture breaking changes**:
   - If signature/behavior changed, add a “Migration notes” section.

## Workflow B — Create a Runbook for `docs/legacy/apply-fix-orcamentos.js`
1. **Summarize intent**: what is being fixed and why.
2. **Explain execution modes**:
   - Direct SQL path (`executeSql`) vs PgREST (`executeViaPgRest`).
3. **List prerequisites**:
   - Database access, credentials, environment configuration, backup requirement.
4. **Provide safe execution steps**:
   - Recommend running against a staging DB first.
   - Add notes on idempotency and how to detect partial runs.
5. **Validation checklist**:
   - What queries/outputs confirm the fix.
6. **Rollback guidance**:
   - Backups, compensating updates, or restore procedure.
7. **Mark “legacy status”**:
   - Still in use? If unknown, label as “Use with caution / verify with owner”.

## Workflow C — Document OCR Parsing (Handlers + Templates)
1. **Map entry points**:
   - `runOcr` flow and how it reaches `detectTemplate`.
2. **Document templates**:
   - What templates exist (as inferred from `detectTemplate`).
3. **Document each parser**:
   - `parseConexoes`, `parsePerfil`, `parseMetas`, `pickWeeklyFields`
   - Input assumptions (OCR text structure), output fields, and failure modes.
4. **Add examples**:
   - Sample input snippet and resulting parsed object (sanitize real data).
5. **Troubleshooting**:
   - Common mis-detections, missing fields, formatting drift.

## Workflow D — Document Proposal/Orçamentos Printing
1. **Locate HTML generation**:
   - `createPrintDocument` in `printProposalUtils.ts`.
2. **Explain inputs**:
   - Proposal data structure (link to relevant types if available).
3. **Explain output**:
   - HTML sections, CSS assumptions, printing behavior.
4. **Add “layout contract”**:
   - What must not change without updating templates/tests.
5. **Verification**:
   - Steps to render and visually confirm print output.

## Workflow E — Add/Update Type Documentation (e.g., `InformacaoDocumentada`)
1. **Extract meaning** from type name + fields.
2. **Add domain explanation**:
   - What it represents in business terms.
3. **Link to usages**:
   - Note modules/features relying on the type.
4. **Add examples**:
   - Minimal JSON example.

---

# Best Practices (tailored to this repo)

- **Use domain language as in code**
  - Keep Portuguese terms (DRE, Orçamentos, Metas, Contratos) consistent with symbol names and UI.

- **Document “shape + semantics”**
  - For exported types (`DRELinha`, `MonthlyGoal`, `TaskFormData`, `Contract`), document:
    - Field meanings, units (currency? percentage?), and optionality semantics.

- **Prefer linking to canonical utilities**
  - For month/date concepts, reference `src/lib/months.ts` utilities rather than re-defining logic in docs.

- **Separate current docs from legacy**
  - Anything in `docs/legacy/**` should be clearly labeled and linked from a “Legacy” section with warnings.

- **Always include verification steps**
  - Especially for finance (DRE/spreadsheets) and printing (visual outputs).

- **Write for two audiences**
  - A short “What/Why” for product/domain understanding.
  - A concrete “How” for developers (APIs, files, examples).

- **Minimize drift**
  - When documenting exported APIs, mirror function/type names exactly and keep code links stable.

---

# Collaboration Checklist (use per PR / doc task)

- [ ] Confirm the **scope**: which module(s) changed (Finanças, Comercial Público, Comercial Privado, Qualidade).
- [ ] Identify affected **exports** (services/types/handlers) and list them in the doc update.
- [ ] Update or add docs in the right category:
  - [ ] Service doc
  - [ ] Feature guide
  - [ ] Runbook
  - [ ] Architecture note
- [ ] Add at least one of:
  - [ ] Example usage / payload
  - [ ] Validation steps
  - [ ] Troubleshooting section
- [ ] Cross-link from `docs/README.md` (or add an index entry where appropriate).
- [ ] Mark legacy/deprecated behavior explicitly if found.
- [ ] Request review from an owner of the domain (Finanças/Comercial/Qualidade) for semantic correctness.

---

# Hand-off Notes (what to leave behind after completing work)

- A clear doc trail that answers:
  1) What changed?
  2) Where in the repo is it implemented?
  3) How do we verify it works?
  4) How do we operate/fix it safely?
- Any uncertainties should be written as **open questions** in the doc (with pointers to files and suspected owners), rather than omitted.

---

# Related Resources

- [../docs/README.md](./../docs/README.md)
- [README.md](./README.md)
- [../../AGENTS.md](./../../AGENTS.md)

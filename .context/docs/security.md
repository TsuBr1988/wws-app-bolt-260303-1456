# Security

This document defines the baseline security practices for the WWS Hub application. The repository is a multi-module web app (`src/modules/*`) with large domain component bundles (`src/components/*`) and uses **Supabase** for authentication, database access (Postgres + RLS), storage, and **Edge Functions** (`supabase/functions/*`). Because the system processes business, financial, and HR-adjacent data, security controls must be enforced consistently across **frontend**, **database policies**, and **functions**.

Related: [architecture.md](./architecture.md)

---

## Security principles (non-negotiable guardrails)

### 1) Least privilege by design
- Grant the minimum permissions required at each layer:
  - **Supabase Auth** (identity)
  - **Postgres Row Level Security** (authorization)
  - **UI gating** (UX-only)
- Never ship admin/service-role capabilities to the browser.

### 2) Assume the client is untrusted
- Any user can:
  - call your APIs directly,
  - edit JS in the browser,
  - replay network requests.
- Therefore:
  - **All authorization must be enforced server-side** (RLS and/or Edge Functions).
  - Client-side “role checks” are **not** security controls; they only improve UX.

### 3) Secure-by-default data access
- Sensitive tables must have **RLS enabled** with explicit policies.
- Edge Functions must validate:
  - caller identity (JWT),
  - authorization for the operation,
  - input shape and limits,
  - and should **fail closed**.

### 4) Minimize data exposure
- Select only required columns; avoid broad `select('*')` on sensitive tables.
- Do not leak sensitive data in logs, client storage, or error payloads.

### 5) Defend against common web risks
- Enforce HTTPS-only deployments.
- Prevent XSS: avoid injecting unsanitized HTML (be cautious with any `dangerouslySetInnerHTML`).
- Prevent CSRF: prefer token/JWT-based auth (Supabase), avoid cookie-based custom sessions unless properly configured.
- Prevent injection: do not compose SQL from user input in Edge Functions; validate inputs strictly.

### 6) Operational hygiene
- Keep dependencies updated (frontend + functions).
- Separate dev/staging/prod credentials and environments.
- Restrict production Supabase dashboard access to authorized maintainers.

---

## Authentication & Authorization

### Identity and session model (Supabase Auth)
- Supabase issues a **session** with an **access token (JWT)** and user identity.
- The Supabase client attaches tokens automatically for:
  - database queries,
  - Edge Function calls (when invoked correctly).
- Treat JWTs as secrets:
  - never log them,
  - don’t copy them into custom storage mechanisms,
  - don’t expose them in client debug output.

### Where authorization must be enforced (in priority order)

#### 1) Database RLS (authoritative)
All sensitive business tables must:
- have **RLS enabled**,
- define **explicit** allow policies based on one of:
  - `auth.uid()` ownership,
  - membership tables (user↔company, user↔team),
  - role claims (only if standardized and carefully controlled).

**Multi-tenant boundary**
- If the app supports multiple companies (see `Company` in `src/modules/financas/types.ts`), enforce tenant boundaries:
  - each row includes `company_id` (or equivalent),
  - policies restrict access to rows where the user belongs to that company.

#### 2) Edge Functions (authoritative for privileged operations)
Edge Functions under `supabase/functions/*` (e.g. finance imports like `supabase/functions/importar-dre`) must:
- authenticate the caller (JWT must be present),
- authorize the operation (e.g., only finance admins can import DRE data),
- validate input shape, size, and content,
- record audit metadata where practical (who/when/what).

Even if the UI “hides” a button, the function must still enforce permissions.

#### 3) UI gating (non-authoritative)
Frontend permission checks (e.g., `PermissionLevel` in `src/hooks/useAuth.ts`) are for:
- navigation control,
- reducing user error,
- improving UX.

They are not a security boundary.

---

## Roles & permissions

The codebase uses an application-level permission concept (`PermissionLevel` in `src/hooks/useAuth.ts`). To keep behavior consistent across modules, define and maintain a clear mapping between:

- **App roles** (examples—formalize what applies):
  - `admin` (system-wide settings, user management)
  - `manager` (team/company scoped access)
  - `finance` / `finance_admin` (DRE, statements, contract sheets)
  - `commercial_public` / `commercial_private` (module access segregation)
  - `read_only` (report/audit access)

- **Enforcement strategy (recommended)**
  - Prefer normalized membership/role tables + RLS policies (auditable and flexible).
  - If using custom JWT claims for roles:
    - ensure a controlled issuance path,
    - avoid making the client the source of truth.

---

## Supabase key management (critical)

### Anon key vs service-role key
- Frontend must use **only** the **anon (public) key**.
- The **service-role key**:
  - must never be committed,
  - must never appear in frontend bundles,
  - should be limited to server-side contexts only (CI, controlled backend jobs, or very restricted functions if unavoidable).

### Storage buckets (if used)
- Private by default.
- Use signed URLs only when needed, with short expirations.
- Apply access policies aligned with tenant boundaries.

---

## Secrets & sensitive data handling

### Data classification (minimum baseline)
Use these categories to decide what may be logged, cached, exported, or shared:

- **Public**: static UI assets, non-sensitive help text.
- **Internal**: non-sensitive operational metadata.
- **Confidential (default for business data)**:
  - financial data (DRE lines, margins, statements),
  - contracts and addendums,
  - proposals, commissions, performance metrics,
  - employee records / HR metrics.
- **Restricted (highest sensitivity)**:
  - JWTs / refresh tokens,
  - API keys and third-party credentials,
  - government IDs, bank details, legally protected attributes (if present).

Rule: when in doubt, treat as **Confidential**.

### Where secrets must live
- **Local development**: `.env` not committed; use dev Supabase project credentials.
- **CI/CD**: secret manager (GitHub/GitLab/host provider). Ensure build logs don’t print env vars.
- **Supabase Edge Functions**: configure function secrets via Supabase environment settings; do not hardcode secrets in `supabase/functions/*`.

### Rotation expectations
- Rotate **service-role key** immediately if exposure is suspected.
- Rotate third-party API keys at least every **90 days** (or per policy).
- Rotate any additional database credentials at least every **90 days** and upon access changes.

---

## Encryption and transport

### In transit
- TLS (HTTPS) only.
- Edge Function calls must include Authorization.

### At rest
- Rely on platform encryption at rest as baseline, but do not treat it as authorization.
- Enforce access via RLS/policies and bucket rules.

---

## Logging & telemetry (sanitize by default)

### Do not log
- access/refresh tokens,
- full request/response payloads containing PII or financial values,
- uploaded spreadsheets or parsed spreadsheet contents,
- secrets, credentials, or keys.

### Edge Functions: what to log instead
- request/correlation id,
- operation outcome (success/failure),
- sanitized validation errors (no raw rows/PII).

### Client error reporting
The codebase includes error-boundary patterns (e.g., `ErrorBoundary` in `src/components/Comercialpublico2/src/components/common/ErrorBoundary.tsx`). If integrating crash reporting:
- keep payloads minimal,
- strip sensitive context (user data, tokens, financial rows).

---

## File imports and high-risk operations (finance DRE import)

The finance spreadsheet import pipeline (`supabase/functions/importar-dre`) should be treated as **high risk** because it can introduce/modify financial data at scale.

Minimum controls:
- Validate content type, schema, and expected worksheets/columns.
- Enforce file size limits and timeouts.
- Sanitize strings before storage.
- Reject unexpected columns/worksheets (fail closed).
- Apply strong authorization (finance admin only).
- Maintain an audit trail (actor `auth.uid()`, time, affected entities).

---

## Compliance & governance baseline

### Privacy and data protection
Depending on deployment region and data subjects, comply with LGPD/GDPR principles:
- purpose limitation,
- minimization,
- access control,
- retention and deletion procedures.

Evidence to maintain:
- data inventory (tables/buckets + classification),
- periodic RLS policy reviews,
- production access reviews (Supabase dashboard users/roles).

### Auditability
For high-impact actions (imports, deletes, permission changes):
- store actor (`auth.uid()`), timestamp, operation, affected identifiers,
- prefer append-only logs where feasible.

---

## Incident response (developer playbook)

### Immediate actions (suspected incident)
1. **Contain**
   - rotate exposed keys,
   - revoke sessions where needed,
   - restrict access paths (temporarily disable functions/features if required).
2. **Assess scope**
   - affected environment(s) (dev/staging/prod),
   - impacted datasets and time window,
   - potential exfiltration paths.
3. **Preserve evidence**
   - export relevant logs and audit records before destructive changes.

### Detection & triage
- Review Supabase Auth and function logs for:
  - repeated failures,
  - abnormal request volumes,
  - unexpected callers.
- Monitor database access patterns if available.

### Post-incident expectations
- Produce a post-incident report:
  - timeline, root cause, impact, remediation, follow-ups.
- Implement control improvements:
  - tighten RLS,
  - add function-level permission checks,
  - add rate limiting/throttling for sensitive operations,
  - improve validation and auditing.

---

## Practical checklist (PR-ready)

Before merging changes that touch data access, permissions, or imports:

- [ ] Frontend uses **anon** key only; no service-role key in client code.
- [ ] All sensitive tables have **RLS enabled** with explicit policies.
- [ ] New queries select only required columns; avoid `select('*')` where sensitive.
- [ ] Edge Functions verify authorization and validate inputs; fail closed.
- [ ] No tokens/PII/financial payloads are logged (client or functions).
- [ ] Tenant boundary enforced for multi-company data (`company_id` + RLS).
- [ ] High-impact operations produce audit records.
- [ ] Secrets added only via environment variables/secret managers, not hardcoded.

---

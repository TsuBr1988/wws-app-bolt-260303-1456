# AGENTS.md

## Dev environment tips
- Install dependencies with `npm install` before running scaffolds.
- Use `npm run dev` for the interactive TypeScript session that powers local experimentation.
- Run `npm run build` to refresh the CommonJS bundle in `dist/` before shipping changes.
- Store generated artefacts in `.context/` so reruns stay deterministic.

## Deploy (Hostinger)
- Standard deploy runbook: `docs/DEPLOY_HOSTINGER.md`
- Agent checklist skill: `.context/skills/hostinger-deploy/SKILL.md`
- If you see `403 Forbidden` on Hostinger, treat it as a hosting/artifact/domain binding issue first (e.g., missing `dist/index.html` or miswired deployment), not an app bug.
- Common cause: subdomain document root points to `public_html/` (or similar) but that folder has no `index.html` (some setups publish the build under a different folder like `nodejs/`).

## Supabase multi-project note
- This repo can operate against multiple Supabase projects (by module) and some legacy features may have **schema/data split** across projects.
- When you see `404 relation does not exist` or unexpected `200 []`, treat it as a likely **wrong client / missing schema / RLS** issue before assuming UI bugs.
- Use the skill guide: `.context/skills/supabase-multi-project/SKILL.md`.

## Testing instructions
- Execute `npm run test` to run the Jest suite.
- Append `-- --watch` while iterating on a failing spec.
- Trigger `npm run build && npm run test` before opening a PR to mimic CI.
- Add or update tests alongside any generator or CLI changes.

## PR instructions
- Follow Conventional Commits (for example, `feat(scaffolding): add doc links`).
- Cross-link new scaffolds in `docs/README.md` and `agents/README.md` so future agents can find them.
- Attach sample CLI output or generated markdown when behaviour shifts.
- Confirm the built artefacts in `dist/` match the new source changes.

## Repository map
- `260206-1252-wws-hub.zip/` — explain what lives here and when agents should edit it.
- `260206-1428-wws-hub.zip/` — explain what lives here and when agents should edit it.
- `260209-1654.zip/` — explain what lives here and when agents should edit it.
- `260210-0826.zip/` — explain what lives here and when agents should edit it.
- `docs/` — explain what lives here and when agents should edit it.
- `eslint.config.js/` — explain what lives here and when agents should edit it.
- `index.html/` — explain what lives here and when agents should edit it.
- `package-lock.json/` — explain what lives here and when agents should edit it.

## AI Context References
- Documentation index: `.context/docs/README.md`
- Agent playbooks: `.context/agents/README.md`
- Skills index: `.context/skills/README.md`
- Contributor guide: `CONTRIBUTING.md`

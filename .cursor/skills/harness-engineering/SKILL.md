---
name: harness-engineering
description: 'Harness Engineering: structured workflow reusing BMAD roles for architecture bounds, feedback loops, context, and tool integration. Use for agent-safe delivery, PRD→impl→test onboarding, or the HTML dialog harness example.'
---

# Harness Engineering (BMAD roles)

## Purpose

Guide **bounded, testable** delivery: define boundaries, feed structured context, implement with repo conventions, then close the loop with tests and review. BMAD roles map to `.cursor/skills/bmad-*` skills — invoke by name or natural language (see triggers below).

## Harness pillar → BMAD role → skill → example triggers

| Pillar | BMAD role | Skill | Example triggers |
|--------|-----------|-------|------------------|
| Architecture | Winston | `bmad-create-architecture` | "Winston, set boundaries", "solution design first" |
| Context / requirements | John, Mary | `bmad-create-prd`, `bmad-agent-analyst`, `bmad-create-story` | "Write the PRD", "split into user stories" |
| UX | Sally | `bmad-create-ux-design` | "UX spec", "a11y and states" |
| Implementation | Amelia | `bmad-quick-dev`, `bmad-dev-story` | "quick-dev this", "implement the story" |
| Feedback loop | QA + review | `bmad-qa-generate-e2e-tests`, `bmad-code-review`, `bmad-review-edge-case-hunter` | "add E2E", "run code review" |
| Human gate | Checkpoint | `bmad-checkpoint-preview` | "checkpoint", "pre-merge walkthrough" |
| Routing | Help | `bmad-help` | "what's next" |

**Pure project (non-BMAD)**: `.cursor/rules/project-standards.mdc`; plugins [`create-plugin`](.cursor/skills/create-plugin/SKILL.md); CMS [`cms-manager`](.cursor/skills/cms-manager/SKILL.md).

## Recommended order

1. `bmad-help` (optional) — pick the next skill.  
2. `bmad-create-architecture` — boundaries, layering, prohibitions.  
3. `bmad-create-prd` or `bmad-create-story` — Ready for Development (actionable, testable, no placeholders).  
4. `bmad-quick-dev` / `bmad-dev-story` — implement; search first and reuse `client/js/core/`, `helpers/`.  
5. `bmad-qa-generate-e2e-tests` + `npm test` — fix on failure.  
6. `bmad-code-review` (optional `bmad-review-edge-case-hunter`).  
7. `bmad-checkpoint-preview` — before release/merge.

## BMM config (this repo)

- **Path**: [`_bmad/bmm/config.yaml`](../../../_bmad/bmm/config.yaml)  
- **Approach**: Minimal `config.yaml` plus `planning` / `implementation` dirs for BMAD skills that resolve variables. Full Quick Dev step trees are optional; add artifacts under `implementation_artifacts` if you want strict step-file runs.

## Example: HTML `<dialog>` plugin (harness runbook)

| Phase | Work | Skill / location |
|-------|------|------------------|
| 1 | Requirements (client-only, `showModal`, coexists with overlay **modal** plugin) | Sally + Winston; see [`client/js/plugins/_dialog.js`](../../../client/js/plugins/_dialog.js) (native `<dialog>`) |
| 2 | Search and implement | `create-plugin` pattern: `_*` plugin, SCSS, `index.js`, `base.scss`, [`client/pages/document/index.html`](../../../client/pages/document/index.html) demo |
| 3 | Tests | `node test-dialog-plugin.js` (contract) + `npm test`; UI via `bmad-checkpoint-preview` |

**Plugins**: [`_modal.js`](../../../client/js/plugins/_modal.js) is the **div overlay** modal (formerly "dialog"). [`_dialog.js`](../../../client/js/plugins/_dialog.js) is the **native `<dialog>`** plugin (`data-role="dialog"`). Both can coexist.

## Constraints

- Prefer a **fresh context** per BMAD skill when recommended.  
- Do not skip project utilities — see `project-standards`.  
- When BMAD workflows load config, follow `communication_language` in `_bmad/bmm/config.yaml`.

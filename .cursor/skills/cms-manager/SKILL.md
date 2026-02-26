---
name: cms-manager
description: Manage Pure CMS pages and comps via API. Update page theme, page data, page meta; create page from raw content; import/update comps. Prefer API over full seed-and-sync.
---

# CMS Manager

Manage **pages** and **comps** via CMS REST API (no full DB overwrite). Admin endpoints need auth (session after `POST /api/auth/login`). Details: **`cms/API.md`**.

**Update workflow (always follow):**
1. **Check existing** — Look up the record (e.g. `GET /api/comp/:key`, `GET /api/pages` or by-name).
2. **If exists** → **update** that record (e.g. `PUT /api/pages/by-name/:name`, `PUT /api/comp/:id`, or `POST /api/comp` upsert by key).
3. **If not exists** → **create** one (e.g. `POST /api/pages`, `POST /api/comp`).
4. **Then update references** — Any other records that point to this one (e.g. set page `meta.theme` to the theme comp key). Update those in the DB/API so the reference is correct.

## Capabilities

| # | Capability | API |
|---|------------|-----|
| 1 | Update page theme | Push theme comp: `POST /api/comp` `{ key, type: "theme", format: "json", data }`. Assign: `PUT /api/pages/by-name/<name>` `{ "meta": { "theme": "theme-<name>" } }`. |
| 2 | Update page content data | `PUT /api/pages/by-name/<name>` `{ "data": <sectionData> }`. Section order: hero, scrollview, points, gallery, timeline (see `helpers/pageData.js`). |
| 3 | Update page meta | `PUT /api/pages/by-name/<name>` `{ "meta": { title, desc, path, theme, ... } }`. Partial update. |
| 4 | Create new page from raw content | `POST /api/pages` `{ name, path, data, meta, format: "json", status }`. Optional: update header comp via `POST /api/comp` key `header`. |
| + | Import/update comps (header, footer, themes) | `POST /api/comp` `{ key, type, format: "json", data }` (upsert). `DELETE /api/comp/by-key/<key>`. |

## API cheat sheet

- Page partial update: `PUT /api/pages/by-name/<pageName>` body `{ meta }` or `{ data }`.
- Create page: `POST /api/pages` body `{ name, path, data, meta, format: "json", status }`.
- Comp upsert: `POST /api/comp` body `{ key, type, format: "json", data }`.
- Comp delete: `DELETE /api/comp/by-key/<key>`.

Theme comps: **key** = `theme-<name>` (e.g. `theme-pink`), **type** = `"theme"`. Theme file shape: default export `{ default: { ...vars }, dark: { ...vars } }`. Copy from `data/theme.js` or `data/theme-pink.js`; rule: `.cursor/rules/theme-change.mdc`.

## References

- **`cms/API.md`** — full endpoints and examples.
- **`.cursor/rules/theme-change.mdc`** — theme file pattern and applying to DB.
- **`data/theme.js`**, **`data/theme-pink.js`** — theme shape.
- **`data/page/ai-trend.js`**, **`helpers/pageData.js`** — page section data shape.

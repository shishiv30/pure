---
name: push-page-cms
description: Posts page data into the Pure CMS pages table and optionally updates header comp links. Use when adding a new dynamic page, pushing page content to CMS, or ensuring a page link appears in the header nav.
---

# Push Page Data to CMS and Update Header Links

Use this workflow when you add a new dynamic page (served at `/page/:key`) and want its content in the CMS and a nav link in the header.

## How dynamic pages work

| Item | Value |
|------|--------|
| Route | `GET /page/:key` (e.g. `/page/index`, `/page/about`) |
| Config | `server/configs/page.js` — fetches by key |
| CMS page name | `page${key}`.toLowerCase() (e.g. `index` → `pageindex`) |
| Page data file | `data/page/<name>.js` (e.g. `data/page/index.js`, `data/page/ai-trend.js` for key `ai-trend`) — default export: array of sections |
| Header comp key | `header` — link shape: `{ id, text, path, order, parentId }`; path for page = `/page/<key>` |

Main app fetches: `GET {cmsUrl}/api/pages/content/{pageName}` and `GET {cmsUrl}/api/comp/public/header`.

---

## Step 1: Post page data to CMS

**Script (recommended):** `cms/scripts/seed-and-sync.js`

Seeds local DB from `data/page/*.js` (pages from `pagePath` in `data/page/header.js`) and `data/theme.js`, then syncs to remote CMS.

```bash
# From repo root
node cms/scripts/seed-and-sync.js [--local-only] [CMS_URL] [CMS_EMAIL] [CMS_PASSWORD]
```

- `--local-only` — Seed local DB only.
- **With credentials** — Seeds local, then syncs to remote via API.

**Without script:** Use CMS API (admin auth): `POST /api/pages` — body: `{ name, title, type: "json", data, meta, status }`. Page name = key (e.g. `index`, `ai-trend`). Add page key to `pagePath` in `data/page/header.js` for seed-and-sync to include it.

---

## Step 2: Update header comp with the new link

If you use `--update-header`, the script:

1. Reads current header comp (API or DB).
2. Ensures there is a link with `path: '/page/<key>'`; adds one if missing (text = page title or key, order = after existing).
3. Writes the updated links back to the comp `header`.

**Manual update:** Edit `data/page/header.js` to add a link, then run `node cms/scripts/seed-and-sync.js` to sync.

---

## Checklist

- [ ] Page data file exists (e.g. `data/page<key>.js` or `data/page/<name>.js`) with default export = section array.
- [ ] Add page to `pagePath` in `data/page/header.js`, add `data/page/<key>.js`, run `node cms/scripts/seed-and-sync.js`.
- [ ] Main app has `CMS_URL` set so it can fetch the page and header from CMS.

---

## Reference

- Dynamic page route and config: `server/routes/page.js`, `server/configs/page.js`
- Page section order and helpers: `helpers/pageData.js` (`arrayToPageData`, `PAGE_SECTIONS_ORDER`)
- Seed and sync: `cms/scripts/seed-and-sync.js`; header and pages: `data/page/header.js`
- CMS pages API: `cms/routes/pages.js` (POST /api/pages, PUT /api/pages/:id)
- CMS comp API: `cms/routes/comp.js` (GET /api/comp/public/:key, POST /api/comp)

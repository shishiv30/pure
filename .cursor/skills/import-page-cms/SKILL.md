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
| Page data file | `data/page<key>.js` — default export: array of sections in order (hero, scrollview, points, gallery, timeline) |
| Header comp key | `header` — link shape: `{ id, text, path, order, parentId }`; path for page = `/page/<key>` |

Main app fetches: `GET {cmsUrl}/api/pages/content/{pageName}` and `GET {cmsUrl}/api/comp/public/header`.

---

## Step 1: Post page data to CMS

**Script (recommended):** `cms/scripts/push-page.js`

```bash
# From repo root
node cms/scripts/push-page.js <key> [dataModule] [status] [--update-header]
```

- **key** — URL key (e.g. `index`, `about`). CMS page name becomes `page<key>` (e.g. `pageindex`).
- **dataModule** — Optional. Path to data module relative to repo root (default: `data/page<key>.js`).
- **status** — Optional. `draft` or `published` (default: `published`).
- **--update-header** — If set, after pushing the page, updates the header comp so it includes a link to `/page/<key>`.

**Examples:**

```bash
node cms/scripts/push-page.js index
node cms/scripts/push-page.js about data/pageabout.js published --update-header
```

**Without script:** Use CMS API (admin auth):

- `POST /api/pages` — body: `{ name, title, type: "json", data, meta, status }`.
- Page name must be `page<key>` (lowercase). Data = JSON string of the section array.

**Env:** `CMS_URL` (default `http://localhost:3003`). With `CMS_EMAIL`/`CMS_PASSWORD` the script uses the API; otherwise it writes to the CMS SQLite DB at `DB_PATH`.

---

## Step 2: Update header comp with the new link

If you use `--update-header`, the script:

1. Reads current header comp (API or DB).
2. Ensures there is a link with `path: '/page/<key>'`; adds one if missing (text = page title or key, order = after existing).
3. Writes the updated links back to the comp `header`.

**Manual update:** Get header comp data (e.g. from `data/header.js` or GET comp), add or edit an entry:

```js
{ id: <unique>, text: 'Page Title', path: '/page/<key>', order: <n>, parentId: null }
```

Then push comp: `node cms/scripts/push-comp.js header data/header.js` (after editing `data/header.js`), or POST/PUT to `/api/comp` with key `header`.

---

## Checklist

- [ ] Page data file exists (e.g. `data/page<key>.js`) with default export = section array.
- [ ] Run `node cms/scripts/push-page.js <key> [status] [--update-header]`.
- [ ] If not using `--update-header`, add `/page/<key>` to header links and push comp `header`.
- [ ] Main app has `CMS_URL` set so it can fetch the page and header from CMS.

---

## Reference

- Dynamic page route and config: `server/routes/page.js`, `server/configs/page.js`
- Page section order and helpers: `helpers/pageData.js` (`arrayToPageData`, `PAGE_SECTIONS_ORDER`)
- Push script: `cms/scripts/push-page.js`
- Comp push: `cms/scripts/push-comp.js`; header data: `data/header.js`
- CMS pages API: `cms/routes/pages.js` (POST /api/pages, PUT /api/pages/:id)
- CMS comp API: `cms/routes/comp.js` (GET /api/comp/public/:key, POST /api/comp)

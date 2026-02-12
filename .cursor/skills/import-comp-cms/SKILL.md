---
name: import-comp-cms
description: Imports component data into the Pure CMS comp table and wires dynamic load from CMS. Use when moving comp_xxx.js data to CMS, pushing data to CMS, or making header/footer/page content load from CMS.
---

# Import Data into CMS and Load Dynamically

Three-step pattern to separate component data from code, store it in the CMS comp table, and load it at runtime.

## Overview

| Step | What | Where |
|------|------|--------|
| 1 | Separate data from `comp_xxx.js` into a data file | `data/<name>.js` |
| 2 | Upload data into CMS comp table | POST API or push script |
| 3 | Fetch from CMS and use in app | Component accepts override; page config fetches by key |

**CMS comp table**: `comp` (columns: id, key, type, data). Public read: `GET /api/comp/public/:key`.

---

## Step 1: Separate data from comp_xxx.js

1. **Create a data file** under `data/` (e.g. `data/links.js`, `data/footer.js`).
2. **Export a default array** of rows. Each row is a plain object; shape depends on the component (e.g. id, text, path, order, parentId for links; id, type, key, path, text, order, parentId for footer).
3. **Update the component** (`server/ejs/comp_xxx.js`):
   - Import the data file: `import table from '../../data/<name>.js';`
   - Build the component data from the table (e.g. `buildMenuFromLinks(table)`).
   - **Support an override**: `createXxxComponent(override)` — if `override` is provided (e.g. from CMS), use it instead of the default table; otherwise use the imported table. This allows the same component to work with local data or CMS data.

**Existing examples:**
- Header: `data/links.js` (id, text, path, order, parentId) → `comp_header.js` builds `menu` from it; `createHeaderComponent(linkTableOverride)`.
- Footer: `data/footer.js` (id, icon, key, path, text, order, parentId, type) → `comp_footer.js` builds contact/social/menu; `createFooterComponent(footerTableOverride)`.

---

## Step 2: Upload data into CMS

**Option A – Push script (recommended for repo-driven data)**

- **Script:** `cms/scripts/push-comp.js`
- **Usage:** `node cms/scripts/push-comp.js <key> [dataModule]`
- **Examples:**
  - `node cms/scripts/push-comp.js header-menu data/links.js`
  - `node cms/scripts/push-comp.js footer data/footer.js`
- **Behavior:** Without `CMS_EMAIL`/`CMS_PASSWORD` it writes directly to the CMS SQLite DB (same DB as `DB_PATH` in cms/.env). With credentials it uses `POST /api/comp`.
- **Run from:** repo root.

**Option B – POST API**

- **Endpoint:** `POST /api/comp` (admin only, session cookie).
- **Body:** `{ "key": "header-menu", "type": "json", "data": "<JSON string of the array>" }`.
- **Upsert:** If a row with that `key` exists, it is updated; otherwise a new row is created.

**Comp row shape:** key (string), type (e.g. `"json"`), data (string; for JSON arrays, stringify the data file’s default export).

---

## Step 3: Fetch from CMS and use in the app

1. **Public API:** `GET {cmsUrl}/api/comp/public/:key` — no auth. Returns `{ code, message, data: { id, key, type, data } }`. The `data` field is the stored string (parse as JSON when type is `"json"`).
2. **Where to fetch:** In configs or routes that need CMS-driven content (e.g. `server/configs/page.js`):
   - Call the CMS, parse the comp row’s `data` (JSON.parse if type is json).
   - Pass the parsed array into the component factory: `createHeaderComponent(parsedHeaderMenu)`, `createFooterComponent(parsedFooterRows)`.
3. **Fallback:** If CMS is unavailable or the key is missing, pass `null`/`undefined` so the component uses its default data file (see Step 1).

**Example (page config):** Fetch `header-menu` and `footer` from CMS, then:

```js
headerComponent: createHeaderComponent(headerMenuFromCms),
footerComponent: createFooterComponent(footerRowsFromCms),
```

**Server config:** Main app needs `CMS_URL` in env (e.g. in `.env` or `.env.local`) so it can call the CMS.

---

## Checklist

- [ ] Data moved to `data/<name>.js` (default export array).
- [ ] Component builds from table and accepts optional override; fallback to local table when override is null/undefined.
- [ ] Data pushed to CMS: `node cms/scripts/push-comp.js <key> data/<name>.js` (or POST /api/comp).
- [ ] Consumer (e.g. page config) fetches `GET /api/comp/public/<key>`, parses `data`, passes into component factory.
- [ ] `CMS_URL` set where the main app runs so it can reach the CMS.

---

## Reference

- Comp API and push script: `cms/routes/comp.js`, `cms/scripts/push-comp.js`
- Data and components: `data/links.js`, `data/footer.js`, `server/ejs/comp_header.js`, `server/ejs/comp_footer.js`
- Dynamic load from CMS: `server/configs/page.js` (fetches header-menu, footer, and page key)
- CMS fetch from main app: set `serverConfig.cmsUrl` (from `CMS_URL` in env)

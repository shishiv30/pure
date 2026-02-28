# CMS API (safe updates, no full sync)

Use these endpoints to update **pages** and **comps** without running `seed-and-sync.js` (which overwrites the whole DB). All admin routes require authentication (session cookie or equivalent).

Base URL: your CMS origin (e.g. `http://localhost:3001` or `https://cms.example.com`).

**Update workflow:** (1) Check if record exists (`GET /api/pages`, `GET /api/comp/:key`). (2) If yes → update it (PUT or POST upsert). (3) If no → create it (POST). (4) Then update references (e.g. page `meta.theme`, other tables that point to this record).

---

## Pages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/pages` | List all pages (admin: all; others: published only) |
| GET | `/api/pages/:id` | Get page by id |
| **PUT** | **`/api/pages/by-name/:name`** | **Partial update by page name** (e.g. update only meta or data) |
| PUT | `/api/pages/:id` | Partial update by id (same body as by-name) |
| POST | `/api/pages` | Create page |
| DELETE | `/api/pages/:id` | Delete page by id |

### Update page meta (e.g. set theme)

```http
PUT /api/pages/by-name/ai-trend
Content-Type: application/json

{
  "meta": {
    "title": "Pure - AI Trend",
    "desc": "...",
    "path": "page/ai-trend",
    "theme": "theme-pink"
  }
}
```

Only sent fields are updated. `meta` can be an object (stored as JSON string in DB).

### Update page data

```http
PUT /api/pages/by-name/index
Content-Type: application/json

{
  "data": { ... }
}
```

---

## Comps (header, footer, themes)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/comp` | List all comps (auth required) |
| GET | `/api/comp/:key` | Get comp by key (auth required) |
| GET | `/api/comp/public/:key` | Get comp by key (no auth) |
| GET | `/api/comp/public` | Get all comps of type `comp` (no auth) |
| GET | `/api/comp/public/type/:type` | Get all comps of a given type (no auth) |
| GET | `/api/comp/public/keys/[k1,k2,...]` | Get multiple comps by key list (no auth) |
| **POST** | **`/api/comp`** | **Create or update comp by key** (upsert: if key exists, update; else create) |
| PUT | `/api/comp/:id` | Partial update by id |
| **DELETE** | **`/api/comp/by-key/:key`** | Delete comp by key |
| DELETE | `/api/comp/:id` | Delete comp by id |

### Add or update a theme in comps

**Theme naming rule:** In the comps table, theme **key** must be `theme-<name>` (e.g. `theme-pink`, `theme-blue`), and **type** must be `"theme"`.

```http
POST /api/comp
Content-Type: application/json

{
  "key": "theme-pink",
  "type": "theme",
  "format": "json",
  "data": {
    "default": {
      "--color-major-hue": "330",
      "--color-major-saturation": "85%",
      ...
    },
    "dark": {
      "--color-glb-bg-lightness": "75%",
      ...
    }
  }
}
```

Same shape as `data/comps/theme-pink.js` default export. Use this to push a new theme or update an existing one **without** running full seed-and-sync.

### Delete a theme comp

```http
DELETE /api/comp/by-key/theme-old
```

---

## Summary for AI / automation

- **Update page meta** (e.g. set which theme a page uses): `PUT /api/pages/by-name/<pageName>` with body `{ "meta": { "theme": "theme-pink", ... } }`.
- **Update page data**: same route, body `{ "data": ... }`.
- **Add new theme in comps**: create `data/theme-<name>.js` in repo, then `POST /api/comp` with `{ "key": "theme-<name>", "type": "theme", "format": "json", "data": <themeObject> }`. No need to run seed-and-sync.
- **Update existing theme comp**: same `POST /api/comp` (upsert by key).
- **Delete theme comp**: `DELETE /api/comp/by-key/theme-<name>`.

All of the above require admin auth (session cookie after login to `/api/auth/login`).

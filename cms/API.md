# CMS API (safe updates, no full sync)

Use these endpoints to update `pages` and `comps` without running `seed-and-sync.js` (which rewrites broad data sets).

Base URL: your CMS origin, for example `http://localhost:3003` locally.

Most write routes require admin authentication (session cookie after login).

## Recommended Update Workflow

1. Check if target record exists (`GET /api/pages`, `GET /api/comp/:key`).
2. Upsert/update the record (`PUT` or `POST /api/comp`).
3. Update references (`meta.theme`, related keys, dependent content).
4. Verify via read endpoints.

## Pages API

| Method | Path | Description |
|---|---|---|
| GET | `/api/pages` | List pages (admin all, public only published) |
| GET | `/api/pages/:id` | Get page by id |
| PUT | `/api/pages/by-name/:name` | Partial update by page name |
| PUT | `/api/pages/:id` | Partial update by id |
| POST | `/api/pages` | Create page |
| DELETE | `/api/pages/:id` | Delete page |

### Update page meta (theme/title/desc/path)

```http
PUT /api/pages/by-name/index
Content-Type: application/json

{
  "meta": {
    "title": "Pure Home",
    "desc": "Updated description",
    "path": "page/index",
    "theme": "theme-pink"
  }
}
```

### Update page data

```http
PUT /api/pages/by-name/index
Content-Type: application/json

{
  "data": {
    "hero": {
      "title": "Hello"
    }
  }
}
```

## Comps API

| Method | Path | Description |
|---|---|---|
| GET | `/api/comp` | List comps (auth required) |
| GET | `/api/comp/:key` | Get comp by key (auth required) |
| GET | `/api/comp/public/:key` | Get comp by key (public) |
| GET | `/api/comp/public` | Get all comps of type `comp` (public) |
| GET | `/api/comp/public/type/:type` | Get all comps for type (public) |
| GET | `/api/comp/public/keys/[k1,k2,...]` | Get multiple keys (public) |
| POST | `/api/comp` | Upsert comp by key |
| PUT | `/api/comp/:id` | Partial update by id |
| DELETE | `/api/comp/by-key/:key` | Delete by key |
| DELETE | `/api/comp/:id` | Delete by id |

## Theme Convention

Theme records in `comps` table must use:

- `key`: `theme-<name>` (example: `theme-pink`)
- `type`: `theme`
- `format`: typically `json`
- `data`: object with `default` and `dark` sections

Local theme source files use:

- `data/comps/theme.js` for default theme
- `data/comps/theme-<name>.js` for named themes

### Add or update a theme comp

```http
POST /api/comp
Content-Type: application/json

{
  "key": "theme-pink",
  "type": "theme",
  "format": "json",
  "data": {
    "default": {
      "--color-major-hue": "330"
    },
    "dark": {
      "--color-major-lightness": "75%"
    }
  }
}
```

### Delete a theme comp

```http
DELETE /api/comp/by-key/theme-pink
```

## Quick Automation Summary

- Update page meta: `PUT /api/pages/by-name/<pageName>` with `{ "meta": { ... } }`
- Update page data: `PUT /api/pages/by-name/<pageName>` with `{ "data": { ... } }`
- Upsert theme comp: `POST /api/comp` with key `theme-<name>`, type `theme`
- Remove theme comp: `DELETE /api/comp/by-key/theme-<name>`

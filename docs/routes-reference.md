# Routes Reference

## Top-Level Router

Mounted from `server/routes/index.js`:

- Page/default routes: `default.js`, `demo.js`, `sitemap.js`, `page.js`
- API routes: `/api` -> `api.js`
- SOA proxy routes: `/api/soa` -> `api.soa.js`

## API Ownership

### `/api/*`

Owned by `server/routes/api.js`:

- app-specific endpoints (geo/properties/media-oriented handlers)
- mappings and response shaping for client consumption

### `/api/soa/*`

Owned by `server/routes/api.soa.js` and mounted children:

- `/api/soa/property/*` -> `api.soa.property.js`
- `/api/soa/school/*` -> `api.soa.school.js`
- `/api/soa/poi/*` -> `api.soa.poi.js`
- `/api/soa/*` fallback and geoarea routes -> `api.soa.geoarea.js`

## Route Ordering Notes

- Specific prefixes are mounted before fallback handlers to prevent broad matches from shadowing specific endpoints.
- SOA routes are intended as adapters/proxies to upstream services with selective normalization.

## Demo routes (HTML + JSON parity)

Sitemap HTML routes are defined in [`server/routes/demo.js`](../server/routes/demo.js).

**SPA URL patterns** (detail, map, geo grid) are the single source of truth in [`helpers/routes/demoSpaRoutes.js`](../helpers/routes/demoSpaRoutes.js), used by:

- [`server/routes/demo.js`](../server/routes/demo.js) — `detail` and `geo` handlers (map URLs use `geo` on the server)
- [`client/pages/demo/index.js`](../client/pages/demo/index.js) — client `Router` rules (`detail`, `map`, `geo`)

When changing demo SPA URL shapes, update `demoSpaRoutes.js` and its tests first.

Handler: `BaseController(req, res, 'demo')` → [`server/controllers/demo.js`](../server/controllers/demo.js).

| Route pattern | Purpose | Query / params |
|---------------|---------|----------------|
| `/demo/sitemap` | State sitemap | — |
| `/demo/sitemap/:state` | City/county sitemap | `state` |
| `/demo/detail/:state/:zip/:prId` | Property detail (SSR) | Sets `req.query.geoPath`, `req.query.prId` |
| `/demo/:state/:geoSlug/@lat,lng` | Map view (client SPA) | Server uses geo catch-all |
| `/demo/:geoPath(*)` | Geo grid (catch-all) | Canonical redirect when path normalizes |

JSON (same `demo.get()` model, `toData`):

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/demo/detail/:prId` | SPA detail fetch; optional `geoPath` query |

SOA transport for demo: direct imports from `server/routes/api.soa.property.js` inside the controller (not an internal hop to `/api/soa`). HTTP proxy for external clients: `/api/soa/property/*`.

Pipeline: [`listing-data-pipeline.md`](listing-data-pipeline.md).

## Documentation Contract

When adding or changing a route:

1. Update route module.
2. Update this file.
3. If externally consumed, update `docs/soa-api.md` as well.

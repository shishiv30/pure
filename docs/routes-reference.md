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

## Documentation Contract

When adding or changing a route:

1. Update route module.
2. Update this file.
3. If externally consumed, update `docs/soa-api.md` as well.

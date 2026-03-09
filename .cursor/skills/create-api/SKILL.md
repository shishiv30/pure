---
name: create-api
description: Build new APIs from a Swagger/OpenAPI document. Use when the user wants to create API routes from an external API spec, proxy SOA/Geoarea endpoints, or add documented API handlers from a swagger document.
---

# Create API from Swagger Document

Build new API routes from a provided Swagger/OpenAPI document. Covers config, docs, fetch layer, mappers, and router registration.

## Workflow

### 1. Fetch OpenAPI spec

Get the spec from the Swagger URL. Typical paths:

- `https://<domain>/v3/api-docs`
- `https://<domain>/swagger.json`
- `https://<domain>/api-docs`

Use `curl` or `mcp_web_fetch`; if it times out (internal/VPN), use the user’s local access.

Parse paths, methods, schemas, and request bodies:

```bash
curl -s -m 15 "https://<base>/v3/api-docs" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log(JSON.stringify({ paths: Object.keys(d.paths || {}), schemas: Object.keys(d.components?.schemas || {}) }, null, 2));
"
```

### 2. Add config

In `server/config.js` add:

- Base URL (e.g. `geoareaApiDomain` from `GEOAREA_API_DOMAIN`)
- API key (e.g. `geoareaApiKey` from `SOA_API_KEY`)

Add env vars to `.env.local` and comment them under the API section.

### 3. Create docs

Add `docs/<name>-api.md` (e.g. `docs/soa-api.md`) with:

- **Base**: URL, auth header, env key
- **All APIs**: Table of Method, Path, Deprecated (from spec)
- **Schemas**: Object shapes for mapping (from `components.schemas`)
- **POST request bodies**: Body schemas for POST endpoints
- **Test inputs**: Sample values (state, city, zipcode, ids)
- **Example curl**: For a core GET endpoint

### 4. Create fetch layer

In `server/configs/<name>.js` (e.g. `realestate.js`):

- `getHeaders()` – build auth headers (e.g. `X-MData-Key`)
- `fetchFromApi(method, path, options)` – generic fetch with:
  - `options.query` → query string
  - `options.body` → JSON for POST/PUT
- Optional specific fetchers (e.g. `fetchStatesFromApi`) when logic differs

Use `config.<baseUrl>` and `config.<apiKey>` for the upstream API.

### 5. Create mapper (helpers)

In `helpers/<name>Mapper.js` (e.g. `soaGeoMapper.js`):

- **Item mappers**: `mapSoaXxxToGeo(item)` – one raw item → UI model
- **Response mappers**: `mapSoaXxxResponse(raw)` – raw response → UI array/object
- **ensureArray(raw)** – handle `array`, `{ data: array }`, `{ list: array }`

Response mappers encapsulate `ensureArray` + item mappers. Keep all mapping logic in the mapper; the router only calls the response mappers.

### 6. Add router

Create `server/routes/api.<name>.js` (e.g. `api.soa.js`):

- Import `fetchFromApi` (and specific fetchers) from config
- Import response mappers from the mapper helper
- Define exported handlers: `fetch → mapXxxResponse(raw) → res.json(result)`
- Register routes before any catch-all
- Optional catch-all proxy for other paths (GET/POST/DELETE)
- Add `router.use(express.json())` only if POST body parsing is needed

Do **not** put `ensureArray`, `map*ToGeo`, or other mapping logic in the router. The router focuses on registering APIs and delegating to fetch + mapper.

### 7. Mount router

In `server/routes/index.js`:

```js
import apiSoaRouter from './api.soa.js';
router.use('/api/soa', apiSoaRouter);
```

Add the new routes file to `server/swaggerConfig.js` `apis` array if you use JSDoc Swagger.

### 8. Add Swagger JSDoc

Above each route, add `@swagger` blocks:

- **Parameters**: `in: path`, `required`, `description`, `schema` with `type`, `example`, `pattern` where relevant
- **Responses**: `content.application/json.schema` with `type`, `items`, `properties`, `required`, `description`
- **400/500**: Error responses

Use the UI model shape in response schemas, not the raw upstream shape.

## Pattern Summary

| Layer | Responsibility |
|-------|----------------|
| `server/config.js` | Base URL, API key from env |
| `docs/*-api.md` | Reference: APIs table, schemas, POST bodies |
| `server/configs/*.js` | Fetch upstream API |
| `helpers/*Mapper.js` | Raw → UI model (ensureArray + map*) |
| `server/routes/api.*.js` | Route registration, handlers: fetch → map → res.json |

## Example handler

```js
export async function getCountiesByStateCode(req, res) {
  try {
    const { stateCode } = req.params;
    const data = await fetchFromGeoarea('GET', `/state/${stateCode}/counties`, {
      query: req.query,
    });
    sendJson(res, mapSoaCountiesResponse(data));
  } catch (error) {
    handleSoaError(res, error);
  }
}
```

## Reference

- API list and schemas: `docs/soa-api.md`
- Mapper: `helpers/soaGeoMapper.js`
- Config: `server/configs/realestate.js`
- Routes: `server/routes/api.soa.js`

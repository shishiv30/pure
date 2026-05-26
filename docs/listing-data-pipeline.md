# Listing Data Pipeline (Demo Reference)

Canonical guide for how **SOA Property listings** flow through Pure: raw API → **metadata** → **comp UI models** → EJS (SSR) or JSON (SPA). Use the **demo page** as the reference implementation.

Normative coding rules: [`.cursor/rules/project-standards.mdc`](../.cursor/rules/project-standards.mdc). SOA HTTP reference: [`soa-api.md`](soa-api.md).

## Three layers (do not mix)

| Layer | Module | Entry function | Output |
|-------|--------|----------------|--------|
| **1. Metadata** | `helpers/property.js` | `mapSOADataToMetadata(soaListing, historiesRaw?)` | Normalized `metadata` object (source of truth after mapping) |
| **2. Comp UI models** | `helpers/article.js` | `mapPropertyToArticle(metadata)` (list), `mapPropertyDetailToArticle(listing, histories)` (detail) | Shapes for `comp_article`, `comp_article_detail` |
| **3. Templates** | `server/ejs/comp_*.ejs` | Includes from `demo.ejs`, `page.ejs`, etc. | HTML only; no SOA parsing |

```mermaid
flowchart LR
  Raw[Raw SOA listing + histories]
  Meta[mapSOADataToMetadata]
  Card[mapPropertyToArticle]
  Detail[mapPropertyDetailToArticle]
  Comps[mapXToComp helpers]
  EJS[EJS comps]

  Raw --> Meta
  Meta --> Card
  Raw --> Detail
  Detail --> Meta
  Detail --> Card
  Detail --> Comps
  Comps --> EJS
  Card --> EJS
```

### Controller rule

After calling `mapPropertyDetailToArticle(listingRaw, historiesRaw)` (or list mappers), controllers must use **`metadata`**, **`detail.*` comp fields**, and **`buildDetailSeo(detail)`** only — not raw `listingRaw` for SEO, EJS, or business logic.

Example: [`server/controllers/demo.js`](../server/controllers/demo.js).

---

## SOA integration

### Paths

| Path | Purpose | Key files |
|------|---------|-----------|
| **SSR HTML** | Full demo pages | `server/routes/demo.js` → `BaseController('demo')` → `server/controllers/demo.js` |
| **JSON API** | SPA detail fetch | `GET /api/demo/detail/:prId` in `server/routes/api.js` → same `demo.get()` → `toData()` |
| **HTTP proxy** | External/tools call SOA verbatim | `/api/soa/property/*` → `server/routes/api.soa.property.js` → `fetchFromSoa()` in `server/controllers/realestate.js` |

### Demo controller SOA calls

`demo.get()` runs in parallel:

- `searchHouse(geo)` — nearby listings (grid)
- `getPropertyListingInfoById(prId)` — primary listing (detail)
- `getPropertyHistoryById(prId)` — histories (detail)

Imported from `server/routes/api.soa.property.js` (not an internal HTTP hop to `/api/soa`).

### Auth

All SOA requests use header `X-MData-Key` from `SOA_API_KEY`. See [`soa-api.md`](soa-api.md).

---

## Layer 1: Metadata (`helpers/property.js`)

`mapSOADataToMetadata(soaListing, historiesRaw?)`:

- Returns `null` if listing has no `id`.
- Maps SOA Pure fields to stable names: `propertyId`, `geo`, `price`, `photos` (preview URL strings), `listingUrl`, `description` (`publicRemarks`), `groupedFeatures` (parsed object), `openHouses`, `area`, `areaUnit`, `areaDisplay`, `pricePerArea`, etc.
- When `historiesRaw` is provided: sets `metadata.histories` — sorted array of `{ date, title, subtitle }` (not raw SOA envelope).

Helpers that produce **comp-ready history/open-house shapes** (used by article layer):

- `mapHistoryRowsToTimelineComp(rows)` — `comp_timeline` model
- `mapOpenHousesToComp(openHouses)` — `comp_open_houses` model
- `normalizeGroupedFeatures()` — parses JSON string or object

**Do not** add tag/attr presentation or HTML here.

---

## Layer 2: Comp UI models (`helpers/article.js`)

### List cards (`comp_article`)

```js
mapSOADataListToArticles(soaListings)
  → mapSOADataToMetadata(each)
  → mapPropertyToArticle(metadata)
```

Article shape: `title`, `path`, `tags`, `attrs`, `img`, `metadata` (embedded).

### Detail page (`comp_article_detail`)

```js
mapPropertyDetailToArticle(soaListing, historiesRaw)
  → metadata = mapSOADataToMetadata(...)
  → card = mapPropertyToArticle(metadata, true)  // full attrs + groupedFeatures
  → comp fields via mapXToComp
```

Detail return shape (render models only):

| Field | Comp template | Mapper |
|-------|---------------|--------|
| `metadata` | (SEO, debugging, future use) | `mapSOADataToMetadata` |
| `title` | Page `<h1>` | from `mapPropertyToArticle` |
| `tags` | `comp_tags` | `mapTagsToComp(card.tags)` |
| `album` | `comp_album` | `mapAlbumToComp(metadata.photos, title)` |
| `paragraph` | `comp_paragraph` | `mapParagraphToComp(metadata.description)` |
| `record` | `comp_record` | `mapRecordToComp(card.attrs)` |
| `openHouses` | `comp_open_houses` | `mapOpenHousesToComp(metadata.openHouses)` |
| `timeline` | `comp_timeline` | `mapHistoryRowsToTimelineComp(metadata.histories)` |

`buildDetailSeo(detail)` reads `detail.metadata.listingStatus` and `detail.paragraph.text` — no raw listing.

### `mapPropertyToAttrs(property, allAttrs)`

Builds fact rows (`Est`, `Bd`, `Ba`, sqft, price/sqft, year). When `allAttrs === true`, adds agent/office/phone and merges **groupedFeatures** via `mapGroupedFeaturesToAttrs()` (one attr per non-empty group; empty arrays skipped).

---

## Layer 3: EJS (`server/ejs/`)

[`comp_article_detail.ejs`](../server/ejs/comp_article_detail.ejs) pattern:

```ejs
<%_ if (detail.album) { _%>
  <%- include('comp_album', { album: detail.album, getSrc }) %>
<%_ } _%>
```

Guard each include; pass `getSrc` / `getHref` from `BaseController.toPage()` model.

List grid: [`demo.ejs`](../server/ejs/demo.ejs) loops `articleComponent.data` and includes `comp_article`.

---

## BaseController: `toPage` vs `toData`

| | `toPage` | `toData` |
|---|----------|----------|
| **Output** | HTML (`${config.name}.ejs`) | JSON `{ code, data, error, cost }` |
| **SEO / breadcrumb** | yes | no |
| **Theme inline CSS** | yes | no |
| **`getHref` / `getSrc`** | on model | no |
| **Static HTML cache** | optional write | no |
| **Typical routes** | `demo.js`, `page.js`, `default.js` | `/api/demo/detail/:prId`, `/api/geo`, etc. |

Both call the same `config.get()` — demo SSR and SPA share one data builder.

Contract: [`server/controllers/configbase.js`](../server/controllers/configbase.js).

---

## Client: plugins and demo SPA

### Plugins

1. `client/js/index.js` registers plugins from `client/js/plugins/index.js`.
2. `Page` (`client/js/core/page.js`) on `dom.load` scans `[data-role]`, initializes `Plugin` lifecycle (`init` → `load` → `render`).
3. After SPA injects HTML, `emit('dom.load')` re-binds plugins (e.g. `album` on `#detail`).

EJS must emit matching `data-role` and `data-*` options. Example: `comp_album.ejs` → `data-role="album"` → `client/js/plugins/_album.js`.

### Demo client router

- `client/pages/demo/index.js` — `Router` rules for grid / detail / map; `linkScope: 'demo'`.
- Detail navigation: `fetch('/api/demo/detail/:prId')` → `buildDemoSpaInnerHtml(envelope.data)` in `client/pages/demo/detailSpa.js` → `innerHTML` on `#detail`.

**Data is unified** with SSR (`demo.get()`). **Markup is duplicated** between EJS comps and `detailSpa.js` (known debt; see appendix).

---

## Adding a new detail section

1. **SOA field** → add to `mapSOADataToMetadata` in `helpers/property.js` (if new normalized field).
2. **Comp model** → add `mapXToComp()` in `helpers/article.js`; call from `mapPropertyDetailToArticle`.
3. **Template** → create `server/ejs/comp_x.ejs`; include from `comp_article_detail.ejs` with `<%_ if (detail.x) { _%>`.
4. **Plugin** (if interactive) → `client/js/plugins/_x.js`, register in `plugins/index.js`, `data-role="x"` in EJS.
5. **SPA** (if needed) → update `detailSpa.js` to consume same comp field from JSON (or defer to Phase 5 unification).
6. **Tests** → extend `helpers/__tests__/property.test.js`.

See also [create-comp skill](../.cursor/skills/create-comp/SKILL.md) Pattern C (demo detail).

---

## What belongs in `helpers/`

| In `helpers/` | Elsewhere |
|---------------|-----------|
| SOA/geo/listing transforms (`property`, `article`, `geo`, `path`, `url`, `fuse`, `datetime`) | Raw seed data → `data/` |
| Pure comp-shape mappers tied to SOA (`mapHistoryRowsToTimelineComp`, `mapOpenHousesToComp`) | DOM/runtime → `client/js/core/` |
| | Controllers → `server/controllers/` |
| | EJS → `server/ejs/` |

---

## Testing

Primary mapping tests: `helpers/__tests__/property.test.js` (`mapSOADataToMetadata`, `mapPropertyDetailToArticle`, comp mappers).

Run full suite:

```bash
npm test
```

Controller contract: `server/controllers/__tests__/basecontroller.config.test.js`.

No Playwright/e2e in repo; optional Lighthouse via `npm run test:lighthouse`.

---

## Appendix: known duplication and future work

Documented for maintainers; **no implementation** unless explicitly approved.

### SSR vs SPA markup

- Server: EJS comps under `server/ejs/comp_*.ejs`.
- Client: string templates in `client/pages/demo/detailSpa.js`.
- **Direction:** SPA should render from the same comp models (`detail.album`, `detail.timeline`, …) via a thin client renderer or a server partial HTML endpoint — not re-parse SOA.

### Route patterns

- Server: regexes in `server/routes/demo.js`.
- Client: regexes in `client/pages/demo/index.js`.
- **Direction:** shared route manifest (e.g. `data/routes/demo.json`) consumed by both sides.

### SPA gaps to fix when unifying

| Issue | Notes |
|-------|--------|
| `#detail` id | SSR `comp_article_detail` uses `id="detail"`; static webpack demo HTML may not — SPA updates require that id |
| `data-role` | Use `imgerror` (registered plugin), not `img-error` in SPA strings |
| Nearby list | `demo.get()` returns `articleComponent`; SPA `detailSpa.js` references `nearbyArticleComponent` — may be empty in SPA |

### Optional shared route manifest (RFC sketch)

```json
{
  "detail": {
    "pattern": "^/demo/detail/([a-z]{2})/([0-9a-z-]+)/([0-9a-z-]+)/?$",
    "params": ["state", "zip", "prId"],
    "query": { "geoPath": "{state}/{zip}", "prId": 2 }
  }
}
```

Single file imported by server route registration and client `Router` config generation (build-time or shared module).

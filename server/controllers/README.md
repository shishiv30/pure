# server/controllers/

**Purpose:** Config-driven page/API data via BaseController hooks (`beforeGet`, `get`, `seo`, `preload`).

**Put here:** Route config modules (`demo.js`, `page.js`, …) and `configbase.js` contract.

**Do not put here:** Raw SOA field parsing (use `helpers/property.js` / `helpers/article.js`), Express `app.get` registration (`server/routes/`).

**Canonical docs:** [docs/listing-data-pipeline.md](../../docs/listing-data-pipeline.md), [docs/demo-tx-lifecycle.md](../../docs/demo-tx-lifecycle.md), [docs/folder-ownership.md](../../docs/folder-ownership.md).

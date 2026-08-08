# Folder ownership

What each top-level area may contain. Normative coding rules: [`.cursor/rules/project-standards.mdc`](../.cursor/rules/project-standards.mdc). Map catalog: [index.md](index.md).

| Folder | Owns | Must not contain |
|--------|------|------------------|
| `client/js/core/` | Runtime primitives (event, plugin, page, router, request, def, DOM hooks) | Page-specific business (demo detail fetch rules) |
| `client/js/plugins/` | One widget per `_name.js` (`data-role`) | Shared mapping of SOA data |
| `client/pages/<page>/` | Page settings + SPA glue for that page only | Generic helpers |
| `helpers/` | Pure transforms / shared contracts (geo, property, article, path, url, routes) | Express handlers, seed payloads |
| `helpers/routes/` | Shared route manifests (e.g. `demoSpaRoutes.js`) | HTTP handlers |
| `data/` | Seed/mock/default payloads only | Mapping logic |
| `server/routes/` | HTTP registration + thin adapters | Listing field mapping (`helpers/`), seed data (`data/`) |
| `server/controllers/` | `beforeGet` / `get` / `seo` / `preload` page configs | Raw SOA field parsing (use helpers) |
| `server/ejs/` | HTML only; consume mapped models | SOA parsing |
| `docs/` | Narrative maps | Executable logic |

When unsure: transforms → `helpers/`; seed shapes → `data/`; HTTP → `server/routes/`; page data assembly → `server/controllers/`; interactive DOM → `client/js/plugins/` or `client/pages/<page>/`.

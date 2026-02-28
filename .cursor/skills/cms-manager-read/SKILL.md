---
name: cms-manager-read
description: Read/fetch data from Pure CMS. Use when integrating CMS content, checking existing records, or working with CMS GET endpoints. Part of cms-manager.
---

# Fetch Data from Pure CMS (cms-manager-read)

Guide for **reading** data from the Pure CMS API. Use when integrating CMS content into pages, checking if records exist before update, or working with CMS GET endpoints. For create/update/delete, use **cms-manager** and `cms/API.md`.

## Base URL

- **Development**: `http://localhost:3003` (or `CMS_HOST` from env)
- **Production**: configured CMS domain

## Public (no auth)

- **Page content by name:** `GET /api/pages/content/:name` or `GET /api/pages/getPageContentByName?name=:name` → `{ name, data, type, meta }`
- **Comp by key:** `GET /api/comp/public/:key` → comp row (id, key, type, data)
- **Sitemap:** `GET /api/sitemap/public` → sitemap entries

## Authenticated (session cookie)

- **List pages:** `GET /api/pages` → pages array (admin: all; user: published)
- **Page by id:** `GET /api/pages/:id`
- **List comps:** `GET /api/comp` → comps array
- **Comp by key:** `GET /api/comp/:key`
- **Auth/me:** `GET /api/auth/me`

Use `credentials: 'include'` for fetch so cookies are sent. Responses: `{ code, message, data }`. Check existing before update (cms-manager workflow).

## References

- **`cms/API.md`** — full API; **cms-manager** — create/update/delete workflow.

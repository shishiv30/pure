---
name: property-listing-pipeline
description: When touching property listing, property detail, listing cards, or SOA Pure mapping, read the listing data pipeline doc first and follow metadata → article → EJS/plugin layers.
---

# Property listing pipeline

## When to use

- Changes to `server/controllers/property.js`, listing routes, SPA URL shapes (`helpers/routes/propertySpaRoutes.js`), or `/api/property/detail`
- `helpers/property.js`, `helpers/article.js`, `comp_article`, `comp_article_detail`
- Listing SPA (`client/pages/property/`, `detailSpa.js`)

## Required reading

Read **[`docs/listing-data-pipeline.md`](../../docs/listing-data-pipeline.md)** before editing.

## Rules (short)

1. SOA Pure → `mapSOADataToMetadata` (`helpers/property.js`)
2. UI comp models → `helpers/article.js` (`mapPropertyDetailToArticle`, `mapXToComp`)
3. EJS renders comp props only; optional `data-role` plugins
4. Controllers: no raw SOA after mapping; use `buildDetailSeo(detail)` for detail SEO
5. Tests: `helpers/__tests__/property.test.js`; run `npm run test`

Related skills: `create-comp` (Pattern C), `create-plugin`, `create-api` (§5 mappers).

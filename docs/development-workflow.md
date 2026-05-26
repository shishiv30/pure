# Development Workflow

## Daily Flow

1. Install dependencies: `npm install`
2. Start full local dev: `npm run dev`
3. Run tests before pushing: `npm run test`
4. Use docker path when needed: `npm run build-docker:dev`

## Command Map

### Core development

- `npm run dev` - webpack dev server + nodemon server
- `npm run dev:client` - client only (webpack dev server)
- `npm run dev:server` - server only
- `npm run build:dev` - webpack build + server together

### Build/release

- `npm run build:stage`
- `npm run deploy-gh`
- `npm run build:prod`
- `npm run start`

### Docker

- `npm run build-docker:dev`
- `npm run build-docker:prod`
- `npm run docker:run`

### Quality checks

- `npm run test`
- `npm run test:basecontroller`
- `npm run test:lighthouse`
- `npm run review`
- `npm run review:staged`

## Environment Resolution

Configured in `server/config.js`:

- development: `.env`, then `.env.local`
- stage: `.env.stage`
- production: `.env.production`

## Ports (defaults)

- App: `3000`
- Webpack dev server: `3001`
- Docker host port: `3002`
- CMS local app (separate project): `3003`

## Adding a listing-backed feature (demo pattern)

When changing property listings, detail sections, or SOA-backed article cards:

1. Read [`listing-data-pipeline.md`](listing-data-pipeline.md).
2. New SOA field → `mapSOADataToMetadata` in `helpers/property.js`.
3. Presentation → `mapXToComp` in `helpers/article.js`; wire in `mapPropertyDetailToArticle` or `mapPropertyToArticle`.
4. Template → `server/ejs/comp_*.ejs`; detail sections via `comp_article_detail.ejs`.
5. Interactive UI → plugin + matching `data-role` in EJS (and SPA if applicable).
6. Extend `helpers/__tests__/property.test.js`; run `npm run test`.

Demo controller: `server/controllers/demo.js`. Do not use raw SOA listing in templates after mapping.

## Notes

- `npm run lint` is currently a placeholder and is not an enforced gate.
- No Playwright/e2e; optional Lighthouse via `npm run test:lighthouse`.
- Current PR code-review workflow triggers on pull request `opened`.

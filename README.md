# Pure UI

Lightweight UI framework and server-rendered app built with pure JavaScript, SCSS, and Express.

## Source of Truth

This README is a practical entry point. For deeper internals, use:

- `client.md` for client architecture and plugin lifecycle.
- `server.md` for server routing/controller/data flow.
- `build-system.md` for webpack and build/deploy behavior.
- `cms/API.md` for CMS page/comp/theme update APIs.

## Quick Start

```bash
npm install
npm run dev
```

Local URLs:

- App server: `http://localhost:3000`
- Webpack dev server: `http://localhost:3001`
- Swagger docs: `http://localhost:3000/api-docs`

## Development Modes

### Full local dev

```bash
npm run dev
```

Runs webpack dev server and Node server together:

- `webpack-dev-server --config webpack.config.dev.js`
- `nodemon server/app.js`

### Client-only

```bash
npm run dev:client
```

### Server-only

```bash
npm run dev:server
```

### Dev build + server

```bash
npm run build:dev
```

Runs webpack build with `webpack.config.build.js` plus Node server concurrently.

## Environment Loading

Runtime env resolution is defined in `server/config.js`:

- `NODE_ENV=development`: load `.env`, then `.env.local` (override enabled).
- `NODE_ENV=stage`: load `.env.stage`.
- `NODE_ENV=production`: load `.env.production`.

Default ports when unset:

- Node `PORT`: `3000`
- Webpack dev server `WEBPACK_DEV_SERVER_PORT`: `3001`
- Docker host `DOCKER_PORT`: `3002`

## Docker

This repo uses Docker Compose helpers through `run-docker.sh`.

- Dev image + run (uses `.env`, no cache): `npm run build-docker:dev`
- Prod image + run (uses `.env.production`): `npm run build-docker:prod`
- Run existing image/container flow: `npm run docker:run`

Default Docker access URL: `http://localhost:3002`

## Build and Deploy

- Stage bundle: `npm run build:stage`
- Publish `dist` to GitHub Pages: `npm run deploy-gh`
- Production bundle: `npm run build:prod`

## Testing and Quality

- Test suite: `npm run test`
- BaseController tests only: `npm run test:basecontroller`
- Lighthouse flow: `npm run test:lighthouse`
- Lint script exists but is currently a placeholder in `package.json`.

AI review tooling:

- Uncommitted changes: `npm run review`
- Staged changes: `npm run review:staged`

GitHub workflow `.github/workflows/cursor-code-review.yml` currently triggers on pull request `opened` only.

## Project Structure

```text
.
├── client/
│   ├── js/
│   │   ├── core/
│   │   └── plugins/
│   ├── scss/
│   ├── pages/
│   └── components/
├── server/
│   ├── app.js
│   ├── config.js
│   ├── configs/
│   ├── controllers/
│   ├── routes/
│   ├── ejs/
│   ├── middleware/
│   └── utils/
├── data/
│   └── comps/
├── cms/
├── docs/
├── webpack.config*.js
└── package.json
```

## Current Webpack Page Entries

Defined in `webpack.config.base.page.js`:

- `animation`
- `demo`
- `index`
- `3d`
- `about`
- `document`
- `ai-trend`
- `lower`
- `presentation-slider`
- `list-view`

## Architecture Snapshot

- Client runtime is declarative: DOM nodes with `data-role` are discovered and initialized through `Page.refreshComponents()` and `Plugin`.
- Server rendering is config-driven through `BaseController` and `server/configs/*`.
- API layer combines app endpoints (`/api/*`) and SOA proxy routes (`/api/soa/*`).
- CMS content is consumed with fallback to local data when CMS health is unavailable.

## License

ISC

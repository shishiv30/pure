# Build System Documentation

## Overview

This project uses webpack for multi-page bundles and Express for server-rendered routes and APIs.

- Dev flow: webpack dev server + Node app run together.
- Build flow: webpack emits `dist/` assets for stage/prod, with optional server runtime.
- Page entries are declared in `webpack.config.base.page.js`.

## Core Config Files

- `webpack.config.base.js`: shared loaders/plugins and page plugin wiring.
- `webpack.config.base.page.js`: page entry list and per-page defaults.
- `webpack.config.dev.js`: local dev server, write-to-disk, proxy to Node.
- `webpack.config.build.js`: stage/prod/static build configuration.
- `server/config.js`: environment and port resolution used by webpack and server.

## Commands

### Development

```bash
npm run dev
```

- Starts webpack dev server and Node server concurrently.
- Uses `NODE_ENV=development`.

```bash
npm run dev:client
npm run dev:server
```

- Client-only / server-only variants.

### Build

```bash
npm run build:dev
```

- `NODE_ENV=development`
- Runs webpack build + Node server concurrently.

```bash
npm run build:stage
```

- `NODE_ENV=stage`
- Builds stage assets (commonly paired with `npm run deploy-gh`).

```bash
npm run build:prod
```

- `NODE_ENV=production`
- Generates production bundle.

### Deploy helper

```bash
npm run deploy-gh
```

- Publishes `dist/` to `gh-pages`.

## Docker Build Paths

- Dev/local: `npm run build-docker:dev` (loads `.env`, rebuilds without cache).
- Production: `npm run build-docker:prod` (loads `.env.production`).

Both run through `run-docker.sh` and Docker Compose.

## Dev Runtime Behavior

`webpack.config.dev.js` behavior:

- Serves from `dist/`.
- Writes generated assets to disk (`devMiddleware.writeToDisk = true`) so Node can serve them.
- Proxies non-asset requests to `config.appHost` (usually `http://localhost:3000`).

Default ports from `server/config.js` when env vars are absent:

- Node: `3000`
- Webpack dev server: `3001`
- Docker host mapped port: `3002`

## Page Entry Model

Entries are defined in `webpack.config.base.page.js`.

Current pages:

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

Each page defaults to:

- Entry: `./client/pages/<name>/index.js`
- Template: `./client/pages/<name>/index.html`
- Output file: `<name>.html`
- Favicon: `./client/assets/img/logo.png`

## Environment Loading

Handled by `server/config.js`:

- development -> `.env` then `.env.local` override
- stage -> `.env.stage`
- production -> `.env.production`

## Troubleshooting

- **Port conflicts**: confirm `PORT` and `WEBPACK_DEV_SERVER_PORT`.
- **Proxy mismatch**: verify `APP_HOST` and `WEBPACK_DEV_SERVER_HOST`.
- **Missing page output**: confirm page is listed in `webpack.config.base.page.js` and has `index.js` + `index.html`.
- **Asset path issues**: verify file exists and webpack loader handles the extension.

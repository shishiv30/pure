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

## Notes

- `npm run lint` is currently a placeholder and is not an enforced gate.
- Current PR code-review workflow triggers on pull request `opened`.

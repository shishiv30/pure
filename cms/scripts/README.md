# CMS Scripts

## Setup database

**`setup-db.js`** — Initialize CMS database (create tables, run migrations).

```bash
# From repo root
node cms/scripts/setup-db.js
# Or from cms/
npm run setup-db
```

**`setup-db.sh`** — Lightweight setup: create data dir and .env from .env.example.  
Start the CMS once to create the DB.

## Seed and sync

**`seed-and-sync.js`** — Seed local DB from data files and optionally sync to remote CMS.  
Replaces the server DB with local content (pages, comps, sitemap).

```bash
# From repo root
node cms/scripts/seed-and-sync.js [--local-only] [CMS_URL] [CMS_EMAIL] [CMS_PASSWORD]
```

- `--local-only` — Seed local DB only, do not sync to remote.
- **With credentials** — Seeds local DB, then syncs to remote via API.
- **Without credentials** — Seeds local DB only.

**Data sources:** `data/page/header.js` (pagePath), `data/page/*.js`, `data/theme.js`

## AWS / deployment

- `aws/sync-db-to-aws.sh` — Copy local DB file to EFS (requires ECS Exec).
- `aws/setup-*.sh` — ECS, ALB, DNS setup.
- `deploy-aws-ecr.sh` — Build and push Docker image.

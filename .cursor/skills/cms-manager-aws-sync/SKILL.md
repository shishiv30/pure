---
name: cms-manager-aws-sync
description: Sync local CMS data to AWS. Push pages and comps from local/seed to the AWS CMS via API. Part of cms-manager.
---

# Sync CMS data to AWS (cms-manager-aws-sync)

Push **local CMS data** (pages, comps) to the **AWS-hosted CMS** so the main site (e.g. App Runner) reads up-to-date content from the CMS.

## Workflow

1. **Seed local DB** from data files (`data/page/*.js`, themes, header, footer).
2. **Sync to remote** via CMS API (login, then POST/PUT pages and comps to the target URL).

## Command (from repo root)

```bash
CMS_URL=https://cms.conjeezou.com node cms/scripts/seed-and-sync.js
```

- **Script:** `cms/scripts/seed-and-sync.js`
- **Env:** `.env` then `.env.local`. Set `CMS_URL`, `CMS_EMAIL`, `CMS_PASSWORD` (e.g. in `.env.local`). Without `--local-only`, script syncs to `CMS_URL` after seeding.
- **Local only:** `node cms/scripts/seed-and-sync.js --local-only` — no sync to AWS.

## Optional: full DB copy to EFS

To overwrite the AWS CMS DB file with your local `cms/data/cms.db`: `./cms/scripts/aws/sync-db-to-aws.sh cms/data/cms.db`. Requires **ECS Exec** (and a task role). Prefer API sync when possible.

## References

- **`pure-aws-devops`** — ECS, ALB, EFS, ECR, CMS URL, ECS Exec gotchas.
- **`cms/scripts/seed-and-sync.js`** — seed + sync logic.

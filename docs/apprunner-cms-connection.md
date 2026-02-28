# App Runner: connecting to the CMS

The main site (www.conjeezou.com) runs on **AWS App Runner**. Pages like `/page/index` load content from the **Pure CMS** (cms.conjeezou.com). If you see a **500 error** on production but the same URL works locally, the cause is usually App Runner’s **CMS connection** (env or network).

## 1. Set `CMS_HOST` on App Runner

The server reads `process.env.CMS_HOST` (see `server/config.js`). If set, it fetches page and comp data from that base URL (e.g. `https://cms.conjeezou.com`).

- **In the image:** `.env.production` is copied into the image and loaded when `NODE_ENV=production`, so `CMS_HOST=https://cms.conjeezou.com` is used unless overridden.
- **On App Runner:** You can override env in the service. To rely on the file, do **not** set `CMS_HOST` in App Runner. If you do set it, use the real CMS URL:
  - **Correct:** `CMS_HOST=https://cms.conjeezou.com`
  - **Wrong:** empty, `http://localhost:3003`, or a typo.

To check or set in AWS Console:

1. App Runner → your service (e.g. **pure**) → **Configuration** → **Edit**.
2. Under **Configure service** → **Environment variables**, ensure `CMS_HOST` is either unset (so the image’s `.env.production` applies) or set to `https://cms.conjeezou.com`.

Via CLI:

```bash
aws apprunner describe-service --service-arn "$APP_ARN" --region us-east-1 \
  --query 'Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables'
```

## 2. Ensure the CMS is reachable

The main site calls the CMS over the **public** URL (e.g. `https://cms.conjeezou.com`). App Runner makes outbound HTTPS requests; no VPC link is required.

Check that:

- **CMS is up:** Open `https://cms.conjeezou.com/health` in a browser or `curl https://cms.conjeezou.com/health`.
- **DNS:** `cms.conjeezou.com` resolves to the CMS ALB (see `.cursor/skills/pure-aws-devops/SKILL.md` and Route 53).
- **ECS/ALB:** CMS service is running and the ALB target group is healthy (see skill: “ALB returns 503”).

If the CMS is down or unreachable, the app falls back to local data files (e.g. `data/page/index.js`). A 500 usually means an **exception** (e.g. bad response shape, or missing file in the container), not only “CMS unreachable”.

## 3. After changing env

If you add or change `CMS_HOST` (or any env) on the App Runner service:

1. Save the configuration.
2. Start a new deployment: **Deploy** → **Deploy** (or `aws apprunner start-deployment --service-arn "$APP_ARN" --region us-east-1`).

New instances will use the updated env.

## Summary

| Check | Action |
|-------|--------|
| 500 on `/page/index` (or similar) on AWS, OK locally | Confirm `CMS_HOST` on App Runner is unset or `https://cms.conjeezou.com`; confirm CMS is up and reachable. |
| Rely on `.env.production` | Do not set `CMS_HOST` in App Runner. |
| Override in production | Set `CMS_HOST=https://cms.conjeezou.com` in App Runner env. |

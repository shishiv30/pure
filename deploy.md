# Deploy NAS Pure on llmwikil.com (Cloudflare)

Status: **live**. Goal: ChatGPT and other AI fetchers can `GET https://llmwikil.com/llms.txt` (200, not 403). Search URLs after that are `/property/...` (see [`llms.txt`](llms.txt)).

## Already done in this repo / NAS

- Listing routes and files use `/property` (not `/demo`). Old `/demo` paths 301.
- NAS container `pure` listens on host **3002** (`http://172.17.0.1:3002` from Docker). `APP_HOST` and `CDN_HOST` are `https://llmwikil.com`.
- Quick Tunnel (`pure-tunnel` / `*.trycloudflare.com`) is stopped. Do not recreate it; it 403s AI agents.
- Named tunnel container `cloudflared-tunnel` is already running on the NAS. Do not create a second tunnel unless this Cloudflare account has no tunnels at all.
- LAN check (already 200 for curl, urllib, `ChatGPT-User`): `http://192.168.50.22:3002/llms.txt`

## Cloudflare setup (done 2026-10-21)

All in the account that owns the NAS tunnel. The dashboard moved Tunnels under **Networking → Tunnels** (not Zero Trust).

- Tunnel: `magewords-nas` (ID `80c27026-cede-4f9b-bca7-ff46baea2c9d`). This is the NAS `cloudflared-tunnel` container. It is token-managed, so routes live in the dashboard, not a config file on the NAS. `cloudflared-tunnel` shares the `mage-thesaurus` container's network, and `172.17.0.1:3002` is reachable from it.
- Routes (tunnel → **Routes** → Published application), both `http://172.17.0.1:3002`:
  - `llmwikil.com`
  - `www.llmwikil.com` (serves the site directly; no `www` → apex redirect, by choice: both hosts work)
- DNS: Cloudflare created the CNAMEs to `80c27026-cede-4f9b-bca7-ff46baea2c9d.cfargotunnel.com` automatically.
- SSL/TLS: **Full**. Origin is HTTP on 3002.
- Security → Settings: **Bot Fight Mode off**.
- **Browser integrity check stays on (intentional).** It returns 403 with `error code: 1010` to `Python-urllib` and similar user agents. Accepted: ChatGPT-User, GPTBot and browsers get 200. To allow urllib later, turn it off or add a configuration rule for `/llms.txt` and `/property/*`.
- Rules → Response Header Transform Rule **`CORS for static assets`**: sets `Access-Control-Allow-Origin: *` on `llmwikil.com` static files (`woff2 woff ttf css js svg png jpg jpeg webp ico`). Both `www.` and root pages load CSS and fonts from `https://llmwikil.com`, so `www` pages need this to load fonts. The app's own CORS list only allows `APP_HOST`, and Cloudflare caching ignores `Vary: Origin`, so a static `*` is used instead.

## Rebuild and redeploy on the NAS

Source copy: `~/pure` on the NAS (not a git repo; copy changed files over with `scp -O -P 88`). On the NAS, `sudo` needs the full path `/usr/local/bin/docker`.

Always pass `CDN_HOST` and `APP_HOST` as build args. Without them, webpack reads `.env.production` (`CDN_HOST=https://cdn.conjeezou.com`, which does not resolve) and bakes it into the CSS font URLs, so fonts break on both hosts. When both are `https://llmwikil.com`, assets use root-relative `/` paths.

```bash
cd ~/pure && sudo /usr/local/bin/docker build --target production --build-arg PORT=3000 --build-arg CDN_HOST=https://llmwikil.com --build-arg APP_HOST=https://llmwikil.com -t pure:<version> .
```

Then recreate the container with the same runtime env (`APP_HOST`/`CDN_HOST=https://llmwikil.com`, API domains, `SOA_API_KEY`), `--restart unless-stopped -p 3002:3000`. Check: `docker run --rm pure:<version> grep -o 'url([^)]*font[^)]*)' /app/dist/property.min.css` shows `/font.…` paths.

Current: `pure:1.0.3` (favicon fixed to `/images/favicon.ico`). `pure-1.0.1` is kept stopped for rollback.

## Verify

Expected: 200 for the first three, 403 (1010) for urllib. Body of `llms.txt` uses `/property/`, not `/demo/`.

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://llmwikil.com/llms.txt
curl -sS -A 'ChatGPT-User' -o /dev/null -w '%{http_code}\n' https://llmwikil.com/llms.txt
curl -sS -A 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)' -o /dev/null -w '%{http_code}\n' https://llmwikil.com/llms.txt
curl -sS -A 'Python-urllib/3.14' -o /dev/null -w '%{http_code}\n' https://llmwikil.com/property/sitemap
```

Fonts and favicon (CORS header must be `*`; favicon 200):

```bash
curl -sS -D - -o /dev/null -H 'Origin: https://www.llmwikil.com' https://llmwikil.com/font.Roboto-Regular.woff2 | grep -i access-control
curl -sS -o /dev/null -w '%{http_code}\n' https://llmwikil.com/images/favicon.ico
```

If DNS is NXDOMAIN, the route/CNAME is missing. If ChatGPT-User is 403/1010, check Bot Fight Mode, WAF rules and AI bot policies. If fonts fail only in one browser after a fix, it is the browser cache (assets are cached 4h); hard-reload.

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
- **Browser integrity check stays on site-wide**, but a Configuration Rule **`AI agents: skip browser integrity check`** turns it off for `(http.request.uri.path in {"/llms.txt" "/robots.txt"}) or starts_with(http.request.uri.path, "/property")`. Without the rule, `Python-urllib` and similar agents get 403 with `error code: 1010`. Rules → Configuration Rules → the rule → Browser Integrity Check: **Off** → Deploy.
- Rules → Response Header Transform Rule **`CORS for static assets`**: sets `Access-Control-Allow-Origin: *` on `llmwikil.com` static files (`woff2 woff ttf css js svg png jpg jpeg webp ico`). Both `www.` and root pages load CSS and fonts from `https://llmwikil.com`, so `www` pages need this to load fonts. The app's own CORS list only allows `APP_HOST`, and Cloudflare caching ignores `Vary: Origin`, so a static `*` is used instead.

## Rebuild and redeploy on the NAS

**One command:** `npm run deploy:nas` (next patch version) or `npm run deploy:nas -- 1.1.0`. It runs [`scripts/deploy-nas.sh`](scripts/deploy-nas.sh): syncs every tracked and untracked non-gitignored file (uncommitted changes included) to `~/pure`, builds with the build args below, recreates the container with its existing env, then checks llms.txt on both hosts and `/property/sitemap` for 200. Only if those pass, it removes old `pure:x.y.z` images, keeping the newest 3 (`KEEP_IMAGES`) and any image a container uses (the stopped rollback container `pure-1.0.1` keeps `pure:1.0.1`); `pure:latest` is left alone. Needs `NAS_HOST`, `NAS_USER`, `NAS_PASSWORD`, `NAS_SSH_PORT` in `.env.local` and `sshpass`. The manual steps below are what it does.

Source copy: `~/pure` on the NAS (not a git repo; copy changed files over with `scp -O -P 88`). On the NAS, `sudo` needs the full path `/usr/local/bin/docker`.

Always pass `CDN_HOST` and `APP_HOST` as build args. Without them, webpack reads `.env.production` (`CDN_HOST=https://cdn.conjeezou.com`, which does not resolve) and bakes it into the CSS font URLs, so fonts break on both hosts. When both are `https://llmwikil.com`, assets use root-relative `/` paths.

```bash
cd ~/pure && sudo /usr/local/bin/docker build --target production --build-arg PORT=3000 --build-arg CDN_HOST=https://llmwikil.com --build-arg APP_HOST=https://llmwikil.com -t pure:<version> .
```

Then recreate the container with the same runtime env (`APP_HOST`/`CDN_HOST=https://llmwikil.com`, API domains, `SOA_API_KEY`), `--restart unless-stopped -p 3002:3000`. Check: `docker run --rm pure:<version> grep -o 'url([^)]*font[^)]*)' /app/dist/property.min.css` shows `/font.…` paths.

Current: `pure:1.0.16` (real titles and descriptions on /property pages, intro text on sitemap pages; deploy turned llms.txt back on). 1.0.15: (deploy:nas now removes old images after the checks pass: keeps the newest 3 and any image a container uses). 1.0.14: test deploy. 1.0.13: (pagination under /property search results; router keeps a link's query). 1.0.12: (`sort=value`: lowest $/sqft first, ranked on the server; llms.txt defines "high value"). 1.0.11: (markdown sitemaps, `/property/{state}/{city}/schools.md`, `[agent]` request log, versioned page JS/CSS). 1.0.10: (markdown `.md` versions of /property search and detail pages; ChatGPT panel: drag-select and IME Enter fixes, shorter prompt). 1.0.9: llms.txt rewritten to the llmstxt.org v2 format. 1.0.8: first `deploy:nas` run. 1.0.7: llms.txt off returns 503, chat button prompt uses a fresh llms.txt URL. 1.0.6: chat button panel. `pure-1.0.1` is kept stopped for rollback. Container env also needs `LLMS_TOGGLE_KEY`.

### SOA data via the Mac proxy

The NAS cannot reach the `*.prod.aws.us-west-2.ojocore.com` SOA hosts directly. Listing data goes through `scripts/soa-reverse-proxy.js` on the Mac (`npm run soa-proxy:on`, port 8787). The container's five API domains point at it:

```
PROPERTY_API_DOMAIN=http://192.168.50.149:8787/property
GEOAREA_API_DOMAIN=http://192.168.50.149:8787/geoarea
SCHOOL_API_DOMAIN=http://192.168.50.149:8787/school
USER_API_DOMAIN=http://192.168.50.149:8787/user
POI_API_DOMAIN=http://192.168.50.149:8787/poi
```

The Mac must be on, on the LAN, with the proxy running. If the Mac's IP changes (check `ipconfig getifaddr en0`), recreate the container with the new IP; a DHCP reservation for the Mac avoids this. Test from the NAS: `sudo /usr/local/bin/docker exec pure wget -qS -O /dev/null http://192.168.50.149:8787/geoarea/` → `401` means the proxy and upstream are reachable.

## llms.txt on/off switch

When off, `/llms.txt` returns 503 with `Retry-After: 60` (not 404: ChatGPT's fetcher caches a 404 and keeps returning it after the switch is back on) and server-rendered pages drop the `Link`/`<link rel="describedby">` to it. Pages prebuilt at build time (`/`, `/about`) keep their `<link>`, which points at the 503. The chat button adds `?v=<timestamp>` to the llms.txt URL in its prompt, so ChatGPT always fetches a fresh copy. It takes effect immediately, with no restart. State is the flag file `/app/.llms-off` in the container. Recreating the container resets it to **on**.

- URL, from anywhere: `https://llmwikil.com/?llm=status` is public. `?llm=on` and `?llm=off` need the key `LLMS_TOGGLE_KEY` (in `.env.local` and in the container env). Wrong or missing key → 403.
  ```bash
  curl -H "X-Llms-Key: $LLMS_TOGGLE_KEY" 'https://llmwikil.com/?llm=off'
  ```
  In a browser: `https://llmwikil.com/?llm=off&key=<key>`. A key in the URL can end up in browser history and logs, so the header is safer.
- Command, on the NAS: `sudo /usr/local/bin/docker exec pure npm run llms:off`. The same works with `llms:on` and `llms:status`. Locally: `npm run llms:off`.

## Verify

Expected: 200 for all four. Body of `llms.txt` uses `/property/`, not `/demo/`.

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

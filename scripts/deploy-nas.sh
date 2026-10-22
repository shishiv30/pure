#!/usr/bin/env bash
# Deploy this checkout to the NAS (llmwikil.com): sync source, docker build, recreate the `pure` container.
#
#   npm run deploy:nas            # next patch version (pure:1.0.7 → pure:1.0.8)
#   npm run deploy:nas -- 1.1.0   # explicit version
#
# Needs NAS_HOST, NAS_USER, NAS_PASSWORD, NAS_SSH_PORT in .env.local, and sshpass (brew install sshpass).
# Syncs tracked + untracked, non-gitignored files (uncommitted changes included) into ~/pure on the NAS.
# The new container keeps the old one's runtime env. Recreating resets the llms.txt switch to on.
# After the live checks pass, old pure:x.y.z images are removed: the newest KEEP_IMAGES stay, plus
# any image a container still uses (the stopped rollback container pure-1.0.1 → pure:1.0.1).
# Non-version tags such as pure:latest are left alone.
set -euo pipefail
cd "$(dirname "$0")/.."

val() { grep -E "^$1=" .env.local | head -1 | cut -d= -f2-; }
HOST="$(val NAS_HOST)"
USER_="$(val NAS_USER)"
PORT="$(val NAS_SSH_PORT)"
export SSHPASS="$(val NAS_PASSWORD)"
for v in HOST USER_ PORT SSHPASS; do
	[ -n "${!v}" ] || { echo "Missing NAS_${v%_} in .env.local" >&2; exit 1; }
done
command -v sshpass >/dev/null || { echo "sshpass not found: brew install sshpass" >&2; exit 1; }

KEEP_IMAGES=3

SSH_OPTS=(-p "$PORT" -o StrictHostKeyChecking=no -o LogLevel=ERROR)
nas() { sshpass -e ssh "${SSH_OPTS[@]}" "$USER_@$HOST" "$@"; }
# Remote docker via sudo; the password comes in on stdin, never on the command line.
nas_docker() { printf '%s\n' "$SSHPASS" | nas "read -r PW; S(){ echo \"\$PW\" | sudo -S -p '' /usr/local/bin/docker \"\$@\"; }; $1"; }

CURRENT="$(nas_docker 'S inspect pure --format "{{.Config.Image}}" 2>/dev/null' | sed 's/^pure://' || true)"
if [ -n "${1:-}" ]; then
	VERSION="$1"
elif [[ "$CURRENT" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
	VERSION="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))"
else
	echo "Can't work out the next version from '${CURRENT:-none}'. Pass one: npm run deploy:nas -- 1.0.0" >&2
	exit 1
fi
echo "▶ Deploying pure:$VERSION to $HOST (running: pure:${CURRENT:-none})"

echo "▶ Syncing source to ~/pure"
git ls-files -co --exclude-standard -z |
	while IFS= read -r -d '' f; do [ -f "$f" ] && printf '%s\0' "$f"; done |
	COPYFILE_DISABLE=1 tar --no-xattrs --no-mac-metadata --null -T - -czf - |
	nas 'mkdir -p ~/pure && tar -xzf - -C ~/pure'

echo "▶ Building image (a few minutes)"
nas_docker "cd ~/pure && S build --target production --build-arg PORT=3000 \
	--build-arg CDN_HOST=https://llmwikil.com --build-arg APP_HOST=https://llmwikil.com \
	-t pure:$VERSION . 2>&1 | tail -2"

echo "▶ Recreating container"
nas_docker "set -e; umask 077; F=\$(mktemp)
	S inspect pure --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -v -e '^PATH=' -e '^NODE_VERSION=' -e '^YARN_VERSION=' -e '^\$' > \$F
	S rm -f pure >/dev/null
	S run -d --name pure --restart unless-stopped -p 3002:3000 --env-file \$F pure:$VERSION >/dev/null; rm -f \$F
	sleep 10; S ps --filter name=pure --format '{{.Names}} {{.Image}} {{.Status}}'
	S image prune -f >/dev/null"

echo "▶ Checking https://llmwikil.com"
fail=0
for url in https://llmwikil.com/llms.txt https://www.llmwikil.com/llms.txt https://llmwikil.com/property/sitemap; do
	code="$(curl -sS -A 'ChatGPT-User' -o /dev/null -w '%{http_code}' "$url" || echo 000)"
	echo "  $code $url"
	[ "$code" = 200 ] || fail=1
done
[ "$fail" = 0 ] || { echo "✘ Some checks failed; old images kept for rollback" >&2; exit 1; }
echo "✔ pure:$VERSION is live"

echo "▶ Removing old images (keeping newest $KEEP_IMAGES and any a container uses)"
nas_docker "IN_USE=\$(S ps -a --format '{{.Image}}')
	S images pure --format '{{.Tag}}' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\$' | sort -V | head -n -$KEEP_IMAGES |
	while read -r T; do
		if printf '%s\n' \"\$IN_USE\" | grep -qx \"pure:\$T\"; then echo \"  keep pure:\$T (used by a container)\"; continue; fi
		S rmi \"pure:\$T\" >/dev/null && echo \"  removed pure:\$T\"
	done
	S image prune -f >/dev/null
	echo \"  left: \$(S images pure --format '{{.Tag}}' | sort -V | tr '\n' ' ')\""

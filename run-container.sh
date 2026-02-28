#!/bin/bash

# Create and start a container from the existing image "pure" (no build).
# Loads env from .env.stage / .env.production (by NODE_ENV), then .env.local overrides.
# Run from repo root. Ensure the image exists first (e.g. npm run build-docker:dev or build-docker:prod).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load a .env-style file into the current shell (skip comments and empty lines)
load_env_file() {
	local file="$1"
	[[ ! -f "$file" ]] && return
	while IFS= read -r line || [[ -n "$line" ]]; do
		line="${line%%#*}"
		line="${line#"${line%%[![:space:]]*}"}"
		line="${line%"${line##*[![:space:]]}"}"
		[[ -z "$line" ]] && continue
		if [[ "$line" == *=* ]]; then
			export "$line"
		fi
	done < "$file"
}

NODE_ENV=${NODE_ENV:-development}

if [[ "$NODE_ENV" = "production" ]]; then
	load_env_file "$SCRIPT_DIR/.env.production"
elif [[ "$NODE_ENV" = "stage" ]]; then
	load_env_file "$SCRIPT_DIR/.env.stage"
else
	load_env_file "$SCRIPT_DIR/.env.stage"
	NODE_ENV=development
fi
load_env_file "$SCRIPT_DIR/.env.local"

PORT=${PORT:-3000}
DOMAIN=${DOMAIN:-localhost}
DOCKER_PORT=${DOCKER_PORT:-3002}
CDN_HOST=${CDN_HOST:-"http://${DOMAIN}:${DOCKER_PORT}"}
[[ "$NODE_ENV" = "development" ]] && CDN_HOST="http://localhost:${DOCKER_PORT}"

echo "🚀 Creating container from image pure (no build)"
echo "📡 NODE_ENV: $NODE_ENV | PORT: $PORT | DOCKER_PORT: $DOCKER_PORT | CDN_HOST: $CDN_HOST"
echo ""

export NODE_ENV
export PORT
export DOCKER_PORT
export CDN_HOST

# Use existing image; do not build (pass vars so compose substitution works)
PORT="$PORT" DOCKER_PORT="$DOCKER_PORT" CDN_HOST="$CDN_HOST" NODE_ENV="$NODE_ENV" docker compose up -d --no-build

echo ""
echo "✅ Container started from image pure"
echo "🌐 App: http://localhost:$DOCKER_PORT | API docs: http://localhost:$DOCKER_PORT/api-docs"

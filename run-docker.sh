#!/bin/bash

# Pure UI Docker Runner Script
# Loads port and config from .env / .env.stage / .env.production (by NODE_ENV), then .env.local overrides.

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

# NODE_ENV decides which env file to load: development | stage (GitHub) | production (AWS)
NODE_ENV=${NODE_ENV:-development}

if [[ "$NODE_ENV" = "production" ]]; then
	load_env_file "$SCRIPT_DIR/.env.production"
elif [[ "$NODE_ENV" = "stage" ]]; then
	load_env_file "$SCRIPT_DIR/.env.stage"
else
	# build-docker:dev: base from .env.stage then .env.local overrides
	load_env_file "$SCRIPT_DIR/.env.stage"
	NODE_ENV=development
fi
load_env_file "$SCRIPT_DIR/.env.local"

# Defaults only when not set by env files. All envs: host 3002 (DOCKER_PORT), Node listener 3000 (PORT).
PORT=${PORT:-3000}
DOMAIN=${DOMAIN:-localhost}
SESSION_SECRET=${SESSION_SECRET:-dev-session-secret-change-in-production}
SOA_API_DOMAIN=${SOA_API_DOMAIN:-}
DOCKER_PORT=${DOCKER_PORT:-3002}
DOCKER_BUILD_TARGET=${DOCKER_BUILD_TARGET:-$([ "$NODE_ENV" = "development" ] && echo "development" || echo "production")}
# stage and production both use production Docker target
CDN_HOST=${CDN_HOST:-"http://${DOMAIN}:${DOCKER_PORT}"}
# build-docker:dev: force CDN_HOST to host port so container uses http://localhost:3002 (not PORT 3000)
[[ "$NODE_ENV" = "development" ]] && CDN_HOST="http://localhost:${DOCKER_PORT}"

echo "🚀 Starting Pure UI Docker Container"
echo "📡 Environment: $NODE_ENV"
echo "📡 Docker build target: $DOCKER_BUILD_TARGET (development → build:dev, production → start)"
echo "📡 Docker Port: $DOCKER_PORT"
echo "🔧 Server Port: $PORT"
echo "🌐 Domain: $DOMAIN"
echo "🔗 SOA API: $SOA_API_DOMAIN"
if [ -n "$CDN_HOST" ]; then
    echo "☁️  CDN URL: $CDN_HOST"
fi
echo ""

# Export environment variables for docker-compose (must be before build so target is set)
export NODE_ENV
export PORT
export DOCKER_PORT
export CDN_HOST
export DOCKER_BUILD_TARGET

# Stop existing containers and remove the previous image so only one image exists
docker compose down 2>/dev/null
docker rmi pure:latest 2>/dev/null || true
docker image prune -f 2>/dev/null || true

# For development, always rebuild with no cache to ensure latest code
if [ "$NODE_ENV" = "development" ]; then
	echo "🔄 Development mode: Rebuilding Docker image with no cache..."
	docker compose build --no-cache
else
	docker compose build
fi
# Prune dangling images so only the current pure image remains
docker image prune -f 2>/dev/null || true

# Start with docker compose; pass CDN_HOST so compose substitution uses script value (not project .env)
CDN_HOST="$CDN_HOST" docker compose up -d

echo ""
echo "✅ Container started successfully!"
echo "🌐 Access your app at: http://localhost:$DOCKER_PORT"
echo "📚 API docs at: http://localhost:$DOCKER_PORT/api-docs"
echo ""
echo "🔧 Configuration loaded from environment variables:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PORT: $PORT"
echo "  - DOMAIN: $DOMAIN"
echo "  - SOA_API_DOMAIN: $SOA_API_DOMAIN"
echo ""
echo "💡 Port Configuration:"
echo "  - Docker external port: $DOCKER_PORT (localhost:$DOCKER_PORT)"
echo "  - Container internal port: $PORT (internal container port)"
echo "  - Local dev uses: localhost:3000 (no conflict)"
echo ""
echo "💡 To override settings, set environment variables:"
echo "  NODE_ENV=production DOCKER_PORT=8080 ./run-docker.sh"
echo "  # This will use production config and map to port 8080"
echo ""
echo "💡 To avoid conflicts with local development:"
echo "  - Local dev (npm run dev): uses localhost:3000"
echo "  - Docker: uses localhost:3002 (mapped from internal port 3000)"
echo "  - CDN_HOST: automatically set to localhost:3002 for Docker"
echo ""
echo "📝 Config loaded from: .env / .env.stage / .env.production (by NODE_ENV), then .env.local (overrides)"
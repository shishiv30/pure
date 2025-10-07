#!/bin/bash

# Pure UI Docker Runner Script
# This script loads configuration from environment variables
# and uses the same defaults as server/config.js

# Load environment variables (same as server/config.js)
# These will be loaded from .env or .env.production based on NODE_ENV
NODE_ENV=${NODE_ENV:-development}

# Server configuration - use different ports to avoid conflicts with local dev
# Local dev uses 3000, so Docker uses 3001 for internal and 3002 for external
PORT=3003
DOMAIN=${DOMAIN:-localhost}
SESSION_SECRET=${SESSION_SECRET:-dev-session-secret-change-in-production}

# API configuration
SOA_API_DOMAIN=${SOA_API_DOMAIN:-}

# Docker-specific configuration - use different ports to avoid conflicts
DOCKER_PORT=3002

# Set CDN_URL to use Docker port for static assets (only if not already set)
# This ensures Docker serves assets from port 3002 while local dev uses 3000
CDN_URL=${CDN_URL:-"http://${DOMAIN}:${DOCKER_PORT}"}

echo "🚀 Starting Pure UI Docker Container"
echo "📡 Environment: $NODE_ENV"
echo "📡 Docker Port: $DOCKER_PORT"
echo "🔧 Server Port: $PORT"
echo "🌐 Domain: $DOMAIN"
echo "🔗 SOA API: $SOA_API_DOMAIN"
if [ -n "$CDN_URL" ]; then
    echo "☁️  CDN URL: $CDN_URL"
fi
echo ""

# Stop existing containers
docker compose down 2>/dev/null

# For development, always rebuild with no cache to ensure latest code
if [ "$NODE_ENV" = "development" ]; then
	echo "🔄 Development mode: Rebuilding Docker image with no cache..."
	docker compose build --no-cache
fi

# Export environment variables for docker-compose
export PORT
export DOCKER_PORT
export CDN_URL

# Start with docker compose, passing environment variables
docker compose up -d

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
echo "  - Docker: uses localhost:3002 (mapped from internal port 3001)"
echo "  - CDN_URL: automatically set to localhost:3002 for Docker"
echo ""
echo "📝 Environment files supported:"
echo "  - .env (development)"
echo "  - .env.production (production)"
echo "  - .env.local (local overrides)"
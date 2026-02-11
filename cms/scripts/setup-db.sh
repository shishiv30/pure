#!/usr/bin/env bash
# CMS database setup (lightweight).
# Creates data directory and .env from .env.example if missing.
# Run from repo root: ./cms/scripts/setup-db.sh
# Or from cms/:   ./scripts/setup-db.sh
#
# After this, start the server once (npm run dev) to create the SQLite DB and tables.
# For explicit DB init (requires npm install): npm run setup-db

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CMS_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_DIR="$CMS_ROOT/data"
ENV_FILE="$CMS_ROOT/.env"
ENV_EXAMPLE="$CMS_ROOT/.env.example"

cd "$CMS_ROOT"

if [ ! -d "$DATA_DIR" ]; then
	mkdir -p "$DATA_DIR"
	echo "Created directory: $DATA_DIR"
else
	echo "Data directory exists: $DATA_DIR"
fi

if [ ! -f "$ENV_FILE" ]; then
	if [ -f "$ENV_EXAMPLE" ]; then
		cp "$ENV_EXAMPLE" "$ENV_FILE"
		echo "Created .env from .env.example. Please set SESSION_SECRET."
	else
		echo "Warning: .env.example not found. Create .env with SESSION_SECRET and DB_PATH=./data/cms.db"
	fi
else
	echo ".env already exists."
fi

echo ""
echo "Next: set SESSION_SECRET in cms/.env, then start the CMS to create the database:"
echo "  cd cms && npm install && npm run dev"
echo "Or to only init the DB (after npm install): npm run setup-db"

#!/usr/bin/env bash
# Checks that GitHub repo secrets and variables for the AWS ECR workflow are configured.
# Run from repo root. Requires: gh (GitHub CLI), authenticated via gh auth login.
# Usage: ./scripts/check-github-ecr-config.sh [owner/repo]

set -e

REPO="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v gh &>/dev/null; then
  echo "Error: GitHub CLI (gh) is required. Install: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Error: Not authenticated with GitHub CLI. Run: gh auth login"
  exit 1
fi

# Resolve repo: use arg, or infer from git remote
if [ -n "$REPO" ]; then
  GH_REPO="$REPO"
else
  REMOTE="$(git config --get remote.origin.url 2>/dev/null || true)"
  if [ -z "$REMOTE" ]; then
    echo "Error: Not a git repo or no origin remote. Specify owner/repo as argument."
    exit 1
  fi
  if [[ "$REMOTE" =~ github\.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
    GH_REPO="${BASH_REMATCH[1]}/${BASH_REMATCH[2]}"
  else
    echo "Error: Could not infer GitHub repo from remote. Specify owner/repo as argument."
    exit 1
  fi
fi

echo "Checking GitHub Actions config for: $GH_REPO"
echo ""

# Fetch secrets and variables (names only for secrets; names + values for variables)
SECRET_NAMES="$(gh secret list --repo "$GH_REPO" --json name --jq '.[].name' 2>/dev/null || echo "")"
VAR_LIST="$(gh variable list --repo "$GH_REPO" --json name,value --jq '.[] | "\(.name)|\(.value)"' 2>/dev/null || echo "")"

# Required secrets for ECR workflow
REQUIRED_SECRETS=("AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY")

# Required variables
REQUIRED_VARS=("AWS_ECR_ENABLED")

# Optional variables (informational only)
OPTIONAL_VARS=("AWS_REGION" "ECR_REPOSITORY")

has_secret() {
  echo "$SECRET_NAMES" | grep -Fx "$1" &>/dev/null
}

get_var() {
  echo "$VAR_LIST" | grep "^$1|" | cut -d'|' -f2-
}

# Check secrets
FAILED=0
echo "Secrets:"
for name in "${REQUIRED_SECRETS[@]}"; do
  if has_secret "$name"; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name (missing)"
    FAILED=1
  fi
done
echo ""

# Check required variables
echo "Variables (required):"
for name in "${REQUIRED_VARS[@]}"; do
  val="$(get_var "$name")"
  if [ -n "$val" ]; then
    echo "  ✓ $name = $val"
    if [ "$name" = "AWS_ECR_ENABLED" ] && [ "$val" != "true" ]; then
      echo "    (workflow runs only when AWS_ECR_ENABLED=true)"
    fi
  else
    echo "  ✗ $name (missing)"
    FAILED=1
  fi
done
echo ""

# Optional variables
echo "Variables (optional):"
for name in "${OPTIONAL_VARS[@]}"; do
  val="$(get_var "$name")"
  if [ -n "$val" ]; then
    echo "  ✓ $name = $val"
  else
    echo "  - $name (not set, using default)"
  fi
done
echo ""

if [ $FAILED -eq 0 ]; then
  echo "All required secrets and variables are configured."
  exit 0
else
  echo "Some required items are missing. Add them in:"
  echo "  https://github.com/$GH_REPO/settings/secrets/actions"
  echo "See docs/aws-ecr-setup.md for setup instructions."
  exit 1
fi

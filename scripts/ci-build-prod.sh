#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ]; then
  echo "PROD build refused for branch '$BRANCH'"
  exit 0
fi

export CLOUDFLARE_ENV="prod"
echo "Building Sisters with Mirrors PROD"
npm ci
npm run build:prod

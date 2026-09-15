#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ -n "$BRANCH" ] && [ "$BRANCH" != "dev" ]; then
  echo "DEV build refused for branch '$BRANCH'"
  exit 0
fi

export CLOUDFLARE_ENV="dev"
echo "Building Sisters with Mirrors DEV"
if [ "${WORKERS_CI:-}" != "1" ]; then
  npm ci
fi
npm run build:dev

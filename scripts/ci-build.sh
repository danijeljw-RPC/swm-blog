#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ "$BRANCH" = "main" ]; then
  npm run build:prod
else
  npm run build:dev
fi

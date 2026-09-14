#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ "$BRANCH" = "main" ]; then
  ENV="production"
else
  ENV="development"
fi

echo "Deploying branch '$BRANCH' with env '$ENV'"
npx wrangler versions upload --env "$ENV"

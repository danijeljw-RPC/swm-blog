#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ -n "$BRANCH" ] && [ "$BRANCH" != "dev" ]; then
  echo "DEV deploy refused for branch '$BRANCH'"
  exit 0
fi

CONFIG="dist/server/wrangler.json"
node -e '
  const fs = require("node:fs");
  const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const d1 = config.d1_databases?.find((item) => item.binding === "SUBMISSIONS_DB");
  const session = config.kv_namespaces?.find((item) => item.binding === "SESSION");
  if (config.name !== "swm-blog-dev" || d1?.database_id !== "f73f4f7b-6b95-4ed3-8f2b-bfd990abf8f1" || session?.id !== "f4302848b90b4fdf8d6ba56853dfc59e") {
    throw new Error("DEV generated Wrangler configuration does not match the DEV deployment contract");
  }
' "$CONFIG"

echo "Deploying Sisters with Mirrors DEV"
npx wrangler deploy --config "$CONFIG"

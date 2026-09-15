#!/usr/bin/env bash
set -euo pipefail

BRANCH="${WORKERS_CI_BRANCH:-}"

if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ]; then
  echo "PROD deploy refused for branch '$BRANCH'"
  exit 0
fi

CONFIG="dist/server/wrangler.json"
node -e '
  const fs = require("node:fs");
  const config = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const d1 = config.d1_databases?.find((item) => item.binding === "SUBMISSIONS_DB");
  const session = config.kv_namespaces?.find((item) => item.binding === "SESSION");
  if (config.name !== "swm-blog-prod" || d1?.database_id !== "47fdbd25-5492-4159-ac6b-983fbdc9f2ac" || session?.id !== "cb5f9a0f24c04863a87ca076854aa2c5") {
    throw new Error("PROD generated Wrangler configuration does not match the PROD deployment contract");
  }
' "$CONFIG"

echo "Deploying Sisters with Mirrors PROD"
npx wrangler deploy --config "$CONFIG"

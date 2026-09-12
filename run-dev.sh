#!/usr/bin/env bash

set -eou pipefail

npx astro dev stop
rm -rf node_modules
npm ci
npm run check
npm run build:dev
npm run dev

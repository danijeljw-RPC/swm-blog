#!/usr/bin/env bash

set -eou pipefail

npx astro dev stop
rm -rf node_modules
npm ci
npm run update:locations
npm run check
npm test
npm run build:dev
npm run dev

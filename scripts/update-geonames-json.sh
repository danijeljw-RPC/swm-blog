#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIRECTORY="$(cd "$SCRIPT_DIRECTORY/.." && pwd)"
TARGET_DIRECTORY="$PROJECT_DIRECTORY/public/data/locations"
GEONAMES_BASE_URL="https://download.geonames.org/export/dump"
WORK_DIRECTORY="$(mktemp -d "${TMPDIR:-/tmp}/swm-geonames.XXXXXX")"

cleanup() {
  rm -rf "$WORK_DIRECTORY"
}
trap cleanup EXIT

for command in curl unzip node; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

echo "Downloading GeoNames source files..."
curl --fail --location --retry 3 --retry-all-errors \
  --output "$WORK_DIRECTORY/cities500.zip" \
  "$GEONAMES_BASE_URL/cities500.zip"
unzip -q -o "$WORK_DIRECTORY/cities500.zip" -d "$WORK_DIRECTORY"

curl --fail --location --retry 3 --retry-all-errors \
  --output "$WORK_DIRECTORY/admin1CodesASCII.txt" \
  "$GEONAMES_BASE_URL/admin1CodesASCII.txt"
curl --fail --location --retry 3 --retry-all-errors \
  --output "$WORK_DIRECTORY/countryInfo.txt" \
  "$GEONAMES_BASE_URL/countryInfo.txt"

STAGED_DIRECTORY="$WORK_DIRECTORY/location-library"
node "$SCRIPT_DIRECTORY/lib/build-location-library.mjs" \
  "$WORK_DIRECTORY/cities500.txt" \
  "$WORK_DIRECTORY/admin1CodesASCII.txt" \
  "$WORK_DIRECTORY/countryInfo.txt" \
  "$STAGED_DIRECTORY"

rm -rf "$TARGET_DIRECTORY"
mkdir -p "$(dirname "$TARGET_DIRECTORY")"
mv "$STAGED_DIRECTORY" "$TARGET_DIRECTORY"

echo "Updated static location library at $TARGET_DIRECTORY"
echo "Temporary downloads were removed. Review with: git status --short"

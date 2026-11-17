#!/usr/bin/env bash
# Downloads the offline basemap: OpenStreetMap vector tiles for Germany (plus a 10 km margin) up to
# zoom 9, as one PMTiles file. It extracts only that area from the latest daily Protomaps planet build
# via HTTP range requests, so the ~140 GB planet file is never downloaded.
#
# Size (measured 2026-11-17, clipped to scripts/map/germany-outline.geojson):
#   z9 47 MB (default) · z10 130 MB · z11 301 MB
# z9 keeps data + map under the 200 MB zipped budget with room to spare. When online, the app uses a
# full-detail map instead (see README, "Map").
#
# Requires the pmtiles CLI: `brew install pmtiles`
# (or a binary from https://github.com/protomaps/go-pmtiles/releases).
#
# Usage: bash scripts/map/download-map.sh [maxzoom] [output-file]
set -euo pipefail

MAXZOOM="${1:-9}"
OUT="${2:-data/map/germany-z${MAXZOOM}.pmtiles}"
REGION="$(dirname "$0")/germany-outline.geojson"

if ! command -v pmtiles >/dev/null 2>&1; then
  echo "pmtiles CLI not found. Install it with: brew install pmtiles" >&2
  exit 1
fi

# Daily builds are kept for a limited time only, so pick the newest one.
BUILD=$(curl -fsS https://build-metadata.protomaps.dev/builds.json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const b=JSON.parse(s);console.log(b[b.length-1].key)})')

mkdir -p "$(dirname "$OUT")"
echo "Extracting Germany (z0-$MAXZOOM) from https://build.protomaps.com/$BUILD into $OUT ..."
pmtiles extract "https://build.protomaps.com/$BUILD" "$OUT" --region="$REGION" --maxzoom="$MAXZOOM"
echo "$BUILD" > "${OUT%.pmtiles}.build.txt"
pmtiles show "$OUT" | head -20

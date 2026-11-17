#!/usr/bin/env bash
# Trims the INKAR 2025 full export (434 MB zip, 6.8 GB CSV, ~69 million rows) to what
# germany-view uses: districts (Kreise), states (Bundesländer), Germany (Bund) and East/West.
#
# The trim is lossless for those levels; it only restructures the file:
#   inkar_indicators.csv    ID;Bereich;Kuerzel;Indikator           (one row per indicator)
#   inkar_regions.csv       Raumbezug;Kennziffer;Name              (one row per region)
#   inkar_observations.csv  ID;Level;Kennziffer;Zeitbezug;Wert     (Level: K, L, B or WO)
#
# Source: BBSR Bonn 2025, INKAR (dl-de/by-2-0). Modified by germany-view: rows outside the
# four levels above removed, columns split into three files. Values are unchanged
# (semicolon separated, decimal comma, as published).
#
# Usage: bash scripts/trim/inkar.sh <inkar_2025.zip> <output-dir>
set -euo pipefail

ZIP="$1"
OUT="$2"
mkdir -p "$OUT"

unzip -p "$ZIP" inkar_2025.csv | LC_ALL=C awk -F';' -v out="$OUT" '
  BEGIN {
    lvl["Kreise"] = "K"; lvl["Bundesländer"] = "L"; lvl["Bund"] = "B"; lvl["West-Ost"] = "WO"
    ind = out "/inkar_indicators.csv"; reg = out "/inkar_regions.csv"; obs = out "/inkar_observations.csv"
    print "ID;Bereich;Kuerzel;Indikator" > ind
    print "Raumbezug;Kennziffer;Name" > reg
    print "ID;Level;Kennziffer;Zeitbezug;Wert" > obs
  }
  NR == 1 { next }
  ($5 in lvl) {
    if (!($2 in seenInd)) { seenInd[$2] = 1; print $2 ";" $1 ";" $3 ";" $4 > ind }
    key = lvl[$5] ";" $6
    if (!(key in seenReg)) { seenReg[key] = 1; print lvl[$5] ";" $6 ";" $7 > reg }
    print $2 ";" lvl[$5] ";" $6 ";" $8 ";" $9 > obs
  }
'

# The overview of indicators (definitions, units, sources) is small: keep it as published.
unzip -p "$ZIP" "Indikatoren*bersicht (INKAR 2025).xlsx" > "$OUT/inkar_indicator_overview.xlsx" 2>/dev/null \
  || unzip -o -j "$ZIP" '*Indikatoren*.xlsx' -d "$OUT"

wc -l "$OUT"/inkar_*.csv

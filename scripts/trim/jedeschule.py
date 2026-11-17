"""Trims the jedeschule.de weekly CSV dump (~50 MB, ~40,000 schools) to the columns germany-view uses.

Removed:
  - personal and contact data: email, phone, fax, director (head teacher's name). germany-view
    describes places, not people, and doesn't need ways to contact a school.
  - `raw` (the state's original record as JSON, duplicating the other columns) and `location`
    (the coordinates again, as PostGIS WKB hex).
Kept: id, name, address, address2, zip, city, website, school_type, legal_status, provider,
longitude, latitude, state, update_timestamp.

Source: jedeschule.de (Open Knowledge Foundation Deutschland / Code for Germany), scraped from the
16 state school registers. Licence: check https://jedeschule.codefor.de before shipping.
Modified by germany-view as above.

Usage: python3 -I scripts/trim/jedeschule.py <jedeschule-data-*.csv> <out.csv>
"""
import csv
import sys

csv.field_size_limit(sys.maxsize)
src, out = sys.argv[1], sys.argv[2]

KEEP = ["id", "name", "address", "address2", "zip", "city", "website", "school_type",
        "legal_status", "provider", "longitude", "latitude", "state", "update_timestamp"]

n = 0
with open(src, encoding="utf-8", newline="") as f, open(out, "w", encoding="utf-8", newline="") as g:
    r = csv.DictReader(f)
    w = csv.writer(g, lineterminator="\n")
    w.writerow(KEEP)
    for row in r:
        w.writerow([row.get(c, "") for c in KEEP])
        n += 1
print(f"{n} schools -> {out}")

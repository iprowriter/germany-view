"""Trims the Unfallatlas accident locations for one year (~42 MB CSV, ~273,000 accidents with
personal injury, all 16 states) to the columns germany-view uses.

Removed: LINREFX/LINREFY (the same location in EPSG:25832, duplicating the WGS84 columns) and
PLST (plausibility flag). WGS84 coordinates are rounded to 6 decimals (~10 cm), which is far
below the accuracy of the published location. Decimal commas become points.
Kept: the accident ID, state/district/municipality key parts, year, month, hour, weekday,
category (severity), kind, type, light and road condition, who was involved, lon, lat.

Source: Statistische Ämter des Bundes und der Länder, Unfallatlas (dl-de/by-2-0).
Modified by germany-view as above.

Usage: python3 -I scripts/trim/unfallatlas.py <Unfallorte_YYYY_CSV.zip> <out.csv>
"""
import csv
import io
import sys
import zipfile

src, out = sys.argv[1], sys.argv[2]

DROP = {"LINREFX", "LINREFY", "PLST"}
COORDS = {"XGCSWGS84", "YGCSWGS84"}

with zipfile.ZipFile(src) as z:
    name = next(n for n in z.namelist() if n.lower().endswith(".csv"))
    with z.open(name) as raw, open(out, "w", encoding="utf-8", newline="") as g:
        r = csv.reader(io.TextIOWrapper(raw, encoding="utf-8-sig"), delimiter=";")
        header = next(r)
        keep = [i for i, c in enumerate(header) if c not in DROP]
        coord = {i for i, c in enumerate(header) if c in COORDS}
        w = csv.writer(g, delimiter=";", lineterminator="\n")
        w.writerow([header[i] for i in keep])
        n = 0
        for row in r:
            w.writerow([f"{float(row[i].replace(',', '.')):.6f}" if i in coord else row[i] for i in keep])
            n += 1
print(f"{n} accidents -> {out}")

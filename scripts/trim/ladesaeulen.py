"""Trims the Bundesnetzagentur Ladesäulenregister CSV (~58 MB) to the columns germany-view uses.

Removed: the 10-line preamble, the per-plug EVSE IDs and public keys (most of the file's size),
address details below postcode level, and opening-hours detail strings. Kept: one row per
charging site with operator, status, type, number of points, power, commissioning date,
postcode, place, district, state, coordinates, payment systems, and plug type + power per point.

Output is UTF-8 (the source is ISO-8859-1), semicolon separated, decimal comma, as published.

Source: Bundesnetzagentur, Ladesäulenregister (CC BY 4.0). Modified by germany-view as above.

Usage: python3 -I scripts/trim/ladesaeulen.py <Ladesaeulenregister.csv> <out.csv>
"""
import csv
import sys

src, out = sys.argv[1], sys.argv[2]

KEEP = [
    "Ladeeinrichtungs-ID", "Betreiber", "Status", "Art der Ladeeinrichtung", "Anzahl Ladepunkte",
    "Nennleistung Ladeeinrichtung [kW]", "Inbetriebnahmedatum", "Postleitzahl", "Ort",
    "Kreis/kreisfreie Stadt", "Bundesland", "Breitengrad", "Längengrad", "Bezahlsysteme",
]
KEEP += [f"{name}{i}" for i in range(1, 7) for name in ("Steckertypen", "Nennleistung Stecker")]

with open(src, encoding="latin-1", newline="") as f:
    rows = csv.reader(f, delimiter=";")
    for row in rows:
        if row and row[0] == "Ladeeinrichtungs-ID":
            header = row
            break
    else:
        sys.exit("header row not found")
    idx = [header.index(c) for c in KEEP]
    n = 0
    with open(out, "w", encoding="utf-8", newline="") as g:
        w = csv.writer(g, delimiter=";", lineterminator="\n")
        w.writerow(KEEP)
        for row in rows:
            if not row or not row[0].strip():
                continue
            row += [""] * (len(header) - len(row))
            w.writerow([row[i] for i in idx])
            n += 1
print(f"{n} charging sites -> {out}")

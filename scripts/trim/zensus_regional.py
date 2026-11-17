"""Trims the Zensus 2022 regional tables (Regionaltabelle_*.xlsx, ~61 MB, all ~10,800
municipalities) to the levels germany-view uses: Germany, states and districts.

From each workbook only the machine-readable "CSV-*" sheets are kept (the layout sheets hold
the same numbers with formatting). Rows whose `Regionalebene` (or `Reg_Ebene`) is "Gemeinde" (or any other
sub-district level) are dropped. Values are unchanged, including special characters such as
"–" or "/" (see "Erläuterungen zur Methodik" in the source workbook).

Output: one UTF-8 CSV per sheet, semicolon separated, named <workbook>__<sheet>.csv.

Source: Statistisches Bundesamt (Destatis), Zensus 2022 (dl-de/by-2-0). Modified by
germany-view as above.

Usage: python -I scripts/trim/zensus_regional.py <out-dir> <Regionaltabelle_*.xlsx>...
Needs openpyxl.
"""
import csv
import os
import re
import sys

import openpyxl

KEEP_LEVELS = {
    "Bund (mit Deutschen im Ausland)",
    "Bund (ohne Deutsche im Ausland)",
    "Deutsche im Ausland",
    "Bund",
    "Land",
    "Stadtkreis/kreisfreie Stadt/Landkreis",
}

out_dir = sys.argv[1]
os.makedirs(out_dir, exist_ok=True)

for path in sys.argv[2:]:
    base = re.sub(r"\.xlsx$", "", os.path.basename(path))
    wb = openpyxl.load_workbook(path, read_only=True)
    for name in wb.sheetnames:
        if not name.startswith("CSV-"):
            continue
        rows = wb[name].iter_rows(values_only=True)
        header = list(next(rows))
        level = header.index("Regionalebene") if "Regionalebene" in header else header.index("Reg_Ebene")
        levels_seen = set()
        kept = dropped = 0
        sheet = name[4:].translate(str.maketrans({"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss"}))
        out = os.path.join(out_dir, f"{base}__{sheet}.csv")
        with open(out, "w", encoding="utf-8", newline="") as f:
            w = csv.writer(f, delimiter=";", lineterminator="\n")
            w.writerow(header)
            for row in rows:
                if row is None or all(c is None for c in row):
                    continue
                levels_seen.add(row[level])
                if row[level] in KEEP_LEVELS:
                    w.writerow(["" if c is None else c for c in row])
                    kept += 1
                else:
                    dropped += 1
        unknown = levels_seen - KEEP_LEVELS - {"Gemeinde", "Gemeindeverband", "Bezirk"}
        note = f"  (other levels dropped: {sorted(unknown)})" if unknown else ""
        print(f"{os.path.basename(out)}: {kept} rows kept, {dropped} dropped{note}")

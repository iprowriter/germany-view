"""Removes the e-mail column from the hospital and rehab clinic directory (Krankenhausverzeichnis).

Removed: the `E_Mail` column on the data sheets (' KHV_2024', note the leading space, and
'RHV_2024'). Many addresses are named staff addresses (firstname.lastname@...), which is personal
data, and germany-view describes places, not people. E-mail addresses entered in the `Internet`
column instead of a website are blanked, and `mailto:` links are removed from every cell (openpyxl
keeps a cell's hyperlink when its column is deleted, so the links would otherwise survive). Everything else is kept, including
the explanatory sheets that describe the fields. Safe to run again on an already trimmed file.

Source: Statistische Ämter des Bundes und der Länder, Krankenhausverzeichnis (dl-de/by-2-0).
Modified by germany-view as above.

Needs openpyxl (pip install openpyxl). The output may be the same path as the input.

Usage: python3 -I scripts/trim/krankenhausverzeichnis.py <krankenhausverzeichnis_*.xlsx> <out.xlsx>
"""
import re
import sys

import openpyxl

src, out = sys.argv[1], sys.argv[2]
DATA_SHEETS = (" KHV_2024", "RHV_2024")
DROP = "E_Mail"
WEBSITE = "Internet"
EMAIL = re.compile(r"[^\s@/]+@[^\s@/]+\.[a-z]{2,}", re.I)

wb = openpyxl.load_workbook(src)
for name in DATA_SHEETS:
    ws = wb[name]
    header_row = next(
        (r for r in range(1, 16) if any(isinstance(c.value, str) and c.value.strip() == WEBSITE for c in ws[r])),
        None,
    )
    if header_row is None:
        sys.exit(f"{name!r}: no {WEBSITE} header in the first 15 rows")
    drop = [c.column for c in ws[header_row] if isinstance(c.value, str) and c.value.strip() == DROP]
    for col in sorted(drop, reverse=True):
        ws.delete_cols(col)
    web = next(c.column for c in ws[header_row] if isinstance(c.value, str) and c.value.strip() == WEBSITE)
    blanked = 0
    for (cell,) in ws.iter_rows(min_row=header_row + 1, min_col=web, max_col=web):
        if isinstance(cell.value, str) and EMAIL.search(cell.value):
            cell.value = None
            blanked += 1
    unlinked = 0
    for row in ws.iter_rows():
        for cell in row:
            link = cell.hyperlink
            if link is not None and ((link.target or "").lower().startswith("mailto:") or EMAIL.search(link.target or "")):
                cell.hyperlink = None
                unlinked += 1
    print(f"{name.strip()}: {DROP} {'removed' if drop else 'already removed'}, "
          f"{blanked} e-mail address(es) blanked in {WEBSITE}, {unlinked} mailto link(s) removed, "
          f"{ws.max_row - header_row} rows")
wb.save(out)
print(f"-> {out}")

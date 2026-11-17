# Data

Raw datasets downloaded on **2026-11-17**, organised by GovData category. Everything is at district level
(400 Kreise and kreisfreie Städte) or finer, so states and Germany can be computed from it.

```
data/
├── README.md       # this file (tracked)
├── sources.json    # manifest: source URL, licence, trim step, size and SHA-256 per file (tracked, generated)
├── raw/            # the downloaded files (gitignored: third-party data)
└── map/            # offline basemap germany-z9.pmtiles (gitignored, scripts/map/download-map.sh)
```

`data/raw/` is not committed: the files aren't ours to redistribute. `sources.json` says where each one came
from. Regenerate it after any download with `python3 -I scripts/manifest.py`, which also prints sizes and fails
if a listed file is missing.

## Trimming

Several sources are far larger than what the app uses. They were trimmed **during download**, by the scripts in
`scripts/trim/`, and `sources.json` marks each with `trimmed: true` and the script. Trimming only removes rows,
columns or levels; values are never changed (decimal commas and special characters stay as published).

| Dataset | Published | Kept | How |
|---|---|---|---|
| INKAR 2025 | 434 MB zip / 6.8 GB CSV | 96 MB | districts, states, Germany, East/West only; split into 3 files |
| Zensus 2022 regional tables | 61 MB xlsx | 1.3 MB | CSV sheets, Germany/state/district rows |
| Zensus 2022 grids | 7 zips, 100 m + 1 km + 10 km | 82 MB | 1 km grids only |
| Ladesäulenregister | 58 MB | 31 MB | dropped EVSE IDs, public keys, street address |
| jedeschule | 50 MB | 9 MB | dropped contact data and head teacher names, duplicate columns |
| Unfallatlas 2025 | 42 MB | 24 MB | dropped duplicate coordinates |
| GISD | 33 MB | 0.5 MB | district rows only |

## Size

| | Unzipped | Zipped |
|---|---|---|
| `data/raw/` | 268 MB | 57 MB |
| `data/map/` (zoom 0-9, already compressed) | 47 MB | 47 MB |
| **Total** | **316 MB** | **105 MB** |

Budget: **200 MB zipped for data and map together**, so about 95 MB is left for the app and later additions.
A zoom-10 map would be 130 MB (187 MB in total) and zoom 11 301 MB.

## By category

| Category | Datasets |
|---|---|
| Regions & keys | VG1000 boundaries (BKG), district list with keys (Destatis) |
| Several categories | INKAR: economy, labour, health care, care, education, land use, transport access, broadband, tourism, public finances |
| Population & society | Zensus 2022 regional tables and 1 km grids, GISD deprivation index |
| Justice & public safety | PKS 2025 by district, large city and state (BKA) |
| Energy | Ladesäulenregister; INKAR (electric and hybrid cars, new buildings heated with renewables); Zensus 2022 heating type and energy source (1 km grids) |
| Environment | UBA air quality 2016-2025, EU bathing waters 2015-2025, DWD climate since 1881 |
| Education, culture & sport | jedeschule (all schools) |
| Health | Hospital and rehab directory 2024 |
| Transport | Unfallatlas 2025 |
| Government & public sector | Federal election 2025 by district |
| Regions & cities | Stolpersteine (OSM) |

## Known gaps

- **Agriculture by district** (farms, livestock, organic share): only in the Regionaldatenbank, whose API needs a
  free account. INKAR has farmland, forest and nitrogen surplus meanwhile.
- **Inner-German border / Green Belt** geometry: not downloaded yet (OSM or BfN).
- **Power plants, solar, wind and storage** (Marktstammdatenregister): left out on purpose. The full export is
  3.2 GB and downloads slowly; Energy works without it.
- **Protected areas** (BfN): not downloaded yet; INKAR has near-natural area per district.
- **Licences to confirm** (`licenseVerified: false`): BKA, Bundeswahlleiterin, jedeschule, EEA, UBA, DWD, BKG,
  Zensus, Unfallatlas, hospital directory.

"""Writes data/sources.json: one entry per dataset in data/raw/ (and the basemap in data/map/), with where it came from, its
licence, whether and how it was trimmed, and the size and SHA-256 of every file.

The dataset list below is the source of truth; run this after (re-)downloading:

    python3 -I scripts/manifest.py

`category` is the GovData (DCAT-AP.de) theme the dataset mainly feeds, or "regions" for
boundaries and keys used everywhere.
"""
import glob
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")

FETCHED = "2026-11-17"

DATASETS = [
    # ---- Regions & keys -------------------------------------------------------------------
    dict(id="boundaries.vg1000", category="regions", title="Administrative boundaries 1:1,000,000 (VG1000), 31.12.",
         files=["boundaries/vg1000_12-31.utm32s.gpkg.ebenen.zip"], publisher="Bundesamt für Kartographie und Geodäsie (BKG)",
         license="dl-de/by-2-0", licenseVerified=False, method="http",
         url="https://daten.gdz.bkg.bund.de/produkte/vg/vg1000_ebenen_1231/aktuell/vg1000_12-31.utm32s.gpkg.ebenen.zip",
         page="https://gdz.bkg.bund.de/index.php/default/verwaltungsgebiete-1-1-000-000-stand-31-12-vg1000-31-12.html",
         trimmed=False, notes="GeoPackage in EPSG:25832 with states, government regions, districts and municipalities. "
         "Licence terms are in dokumentation/nutzungsbedingungen_vg1000.pdf inside the zip."),
    dict(id="regions.kreise", category="regions", title="Gemeindeverzeichnis: districts and independent cities by area and population",
         files=["regions/gemeindeverzeichnis_04-kreise.xlsx"], publisher="Statistisches Bundesamt (Destatis)",
         license="dl-de/by-2-0", licenseVerified=True, method="http",
         url="https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/04-kreise.xlsx?__blob=publicationFile",
         page="https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/_inhalt.html",
         trimmed=False, notes="The list of all 400 districts with official keys (AGS)."),

    # ---- Cross-cutting indicators ---------------------------------------------------------
    dict(id="inkar.2025", category="multiple", title="INKAR 2025: ~560 regional indicators, 1995-2025",
         files=["inkar/*"], publisher="Bundesinstitut für Bau-, Stadt- und Raumforschung (BBSR)",
         license="dl-de/by-2-0", licenseVerified=True, method="http",
         url="https://www.bbr-server.de/imagemap/inkar/download/inkar_2025.zip", page="https://www.inkar.de/",
         trimmed=True, trimScript="scripts/trim/inkar.sh",
         notes="Source zip is 434 MB (6.8 GB CSV, ~69 million rows). Kept: districts, states, Germany and East/West "
         "(~3.45 million rows), split into indicators/regions/observations. Boundaries as of 31.12.2023, time series "
         "adjusted to them. Attribution: 'BBSR Bonn 2025', and state that germany-view modified the data. "
         "Commercial use needs BBSR's written consent (BBSR Nutzungshinweise). Covers economy, labour market, health "
         "care, care homes, education, land use, transport access and stops, broadband, tourism, public finances."),

    # ---- Population & society -------------------------------------------------------------
    dict(id="zensus2022.regional", category="population-society", title="Zensus 2022 regional tables (population, demography, education & work, households, buildings & dwellings)",
         files=["zensus/regional/*.csv"], publisher="Statistisches Bundesamt (Destatis), Statistische Ämter der Länder",
         license="dl-de/by-2-0", licenseVerified=False, method="http",
         url="https://www.destatis.de/static/DE/zensus/gitterdaten/Regionaltabelle_{Bevoelkerung,Bildung_Erwerbstaetigkeit,Demografie,Gebaeude_Wohnungen,Haushalte}.xlsx",
         page="https://www.zensus2022.de/DE/Ergebnisse-des-Zensus/_inhalt.html",
         trimmed=True, trimScript="scripts/trim/zensus_regional.py",
         notes="Five workbooks (~61 MB, all municipalities). Kept: the machine-readable CSV sheets, rows for Germany, "
         "states and districts only. Reference date 15.05.2022."),
    dict(id="zensus2022.grid_1km", category="population-society", title="Zensus 2022 1 km grid: population, rent, vacancy, ownership, heating",
         files=["zensus/grid_1km/*"], publisher="Statistisches Bundesamt (Destatis)",
         license="dl-de/by-2-0", licenseVerified=False, method="http",
         url="https://www.destatis.de/static/DE/zensus/gitterdaten/{Zensus2022_Bevoelkerungszahl,Zensus2022_Durchschn_Nettokaltmiete,Leerstandsquote_in_Gitterzellen,Marktaktive_Leerstandsquote_in_Gitterzellen,Eigentuemerquote_in_Gitterzellen,Zensus2022_Heizungsart,Zensus2022_Energietraeger}.zip",
         page="https://www.zensus2022.de/DE/Ergebnisse-des-Zensus/_inhalt.html",
         trimmed=True, trimScript=None,
         notes="Each zip holds 100 m, 1 km and 10 km grids. Kept: the 1 km CSV and the dataset description of each "
         "(unzip '*_1km-Gitter.csv' '*Datensatzbeschreibung*'). The 100 m grids (69-181 MB each) were left out; "
         "add the 100 m rent grid if the Rent & housing view needs street-level detail. Cells in EPSG:3035."),
    dict(id="society.gisd", category="population-society", title="German Index of Socioeconomic Deprivation (GISD), release 2026 v0.1",
         files=["society/*"], publisher="Robert Koch-Institut", license="CC-BY-4.0", licenseVerified=True, method="http",
         url="https://raw.githubusercontent.com/robert-koch-institut/German_Index_of_Socioeconomic_Deprivation_GISD/main/GISD_Bund.tsv",
         page="https://github.com/robert-koch-institut/German_Index_of_Socioeconomic_Deprivation_GISD",
         trimmed=True, trimScript=None,
         notes="Source TSV (33 MB) covers 9 levels down to postcodes. Kept: rows with region_type = 'Kreis' (400 districts x 26 years). "
         "Scores relative to all of Germany. Plus the method documentation PDF."),

    # ---- Justice & public safety ----------------------------------------------------------
    dict(id="justice.pks2025", category="justice-safety", title="Police crime statistics (PKS) 2025: cases and rate per 100,000 by district, large city and state",
         files=["justice/*"], publisher="Bundeskriminalamt (BKA)", license="unknown", licenseVerified=False, method="http",
         url="https://www.bka.de/SharedDocs/Downloads/DE/Publikationen/PolizeilicheKriminalstatistik/2025/{Kreis/Faelle/KR-F-01-T01-Kreise-Faelle-HZ_xls.xlsx,Stadt/Faelle/ST-F-01-T01-Staedte-Faelle-HZ_xls.xlsx,Land/Faelle/LA-F-02-T01-Laender-Faelle-HZ_xls.xlsx}",
         page="https://www.bka.de/DE/AktuelleInformationen/StatistikenLagebilder/PolizeilicheKriminalstatistik/PKS2025/pksTabellen_Interpretationshilfen/R%C3%A4umlicheGliederung/tabellenraum_node.html",
         trimmed=False, notes="Plus two PDFs: interpretation notes (read before comparing districts) and the offence "
         "list used for districts and cities. Earlier years follow the same URL pattern with PKS<year>. "
         "Licence not stated on the page: check the BKA's terms before shipping."),

    # ---- Energy -------------------------------------------------------------------------
    dict(id="energy.ladesaeulen", category="energy", title="Charging point register (Ladesäulenregister), 12.11.2026",
         files=["energy/ladesaeulenregister_2026-11-12.csv"], publisher="Bundesnetzagentur", license="CC-BY-4.0",
         licenseVerified=True, method="http",
         url="https://data.bundesnetzagentur.de/Bundesnetzagentur/DE/Fachthemen/ElektrizitaetundGas/E-Mobilitaet/Ladesaeulenregister_BNetzA_2026-11-12.csv",
         page="https://www.bundesnetzagentur.de/ladeinfrastruktur", trimmed=True, trimScript="scripts/trim/ladesaeulen.py",
         notes="Source 58 MB. Removed EVSE IDs and public keys, street addresses and opening-hour details; converted to "
         "UTF-8. The URL is date-stamped and goes stale: `page` links the current file."),

    # ---- Environment --------------------------------------------------------------------
    dict(id="environment.uba_air", category="environment", title="Air quality: stations and annual values (PM10, PM2.5, NO2, O3), 2016-2025",
         files=["environment/uba_air/*"], publisher="Umweltbundesamt", license="dl-de/by-2-0", licenseVerified=False,
         method="api", url="https://luftdaten.umweltbundesamt.de/api/air-data/v3/annualbalances/json?component={1,3,5,9}&year={2016..2025}&lang=de",
         page="https://luftdaten.umweltbundesamt.de/en", trimmed=False,
         notes="Also stations.json, components.json and meta.json from the same API. Components: 1 PM10, 3 O3, 5 NO2, 9 PM2.5. "
         "The old umweltbundesamt.de/api/air_data URLs redirect here. Recent values are provisional."),
    dict(id="environment.bathing_water", category="environment", title="EU bathing waters in Germany with quality class 2015-2025",
         files=["environment/eea_bathing_water_de_2025.csv"], publisher="European Environment Agency (data: German state authorities)",
         license="unknown", licenseVerified=False, method="api",
         url="https://water.discomap.eea.europa.eu/arcgis/rest/services/BathingWater/BathingWater_Dyna_WM_2025/MapServer/3/query?where=countryCode='DE'&outFields=*&f=json",
         page="https://www.eea.europa.eu/en/topics/in-depth/bathing-water", trimmed=True, trimScript=None,
         notes="2,291 sites. Queried in two pages of 2,000 and written to CSV with the attribute fields only (no geometry: "
         "longitude/latitude columns hold the location). EEA content is generally reusable with attribution: confirm."),
    dict(id="environment.dwd_climate", category="environment", title="Climate: annual averages per state since 1881 (temperature, precipitation, sunshine, frost/ice/summer/hot days, tropical nights)",
         files=["environment/dwd/*"], publisher="Deutscher Wetterdienst (DWD)", license="CC-BY-4.0", licenseVerified=False,
         method="http", url="https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/annual/",
         page="https://opendata.dwd.de/climate_environment/CDC/regional_averages_DE/", trimmed=False,
         notes="One text file per variable, one column per state (some states combined, e.g. Brandenburg/Berlin)."),

    # ---- Education ----------------------------------------------------------------------
    dict(id="education.jedeschule", category="education-culture-sport", title="All schools in Germany (jedeschule.de), 14.11.2026",
         files=["education/jedeschule_2026-11-14.csv"], publisher="jedeschule.de (Code for Germany), from the 16 state school registers",
         license="unknown", licenseVerified=False, method="http",
         url="https://jedeschule.codefor.de/csv-data/jedeschule-data-2026-11-14.csv", page="https://jedeschule.codefor.de/",
         trimmed=True, trimScript="scripts/trim/jedeschule.py",
         notes="Source 50 MB, ~40,000 schools. Removed email, phone, fax and head teacher names (personal/contact data), "
         "plus the duplicate raw JSON and WKB columns. Weekly dumps; latest.csv is the newest."),

    # ---- Health -------------------------------------------------------------------------
    dict(id="health.krankenhausverzeichnis", category="health", title="Directory of hospitals and rehabilitation clinics 2024",
         files=["health/krankenhausverzeichnis_2024.xlsx"], publisher="Statistische Ämter des Bundes und der Länder",
         license="dl-de/by-2-0", licenseVerified=False, method="http",
         url="https://www.statistikportal.de/sites/default/files/2026-06/krankenhausverzeichnis_24.xlsx",
         page="https://www.statistikportal.de/de/veroeffentlichungen/krankenhausverzeichnis", trimmed=False,
         notes="2,836 hospital sites (sheet ' KHV_2024', note the leading space) and 1,094 rehab clinics (RHV_2024) with "
         "address, district/municipality key, operator type and facility type. No coordinates. Contact columns are "
         "institutional; drop them in the build if not needed."),

    # ---- Transport ----------------------------------------------------------------------
    dict(id="transport.unfallatlas_2025", category="transport", title="Road accidents with personal injury 2025 (Unfallatlas)",
         files=["transport/unfallorte_2025.csv"], publisher="Statistische Ämter des Bundes und der Länder",
         license="dl-de/by-2-0", licenseVerified=False, method="http",
         url="https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/Unfallorte2025_EPSG25832_CSV.zip",
         page="https://www.opengeodata.nrw.de/produkte/transport_verkehr/unfallatlas/", trimmed=True,
         trimScript="scripts/trim/unfallatlas.py",
         notes="273,007 accidents, all 16 states. Removed the duplicate EPSG:25832 coordinates and plausibility flag; "
         "WGS84 rounded to 6 decimals. Only 2025: INKAR has road deaths per district over time."),

    # ---- Government & public sector ------------------------------------------------------
    dict(id="government.btw2025", category="government-public-sector", title="Federal election 2025: results by district, national results, parties",
         files=["government/*"], publisher="Die Bundeswahlleiterin", license="unknown", licenseVerified=False, method="http",
         url="https://www.bundeswahlleiterin.de/dam/jcr/0d625aaf-1a64-4503-a141-1f54f5c35bae/btw2025kreis.csv",
         page="https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/weitere-ergebnisse.html", trimmed=False,
         notes="btw2025kreis.csv: first and second votes per party for all 400 districts (5 preamble lines). Also kerg2.csv "
         "(opendata/btw25/csv/) and btw25_parteien.csv. Source line in the file: '© Die Bundeswahlleiterin, Wiesbaden 2025'."),

    # ---- Regions & cities: history -----------------------------------------------------
    dict(id="history.stolpersteine", category="regions-cities", title="Stolpersteine (memorial stones) in OpenStreetMap",
         files=["history/osm_stolpersteine.csv"], publisher="OpenStreetMap contributors", license="ODbL-1.0",
         licenseVerified=True, method="api", url="https://overpass-api.de/api/interpreter",
         page="https://wiki.openstreetmap.org/wiki/DE:Tag:memorial%3Dstolperstein", trimmed=False,
         notes="Overpass query: node[memorial=stolperstein] or node[memorial:type=stolperstein] in Germany, output as CSV "
         "(id, lat, lon, name, memorial:text, subject:wikidata, wikidata, memorial:website, website). ~45,000 of the "
         "~116,000 stones laid: coverage differs by city, show it as such."),

    # ---- Offline basemap (data/map/) ------------------------------------------------------
    dict(id="map.basemap_z9", dir="map", category="map", title="Offline basemap: OpenStreetMap vector tiles for Germany, zoom 0-9",
         files=["germany-z9.pmtiles", "germany-z9.build.txt"], publisher="OpenStreetMap contributors, Protomaps",
         license="ODbL-1.0", licenseVerified=True, method="script", url="https://build.protomaps.com/",
         page="https://docs.protomaps.com/basemaps/downloads", trimmed=True, trimScript="scripts/map/download-map.sh",
         notes="Extracted from the daily Protomaps planet build named in germany-z9.build.txt, clipped to "
         "scripts/map/germany-outline.geojson (Germany + 10 km) and zoom 9 (z10 would be 130 MB, z11 301 MB). "
         "Protomaps basemap schema v4. Attribution required wherever the map is shown: © OpenStreetMap contributors."),
]


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    out = []
    missing = []
    for d in DATASETS:
        files = []
        base = os.path.join(ROOT, "data", d.get("dir", "raw"))
        for pattern in d["files"]:
            matches = sorted(glob.glob(os.path.join(base, pattern)))
            if not matches:
                missing.append(f"{d['id']}: {pattern}")
            for p in matches:
                files.append({"file": os.path.relpath(p, base), "bytes": os.path.getsize(p), "sha256": sha256(p)})
        entry = {k: v for k, v in d.items() if k != "files"}
        entry["dir"] = "data/" + d.get("dir", "raw")
        entry["fetchedAt"] = FETCHED
        entry["bytes"] = sum(f["bytes"] for f in files)
        entry["files"] = files
        out.append(entry)

    manifest = {
        "description": "Manifest of the third-party data in data/raw/ and the basemap in data/map/ (both gitignored). "
                       "Each entry says where the data came from, its licence, whether it was trimmed (and by which "
                       "script), and the size and SHA-256 of every file (paths relative to the entry's `dir`). "
                       "Generated by scripts/manifest.py. See data/README.md.",
        "methods": {
            "http": "GET `url` (braces list several files).",
            "api": "Query `url` as described in `notes`.",
            "script": "Run `trimScript`.",
        },
        "totalBytes": sum(e["bytes"] for e in out),
        "datasets": out,
    }
    with open(os.path.join(ROOT, "data", "sources.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{len(out)} datasets, {sum(len(e['files']) for e in out)} files, {manifest['totalBytes'] / 1e6:.1f} MB")
    for e in sorted(out, key=lambda e: -e["bytes"]):
        print(f"  {e['bytes'] / 1e6:7.1f} MB  {e['id']}")
    if missing:
        print("MISSING:", *missing, sep="\n  ")
        sys.exit(1)


if __name__ == "__main__":
    main()

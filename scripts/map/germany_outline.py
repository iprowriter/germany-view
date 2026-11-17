"""Builds the area the offline basemap covers: Germany's outline from VG1000 (BKG), with a margin so the
map doesn't stop exactly at the border, simplified and converted to WGS84 GeoJSON for `pmtiles extract --region`.

The result, scripts/map/germany-outline.geojson, is small and tracked in git, so downloading the map
doesn't need this script (or its Python dependencies) again.

Source: © GeoBasis-DE / BKG, VG1000 (dl-de/by-2-0). Modified: dissolved, buffered, simplified, reprojected.

Usage: python -I scripts/map/germany_outline.py <DE_VG1000.gpkg> [margin_km]
Needs shapely and pyproj.
"""
import json
import os
import sqlite3
import struct
import sys

from pyproj import Transformer
from shapely import wkb
from shapely.geometry import mapping
from shapely.ops import transform, unary_union

gpkg = sys.argv[1]
margin_m = float(sys.argv[2] if len(sys.argv) > 2 else 10) * 1000
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "germany-outline.geojson")


def gpkg_geometry(blob):
    """Strip the GeoPackage binary header and return the shapely geometry."""
    flags = blob[3]
    envelope = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(flags >> 1) & 0b111]
    return wkb.loads(bytes(blob[8 + envelope:]))


con = sqlite3.connect(gpkg)
shapes = [gpkg_geometry(row[0]) for row in con.execute("SELECT geom FROM vg1000_sta")]
germany = unary_union(shapes)  # EPSG:25832, metres

area = germany.buffer(margin_m).simplify(1000)  # margin, then ~1 km tolerance
to_wgs84 = Transformer.from_crs("EPSG:25832", "EPSG:4326", always_xy=True).transform
area = transform(to_wgs84, area)

feature = {
    "type": "Feature",
    "properties": {"name": "Germany", "margin_km": margin_m / 1000,
                   "source": "© GeoBasis-DE / BKG, VG1000 (dl-de/by-2-0), dissolved, buffered and simplified"},
    "geometry": mapping(area),
}
with open(out, "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": [feature]}, f)
print(f"{out}: {os.path.getsize(out) / 1000:.1f} kB, bounds {tuple(round(b, 2) for b in area.bounds)}")

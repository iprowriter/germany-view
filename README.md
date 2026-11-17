# Germany View

**How do Germany's 400 districts and 16 states compare, across everything the state publishes about them?**

Germany View organises official open data by the categories GovData uses (health, transport, environment,
justice, energy, economy and more) and compares it at district level (Kreise and kreisfreie Städte). States
are the sum of their districts, and the large cities are among the 400.

Planned sidebar:

- **Explore:** Overview map, Profile of one place, Compare places (and "most similar")
- **Decide:** Where to live (weighted ranking), Rent & housing
- **Themes:** the GovData categories: Population & society, Education/culture/sport, Health, Justice & public
  safety, Economy & finance, Energy, Environment, Transport, Agriculture & food, Science & technology,
  Government & public sector, Regions & cities

It is built to run **offline**: all data is downloaded once, trimmed to what the app uses, and shipped with
it. The target is under 200 MB zipped, map included. A live basemap is used when there is internet.

## Map

Most views are area maps drawn from the district boundaries (VG1000), which need no basemap. Underneath
them, for orientation, there are two basemaps with the same tile schema (Protomaps v4), so one style works for both:

| | Source | Detail | Size |
|---|---|---|---|
| **Offline** (always present) | `data/map/germany-z9.pmtiles`, made by `bash scripts/map/download-map.sh` | zoom 0-9: towns, main roads, rivers | 47 MB |
| **Online** (optional) | `BASEMAP_ONLINE_URL` | full detail to street level | – |

At startup the app tries the online source with a short timeout and falls back to the offline file, labelled
"Offline map". It switches on the browser's `online`/`offline` events without a reload. Leave
`BASEMAP_ONLINE_URL` empty to stay offline. Options for it:

- Protomaps API: `https://api.protomaps.com/tiles/v4/{z}/{x}/{y}.mvt?key=<free key>`
- A full-detail Germany PMTiles file you host yourself (`bash scripts/map/download-map.sh 15`, 7.2 GB)

Not the daily `build.protomaps.com` files: those are meant for extracts, not as a live tile source.

The Berlin app renders PMTiles with `protomaps-leaflet`, which draws labels with system fonts, so no font
or sprite files are needed offline. © OpenStreetMap contributors must be shown with the map.

## Getting started

Needs Node.js 20+.

```bash
./run.sh          # set up (dependencies, .env files) and start backend + frontend
./run.sh test     # every check CI runs: lint, tests, type-checks, build
./run.sh setup    # only set up
./run.sh help
```

The frontend runs at http://localhost:5173 (Vite picks the next free port if it's taken), the API at
http://localhost:5002, so it can run beside Berlin Visualized (5001).

| Command | What it does |
| --- | --- |
| `npm run startDev` | Backend + frontend together |
| `npm run dev` / `npm run server` | Frontend (Vite) / backend alone |
| `npm test` / `npm run test:server` / `npm run test:all` | Frontend / server / all tests |
| `npm run lint`, `npm run build` | Lint, type-check and build the frontend |
| `npm run map:download` | Download the offline basemap into `data/map/` |
| `npm run data:manifest` | Regenerate `data/sources.json` after downloading data |

## API

Everything is read from files in `data/` (no database), so the API works offline. Endpoints that need
`data/raw/` answer `503` with a hint when it hasn't been downloaded; bad parameters get `400`.

| Endpoint | Returns | Parameters |
| --- | --- | --- |
| `GET /api` | Health check | |
| `GET /api/regions` | Germany, the 16 states and 400 districts: official key (AGS), name, level, parent, East/West | `level=country\|state\|district`, `parent=DE` or a state key (`09`) |
| `GET /api/indicators` | The 561 INKAR indicators: id, code, name, group | `q=` search (case- and umlaut-insensitive, all words must match), `area=LRB\|ZOM\|SDG` |
| `GET /api/sources` | Every dataset: publisher, licence, size, trimmed or not, source URL | `category=health` (any category slug) |

Set `DATA_DIR` in `server/.env` to read the data from somewhere else.

## Layout

```
src/
  config/navigation.ts      the sidebar: every page, its description, what it will show, its datasets
  components/Sidebar/       the sidebar (collapses behind a menu button on narrow screens)
  views/PagePreview.tsx     what a page shows until it's built
  useHashRoute.ts           current page in the URL hash (#/health), no router library
server/
  app.ts                    Express API: createApp(), error handling (400, 503 for missing data)
  routes/catalog.ts         /api/regions, /api/indicators, /api/sources
  data/                     file loaders (read once, cached until the file changes)
scripts/
  trim/                     trimming scripts for large downloads
  map/                      offline basemap download
  manifest.py               writes data/sources.json
```

## Status

- Data and offline map collected: **105 MB zipped** of the 200 MB budget. See [`data/README.md`](data/README.md).


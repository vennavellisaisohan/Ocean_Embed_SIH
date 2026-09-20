# OceanEmbed — SIH 26066 website

Smart India Hackathon 2026 frontend for **SIH26066** (MoES / INCOIS): a 3D / interactive explainer of **OceanEmbed**, a surface-to-subsurface ocean temperature reconstruction concept for the North Indian Ocean.

This repository contains **only the website and mock ocean data** used by the UI. Training datasets, NetCDF products, and model weights are not included.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173/).

```bash
npm run build    # production bundle
npm run preview  # serve the build
```

Requires Node.js 20+.

## Repository layout

```text
.
├── index.html                 # Vite entry
├── package.json
├── vite.config.js
├── public/                    # static assets served as-is
│   ├── data/                  # mock / display JSON for maps and panels
│   │   ├── catalog.json
│   │   ├── liveOcean.json
│   │   ├── nio_surface_latest.json
│   │   └── argo_profiles_latest.json
│   ├── ocean.mp4
│   └── ...
├── src/                       # React frontend
│   ├── App.jsx
│   ├── components/
│   │   ├── sections/          # page sections (hero, pipeline, explorer, …)
│   │   ├── map/               # MapLibre ocean layers
│   │   └── three/             # React Three Fiber scenes
│   └── lib/
│       ├── mockData.js        # deterministic scientific mock engine
│       ├── realOceanData.js   # loaders for public/data JSON
│       └── ...
└── docs/                      # problem-statement extras
```

There is **no separate backend**. The site is a client-side Vite + React app. Charts, globe, and explorer views are driven by `src/lib/mockData.js` plus the JSON under `public/data/`.

## Mock data

| file | role |
|---|---|
| `src/lib/mockData.js` | Seeded, physically grounded mock fields for NIO (5°N–30°N, 45°E–105°E) |
| `public/data/catalog.json` | Variable / product catalog shown in the UI |
| `public/data/liveOcean.json` | Compact live-ocean snapshot for panels |
| `public/data/nio_surface_latest.json` | Surface field for the map |
| `public/data/argo_profiles_latest.json` | Argo-style profiles for validation visuals |

## Datasets (downloaded locally, not in this repo)

Training/analysis data live outside this repo (git-ignored: `/data/`, `OceanEmbed/`, `*.nc`, `*.npy`, `*.npz`, checkpoints). What the site shows under `public/data/` are small derived display snapshots, not training tensors.

- **Region / grid:** North Indian Ocean, 5°N–30°N, 45°E–105°E, 0.25° grid (100×240). Target depths: 0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000 m.
- **Corpus:** 30-day daily window with a chronological train/val/test split (≈70/15/15, no shuffle). Missing/land coded as NaN with parallel uint8 masks; normalization statistics fit on train only.

| Variable | SIH-recommended product | Open product actually downloaded | Access |
|---|---|---|---|
| SST | OSTIA 0.05° daily (doi:10.48670/moi-00168) | NOAA OISST v2.1 AVHRR-only 0.25° daily | Open HTTP (NOAA NCEI) |
| SSS | SMAP/SMOS (doi:10.48670/moi-00051) | CoastWatch SMAP SSS 0.25° daily (`noaacwSMAPsssDaily`) | Open ERDDAP (NOAA CoastWatch) |
| SLA | DUACS 0.25° daily (doi:10.48670/moi-00145) | CoastWatch blended altimetry SLA 0.25° daily (`noaacwBLENDEDsshDaily`) | Open ERDDAP |
| Currents U/V | OSCAR L4 (NASA PO.DAAC, Earthdata login) | CoastWatch blended geostrophic currents 0.25° daily (`noaacwBLENDEDNRTcurrentsDaily`) | Open ERDDAP |
| Winds U/V | CCMP L4 (NASA PO.DAAC) | NCEI blended sea winds 0.25° daily (`noaacwBlendedWindsDaily`) | Open ERDDAP |
| Target θ(z) | GLORYS12V1 temperature (doi:10.48670/moi-00021) | Same GLORYS12V1 product, NIO 30-day subset regridded to 0.25°, 15 depths | Copernicus Marine (free account) |
| Argo (validation only) | INCOIS LAS gridded Argo | Argovis / IFREMER GDAC profiles + INCOIS ERDDAP 10-day objective analysis + Indian Argo floats table | Open ERDDAP/API |
| Cyclones | — | IBTrACS North Indian v4r01 + IMD best-track archive (1982–2026) | Open (NOAA NCEI / IMD) |

Notes:
- CMEMS originals (OSTIA / SMAP-SMOS / DUACS / GLORYS) need a free Copernicus Marine login and PO.DAAC originals (OSCAR / CCMP) need a NASA Earthdata login, so the open NOAA/CoastWatch substitutes above were used for surface inputs.
- Argo is strictly hold-out validation, never training input.
- All items above are public scientific products (public DOIs / open government ERDDAP endpoints). No credentials, private keys, or local paths are stored in this repo.

## Not in this repo

- GLORYS / SST / SSS / SLA / currents / winds NetCDF
- NumPy training tensors (`X.npy`, `Y.npy`, masks)
- Model checkpoints and training code
- The local `OceanEmbed/` data-engineering workspace

## Stack

React 19, Vite, Tailwind CSS 4, Three.js (`@react-three/fiber`), MapLibre GL, Framer Motion, Recharts.

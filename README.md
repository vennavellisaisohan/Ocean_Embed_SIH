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

## Not in this repo

- GLORYS / SST / SSS / SLA / currents / winds NetCDF
- NumPy training tensors (`X.npy`, `Y.npy`, masks)
- Model checkpoints and training code
- The local `OceanEmbed/` data-engineering workspace

## Stack

React 19, Vite, Tailwind CSS 4, Three.js (`@react-three/fiber`), MapLibre GL, Framer Motion, Recharts.

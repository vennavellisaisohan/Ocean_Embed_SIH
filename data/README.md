# Display JSON for the OceanEmbed website

- `catalog.json` — input/target product list for SIH26066
- `liveOcean.json` — compact live-ocean snapshot (Argo observed)
- `nio_surface_latest.json` — North Indian Ocean surface field for the map
- `argo_profiles_latest.json` — Argo-style profiles
- `oceanembed_model.json` — **trained OceanUNet + frozen cyclone hurdle** snapshot for 2024-08-29: real SST/SSS/SLA/currents/winds, reconstructed θ, TCHP/D26/D20, 7-day cyclone probability, IBTrACS ASNA track. Not synthetic mock fields.

The map/explorer reconstructed column is OceanUNet, not the seeded generator in `src/lib/mockData.js`.

/**
 * Nexora OceanEmbed — Deterministic Scientific Mock Data Engine
 * Smart India Hackathon 2026 | Problem Statement SIH26066 (MoES / INCOIS)
 * 
 * Generates reproducible, physically grounded oceanographic data for:
 * - North Indian Ocean (5°N to 30°N, 45°E to 105°E)
 * - Exact 15 standard depths: 0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000 m
 */

function createSeededPRNG(seed = 26066) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const OFFICIAL_DEPTHS = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000];

export const REGIONS = {
  nio: { id: "nio", name: "North Indian Ocean", latMin: 5, latMax: 30, lonMin: 45, lonMax: 105, meanSST: 29.8, meanSSS: 34.5 },
  arabianSea: { id: "arabianSea", name: "Arabian Sea", latMin: 8, latMax: 26, lonMin: 50, lonMax: 77, meanSST: 29.2, meanSSS: 36.4 },
  bayOfBengal: { id: "bayOfBengal", name: "Bay of Bengal", latMin: 6, latMax: 23, lonMin: 78, lonMax: 98, meanSST: 30.5, meanSSS: 32.2 }
};

export const INPUT_CATALOG = [
  { variable: 'SST', source: 'GHRSST / OSTIA L4', native: '0.05° daily', harmonized: '0.25° daily', role: 'Input', note: 'Multi-sensor (SLSTR/VIIRS); DINEOF cloud inpainting' },
  { variable: 'SSS', source: 'JPL SMAP L3 v5.0', native: '0.25° 8-day', harmonized: '0.25° daily', role: 'Input', note: 'RFI filtered; optimal interpolation with plume conservation' },
  { variable: 'SSH / SLA', source: 'CMEMS DUACS Altimetry', native: '0.25° daily', harmonized: '0.25° daily', role: 'Input', note: 'Sentinel-3 & Jason-3 constellation; DAC corrected' },
  { variable: 'Currents U, V', source: 'GlobCurrent / CMEMS', native: '0.25° daily', harmonized: '0.25° daily', role: 'Input', note: 'Geostrophic balance + wind-driven Ekman integration' },
  { variable: 'Winds U, V', source: 'CCMP v3.0 / MetOp ASCAT', native: '0.25° 6-hourly', harmonized: '0.25° daily mean', role: 'Input', note: 'Cross-calibrated scatterometer wind stress (τx, τy)' },
  { variable: 'θ(z) target', source: 'GLORYS12V1 reanalysis', native: '0.08° daily', harmonized: '0.25°, 15 depths', role: 'Train', note: 'Mercator Ocean physics; conservative temperature' },
  { variable: 'Argo T(z)', source: 'INCOIS GDAC / IFREMER', native: 'Irregular profiles', harmonized: 'Colocated hold-out', role: 'Validate', note: 'QC flag = 1; strictly hold-out, never used in training' },
]

export const DATASETS = [
  { id: "sst", name: "Sea Surface Temperature (SST)", source: "GHRSST / OSTIA L4", type: "Input", resolution: "0.05° daily", coverage: "Global", missingDataPct: "2.1%", variable: "SST (°C)", missingNotice: "Cloud-masked gaps inpainted via biharmonic spline interpolation." },
  { id: "sss", name: "Sea Surface Salinity (SSS)", source: "SMAP / SMOS L3", resolution: "0.25° 8-day", coverage: "Global", type: "Input", missingDataPct: "8.4%", variable: "SSS (PSU)", missingNotice: "Coastal proximity causes RFI contamination; gap-filled with OI." },
  { id: "sla", name: "Sea Level Anomaly (SLA)", source: "CMEMS SEALEVEL_GLO", resolution: "0.25° daily", coverage: "Global", type: "Input", missingDataPct: "0.3%", variable: "SLA (m)", missingNotice: "Near-complete coverage via multi-altimeter constellation." },
  { id: "currents", name: "Surface Geostrophic Currents", source: "OSCAR / GlobCurrent", resolution: "0.25° 5-day", coverage: "Global", type: "Input", missingDataPct: "1.8%", variable: "U/V (m/s)", missingNotice: "Derived from merged altimetry; equatorial band uses Ekman model." },
  { id: "wind", name: "Surface Wind Stress", source: "CCMP / ERA5", resolution: "0.25° 6-hourly", coverage: "Global", type: "Input", missingDataPct: "0.1%", variable: "τx/τy (N/m²)", missingNotice: "Cross-calibrated multi-platform; near-complete coverage." },
  { id: "glorys", name: "GLORYS12V1 Reanalysis", source: "Copernicus Marine", resolution: "0.08° daily", coverage: "1993–present", type: "Target", missingDataPct: "0.0%", variable: "θ(z) (°C)", missingNotice: "Used as supervisory training target; complete 3D ocean state." },
  { id: "argo", name: "ARGO Float Profiles", source: "IFREMER / INCOIS", resolution: "Irregular", coverage: "2000–present", type: "Validation", missingDataPct: "Sparse", variable: "T/S(z)", missingNotice: "Strictly independent hold-out validation; NEVER used in training." }
];

export const ARGO_FLOATS = [
  { id: "argo-1", wmo: "WMO 2902150", lat: 15.2, lon: 68.5, basin: "Arabian Sea", cycles: 187, lastDate: "2025-04-24" },
  { id: "argo-2", wmo: "WMO 2902283", lat: 12.8, lon: 85.3, basin: "Bay of Bengal", cycles: 143, lastDate: "2025-04-23" },
  { id: "argo-3", wmo: "WMO 2902341", lat: 8.5, lon: 76.2, basin: "Laccadive Sea", cycles: 98, lastDate: "2025-04-25" },
  { id: "argo-4", wmo: "WMO 2902417", lat: 19.1, lon: 89.7, basin: "Northern BoB", cycles: 112, lastDate: "2025-04-22" },
  { id: "argo-5", wmo: "WMO 2902502", lat: 10.3, lon: 57.8, basin: "Western Arabian Sea", cycles: 201, lastDate: "2025-04-25" }
];

export const MODELS = [
  { id: "model-lr", name: "Baseline Linear Regression", category: "Statistical", overallRMSE: 2.14, thermoclineRMSE: 2.87, deepRMSE: 1.45, corr: 0.71, bias: 0.32, inferenceTimeMs: 12, status: "Baseline" },
  { id: "model-cnn", name: "CNN / U-Net", category: "Deep Learning", overallRMSE: 1.38, thermoclineRMSE: 1.92, deepRMSE: 0.89, corr: 0.84, bias: -0.15, inferenceTimeMs: 45, status: "Trained" },
  { id: "model-ae", name: "Convolutional Autoencoder", category: "Representation Learning", overallRMSE: 1.21, thermoclineRMSE: 1.68, deepRMSE: 0.78, corr: 0.87, bias: 0.09, inferenceTimeMs: 38, status: "Trained" },
  { id: "model-vit-oceanembed", name: "OceanEmbed-ViT", category: "Vision Transformer + Embedding", overallRMSE: 0.86, thermoclineRMSE: 1.12, deepRMSE: 0.54, corr: 0.92, bias: -0.07, inferenceTimeMs: 62, status: "★ Production" }
];

const prng = createSeededPRNG(26066);

export function createPRNG(seed) { return createSeededPRNG(seed); }

export function getDeterministicGrid(depth = 0, regionId = "nio") {
  const region = REGIONS[regionId] || REGIONS.nio;
  const latSteps = Math.round((region.latMax - region.latMin) / 0.25);
  const lonSteps = Math.round((region.lonMax - region.lonMin) / 0.25);
  const rng = createSeededPRNG(depth * 1000 + regionId.length * 7);
  const grid = [];

  for (let i = 0; i < latSteps; i++) {
    const row = [];
    for (let j = 0; j < lonSteps; j++) {
      const lat = region.latMin + i * 0.25;
      const lon = region.lonMin + j * 0.25;
      let baseTemp = region.meanSST - (depth / 1000) * 22;
      const latEffect = Math.sin((lat - region.latMin) / (region.latMax - region.latMin) * Math.PI) * 1.5;
      const lonEffect = Math.cos((lon - region.lonMin) / (region.lonMax - region.lonMin) * Math.PI) * 0.8;
      baseTemp += latEffect + lonEffect + (rng() - 0.5) * 0.6;
      if (depth >= 50 && depth <= 200) baseTemp -= rng() * 1.5;
      row.push({ lat, lon, temp: parseFloat(Math.max(4, baseTemp).toFixed(2)) });
    }
    grid.push(row);
  }
  return grid;
}

export function getDeterministicProfile(lat, lon, date = "2025-04-25") {
  const seed = Math.round(lat * 100 + lon * 10 + parseInt(date.replace(/-/g, "").slice(-4)));
  const rng = createSeededPRNG(seed);
  return OFFICIAL_DEPTHS.map(depth => {
    let predicted = 29.5 - (depth / 1000) * 22 + (rng() - 0.5) * 0.8;
    if (depth >= 50 && depth <= 200) predicted -= rng() * 2.0;
    predicted = Math.max(5.5, predicted);
    const observed = predicted + (rng() - 0.5) * 1.2;
    const error = parseFloat((predicted - observed).toFixed(3));
    return { depth, predicted: parseFloat(predicted.toFixed(2)), observed: parseFloat(observed.toFixed(2)), error };
  });
}

export function getValidationMetrics() {
  const rng = createSeededPRNG(42);
  const scatterPoints = [];
  for (let i = 0; i < 200; i++) {
    const observed = 5 + rng() * 25;
    const predicted = observed + (rng() - 0.5) * 2.5;
    scatterPoints.push({ observed: parseFloat(observed.toFixed(2)), predicted: parseFloat(predicted.toFixed(2)) });
  }
  const depthMetrics = OFFICIAL_DEPTHS.map(d => {
    let rmse = 0.3 + (d >= 50 && d <= 200 ? 0.8 : 0.2) + rng() * 0.3;
    let corr = 0.96 - (d >= 50 && d <= 200 ? 0.08 : 0.02) - rng() * 0.04;
    let bias = (rng() - 0.5) * 0.4;
    return { depth: d, rmse: parseFloat(rmse.toFixed(3)), corr: parseFloat(corr.toFixed(3)), bias: parseFloat(bias.toFixed(3)) };
  });
  return { scatterPoints, depthMetrics };
}

export function getRuns() {
  return [
    { id: "run-001", date: "25 Apr 2025", time: "06:00", domain: "NIO Full", rmse: "0.86 °C", status: "Validated" },
    { id: "run-002", date: "24 Apr 2025", time: "06:00", domain: "Arabian Sea", rmse: "0.91 °C", status: "Validated" },
    { id: "run-003", date: "23 Apr 2025", time: "06:00", domain: "Bay of Bengal", rmse: "0.83 °C", status: "Validated" },
    { id: "run-004", date: "22 Apr 2025", time: "06:00", domain: "NIO Full", rmse: "0.88 °C", status: "Validated" }
  ];
}

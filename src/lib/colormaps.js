function lerp(t, stops) {
  const x = Math.max(0, Math.min(1, t))
  const u = x * (stops.length - 1)
  const k = Math.min(stops.length - 2, Math.floor(u))
  const f = u - k
  const a = stops[k]
  const b = stops[k + 1]
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ]
}

/** matplotlib-like turbo / jet for SST and reconstructed θ */
export const JET = [
  [48, 18, 59], [59, 82, 139], [33, 144, 141], [94, 201, 98],
  [253, 231, 37], [253, 141, 60], [227, 26, 28],
]

/** inferno — evaporation / heat flux */
export const INFERNO = [
  [0, 0, 4], [40, 11, 71], [101, 21, 87], [159, 42, 99],
  [212, 72, 66], [245, 125, 21], [252, 195, 90], [252, 255, 164],
]

/** bathymetry + eddy panel */
export const BATHY = [
  [12, 44, 80], [24, 98, 140], [70, 160, 180], [180, 210, 160], [232, 214, 90], [196, 92, 38],
]

export const TERRAIN = [
  [90, 110, 70], [140, 150, 90], [176, 164, 120], [210, 200, 170], [235, 232, 220],
]

export function cmap(stops, v, vmin, vmax) {
  if (!Number.isFinite(v)) return [16, 24, 32]
  return lerp((v - vmin) / (vmax - vmin || 1), stops)
}

export function turbo(v, vmin, vmax) { return cmap(JET, v, vmin, vmax) }
export function inferno(v, vmin, vmax) { return cmap(INFERNO, v, vmin, vmax) }
export function bathy(v, vmin, vmax) { return cmap(BATHY, v, vmin, vmax) }
export function terrain(v, vmin, vmax) { return cmap(TERRAIN, v, vmin, vmax) }

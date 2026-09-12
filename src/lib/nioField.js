/**
 * Deterministic 0.25° North Indian Ocean field for the SIH26066 PoC.
 * Domain: 5°N–30°N, 45°E–105°E. Surface state + 15-depth reconstruction.
 */
import { OCEAN_REGIONS, OFFICIAL_DEPTHS, REAL_ARGO_FLOATS } from './realOceanData'
import { MODEL, onModelGridReady } from './modelStore'

export const LAT_MIN = 5
export const LAT_MAX = 30
export const LON_MIN = 45
export const LON_MAX = 105
export const DX = 0.25
export const N_LAT = Math.round((LAT_MAX - LAT_MIN) / DX) + 1
export const N_LON = Math.round((LON_MAX - LON_MIN) / DX) + 1

export const DATES = [
  { id: MODEL.sample_date, label: '29 Aug 2024 · OceanUNet test' },
]

export const MODEL_DATE = MODEL.sample_date

function modelIndex(lat, lon) {
  const i = Math.round((lat - MODEL.lat_min) / MODEL.dx)
  const j = Math.round((lon - MODEL.lon_min) / MODEL.dx)
  if (i < 0 || j < 0 || i >= MODEL.n_lat || j >= MODEL.n_lon) return -1
  return i * MODEL.n_lon + j
}

function modelTheta(lat, lon, depth) {
  const k = modelIndex(lat, lon)
  if (k < 0) return null
  if (depth <= 0) {
    const sst = MODEL.sst
    return sst && sst[k] != null ? sst[k] : null
  }
  const d = depth >= 1000 ? 700 : depth
  const arr = MODEL.maps?.pred?.[String(d)]
  if (!arr) return null
  const v = arr[k]
  return v == null ? null : v
}

export const LAYERS = [
  { id: 'theta', label: 'θ reconstructed', unit: '°C', min: 6, max: 31 },
  { id: 'sst', label: 'SST', unit: '°C', min: 24, max: 32 },
  { id: 'sss', label: 'SSS', unit: 'PSU', min: 31, max: 37 },
  { id: 'sla', label: 'SLA', unit: 'm', min: -0.22, max: 0.22 },
  { id: 'currents', label: 'Currents', unit: 'm/s', min: 0, max: 1.15 },
  { id: 'winds', label: 'Winds', unit: 'm/s', min: 0, max: 12 },
  { id: 'evap', label: 'TCHP (UNet column)', unit: 'kJ/cm²', min: 0, max: 120 },
  { id: 'eddy', label: '7-day cyclone P', unit: '', min: 0, max: 0.7 },
]

export const CYCLONES = (MODEL.cyclone_tracks && MODEL.cyclone_tracks.length)
  ? MODEL.cyclone_tracks
  : []

export const EDDY_BOXES = [
  { id: 'as', lon0: 62, lon1: 73.5, lat0: 10.2, lat1: 16.2, stroke: '#16191f' },
  { id: 'bob', lon0: 81.5, lon1: 93.5, lat0: 10.0, lat1: 16.4, stroke: '#1d4ed8' },
]

export const BASIN_LABELS = [
  { text: 'Arabian Sea', lon: 62, lat: 15.2 },
  { text: 'Bay of Bengal', lon: 88.5, lat: 14.5 },
  { text: 'Indian Peninsula', lon: 77.2, lat: 22.4 },
  { text: 'Somalia', lon: 48.2, lat: 8.5 },
  { text: 'SL', lon: 81.2, lat: 7.4 },
]

const REGIMES = Object.values(OCEAN_REGIONS)

function inPoly(lon, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0]
    const yi = ring[i][1]
    const xj = ring[j][0]
    const yj = ring[j][1]
    const hit = (yi > lat) !== (yj > lat)
      && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-9) + xi
    if (hit) inside = !inside
  }
  return inside
}

const INDIA = [
  [77.5, 8.08], [78.1, 8.9], [80.3, 13.1], [80.15, 14.6], [80.3, 15.9],
  [81.3, 16.3], [82.3, 16.8], [83.3, 17.7], [84.5, 18.0], [85.0, 19.8],
  [86.6, 20.3], [87.6, 21.3], [88.9, 21.6], [91.7, 22.2], [92.2, 24.4],
  [88.4, 26.4], [80.2, 28.2], [77.2, 28.4], [74.2, 24.6], [72.8, 23.1],
  [70.0, 22.6], [69.7, 21.6], [72.5, 21.3], [72.85, 19.0], [73.0, 16.6],
  [74.1, 14.8], [74.8, 12.9], [75.8, 11.1], [76.3, 9.9], [77.5, 8.08],
]
const ARABIA = [
  [45, 12.8], [47.8, 13.0], [49.2, 14.4], [52.2, 16.6], [54.8, 17.2],
  [56.4, 18.0], [59.6, 22.6], [58.4, 26.2], [54.6, 27.0], [48.4, 28.2], [45, 28.6],
]
const HORN = [
  [45, 5], [48.6, 5], [49.4, 8.0], [50.8, 10.4], [51.4, 11.6], [49.2, 11.5], [45, 12.2],
]
const SRI = [
  [79.7, 5.95], [81.9, 6.15], [81.9, 8.55], [80.2, 9.85], [79.6, 8.1],
]
const SEASIA = [
  [94.4, 16.0], [98.2, 13.4], [100.6, 13.0], [105, 16.2], [105, 30],
  [97.6, 30], [95.0, 21.4], [93.4, 19.9], [94.0, 17.6],
]
const ANDAMAN = [
  [92.5, 10.7], [93.1, 10.7], [93.3, 13.6], [92.6, 13.6],
]
const PAKISTAN = [
  [61.0, 23.6], [68.0, 23.4], [70.2, 24.6], [75.6, 26.8], [74.8, 30.0],
  [66.0, 30.0], [61.2, 28.0],
]
const BANGLADESH = [
  [88.0, 21.3], [91.8, 21.0], [92.6, 20.8], [92.7, 26.6], [88.1, 26.5],
]
const IRAN = [
  [48.0, 25.0], [61.2, 25.2], [61.2, 30.0], [48.0, 30.0],
]
const HIMALAYA = [
  [70.5, 26.0], [88.0, 26.0], [92.8, 26.4], [97.5, 26.8], [105, 27.2],
  [105, 30], [70.5, 30],
]
const INDOCHINA = [
  [97.4, 16.2], [105, 16.2], [105, 30], [97.4, 30],
]
const MALAY = [
  [99.4, 5.0], [103.6, 5.0], [104.4, 8.2], [102.4, 10.2], [100.2, 8.0], [99.4, 6.2],
]

export function isLand(lat, lon) {
  if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return true
  if (lat >= 23.4 && lon >= 71 && lon <= 105) return true
  if (lat >= 16.2 && lon >= 94.2) return true
  return inPoly(lon, lat, INDIA)
    || inPoly(lon, lat, ARABIA)
    || inPoly(lon, lat, HORN)
    || inPoly(lon, lat, SRI)
    || inPoly(lon, lat, SEASIA)
    || inPoly(lon, lat, ANDAMAN)
    || inPoly(lon, lat, PAKISTAN)
    || inPoly(lon, lat, BANGLADESH)
    || inPoly(lon, lat, IRAN)
    || inPoly(lon, lat, HIMALAYA)
    || inPoly(lon, lat, INDOCHINA)
    || inPoly(lon, lat, MALAY)
}

/** Water only, eroded off the coast so overlays never sit on Carto land. */
export function isOcean(lat, lon) {
  const i = Math.round((lat - LAT_MIN) / DX)
  const j = Math.round((lon - LON_MIN) / DX)
  if (i < 0 || j < 0 || i >= N_LAT || j >= N_LON) return false
  return OCEAN[i * N_LON + j] === 1
}

export function latAt(i) { return LAT_MIN + i * DX }
export function lonAt(j) { return LON_MIN + j * DX }

const LAND = new Uint8Array(N_LAT * N_LON)
for (let i = 0; i < N_LAT; i++) {
  for (let j = 0; j < N_LON; j++) {
    LAND[i * N_LON + j] = isLand(latAt(i), lonAt(j)) ? 1 : 0
  }
}

const OCEAN = new Uint8Array(N_LAT * N_LON)
const ERODE = 2
for (let i = 0; i < N_LAT; i++) {
  for (let j = 0; j < N_LON; j++) {
    if (LAND[i * N_LON + j]) continue
    let wet = 1
    for (let di = -ERODE; di <= ERODE && wet; di++) {
      for (let dj = -ERODE; dj <= ERODE; dj++) {
        const ii = i + di
        const jj = j + dj
        if (ii < 0 || jj < 0 || ii >= N_LAT || jj >= N_LON || LAND[ii * N_LON + jj]) {
          wet = 0
          break
        }
      }
    }
    OCEAN[i * N_LON + j] = wet
  }
}

function packed(name, k) {
  const arr = MODEL[name]
  if (!arr || k < 0 || k >= arr.length) return null
  const v = arr[k]
  return v == null ? null : v
}

export function sampleSurface(lat, lon, dateId = MODEL.sample_date) {
  const k = modelIndex(lat, lon)
  const sst = packed('sst', k)
  const sss = packed('sss', k)
  const sla = packed('sla', k)
  const u = packed('current_u', k)
  const v = packed('current_v', k)
  const wu = packed('wind_u', k)
  const wv = packed('wind_v', k)
  const speed = packed('current_speed', k) ?? (u != null && v != null ? Math.hypot(u, v) : null)
  const wind = packed('wind_speed', k) ?? (wu != null && wv != null ? Math.hypot(wu, wv) : null)
  const tchp = packed('tchp', k)
  const cycloneP = packed('cyclone_prob', k)
  return {
    sst: sst ?? NaN,
    sss: sss ?? NaN,
    sla: sla ?? NaN,
    u: u ?? 0,
    v: v ?? 0,
    wu: wu ?? 0,
    wv: wv ?? 0,
    speed: speed ?? 0,
    wind: wind ?? 0,
    evap: tchp ?? NaN,
    eddy: cycloneP ?? NaN,
    tchp: tchp ?? NaN,
    d26: packed('d26', k),
    d20: packed('d20', k),
    cycloneP: cycloneP ?? NaN,
  }
}

export function reconstructProfile(lat, lon, dateId = MODEL.sample_date) {
  const rows = []
  for (const depth of OFFICIAL_DEPTHS) {
    const predicted = modelTheta(lat, lon, depth)
    rows.push({
      depth,
      predicted: predicted == null ? NaN : Number(predicted),
    })
  }
  return rows
}

export function embeddingAt(lat, lon, dateId = '2025-04-25') {
  const s = sampleSurface(lat, lon, dateId)
  const x = [s.sst / 30, s.sss / 36, s.sla * 4, s.u, s.v, s.wu / 12, s.wv / 12, lat / 30, lon / 105]
  const z = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const a = Math.sin(i * 0.37 + x[i % 9] * 4.1)
    const b = Math.cos(i * 0.13 + x[(i + 3) % 9] * 3.2)
    z[i] = Math.tanh(a * 0.65 + b * 0.5 + ((i % 16) - 8) / 40)
  }
  return z
}

const fieldCache = new Map()
onModelGridReady(() => fieldCache.clear())

export function getField(layerId, depth, dateId) {
  const key = `${layerId}|${depth}|${dateId}`
  const hit = fieldCache.get(key)
  if (hit) return hit
  const values = new Float32Array(N_LAT * N_LON)
  const land = new Uint8Array(N_LAT * N_LON)
  let vmin = Infinity
  let vmax = -Infinity
  for (let i = 0; i < N_LAT; i++) {
    const lat = latAt(i)
    for (let j = 0; j < N_LON; j++) {
      const lon = lonAt(j)
      const idx = i * N_LON + j
      if (LAND[idx]) {
        land[idx] = 1
        values[idx] = NaN
        continue
      }
      const s = sampleSurface(lat, lon, dateId)
      let v = s.sst
      if (layerId === 'sss') v = s.sss
      else if (layerId === 'sla') v = s.sla
      else if (layerId === 'currents') v = s.speed
      else if (layerId === 'winds') v = s.wind
      else if (layerId === 'evap') v = s.tchp
      else if (layerId === 'eddy') v = s.cycloneP
      else if (layerId === 'theta') {
        v = modelTheta(lat, lon, depth)
        if (v == null) v = NaN
      } else if (layerId === 'sst') {
        v = s.sst
      }
      values[idx] = v
      if (v < vmin) vmin = v
      if (v > vmax) vmax = v
    }
  }
  const out = { values, land, vmin, vmax }
  fieldCache.set(key, out)
  return out
}

export function vectorsFor(layerId, dateId, stride = 8) {
  if (layerId !== 'currents' && layerId !== 'winds') return []
  const out = []
  for (let i = stride; i < N_LAT; i += stride) {
    for (let j = stride; j < N_LON; j += stride) {
      const lat = latAt(i)
      const lon = lonAt(j)
      if (LAND[i * N_LON + j]) continue
      const s = sampleSurface(lat, lon, dateId)
      out.push({
        i, j, lat, lon,
        u: layerId === 'currents' ? s.u : s.wu / 10,
        v: layerId === 'currents' ? s.v : s.wv / 10,
      })
    }
  }
  return out
}

export const ARGO_STATIONS = REAL_ARGO_FLOATS.map((f) => ({
  wmo: f.wmo,
  basin: f.basin,
  lat: f.lat,
  lon: f.lon,
  rmse: f.floatRMSE,
}))

function lerpColor(t, stops) {
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

const TEMP_STOPS = [[11, 20, 28], [18, 42, 58], [33, 79, 74], [166, 132, 74], [196, 92, 38]]
const SALT_STOPS = [[196, 165, 116], [180, 140, 80], [33, 79, 74], [11, 28, 36]]
const SLA_STOPS = [[196, 92, 38], [241, 235, 225], [33, 79, 74]]
const SPEED_STOPS = [[11, 20, 28], [33, 79, 74], [196, 165, 116], [196, 92, 38]]

export function colorFor(layerId, v, vmin, vmax) {
  if (!Number.isFinite(v)) return [11, 20, 28]
  const t = (v - vmin) / (vmax - vmin || 1)
  if (layerId === 'sss') return lerpColor(t, SALT_STOPS)
  if (layerId === 'sla') return lerpColor(t, SLA_STOPS)
  if (layerId === 'currents' || layerId === 'winds') return lerpColor(t, SPEED_STOPS)
  return lerpColor(t, TEMP_STOPS)
}

export function sampleFieldValue(field, lat, lon) {
  const fi = (lat - LAT_MIN) / DX
  const fj = (lon - LON_MIN) / DX
  const i0 = Math.max(0, Math.min(N_LAT - 2, Math.floor(fi)))
  const j0 = Math.max(0, Math.min(N_LON - 2, Math.floor(fj)))
  const ti = fi - i0
  const tj = fj - j0
  const at = (ii, jj) => {
    const idx = ii * N_LON + jj
    if (field.land[idx]) return null
    return field.values[idx]
  }
  const corners = [
    [(1 - ti) * (1 - tj), at(i0, j0)],
    [(1 - ti) * tj, at(i0, j0 + 1)],
    [ti * (1 - tj), at(i0 + 1, j0)],
    [ti * tj, at(i0 + 1, j0 + 1)],
  ].filter((p) => p[1] != null)
  if (!corners.length) return { land: true, value: NaN }
  const wsum = corners.reduce((s, p) => s + p[0], 0)
  return { land: false, value: corners.reduce((s, p) => s + p[0] * p[1], 0) / wsum }
}

export function tchpAt(lat, lon, dateId = MODEL.sample_date) {
  const s = sampleSurface(lat, lon, dateId)
  if (Number.isFinite(s.tchp)) return Number(s.tchp.toFixed(1))
  const profile = reconstructProfile(lat, lon, dateId)
  let h = 0
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]
    const b = profile[i]
    if (!Number.isFinite(a.predicted) || !Number.isFinite(b.predicted)) continue
    const t = (a.predicted + b.predicted) / 2
    if (t > 26) h += (b.depth - a.depth) * (t - 26)
  }
  return Number((h * 0.4104).toFixed(1))
}

export function getTransect(lat, dateId = '2025-04-25') {
  const lons = []
  const land = []
  const values = []
  for (let j = 0; j < N_LON; j++) {
    const lon = lonAt(j)
    lons.push(lon)
    const wet = isOcean(lat, lon)
    land.push(!wet)
    const col = OFFICIAL_DEPTHS.map((d) => {
      if (!wet) return NaN
      const p = reconstructProfile(lat, lon, dateId)
      return (p.find((x) => x.depth === d) || p[0]).predicted
    })
    values.push(col)
  }
  return { lat, lons, depths: OFFICIAL_DEPTHS, land, values }
}

export function transectSegments(lat) {
  const segs = []
  let cur = []
  for (let j = 0; j < N_LON; j++) {
    const lon = lonAt(j)
    if (isOcean(lat, lon)) cur.push([lon, lat])
    else {
      if (cur.length > 1) segs.push(cur)
      cur = []
    }
  }
  if (cur.length > 1) segs.push(cur)
  return segs
}

export function isLandGlobal(lat, lon) {
  let L = lon
  while (L > 180) L -= 360
  while (L < -180) L += 360
  if (lat <= -60) return true
  if (lat >= 5 && lat <= 30 && L >= 45 && L <= 105) return isLand(lat, L)
  if (inPoly(L, lat, AFRICA) || inPoly(L, lat, EURASIA) || inPoly(L, lat, AMERICAS)
    || inPoly(L, lat, AUST) || inPoly(L, lat, GREENLAND)) return true
  return false
}

const AFRICA = [
  [-17, 12], [-16, 22], [-5, 36], [11, 37], [32, 31], [43, 11], [51, 11.8],
  [44, -12], [40, -27], [20, -35], [18, -33], [12, -17], [9, 4], [-8, 5], [-17, 12],
]
const EURASIA = [
  [-10, 36], [0, 43], [10, 55], [28, 71], [60, 70], [100, 72], [140, 70], [180, 66],
  [180, 48], [142, 46], [130, 32], [122, 22], [105, 16], [105, 30], [92, 28],
  [80, 28.5], [60, 45], [48, 36], [40, 36], [28, 31], [20, 36], [-10, 36],
]
const AMERICAS = [
  [-168, 66], [-140, 70], [-90, 72], [-60, 60], [-55, 48], [-70, 18], [-80, 8],
  [-78, -5], [-70, -20], [-75, -50], [-68, -56], [-75, -45], [-82, -5],
  [-105, 22], [-125, 38], [-125, 50], [-168, 66],
]
const AUST = [[113, -12], [153, -11], [153, -39], [115, -35], [113, -12]]
const GREENLAND = [[-73, 78], [-20, 82], [-12, 70], [-44, 60], [-73, 78]]

export function globalSST(lat, lon, dateId = '2025-04-25') {
  if (isLandGlobal(lat, lon)) return NaN
  const φ = (lat * Math.PI) / 180
  let sst = 1.8 + 27.4 * Math.pow(Math.max(0, Math.cos(φ)), 1.35)
  sst += 1.1 * Math.sin(((lon + 40) * Math.PI) / 180) * Math.cos(φ)
  if (lat < -45) sst -= 4
  if (lat > 5 && lat < 30 && lon > 45 && lon < 105 && !isLand(lat, lon)) {
    return sampleSurface(lat, lon, dateId).sst
  }
  return Math.max(-1.7, Math.min(32, sst))
}

export function globalTheta(lat, lon, depth, dateId = '2025-04-25') {
  if (isLandGlobal(lat, lon)) return NaN
  if (lat > 5 && lat < 30 && lon > 45 && lon < 105 && !isLand(lat, lon)) {
    const p = reconstructProfile(lat, lon, dateId)
    return (p.find((x) => x.depth === depth) || p[0]).predicted
  }
  const sst = globalSST(lat, lon, dateId)
  if (!Number.isFinite(sst)) return NaN
  return Math.max(1.2, sst - (depth / 1000) * (sst - 2.4) - (depth > 50 ? 2.2 : 0) * Math.min(1, (depth - 50) / 120))
}

/** 0.25° frame over ocean only — never drawn across India / land. */
export function nioFrameGridGeoJSON(step = 0.25) {
  const features = []
  const flush = (run, kind) => {
    if (run.length >= 2) {
      features.push({
        type: 'Feature',
        properties: { kind },
        geometry: { type: 'LineString', coordinates: run.slice() },
      })
    }
  }
  for (let lat = LAT_MIN; lat <= LAT_MAX + 1e-6; lat += step) {
    const run = []
    for (let lon = LON_MIN; lon <= LON_MAX + 1e-6; lon += step) {
      if (isOcean(lat, lon)) run.push([lon, lat])
      else {
        flush(run, 'lat')
        run.length = 0
      }
    }
    flush(run, 'lat')
  }
  for (let lon = LON_MIN; lon <= LON_MAX + 1e-6; lon += step) {
    const run = []
    for (let lat = LAT_MIN; lat <= LAT_MAX + 1e-6; lat += step) {
      if (isOcean(lat, lon)) run.push([lon, lat])
      else {
        flush(run, 'lon')
        run.length = 0
      }
    }
    flush(run, 'lon')
  }
  return { type: 'FeatureCollection', features }
}

/** One 0.25° cell in the Bay of Bengal, for the legend callout. */
export const EXAMPLE_CELL = { lon: 91.75, lat: 16.0, d: 0.25 }

export function exampleCellGeoJSON() {
  const { lon, lat, d } = EXAMPLE_CELL
  return {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      properties: { label: '0.25° × 0.25° grid cell' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [lon, lat],
          [lon + d, lat],
          [lon + d, lat + d],
          [lon, lat + d],
          [lon, lat],
        ]],
      },
    }],
  }
}

export function oceanGridGeoJSON(layerId, depth, dateId, step = 1) {
  const field = getField(layerId, depth, dateId)
  const d = DX * step
  const pad = d * 0.08
  const features = []
  for (let i = 0; i < N_LAT - step; i += step) {
    for (let j = 0; j < N_LON - step; j += step) {
      const lat = latAt(i)
      const lon = lonAt(j)
      const midLat = lat + d / 2
      const midLon = lon + d / 2
      if (!isOcean(midLat, midLon)) continue
      const v = field.values[i * N_LON + j]
      if (!Number.isFinite(v)) continue
      features.push({
        type: 'Feature',
        properties: { t: Number(v.toFixed(3)), id: i * N_LON + j },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lon - pad, lat - pad],
            [lon + d + pad, lat - pad],
            [lon + d + pad, lat + d + pad],
            [lon - pad, lat + d + pad],
            [lon - pad, lat - pad],
          ]],
        },
      })
    }
  }
  return { type: 'FeatureCollection', features }
}

export function gridFromPointer(nx, ny, w, h) {
  const lon = LON_MIN + (nx / w) * (LON_MAX - LON_MIN)
  const lat = LAT_MAX - (ny / h) * (LAT_MAX - LAT_MIN)
  const j = Math.round((lon - LON_MIN) / DX)
  const i = Math.round((lat - LAT_MIN) / DX)
  return {
    lat: Number(lat.toFixed(2)),
    lon: Number(lon.toFixed(2)),
    i: Math.max(0, Math.min(N_LAT - 1, i)),
    j: Math.max(0, Math.min(N_LON - 1, j)),
  }
}

import { bathy, inferno, terrain, turbo } from './colormaps'
import {
  BASIN_LABELS, CYCLONES, EDDY_BOXES, LAT_MAX, LAT_MIN, LON_MAX, LON_MIN,
  colorFor, getField, isOcean, sampleFieldValue,
} from './nioField'

export function xy(lon, lat, w, h) {
  return {
    x: ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * w,
    y: ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * h,
  }
}

export function colorOf(layerId, v, vmin, vmax) {
  if (layerId === 'evap') return inferno(v, vmin, vmax)
  if (layerId === 'eddy') return bathy(v, vmin, vmax)
  if (layerId === 'sst' || layerId === 'theta') return turbo(v, vmin, vmax)
  return colorFor(layerId, v, vmin, vmax)
}

export function paintField(ctx, field, layerId, vmin, vmax, dw, dh, landRgb = [14, 22, 32]) {
  const img = ctx.createImageData(dw, dh)
  const data = img.data
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const lon = LON_MIN + (x / dw) * (LON_MAX - LON_MIN)
      const lat = LAT_MAX - (y / dh) * (LAT_MAX - LAT_MIN)
      const p = (y * dw + x) * 4
      const cell = sampleFieldValue(field, lat, lon)
      const wet = isOcean(lat, lon) && !cell.land
      const [r, g, b] = wet ? colorOf(layerId, cell.value, vmin, vmax) : landRgb
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

export function paintLandTerrain(ctx, field, dw, dh) {
  const img = ctx.getImageData(0, 0, dw, dh)
  const data = img.data
  for (let y = 0; y < dh; y++) {
    for (let x = 0; x < dw; x++) {
      const lon = LON_MIN + (x / dw) * (LON_MAX - LON_MIN)
      const lat = LAT_MAX - (y / dh) * (LAT_MAX - LAT_MIN)
      const cell = sampleFieldValue(field, lat, lon)
      if (!cell.land) continue
      const elev = Math.max(0, Math.min(1, (lat - 5) / 28 + ((lon - 70) / 80) * 0.15))
      const [r, g, b] = terrain(elev, 0, 1)
      const p = (y * dw + x) * 4
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

export function drawTracks(ctx, w, h, { dark = true } = {}) {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  CYCLONES.forEach((c) => {
    ctx.beginPath()
    c.points.forEach(([lon, lat], i) => {
      const { x, y } = xy(lon, lat, w, h)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = dark ? '#0b0b0b' : '#efe8dc'
    ctx.lineWidth = 2.2
    ctx.stroke()
    const a = xy(c.points[0][0], c.points[0][1], w, h)
    const b = xy(c.points[c.points.length - 1][0], c.points[c.points.length - 1][1], w, h)
    ;[a, b].forEach((pt, i) => {
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#fff' : '#111'
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 1.4
      ctx.fill()
      ctx.stroke()
    })
    const mid = c.points[Math.floor(c.points.length / 2)]
    const m = xy(mid[0] + 1.2, mid[1], w, h)
    ctx.fillStyle = dark ? '#111' : '#efe8dc'
    ctx.font = '600 12px "IBM Plex Sans", sans-serif'
    ctx.fillText(c.name, m.x, m.y)
  })
}

export function drawBoxes(ctx, w, h) {
  EDDY_BOXES.forEach((b) => {
    const a = xy(b.lon0, b.lat1, w, h)
    const c = xy(b.lon1, b.lat0, w, h)
    ctx.strokeStyle = b.stroke
    ctx.lineWidth = 1.6
    ctx.strokeRect(a.x, a.y, c.x - a.x, c.y - a.y)
  })
}

export function drawLabels(ctx, w, h, fill = 'rgba(15,18,22,0.82)') {
  ctx.fillStyle = fill
  ctx.font = 'italic 13px "Source Serif 4", Georgia, serif'
  BASIN_LABELS.forEach((l) => {
    const { x, y } = xy(l.lon, l.lat, w, h)
    ctx.fillText(l.text, x, y)
  })
}

export function buildOceanRaster(layerId, depth, dateId, vmin, vmax, scale = 2) {
  const field = getField(layerId, depth, dateId)
  const w = Math.max(2, Math.round((LON_MAX - LON_MIN) / 0.25) * scale)
  const h = Math.max(2, Math.round((LAT_MAX - LAT_MIN) / 0.25) * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const data = img.data
  for (let y = 0; y < h; y++) {
    const lat = LAT_MAX - (y / (h - 1)) * (LAT_MAX - LAT_MIN)
    for (let x = 0; x < w; x++) {
      const lon = LON_MIN + (x / (w - 1)) * (LON_MAX - LON_MIN)
      const p = (y * w + x) * 4
      if (!isOcean(lat, lon)) {
        data[p + 3] = 0
        continue
      }
      const cell = sampleFieldValue(field, lat, lon)
      if (cell.land || !Number.isFinite(cell.value)) {
        data[p + 3] = 0
        continue
      }
      const [r, g, b] = colorOf(layerId, cell.value, vmin, vmax)
      data[p] = r
      data[p + 1] = g
      data[p + 2] = b
      data[p + 3] = 220
    }
  }
  ctx.putImageData(img, 0, 0)
  return {
    url: canvas.toDataURL('image/png'),
    coordinates: [
      [LON_MIN, LAT_MAX],
      [LON_MAX, LAT_MAX],
      [LON_MAX, LAT_MIN],
      [LON_MIN, LAT_MIN],
    ],
  }
}

export function drawGrid(ctx, w, h, stroke = 'rgba(22,25,31,0.18)') {
  ctx.strokeStyle = stroke
  ctx.lineWidth = 0.6
  for (let lon = 50; lon <= 100; lon += 10) {
    const { x } = xy(lon, LAT_MIN, w, h)
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
  }
  for (let lat = 10; lat <= 25; lat += 5) {
    const { y } = xy(LON_MIN, lat, w, h)
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }
}

import { turbo } from './colormaps'
import { globalSST, globalTheta, isLandGlobal } from './nioField'

const cache = new Map()

export function paintGlobeCanvas(mode, depth, dateId, w = 768, h = 384) {
  const key = `${mode}|${depth}|${dateId}|${w}`
  const hit = cache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const data = img.data

  for (let y = 0; y < h; y++) {
    const lat = 90 - (y / (h - 1)) * 180
    for (let x = 0; x < w; x++) {
      const lon = -180 + (x / (w - 1)) * 360
      const p = (y * w + x) * 4
      const land = isLandGlobal(lat, lon)
      if (land) {
        const ice = lat > 70 || lat < -62
        if (ice) {
          data[p] = 244; data[p + 1] = 247; data[p + 2] = 251; data[p + 3] = 255
        } else {
          const t = (lat + 40) / 100
          data[p] = Math.round(168 + t * 28)
          data[p + 1] = Math.round(164 + t * 22)
          data[p + 2] = Math.round(154 + t * 16)
          data[p + 3] = 255
        }
        continue
      }
      const v = mode === 'theta' ? globalTheta(lat, lon, depth, dateId) : globalSST(lat, lon, dateId)
      const [r, g, b] = turbo(v, -2, 32)
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  cache.set(key, canvas)
  return canvas
}

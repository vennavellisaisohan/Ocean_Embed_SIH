import { useEffect, useId } from 'react'
import { useMap } from '@/components/ui/map'
import { LAT_MAX, LAT_MIN, LON_MAX, LON_MIN, N_LAT, N_LON, getField, isOcean } from '../../lib/nioField'
import { colorOf } from '../../lib/paintNio'

function fieldToDataUrl(layerId, depth, dateId, vmin, vmax) {
  const field = getField(layerId, depth, dateId)
  const w = N_LON
  const h = N_LAT
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(w, h)
  const data = img.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (h - 1 - y)
      const idx = i * N_LON + x
      const p = (y * w + x) * 4
      const v = field.values[idx]
      const lat = LAT_MIN + i * ((LAT_MAX - LAT_MIN) / (N_LAT - 1))
      const lon = LON_MIN + x * ((LON_MAX - LON_MIN) / (N_LON - 1))
      const wet = isOcean(lat, lon) && Number.isFinite(v)
      if (!wet) {
        data[p + 3] = 0
        continue
      }
      const [r, g, b] = colorOf(layerId, v, vmin, vmax)
      data[p] = r
      data[p + 1] = g
      data[p + 2] = b
      data[p + 3] = 200
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/** One georeferenced image — no 0.25° polygon mesh. */
export function OceanFillLayer({ layerId, depth, dateId, vmin, vmax }) {
  const { map, isLoaded } = useMap()
  const uid = useId().replace(/:/g, '')
  const sourceId = `nio-raster-${uid}`
  const layerIdMap = `nio-raster-layer-${uid}`

  useEffect(() => {
    if (!map || !isLoaded) return undefined
    const url = fieldToDataUrl(layerId, depth, dateId, vmin, vmax)
    const coords = [
      [LON_MIN, LAT_MAX],
      [LON_MAX, LAT_MAX],
      [LON_MAX, LAT_MIN],
      [LON_MIN, LAT_MIN],
    ]
    if (map.getSource(sourceId)) {
      map.removeLayer(layerIdMap)
      map.removeSource(sourceId)
    }
    map.addSource(sourceId, { type: 'image', url, coordinates: coords })
    map.addLayer({
      id: layerIdMap,
      type: 'raster',
      source: sourceId,
      paint: { 'raster-opacity': 0.78, 'raster-fade-duration': 0 },
    })
    return () => {
      try {
        if (map.getLayer(layerIdMap)) map.removeLayer(layerIdMap)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch { /* style reload */ }
    }
  }, [map, isLoaded, layerId, depth, dateId, vmin, vmax, sourceId, layerIdMap])

  return null
}

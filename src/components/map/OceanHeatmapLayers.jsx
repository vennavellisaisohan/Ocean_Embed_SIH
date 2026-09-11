import { useEffect, useId } from 'react'
import { useMap } from '@/components/ui/map'

const HEATMAP_GRADIENT_COLORS = [
  '#3b1250',
  '#215c8c',
  '#2ca58e',
  '#f0e642',
  '#e31a1c',
]

const HEATMAP_COLOR_STOPS = [
  [0.15, HEATMAP_GRADIENT_COLORS[0]],
  [0.35, HEATMAP_GRADIENT_COLORS[1]],
  [0.55, HEATMAP_GRADIENT_COLORS[2]],
  [0.75, HEATMAP_GRADIENT_COLORS[3]],
  [1, HEATMAP_GRADIENT_COLORS[4]],
]

export function OceanHeatmapLayers({ data }) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `heatmap-source-${id}`
  const heatLayerId = `heatmap-layer-${id}`
  const pointLayerId = `heatmap-point-layer-${id}`

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, { type: 'geojson', data })
    }

    if (!map.getLayer(heatLayerId)) {
      map.addLayer({
        id: heatLayerId,
        type: 'heatmap',
        source: sourceId,
        maxzoom: 7,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 6, 0.9],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.45, 6, 1.35],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(59, 130, 246, 0)',
            ...HEATMAP_COLOR_STOPS.flat(),
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 6, 6, 26],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 4.8, 0.82, 7, 0.18],
        },
      })
    }

    if (!map.getLayer(pointLayerId)) {
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        minzoom: 5,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 1, 3, 6, 9],
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            1, HEATMAP_GRADIENT_COLORS[1],
            2.5, HEATMAP_GRADIENT_COLORS[2],
            4, HEATMAP_GRADIENT_COLORS[3],
            6, HEATMAP_GRADIENT_COLORS[4],
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.75)',
          'circle-opacity': ['interpolate', ['linear'], ['zoom'], 5, 0, 7, 0.75],
        },
      })
    }

    return () => {
      try {
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId)
        if (map.getLayer(heatLayerId)) map.removeLayer(heatLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
      } catch { /* style reload */ }
    }
  }, [map, isLoaded, sourceId, heatLayerId, pointLayerId])

  useEffect(() => {
    if (!map || !isLoaded) return
    const source = map.getSource(sourceId)
    if (source) source.setData(data)
  }, [map, isLoaded, sourceId, data])

  return null
}

export const heatmapLegendGradient = `linear-gradient(to right, ${HEATMAP_GRADIENT_COLORS.join(', ')})`

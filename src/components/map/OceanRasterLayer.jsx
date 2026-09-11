import { useEffect, useId, useMemo } from 'react'
import { useMap } from '@/components/ui/map'
import { buildOceanRaster } from '../../lib/paintNio'

export function OceanRasterLayer({ layerId, depth, dateId, vmin, vmax }) {
  const { map, isLoaded } = useMap()
  const rid = useId()
  const sourceId = `nio-raster-${rid}`
  const layerKey = `${sourceId}-layer`
  const image = useMemo(
    () => buildOceanRaster(layerId, depth, dateId, vmin, vmax),
    [layerId, depth, dateId, vmin, vmax],
  )

  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(sourceId)
    if (src && typeof src.updateImage === 'function') {
      src.updateImage({ url: image.url, coordinates: image.coordinates })
      return
    }
    if (!src) {
      map.addSource(sourceId, {
        type: 'image',
        url: image.url,
        coordinates: image.coordinates,
      })
    }
    if (!map.getLayer(layerKey)) {
      map.addLayer({
        id: layerKey,
        type: 'raster',
        source: sourceId,
        paint: {
          'raster-opacity': 0.86,
          'raster-fade-duration': 0,
          'raster-resampling': 'linear',
        },
      })
    }
  }, [map, isLoaded, sourceId, layerKey, image])

  useEffect(() => () => {
    if (!map) return
    try {
      if (map.getLayer(layerKey)) map.removeLayer(layerKey)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    } catch { /* style reload */ }
  }, [map, sourceId, layerKey])

  return null
}

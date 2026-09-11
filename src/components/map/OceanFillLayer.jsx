import { useMemo } from 'react'
import { MapGeoJSON } from '@/components/ui/map'
import { oceanGridGeoJSON } from '../../lib/nioField'

function colorExpr(vmin, vmax) {
  const span = vmax - vmin || 1
  const at = (t) => vmin + span * t
  return [
    'interpolate',
    ['linear'],
    ['get', 't'],
    at(0), '#30123b',
    at(0.18), '#3b528b',
    at(0.36), '#21918c',
    at(0.55), '#5ec962',
    at(0.75), '#fde725',
    at(1), '#e31a1c',
  ]
}

export function OceanFillLayer({ layerId, depth, dateId, vmin, vmax }) {
  const data = useMemo(
    () => oceanGridGeoJSON(layerId, depth, dateId, 1),
    [layerId, depth, dateId],
  )
  return (
    <MapGeoJSON
      data={data}
      fillPaint={{
        'fill-color': colorExpr(vmin, vmax),
        'fill-opacity': 0.92,
      }}
      linePaint={false}
    />
  )
}

import { useMemo } from 'react'
import { MapGeoJSON } from '@/components/ui/map'
import indiaBoundaryData from '../../lib/indiaBoundary.json'
import indiaLocData from '../../lib/indiaLoc.json'

/**
 * Survey of India (SOI) compliant national territory layer:
 * - Fills India in bold solid dark black (#000000) against MapLibre's grey basemap
 * - Outlines the entire sovereign frontier (including J&K, Ladakh, PoK up to 37.1°N, and Aksai Chin)
 *   in subtle MapLibre boundary grey (no yellow highlights)
 * - Renders the Line of Control (LoC) as a subtle grey dashed demarcation line
 * - No labels or floating pill badges, keeping the map clean as before
 */
export default function IndiaBoundaryLayers() {
  const boundary = useMemo(() => indiaBoundaryData, [])
  const loc = useMemo(() => indiaLocData, [])

  return (
    <>
      {/* 1. Sovereign Land: Bold India country in pure dark black */}
      <MapGeoJSON
        data={boundary}
        fillPaint={{
          'fill-color': '#000000',
          'fill-opacity': 1.0,
        }}
        linePaint={false}
        interactive={false}
      />

      {/* 2. Official Survey of India Boundary: Clean MapLibre boundary line (no yellow) */}
      <MapGeoJSON
        data={boundary}
        fillPaint={false}
        linePaint={{
          'line-color': 'rgba(140, 145, 155, 0.85)',
          'line-width': 1.5,
          'line-opacity': 1.0,
        }}
        interactive={false}
      />

      {/* 3. Line of Control: Subtle grey dashed demarcation (no red, no yellow) */}
      <MapGeoJSON
        data={loc}
        fillPaint={false}
        linePaint={{
          'line-color': 'rgba(110, 115, 125, 0.65)',
          'line-width': 1.2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.85,
        }}
        interactive={false}
      />
    </>
  )
}

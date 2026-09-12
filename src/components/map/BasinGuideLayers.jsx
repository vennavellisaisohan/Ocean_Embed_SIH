import { useMemo } from 'react'
import { MapGeoJSON, MapMarker, MarkerContent, MarkerPopup } from '@/components/ui/map'
import { REAL_ARGO_FLOATS } from '../../lib/realOceanData'
import { exampleCellGeoJSON, nioFrameGridGeoJSON } from '../../lib/nioField'

export default function BasinGuideLayers({ showObs = true, showExample = true, onPin }) {
  const grid = useMemo(() => nioFrameGridGeoJSON(0.25), [])
  const cell = useMemo(() => exampleCellGeoJSON(), [])

  return (
    <>
      <MapGeoJSON
        data={grid}
        fillPaint={false}
        linePaint={{
          'line-color': 'rgba(239,232,220,0.38)',
          'line-width': 0.7,
          'line-opacity': 0.9,
        }}
        interactive={false}
      />
      {showExample && (
        <MapGeoJSON
          data={cell}
          fillPaint={{ 'fill-color': '#f5e27a', 'fill-opacity': 0.85 }}
          linePaint={{ 'line-color': '#e8c44a', 'line-width': 2 }}
          interactive={false}
        />
      )}
      {showObs && REAL_ARGO_FLOATS.map((f) => (
        <MapMarker key={`obs-${f.wmo}`} longitude={f.lon} latitude={f.lat}>
          <MarkerContent>
            <button
              type="button"
              className="obs-dot"
              aria-label={`Argo ${f.wmo}`}
              onClick={(e) => {
                e.stopPropagation()
                onPin?.({ lat: f.lat, lon: f.lon })
              }}
            />
          </MarkerContent>
          <MarkerPopup closeButton>
            <p className="text-sm font-medium">Argo observation</p>
            <p className="text-muted-foreground mt-1 text-xs">
              WMO {f.wmo}
              <br />
              {f.lat.toFixed(2)}°N {f.lon.toFixed(2)}°E
              <br />
              {f.lastDate} · in-situ profile
            </p>
          </MarkerPopup>
        </MapMarker>
      ))}
    </>
  )
}

export function BasinGuideLegend() {
  return (
    <div className="basin-legend" aria-label="Grid and observations">
      <div><i className="swatch cell" /> 0.25° × 0.25° grid cell</div>
      <div><i className="swatch obs" /> Observation point (Argo)</div>
      <div className="note">Green = live Argo (Aug–Sep 2026). Color field = trained OceanUNet on 2024-08-29. Not mock.</div>
    </div>
  )
}

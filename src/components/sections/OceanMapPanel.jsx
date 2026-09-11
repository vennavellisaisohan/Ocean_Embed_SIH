import { useEffect, useMemo } from 'react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  MarkerLabel,
  MarkerPopup,
  useMap,
} from '@/components/ui/map'
import { REAL_ARGO_FLOATS } from '../../lib/realOceanData'
import { CYCLONES, isOcean, reconstructProfile, transectSegments } from '../../lib/nioField'
import { OceanFillLayer } from '../map/OceanFillLayer'
import { heatmapLegendGradient } from '../map/OceanHeatmapLayers'

function MapClickPin({ onPick }) {
  const { map, isLoaded } = useMap()
  useEffect(() => {
    if (!map || !isLoaded) return
    const onClick = (e) => {
      const lat = e.lngLat.lat
      const lon = e.lngLat.lng
      if (!isOcean(lat, lon)) return
      onPick({ lat: Number(lat.toFixed(2)), lon: Number(lon.toFixed(2)) })
    }
    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [map, isLoaded, onPick])
  return null
}

function ArgoMarkers({ dateId, depth, onPin }) {
  return REAL_ARGO_FLOATS.map((f) => {
    const profile = reconstructProfile(f.lat, f.lon, dateId)
    const at = profile.find((p) => p.depth === depth) || profile[0]
    return (
      <MapMarker key={f.wmo} longitude={f.lon} latitude={f.lat}>
        <MarkerContent>
          <button
            type="button"
            className="argo-pin"
            aria-label={`ARGO ${f.wmo}`}
            onClick={(e) => {
              e.stopPropagation()
              onPin({ lat: f.lat, lon: f.lon })
            }}
          />
        </MarkerContent>
        <MarkerLabel>{f.wmo}</MarkerLabel>
        <MarkerPopup closeButton>
          <p className="text-sm font-medium">ARGO {f.wmo}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {f.basin}
            <br />
            {f.lat.toFixed(2)}°N {f.lon.toFixed(2)}°E
            <br />
            {depth} m · θ {at.predicted.toFixed(2)} °C
            <br />
            RMSE {f.floatRMSE} °C · R {f.floatCorr}
          </p>
          <ul className="mt-2 space-y-0.5 font-mono text-[11px]">
            {profile.filter((p) => [0, 50, 100, 200, 500, 1000].includes(p.depth)).map((p) => (
              <li key={p.depth} style={{ color: p.depth === depth ? '#c4a574' : undefined }}>
                {p.depth} m · {p.predicted.toFixed(2)} °C
              </li>
            ))}
          </ul>
        </MarkerPopup>
      </MapMarker>
    )
  })
}

function NioMap({
  projection,
  layerId,
  depth,
  dateId,
  pin,
  onPin,
  meta,
  showCyclones,
  showArgo,
  showTransect,
  pitch = 0,
  zoom = 4.1,
  center = [76, 14],
}) {
  const cuts = showTransect && pin ? transectSegments(pin.lat) : []
  return (
    <Map
      key={projection?.type || 'mercator'}
      theme="dark"
      center={center}
      zoom={zoom}
      projection={projection}
      pitch={pitch}
      minZoom={1.4}
      maxZoom={8}
      className="ocean-map-canvas"
    >
      <OceanFillLayer
        layerId={layerId}
        depth={depth}
        dateId={dateId}
        vmin={meta.min}
        vmax={meta.max}
      />
      {onPin && <MapClickPin onPick={onPin} />}
      <MapControls showZoom showCompass showFullscreen position="bottom-right" />
      {cuts.map((seg, i) => (
        <MapRoute
          key={`cut-${i}`}
          coordinates={seg}
          color="#c4a574"
          width={2.2}
          opacity={0.95}
          dashArray={[2, 1]}
          interactive={false}
        />
      ))}
      {showCyclones && CYCLONES.map((c) => (
        <MapRoute
          key={c.name}
          coordinates={c.points}
          color="#efe8dc"
          width={2.6}
          opacity={0.95}
          interactive={false}
        />
      ))}
      {showArgo && onPin && <ArgoMarkers dateId={dateId} depth={depth} onPin={onPin} />}
      {pin && isOcean(pin.lat, pin.lon) && (
        <MapMarker longitude={pin.lon} latitude={pin.lat}>
          <MarkerContent>
            <div className="pin-selected" />
          </MarkerContent>
          <MarkerLabel>{pin.lat.toFixed(1)}°N</MarkerLabel>
        </MapMarker>
      )}
    </Map>
  )
}

export default function OceanMapPanel({
  view = 'live',
  layerId = 'theta',
  depth = 100,
  dateId = '2025-04-25',
  pin,
  onPin,
  meta,
  thetaAtDepth,
}) {
  const title = useMemo(() => {
    if (view === 'cyclone') return 'Evaporation · cyclone tracks'
    if (view === 'plates') return 'Sea surface temperature'
    if (layerId === 'theta') return `OceanEmbed θ · ${depth} m`
    return meta?.label || layerId
  }, [view, layerId, depth, meta])

  const activeLayer = view === 'cyclone' ? 'evap' : view === 'plates' ? 'sst' : layerId
  const activeMeta = view === 'cyclone'
    ? { min: 20, max: 300, unit: 'W/m²' }
    : view === 'plates'
      ? { min: 24, max: 32, unit: '°C' }
      : meta

  const globe = view === 'live' || view === 'globe' || view === 'cyclone'
  const projection = globe ? { type: 'globe' } : { type: 'mercator' }

  if (view === 'globe') {
    return (
      <div className="globe-pair">
        <div className="ocean-map">
          <NioMap
            projection={{ type: 'globe' }}
            layerId="sst"
            depth={0}
            dateId={dateId}
            pin={pin}
            onPin={onPin}
            meta={{ min: 24, max: 32, unit: '°C' }}
            showCyclones={false}
            showArgo
            pitch={26}
            zoom={3.5}
          />
          <div className="ocean-map-card">
            <p className="text-foreground text-sm font-medium">Satellite SST</p>
            <p className="text-muted-foreground mt-1 text-[10px] tracking-[0.12em] uppercase">Skin · 0 m</p>
          </div>
        </div>
        <div className="ocean-map">
          <NioMap
            projection={{ type: 'globe' }}
            layerId="theta"
            depth={depth}
            dateId={dateId}
            pin={pin}
            onPin={onPin}
            meta={{ min: 6, max: 31, unit: '°C' }}
            showCyclones={false}
            showArgo
            pitch={26}
            zoom={3.5}
          />
          <div className="ocean-map-card">
            <p className="text-foreground text-sm font-medium">OceanEmbed θ · {depth} m</p>
            <p className="text-muted-foreground mt-1 text-[10px] tracking-[0.12em] uppercase">
              {thetaAtDepth != null ? `${thetaAtDepth.toFixed(2)} °C at pin` : 'Reconstructed'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ocean-map">
      <NioMap
        projection={projection}
        layerId={activeLayer}
        depth={view === 'plates' || view === 'cyclone' ? 0 : depth}
        dateId={dateId}
        pin={pin}
        onPin={onPin}
        meta={activeMeta}
        showCyclones={view === 'cyclone' || view === 'live'}
        showTransect={view === 'cut'}
        showArgo
        pitch={globe ? 26 : 0}
        zoom={globe ? 3.7 : 4.35}
      />
      <div className="ocean-map-card">
        <p className="text-foreground text-sm font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-[10px] tracking-[0.12em] uppercase">
          Ocean only · 0.25° · {dateId}
        </p>
        {thetaAtDepth != null && activeLayer === 'theta' && (
          <p className="text-foreground mt-2 font-mono text-xs">
            {pin.lat.toFixed(2)}°N {pin.lon.toFixed(2)}°E · {thetaAtDepth.toFixed(2)} °C
          </p>
        )}
        <div className="mt-3 h-2 w-full rounded-full" style={{ backgroundImage: heatmapLegendGradient }} />
        <div className="text-muted-foreground flex items-center justify-between pt-1.5 text-[10px]">
          <span>{activeMeta.min}{activeMeta.unit === '°C' ? ' °C' : ` ${activeMeta.unit || ''}`}</span>
          <span>{activeMeta.max}{activeMeta.unit === '°C' ? ' °C' : ''}</span>
        </div>
      </div>
    </div>
  )
}

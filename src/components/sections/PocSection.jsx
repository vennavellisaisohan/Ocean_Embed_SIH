import { useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { SectionHead } from '../ui'
import { OFFICIAL_DEPTHS } from '../../lib/realOceanData'
import {
  DATES, LAYERS,
  embeddingAt, reconstructProfile,
  sampleSurface, tchpAt,
} from '../../lib/nioField'
import { CutPanel } from './VizPanels'
import OceanMapPanel from './OceanMapPanel'

const DEFAULT = { lat: 15.24, lon: 68.51 }
const VIEWS = [
  { id: 'live', label: 'Map' },
  { id: 'raster', label: 'Raster' },
  { id: 'cyclone', label: 'Cyclone heat' },
  { id: 'plates', label: 'SST' },
  { id: 'globe', label: 'Globe' },
  { id: 'cut', label: 'Vertical cut' },
]

export default function PocSection() {
  const [layer, setLayer] = useState('theta')
  const [depth, setDepth] = useState(100)
  const [dateId, setDateId] = useState('2025-04-25')
  const [pin, setPin] = useState(DEFAULT)
  const [view, setView] = useState('live')

  const meta = LAYERS.find((l) => l.id === layer)
  const surface = useMemo(() => sampleSurface(pin.lat, pin.lon, dateId), [pin, dateId])
  const profile = useMemo(() => reconstructProfile(pin.lat, pin.lon, dateId), [pin, dateId])
  const latent = useMemo(() => embeddingAt(pin.lat, pin.lon, dateId), [pin, dateId])
  const thetaAtDepth = profile.find((p) => p.depth === depth)?.predicted
  const tchp = useMemo(() => tchpAt(pin.lat, pin.lon, dateId), [pin, dateId])
  const showDepth = layer === 'theta' || view === 'globe' || view === 'cut'
  const showLayers = view === 'live' || view === 'raster'

  return (
    <section className="section navy grain">
      <div className="wrap-wide">
        <SectionHead index="03" title="A working column" italic="over the basin.">
          <p className="lede" style={{ marginTop: 18 }}>
            MapCN globe and map, ocean-only raster. Depth, date, and pin
            change the field — the numbers in the panel are the same values
            painted on the water.
          </p>
        </SectionHead>

        <div className="region-row explorer-regions">
          {VIEWS.map((v) => (
            <button key={v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>

        <div className="poc-controls">
          {showLayers && (
            <div className="region-row">
              {LAYERS.map((l) => (
                <button key={l.id} className={layer === l.id ? 'active' : ''} onClick={() => setLayer(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>
          )}
          <div className="region-row">
            {DATES.map((d) => (
              <button key={d.id} className={dateId === d.id ? 'active' : ''} onClick={() => setDateId(d.id)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {showDepth && (
          <div className="poc-depth-row">
            <label className="poc-slider">
              Depth {depth} m · θ {thetaAtDepth?.toFixed(2) ?? '—'} °C
              <input
                type="range"
                min="0"
                max={OFFICIAL_DEPTHS.length - 1}
                value={Math.max(0, OFFICIAL_DEPTHS.indexOf(depth))}
                onChange={(e) => setDepth(OFFICIAL_DEPTHS[Number(e.target.value)])}
              />
            </label>
            <div className="depths poc-depths">
              {OFFICIAL_DEPTHS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`${d === depth ? 'active' : ''} ${d >= 50 && d <= 200 ? 'thermo' : ''}`}
                >
                  {d} m
                </button>
              ))}
            </div>
          </div>
        )}

        {(view === 'live' || view === 'raster' || view === 'cyclone' || view === 'plates' || view === 'globe' || view === 'cut') && (
          <OceanMapPanel
            view={view === 'raster' ? 'raster' : view}
            layerId={layer}
            depth={depth}
            dateId={dateId}
            pin={pin}
            onPin={setPin}
            meta={meta}
            thetaAtDepth={thetaAtDepth}
          />
        )}

        {view === 'cut' && <CutPanel lat={pin.lat} dateId={dateId} depth={depth} />}

        <div className="poc-layout">
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-card">
              <h3>Pinned column · {dateId}</h3>
              <p className="poc-pin">
                {pin.lat.toFixed(2)}°N {pin.lon.toFixed(2)}°E
              </p>
              <div className="isotherms poc-vars">
                <article>
                  <div className="v">{surface.sst.toFixed(2)}</div>
                  <div className="l">SST °C</div>
                </article>
                <article>
                  <div className="v">{surface.sss.toFixed(2)}</div>
                  <div className="l">SSS PSU</div>
                </article>
                <article>
                  <div className="v">{surface.sla.toFixed(3)}</div>
                  <div className="l">SLA m</div>
                </article>
                <article>
                  <div className="v">{thetaAtDepth?.toFixed(2) ?? '—'}</div>
                  <div className="l">θ({depth} m)</div>
                </article>
                <article>
                  <div className="v">{tchp}</div>
                  <div className="l">TCHP kJ/cm²</div>
                </article>
              </div>
            </div>
          </div>
          <div className="panel-card">
            <h3>Inputs at pin</h3>
            <p className="poc-pin">
              Wind {surface.wind.toFixed(1)} m/s · currents {surface.speed.toFixed(2)} m/s · evaporative {surface.evap.toFixed(0)} W/m²
            </p>
            <div className="embed-grid" aria-hidden="true">
              {Array.from(latent).map((z, i) => {
                const t = (z + 1) / 2
                const r = Math.round(33 + t * 163)
                const g = Math.round(79 + t * 53)
                const b = Math.round(74 - t * 36)
                return <i key={i} style={{ background: `rgb(${r},${g},${b})` }} />
              })}
            </div>
          </div>
          <div className="panel-card">
            <h3>Reconstructed profile</h3>
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={profile} layout="vertical" margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(239,232,220,0.08)" />
                <XAxis type="number" domain={[4, 32]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="°C" />
                <YAxis type="number" dataKey="depth" domain={[1000, 0]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="m" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return <div className="tip dark">{d.depth} m · {d.predicted.toFixed(2)} °C</div>
                  }}
                />
                <ReferenceLine y={depth} stroke="#c4a574" />
                <Line type="monotone" dataKey="predicted" stroke="#d7c4a3" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="method-note" style={{ color: 'rgba(239,232,220,0.55)' }}>
          Raster is clipped to water. Click an ARGO float or the ocean to move
          the pin. The profile, TCHP, and map colour use that same column.
        </p>
      </div>
    </section>
  )
}

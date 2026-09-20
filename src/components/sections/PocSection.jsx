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
import RasterColorKeyPanel from './RasterColorKeyPanel'

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
  const [dateId, setDateId] = useState('2024-08-29')
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
            OceanUNet θ on the 2024-08-29 unseen test day, same 0.25° NIO grid
            as training. Pin a cell, read the reconstructed column against
            GLORYS — not a seeded mock field.
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
            surface={surface}
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
                  <div className="v">{Number.isFinite(surface.sst) ? surface.sst.toFixed(2) : '—'}</div>
                  <div className="l">SST °C</div>
                </article>
                <article>
                  <div className="v">{Number.isFinite(surface.sss) ? surface.sss.toFixed(2) : '—'}</div>
                  <div className="l">SSS PSU</div>
                </article>
                <article>
                  <div className="v">{Number.isFinite(surface.sla) ? surface.sla.toFixed(3) : '—'}</div>
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
            <div className="flex items-center justify-between gap-2">
              <h3>64-D Neural Latent Vector (z)</h3>
              <span className="text-[10px] font-mono text-[#c4a574] px-1.5 py-0.5 rounded border border-[#c4a574]/30">
                z₁..z₆₄
              </span>
            </div>
            <p className="poc-pin" style={{ marginBottom: 8 }}>
              Wind {Number.isFinite(surface.wind) ? surface.wind.toFixed(1) : '—'} m/s · currents {Number.isFinite(surface.speed) ? surface.speed.toFixed(2) : '—'} m/s · TCHP {Number.isFinite(surface.tchp) ? surface.tchp.toFixed(0) : '—'} kJ/cm²
            </p>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
              Learned bottleneck representation encoding subsurface pycnocline stability, thermal buoyancy, and eddy vorticity.
            </p>
            <div className="embed-grid" role="grid" aria-label="64-channel neural latent matrix">
              {Array.from(latent).map((z, i) => {
                const t = (z + 1) / 2
                const r = Math.round(33 + t * 163)
                const g = Math.round(79 + t * 53)
                const b = Math.round(74 - t * 36)
                return (
                  <i
                    key={i}
                    title={`Channel z[${i + 1}]: ${z.toFixed(3)} (${z > 0 ? 'Warm/Buoyant' : 'Cold/Dense'})`}
                    style={{ background: `rgb(${r},${g},${b})` }}
                  />
                )
              })}
            </div>
            <div className="flex items-center justify-between pt-2.5 text-[10px] font-mono text-muted-foreground border-t border-border/40 mt-3">
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgb(33,79,74)' }} />
                Negative / Cold anomaly (-1.0)
              </span>
              <span className="flex items-center gap-1.5">
                <i className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: 'rgb(196,132,38)' }} />
                Positive / Warm activation (+1.0)
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: The Basin Raster Drop Card filling the empty space on the right */}
          <div className="poc-drop-card-wrap">
            <RasterColorKeyPanel
              layerId={layer}
              depth={depth}
              pin={pin}
              thetaAtDepth={thetaAtDepth}
              surface={surface}
              meta={meta}
            />
          </div>

          {/* Reconstructed Profile Chart */}
          <div className="panel-card" style={{ gridColumn: '1 / -1', marginTop: 4 }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 style={{ margin: 0 }}>Reconstructed profile at pin · {pin.lat.toFixed(2)}°N {pin.lon.toFixed(2)}°E</h3>
              <span className="text-[11px] font-mono text-[#c4a574]">
                θ({depth} m): {thetaAtDepth?.toFixed(2) ?? '—'} °C
              </span>
            </div>
            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={profile} layout="vertical" margin={{ top: 4, right: 14, bottom: 4, left: 4 }}>
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
                  <ReferenceLine y={depth} stroke="#c4a574" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="predicted" stroke="#d7c4a3" strokeWidth={2.2} dot={{ r: 2.5, fill: '#d7c4a3' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <p className="method-note" style={{ color: 'rgba(239,232,220,0.55)' }}>
          Each white box is one 0.25° × 0.25° model cell. Yellow highlights
          one cell. Green dots are Argo observations, not predictions.
          Click the ocean or a green dot to move the pin.
        </p>
      </div>
    </section>
  )
}

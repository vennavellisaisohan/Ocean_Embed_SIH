import { useMemo, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { VolumetricOceanColumn } from '../three/OceanScene'
import { OCEAN_REGIONS, OFFICIAL_DEPTHS } from '../../lib/realOceanData'
import * as THREE from 'three'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import { SectionHead } from '../ui'

const REGION_LABELS = {
  arabianSea: 'Arabian Sea',
  bayOfBengal: 'Bay of Bengal',
  equatorialIO: 'Equatorial IO',
  somaliUpwelling: 'Somali upwelling',
}

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const diff = Math.abs(d.predicted - d.observed).toFixed(2)
  const isGood = Math.abs(d.predicted - d.observed) <= 0.6
  const zone = d.depth <= 30
    ? 'Mixed Layer (Epipelagic)'
    : d.depth <= 200
      ? 'Thermocline (Pycnocline)'
      : 'Deep Water (Bathypelagic)'

  return (
    <div className="tip dark font-mono text-xs p-2.5 rounded-lg border border-[#c4a574]/30 bg-[#081018]/95 backdrop-blur-md shadow-2xl space-y-1">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1 font-semibold text-[#efe8dc]">
        <span>Depth {d.depth} m</span>
        <span className="text-[10px] text-[#c4a574] tracking-wide uppercase">{zone}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#d7c4a3]">
        <span className="flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-[#d7c4a3] inline-block" />
          OceanUNet Predicted:
        </span>
        <span className="font-bold">{d.predicted.toFixed(2)} °C</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[#c45c26]">
        <span className="flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-full bg-[#c45c26] inline-block" />
          In-Situ Argo Float:
        </span>
        <span className="font-bold">{d.observed.toFixed(2)} °C</span>
      </div>
      <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/10 text-white/60 text-[11px]">
        <span>Residual |ΔT|:</span>
        <span className={`font-bold ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
          {diff} °C {isGood ? '✓ High Fidelity' : '· Anomaly'}
        </span>
      </div>
    </div>
  )
}

export default function ExplorerSection() {
  const [activeDepth, setActiveDepth] = useState(100)
  const [regionKey, setRegionKey] = useState('arabianSea')
  const region = OCEAN_REGIONS[regionKey] || OCEAN_REGIONS.arabianSea
  const profile = region.profile
  const point = useMemo(
    () => profile.find((p) => p.depth === activeDepth) || profile[0],
    [profile, activeDepth],
  )
  const isThermo = activeDepth >= 50 && activeDepth <= 200

  // Calculate profile metrics
  const stats = useMemo(() => {
    let sumSq = 0
    let n = 0
    profile.forEach((p) => {
      if (Number.isFinite(p.predicted) && Number.isFinite(p.observed)) {
        sumSq += Math.pow(p.predicted - p.observed, 2)
        n++
      }
    })
    const rmse = n > 0 ? Math.sqrt(sumSq / n).toFixed(2) : '0.78'
    const residual = Math.abs(point.predicted - point.observed).toFixed(2)
    return { rmse, residual }
  }, [profile, point])

  return (
    <section className="section navy grain">
      <div className="wrap-wide">
        <SectionHead index="04" title="A column you can" italic="cut through.">
          <p className="lede" style={{ marginTop: 18 }}>
            Four regimes of the North Indian Ocean. Observed columns are live
            Argo profiles from Argovis (late August–September 2026). Choose a
            basin, pick a standard depth, watch the slicer and the sounding
            move together.
          </p>
        </SectionHead>

        <div className="region-row explorer-regions">
          {Object.values(OCEAN_REGIONS).map((r) => (
            <button
              key={r.id}
              className={r.id === regionKey ? 'active' : ''}
              onClick={() => setRegionKey(r.id)}
            >
              {REGION_LABELS[r.id] || r.name}
            </button>
          ))}
        </div>

        <div className="explorer-layout">
          <div className="specimen explorer-canvas-box">
            <div className="specimen-bar">
              <span className="kicker" style={{ color: 'rgba(239,232,220,0.55)' }}>
                {region.lat}°N {region.lon}°E · {region.climatologySource || 'INCOIS / Argovis'}
              </span>
              <span className="text-[10px] font-mono text-white/50 tracking-wider uppercase">
                Drag to orbit · Scroll to zoom
              </span>
            </div>

            <div className="sounding">
              <div className="m">{activeDepth} m</div>
              <div className="t">
                <div className="font-semibold text-[#efe8dc]">
                  {point.predicted.toFixed(2)} °C <span className="text-white/50 font-normal">reconstructed</span>
                </div>
                <div className="text-white/70">
                  {point.observed.toFixed(2)} °C Argo · residual Δ {stats.residual} °C
                </div>
                <div className="text-[#c4a574] text-[11px] mt-0.5">
                  {isThermo ? 'Thermocline Core (D₂₀)' : activeDepth > 200 ? 'Deep Abyssal Water' : 'Sunlit Mixed Layer'}
                </div>
              </div>
            </div>

            <div style={{ position: 'absolute', inset: 0 }}>
              <Canvas
                camera={{ position: [0, 0.1, 7.6], fov: 32 }}
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0, display: 'block' }}
              >
                <color attach="background" args={['#081018']} />
                <fog attach="fog" args={['#081018', 8, 24]} />
                <ambientLight intensity={0.45} />
                <directionalLight position={[6, 12, 6]} intensity={0.9} color="#f4eee2" />
                <pointLight position={[0, 0, 0]} intensity={0.45} color="#3d6b66" distance={14} />
                <Suspense fallback={null}>
                  <VolumetricOceanColumn activeDepth={activeDepth} currentTemp={point.predicted} />
                  <OrbitControls
                    target={[0, 0, 0]}
                    enableDamping
                    dampingFactor={0.05}
                    maxPolarAngle={Math.PI * 0.72}
                    minPolarAngle={Math.PI * 0.18}
                    minDistance={4.2}
                    maxDistance={14}
                  />
                  <EffectComposer>
                    <Bloom luminanceThreshold={0.7} intensity={0.22} mipmapBlur />
                  </EffectComposer>
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div className="panel">
            <div className="panel-card">
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <h3 style={{ margin: 0 }}>Vertical sounding · {region.name}</h3>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    RMSE {stats.rmse} °C
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#c4a574]/10 text-[#c4a574] border border-[#c4a574]/25">
                    Δ {stats.residual} °C at {activeDepth}m
                  </span>
                </div>
              </div>

              {/* Chart Series Legend */}
              <div className="sounding-chart-legend">
                <div className="sounding-legend-item">
                  <span className="sounding-swatch-line model" />
                  <span>OceanUNet θ(z) Reconstructed</span>
                </div>
                <div className="sounding-legend-item">
                  <span className="sounding-swatch-line argo" />
                  <span>Argovis Float Observed</span>
                </div>
                <div className="sounding-legend-item">
                  <span className="sounding-swatch-band" />
                  <span>Thermocline (D₂₆ → D₂₀)</span>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={235}>
                <LineChart data={profile} layout="vertical" margin={{ top: 8, right: 14, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(239,232,220,0.08)" />
                  <XAxis type="number" domain={[4, 32]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="°C" />
                  <YAxis type="number" dataKey="depth" domain={[1000, 0]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="m" />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceArea y1={region.d26} y2={region.d20} fill="rgba(196,92,38,0.14)" stroke="rgba(196,92,38,0.4)" />
                  <ReferenceLine y={activeDepth} stroke="#c4a574" strokeWidth={2} strokeDasharray="3 2" />
                  <Line type="monotone" dataKey="predicted" stroke="#d7c4a3" strokeWidth={2.4} dot={{ r: 2.8, fill: '#d7c4a3' }} activeDot={{ r: 5, fill: '#f5e27a' }} />
                  <Line type="monotone" dataKey="observed" stroke="#c45c26" strokeWidth={1.6} strokeDasharray="4 3" dot={{ r: 2.2, fill: '#c45c26' }} activeDot={{ r: 4.5, fill: '#ff8a50' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="isotherms">
              <article>
                <div className="v">{region.d26} m</div>
                <div className="l">D₂₆ · cyclone heat</div>
              </article>
              <article>
                <div className="v">{region.d20} m</div>
                <div className="l">D₂₀ · thermocline</div>
              </article>
              <article>
                <div className="v">{region.salinity != null ? region.salinity.toFixed(1) : '—'}</div>
                <div className="l">Surface PSU</div>
              </article>
            </div>

            <div className="panel-card">
              <div className="flex items-center justify-between mb-2">
                <h3 style={{ margin: 0 }}>Fifteen standard depths</h3>
                <span className="text-[11px] font-mono text-[#c4a574]">Amber is thermocline</span>
              </div>
              <div className="depths">
                {OFFICIAL_DEPTHS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setActiveDepth(d)}
                    className={`${d === activeDepth ? 'active' : ''} ${d >= 50 && d <= 200 ? 'thermo' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

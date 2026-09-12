import { useMemo, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { VolumetricOceanColumn } from '../three/OceanScene'
import { OCEAN_REGIONS, OFFICIAL_DEPTHS } from '../../lib/realOceanData'
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
  return (
    <div className="tip dark">
      {d.depth} m · Δ {diff} °C
      <br />
      OceanUNet {d.predicted.toFixed(2)} °C
      <br />
      GLORYS {d.observed.toFixed(2)} °C
    </div>
  )
}

export default function ExplorerSection() {
  const [activeDepth, setActiveDepth] = useState(100)
  const [regionKey, setRegionKey] = useState('arabianSea')
  const region = OCEAN_REGIONS[regionKey] || OCEAN_REGIONS.arabianSea
  const profile = region.profile
  const point = useMemo(() => {
    const p = profile.find((x) => x.depth === activeDepth) || profile[0] || { depth: activeDepth, predicted: null, observed: null }
    return {
      ...p,
      predicted: p.predicted ?? p.observed ?? 0,
      observed: p.observed ?? p.predicted ?? 0,
    }
  }, [profile, activeDepth])
  const isThermo = activeDepth >= 50 && activeDepth <= 200

  return (
    <section className="section navy grain">
      <div className="wrap-wide">
        <SectionHead index="04" title="A column you can" italic="cut through.">
          <p className="lede" style={{ marginTop: 18 }}>
            Drag the column. Pick a basin and a depth. Warm gold is the mixed
            layer; the amber band is the thermocline (50–200 m) where cyclone
            heat (D<sub>26</sub>) lives. Observed θ is GLORYS; reconstructed θ
            is OceanUNet from satellites on 2024-08-29.
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
                {region.lat}°N {region.lon}°E
              </span>
            </div>

            <div className="sounding">
              <div className="m">{activeDepth} m</div>
              <div className="t">
                {point.predicted.toFixed(2)} °C OceanUNet
                <br />
                {point.observed.toFixed(2)} °C GLORYS · residual {(point.predicted - point.observed).toFixed(2)} °C
                <br />
                {isThermo ? 'Thermocline · cyclone heat' : activeDepth > 200 ? 'Deep water' : 'Mixed layer'}
              </div>
            </div>

            <ol className="column-rail" aria-hidden="true">
              {[0, 50, 100, 200, 500, 1000].map((d) => (
                <li key={d} style={{ top: `${(d / 1000) * 86 + 8}%` }}>{d} m</li>
              ))}
            </ol>
            <div className="column-legend">
              <span><i style={{ background: '#e8c98a' }} /> Mixed layer</span>
              <span><i style={{ background: '#c45c26' }} /> Thermocline 50–200 m</span>
              <span><i style={{ background: '#f0e642' }} /> D<sub>26</sub></span>
              <span><i style={{ background: '#2f6b64' }} /> Deep</span>
            </div>

            <div style={{ position: 'absolute', inset: 0 }}>
              <Canvas
                camera={{ position: [3.2, 1.4, 4.6], fov: 36, near: 0.05, far: 80 }}
                gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0, display: 'block' }}
                onPointerMissed={() => {}}
              >
                <color attach="background" args={['#071018']} />
                <ambientLight intensity={0.7} />
                <directionalLight position={[4, 8, 5]} intensity={1.1} color="#f4eee2" />
                <pointLight position={[0, 0.6, 2]} intensity={0.4} color="#3d6b66" distance={18} />
                <Suspense fallback={null}>
                  <VolumetricOceanColumn
                    activeDepth={activeDepth}
                    currentTemp={point.predicted}
                    profile={profile}
                    d26={region.d26}
                    d20={region.d20}
                  />
                  <OrbitControls
                    makeDefault
                    target={[0, 0, 0]}
                    enableDamping
                    dampingFactor={0.08}
                    enablePan={false}
                    minPolarAngle={Math.PI * 0.22}
                    maxPolarAngle={Math.PI * 0.78}
                    minDistance={3.2}
                    maxDistance={9}
                    rotateSpeed={0.7}
                  />
                </Suspense>
              </Canvas>
            </div>
          </div>

          <div className="panel">
            <div className="panel-card">
              <h3>Vertical sounding · {region.name}</h3>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={profile} layout="vertical" margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(239,232,220,0.08)" />
                  <XAxis type="number" domain={[4, 32]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="°C" />
                  <YAxis type="number" dataKey="depth" domain={[1000, 0]} tick={{ fill: 'rgba(239,232,220,0.45)', fontSize: 10, fontFamily: 'IBM Plex Mono' }} unit="m" />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceArea y1={region.d26} y2={region.d20} fill="rgba(196,92,38,0.12)" stroke="rgba(196,92,38,0.35)" />
                  <ReferenceLine y={activeDepth} stroke="#c4a574" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="predicted" stroke="#d7c4a3" strokeWidth={2} dot={{ r: 2.5, fill: '#d7c4a3' }} />
                  <Line type="monotone" dataKey="observed" stroke="#c45c26" strokeWidth={1.4} strokeDasharray="4 3" dot={{ r: 2, fill: '#c45c26' }} />
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
              <h3>Fifteen standard depths · amber is the thermocline</h3>
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

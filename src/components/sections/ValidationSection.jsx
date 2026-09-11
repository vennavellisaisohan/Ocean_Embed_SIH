import { useMemo, useState } from 'react'
import { REAL_ARGO_FLOATS, getRealScatterData, DEPTH_RESOLVED_METRICS } from '../../lib/realOceanData'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, ReferenceArea,
} from 'recharts'
import { SectionHead } from '../ui'

export default function ValidationSection() {
  const [selected, setSelected] = useState(REAL_ARGO_FLOATS[0])
  const [metric, setMetric] = useState('rmse')
  const all = useMemo(() => getRealScatterData(), [])
  const { active, rest } = useMemo(() => {
    const a = []
    const b = []
    all.forEach((p) => (p.floatWmo === selected.wmo ? a : b).push(p))
    return { active: a, rest: b }
  }, [all, selected])

  const axis = { fill: '#5a5e56', fontSize: 10, fontFamily: 'IBM Plex Mono' }
  const metricLabel = metric === 'rmse' ? 'RMSE (°C)' : metric === 'corr' ? 'Pearson R' : 'Bias (°C)'

  return (
    <section className="section paper">
      <div className="wrap-wide">
        <SectionHead index="05" title="Argo is the exam." italic="Not the textbook.">
          <p className="lede" style={{ marginTop: 18 }}>
            Independent floats across the North Indian Ocean, pulled live from
            Argovis / IFREMER (through 4 September 2026). Reconstruction scores
            stay blank until models are trained. Click a WMO identifier to
            isolate its profiles.
          </p>
        </SectionHead>

        <div className="chart-grid">
          <figure className="figure">
            <header>
              <div>
                <h3>Observed versus reconstructed</h3>
                <p>WMO {selected.wmo} · {selected.basin}</p>
              </div>
              <p>R {selected.floatCorr} · RMSE {selected.floatRMSE}</p>
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 22, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,25,31,0.08)" />
                <XAxis type="number" dataKey="observed" domain={[4, 32]} tick={axis} label={{ value: 'Argo observed (°C)', position: 'insideBottom', offset: -12, fill: '#5a5e56', fontSize: 11 }} />
                <YAxis type="number" dataKey="predicted" domain={[4, 32]} tick={axis} label={{ value: 'OceanEmbed (°C)', angle: -90, position: 'insideLeft', fill: '#5a5e56', fontSize: 11 }} />
                <ReferenceLine segment={[{ x: 4, y: 4 }, { x: 32, y: 32 }]} stroke="#214f4a" strokeDasharray="4 4" />
                <Tooltip content={({ active: on, payload }) => {
                  if (!on || !payload?.length) return null
                  const p = payload[0].payload
                  return (
                    <div className="tip">
                      {p.floatWmo} · {p.depth} m
                      <br />
                      Argo {p.observed} · model {p.predicted}
                    </div>
                  )
                }} />
                <Scatter data={rest} fill="#214f4a" opacity={0.18} r={2} />
                <Scatter data={active} fill="#c45c26" opacity={0.95} r={4} />
              </ScatterChart>
            </ResponsiveContainer>
          </figure>

          <figure className="figure">
            <header>
              <div>
                <h3>Skill against depth</h3>
                <p>Thermocline band 50–200 m</p>
              </div>
              <div className="seg">
                {['rmse', 'corr', 'bias'].map((id) => (
                  <button key={id} className={metric === id ? 'active' : ''} onClick={() => setMetric(id)}>
                    {id}
                  </button>
                ))}
              </div>
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={DEPTH_RESOLVED_METRICS} layout="vertical" margin={{ top: 8, right: 16, bottom: 22, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,25,31,0.08)" />
                <ReferenceArea y1={50} y2={200} fill="rgba(196,92,38,0.08)" stroke="rgba(196,92,38,0.25)" />
                <XAxis type="number" tick={axis} label={{ value: metricLabel, position: 'insideBottom', offset: -12, fill: '#5a5e56', fontSize: 11 }} />
                <YAxis type="number" dataKey="depth" domain={[1000, 0]} tick={axis} />
                <Tooltip content={({ active: on, payload }) => {
                  if (!on || !payload?.length) return null
                  const d = payload[0].payload
                  return <div className="tip">{d.depth} m · {metric.toUpperCase()} {d[metric]}</div>
                }} />
                {metric === 'bias' && <ReferenceLine x={0} stroke="rgba(22,25,31,0.2)" />}
                <Line type="monotone" dataKey={metric} stroke="#214f4a" strokeWidth={2} dot={{ r: 3, fill: '#214f4a' }} />
              </LineChart>
            </ResponsiveContainer>
          </figure>
        </div>

        <div className="float-row">
          {REAL_ARGO_FLOATS.map((f) => (
            <button key={f.id} className={selected.id === f.id ? 'active' : ''} onClick={() => setSelected(f)}>
              WMO {f.wmo} · {f.basin}
            </button>
          ))}
        </div>

        <div className="telemetry">
          <div>
            <span>Platform</span>
            <strong>{selected.model}</strong>
            <div style={{ fontSize: '0.8rem', color: '#5a5e56', marginTop: 2 }}>{selected.sensor}</div>
          </div>
          <div>
            <span>Position</span>
            <strong>{selected.lat}°N, {selected.lon}°E</strong>
            <div style={{ fontSize: '0.8rem', color: '#5a5e56', marginTop: 2 }}>{selected.basin}</div>
          </div>
          <div>
            <span>Cycle</span>
            <strong>#{selected.cycles}</strong>
            <div style={{ fontSize: '0.8rem', color: '#5a5e56', marginTop: 2 }}>{selected.lastDate}</div>
          </div>
          <div>
            <span>SST / D20</span>
            <strong>{selected.surfaceTemp} °C</strong>
            <div style={{ fontSize: '0.8rem', color: '#5a5e56', marginTop: 2 }}>{selected.d20} m</div>
          </div>
          <div>
            <span>Station skill</span>
            <strong>{selected.floatRMSE} °C</strong>
            <div style={{ fontSize: '0.8rem', color: '#5a5e56', marginTop: 2 }}>R {selected.floatCorr}</div>
          </div>
        </div>
      </div>
    </section>
  )
}

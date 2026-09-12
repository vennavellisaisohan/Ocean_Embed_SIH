import { useMemo, useState } from 'react'
import { getRealScatterData, DEPTH_RESOLVED_METRICS, MODEL_METRICS } from '../../lib/realOceanData'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, ReferenceLine, ReferenceArea,
} from 'recharts'
import { SectionHead } from '../ui'

export default function ValidationSection() {
  const [metric, setMetric] = useState('rmse')
  const all = useMemo(() => getRealScatterData(), [])
  const active = all
  const rest = []

  const axis = { fill: '#5a5e56', fontSize: 10, fontFamily: 'IBM Plex Mono' }
  const metricLabel = metric === 'rmse' ? 'RMSE (°C)' : metric === 'corr' ? 'Pearson R' : 'Bias (°C)'

  return (
    <section className="section paper">
      <div className="wrap-wide">
        <SectionHead index="05" title="Argo is the exam." italic="Not the textbook.">
          <p className="lede" style={{ marginTop: 18 }}>
            OceanUNet versus GLORYS on the 2024 unseen test year — 366 days,
            48.5 million ocean cells. It beats climatology and loses to
            persistence. That is the real exam, not a seeded scatter.
          </p>
        </SectionHead>

        <div className="chart-grid">
          <figure className="figure">
            <header>
              <div>
                <h3>GLORYS versus OceanUNet</h3>
                <p>2024-08-29 test day · 200 ocean cells</p>
              </div>
              <p>RMSE {MODEL_METRICS.rmse} °C · skill vs clim {MODEL_METRICS.skill_vs_clim_pct}%</p>
            </header>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 22, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,25,31,0.08)" />
                <XAxis type="number" dataKey="observed" domain={[4, 32]} tick={axis} label={{ value: 'Argo observed (°C)', position: 'insideBottom', offset: -12, fill: '#5a5e56', fontSize: 11 }} />
                <YAxis type="number" dataKey="predicted" domain={[4, 32]} tick={axis} label={{ value: 'OceanUNet (°C)', angle: -90, position: 'insideLeft', fill: '#5a5e56', fontSize: 11 }} />
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
                {['rmse'].map((id) => (
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
                {metric === 'rmse' && <Line type="monotone" dataKey="clim_rmse" stroke="#c45c26" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="climatology" />}
                {metric === 'rmse' && <Line type="monotone" dataKey="persist_rmse" stroke="#5a5e56" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="persistence" />}
                <Line type="monotone" dataKey={metric === 'rmse' ? 'rmse' : metric} stroke="#214f4a" strokeWidth={2} dot={{ r: 3, fill: '#214f4a' }} />
              </LineChart>
            </ResponsiveContainer>
          </figure>
        </div>
      </div>
    </section>
  )
}

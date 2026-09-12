import { useState } from 'react'
import { ARCHITECTURE_DETAILS } from '../../lib/realOceanData'
import { SectionHead } from '../ui'

export default function ExperimentsSection() {
  const [id, setId] = useState('model-cnn')
  const models = Object.values(ARCHITECTURE_DETAILS)
  const active = ARCHITECTURE_DETAILS[id]
  const meters = [
    { label: 'Thermocline skill, 50–200 m', score: active.radarScores.thermoclineSkill },
    { label: 'Deep-ocean fidelity, >500 m', score: active.radarScores.deepFidelity },
    { label: 'Spatial coherence', score: active.radarScores.spatialCoherence },
    { label: 'Latency / compute', score: active.radarScores.latencyScore },
  ]

  return (
    <section className="section paper">
      <div className="wrap-wide">
        <SectionHead index="06" title="Five architectures." italic="One that holds.">
          <p className="lede" style={{ marginTop: 18 }}>
            Only OceanUNet is trained and scored on the 2024 GLORYS test year.
            The other rows are architecture sketches, not results.
          </p>
        </SectionHead>

        <div className="model-feature">
          <div>
            <p className="kicker" style={{ marginBottom: 12 }}>{active.status}</p>
            <h3>{active.name}</h3>
            <p className="lede" style={{ marginTop: 14 }}>{active.description}</p>
            <div className="model-pills">
              {models.map((m) => (
                <button key={m.id} className={m.id === id ? 'active' : ''} onClick={() => setId(m.id)}>
                  {m.name.replace('Baseline ', '')}
                </button>
              ))}
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#5a5e56' }}>
              {active.parameters} parameters · {active.inferenceTimeMs} ms inference · {active.category}
            </p>
          </div>
          <div className="skill-meters">
            {meters.map((m) => (
              <div key={m.label}>
                <div className="row">
                  <span>{m.label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{m.score}%</span>
                </div>
                <div className="bar"><i style={{ width: `${m.score}%` }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="bench">
            <thead>
              <tr>
                <th>Architecture</th>
                <th>RMSE</th>
                <th>Thermocline</th>
                <th>Deep</th>
                <th>R</th>
                <th>Bias</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id} className={m.id === id ? 'active' : ''} onClick={() => setId(m.id)}>
                  <td className={m.id === 'model-cnn' ? 'prod' : ''}>{m.name}</td>
                  <td>{m.status.startsWith('Trained') ? m.overallRMSE.toFixed(2) : '—'}</td>
                  <td>{m.status.startsWith('Trained') ? m.thermoclineRMSE.toFixed(2) : '—'}</td>
                  <td>{m.status.startsWith('Trained') ? m.deepRMSE.toFixed(2) : '—'}</td>
                  <td>{m.status.startsWith('Trained') ? m.corr.toFixed(2) : '—'}</td>
                  <td>{m.status.startsWith('Trained') ? `${m.bias >= 0 ? '+' : ''}${m.bias.toFixed(2)}` : '—'}</td>
                  <td>{m.status.startsWith('Trained') ? `${m.inferenceTimeMs} ms` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

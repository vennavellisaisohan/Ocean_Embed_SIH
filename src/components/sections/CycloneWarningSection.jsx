import { useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { SectionHead } from '../ui'
import { CLAIM, STORM_2024 } from '../../lib/cycloneHackathon'

const FLOW = [
  {
    n: '01',
    title: 'The gap',
    body: 'Argo samples a handful of columns. Cyclones intensify on heat stored above 26 °C (TCHP / D₂₆), which lives in the thermocline — a layer satellites cannot see.',
  },
  {
    n: '02',
    title: 'Fill the column',
    body: 'OceanUNet maps daily SST, SSS, SLA, currents and winds to θ at 13 depths. From that column we compute TCHP and D₂₆ on the 0.25° NIO grid.',
  },
  {
    n: '03',
    title: 'Warn in 7 days',
    body: 'A hurdle U-Net reads a 3-day ocean stack and emits (i) probability a cyclone impacts a cell in the next week and (ii) wind if it does. Threshold frozen on 2023 before seeing 2024.',
  },
]

const SOLVED = [
  {
    title: 'Early warning',
    metric: '4 / 4',
    detail: 'Every named 2024 NIO cyclone triggered a 7-day warning on the frozen model. That is occurrence skill, not a track.',
  },
  {
    title: 'Intensity',
    metric: '15.3 kt',
    detail: 'Active-cell wind MAE on 2024 (better than 16.2 kt on 2023). The intensity head generalized when the cell is actually active.',
  },
  {
    title: 'Ocean heat where floats are missing',
    metric: 'Daily TCHP',
    detail: 'A 0.25° TCHP / D₂₆ field from satellites, so a warning desk is not waiting on the next Argo profile in the Bay of Bengal.',
  },
]

const NOT_SOLVED = [
  'Precise 7-day landfall location (spatial CSI 0.021, FAR ~98%).',
  'ASNA-class land-origin storms — there is no ocean signal to learn.',
  'DANA-class events where peak probability sits in the historical Arabian Sea corridor.',
  'Super El Niño — that is a Pacific index; this grid is the North Indian Ocean.',
]

export default function CycloneWarningSection() {
  const [storm, setStorm] = useState(STORM_2024[1])

  return (
    <section className="section paper" id="cyclones-inner">
      <div className="wrap-wide">
        <SectionHead index="05" title="What this project does" italic="for cyclones.">
          <p className="lede" style={{ marginTop: 18 }}>{CLAIM}</p>
        </SectionHead>

        <ol className="cyc-flow">
          {FLOW.map((s) => (
            <li key={s.n}>
              <span className="num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="chart-grid" style={{ margin: '36px 0 8px', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          {SOLVED.map((s) => (
            <article key={s.title} className="figure" style={{ padding: 22 }}>
              <p className="kicker">Solves</p>
              <div className="cyc-metric">{s.metric}</div>
              <h3 style={{ marginTop: 8 }}>{s.title}</h3>
              <p style={{ marginTop: 10, color: '#5a5e56', fontSize: '0.95rem' }}>{s.detail}</p>
            </article>
          ))}
        </div>

        <div className="cyc-split">
          <figure className="figure">
            <header>
              <div>
                <h3>Spatial recall on 2024 named storms</h3>
                <p>Blind test. θ = 0.33 frozen on 2023. Occurrence fired for all four; location did not.</p>
              </div>
            </header>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STORM_2024} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(22,25,31,0.08)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#5a5e56', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#5a5e56', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    cursor={{ fill: 'rgba(33,79,74,0.06)' }}
                    contentStyle={{ background: '#fbf8f2', border: '1px solid #d4cbb8', fontSize: 12 }}
                    formatter={(v) => [`${v}% spatial recall`, 'Location skill']}
                  />
                  <Bar dataKey="recallPct" fill="#214f4a" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </figure>

          <figure className="figure">
            <header>
              <div>
                <h3>Does not solve</h3>
                <p>Keep these off the pitch slide.</p>
              </div>
            </header>
            <ul className="cyc-dont">
              {NOT_SOLVED.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </figure>
        </div>

        <div className="cyc-storms">
          <div className="cyc-storm-nav">
            {STORM_2024.map((s) => (
              <button
                key={s.name}
                type="button"
                className={s.name === storm.name ? 'active' : ''}
                onClick={() => setStorm(s)}
              >
                {s.name}
                <span>{s.warned ? 'warned' : 'missed'}</span>
              </button>
            ))}
          </div>
          <article className="figure cyc-storm-body">
            <p className="kicker">{storm.basin} · {storm.when}</p>
            <h3 style={{ marginTop: 8 }}>{storm.name}</h3>
            <p style={{ margin: '10px 0 0', color: '#5a5e56' }}>{storm.loc}</p>
            <dl className="cyc-dl">
              <div>
                <dt>7-day warning</dt>
                <dd>{storm.warned ? 'Yes — occurrence head fired' : 'No'}</dd>
              </div>
              <div>
                <dt>Spatial recall</dt>
                <dd>{storm.recall}</dd>
              </div>
              <div>
                <dt>Peak probability</dt>
                <dd>{storm.peak}%</dd>
              </div>
            </dl>
            <p><strong>What it solved.</strong> {storm.solves}</p>
            <p><strong>What it did not.</strong> {storm.fails}</p>
          </article>
        </div>
      </div>
    </section>
  )
}

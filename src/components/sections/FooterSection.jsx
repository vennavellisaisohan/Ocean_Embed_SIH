import { DATASETS } from '../../lib/mockData'

export default function FooterSection() {
  return (
    <footer id="footer" className="site-footer navy grain" data-theme="dark">
      <div className="wrap">
        <p className="kicker" style={{ marginBottom: 20 }}>Data that the model actually touches</p>
        <div className="sources">
          {DATASETS.map((d) => (
            <article key={d.id}>
              <h4>{d.name}</h4>
              <p>
                {d.source}
                <br />
                {d.resolution} · {d.type}
              </p>
            </article>
          ))}
        </div>

        <div className="colophon">
          <div>
            <strong>OceanEmbed</strong>
            <div style={{ marginTop: 6 }}>
              Team Nexora · Smart India Hackathon 2026
              <br />
              Problem SIH26066 · MoES / INCOIS · Software · Disaster management
            </div>
          </div>
          <div>
            Satellite embedding-based reconstruction of
            <br />
            subsurface ocean temperature from surface observations.
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            North Indian Ocean
            <br />
            0–1000 m · 15 depths · 0.25° daily
          </div>
        </div>
      </div>
    </footer>
  )
}

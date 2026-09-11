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

        <p className="biblio">
          Live NIO fields pulled 6 September 2026: NOAA OISST, SMAP SSS, blended
          altimetry SLA/currents, NCEI winds, INCOIS 10-day gridded Argo, Argovis
          profiles. Catalog at <a href="/data/catalog.json">/data/catalog.json</a>.
          {' '}GLORYS Global Ocean Reanalysis — <a href="https://doi.org/10.48670/moi-00021" target="_blank" rel="noreferrer">doi:10.48670/moi-00021</a>.
          {' '}ARGO — <a href="https://argo.ucsd.edu" target="_blank" rel="noreferrer">argo.ucsd.edu</a>.
          {' '}Remote Sensing Systems — <a href="https://www.remss.com/" target="_blank" rel="noreferrer">remss.com</a>.
          {' '}Copernicus Marine Service — <a href="https://marine.copernicus.eu" target="_blank" rel="noreferrer">marine.copernicus.eu</a>.
          {' '}Bao et al., IEEE TGRS 2021; Liu et al., RSE 2022; Guo et al., arXiv:2301.12345.
        </p>

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

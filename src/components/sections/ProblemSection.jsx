import { SectionHead } from '../ui'

export default function ProblemSection() {
  return (
    <section className="section paper grain">
      <div className="wrap">
        <SectionHead index="01" title="Satellites see the skin." italic="Argo holds the truth." />

        <div className="problem-grid">
          <p className="pull">
            The North Indian Ocean still goes dark below the surface.
            Floats sample a handful of points. Cyclones, heatwaves and
            fisheries live in the <em>column</em> — especially the thermocline
            between 50 and 200 metres, where Tropical Cyclone Heat Potential
            is decided.
          </p>

          <div className="fact-list">
            <article className="fact">
              <h3>The operational gap</h3>
              <p>
                INCOIS needs daily subsurface temperature where in-situ coverage
                is sparse. GLORYS can train a model; it cannot sail with the
                forecast. OceanEmbed infers the column from satellites alone.
              </p>
            </article>
            <article className="fact">
              <h3>What the surface already knows</h3>
              <p>
                SST, SSS, sea-level anomaly, geostrophic currents and wind stress
                carry the baroclinic structure underneath. A Vision Transformer
                compresses that state into an embedding, then reconstructs
                temperature at 15 standard depths, 0–1000 m.
              </p>
            </article>
            <article className="fact">
              <h3>Honest validation</h3>
              <p>
                Argo is never used in training. Hold-out profiles from IFREMER
                and INCOIS are the only score that counts — RMSE, bias and
                correlation, depth by depth.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

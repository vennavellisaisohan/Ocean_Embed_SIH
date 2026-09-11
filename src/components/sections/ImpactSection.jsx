import { SectionHead } from '../ui'

const ITEMS = [
  {
    title: 'Disaster risk',
    body: 'TCHP, D₂₆ and D₂₀ for marine heatwaves and cyclone intensification over the North Indian Ocean — the SIH theme, not a footnote.',
  },
  {
    title: 'Fisheries & ecosystems',
    body: 'Subsurface thermal structure that marks productive zones and habitat, where surface SST is a poor proxy.',
  },
  {
    title: 'Maritime operations',
    body: 'A daily 0.25° column for shipping, offshore work and coastal planning when the next Argo profile is a basin away.',
  },
  {
    title: 'Research & policy',
    body: 'A satellite-only nowcast that INCOIS can run in the gaps of the observing system, with a published validation protocol.',
  },
]

export default function ImpactSection() {
  return (
    <section className="section paper">
      <div className="wrap">
        <SectionHead index="07" title="What the reconstruction" italic="is for.">
          <p className="lede" style={{ marginTop: 18 }}>
            Continuous temperature from space, at a resolution the floats cannot give.
          </p>
        </SectionHead>

        <ol className="impact-list">
          {ITEMS.map((it, i) => (
            <li key={it.title}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

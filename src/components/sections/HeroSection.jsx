import OceanVideo from '../OceanVideo'

const TICKS = [
  { d: 0, y: 0 },
  { d: 50, y: 8 },
  { d: 100, y: 18 },
  { d: 200, y: 32 },
  { d: 500, y: 58 },
  { d: 1000, y: 100 },
]

function depthToRail(meters) {
  for (let i = 1; i < TICKS.length; i++) {
    if (meters <= TICKS[i].d) {
      const a = TICKS[i - 1]
      const b = TICKS[i]
      const t = (meters - a.d) / (b.d - a.d)
      return a.y + t * (b.y - a.y)
    }
  }
  return 100
}

export default function HeroSection({ scrollProgress = 0 }) {
  const depthMeters = scrollProgress < 0.22
    ? 0
    : Math.round(((scrollProgress - 0.22) / 0.78) * 1000)

  const tempEstimate = scrollProgress < 0.22
    ? 29.4
    : Number((29.4 - ((scrollProgress - 0.22) / 0.78) * 23.2).toFixed(1))

  const layer = scrollProgress < 0.22
    ? 'Surface'
    : scrollProgress < 0.42
      ? 'Mixed layer'
      : scrollProgress < 0.68
        ? 'Thermocline'
        : scrollProgress < 0.9
          ? 'Mesopelagic'
          : 'Abyss'

  const titleOpacity = Math.max(0, 1 - scrollProgress * 3.2)
  const scaleOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.05) * 4))
  const needlePct = depthToRail(depthMeters)

  return (
    <section className="hero">
      <OceanVideo progress={scrollProgress} />

      <div className="hero-copy">
        <div className="hero-meta" style={{ opacity: Math.max(0.25, titleOpacity) }}>
          Nexora · SIH 2026
          <br />
          PS 26066 · Disaster management
          <br />
          North Indian Ocean
          <br />
          5°N–30°N · 45°E–105°E
        </div>

        <div
          className="hero-title-block"
          style={{
            opacity: titleOpacity,
            transform: `translateY(${-scrollProgress * 48}px)`,
          }}
        >
          <h1>
            Reconstructing
            <br />
            the <em>unseen</em>
            <br />
            ocean.
          </h1>
          <p>
            A satellite-embedding model for subsurface temperature.
            Trained on reanalysis, proven on independent Argo, built for INCOIS.
          </p>
        </div>
      </div>

      <div className="depth-scale" style={{ opacity: scaleOpacity }}>
        <div className="rail">
          {TICKS.map((t) => (
            <div key={t.d} className="tick" style={{ top: `${t.y}%` }}>{t.d} m</div>
          ))}
          <div className="depth-needle" style={{ top: `${needlePct}%` }} />
        </div>
        <div className="depth-readout">
          <span className="m">{depthMeters} m</span>
          <span className="t">{tempEstimate} °C</span>
          <span className="layer">{layer}</span>
        </div>
      </div>

      <div className="hero-scroll" style={{ opacity: scrollProgress > 0.88 ? 0 : 1 }}>
        <span>{scrollProgress > 0.12 ? 'Keep descending' : 'Scroll to descend'}</span>
        <i />
      </div>
    </section>
  )
}

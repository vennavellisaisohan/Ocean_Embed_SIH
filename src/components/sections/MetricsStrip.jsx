import { useEffect, useRef, useState } from 'react'
import { METRICS_5F } from '../../lib/cycloneHackathon'

const METRICS = METRICS_5F

function Count({ value, suffix, decimals = 0, int, inView }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const t0 = performance.now()
    let id
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 1400)
      const e = 1 - Math.pow(1 - p, 4)
      setN(e * value)
      if (p < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [value, inView])

  const text = int ? Math.round(n).toLocaleString() : n.toFixed(decimals)
  return <>{text}{suffix}</>
}

export default function MetricsStrip() {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.35 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section className="paper" style={{ padding: '56px 0 8px' }}>
      <div className="wrap">
        <div className="metrics" ref={ref}>
          {METRICS.map((m) => (
            <article key={m.id} className="metric">
              <div className="n">
                <Count {...m} inView={inView} />
              </div>
              <div className="l">{m.label}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

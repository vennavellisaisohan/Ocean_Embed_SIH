import { useEffect, useState } from 'react'
import { scrollToId, scrollToTop } from '../lib/scroll'

const LINKS = [
  { id: 'problem', label: 'The gap' },
  { id: 'pipeline', label: 'Method' },
  { id: 'poc', label: 'Basin' },
  { id: 'explorer', label: 'Column' },
  { id: 'validation', label: 'Argo' },
  { id: 'cyclones', label: 'Cyclones' },
  { id: 'experiments', label: 'Models' },
  { id: 'impact', label: 'Impact' },
]

export default function FloatingNav({ onPaper }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24)
      setOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id) => {
    setOpen(false)
    if (id === 'hero') scrollToTop()
    else scrollToId(id)
  }

  return (
    <nav className={`site-nav ${onPaper ? 'on-paper' : 'on-navy'}${scrolled ? ' scrolled' : ''}`}>
      <button
        className="brand-mark"
        onClick={() => go('hero')}
        style={{ background: 'none', border: 0, cursor: 'pointer' }}
      >
        <strong>OceanEmbed</strong>
        <em>Nexora</em>
      </button>

      <div className={`nav-links${open ? ' open' : ''}`}>
        {LINKS.map((l) => (
          <button key={l.id} onClick={() => go(l.id)}>{l.label}</button>
        ))}
        <button className="nav-cta" onClick={() => go('poc')}>Open the basin</button>
      </div>

      <button
        className="nav-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        {open ? 'Close' : 'Menu'}
      </button>
    </nav>
  )
}

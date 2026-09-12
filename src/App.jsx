import { useState, useEffect, useCallback } from 'react'
import Lenis from 'lenis'
import FloatingNav from './components/FloatingNav'
import HeroSection from './components/sections/HeroSection'
import ProblemSection from './components/sections/ProblemSection'
import MetricsStrip from './components/sections/MetricsStrip'
import PipelineSection from './components/sections/PipelineSection'
import PocSection from './components/sections/PocSection'
import ExplorerSection from './components/sections/ExplorerSection'
import ValidationSection from './components/sections/ValidationSection'
import ExperimentsSection from './components/sections/ExperimentsSection'
import CycloneWarningSection from './components/sections/CycloneWarningSection'
import ImpactSection from './components/sections/ImpactSection'
import FooterSection from './components/sections/FooterSection'
import { setLenis, scrollToId } from './lib/scroll'
import { loadOceanGrid } from './lib/modelStore'
import ErrorBoundary from './components/ErrorBoundary'

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [navOnPaper, setNavOnPaper] = useState(false)
  const [gridTick, setGridTick] = useState(0)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    loadOceanGrid()
      .then(() => setGridTick((n) => n + 1))
      .catch((err) => console.warn('Ocean grid snapshot failed', err))
  }, [])

  const handleScroll = useCallback(() => {
    const track = document.getElementById('hero-track')
    if (track) {
      const rect = track.getBoundingClientRect()
      const totalScrollable = rect.height - window.innerHeight
      if (totalScrollable > 0) {
        const current = -rect.top
        setScrollProgress(Math.max(0, Math.min(1, current / totalScrollable)))
      } else {
        setScrollProgress(rect.bottom <= 0 ? 1 : 0)
      }
    }
    // Probe below the fixed nav so theme matches the section actually on screen.
    const y = 80
    const dark = [...document.querySelectorAll('[data-theme="dark"]')].some((el) => {
      const r = el.getBoundingClientRect()
      return r.top <= y && r.bottom > y
    })
    setNavOnPaper(!dark)
  }, [])

  useEffect(() => {
    let raf = 0
    const lenis = reduced ? null : new Lenis({
      duration: 1.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1,
    })
    setLenis(lenis)

    const onRaf = (time) => {
      lenis?.raf(time)
      raf = requestAnimationFrame(onRaf)
    }
    if (lenis) raf = requestAnimationFrame(onRaf)

    const onLenisScroll = () => handleScroll()
    lenis?.on('scroll', onLenisScroll)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    const hash = window.location.hash.slice(1)
    if (hash) {
      const jump = () => scrollToId(hash, { immediate: true })
      requestAnimationFrame(jump)
      setTimeout(jump, 120)
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      lenis?.off('scroll', onLenisScroll)
      cancelAnimationFrame(raf)
      setLenis(null)
      lenis?.destroy()
    }
  }, [handleScroll, reduced])

  return (
    <div>
      <a
        href="#problem"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          scrollToId('problem')
        }}
      >
        Skip to content
      </a>
      <FloatingNav onPaper={navOnPaper} />

      <div
        id="hero-track"
        data-theme="dark"
        style={{ height: reduced ? '100vh' : '360vh', position: 'relative' }}
      >
        <div
          id="hero"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100%',
            overflow: 'hidden',
            zIndex: 4,
            opacity: scrollProgress >= 0.995 ? 0 : 1,
            visibility: scrollProgress >= 0.995 ? 'hidden' : 'visible',
            pointerEvents: 'none',
          }}
        >
          <HeroSection scrollProgress={reduced ? 0.12 : scrollProgress} />
        </div>
      </div>

      <div id="problem"><ProblemSection /></div>
      <div id="metrics"><MetricsStrip /></div>
      <div id="pipeline"><PipelineSection /></div>
      <div id="poc" data-theme="dark">
        <ErrorBoundary>
          <PocSection key={gridTick} />
        </ErrorBoundary>
      </div>
      <div id="explorer" data-theme="dark">
        <ErrorBoundary>
          <ExplorerSection />
        </ErrorBoundary>
      </div>
      <div id="validation"><ValidationSection /></div>
      <div id="cyclones"><CycloneWarningSection /></div>
      <div id="experiments"><ExperimentsSection /></div>
      <div id="impact"><ImpactSection /></div>
      <FooterSection />
    </div>
  )
}

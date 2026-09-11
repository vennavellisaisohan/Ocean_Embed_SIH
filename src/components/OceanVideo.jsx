import { useEffect, useRef, useState } from 'react'

export default function OceanVideo({ progress = 0 }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const [soundOn, setSoundOn] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true
    video.pause()
    video.currentTime = 0

    let raf = 0
    const tick = () => {
      const p = Math.max(0, Math.min(1, progressRef.current))
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
      if (duration > 0) {
        if (!video.paused) video.pause()
        const t = p * Math.max(0.04, duration - 0.08)
        if (Math.abs(video.currentTime - t) > 0.04) {
          try { video.currentTime = t } catch { /* seek in flight */ }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.loop = true
    audio.volume = 0.7

    const start = () => {
      if (!soundOn) return
      const play = audio.play()
      if (play && typeof play.catch === 'function') play.catch(() => {})
    }

    start()
    const unlock = () => start()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('wheel', unlock, { once: true, passive: true })
    window.addEventListener('touchstart', unlock, { once: true, passive: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('wheel', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [soundOn])

  const toggleSound = () => {
    const audio = audioRef.current
    const next = !soundOn
    setSoundOn(next)
    if (!audio) return
    if (next) audio.play().catch(() => {})
    else audio.pause()
  }

  return (
    <div className="hero-film">
      <img className="hero-film-poster" src="/ocean-poster.png" alt="" aria-hidden="true" />
      <video
        ref={videoRef}
        className="hero-film-video"
        src="/ocean.mp4"
        poster="/ocean-poster.png"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <audio ref={audioRef} src="/ocean-audio.m4a" loop preload="auto" />
      <button
        type="button"
        className={`sound-toggle${soundOn ? ' on' : ''}`}
        onClick={toggleSound}
        aria-label={soundOn ? 'Mute ocean sound' : 'Play ocean sound'}
      >
        {soundOn ? 'Sound on' : 'Sound off'}
      </button>
    </div>
  )
}

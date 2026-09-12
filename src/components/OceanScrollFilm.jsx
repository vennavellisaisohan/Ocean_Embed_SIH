import { useEffect, useRef } from 'react'

import { publicUrl } from '../lib/cdn'

const VIDEO_SRC = publicUrl('/ocean.mp4')
const POSTER_SRC = publicUrl('/ocean-poster.png')

function clamp01(v) {
  return Math.max(0, Math.min(1, v))
}

/** Linger on the sunlit surface, then ease into the abyss. */
function mapScrollToFilm(p) {
  const x = clamp01(p)
  const surfaceHold = 0.07
  if (x < 0.18) return (x / 0.18) * surfaceHold
  const t = (x - 0.18) / 0.82
  const s = t * t * (3 - 2 * t)
  return surfaceHold + s * (1 - surfaceHold)
}

function drawCover(ctx, media, w, h, zoom = 1) {
  const mw = media.videoWidth || media.naturalWidth || media.width
  const mh = media.videoHeight || media.naturalHeight || media.height
  if (!mw || !mh) return
  const ir = mw / mh
  const cr = w / h
  let dw
  let dh
  if (ir > cr) {
    dh = h * zoom
    dw = dh * ir
  } else {
    dw = w * zoom
    dh = dw / ir
  }
  // Bias the crop up and left so any residual bottom-right mark stays off-screen.
  ctx.drawImage(media, (w - dw) / 2 - dw * 0.012, (h - dh) / 2 - dh * 0.018, dw, dh)
}

function makeSnow(count, w, h) {
  const flakes = []
  for (let i = 0; i < count; i++) {
    flakes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.6,
      s: 0.12 + Math.random() * 0.55,
      a: 0.08 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.25,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return flakes
}

export default function OceanScrollFilm({ progress = 0 }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const posterRef = useRef(null)
  const progressRef = useRef(progress)
  const playheadRef = useRef(0)
  const readyRef = useRef(false)
  progressRef.current = progress

  useEffect(() => {
    const poster = new Image()
    poster.decoding = 'async'
    poster.src = POSTER_SRC
    posterRef.current = poster
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const markReady = () => {
      if (video.readyState >= 2) readyRef.current = true
    }

    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.addEventListener('loadeddata', markReady)
    video.addEventListener('canplay', markReady)
    video.addEventListener('canplaythrough', markReady)
    markReady()
    const unlock = video.play()
    if (unlock && typeof unlock.then === 'function') {
      unlock.then(() => { video.pause() }).catch(() => {})
    }

    return () => {
      video.removeEventListener('loadeddata', markReady)
      video.removeEventListener('canplay', markReady)
      video.removeEventListener('canplaythrough', markReady)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    let raf = 0
    let running = true
    let snow = []
    let snowW = 0
    let snowH = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      if (canvas.width !== snowW || canvas.height !== snowH) {
        snowW = canvas.width
        snowH = canvas.height
        snow = makeSnow(140, snowW, snowH)
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const tick = () => {
      if (!running) return
      const w = canvas.width
      const h = canvas.height
      const p = clamp01(progressRef.current)
      const target = mapScrollToFilm(p)
      playheadRef.current += (target - playheadRef.current) * 0.14
      const film = playheadRef.current
      const zoom = 1.06 + film * 0.1

      ctx.fillStyle = '#03080c'
      ctx.fillRect(0, 0, w, h)

      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 6.04
      const t = film * Math.max(0.04, duration - 0.05)
      if (readyRef.current && video.readyState >= 2) {
        if (Math.abs(video.currentTime - t) > 0.012) {
          try { video.currentTime = t } catch { /* seek in flight */ }
        }
        if (video.videoWidth) drawCover(ctx, video, w, h, zoom)
        else if (posterRef.current?.complete) drawCover(ctx, posterRef.current, w, h, zoom)
      } else if (posterRef.current?.complete) {
        drawCover(ctx, posterRef.current, w, h, zoom)
      }

      // Depth grade — water column darkens as we descend
      ctx.fillStyle = `rgba(1, 6, 10, ${0.08 + film * 0.42})`
      ctx.fillRect(0, 0, w, h)

      // Soft top caustic wash, fading with depth
      const wash = ctx.createLinearGradient(0, 0, 0, h * 0.55)
      wash.addColorStop(0, `rgba(186, 220, 214, ${0.16 * (1 - film)})`)
      wash.addColorStop(0.35, `rgba(40, 90, 96, ${0.08 * (1 - film)})`)
      wash.addColorStop(1, 'rgba(3, 8, 12, 0)')
      ctx.fillStyle = wash
      ctx.fillRect(0, 0, w, h)

      // Marine snow — denser and faster in the mesopelagic
      const speed = 0.35 + film * 1.4
      ctx.fillStyle = '#d7efe8'
      for (const f of snow) {
        f.phase += 0.012
        f.y -= f.s * speed * (h / 900)
        f.x += Math.sin(f.phase) * f.drift
        if (f.y < -4) {
          f.y = h + 4
          f.x = Math.random() * w
        }
        if (f.x < -4) f.x = w + 4
        if (f.x > w + 4) f.x = -4
        ctx.globalAlpha = f.a * (0.35 + film * 0.85)
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r * (0.8 + film * 0.5), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // Cinematic vignette
      const vig = ctx.createRadialGradient(w * 0.5, h * 0.28, h * 0.12, w * 0.5, h * 0.45, h * 0.92)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, `rgba(0, 0, 0, ${0.34 + film * 0.28})`)
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, w, h)

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="ocean-film" aria-hidden="true" style={{ '--dive': clamp01(progress) }}>
      <img className="ocean-poster" src={POSTER_SRC} alt="" />
      <video
        ref={videoRef}
        className="ocean-video"
        src={VIDEO_SRC}
        muted
        playsInline
        preload="auto"
        tabIndex={-1}
      />
      <canvas ref={canvasRef} />
      <div className="ocean-caustics" />
    </div>
  )
}

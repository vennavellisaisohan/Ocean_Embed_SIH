import { useCallback, useEffect, useRef } from 'react'
import { Suspense } from 'react'
import { OFFICIAL_DEPTHS } from '../../lib/realOceanData'
import { getField, getTransect, LAT_MAX, LAT_MIN, LON_MAX, LON_MIN } from '../../lib/nioField'
import { turbo } from '../../lib/colormaps'
import {
  drawBoxes, drawGrid, drawLabels, drawTracks, paintField, paintLandTerrain, xy,
} from '../../lib/paintNio'
import TempGlobe from '../three/TempGlobe'

function useMapCanvas(paint) {
  const ref = useRef(null)
  const wrap = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const box = wrap.current
    if (!canvas || !box) return
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = box.clientWidth
      if (w < 8) return
      const h = Math.max(280, Math.round(w * (LAT_MAX - LAT_MIN) / (LON_MAX - LON_MIN)))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      paint(ctx, canvas.width, canvas.height, w, h, dpr)
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(box)
    return () => ro.disconnect()
  }, [paint])
  return { ref, wrap }
}

export function CyclonePanel({ dateId }) {
  const paint = useCallback((ctx, dw, dh, w, h, dpr) => {
    const field = getField('evap', 0, dateId)
    paintField(ctx, field, 'evap', field.vmin, field.vmax, dw, dh, [48, 42, 72])
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGrid(ctx, w, h, 'rgba(241,235,225,0.18)')
    drawTracks(ctx, w, h, { dark: false })
    drawLabels(ctx, w, h, 'rgba(241,235,225,0.72)')
  }, [dateId])
  const { ref, wrap } = useMapCanvas(paint)
  return (
    <figure className="sci-figure dark">
      <header>
        <h3>UNet TCHP and IBTrACS track — 29 Aug 2024 (ASNA)</h3>
        <p>ERA5-style latent heat flux · satellite SST × wind · 0.25°</p>
      </header>
      <div className="sci-canvas" ref={wrap}><canvas ref={ref} /></div>
      <div className="sci-bar inferno">
        <span>0</span><i /><span>300 W/m²</span>
      </div>
    </figure>
  )
}

export function PlatesPanel({ dateId }) {
  const paintA = useCallback((ctx, dw, dh, w, h, dpr) => {
    const sst = getField('sst', 0, dateId)
    paintField(ctx, sst, 'sst', 24, 31, dw, dh)
    paintLandTerrain(ctx, sst, dw, dh)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGrid(ctx, w, h)
    drawLabels(ctx, w, h)
  }, [dateId])
  const paintB = useCallback((ctx, dw, dh, w, h, dpr) => {
    const eddy = getField('eddy', 0, dateId)
    paintField(ctx, eddy, 'eddy', 0, 60, dw, dh, [90, 96, 88])
    paintLandTerrain(ctx, eddy, dw, dh)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawGrid(ctx, w, h)
    drawBoxes(ctx, w, h)
    drawLabels(ctx, w, h)
  }, [dateId])
  const a = useMapCanvas(paintA)
  const b = useMapCanvas(paintB)
  return (
    <div className="plates">
      <figure className="sci-figure">
        <header>
          <h3>(a) Sea surface temperature</h3>
          <p>Harmonized SST · 0.25° daily · North Indian Ocean</p>
        </header>
        <div className="sci-canvas" ref={a.wrap}><canvas ref={a.ref} /></div>
        <div className="sci-bar jet"><span>24 °C</span><i /><span>31 °C</span></div>
      </figure>
      <figure className="sci-figure">
        <header>
          <h3>(b) Mesoscale eddy kinetic structure</h3>
          <p>Boxes: Arabian Sea and Bay of Bengal eddy fields</p>
        </header>
        <div className="sci-canvas" ref={b.wrap}><canvas ref={b.ref} /></div>
        <div className="sci-bar bathy"><span>0</span><i /><span>MBV</span></div>
      </figure>
    </div>
  )
}

export function CutPanel({ lat, dateId, depth = 100 }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const transect = getTransect(lat, dateId)
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = wrap.clientWidth
      if (w < 8) return
      const h = Math.max(260, Math.round(w * 0.38))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      const ctx = canvas.getContext('2d')
      const dw = canvas.width
      const dh = canvas.height
      const img = ctx.createImageData(dw, dh)
      const data = img.data
      const nL = transect.lons.length
      const depths = transect.depths
      const nD = depths.length
      const sampleCol = (ji, depthM) => {
        if (transect.land[ji]) return null
        const col = transect.values[ji]
        if (depthM <= depths[0]) return col[0]
        if (depthM >= depths[nD - 1]) return col[nD - 1]
        for (let k = 1; k < nD; k++) {
          if (depthM <= depths[k]) {
            const t = (depthM - depths[k - 1]) / (depths[k] - depths[k - 1])
            return col[k - 1] + (col[k] - col[k - 1]) * t
          }
        }
        return col[nD - 1]
      }
      for (let y = 0; y < dh; y++) {
        const depthM = (y / Math.max(1, dh - 1)) * 1000
        for (let x = 0; x < dw; x++) {
          const ji = Math.min(nL - 1, Math.floor((x / dw) * nL))
          const p = (y * dw + x) * 4
          const v = sampleCol(ji, depthM)
          if (v == null) {
            data[p] = 22; data[p + 1] = 28; data[p + 2] = 36; data[p + 3] = 255
            continue
          }
          const [r, g, b] = turbo(v, 6, 31)
          data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const yCut = (depth / 1000) * h
      ctx.strokeStyle = '#c4a574'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(0, yCut)
      ctx.lineTo(w, yCut)
      ctx.stroke()
      ctx.fillStyle = 'rgba(239,232,220,0.7)'
      ctx.font = '11px "IBM Plex Mono", monospace'
      ;[0, 100, 200, 500, 1000].forEach((d) => {
        const y = (d / 1000) * h
        ctx.fillText(`${d} m`, 8, Math.min(h - 6, y + 12))
      })
      ctx.fillStyle = '#c4a574'
      ctx.fillText(`${depth} m`, 48, Math.min(h - 6, yCut + 12))
      ;[50, 60, 70, 80, 90, 100].forEach((lon) => {
        const { x } = xy(lon, lat, w, h)
        ctx.fillText(`${lon}°E`, x - 12, h - 8)
      })
    }
    draw()
    const ro = new ResizeObserver(draw)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [lat, dateId, depth])

  return (
    <figure className="sci-figure dark">
      <header>
        <h3>Vertical cut · {lat.toFixed(2)}°N · {dateId} · {depth} m highlighted</h3>
        <p>OceanEmbed θ(z) along a zonal section. Land is blank. Colour is temperature in °C.</p>
      </header>
      <div className="sci-canvas" ref={wrapRef}><canvas ref={canvasRef} /></div>
      <div className="sci-bar jet"><span>6 °C</span><i /><span>31 °C</span></div>
    </figure>
  )
}

export function GlobePanel({ depth, dateId }) {
  return (
    <div className="globe-pair">
      <Suspense fallback={<div className="globe-wrap" />}>
        <TempGlobe mode="sst" depth={0} dateId={dateId} caption="Satellite SST · skin of the ocean" />
        <TempGlobe mode="theta" depth={depth} dateId={dateId} caption={`OceanEmbed θ · ${depth} m reconstructed`} />
      </Suspense>
    </div>
  )
}

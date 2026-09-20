import { useState } from 'react'
import { ChevronDown, ChevronUp, Layers, Info } from 'lucide-react'

/**
 * Physical interpretation guide for colormaps used across the 0.25° ocean grid.
 */
const COLOR_SCALES = {
  theta: {
    title: 'Subsurface Potential Temperature θ(z)',
    whatIsIt: 'Volumetric ocean temperature predicted at standard depth levels from satellite multi-sensor inputs.',
    unit: '°C',
    gradient: 'linear-gradient(to right, #30123b 0%, #3b528b 20%, #21918c 40%, #5ec962 60%, #fde725 80%, #e31a1c 100%)',
    bands: [
      {
        color: '#e31a1c',
        range: '≥ 28.5 °C',
        regime: 'Tropical Warm Pool',
        desc: 'Fuels severe cyclone genesis (TCHP > 50 kJ/cm²)',
      },
      {
        color: '#fd8d3c',
        range: '25.0 – 28.4 °C',
        regime: 'Mixed Layer Mean',
        desc: 'Surpasses the critical 26 °C cyclogenesis isotherm (D₂₆)',
      },
      {
        color: '#fde725',
        range: '21.0 – 24.9 °C',
        regime: 'Upper Thermocline',
        desc: 'Steep vertical thermal and density gradient transition',
      },
      {
        color: '#5ec962',
        range: '16.0 – 20.9 °C',
        regime: 'Core Thermocline (D₂₀)',
        desc: 'Standard oceanographic thermocline boundary layer',
      },
      {
        color: '#21918c',
        range: '11.0 – 15.9 °C',
        regime: 'Intermediate Subsurface',
        desc: 'Mesoscale cold eddy cores & Somali upwelling tongue',
      },
      {
        color: '#30123b',
        range: '6.0 – 10.9 °C',
        regime: 'Abyssal Water Mass',
        desc: 'Dense, cold deep ocean layer extending to 1000 m',
      },
    ],
  },
  sst: {
    title: 'Sea Surface Skin Temperature (SST)',
    whatIsIt: 'Harmonized daily foundation temperature from GHRSST and OSTIA L4 satellite infrared radiometers.',
    unit: '°C',
    gradient: 'linear-gradient(to right, #30123b 0%, #3b528b 20%, #21918c 40%, #5ec962 60%, #fde725 80%, #e31a1c 100%)',
    bands: [
      {
        color: '#e31a1c',
        range: '30.0 – 32.0 °C',
        regime: 'Extreme Heat Pool',
        desc: 'Pre-monsoon Arabian Sea & central Bay of Bengal apex',
      },
      {
        color: '#fd8d3c',
        range: '28.0 – 29.9 °C',
        regime: 'Tropical Mixed Surface',
        desc: 'High atmospheric moisture flux & air-sea energy exchange',
      },
      {
        color: '#fde725',
        range: '26.0 – 27.9 °C',
        regime: 'Marginal Convective Layer',
        desc: 'Baseline surface temperature across open basin',
      },
      {
        color: '#21918c',
        range: '24.0 – 25.9 °C',
        regime: 'Coastal Upwelling Tongue',
        desc: 'Oman / Somali coast monsoon upwelling cold filaments',
      },
    ],
  },
  sss: {
    title: 'Sea Surface Salinity (SSS)',
    whatIsIt: '8-day running mean salinity from SMAP and SMOS L3 microwave radiometers on 0.25° grid.',
    unit: 'PSU',
    gradient: 'linear-gradient(to right, #0b1c24 0%, #214f4a 33%, #b48c50 66%, #c4a574 100%)',
    bands: [
      {
        color: '#c4a574',
        range: '36.0 – 37.0 PSU',
        regime: 'Hypersaline Basin',
        desc: 'High net evaporation in Arabian Sea & Gulf of Aden',
      },
      {
        color: '#b48c50',
        range: '34.5 – 35.9 PSU',
        regime: 'Equatorial Marine Mean',
        desc: 'Open ocean balance along equatorial jet stream',
      },
      {
        color: '#214f4a',
        range: '33.0 – 34.4 PSU',
        regime: 'Monsoonal Brackish Fringe',
        desc: 'Transition zone in southern Bay of Bengal',
      },
      {
        color: '#0b1c24',
        range: '31.0 – 32.9 PSU',
        regime: 'Freshwater River Plume',
        desc: 'Massive Ganges-Brahmaputra discharge in Northern BoB',
      },
    ],
  },
  sla: {
    title: 'Sea Level Anomaly (SLA)',
    whatIsIt: 'Multi-satellite altimeter constellation (Sentinel-3, Jason-CS, CryoSat-2) geostrophic deviation.',
    unit: 'm',
    gradient: 'linear-gradient(to right, #214f4a 0%, #f1ebe1 50%, #c45c26 100%)',
    bands: [
      {
        color: '#c45c26',
        range: '+0.10 to +0.22 m',
        regime: 'Anticyclonic Eddy (Downwelling)',
        desc: 'Deep warm pool core, depresses thermocline downward',
      },
      {
        color: '#f1ebe1',
        range: '-0.05 to +0.05 m',
        regime: 'Neutral Geostrophic Equilibrium',
        desc: 'Mean sea surface topography without vortex perturbation',
      },
      {
        color: '#214f4a',
        range: '-0.22 to -0.06 m',
        regime: 'Cyclonic Eddy (Upwelling)',
        desc: 'Lifts cold, nutrient-rich thermocline water toward surface',
      },
    ],
  },
  evap: {
    title: 'Tropical Cyclone Heat Potential (TCHP)',
    whatIsIt: 'Integrated upper-ocean heat content above the 26 °C isotherm, computed from the full depth column.',
    unit: 'kJ/cm²',
    gradient: 'linear-gradient(to right, #000004 0%, #651557 30%, #d44842 60%, #f67d15 80%, #fcfdbf 100%)',
    bands: [
      {
        color: '#fcfdbf',
        range: '≥ 80 kJ/cm²',
        regime: 'Extreme Cyclone Heat Storage',
        desc: 'Sustains rapid intensification into Very Severe / Super Cyclones',
      },
      {
        color: '#f67d15',
        range: '50 – 79 kJ/cm²',
        regime: 'Favorable Cyclone Reservoir',
        desc: 'Deep warm layer prevents ocean self-cooling during storm passage',
      },
      {
        color: '#d44842',
        range: '25 – 49 kJ/cm²',
        regime: 'Moderate Heat Pool',
        desc: 'Marginal energy to sustain moderate tropical storms',
      },
      {
        color: '#000004',
        range: '< 25 kJ/cm²',
        regime: 'Low / Inactive Reservoir',
        desc: 'Thin mixed layer (<30 m); cold water quickly halts storm energy',
      },
    ],
  },
}

export default function RasterColorKeyPanel({
  layerId = 'theta',
  depth = 100,
  pin,
  thetaAtDepth,
  surface,
  meta,
}) {
  const [collapsed, setCollapsed] = useState(false)

  const activeScale = COLOR_SCALES[layerId] || COLOR_SCALES.theta
  const isTheta = layerId === 'theta'

  // Current pinned value & regime
  let currentValue = null
  const currentUnit = activeScale.unit
  if (isTheta) {
    currentValue = thetaAtDepth != null ? `${thetaAtDepth.toFixed(2)} °C` : null
  } else if (layerId === 'sst' && surface?.sst != null) {
    currentValue = `${surface.sst.toFixed(2)} °C`
  } else if (layerId === 'sss' && surface?.sss != null) {
    currentValue = `${surface.sss.toFixed(2)} PSU`
  } else if (layerId === 'sla' && surface?.sla != null) {
    currentValue = `${surface.sla.toFixed(3)} m`
  } else if (layerId === 'evap' && surface?.tchp != null) {
    currentValue = `${surface.tchp.toFixed(0)} kJ/cm²`
  }

  return (
    <div className={`raster-color-key ${collapsed ? 'collapsed' : ''}`}>
      <div className="raster-key-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="raster-key-title-group">
          <span className="raster-tag">
            <Layers size={11} style={{ marginRight: 4 }} />
            0.25° BASIN RASTER
          </span>
          <h4 className="raster-key-title">
            {isTheta ? `θ at ${depth} m Depth` : activeScale.title}
          </h4>
        </div>
        <button
          type="button"
          className="raster-key-toggle"
          aria-label={collapsed ? 'Expand colormap guide' : 'Collapse colormap guide'}
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="raster-key-body">
          {/* Explanation of what the raster graph is */}
          <div className="raster-what-is-it">
            <Info size={12} className="info-icon" />
            <p>
              <strong>What is this raster?</strong> {activeScale.whatIsIt}
            </p>
          </div>

          {/* Current pinned cell reading */}
          {pin && currentValue && (
            <div className="raster-pin-readout">
              <span className="pin-coord">
                Pinned cell: {pin.lat.toFixed(2)}°N {pin.lon.toFixed(2)}°E
              </span>
              <span className="pin-val-highlight">{currentValue}</span>
            </div>
          )}

          {/* Continuous Spectrum Gradient Bar */}
          <div className="raster-gradient-section">
            <div className="raster-gradient-label">
              <span>Which color represents what:</span>
              <span className="raster-meta-range">
                {meta?.min ?? 6} to {meta?.max ?? 31} {currentUnit}
              </span>
            </div>
            <div
              className="raster-gradient-bar"
              style={{ backgroundImage: activeScale.gradient }}
            />
            <div className="raster-gradient-ticks">
              <span>Low ({meta?.min ?? 6} {currentUnit})</span>
              <span>Median</span>
              <span>High ({meta?.max ?? 31} {currentUnit})</span>
            </div>
          </div>

          {/* Color Breakdown Table */}
          <div className="raster-bands-list">
            {activeScale.bands.map((b, i) => (
              <div key={i} className="raster-band-item">
                <div className="raster-band-left">
                  <span
                    className="raster-swatch"
                    style={{ backgroundColor: b.color, boxShadow: `0 0 6px ${b.color}40` }}
                  />
                  <div className="raster-band-info">
                    <span className="raster-band-range">{b.range}</span>
                    <span className="raster-band-regime">{b.regime}</span>
                  </div>
                </div>
                <div className="raster-band-desc">{b.desc}</div>
              </div>
            ))}
          </div>

          <div className="raster-key-footer">
            <span>Grid cell size: 0.25° × 0.25° (~27 km)</span>
            <span>OceanUNet Test 2024-08-29</span>
          </div>
        </div>
      )}
    </div>
  )
}

import { INPUT_CATALOG } from '../../lib/mockData'
import { SectionHead } from '../ui'

const STEPS = [
  {
    title: 'Satellite inputs',
    body: 'SST, SSS, SLA, currents and winds from Copernicus Marine and NASA PO.DAAC.',
    tag: 'CMEMS · GHRSST · SMAP',
  },
  {
    title: 'Clean & grid',
    body: 'Crop to the North Indian Ocean. Land mask, QC, cloud-gap inpainting. 0.25° daily.',
    tag: 'Python · xarray · CDO',
  },
  {
    title: 'Embedding',
    body: 'CNN / ViT encoder compresses the surface state into a compact latent vector.',
    tag: '256-d latent',
  },
  {
    title: 'Reconstruct',
    body: 'Decoder maps the embedding to temperature at 15 standard depths, 0–1000 m.',
    tag: 'Trained on GLORYS12V1',
  },
  {
    title: 'Products',
    body: 'Daily NetCDF fields plus TCHP, D₂₀ and D₂₆ — the isotherms cyclones care about.',
    tag: 'CF-1.8 · Cartopy',
  },
  {
    title: 'Validate',
    body: 'Score only against independent Argo. RMSE, bias, R. Never against the training target.',
    tag: 'IFREMER · INCOIS',
  },
]

export default function PipelineSection() {
  return (
    <section className="section paper">
      <div className="wrap">
        <SectionHead index="02" title="From the satellite" italic="to the column.">
          <p className="lede" style={{ marginTop: 18 }}>
            Train on GLORYS. Infer with satellites only. Six steps, no theatre.
          </p>
        </SectionHead>

        <ol className="method">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              <span className="tag">{s.tag}</span>
            </li>
          ))}
        </ol>

        <p className="method-note">
          Basin-aware training for the Arabian Sea versus the Bay of Bengal.
          Depth-weighted loss on the thermocline, where error likes to hide.
        </p>

        <div style={{ overflowX: 'auto', marginTop: 56 }}>
          <table className="bench catalog">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Source</th>
                <th>Native</th>
                <th>Harmonized</th>
                <th>Role</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {INPUT_CATALOG.map((row) => (
                <tr key={row.variable} style={{ cursor: 'default' }}>
                  <td>{row.variable}</td>
                  <td>{row.source}</td>
                  <td>{row.native}</td>
                  <td>{row.harmonized}</td>
                  <td>{row.role}</td>
                  <td>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

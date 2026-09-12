/** Frozen ocean-only cyclone results for the SIH demo. 2024 was not retuned. */

export const CLAIM =
  'The model shows 7-day early-warning skill for cyclone occurrence and intensity, not precise 7-day track location.'

export const METRICS_5F = [
  { id: 'named', label: 'Named 2024 storms warned, 7 days out', value: 4, suffix: '/4', int: true },
  { id: 'recall', label: '7-day detection recall (2024 blind)', value: 52.5, suffix: '%', decimals: 1 },
  { id: 'wind', label: 'Active-cell wind MAE (2024)', value: 15.3, suffix: ' kt', decimals: 1 },
  { id: 'auc', label: 'Discrimination ROC-AUC', value: 0.72, suffix: '', decimals: 2 },
]

export const STORM_2024 = [
  {
    name: 'REMAL',
    basin: 'Bay of Bengal',
    when: 'May 2024 · 60 kt',
    warned: true,
    recall: '100%',
    recallPct: 100,
    peak: 51,
    loc: 'Covered by a large blob (502 km offset)',
    solves: '7-day warning fired. Intensity head usable.',
    fails: 'Not a precise track — the alert smears half into the Arabian Sea.',
    ok: true,
  },
  {
    name: 'FENGAL',
    basin: 'Bay of Bengal',
    when: 'Nov–Dec 2024 · 45 kt',
    warned: true,
    recall: '98%',
    recallPct: 98,
    peak: 55,
    loc: 'Peak on the track (236 km)',
    solves: 'This is the case that proves the architecture can localize an unseen storm.',
    fails: 'Still some false alarms in the opposite basin.',
    ok: true,
  },
  {
    name: 'DANA',
    basin: 'Bay of Bengal',
    when: 'Oct 2024 · 60 kt',
    warned: true,
    recall: '1.2%',
    recallPct: 1.2,
    peak: 61,
    loc: 'Peak 61% in the Arabian Sea, truth in the BoB',
    solves: 'A warning still triggered. Local P on the true footprint ≈ 0.33.',
    fails: 'High confidence in the wrong basin. Corridor bias.',
    ok: false,
  },
  {
    name: 'ASNA',
    basin: 'Arabian Sea',
    when: 'Aug–Sep 2024 · 40 kt · land origin',
    warned: true,
    recall: '0%',
    recallPct: 0,
    peak: 39,
    loc: 'Peak 39% in the Bay of Bengal, 3,466 km away',
    solves: 'Occurrence trigger only — the basin lit up somewhere.',
    fails: 'Formed over land. No ocean TCHP under the storm. Ocean-only cannot see it.',
    ok: false,
  },
]

export const HEADS = [
  { head: 'Occurrence', result: '4/4 named storms triggered', status: 'Use' },
  { head: 'Intensity', result: '15.3 kt MAE (better than 2023 val)', status: 'Use' },
  { head: 'Location', result: 'CSI 0.021 · FAR ~98% · ASNA/DANA fail', status: 'Do not claim' },
  { head: 'Super El Niño', result: 'Pacific event — not in this NIO grid', status: 'Out of scope' },
]

export const FOUR_HOUR = [
  { item: 'Download 2022–23 ERA5 + train atmosphere model', time: '3–6 h', do: false, why: 'Will not finish; 2024 still untested' },
  { item: 'Train on 2024 only', time: '1–2 h', do: false, why: '4 storms, un-blinds the test, will not generalize' },
  { item: 'Ship ocean cyclone early-warning + honest spatial gap', time: 'now', do: true, why: 'Results already computed; demo is the site' },
]

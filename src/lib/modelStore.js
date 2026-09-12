import LITE from './oceanembedLite.json'

/** Mutable store: lite metadata first, full grids after fetch. */
export const MODEL = { ...LITE }

const waiters = []

export function modelGridReady() {
  return Array.isArray(MODEL.sst) && MODEL.sst.length > 0
}

export function onModelGridReady(fn) {
  if (modelGridReady()) fn()
  else waiters.push(fn)
}

export async function loadOceanGrid() {
  if (modelGridReady()) return MODEL
  const res = await fetch('/data/oceanembed_model.json', { cache: 'force-cache' })
  if (!res.ok) throw new Error(`oceanembed_model.json ${res.status}`)
  const full = await res.json()
  Object.assign(MODEL, full)
  waiters.splice(0).forEach((fn) => fn())
  return MODEL
}

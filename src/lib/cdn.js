/** Large public assets live on GitHub; localhost uses /public. */
export const PUBLIC_CDN =
  'https://cdn.jsdelivr.net/gh/vennavellisaisohan/Ocean_Embed_SIH@main/public'

export function publicUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    return p
  }
  return `${PUBLIC_CDN}${p}`
}

let lenis = null

export function setLenis(instance) {
  lenis = instance
}

export function getLenis() {
  return lenis
}

export function scrollToId(id, options = {}) {
  if (id === 'hero' || id === 'hero-track') {
    scrollToTop(options)
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  if (lenis) {
    // Lenis already honors CSS scroll-margin-top on the target.
    lenis.scrollTo(el, { duration: 1.15, ...options })
    return
  }
  el.scrollIntoView({ behavior: options.immediate ? 'auto' : 'smooth' })
}

export function scrollToTop(options = {}) {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.05, ...options })
    return
  }
  window.scrollTo({ top: 0, behavior: options.immediate ? 'auto' : 'smooth' })
}

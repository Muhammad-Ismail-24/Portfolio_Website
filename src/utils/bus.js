/**
 * Tiny window-event bus so far-apart features can talk without prop drilling:
 * the hidden terminal opens projects, launches product windows, and so on.
 */
export const EVENTS = {
  openProject: 'portfolio:open-project',   // detail: { index }
  launchApp: 'portfolio:launch-app',       // detail: { id }   (product id)
  openTerminal: 'portfolio:open-terminal', // no detail
  exitFullscreen: 'portfolio:exit-fullscreen', // no detail — leave the OS full-screen overlay
}

export function emit(name, detail) {
  window.dispatchEvent(new CustomEvent(name, { detail }))
}

export function on(name, handler) {
  const fn = (e) => handler(e.detail ?? {})
  window.addEventListener(name, fn)
  return () => window.removeEventListener(name, fn)
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Page-scroll lock shared by the terminal and the OS full-screen overlay:
 * Lenis stays stopped until every owner has let go.
 */
const scrollOwners = new Set()
export function lockScroll(owner) {
  scrollOwners.add(owner)
  window.__lenis?.stop?.()
}
export function unlockScroll(owner) {
  scrollOwners.delete(owner)
  if (scrollOwners.size === 0) window.__lenis?.start?.()
}

/** Glide to an absolute page offset through Lenis when it's running, else natively. */
export function scrollToY(y, duration = 1.1) {
  const lenis = window.__lenis
  if (lenis) lenis.scrollTo(y, { duration, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) })
  else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

/** Scroll to a section id through Lenis when it's running, else natively. */
export function scrollToId(id, { onComplete } = {}) {
  const el = document.getElementById(id)
  if (!el) return false
  const lenis = window.__lenis
  if (lenis) {
    lenis.scrollTo(el, { duration: 1.4, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), onComplete })
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    if (onComplete) setTimeout(onComplete, prefersReducedMotion() ? 0 : 600)
  }
  return true
}

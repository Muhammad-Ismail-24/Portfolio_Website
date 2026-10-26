import { useLenis } from '@studio-freight/react-lenis'

// Ease-in-out so long jumps start and land softly
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// Returns a click handler that glides to a section id through Lenis
// instead of the browser's instant jump.
export function useSmoothScroll() {
  const lenis = useLenis()

  // Expose Lenis so non-React code (the terminal, the event bus) can glide too
  if (lenis && typeof window !== 'undefined') window.__lenis = lenis

  return (e, id) => {
    e?.preventDefault?.()
    if (lenis) {
      lenis.scrollTo(`#${id}`, { duration: 1.4, easing: easeInOutCubic })
    } else {
      document.getElementById(id)?.scrollIntoView()
    }
  }
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../utils/bus'
import Monitor, { monitorMetrics } from './os/Monitor'
import Phone from './os/Phone'

/* ════════════════════════════════════════════════════════════════════════════
   Products — portfolio-os.

   A small computer: each web app is an icon on its desktop. Clicking one
   launches a browser-style window (tab, address bar, loading bar) showing the
   product's page. Windows drag by their tab strip, stack, minimise to the
   taskbar, maximise and close (Esc closes the focused one).
   The Terminal icon opens the site's hidden terminal; README explains the OS.
   Terminal: `launch drivefetch` (or `open shifa`) opens a window from anywhere.

   Layout: the OS renders at a fixed 1280×800 (see os/Monitor.jsx) and is
   scaled into a monitor that is sized to fit the viewport below the heading,
   stand included. Under 768px a portrait phone (os/Phone.jsx) replaces it.
   ════════════════════════════════════════════════════════════════════════════ */

const MAX_MONITOR = 1100
const MIN_MONITOR = 520
const GAP = 20            // heading → computer
const PAD_BOTTOM = 24

// total height of the monitor (incl. stand) per px of its width
const HEIGHT_PER_WIDTH = (monitorMetrics(1000).totalH + 10 * (1000 / 1100)) / 1000

export default function Products() {
  const sectionRef = useRef(null)
  const headRef = useRef(null)
  const boxRef = useRef(null)
  const [booted, setBooted] = useState(false)
  const [m, setM] = useState({ cw: 0, iw: 1440, ih: 900, headH: 0 })
  const reduced = prefersReducedMotion()

  useLayoutEffect(() => {
    const box = boxRef.current
    const head = headRef.current
    if (!box || !head) return
    const measure = () => setM({ cw: box.clientWidth, iw: window.innerWidth, ih: window.innerHeight, headH: head.offsetHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    ro.observe(head)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio > 0.2) setBooted(true) }, { threshold: [0, 0.2] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // everything (computer + stand) has to fit on screen below the heading
  const padTop = Math.max(72, Math.min(96, m.ih * 0.11))
  const availH = m.ih - padTop - m.headH - GAP - PAD_BOTTOM
  const phone = m.iw < 768

  let body = null
  if (m.cw > 0) {
    if (phone) {
      const s = Math.max(0.4, Math.min(1, m.cw / 412, availH / 822))
      body = <Phone scale={s} reduced={reduced} booted={booted} />
    } else {
      const width = Math.min(m.cw, MAX_MONITOR, Math.max(MIN_MONITOR, availH / HEIGHT_PER_WIDTH))
      body = <Monitor width={width} reduced={reduced} booted={booted} />
    }
  }

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-4 md:px-16 lg:px-24"
      style={{ paddingTop: padTop, paddingBottom: PAD_BOTTOM }}
    >
      <div ref={headRef} className="flex flex-col items-center">
        <h2 className="text-[max(2.5rem,min(13vw,10.5vh))] md:text-[max(2.5rem,min(10vw,10.5vh))] lg:text-[max(2.5rem,min(8vw,10.5vh))] leading-none font-black tracking-tighter text-ink select-none">
          Produc<span className="text-hollow">ts.</span>
        </h2>
        <p className="mt-3 font-mono text-xs md:text-sm text-muted text-center [@media(max-height:640px)]:hidden">
          Web apps I&apos;ve built, running on portfolio-os. {phone ? 'Tap' : 'Click'} one to launch it.
        </p>
      </div>

      <div ref={boxRef} className="w-full" style={{ marginTop: GAP }}>
        {body}
      </div>
    </section>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../utils/bus'
import Monitor from './os/Monitor'
import Phone from './os/Phone'

/* ════════════════════════════════════════════════════════════════════════════
   Products — portfolio-os.

   A small computer: each web app is an icon on its desktop. Clicking one
   launches a browser-style window (tab, address bar, loading bar) showing the
   product's page. Windows drag by their tab strip, stack, minimise to the
   taskbar, maximise and close (Esc closes the focused one).
   The Terminal icon opens the site's hidden terminal; README explains the OS.
   Terminal: `launch drivefetch` (or `open shifa`) opens a window from anywhere.

   Layout: the OS renders at a virtual 1024×640 (see os/Monitor.jsx) and the
   monitor is sized by width — min(1200px, the section's content width) — not
   by the viewport height, so on a short screen the page simply scrolls.
   "Full screen" turns the OS into a fixed overlay above the nav.
   Under 768px a portrait phone (os/Phone.jsx) replaces it, filling the width up to 420px.
   ════════════════════════════════════════════════════════════════════════════ */

const MAX_MONITOR = 1200
const MAX_PHONE = 420
const PHONE_FULL_W = 412 // outer width of the phone at scale 1 (390 screen + 2 × 11 bezel)

export default function Products() {
  const sectionRef = useRef(null)
  const boxRef = useRef(null)
  const [booted, setBooted] = useState(false)
  const [full, setFull] = useState(false)
  const [m, setM] = useState({ cw: 0, iw: 1440 })
  const reduced = prefersReducedMotion()

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => setM({ cw: box.clientWidth, iw: window.innerWidth })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBooted(true) }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const phone = m.iw < 768
  useEffect(() => { if (phone) setFull(false) }, [phone])

  let body = null
  if (m.cw > 0) {
    if (phone) {
      const s = Math.max(0.4, Math.min(1.1, Math.min(m.cw, MAX_PHONE) / PHONE_FULL_W))
      body = <Phone scale={s} reduced={reduced} booted={booted} />
    } else {
      body = <Monitor width={Math.min(m.cw, MAX_MONITOR)} reduced={reduced} booted={booted} full={full} onFullChange={setFull} />
    }
  }

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative w-full flex flex-col items-center px-4 md:px-8 lg:px-24 pt-24 pb-20"
      // above the nav (z-50) while the OS is full screen
      style={{ zIndex: full ? 60 : 10 }}
    >
      <div className="flex flex-col items-center">
        <h2 className="text-[13vw] md:text-[9vw] lg:text-[6.5vw] leading-none font-black tracking-tighter text-ink select-none">
          Produc<span className="text-hollow">ts.</span>
        </h2>
        <p className="mt-3 font-mono text-xs md:text-sm text-muted text-center">
          Web apps I&apos;ve built, running on portfolio-os. {phone ? 'Tap' : 'Click'} one to launch it.
        </p>
      </div>

      <div ref={boxRef} className="w-full mt-8">
        {body}
      </div>
    </section>
  )
}

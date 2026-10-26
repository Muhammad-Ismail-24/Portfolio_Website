import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../utils/bus'
import Monitor, { chromeHeight, monitorChrome } from './os/Monitor'
import Phone from './os/Phone'

/* ════════════════════════════════════════════════════════════════════════════
   Products — portfolio-os.

   A small computer: each web app is an icon on its desktop. Clicking one
   launches a browser-style window (tab, address bar, loading bar) showing the
   product's page. Windows drag by their tab strip, stack, minimise to the
   taskbar, maximise and close (Esc closes the focused one).
   The Terminal icon opens the site's hidden terminal; README explains the OS.
   Terminal: `launch drivefetch` (or `open shifa`) opens a window from anywhere.

   Layout: the section is one viewport tall (100svh) with its content centred.
   The monitor — bezel, chin and stand included — fits in what the heading
   leaves, so nothing scrolls. The OS renders at real pixels (no scaling): the
   screen is min(1100px, content width) wide and clamp(340, available, 640) tall.
   Below 650px of viewport height the stand is a slim base. "Full screen" turns
   the screen into a fixed overlay above the nav. Under 768px a portrait phone
   (os/Phone.jsx) replaces it, filling the width up to 420px.
   ════════════════════════════════════════════════════════════════════════════ */

const MAX_SCREEN_W = 1100
const MIN_SCREEN_H = 340
const MAX_SCREEN_H = 640
const MAX_PHONE = 420
const PHONE_FULL_W = 412 // outer width of the phone at scale 1 (390 screen + 2 × 11 bezel)

const NAV_CLEARANCE = 72   // the floating nav sits in the top 72px
const PAD_BOTTOM = 10
const GAP = 10             // subtitle → monitor

export default function Products() {
  const sectionRef = useRef(null)
  const headRef = useRef(null)
  const boxRef = useRef(null)
  const [booted, setBooted] = useState(false)
  const [full, setFull] = useState(false)
  const [m, setM] = useState({ cw: 0, iw: 1440, ih: 900, headH: 0 })
  const reduced = prefersReducedMotion()

  useLayoutEffect(() => {
    const box = boxRef.current
    const head = headRef.current
    if (!box || !head) return undefined
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
    if (!el) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setBooted(true) }, { threshold: 0.3 })
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
      const slim = m.ih < 650
      const c = monitorChrome(slim)
      const avail = m.ih - NAV_CLEARANCE - PAD_BOTTOM - m.headH - GAP - chromeHeight(c)
      const screenH = Math.round(Math.min(MAX_SCREEN_H, Math.max(MIN_SCREEN_H, avail)))
      const screenW = Math.round(Math.min(MAX_SCREEN_W, m.cw - 2 * c.bez))
      body = <Monitor screenW={screenW} screenH={screenH} slim={slim} reduced={reduced} booted={booted} full={full} onFullChange={setFull} />
    }
  }

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative w-full min-h-[100svh] flex flex-col items-center justify-center px-4 md:px-8 lg:px-24"
      // above the nav (z-50) while the OS is full screen
      style={{ zIndex: full ? 60 : 10, paddingTop: NAV_CLEARANCE, paddingBottom: PAD_BOTTOM }}
    >
      <div ref={headRef} className="flex flex-col items-center">
        <h2 className="text-[clamp(48px,min(7vw,11svh),96px)] leading-none font-black tracking-tighter text-ink select-none">
          Produc<span className="text-hollow">ts.</span>
        </h2>
        <p className="mt-1.5 font-mono text-xs md:text-sm text-muted text-center md:whitespace-nowrap">
          Web apps I&apos;ve built, running on portfolio-os. {phone ? 'Tap' : 'Click'} one to launch it.
        </p>
      </div>

      <div ref={boxRef} className="w-full" style={{ marginTop: GAP }}>
        {body}
      </div>
    </section>
  )
}

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import { useActiveSection } from '../../hooks/useActiveSection'
import { lockScroll, prefersReducedMotion, scrollToId, unlockScroll } from '../../utils/bus'
import ThemeToggle from '../ui/ThemeToggle'

/**
 * Navbar
 *   md and up: the frosted pill, top centre — links + theme toggle.
 *   phones:    a slim bar (monogram · theme · Menu) that opens a full-screen
 *              menu with big tap targets, in page order. Esc or a link closes it.
 * Both highlight the section you're reading.
 */

const PILL = ['Portfolio', 'About', 'Stack', 'Services', 'Contact']
// mobile menu: every section, in page order → [label, id]
const MENU = [['About', 'about'], ['Portfolio', 'portfolio'], ['Projects', 'projects'], ['Stack', 'stack'], ['Services', 'services'], ['Contact', 'contact']]
const ORDER = MENU.map(([, id]) => id)

const BAR = 'border border-[var(--color-nav-border)] bg-[var(--color-nav-bg)] backdrop-blur-md shadow-lg shadow-black/[0.03] dark:shadow-black/[0.2] dark:bg-[#162032]/70 dark:border-white/10 dark:text-white'

export default function Navbar() {
  const scrollToSection = useSmoothScroll()
  const active = useActiveSection(ORDER)

  return (
    <>
      {/* ── md+: the pill ─────────────────────────── */}
      <nav aria-label="Sections" className="hidden md:block fixed top-5 left-1/2 -translate-x-1/2 z-50">
        <div className={`flex items-center gap-1 px-2 py-2 rounded-full ${BAR}`}>
          {PILL.map((link) => {
            const id = link.toLowerCase()
            const on = active === id
            return (
              <a
                key={link}
                href={`#${id}`}
                onClick={(e) => scrollToSection(e, id)}
                aria-current={on ? 'true' : undefined}
                className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-200 ${
                  on ? 'bg-ink/[0.08] text-ink dark:bg-white/10' : 'text-ink/80 hover:text-ink hover:bg-ink/[0.06] dark:hover:bg-white/[0.08]'
                }`}
              >
                {link}
              </a>
            )
          })}
          <ThemeToggle className="ml-1" />
        </div>
      </nav>

      {/* ── phones: bar + full-screen menu ─────────── */}
      <MobileNav active={active} />
    </>
  )
}

function MobileNav({ active }) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef(null)
  const firstLinkRef = useRef(null)
  const reduced = prefersReducedMotion()

  // lock the page while the menu is up; Esc closes; focus moves in and back out
  useEffect(() => {
    if (!open) return undefined
    lockScroll('menu')
    const t = setTimeout(() => firstLinkRef.current?.focus({ preventScroll: true }), 60)
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      unlockScroll('menu')
      buttonRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  // the menu is phones-only: close it if the screen grows past md
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => { if (mq.matches) setOpen(false) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const go = (e, id) => {
    e.preventDefault()
    setOpen(false)
    // wait a frame so the scroll lock is released before gliding
    requestAnimationFrame(() => scrollToId(id))
  }

  return (
    <nav aria-label="Sections" className="md:hidden">
      <div className={`fixed top-3 left-3 right-3 z-[70] flex items-center justify-between h-14 pl-2 pr-1.5 rounded-full ${open ? 'border border-transparent' : BAR}`}>
        <a
          href="#top"
          onClick={(e) => go(e, 'top')}
          aria-label="Muhammad Ismail — back to top"
          className="h-11 px-3 flex items-center text-lg font-black tracking-tighter text-ink"
        >
          MI<span className="text-hollow">.</span>
        </a>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="h-11 pl-4 pr-3 flex items-center gap-2.5 rounded-full border-2 border-ink text-ink text-sm font-semibold active:bg-ink active:text-canvas transition-colors"
          >
            {open ? 'Close' : 'Menu'}
            <span aria-hidden="true" className="relative block w-4 h-3">
              <span className={`absolute left-0 right-0 h-[2px] bg-current transition-transform duration-200 ${open ? 'top-[5px] rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 right-0 h-[2px] bg-current transition-transform duration-200 ${open ? 'top-[5px] -rotate-45' : 'top-[10px]'}`} />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="mnav fixed inset-0 z-[65] flex flex-col bg-canvas pt-24 pb-[max(24px,env(safe-area-inset-bottom))] px-6 overflow-y-auto overscroll-contain"
            data-lenis-prevent
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
          >
            <ul className="m-0 p-0 list-none border-b-2 border-ink">
              {MENU.map(([label, id], i) => {
                const on = active === id
                return (
                  <li key={id} className="border-t-2 border-ink">
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={`#${id}`}
                      onClick={(e) => go(e, id)}
                      aria-current={on ? 'true' : undefined}
                      className="flex items-baseline gap-4 py-3.5 outline-none focus-visible:bg-ink/[0.06] active:bg-ink/[0.06]"
                    >
                      <span className="w-6 font-mono text-xs font-semibold text-muted">{String(i + 1).padStart(2, '0')}</span>
                      <span className={`text-[clamp(32px,10vw,44px)] font-black tracking-tighter leading-none ${on ? 'text-ink' : 'text-hollow'}`}>{label}</span>
                      {on && <span className="ml-auto self-center font-mono text-[11px] tracking-[0.18em] uppercase text-muted">here</span>}
                    </a>
                  </li>
                )
              })}
            </ul>
            <p className="mt-auto pt-8 font-mono text-xs tracking-[0.14em] uppercase text-muted">Muhammad Ismail · Portfolio</p>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

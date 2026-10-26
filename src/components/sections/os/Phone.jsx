import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { products, SITE_HOST } from '../../../data/products'
import { EVENTS, emit, on, scrollToId } from '../../../utils/bus'
import {
  AddressText, appTitle, Glyph, NotePage, ProductPage, ReloadPath, ToolButton, useClock, useLoading, Wordmark,
} from './parts'

/* ════════════════════════════════════════════════════════════════════════════
   Phone — portfolio-os on small screens (< 768px).

   A portrait phone with a fixed internal size of 390×800, scaled to fit.
   Home screen: 4-column icon grid. An app opens full-screen with a mobile
   browser address bar on top and a home indicator at the bottom.
   ════════════════════════════════════════════════════════════════════════════ */

export const PHONE_W = 390
export const PHONE_H = 800
const STATUS_H = 40
const HOME_H = 30

export function phoneMetrics(s) {
  const bez = Math.max(6, 11 * s)
  return { bez, width: PHONE_W * s + 2 * bez, height: PHONE_H * s + 2 * bez, radius: 40 * s + bez }
}

export default function Phone({ scale: s, reduced, booted }) {
  const m = phoneMetrics(s)
  const rootRef = useRef(null)
  const iconRefs = useRef({})
  const [app, setApp] = useState(null) // { id, from, nonce }
  const { time } = useClock()

  const open = useCallback((id) => {
    const icon = iconRefs.current[id]?.getBoundingClientRect()
    const box = rootRef.current?.getBoundingClientRect()
    const from = icon && box ? { x: (icon.left + icon.width / 2 - box.left) / s, y: (icon.top + icon.height / 2 - box.top) / s } : { x: PHONE_W / 2, y: PHONE_H / 2 }
    setApp({ id, from, nonce: 0 })
  }, [s])

  const close = useCallback(() => {
    setApp((a) => {
      if (a) requestAnimationFrame(() => iconRefs.current[a.id]?.focus({ preventScroll: true }))
      return null
    })
  }, [])

  // Terminal: `launch shifa`
  useEffect(() => on(EVENTS.launchApp, ({ id }) => {
    if (!products.some((p) => p.id === id) && id !== 'readme') return
    scrollToId('portfolio')
    setTimeout(() => open(id), 700)
  }), [open])

  const icons = [
    ...products.map((p) => ({ id: p.id, label: appTitle(p), glyph: p.glyph, onOpen: () => open(p.id) })),
    { id: 'terminal', label: 'Terminal', glyph: 'terminal', onOpen: () => emit(EVENTS.openTerminal) },
    { id: 'readme', label: 'README', glyph: 'note', onOpen: () => open('readme') },
  ]

  return (
    <div className="os-mon relative mx-auto" style={{ width: m.width, height: m.height }}>
      <div className="os-mon-body" style={{ width: m.width, height: m.height, borderRadius: m.radius, padding: m.bez }}>
        <div className="os-screen" style={{ width: PHONE_W * s, height: PHONE_H * s, borderRadius: m.radius - m.bez }}>
          <div ref={rootRef} className={`os-root text-ink ${booted ? 'is-booted' : ''}`} style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${s})` }} role="group" aria-label="portfolio-os phone">
            {/* home screen */}
            <div className="os-wall absolute inset-0">
              <Wordmark className="absolute -right-24 bottom-24 text-ink/[0.07] pointer-events-none -rotate-90 origin-bottom-right" size={120} />
              <ul className="os-phone-icons">
                {icons.map((ic, i) => (
                  <li key={ic.id} className="os-icon-li" style={{ '--d': `${120 + i * 80}ms` }}>
                    <button
                      ref={(el) => (iconRefs.current[ic.id] = el)}
                      type="button"
                      onClick={ic.onOpen}
                      className="os-icon group flex flex-col items-center gap-2 w-[82px] py-1 outline-none"
                      aria-label={ic.id === 'terminal' ? 'Open the terminal' : ic.id === 'readme' ? 'Open README' : `Launch ${ic.label}`}
                    >
                      <span className="os-tile relative w-[60px] h-[60px] flex items-center justify-center border-2 border-ink rounded-[16px] bg-[var(--card-bg)] text-ink shadow-[3px_3px_0_0_var(--color-ink)] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.25)] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-[1px_1px_0_0_var(--color-ink)] transition-all duration-150">
                        <Glyph name={ic.glyph} size={28} />
                      </span>
                      <span className="text-[12px] font-semibold text-ink leading-tight text-center group-focus-visible:bg-ink group-focus-visible:text-canvas px-1">{ic.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p aria-hidden="true" className="os-hint absolute left-0 right-0 font-mono text-[13px] tracking-[0.2em] uppercase text-muted text-center" style={{ bottom: HOME_H + 48 }}>tap an app to open it</p>
            </div>

            {/* an app, full screen */}
            <AnimatePresence>
              {app && (
                <AppScreen
                  key={app.id}
                  app={app}
                  reduced={reduced}
                  onClose={close}
                  onReload={() => setApp((a) => (a ? { ...a, nonce: a.nonce + 1 } : a))}
                />
              )}
            </AnimatePresence>

            {/* status bar (always on top) */}
            <div className="absolute left-0 right-0 top-0 z-50 flex items-center justify-between px-6 font-mono text-[13px] font-semibold text-ink pointer-events-none" style={{ height: STATUS_H }}>
              <span aria-label="Local time">{time}</span>
              <span className="absolute left-1/2 -translate-x-1/2 top-[9px] h-[22px] w-[88px] rounded-full bg-[var(--mon-body)]" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5" aria-hidden="true">
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" /><rect x="5" y="5" width="3" height="7" /><rect x="10" y="2" width="3" height="10" /><rect x="15" y="0" width="3" height="12" opacity="0.35" /></svg>
                <svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="0.75" y="0.75" width="21" height="10.5" rx="2.5" /><rect x="3" y="3" width="13" height="6" fill="currentColor" stroke="none" /><path d="M24 4v4" strokeLinecap="round" /></svg>
              </span>
            </div>

            {/* home indicator */}
            <button
              type="button"
              onClick={close}
              disabled={!app}
              aria-label="Go home"
              className="absolute left-0 right-0 bottom-0 z-50 flex items-center justify-center disabled:pointer-events-none"
              style={{ height: HOME_H }}
            >
              <span className="block h-[5px] w-[120px] rounded-full bg-ink/80" />
            </button>
          </div>
          <div className="os-glare" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

function AppScreen({ app, reduced, onClose, onReload }) {
  const product = products.find((p) => p.id === app.id)
  const title = appTitle(product)
  const ref = useRef(null)
  const loading = useLoading(app.nonce, reduced)

  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector('[data-win-title]')?.focus({ preventScroll: true }), reduced ? 0 : 260)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={`${title} app`}
      aria-modal="false"
      className="os-app absolute inset-0 z-40 flex flex-col bg-[var(--card-bg)]"
      style={{ transformOrigin: `${app.from.x}px ${app.from.y}px`, paddingTop: STATUS_H, paddingBottom: HOME_H }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.15, borderRadius: 40 }}
      animate={{ opacity: 1, scale: 1, borderRadius: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 340, damping: 32 }}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }}
    >
      {/* mobile browser bar */}
      <div className="relative flex items-center gap-2 px-3 h-[52px] border-b-2 border-ink shrink-0">
        <button type="button" onClick={onClose} aria-label="Close app" className="w-10 h-10 shrink-0 flex items-center justify-center border-2 border-ink rounded-full text-ink active:bg-ink active:text-canvas transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12" /></svg>
        </button>
        {product ? (
          <>
            <div className="flex-1 min-w-0 flex items-center gap-2 h-9 px-3 rounded-full border border-ink/40 bg-ink/[0.04]" aria-label={`https://${SITE_HOST}/products/${product.id}`}>
              <AddressText product={product} short />
            </div>
            <ToolButton label="Reload page" onClick={onReload}><ReloadPath /></ToolButton>
            {loading && <span key={app.nonce} className="os-loadbar absolute left-0 -bottom-[2px] h-[3px] bg-ink" aria-hidden="true" />}
          </>
        ) : (
          <span className="flex-1 truncate font-mono text-[13px] font-semibold text-ink">{title}</span>
        )}
        <span data-win-title tabIndex={-1} className="sr-only">{title}</span>
      </div>

      {product ? <ProductPage product={product} nonce={app.nonce} loading={loading} reduced={reduced} compact /> : <NotePage />}
    </motion.div>
  )
}

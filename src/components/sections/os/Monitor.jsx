import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import { products } from '../../../data/products'
import { EVENTS, emit, lockScroll, on, scrollToId, unlockScroll } from '../../../utils/bus'
import {
  AddressText, appTitle, Glyph, LockIcon, NotePage, ProductPage, README, ReloadPath, ToolButton, useClock, useLoading, Wordmark,
} from './parts'

/* ════════════════════════════════════════════════════════════════════════════
   Monitor — portfolio-os on a desktop screen.

   The OS lays out at a "virtual resolution" of 1024×640 (16:10) and is scaled
   to the monitor with transform: scale(s). The monitor is sized by width
   (min(1200px, the section's content width)), so s lands near 1 and the UI
   renders at about 1:1. All window maths (open position, size, dragging,
   clamping) is done in OS pixels; pointer deltas are divided by the live scale.

   Full screen: the same DOM turns into a fixed overlay, so open windows keep
   their state. The OS is re-scaled to fit the viewport and its virtual size
   grows to the viewport's aspect ratio, so there are no letterbox bars.
   ════════════════════════════════════════════════════════════════════════════ */

export const OS_W = 1024
export const OS_H = 640
const BAR_H = 32               // menu bar
const TASK_H = 44              // taskbar
const ICON_H = 92
const FULL_PAD = 6             // ink frame in full screen: 2px border + this padding

/** Monitor dimensions for a given outer width (all in CSS px; the bezel scales with the monitor). */
export function monitorMetrics(width) {
  const k = width / 1100
  const bez = Math.max(5, 14 * k)
  const chin = 30 * k
  const screenW = width - 2 * bez
  const screenH = screenW / (OS_W / OS_H)
  const neckH = 40 * k
  const baseH = 14 * k
  return { k, bez, chin, screenW, screenH, neckH, baseH, s: screenW / OS_W, bodyH: bez + screenH + chin, totalH: bez + screenH + chin + neckH + baseH }
}

export default function Monitor({ width, reduced, booted, full, onFullChange }) {
  const m = monitorMetrics(width)
  const outerRef = useRef(null)
  const bodyRef = useRef(null)
  const [box, setBox] = useState({ w: 0, h: 0 })

  // Scroll-in: the monitor grows 0.9 → 1 and the stand fades in as the section arrives
  const { scrollYProgress } = useScroll({ target: outerRef, offset: ['start end', 'start 0.4'] })
  const inScale = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0.9, 1])
  const standOpacity = useTransform(scrollYProgress, [0.3, 1], [reduced ? 1 : 0, 1])

  // Full screen: lock page scroll, Esc exits, follow the overlay's size
  useLayoutEffect(() => {
    if (!full) return undefined
    const el = bodyRef.current
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [full])

  useEffect(() => {
    if (!full) return undefined
    lockScroll('os-full')
    // a focused window or the terminal handles its own Esc first (they stop it / preventDefault)
    const onKey = (e) => { if (e.key === 'Escape' && !e.defaultPrevented) onFullChange(false) }
    window.addEventListener('keydown', onKey)
    const off = on(EVENTS.exitFullscreen, () => { unlockScroll('os-full'); onFullChange(false) })
    return () => { window.removeEventListener('keydown', onKey); off(); unlockScroll('os-full') }
  }, [full, onFullChange])

  const fw = Math.max(1, (box.w || window.innerWidth) - 2 * FULL_PAD)
  const fh = Math.max(1, (box.h || window.innerHeight) - 2 * FULL_PAD)
  const fullScale = Math.min(fw / OS_W, fh / OS_H)

  const scale = full ? fullScale : m.s
  const osW = full ? fw / fullScale : OS_W
  const osH = full ? fh / fullScale : OS_H

  const bodyStyle = full
    ? { position: 'fixed', inset: 0, zIndex: 1, padding: FULL_PAD, border: '2px solid var(--color-ink)', borderRadius: 0, scale: 1 }
    : { width, height: m.bodyH, borderRadius: 18 * m.k, padding: `${m.bez}px ${m.bez}px 0`, scale: inScale, transformOrigin: '50% 100%' }

  return (
    <div ref={outerRef} className="os-mon relative mx-auto" style={{ width, height: m.totalH + 10 * m.k }}>
      {/* body */}
      <motion.div ref={bodyRef} className="os-mon-body relative" style={bodyStyle} data-lenis-prevent={full ? '' : undefined}>
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/25" style={{ top: m.bez * 0.38, width: Math.max(3, 4 * m.k), height: Math.max(3, 4 * m.k), display: full ? 'none' : undefined }} aria-hidden="true" />
        <div className="os-screen" style={{ width: full ? fw : m.screenW, height: full ? fh : m.screenH, borderRadius: full ? 0 : Math.max(3, 6 * m.k) }}>
          <div className="os-root" style={{ width: osW, height: osH, transform: `scale(${scale})` }}>
            <Desktop scale={scale} osW={osW} osH={osH} reduced={reduced} booted={booted} full={full} onToggleFull={() => onFullChange(!full)} />
          </div>
          <div className="os-glare" aria-hidden="true" />
        </div>
        {!full && (
          <div className="flex items-center justify-center font-mono uppercase text-white/45" style={{ height: m.chin, fontSize: Math.max(5, 10 * m.k), letterSpacing: '0.24em' }} aria-hidden="true">
            portfolio-os
          </div>
        )}
      </motion.div>
      {/* stand */}
      <motion.div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: m.bodyH - 1, opacity: standOpacity }} aria-hidden="true">
        <div className="os-mon-stand" style={{ width: 150 * m.k, height: m.neckH + 1, clipPath: 'polygon(16% 0, 84% 0, 100% 100%, 0 100%)' }} />
        <div className="os-mon-stand os-mon-base" style={{ width: 320 * m.k, height: m.baseH, borderRadius: `${8 * m.k}px ${8 * m.k}px ${3 * m.k}px ${3 * m.k}px`, boxShadow: `${8 * m.k}px ${8 * m.k}px 0 0 var(--mon-shadow)` }} />
      </motion.div>
    </div>
  )
}

/* ── The desktop (1024×640 in the monitor, viewport-shaped in full screen) ── */
function Desktop({ scale, osW, osH, reduced, booted, full, onToggleFull }) {
  const AREA_W = osW
  const AREA_H = osH - BAR_H - TASK_H
  const ICON_ROWS = Math.max(1, Math.floor((AREA_H - 32) / (ICON_H + 8)))
  const areaRef = useRef(null)
  const iconRefs = useRef({})
  const [wins, setWins] = useState([]) // { id, kind, x, y, w, h, max, min, z, nonce, from }
  const zTop = useRef(10)
  const { time, date } = useClock()

  const size = (kind) => (kind === 'note' ? { w: 400, h: 280 } : { w: 720, h: 470 })

  // the real OS-pixel → screen-pixel ratio right now (the monitor can be mid scroll-in)
  const liveScale = useCallback(() => {
    const r = areaRef.current?.getBoundingClientRect()
    return r && r.width ? r.width / AREA_W : scale
  }, [AREA_W, scale])

  // the area changes size when full screen is toggled: pull windows back inside it
  useEffect(() => {
    setWins((ws) => ws.map((w) => {
      const x = Math.max(0, Math.min(AREA_W - w.w, w.x))
      const y = Math.max(0, Math.min(AREA_H - w.h, w.y))
      return x === w.x && y === w.y ? w : { ...w, x, y }
    }))
  }, [AREA_W, AREA_H])

  const focus = useCallback((id) => {
    zTop.current += 1
    const z = zTop.current
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z, min: false } : w)))
  }, [])

  const launch = useCallback((id) => {
    zTop.current += 1
    const z = zTop.current
    setWins((ws) => {
      const existing = ws.find((w) => w.id === id)
      if (existing) return ws.map((w) => (w.id === id ? { ...w, z, min: false } : w))
      const kind = id === 'readme' ? 'note' : 'app'
      const { w, h } = size(kind)
      const k = ws.length % 4 // cascade, then start over
      const x = Math.max(0, Math.min(AREA_W - w, 150 + k * 36))
      const y = Math.max(0, Math.min(AREA_H - h, 18 + k * 30))
      // where the window grows from: the icon's centre, in window-local OS pixels
      const icon = iconRefs.current[id]?.getBoundingClientRect()
      const box = areaRef.current?.getBoundingClientRect()
      const ls = liveScale()
      const from = icon && box
        ? { x: (icon.left + icon.width / 2 - box.left) / ls - x, y: (icon.top + icon.height / 2 - box.top) / ls - y }
        : { x: w / 2, y: h / 2 }
      return [...ws, { id, kind, x, y, w, h, max: false, min: false, z, nonce: 0, from }]
    })
  }, [AREA_W, AREA_H, liveScale])

  const close = useCallback((id) => {
    setWins((ws) => ws.filter((w) => w.id !== id))
    requestAnimationFrame(() => iconRefs.current[id]?.focus({ preventScroll: true }))
  }, [])
  const patch = useCallback((id, p) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...(typeof p === 'function' ? p(w) : p) } : w))), [])

  // Terminal: `launch shifa`
  useEffect(() => on(EVENTS.launchApp, ({ id }) => {
    if (!products.some((p) => p.id === id) && id !== 'readme') return
    scrollToId('portfolio')
    setTimeout(() => launch(id), 700)
  }), [launch])

  const topId = wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0]?.id ?? null

  const icons = [
    ...products.map((p) => ({ id: p.id, label: appTitle(p), glyph: p.glyph, onOpen: () => launch(p.id) })),
    { id: 'terminal', label: 'Terminal', glyph: 'terminal', onOpen: () => emit(EVENTS.openTerminal) },
    { id: 'readme', label: 'README.txt', glyph: 'note', onOpen: () => launch('readme') },
  ]

  return (
    <div className={`absolute inset-0 flex flex-col text-ink ${booted ? 'is-booted' : ''}`} role="group" aria-label="portfolio-os desktop">
      {/* menu bar */}
      <div className="flex items-center justify-between px-4 bg-ink text-canvas font-mono text-[12px] tracking-[0.16em] uppercase shrink-0" style={{ height: BAR_H }}>
        <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 bg-canvas" aria-hidden="true" /> portfolio-os</span>
        <span className="inline-flex items-center gap-5">
          <span>{products.length} apps</span>
          <span aria-hidden="true" className="opacity-40">|</span>
          <span>{date}</span>
          <span aria-label="Local time">{time}</span>
          <button
            type="button"
            onClick={onToggleFull}
            aria-pressed={full}
            className="ml-1 -mr-1 h-6 px-2 inline-flex items-center gap-1.5 border border-canvas/60 uppercase tracking-[0.16em] hover:bg-canvas hover:text-ink transition-colors outline-none focus-visible:bg-canvas focus-visible:text-ink"
          >
            <span aria-hidden="true">{full ? '⤡' : '⤢'}</span>
            <span>{full ? 'Exit full screen' : 'Full screen'}</span>
          </button>
        </span>
      </div>

      {/* desktop area */}
      <div ref={areaRef} className="os-area os-wall relative" style={{ width: AREA_W, height: AREA_H }}>
        <Wordmark className="absolute right-8 bottom-6 text-ink/[0.08] pointer-events-none" size={150} />

        <ul className="os-icons" style={{ gridTemplateRows: `repeat(${ICON_ROWS}, ${ICON_H}px)` }}>
          {icons.map((ic, i) => (
            <li key={ic.id} className="os-icon-li" style={{ '--d': `${120 + i * 90}ms` }}>
              <button
                ref={(el) => (iconRefs.current[ic.id] = el)}
                type="button"
                onClick={ic.onOpen}
                className="os-icon group flex flex-col items-center gap-2 w-[104px] h-[92px] py-0.5 outline-none"
                aria-label={ic.id === 'terminal' ? 'Open the terminal' : ic.id === 'readme' ? 'Open README' : `Launch ${ic.label}`}
              >
                <span className="os-tile relative w-[64px] h-[64px] shrink-0 flex items-center justify-center border-2 border-ink bg-[var(--card-bg)] text-ink shadow-[4px_4px_0_0_var(--color-ink)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.25)] transition-all duration-200 group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-[6px_6px_0_0_var(--color-ink)] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-[1px_1px_0_0_var(--color-ink)]">
                  <Glyph name={ic.glyph} />
                  {wins.some((w) => w.id === ic.id) && <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ink" aria-hidden="true" />}
                </span>
                <span className="text-[13px] font-semibold text-ink px-1.5 leading-tight group-focus-visible:bg-ink group-focus-visible:text-canvas">{ic.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {wins.length === 0 && (
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pl-32 pointer-events-none">
            <p className="os-hint font-mono text-sm tracking-[0.2em] uppercase text-muted">← click an app to launch it</p>
          </div>
        )}

        <AnimatePresence>
          {wins.map((w) => (
            <OsWindow
              key={w.id}
              win={w}
              areaW={AREA_W}
              areaH={AREA_H}
              getScale={liveScale}
              reduced={reduced}
              active={topId === w.id}
              onFocus={() => focus(w.id)}
              onClose={() => close(w.id)}
              onPatch={(p) => patch(w.id, p)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* taskbar */}
      <div className="flex items-center gap-2 px-2 border-t-2 border-ink shrink-0 overflow-hidden" style={{ height: TASK_H }}>
        {wins.length === 0 && <span className="px-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted">no windows open</span>}
        {wins.map((w) => {
          const p = products.find((x) => x.id === w.id)
          const isTop = topId === w.id
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => (isTop ? patch(w.id, { min: true }) : focus(w.id))}
              aria-pressed={isTop}
              className={`shrink-0 inline-flex items-center gap-2 h-8 px-3 border-2 border-ink text-sm font-semibold transition-colors ${
                isTop ? 'bg-ink text-canvas' : w.min ? 'text-ink/60 border-dashed' : 'text-ink hover:bg-ink/[0.06]'
              }`}
            >
              <span className="w-4 h-4 inline-flex"><Glyph name={p ? p.glyph : 'note'} small /></span>
              {appTitle(p)}
            </button>
          )
        })}
        <span className="ml-auto inline-flex items-center gap-2 pr-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted shrink-0">
          {full && <><kbd className="px-1.5 border border-ink/50 text-ink">Esc</kbd> exit full screen <span aria-hidden="true" className="opacity-40">|</span></>}
          <kbd className="px-1.5 border border-ink/50 text-ink">/</kbd> terminal
        </span>
      </div>
    </div>
  )
}

/* ── A window ─────────────────────────────────────────────────────────────── */
function OsWindow({ win, areaW, areaH, getScale, reduced, active, onFocus, onClose, onPatch }) {
  const product = products.find((p) => p.id === win.id)
  const drag = useRef(null)
  const ref = useRef(null)
  const title = appTitle(product)

  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector('[data-win-title]')?.focus({ preventScroll: true }), reduced ? 0 : 260)
    return () => clearTimeout(t)
  }, [reduced])

  const onPointerDown = (e) => {
    onFocus()
    if (win.max || e.button !== 0 || e.target.closest('button, a')) return
    drag.current = { sx: e.clientX, sy: e.clientY, x: win.x, y: win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    // pointer deltas are screen px; the desktop is scaled by the live scale
    const scale = getScale()
    const x = Math.max(0, Math.min(areaW - win.w, d.x + (e.clientX - d.sx) / scale))
    const y = Math.max(0, Math.min(areaH - win.h, d.y + (e.clientY - d.sy) / scale))
    onPatch({ x, y })
  }
  const endDrag = () => { drag.current = null }

  const box = win.max ? { left: 0, top: 0, width: '100%', height: '100%' } : { left: win.x, top: win.y, width: win.w, height: win.h }

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={`${title} window`}
      aria-modal="false"
      className={`os-window absolute flex flex-col border-2 border-ink bg-[var(--card-bg)] overflow-hidden ${win.max ? '' : 'rounded-lg'} ${
        active ? 'shadow-[8px_8px_0_0_var(--color-ink)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]' : 'shadow-[4px_4px_0_0_rgb(var(--ink-rgb)/0.35)]'
      } ${win.min ? 'pointer-events-none' : ''}`}
      style={{ ...box, zIndex: win.z, transformOrigin: `${win.from.x}px ${win.from.y}px` }}
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.2 }}
      animate={win.min ? { opacity: 0, scale: reduced ? 1 : 0.85, y: reduced ? 0 : 40 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.16 } }}
      transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 30 }}
      onPointerDownCapture={onFocus}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }}
      aria-hidden={win.min}
      inert={win.min ? '' : undefined}
    >
      {/* tab strip = title bar (drag handle) */}
      <div
        className={`flex items-end gap-2 h-11 pl-2 pr-1.5 pt-1.5 border-b-2 border-ink bg-ink/[0.07] select-none shrink-0 ${win.max ? '' : 'cursor-grab active:cursor-grabbing'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => { if (!e.target.closest('button, a')) onPatch((w) => ({ max: !w.max })) }}
        style={{ touchAction: win.max ? 'auto' : 'none' }}
      >
        <div className="relative -mb-[2px] flex items-center gap-2 h-full max-w-[60%] pl-3 pr-1.5 border-2 border-b-0 border-ink rounded-t-md bg-[var(--card-bg)]">
          <span className="w-4 h-4 inline-flex text-ink shrink-0"><Glyph name={product ? product.glyph : 'note'} small /></span>
          <span data-win-title tabIndex={-1} className="truncate text-sm font-semibold text-ink outline-none">{product ? `${title} — ${product.subtitle}` : title}</span>
          <button type="button" onClick={onClose} aria-label={`Close ${title} tab`} className="ml-1 w-6 h-6 shrink-0 flex items-center justify-center rounded text-ink/70 hover:text-ink hover:bg-ink/10">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" /></svg>
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1 self-center">
          <WinButton label="Minimise" onClick={() => onPatch({ min: true })}><path d="M2 8h8" /></WinButton>
          <WinButton label={win.max ? 'Restore' : 'Maximise'} onClick={() => onPatch((w) => ({ max: !w.max }))}>
            {win.max ? <path d="M3.5 1.5h7v7M1.5 3.5h7v7h-7z" /> : <path d="M1.5 1.5h9v9h-9z" />}
          </WinButton>
          <WinButton label="Close" onClick={onClose}><path d="M2 2l8 8M10 2l-8 8" /></WinButton>
        </div>
      </div>

      {product ? <BrowserBody product={product} nonce={win.nonce} reduced={reduced} onReload={() => onPatch((w) => ({ nonce: w.nonce + 1 }))} /> : <NotePage />}
    </motion.div>
  )
}

function WinButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-8 h-8 flex items-center justify-center border-2 border-ink text-ink hover:bg-ink hover:text-canvas transition-colors"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{children}</svg>
    </button>
  )
}

/* browser chrome (toolbar + loading bar) around the product page */
function BrowserBody({ product, nonce, reduced, onReload }) {
  const loading = useLoading(nonce, reduced)
  return (
    <>
      <div className="relative flex items-center gap-1.5 h-11 px-2 border-b-2 border-ink shrink-0">
        <ToolButton label="Back" disabled><path d="M8 2L3 7l5 5" /></ToolButton>
        <ToolButton label="Forward" disabled><path d="M5 2l5 5-5 5" /></ToolButton>
        <ToolButton label="Reload page" onClick={onReload}><ReloadPath /></ToolButton>
        <div className="flex-1 min-w-0 flex items-center gap-2 h-8 px-3 ml-1 rounded-full border border-ink/40 bg-ink/[0.04]">
          <LockIcon />
          <AddressText product={product} />
        </div>
        <a href={product.live} className="inline-flex items-center h-8 px-3 ml-1 border-2 border-ink text-xs font-semibold text-ink hover:bg-ink hover:text-canvas transition-colors whitespace-nowrap">
          Open ↗
        </a>
        {loading && <span key={nonce} className="os-loadbar absolute left-0 -bottom-[2px] h-[3px] bg-ink" aria-hidden="true" />}
      </div>
      <ProductPage product={product} nonce={nonce} loading={loading} reduced={reduced} />
    </>
  )
}

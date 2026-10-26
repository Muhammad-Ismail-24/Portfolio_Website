import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { products } from '../../../data/products'
import { EVENTS, emit, on, scrollToId } from '../../../utils/bus'
import {
  AddressText, appTitle, Glyph, LockIcon, NotePage, ProductPage, README, ReloadPath, ToolButton, useClock, useLoading, Wordmark,
} from './parts'

/* ════════════════════════════════════════════════════════════════════════════
   Monitor — portfolio-os on a desktop screen.

   The OS always lays out at a fixed 1280×800 "virtual resolution" and is scaled
   to the monitor with transform: scale(s). All window maths (open position,
   size, dragging, clamping) is done in that 1280×800 space; pointer deltas are
   divided by s while dragging.
   ════════════════════════════════════════════════════════════════════════════ */

export const OS_W = 1280
export const OS_H = 800
const BAR_H = 32               // menu bar
const TASK_H = 44              // taskbar
const AREA_W = OS_W
const AREA_H = OS_H - BAR_H - TASK_H
const ICON_H = 100
const ICON_ROWS = Math.floor((AREA_H - 32) / (ICON_H + 8))

/** Monitor dimensions for a given outer width (all in CSS px; the bezel scales with the monitor). */
export function monitorMetrics(width) {
  const k = width / 1100
  const bez = Math.max(5, 14 * k)
  const chin = 30 * k
  const screenW = width - 2 * bez
  const screenH = screenW / 1.6
  const neckH = 40 * k
  const baseH = 14 * k
  return { k, bez, chin, screenW, screenH, neckH, baseH, s: screenW / OS_W, bodyH: bez + screenH + chin, totalH: bez + screenH + chin + neckH + baseH }
}

export default function Monitor({ width, reduced, booted }) {
  const m = monitorMetrics(width)
  return (
    <div className="os-mon relative mx-auto" style={{ width, height: m.totalH + 10 * m.k }}>
      {/* body */}
      <div
        className="os-mon-body relative"
        style={{ width, height: m.bodyH, borderRadius: 18 * m.k, padding: `${m.bez}px ${m.bez}px 0` }}
      >
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-white/25" style={{ top: m.bez * 0.38, width: Math.max(3, 4 * m.k), height: Math.max(3, 4 * m.k) }} aria-hidden="true" />
        <div className="os-screen" style={{ width: m.screenW, height: m.screenH, borderRadius: Math.max(3, 6 * m.k) }}>
          <div className="os-root" style={{ width: OS_W, height: OS_H, transform: `scale(${m.s})` }}>
            <Desktop scale={m.s} reduced={reduced} booted={booted} />
          </div>
          <div className="os-glare" aria-hidden="true" />
        </div>
        <div className="flex items-center justify-center font-mono uppercase text-white/45" style={{ height: m.chin, fontSize: Math.max(5, 10 * m.k), letterSpacing: '0.24em' }} aria-hidden="true">
          portfolio-os
        </div>
      </div>
      {/* stand */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ top: m.bodyH - 1 }} aria-hidden="true">
        <div className="os-mon-stand" style={{ width: 150 * m.k, height: m.neckH + 1, clipPath: 'polygon(16% 0, 84% 0, 100% 100%, 0 100%)' }} />
        <div className="os-mon-stand os-mon-base" style={{ width: 320 * m.k, height: m.baseH, borderRadius: `${8 * m.k}px ${8 * m.k}px ${3 * m.k}px ${3 * m.k}px`, boxShadow: `${8 * m.k}px ${8 * m.k}px 0 0 var(--mon-shadow)` }} />
      </div>
    </div>
  )
}

/* ── The desktop (always 1280×800) ───────────────────────────────────────── */
function Desktop({ scale, reduced, booted }) {
  const areaRef = useRef(null)
  const iconRefs = useRef({})
  const [wins, setWins] = useState([]) // { id, kind, x, y, w, h, max, min, z, nonce, from }
  const zTop = useRef(10)
  const { time, date } = useClock()

  const size = (kind) => (kind === 'note' ? { w: 420, h: 290 } : { w: 760, h: 500 })

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
      const k = ws.length
      const x = Math.max(0, Math.min(AREA_W - w, 200 + k * 34))
      const y = Math.max(0, Math.min(AREA_H - h, 24 + k * 30))
      // where the window grows from: the icon's centre, in window-local OS pixels
      const icon = iconRefs.current[id]?.getBoundingClientRect()
      const box = areaRef.current?.getBoundingClientRect()
      const from = icon && box
        ? { x: (icon.left + icon.width / 2 - box.left) / scale - x, y: (icon.top + icon.height / 2 - box.top) / scale - y }
        : { x: w / 2, y: h / 2 }
      return [...ws, { id, kind, x, y, w, h, max: false, min: false, z, nonce: 0, from }]
    })
  }, [scale])

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
                className="os-icon group flex flex-col items-center gap-2 w-[104px] h-[100px] py-1 outline-none"
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
              scale={scale}
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
          <kbd className="px-1.5 border border-ink/50 text-ink">/</kbd> terminal
        </span>
      </div>
    </div>
  )
}

/* ── A window ─────────────────────────────────────────────────────────────── */
function OsWindow({ win, scale, reduced, active, onFocus, onClose, onPatch }) {
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
    // pointer deltas are screen px; the desktop is scaled by `scale`
    const x = Math.max(0, Math.min(AREA_W - win.w, d.x + (e.clientX - d.sx) / scale))
    const y = Math.max(0, Math.min(AREA_H - win.h, d.y + (e.clientY - d.sy) / scale))
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

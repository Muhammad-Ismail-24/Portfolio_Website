import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { products, SITE_HOST } from '../../data/products'
import { EVENTS, emit, on, prefersReducedMotion, scrollToId } from '../../utils/bus'

/* ════════════════════════════════════════════════════════════════════════════
   Products — portfolio-os.

   A small desktop: each web app is an icon. Clicking one launches a
   browser-style window (tab, address bar, loading bar) showing that
   product's page. Windows drag by their tab strip, stack, minimise to the
   taskbar, maximise, and close (Esc closes the focused one).
   The Terminal icon opens the site's hidden terminal; README explains the OS.
   On narrow screens windows open full-size, like a phone.
   Terminal: `launch drivefetch` (or `open shifa`) opens a window from anywhere.
   ════════════════════════════════════════════════════════════════════════════ */

const README = {
  id: 'readme',
  kind: 'note',
  title: 'README.txt',
  lines: [
    'Welcome to portfolio-os.',
    '',
    'Each icon is one of my web apps. Click one to launch it in a browser window.',
    'Drag windows by their tab bar. Double-click it to maximise.',
    'The taskbar at the bottom brings minimised windows back.',
    '',
    'Press / anywhere on the site for the terminal.',
  ],
}

const pad = (n) => String(n).padStart(2, '0')

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000)
    return () => clearInterval(t)
  }, [])
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export default function Products() {
  const sectionRef = useRef(null)
  const areaRef = useRef(null)
  const iconRefs = useRef({})
  const [area, setArea] = useState({ w: 0, h: 0 })
  const [wins, setWins] = useState([]) // { id, x, y, max, min, z, nonce, from }
  const [booted, setBooted] = useState(false)
  const zTop = useRef(10)
  const clock = useClock()
  const reduced = prefersReducedMotion()
  const compact = area.w > 0 && area.w < 640

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setArea({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio > 0.3) setBooted(true) }, { threshold: [0, 0.3] })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const size = useCallback((kind) => {
    if (kind === 'note') return { w: Math.min(420, area.w - 32), h: Math.min(290, area.h - 32) }
    return { w: Math.min(760, area.w - 40), h: Math.min(500, area.h - 32) }
  }, [area.w, area.h])

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
      const x = Math.max(8, Math.min(area.w - w - 8, (area.w - w) / 2 + 40 + k * 34 - 60))
      const y = Math.max(8, Math.min(area.h - h - 8, 18 + k * 30))
      // where the window grows from: the icon's centre, relative to the window
      const icon = iconRefs.current[id]?.getBoundingClientRect()
      const box = areaRef.current?.getBoundingClientRect()
      const from = icon && box ? { x: icon.left + icon.width / 2 - box.left - x, y: icon.top + icon.height / 2 - box.top - y } : { x: w / 2, y: h / 2 }
      return [...ws, { id, kind, x, y, w, h, max: false, min: false, z, nonce: 0, from }]
    })
  }, [area.w, area.h, size])

  const close = useCallback((id) => {
    setWins((ws) => ws.filter((w) => w.id !== id))
    requestAnimationFrame(() => iconRefs.current[id]?.focus({ preventScroll: true }))
  }, [])
  const patch = useCallback((id, p) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...(typeof p === 'function' ? p(w) : p) } : w))), [])

  // keep windows inside the desktop when it resizes
  useEffect(() => {
    if (!area.w) return
    setWins((ws) => ws.map((w) => {
      const s = size(w.kind)
      return { ...w, w: s.w, h: s.h, x: Math.max(0, Math.min(w.x, area.w - s.w)), y: Math.max(0, Math.min(w.y, area.h - s.h)) }
    }))
  }, [area.w, area.h, size])

  // Terminal: `launch shifa`
  useEffect(() => on(EVENTS.launchApp, ({ id }) => {
    if (!products.some((p) => p.id === id) && id !== 'readme') return
    setBooted(true)
    scrollToId('portfolio')
    setTimeout(() => launch(id), 700)
  }), [launch])

  const topId = wins.filter((w) => !w.min).sort((a, b) => b.z - a.z)[0]?.id ?? null

  const icons = [
    ...products.map((p) => ({ id: p.id, label: `${p.word1}${p.word2}`, glyph: p.glyph, onOpen: () => launch(p.id) })),
    { id: 'terminal', label: 'Terminal', glyph: 'terminal', onOpen: () => emit(EVENTS.openTerminal) },
    { id: 'readme', label: 'README.txt', glyph: 'note', onOpen: () => launch('readme') },
  ]

  return (
    <section
      id="portfolio"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-12 px-4 md:px-16 lg:px-24"
    >
      <h2 className="text-[13vw] md:text-[10vw] lg:text-[8vw] leading-none font-black tracking-tighter text-[#0A0A0A] dark:text-white select-none">
        Produc<span className="text-hollow">ts.</span>
      </h2>
      <p className="mt-3 font-mono text-xs md:text-sm text-muted text-center">
        Web apps I&apos;ve built, running on portfolio-os. Click one to launch it.
      </p>

      {/* ── The machine ───────────────────── */}
      <div className={`os-desktop relative mt-8 w-full max-w-6xl flex flex-col border-2 border-ink rounded-xl overflow-hidden bg-[#F4EFE6]/80 dark:bg-[#080A17]/80 shadow-[10px_10px_0_0_var(--color-ink)] dark:shadow-[10px_10px_0_0_rgba(255,255,255,0.16)] ${booted ? 'is-booted' : ''}`}>
        {/* menu bar */}
        <div className="flex items-center justify-between h-9 px-3 bg-ink text-canvas font-mono text-[11px] tracking-[0.16em] uppercase shrink-0">
          <span className="inline-flex items-center gap-2"><span className="w-2.5 h-2.5 bg-canvas" aria-hidden="true" /> portfolio-os</span>
          <span className="inline-flex items-center gap-4">
            <span className="hidden sm:inline">{products.length} apps</span>
            <span aria-label="Local time">{clock}</span>
          </span>
        </div>

        {/* desktop area */}
        <div ref={areaRef} className="os-area relative h-[560px] md:h-[min(68vh,600px)] md:min-h-[520px]">
          {/* icons */}
          <ul className={`absolute z-[1] p-4 md:p-6 grid gap-x-3 gap-y-5 ${compact ? 'grid-cols-3 left-0 right-0 top-0' : 'grid-cols-1 left-0 top-0'}`}>
            {icons.map((ic, i) => (
              <li key={ic.id} className="os-icon-li" style={{ '--d': `${120 + i * 90}ms` }}>
                <button
                  ref={(el) => (iconRefs.current[ic.id] = el)}
                  type="button"
                  onClick={ic.onOpen}
                  className="os-icon group flex flex-col items-center gap-2 w-[96px] mx-auto py-1 outline-none"
                  aria-label={ic.id === 'terminal' ? 'Open the terminal' : ic.id === 'readme' ? 'Open README' : `Launch ${ic.label}`}
                >
                  <span className="os-tile relative w-[64px] h-[64px] flex items-center justify-center border-2 border-ink bg-[#F4EFE6] dark:bg-[#080A17] text-ink shadow-[4px_4px_0_0_var(--color-ink)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.25)] transition-all duration-200 group-hover:-translate-x-[2px] group-hover:-translate-y-[2px] group-hover:shadow-[6px_6px_0_0_var(--color-ink)] group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:shadow-[1px_1px_0_0_var(--color-ink)]">
                    <Glyph name={ic.glyph} />
                    {wins.some((w) => w.id === ic.id) && <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-ink" aria-hidden="true" />}
                  </span>
                  <span className="text-[13px] font-semibold text-ink px-1.5 group-focus-visible:bg-ink group-focus-visible:text-canvas">{ic.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* empty-desktop hint */}
          {wins.length === 0 && (
            <div aria-hidden="true" className="absolute inset-0 flex items-end md:items-center justify-center pb-16 md:pb-0 md:pl-32 pointer-events-none">
              <p className="os-hint font-mono text-xs md:text-sm tracking-[0.2em] uppercase text-muted text-center">
                ← click an app to launch it
              </p>
            </div>
          )}

          {/* windows */}
          <AnimatePresence>
            {wins.map((w) => (
              <OsWindow
                key={w.id}
                win={w}
                area={area}
                compact={compact}
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
        <div className="flex items-center gap-2 h-12 px-2 border-t-2 border-ink shrink-0 overflow-x-auto no-scrollbar">
          {wins.length === 0 && <span className="px-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted">no windows open</span>}
          {wins.map((w) => {
            const p = products.find((x) => x.id === w.id)
            const label = p ? `${p.word1}${p.word2}` : README.title
            const isTop = topId === w.id
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => (isTop ? patch(w.id, { min: true }) : focus(w.id))}
                aria-pressed={isTop}
                className={`shrink-0 inline-flex items-center gap-2 h-9 px-3 border-2 border-ink text-sm font-semibold transition-colors ${
                  isTop ? 'bg-ink text-canvas' : w.min ? 'text-ink/60 border-dashed' : 'text-ink hover:bg-ink/[0.06]'
                }`}
              >
                <span className="w-4 h-4 inline-flex"><Glyph name={p ? p.glyph : 'note'} small /></span>
                {label}
              </button>
            )
          })}
          <span className="ml-auto hidden md:inline-flex items-center gap-2 pr-2 font-mono text-[11px] tracking-[0.16em] uppercase text-muted shrink-0">
            <kbd className="px-1.5 border border-ink/50 text-ink">/</kbd> terminal
          </span>
        </div>
      </div>
    </section>
  )
}

/* ── A window ─────────────────────────────────────────────────────────────── */
function OsWindow({ win, area, compact, reduced, active, onFocus, onClose, onPatch }) {
  const product = products.find((p) => p.id === win.id)
  const drag = useRef(null)
  const ref = useRef(null)
  const full = win.max || compact

  useEffect(() => {
    const t = setTimeout(() => ref.current?.querySelector('[data-win-title]')?.focus({ preventScroll: true }), reduced ? 0 : 260)
    return () => clearTimeout(t)
  }, [reduced])

  const onPointerDown = (e) => {
    onFocus()
    if (full || e.button !== 0 || e.target.closest('button, a')) return
    drag.current = { sx: e.clientX, sy: e.clientY, x: win.x, y: win.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    // stay fully inside the desktop (same rule as the resize clamp above)
    const x = Math.max(0, Math.min(area.w - win.w, d.x + e.clientX - d.sx))
    const y = Math.max(0, Math.min(area.h - win.h, d.y + e.clientY - d.sy))
    onPatch({ x, y })
  }
  const endDrag = () => { drag.current = null }

  const box = full ? { left: 0, top: 0, width: '100%', height: '100%' } : { left: win.x, top: win.y, width: win.w, height: win.h }
  const title = product ? `${product.word1}${product.word2}` : README.title

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={`${title} window`}
      aria-modal="false"
      className={`os-window absolute flex flex-col border-2 border-ink bg-[#F4EFE6] dark:bg-[#080A17] overflow-hidden ${full ? '' : 'rounded-lg'} ${
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
        className={`flex items-end gap-2 h-11 pl-2 pr-1.5 pt-1.5 border-b-2 border-ink bg-ink/[0.07] select-none shrink-0 ${full ? '' : 'cursor-grab active:cursor-grabbing'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => { if (!compact && !e.target.closest('button, a')) onPatch((w) => ({ max: !w.max })) }}
        style={{ touchAction: full ? 'auto' : 'none' }}
      >
        <div className="relative -mb-[2px] flex items-center gap-2 h-full max-w-[60%] pl-3 pr-1.5 border-2 border-b-0 border-ink rounded-t-md bg-[#F4EFE6] dark:bg-[#080A17]">
          <span className="w-4 h-4 inline-flex text-ink shrink-0"><Glyph name={product ? product.glyph : 'note'} small /></span>
          <span data-win-title tabIndex={-1} className="truncate text-sm font-semibold text-ink outline-none">{product ? `${title} — ${product.subtitle}` : title}</span>
          <button type="button" onClick={onClose} aria-label={`Close ${title} tab`} className="ml-1 w-6 h-6 shrink-0 flex items-center justify-center rounded text-ink/70 hover:text-ink hover:bg-ink/10">
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" /></svg>
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1 self-center">
          <WinButton label="Minimise" onClick={() => onPatch({ min: true })}><path d="M2 8h8" /></WinButton>
          {!compact && (
            <WinButton label={win.max ? 'Restore' : 'Maximise'} onClick={() => onPatch((w) => ({ max: !w.max }))}>
              {win.max ? <path d="M3.5 1.5h7v7M1.5 3.5h7v7h-7z" /> : <path d="M1.5 1.5h9v9h-9z" />}
            </WinButton>
          )}
          <WinButton label="Close" onClick={onClose}><path d="M2 2l8 8M10 2l-8 8" /></WinButton>
        </div>
      </div>

      {product ? <BrowserPage product={product} nonce={win.nonce} reduced={reduced} onReload={() => onPatch((w) => ({ nonce: w.nonce + 1 }))} /> : <NotePage />}
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

/* ── The product's page, inside browser chrome ───────────────────────────── */
function BrowserPage({ product, nonce, reduced, onReload }) {
  const [loading, setLoading] = useState(!reduced)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    if (reduced) return
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [nonce, reduced])

  return (
    <>
      {/* toolbar */}
      <div className="relative flex items-center gap-1.5 h-11 px-2 border-b-2 border-ink shrink-0">
        <ToolButton label="Back" disabled><path d="M8 2L3 7l5 5" /></ToolButton>
        <ToolButton label="Forward" disabled><path d="M5 2l5 5-5 5" /></ToolButton>
        <ToolButton label="Reload page" onClick={onReload}><path d="M11.5 6.5A4.5 4.5 0 1 1 9.8 3M11.5 1.5V4H9" /></ToolButton>
        <div className="flex-1 min-w-0 flex items-center gap-2 h-8 px-3 ml-1 rounded-full border border-ink/40 bg-ink/[0.04]">
          <svg width="11" height="12" viewBox="0 0 11 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/70 shrink-0" aria-hidden="true"><rect x="1" y="5" width="9" height="6.5" rx="1" /><path d="M3 5V3.5a2.5 2.5 0 0 1 5 0V5" /></svg>
          <span className="truncate font-mono text-[12px] text-ink/80">
            <span className="text-muted">https://</span>{SITE_HOST}<span className="text-ink font-semibold">/products/{product.id}</span>
          </span>
        </div>
        <a href={product.live} className="hidden sm:inline-flex items-center h-8 px-3 ml-1 border-2 border-ink text-xs font-semibold text-ink hover:bg-ink hover:text-canvas transition-colors whitespace-nowrap">
          Open ↗
        </a>
        {loading && <span key={nonce} className="os-loadbar absolute left-0 -bottom-[2px] h-[3px] bg-ink" aria-hidden="true" />}
      </div>

      {/* page */}
      <div className="flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        <motion.div
          key={nonce}
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={loading ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-5 md:p-8 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6 lg:gap-8 items-start"
        >
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{product.subtitle}</p>
            <h3 className="mt-2 flex flex-wrap gap-x-2 font-black text-5xl md:text-6xl tracking-tighter leading-[0.9] text-ink uppercase">
              <span>{product.word1}</span>
              <span className="text-hollow">{product.word2}</span>
            </h3>
            <p className="mt-5 text-base leading-relaxed font-medium text-[#555555] dark:text-[#A0ABC0]">{product.description}</p>
            {product.stack?.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Built with">
                {product.stack.map((s) => <li key={s} className="px-2.5 py-1 border border-ink text-xs font-semibold text-ink">{s}</li>)}
              </ul>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={product.live} className="inline-flex items-center gap-2 px-5 min-h-[44px] bg-ink text-canvas border-2 border-ink font-semibold text-sm hover:opacity-80 transition-opacity">
                Live Deployment <span aria-hidden="true">→</span>
              </a>
              <a href={product.demo} className="inline-flex items-center px-5 min-h-[44px] border-2 border-ink text-ink font-semibold text-sm hover:bg-ink hover:text-canvas transition-colors">
                Video Demo
              </a>
            </div>
          </div>

          <div className="pn-preview relative w-full aspect-[16/10] rounded-lg overflow-hidden border border-ink/25">
            {imgOk && <img src={product.image} alt={`${product.word1}${product.word2} screenshot`} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgOk(false)} />}
            {!imgOk && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted bg-[#F4EFE6] dark:bg-[#080A17] px-3 py-1 border border-ink/30">Screenshot coming soon</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}

function ToolButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-ink hover:bg-ink/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
    >
      <svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
    </button>
  )
}

function NotePage() {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-ink" data-lenis-prevent>
      {README.lines.map((l, i) => (
        <p key={i} className="flex">
          <span className="w-7 shrink-0 text-muted select-none" aria-hidden="true">{i + 1}</span>
          <span className="whitespace-pre-wrap">{l || '\u00a0'}</span>
        </p>
      ))}
    </div>
  )
}

/* ── Desktop glyphs (line icons in the site's stroke style) ──────────────── */
function Glyph({ name, small }) {
  const s = small ? 16 : 30
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: small ? 2 : 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  switch (name) {
    case 'search': // folder + magnifier
      return <svg {...common}><path d="M2.5 6.5V18a1.5 1.5 0 0 0 1.5 1.5h7M2.5 6.5V5A1.5 1.5 0 0 1 4 3.5h4.5l2 2.5H20A1.5 1.5 0 0 1 21.5 7.5V10" /><circle cx="16.5" cy="15.5" r="3.5" /><path d="M19 18l2.5 2.5" /></svg>
    case 'pulse': // heart-rate line in a rounded square
      return <svg {...common}><rect x="2.5" y="3.5" width="19" height="17" rx="3" /><path d="M5.5 12.5h3l2-4 3 8 2-4h3" /></svg>
    case 'sync': // branches syncing
      return <svg {...common}><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="12" r="2" /><path d="M6 7v10M6 9c0 3 4 3 10 3M18 14c0 3-4 5-10 5" /></svg>
    case 'terminal':
      return <svg {...common}><rect x="2.5" y="4" width="19" height="16" rx="1.5" /><path d="M6.5 9.5l3 2.5-3 2.5M12 15h5" /></svg>
    case 'note':
      return <svg {...common}><path d="M6 2.5h8l4 4V21.5H6z" /><path d="M14 2.5v4h4M9 11h6M9 14.5h6M9 18h4" /></svg>
    default:
      return null
  }
}

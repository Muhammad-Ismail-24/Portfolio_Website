import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { SITE_HOST } from '../../../data/products'

/* Shared pieces of portfolio-os: used by the monitor (desktop) and the phone. */

export const README = {
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

export function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 20_000)
    return () => clearInterval(t)
  }, [])
  return {
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
    date: now.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
  }
}

/** true for ~650ms after `nonce` changes (the page "loading" bar), never under reduced motion */
export function useLoading(nonce, reduced) {
  const [loading, setLoading] = useState(!reduced)
  useEffect(() => {
    if (reduced) return
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(t)
  }, [nonce, reduced])
  return loading
}

export const appTitle = (product) => (product ? `${product.word1}${product.word2}` : README.title)

/** `https://muhammadismail.is-a.dev/products/<id>` */
export function AddressText({ product, short }) {
  return (
    <span className={`truncate font-mono text-ink/80 ${short ? 'text-[11px]' : 'text-[12px]'}`}>
      {!short && <span className="text-muted">https://</span>}{SITE_HOST}<span className="text-ink font-semibold">/products/{product.id}</span>
    </span>
  )
}

export function LockIcon() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink/70 shrink-0" aria-hidden="true">
      <rect x="1" y="5" width="9" height="6.5" rx="1" /><path d="M3 5V3.5a2.5 2.5 0 0 1 5 0V5" />
    </svg>
  )
}

export function ToolButton({ label, onClick, disabled, children }) {
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

export const ReloadPath = () => <path d="M11.5 6.5A4.5 4.5 0 1 1 9.8 3M11.5 1.5V4H9" />

/** The product's page (name, copy, buttons, screenshot). Scrolls inside its own box. */
export function ProductPage({ product, nonce, loading, reduced, compact }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain" data-lenis-prevent>
      <motion.div
        key={nonce}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={loading ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${compact ? 'p-5 grid grid-cols-1 gap-6' : 'p-8 grid grid-cols-[1.05fr_1fr] gap-8'} items-start`}
      >
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{product.subtitle}</p>
          <h3 className={`mt-2 flex flex-wrap gap-x-2 font-black tracking-tighter leading-[0.9] text-ink uppercase ${compact ? 'text-5xl' : 'text-6xl'}`}>
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
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted bg-[var(--card-bg)] px-3 py-1 border border-ink/30">Screenshot coming soon</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function NotePage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed text-ink" data-lenis-prevent>
      {README.lines.map((l, i) => (
        <p key={i} className="flex">
          <span className="w-7 shrink-0 text-muted select-none" aria-hidden="true">{i + 1}</span>
          <span className="whitespace-pre-wrap">{l || ' '}</span>
        </p>
      ))}
    </div>
  )
}

/** Line icons in the site's stroke style */
export function Glyph({ name, small, size }) {
  const s = size ?? (small ? 16 : 30)
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

/** The faint outlined wordmark painted on the wallpaper */
export function Wordmark({ className = '', size = 168 }) {
  return (
    <svg className={className} width={size * 5.6} height={size * 1.1} viewBox="0 0 560 110" fill="none" aria-hidden="true">
      <text x="0" y="86" fontFamily="'Space Grotesk', system-ui, sans-serif" fontWeight="700" fontSize="100" letterSpacing="-4" stroke="currentColor" strokeWidth="1.5">portfolio-os</text>
    </svg>
  )
}

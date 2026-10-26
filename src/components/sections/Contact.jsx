import { useCallback, useEffect, useRef, useState } from 'react'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, LOCAL_PLACE, LOCAL_TZ, LOCAL_TZ_LABEL, RESUME_URL } from '../../data/site'

/* ════════════════════════════════════════════════════════════════════════════
   Contact — the email address is the hero. Click it to copy; the rows below
   are LinkedIn, GitHub and résumé. Contact details live in src/data/site.js.
   ════════════════════════════════════════════════════════════════════════════ */

const ICONS = {
  linkedin: (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  ),
  github: (
    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  resume: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2.5h8l4 4V21.5H6z" /><path d="M14 2.5v4h4M9 11h6M9 14.5h6M9 18h4" />
    </svg>
  ),
}

const LINKS = [
  { name: 'LinkedIn', hint: 'Let’s connect', href: LINKEDIN_URL, icon: ICONS.linkedin },
  { name: 'GitHub', hint: 'Code & projects', href: GITHUB_URL, icon: ICONS.github },
  { name: 'Résumé', hint: 'The one-pager', href: RESUME_URL, icon: ICONS.resume },
]

/** "7:22 PM" in the given zone, refreshed on the minute */
function useLocalTime() {
  const fmt = useRef(new Intl.DateTimeFormat('en-US', { timeZone: LOCAL_TZ, hour: 'numeric', minute: '2-digit' }))
  const [time, setTime] = useState(() => fmt.current.format(new Date()))
  useEffect(() => {
    let t
    const tick = () => {
      setTime(fmt.current.format(new Date()))
      t = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50) // next minute boundary
    }
    tick()
    return () => clearTimeout(t)
  }, [])
  return time
}

export default function Contact() {
  const time = useLocalTime()
  const emailRef = useRef(null)
  const timer = useRef(null)
  const [toast, setToast] = useState(null) // { text, ok }

  const [local, domain] = EMAIL.split(/(?=@)/) // "name" , "@domain.tld"
  const longest = Math.max(local.length, domain.length)

  const flash = useCallback((text, ok = true) => {
    setToast({ text, ok })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 2200)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      flash('Copied ✓')
      return
    } catch { /* fall through to the selection fallback */ }
    // Fallback: select the address so ⌘/Ctrl+C works, and try the legacy copy command
    const el = emailRef.current
    if (el) {
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    let ok = false
    try { ok = document.execCommand('copy') } catch { /* ignore */ }
    flash(ok ? 'Copied ✓' : 'Selected — press Ctrl/⌘+C', ok)
  }, [flash])

  return (
    <section id="contact" className="relative z-10 w-full min-h-screen flex flex-col justify-center pt-28 pb-20 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-7xl mx-auto">
        {/* Heading */}
        <div className="flex flex-row flex-wrap items-center gap-x-4 mb-8 lg:mb-10">
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">Get in</span>
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-hollow leading-none">Touch.</span>
        </div>

        <p className="text-lg lg:text-xl font-medium text-[#555555] dark:text-[#94A3B8] leading-snug max-w-lg">
          Whether you need to integrate autonomous multi-agent pipelines or engineer a robust full-stack application, I&apos;m ready to discuss how my expertise can bring your technical vision to life.
        </p>
        <p className="mt-4 font-mono text-xs md:text-sm text-muted">
          Local time in {LOCAL_PLACE} · <time aria-live="off">{time}</time> ({LOCAL_TZ_LABEL})
        </p>

        {/* The email is the hero */}
        <div className="relative mt-10 lg:mt-14" style={{ containerType: 'inline-size' }}>
          <button
            type="button"
            onClick={copy}
            className="ct-email group block w-full text-left cursor-copy outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-8 focus-visible:ring-offset-canvas rounded-sm"
            aria-label={`Copy email address ${EMAIL}`}
            style={{ '--n': longest }}
          >
            <span ref={emailRef} className="ct-email-text block font-black tracking-tighter leading-[0.95] text-ink">
              <span className="block">{local}</span>
              <span className="block ct-hollow">{domain}</span>
            </span>
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs tracking-[0.14em] uppercase text-muted">
            <span>Click the address to copy</span>
            <a href={`mailto:${EMAIL}`} className="text-ink underline underline-offset-4 decoration-ink/40 hover:decoration-ink min-h-[44px] inline-flex items-center">
              Open in mail app ↗
            </a>
          </div>

          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-none absolute left-0 -top-12 px-4 py-2 bg-ink text-canvas font-mono text-sm font-semibold tracking-wide shadow-[4px_4px_0_0_rgb(var(--ink-rgb)/0.3)] transition-all duration-200 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          >
            {toast?.text ?? ''}
          </div>
        </div>

        {/* LinkedIn · GitHub · Résumé */}
        <ul className="mt-10 lg:mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8">
          {LINKS.map((l) => (
            <li key={l.name}>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer"
                className="ct-link group flex items-center justify-between gap-4 w-full min-h-[84px] px-5 lg:px-6 py-4 border-2 border-ink bg-[var(--card-bg)] text-ink
                  shadow-[6px_6px_0_0_var(--color-ink)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.25)]
                  hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[8px_8px_0_0_var(--color-ink)] dark:hover:shadow-[8px_8px_0_0_rgba(255,255,255,0.3)]
                  active:translate-x-[4px] active:translate-y-[4px] active:shadow-[2px_2px_0_0_var(--color-ink)] dark:active:shadow-[2px_2px_0_0_rgba(255,255,255,0.25)]
                  transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
              >
                <span className="flex items-center gap-4 min-w-0">
                  <span className="w-8 h-8 shrink-0">{l.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-xl lg:text-2xl font-bold tracking-tight leading-tight">{l.name}</span>
                    <span className="block font-mono text-[11px] tracking-[0.14em] uppercase text-muted">{l.hint}</span>
                  </span>
                </span>
                <span className="w-10 h-10 shrink-0 rounded-full border-2 border-ink flex items-center justify-center group-hover:bg-ink group-hover:text-canvas transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7V16" />
                  </svg>
                </span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

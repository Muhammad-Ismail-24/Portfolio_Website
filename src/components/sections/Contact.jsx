import { useEffect, useRef, useState } from 'react'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, isSet } from '../../data/site'

/* ════════════════════════════════════════════════════════════════════════════
   Contact — the heading, one line, and a ruled list of links. Values come from
   src/data/site.js; any that are still unset are hidden, never shown.
   ════════════════════════════════════════════════════════════════════════════ */

const VALUE = 'ct-ulink text-[clamp(22px,4.2vw,40px)] font-bold tracking-tight leading-[1.15] break-words'
// value + actions: the full line on phones (label above), the rest of the row from md up
const GROUP = 'flex items-center min-w-0 basis-full md:basis-0 flex-1'
const LABEL = 'w-full md:w-36 mb-2 md:mb-0 shrink-0 font-mono text-[11px] md:text-xs tracking-[0.18em] uppercase text-muted'

/** "https://www.linkedin.com/in/name/" → "linkedin.com/in/name" */
const display = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

/** lets long values wrap after @ . / instead of mid-word on phones */
const breakable = (text) => text.split(/(?<=[@./])/).map((part, i) => <span key={i}>{i > 0 && <wbr />}{part}</span>)

function Arrow() {
  return <span aria-hidden="true" className="ct-arrow shrink-0 ml-4 text-2xl md:text-3xl font-bold text-ink">↗</span>
}

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const emailRef = useRef(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    let ok = false
    try { await navigator.clipboard.writeText(EMAIL); ok = true } catch { /* try the legacy path */ }
    if (!ok && emailRef.current) {
      const sel = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(emailRef.current)
      sel.removeAllRanges()
      sel.addRange(range)
      try { ok = document.execCommand('copy') } catch { /* ignore */ }
    }
    if (ok) {
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    }
  }

  const links = [
    isSet(LINKEDIN_URL) && { label: 'LinkedIn', href: LINKEDIN_URL },
    isSet(GITHUB_URL) && { label: 'GitHub', href: GITHUB_URL },
  ].filter(Boolean)

  return (
    <section id="contact" className="relative z-10 w-full flex flex-col justify-center pt-28 pb-16 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-7xl mx-auto">
        {/* Heading */}
        <div className="flex flex-row flex-wrap items-center gap-x-4">
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">Get in</span>
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-hollow leading-none">Touch.</span>
        </div>
        <p className="mt-5 text-lg lg:text-xl font-medium text-muted leading-snug">Have a project or a role in mind? Let&apos;s talk.</p>

        <ul className="mt-12 lg:mt-16 m-0 p-0 list-none border-b border-ink">
          {isSet(EMAIL) && (
            <li className="ct-row flex flex-wrap md:flex-nowrap items-center py-6 md:py-8 border-t border-ink">
              <span className={LABEL}>Email</span>
              <span className={GROUP}>
                <a ref={emailRef} href={`mailto:${EMAIL}`} className={`${VALUE} min-w-0 flex-1 outline-none`}>{breakable(EMAIL)}</a>
                <button
                  type="button"
                  onClick={copy}
                  aria-live="polite"
                  className="ml-4 min-h-[44px] shrink-0 font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink transition-colors"
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
                <Arrow />
              </span>
            </li>
          )}
          {links.map((l) => (
            <li key={l.label} className="border-t border-ink">
              <a href={l.href} target="_blank" rel="noreferrer" className="ct-row group flex flex-wrap md:flex-nowrap items-center py-6 md:py-8 outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas">
                <span className={LABEL}>{l.label}</span>
                <span className={GROUP}>
                  <span className={`${VALUE} min-w-0 flex-1`}>{breakable(display(l.href))}</span>
                  <Arrow />
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

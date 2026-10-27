import { useEffect, useRef, useState } from 'react'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, isSet } from '../../data/site'

/* ════════════════════════════════════════════════════════════════════════════
   Contact — the heading, one line, and a row of buttons (email, copy email,
   LinkedIn, GitHub). Buttons carry names, not addresses. Values come from
   src/data/site.js; any that are still unset are hidden, never shown.
   ════════════════════════════════════════════════════════════════════════════ */

const Arrow = () => <span aria-hidden="true" className="ct-arrow">↗</span>

/** Gmail's web compose window, addressed to me. A plain mailto: does nothing without a desktop mail app. */
const gmailCompose = (to) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent('Hello from your portfolio')}`

/** copies via the Clipboard API, falling back to a hidden textarea */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true } catch { /* try the legacy path */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { /* ignore */ }
  ta.remove()
  return ok
}

export default function Contact() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copy = async () => {
    if (!(await copyText(EMAIL))) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
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

        <div className="mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-5 lg:gap-6">
          {isSet(EMAIL) && (
            <>
              <a href={gmailCompose(EMAIL)} target="_blank" rel="noreferrer" className="ct-btn ct-btn-primary lg:min-w-[220px]" aria-label={`Email me at ${EMAIL}`}>
                Email me <Arrow />
                <span className="sr-only">(opens Gmail in a new tab)</span>
              </a>
              <button type="button" onClick={copy} aria-live="polite" className="ct-btn lg:min-w-[220px]">
                {copied ? 'Copied ✓' : 'Copy email'}
                <span aria-hidden="true" className="font-mono text-sm font-medium text-muted">{copied ? '' : '⧉'}</span>
              </button>
            </>
          )}
          {links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="ct-btn lg:min-w-[220px]">
              {l.label} <Arrow />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

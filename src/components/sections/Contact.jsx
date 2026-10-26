import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, LOCAL_PLACE, LOCAL_TZ, LOCAL_TZ_LABEL, LOCAL_UTC_OFFSET, RESUME_URL, isSet } from '../../data/site'

/* ════════════════════════════════════════════════════════════════════════════
   Contact — a calm form on the left, a quiet list of details on the right,
   and the name in giant outlined type to close the section.

   The form posts to Web3Forms (key in VITE_WEB3FORMS_KEY, see .env.local).
   With no key it opens a prefilled mailto instead. Contact details live in
   src/data/site.js; any that are still unset are hidden, never shown.
   ════════════════════════════════════════════════════════════════════════════ */

const WEB3FORMS_URL = 'https://api.web3forms.com/submit'
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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

const FIELD = 'block w-full bg-transparent border-0 border-b-2 border-ink rounded-none px-0 py-3 text-lg font-medium text-ink placeholder:text-muted/60 outline-none transition-shadow focus:shadow-[0_2px_0_0_var(--color-ink)] aria-[invalid=true]:border-[#B3261E] dark:aria-[invalid=true]:border-[#FF8A80]'
const LABEL = 'block font-mono text-[11px] tracking-[0.18em] uppercase text-muted'
const ERR = 'mt-2 font-mono text-[11px] tracking-[0.08em] text-[#B3261E] dark:text-[#FF8A80]'

export default function Contact() {
  return (
    <section id="contact" className="relative z-10 w-full flex flex-col justify-center pt-28 pb-14 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-7xl mx-auto">
        {/* Heading */}
        <div className="flex flex-row flex-wrap items-center gap-x-4">
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">Get in</span>
          <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-hollow leading-none">Touch.</span>
        </div>
        <p className="mt-5 text-lg lg:text-xl font-medium text-muted leading-snug">Have a project or a role in mind? Let&apos;s talk.</p>

        <div className="mt-12 lg:mt-16 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-14 lg:gap-24">
          <ContactForm />
          <Details />
        </div>

        <Signature />
      </div>
    </section>
  )
}

/* ── Left: the form ──────────────────────────────────────────────────────── */
function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | success | mailto | error
  const [errorText, setErrorText] = useState('')
  const [canRetry, setCanRetry] = useState(true)
  const honeypot = useRef(null)

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }))
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }))
  }

  const validate = () => {
    const er = {}
    if (!values.name.trim()) er.name = 'Please tell me your name.'
    if (!values.email.trim()) er.email = 'Please enter your email.'
    else if (!EMAIL_RE.test(values.email.trim())) er.email = 'That email doesn’t look right.'
    if (values.message.trim().length < 10) er.message = 'A few more words, please (at least 10 characters).'
    setErrors(er)
    if (er.name) document.getElementById('contact-name')?.focus()
    else if (er.email) document.getElementById('contact-email')?.focus()
    else if (er.message) document.getElementById('contact-message')?.focus()
    return Object.keys(er).length === 0
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (status === 'sending') return
    if (!validate()) return
    // honeypot: real people never fill it; pretend it worked
    if (honeypot.current?.checked) { setStatus('success'); return }

    const name = values.name.trim()
    const email = values.email.trim()
    const message = values.message.trim()

    if (!WEB3FORMS_KEY) {
      if (!isSet(EMAIL)) {
        setErrorText('Sending isn’t set up on this site yet.')
        setCanRetry(false)
        setStatus('error')
        return
      }
      const body = `${message}\n\n— ${name} (${email})`
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Message from ${name}`)}&body=${encodeURIComponent(body)}`
      setStatus('mailto')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Portfolio message from ${name}`,
          from_name: name,
          name,
          email,
          message,
          botcheck: '',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setValues({ name: '', email: '', message: '' })
        setStatus('success')
      } else {
        setErrorText(data.message || 'The message didn’t go through.')
        setCanRetry(true)
        setStatus('error')
      }
    } catch {
      setErrorText('Couldn’t reach the server. Check your connection and try again.')
      setCanRetry(true)
      setStatus('error')
    }
  }

  if (status === 'success' || status === 'mailto') {
    return (
      <div role="status" className="self-start">
        <p className="text-2xl lg:text-3xl font-bold tracking-tight text-ink leading-snug">
          {status === 'success' ? 'Thanks — I’ll get back to you soon.' : 'Your email app should open with the message ready to send.'}
        </p>
        <button
          type="button"
          onClick={() => { setStatus('idle'); setValues({ name: '', email: '', message: '' }) }}
          className="ct-ulink mt-6 min-h-[44px] pb-0.5 font-mono text-xs tracking-[0.14em] uppercase text-ink"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-8" aria-label="Contact form">
      <div>
        <label htmlFor="contact-name" className={LABEL}>Name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" value={values.name} onChange={set('name')} className={FIELD}
          aria-invalid={!!errors.name} aria-describedby={errors.name ? 'contact-name-err' : undefined} />
        {errors.name && <p id="contact-name-err" className={ERR}>{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="contact-email" className={LABEL}>Email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" value={values.email} onChange={set('email')} className={FIELD}
          aria-invalid={!!errors.email} aria-describedby={errors.email ? 'contact-email-err' : undefined} />
        {errors.email && <p id="contact-email-err" className={ERR}>{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="contact-message" className={LABEL}>Message</label>
        <textarea id="contact-message" name="message" rows={4} value={values.message} onChange={set('message')} className={`${FIELD} resize-y min-h-[120px]`}
          aria-invalid={!!errors.message} aria-describedby={errors.message ? 'contact-message-err' : undefined} />
        {errors.message && <p id="contact-message-err" className={ERR}>{errors.message}</p>}
      </div>

      {/* honeypot — hidden from people and assistive tech */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Leave this empty <input ref={honeypot} type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 px-8 min-h-[48px] bg-ink text-canvas border-2 border-ink font-semibold tracking-wide hover:opacity-80 disabled:opacity-60 disabled:cursor-wait transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
        >
          {status === 'sending' ? 'Sending…' : <>Send message <span aria-hidden="true">→</span></>}
        </button>

        {status === 'error' && (
          <p role="alert" className="font-mono text-xs tracking-[0.06em] text-[#B3261E] dark:text-[#FF8A80]">
            {errorText}{' '}
            {canRetry && <button type="button" onClick={submit} className="ct-ulink font-semibold text-ink pb-0.5 min-h-[44px]">Try again</button>}
          </p>
        )}
      </div>
    </form>
  )
}

/* ── Right: the details ──────────────────────────────────────────────────── */
function Row({ label, children }) {
  return (
    <div className="flex items-baseline gap-6 py-5 border-t border-ink/20 first:border-t-0 first:pt-0">
      <dt className={`${LABEL} w-28 shrink-0`}>{label}</dt>
      <dd className="m-0 min-w-0 text-base lg:text-lg font-medium text-ink">{children}</dd>
    </div>
  )
}

function Details() {
  const time = useLocalTime()
  const [copied, setCopied] = useState(false)
  const emailRef = useRef(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const hasEmail = isSet(EMAIL)
  const elsewhere = [
    isSet(LINKEDIN_URL) && { name: 'LinkedIn', href: LINKEDIN_URL },
    isSet(GITHUB_URL) && { name: 'GitHub', href: GITHUB_URL },
    isSet(RESUME_URL) && { name: 'Résumé', href: RESUME_URL },
  ].filter(Boolean)

  const copy = useCallback(async () => {
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
  }, [])

  return (
    <dl className="m-0 self-start w-full">
      {hasEmail && (
        <Row label="Email">
          <a ref={emailRef} href={`mailto:${EMAIL}`} className="underline underline-offset-4 decoration-2 break-all">{EMAIL}</a>
          <button
            type="button"
            onClick={copy}
            aria-live="polite"
            className="ml-3 min-h-[44px] font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-ink transition-colors"
          >
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
        </Row>
      )}
      <Row label="Based in">{LOCAL_PLACE} · {LOCAL_TZ_LABEL} ({LOCAL_UTC_OFFSET})</Row>
      <Row label="Local time"><time aria-live="off">{time}</time></Row>
      {elsewhere.length > 0 && (
        <Row label="Elsewhere">
          <ul className="m-0 p-0 list-none flex flex-wrap gap-x-6 gap-y-1">
            {elsewhere.map((l) => (
              <li key={l.name}>
                <a href={l.href} target="_blank" rel="noreferrer" className="ct-ulink inline-block py-1 pb-1.5 text-ink outline-none">
                  {l.name} <span aria-hidden="true">↗</span><span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </Row>
      )}
    </dl>
  )
}

/* ── The signature ───────────────────────────────────────────────────────── */
const SIGNATURE = 'MUHAMMAD ISMAIL'
const TRACKING = -0.03 // em

/** Giant outlined name, fitted to the content width, filled with ink left → right by scroll. */
function Signature() {
  const reduced = useReducedMotion()
  const boxRef = useRef(null)
  const measureRef = useRef(null)
  const [fs, setFs] = useState(0)

  // fit-text: measure the string at 100px, then scale to the box width
  useLayoutEffect(() => {
    const box = boxRef.current
    const probe = measureRef.current
    if (!box || !probe) return undefined
    const fit = () => {
      const w = probe.getBoundingClientRect().width // at 100px, trailing tracking included
      if (!w || !box.clientWidth) return
      // the last glyph overhangs its box by one tracking step; add it back so the ink ends flush
      const ratio = w / 100 - TRACKING
      setFs(box.clientWidth / ratio)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(box)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [])

  const { scrollYProgress } = useScroll({ target: boxRef, offset: ['start end', 'end 0.9'] })
  const clip = useTransform(scrollYProgress, (v) => `inset(0 ${(1 - Math.min(1, Math.max(0, v))) * 100}% 0 0)`)

  const style = { fontSize: fs || 100, letterSpacing: `${TRACKING}em`, visibility: fs ? 'visible' : 'hidden' }

  return (
    <div className="mt-20 lg:mt-28">
      <div ref={boxRef} className="relative w-full overflow-visible select-none" aria-hidden="true" style={{ height: fs ? fs * 0.9 : undefined }}>
        {/* hidden probe for measuring */}
        <span ref={measureRef} className="fixed font-black whitespace-nowrap invisible pointer-events-none" style={{ fontSize: 100, letterSpacing: `${TRACKING}em`, left: 0, top: 0 }}>{SIGNATURE}</span>
        <span className="ct-sig block font-black" style={style}>{SIGNATURE}</span>
        {!reduced && (
          <motion.span className="ct-sig-fill font-black" style={{ ...style, clipPath: clip }}>{SIGNATURE}</motion.span>
        )}
      </div>
      <p className="sr-only">Muhammad Ismail</p>
    </div>
  )
}

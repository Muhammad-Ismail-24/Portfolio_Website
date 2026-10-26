import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { projects } from '../../data/projects'
import { products } from '../../data/products'
import { skills } from '../../data/skills'
import { services } from '../../data/services'
import { getIsDark, setTheme } from '../../hooks/useTheme'
import { EVENTS, emit, lockScroll, on, prefersReducedMotion, scrollToId, unlockScroll } from '../../utils/bus'
import { AbortSession, runOnyx } from '../../onyx/session'

/* ════════════════════════════════════════════════════════════════════════════
   Terminal — a hidden command line for curious visitors.
   Open: "/" or Ctrl/⌘ + K (or the footer button). Close: Esc or `exit`.
   Tab completes, ↑ ↓ walk history. English is the default; every common
   command also has an Urdu alias (madad, kholo, chalao, jao, saaf, bahar, kaun,
   rang). `onyx` boots ONYX-16, a 16-bit VM with Urdu/English assembly
   (src/onyx).
   ════════════════════════════════════════════════════════════════════════════ */

const SECTIONS = {
  top: 'top', home: 'top', hero: 'top',
  about: 'about',
  products: 'portfolio', portfolio: 'portfolio',
  projects: 'projects', network: 'projects',
  desktop: 'portfolio', os: 'portfolio',
  stack: 'stack', capabilities: 'stack',
  services: 'services',
  contact: 'contact',
}

// English is primary; `urdu` is the alias shown dimmed in `help`
const COMMANDS = [
  { name: 'help', urdu: 'madad', desc: 'list commands' },
  { name: 'whoami', urdu: 'kaun', desc: 'who built this' },
  { name: 'ls', desc: 'list things (try: ls projects)' },
  { name: 'open', urdu: 'kholo', desc: 'open a project node — open 1 … open 5' },
  { name: 'launch', urdu: 'chalao', desc: 'launch a product app — launch drivefetch' },
  { name: 'onyx', urdu: 'chalao onyx', desc: 'boot my 16-bit VM (Urdu/English assembly)' },
  { name: 'goto', urdu: 'jao', desc: 'jump to a section — goto contact' },
  { name: 'stack', desc: 'tech I work with' },
  { name: 'services', desc: 'what I offer' },
  { name: 'theme', urdu: 'rang andhera | roshan', desc: 'theme light | dark | toggle' },
  { name: 'contact', desc: 'how to reach me' },
  { name: 'resume', desc: 'résumé' },
  { name: 'ping', desc: 'ping the network' },
  { name: 'history', desc: 'commands you ran' },
  { name: 'clear', urdu: 'saaf', desc: 'clear the screen' },
  { name: 'exit', urdu: 'bahar', desc: 'close the terminal' },
]

// Urdu word → the English command it stands for
const ALIASES = {
  madad: 'help', kholo: 'open', chalao: 'launch', jao: 'goto',
  saaf: 'clear', bahar: 'exit', kaun: 'whoami', rang: 'theme',
}
// Urdu argument → English argument (`rang andhera` = `theme dark`)
const ARG_ALIASES = { andhera: 'dark', roshan: 'light' }

const MAX_LINES = 3000

// one-tap commands shown on touch screens
const CHIPS = ['help', 'whoami', 'ls projects', 'stack', 'services', 'contact', 'onyx']

const line = (text, tone = 'out') => ({ text, tone, id: Math.random().toString(36).slice(2) })
const partsLine = (parts) => ({ parts, id: Math.random().toString(36).slice(2) })

function run(input, ctx) {
  const raw = input.trim()
  if (!raw) return []
  const [cmd, ...args] = raw.split(/\s+/)
  const c = ALIASES[cmd.toLowerCase()] ?? cmd.toLowerCase()
  let arg = args.join(' ').toLowerCase()
  if (c === 'theme') arg = ARG_ALIASES[arg] ?? arg

  switch (c) {
    case 'help':
    case '?':
      return [
        line('available commands:', 'dim'),
        ...COMMANDS.map((k) => partsLine([
          { t: `  ${k.name.padEnd(10)}` },
          { t: (k.urdu ?? '').padEnd(23), tone: 'dim' },
          { t: k.desc },
        ])),
      ]
    case 'whoami':
      return [line('Muhammad Ismail'), line('Architecting multi-agent AI. Shipping robust full-stack experiences.', 'dim')]
    case 'about':
      emit(EVENTS.exitFullscreen); ctx.close(); scrollToId('about'); return []
    case 'ls':
      if (!arg) return [line('projects/   products/   services.txt   stack.txt   contact.txt   resume.pdf')]
      if (arg.startsWith('project')) return projects.map((p, i) => line(`  ${String(i + 1).padStart(2, '0')}  ${p.title.padEnd(18)} ${p.blurb}`))
      if (arg.startsWith('product')) return [...products.map((p) => line(`  ${p.id.padEnd(12)} ${p.subtitle}`)), line('  → launch <name>', 'dim')]
      return [line(`ls: ${arg}: no such directory`, 'err')]
    case 'cat':
      if (arg.includes('stack')) return run('stack', ctx)
      if (arg.includes('service')) return run('services', ctx)
      if (arg.includes('contact')) return run('contact', ctx)
      if (arg.includes('resume')) return run('resume', ctx)
      return [line(`cat: ${arg || '(nothing)'}: no such file`, 'err')]
    case 'open':
    case 'cd': {
      if (c === 'cd' && SECTIONS[arg.replace(/\/$/, '')]) return run(`goto ${arg}`, ctx)
      if (products.some((p) => p.id === arg)) return run(`launch ${arg}`, ctx)
      const n = parseInt(arg, 10)
      let idx = Number.isFinite(n) ? n - 1 : projects.findIndex((p) => p.title.toLowerCase().includes(arg) || p.id.includes(arg))
      if (idx < 0 || idx >= projects.length || !arg) return [line(`usage: open <1-${projects.length}|name>`, 'err')]
      emit(EVENTS.exitFullscreen)
      ctx.close()
      emit(EVENTS.openProject, { index: idx })
      return [line(`opening node ${String(idx + 1).padStart(2, '0')} — ${projects[idx].title}`)]
    }
    case 'goto': {
      const id = SECTIONS[arg]
      if (!id) return [line(`goto: unknown section "${arg}". try: ${[...new Set(Object.values(SECTIONS))].join(', ')}`, 'err')]
      emit(EVENTS.exitFullscreen); ctx.close(); scrollToId(id); return []
    }
    case 'stack':
    case 'skills':
      return [
        ...Object.entries(skills).map(([key, g]) => partsLine([{ t: `  ${key.padEnd(11)}`, tone: 'dim' }, { t: g.items ? g.items.join(' · ') : g.text }])),
        line('  → goto stack', 'dim'),
      ]
    case 'services':
      return [...services.map((s, i) => line(`  ${i + 1}. ${s.title}`)), line('  → goto services', 'dim')]
    case 'onyx':
      ctx.onyx(); return []
    case 'launch':
    case 'start': {
      if (arg === 'onyx' || arg === 'onyx-16' || arg === 'onyx16') { ctx.onyx(); return [] }
      const p = products.find((x) => x.id === arg || `${x.word1}${x.word2}`.toLowerCase() === arg)
      if (!p) return [line(`usage: launch <${[...products.map((x) => x.id), 'onyx'].join('|')}>`, 'err')]
      ctx.close()
      emit(EVENTS.launchApp, { id: p.id })
      return [line(`launching ${p.word1}${p.word2}…`)]
    }
    case 'theme': {
      const want = arg === 'dark' ? true : arg === 'light' ? false : !getIsDark()
      setTheme(want)
      return [line(`theme → ${want ? 'dark' : 'light'}`)]
    }
    case 'contact':
      return [line('email · linkedin · github → see the contact section'), line('  → goto contact', 'dim')]
    case 'resume':
    case 'cv':
      return [line('résumé available on request — say hi via the contact section.'), line('  → goto contact', 'dim')]
    case 'ping': {
      const ms = 8 + Math.floor(Math.random() * 18)
      return [line(`PING portfolio.mesh: 30 nodes, ${projects.length} hubs`), line(`reply from node ${String(1 + Math.floor(Math.random() * 30)).padStart(2, '0')}: time=${ms}ms`)]
    }
    case 'history':
      return ctx.history.length ? ctx.history.map((h, i) => line(`  ${String(i + 1).padStart(3)}  ${h}`)) : [line('(empty)', 'dim')]
    case 'clear':
      ctx.clear(); return []
    case 'exit':
    case 'quit':
    case 'q':
      ctx.close(); return []
    case 'echo':
      return [line(args.join(' '))]
    case 'date':
      return [line(new Date().toString())]
    case 'sudo':
      return [line('nice try. this incident will be reported to the orchestrator.', 'err')]
    case 'rm':
      return [line('rm: the network is load-bearing. please don\'t.', 'err')]
    case 'hello':
    case 'hi':
      return [line('hey — type help to look around.')]
    default:
      return [line(`command not found: ${cmd}. type help`, 'err')]
  }
}

function complete(value) {
  const parts = value.split(/\s+/)
  if (parts.length <= 1) {
    const names = [...COMMANDS.map((k) => k.name), ...Object.keys(ALIASES)]
    const hits = names.filter((k) => k.startsWith(parts[0].toLowerCase()))
    return hits.length === 1 ? `${hits[0]} ` : null
  }
  const [word, partial] = [parts[0].toLowerCase(), (parts[1] || '').toLowerCase()]
  const cmd = ALIASES[word] ?? word
  const pool = cmd === 'goto' ? Object.keys(SECTIONS)
    : word === 'rang' ? ['andhera', 'roshan']
    : cmd === 'theme' ? ['light', 'dark', 'toggle']
    : cmd === 'ls' ? ['projects', 'products']
    : cmd === 'open' ? [...projects.map((p) => p.id), ...products.map((p) => p.id)]
    : cmd === 'launch' ? [...products.map((p) => p.id), 'onyx']
    : []
  const hits = pool.filter((k) => k.startsWith(partial))
  return hits.length === 1 ? `${word} ${hits[0]}` : null
}

const BOOT = [
  line('portfolio-os 1.0 — mesh online, 30 nodes linked', 'dim'),
  line('type help (madad) to see what you can do. esc to close.', 'dim'),
]

const TONES = {
  cmd: 'text-ink font-semibold mt-2',
  dim: 'text-muted',
  dbg: 'text-muted text-[12px]',
  strong: 'text-ink font-bold',
  err: 'text-[#B3261E] dark:text-[#FF8A80]',
  out: 'text-ink/90',
}
const toneClass = (tone) => TONES[tone] ?? TONES.out

/** the 16×32 phosphor display, drawn in the site's palette */
function OnyxDisplay({ rows }) {
  const text = rows.map((r) => r.replace(/[^\x20-\x7e]/g, ' '))
  const spoken = text.map((r) => r.trimEnd()).filter(Boolean).join(' / ')
  return (
    <div className="onyx-crt" role="img" aria-label={`ONYX display: ${spoken || 'blank'}`}>
      <div className="onyx-crt-head">PHOSPHOR CRT DISPLAY RENDER</div>
      <pre className="onyx-crt-screen" aria-hidden="true">{text.join('\n')}</pre>
    </div>
  )
}

export default function Terminal() {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState(BOOT)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const [prompt, setPrompt] = useState('$')
  const [viewH, setViewH] = useState(0) // visible height (shrinks when a phone keyboard opens)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const returnFocus = useRef(null)
  const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches
  const sessionRef = useRef(null) // the running ONYX session, if any
  const reduced = prefersReducedMotion()

  const show = useCallback(() => {
    returnFocus.current = document.activeElement
    setOpen(true)
  }, [])
  const close = useCallback(() => {
    // Restart Lenis now, not in the effect: `goto`/`about` call scrollTo right after
    // close(), and Lenis ignores scrollTo while stopped.
    unlockScroll('terminal')
    setOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus?.({ preventScroll: true }))
  }, [])

  const push = useCallback((ls) => setLines((l) => {
    const next = [...l, ...ls]
    return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
  }), [])

  /* ── ONYX-16 mode ───────────────────────────────────────────────────────── */
  const startOnyx = useCallback(() => {
    if (sessionRef.current) {
      push([line('onyx: a session is already running (Ctrl+C aborts it).', 'dim')])
      return
    }
    let pending = null
    const inbox = [] // lines typed ahead of the keyboard read, like a real keyboard buffer
    let aborted = false

    sessionRef.current = {
      answer(text) {
        if (pending) { const p = pending; pending = null; p.resolve(text) } else inbox.push(text)
      },
      abort() {
        aborted = true
        if (pending) { const p = pending; pending = null; p.reject(new AbortSession()) }
      },
    }
    const io = {
      print: push,
      aborted: () => aborted,
      sleep: (ms) => (reduced || !ms ? Promise.resolve() : new Promise((r) => setTimeout(r, ms))),
      ask: (label) => {
        setPrompt(label)
        if (aborted) return Promise.reject(new AbortSession())
        if (inbox.length) return Promise.resolve(inbox.shift())
        return new Promise((resolve, reject) => { pending = { resolve, reject } })
      },
    }

    setPrompt('onyx>')
    setTimeout(() => {
      runOnyx(io)
        .catch((err) => {
          if (err?.name === 'AbortSession') push([line('^C', 'cmd'), line('[ONYX] aborted. Back to the shell.', 'dim')])
          else push([line(`[ONYX] internal error: ${err?.message ?? err}`, 'err')])
        })
        .finally(() => {
          sessionRef.current = null
          setPrompt('$')
        })
    }, 0)
  }, [push, reduced])

  // Global shortcuts: "/" or Ctrl/⌘+K
  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]')
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => { if (!o) returnFocus.current = document.activeElement; return !o })
        return
      }
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        show()
      }
    }
    window.addEventListener('keydown', onKey)
    const off = on(EVENTS.openTerminal, show)
    return () => { window.removeEventListener('keydown', onKey); off() }
  }, [show])

  useEffect(() => {
    if (open) {
      lockScroll('terminal')
      // touch screens: don't throw the keyboard up on open — the chips work without it
      if (!touch) setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      unlockScroll('terminal')
    }
  }, [open, touch])

  // follow the visible viewport so the input stays above a phone keyboard
  useEffect(() => {
    const vv = window.visualViewport
    if (!open || !vv) return undefined
    const update = () => setViewH(vv.height)
    update()
    vv.addEventListener('resize', update)
    return () => vv.removeEventListener('resize', update)
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const submit = (e) => {
    e.preventDefault()
    exec(value)
  }

  const exec = (input) => {
    // inside ONYX the line belongs to the machine (menu choice, editor line or keyboard input)
    if (sessionRef.current) {
      push([line(`${prompt} ${input}`, 'cmd')])
      if (input.trim()) setHistory((h) => [...h, input.trim()])
      setValue('')
      setCursor(-1)
      sessionRef.current.answer(input)
      return
    }

    const echo = line(`$ ${input}`, 'cmd')
    const ctx = { close, clear: () => setLines([]), history, onyx: startOnyx }
    const out = run(input, ctx)
    if (input.trim().toLowerCase() !== 'clear' && input.trim().toLowerCase() !== 'saaf') push([echo, ...out])
    if (input.trim()) setHistory((h) => [...h, input.trim()])
    setValue('')
    setCursor(-1)
  }

  const onInputKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    if ((e.key === 'c' || e.key === 'C') && e.ctrlKey && sessionRef.current && !window.getSelection?.().toString()) {
      e.preventDefault()
      sessionRef.current.abort()
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (!sessionRef.current) {
        const c = complete(value)
        if (c) setValue(c)
      }
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const next = cursor === -1 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(next); setValue(history[next])
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (cursor === -1) return
      const next = cursor + 1
      if (next >= history.length) { setCursor(-1); setValue('') } else { setCursor(next); setValue(history[next]) }
    }
  }

  const inOnyx = prompt !== '$'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="terminal"
          className="fixed inset-0 z-[10000] flex items-start md:items-center justify-center p-3 pt-[max(12px,env(safe-area-inset-top))] md:p-8 bg-[#F5F3EC]/50 dark:bg-[#0A0F1E]/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.18 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Terminal"
            className="w-full max-w-[760px] h-[min(460px,70vh)] flex flex-col bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-ink rounded-xl shadow-[6px_6px_0_0_var(--color-ink)] md:shadow-[10px_10px_0_0_var(--color-ink)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.18)] md:dark:shadow-[10px_10px_0_0_rgba(255,255,255,0.18)] overflow-hidden font-mono"
            // phones: never taller than what's visible above the keyboard
            style={touch && viewH ? { height: Math.max(220, Math.min(460, viewH - 30)) } : undefined}
            initial={reduced ? false : { y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduced ? undefined : { y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => { if (!touch) inputRef.current?.focus() }}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-ink bg-ink text-canvas">
              <span className="text-xs tracking-[0.18em] uppercase">{inOnyx ? 'onyx-16 · lazarus machinae' : 'ismail@portfolio: ~'}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); close() }}
                className="text-xs tracking-[0.18em] uppercase px-2 -mr-2 min-h-[44px] md:min-h-[32px] hover:opacity-70"
                aria-label="Close terminal"
              >
                esc ✕
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-[13px] md:text-sm leading-relaxed" data-lenis-prevent>
              {lines.map((l) => (l.kind === 'display' ? (
                <OnyxDisplay key={l.id} rows={l.rows} />
              ) : (
                <div key={l.id} className={`whitespace-pre-wrap break-words ${l.parts ? '' : toneClass(l.tone)}`}>
                  {l.parts
                    ? l.parts.map((p, i) => <span key={i} className={p.tone ? toneClass(p.tone) : 'text-ink/90'}>{p.t}</span>)
                    : (l.text || ' ')}
                </div>
              )))}
            </div>

            {/* touch screens: one-tap commands, so nobody has to type on a phone keyboard */}
            {touch && !inOnyx && (
              <div className="flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-t-2 border-ink" data-lenis-prevent>
                {CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); exec(c) }}
                    className="shrink-0 h-9 px-3 border-2 border-ink rounded-full text-[13px] font-semibold text-ink active:bg-ink active:text-canvas"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t-2 border-ink">
              <label htmlFor="term-input" className="text-ink font-semibold shrink-0 whitespace-pre" aria-label="Command">{prompt}</label>
              <input
                id="term-input"
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); setCursor(-1) }}
                onKeyDown={onInputKey}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                // 16px on phones so iOS doesn't zoom the page when the input is focused
                className="flex-1 min-w-0 bg-transparent outline-none text-ink text-base md:text-sm caret-ink placeholder:text-muted"
                placeholder={inOnyx ? 'help · madad · exit · bahar' : 'type help (madad)'}
              />
              <span className="hidden md:inline text-[11px] text-muted">{inOnyx ? 'ctrl+c aborts' : 'tab ↹ · ↑↓'}</span>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

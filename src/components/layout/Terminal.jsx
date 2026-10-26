import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { projects } from '../../data/projects'
import { products } from '../../data/products'
import { getIsDark, setTheme } from '../../hooks/useTheme'
import { EVENTS, emit, on, prefersReducedMotion, scrollToId } from '../../utils/bus'

/* ════════════════════════════════════════════════════════════════════════════
   Terminal — a hidden command line for curious visitors.
   Open: "/" or Ctrl/⌘ + K (or the footer button). Close: Esc or `exit`.
   Tab completes, ↑ ↓ walk history.
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

const STACK = ['C++', 'Python', 'Java', 'JavaScript', 'React', 'Node.js', 'FastAPI', 'Git']
const SERVICES = ['Multi-Agent AI Systems', 'Full-Stack Web Applications', 'Autonomous Automations', 'Corporate & Portfolio Sites']

const COMMANDS = {
  help: 'list commands',
  whoami: 'who built this',
  ls: 'list things (try: ls projects)',
  open: 'open a project node — open 1 … open 5',
  launch: 'launch a product app — launch drivefetch',
  goto: 'jump to a section — goto contact',
  stack: 'tech I work with',
  services: 'what I offer',
  theme: 'theme light | dark | toggle',
  contact: 'how to reach me',
  resume: 'résumé',
  ping: 'ping the network',
  history: 'commands you ran',
  clear: 'clear the screen',
  exit: 'close the terminal',
}

const line = (text, tone = 'out') => ({ text, tone, id: Math.random().toString(36).slice(2) })

function run(input, ctx) {
  const raw = input.trim()
  if (!raw) return []
  const [cmd, ...args] = raw.split(/\s+/)
  const arg = args.join(' ').toLowerCase()
  const c = cmd.toLowerCase()

  switch (c) {
    case 'help':
    case '?':
      return [
        line('available commands:', 'dim'),
        ...Object.entries(COMMANDS).map(([k, v]) => line(`  ${k.padEnd(10)} ${v}`)),
      ]
    case 'whoami':
      return [line('Muhammad Ismail'), line('Architecting multi-agent AI. Shipping robust full-stack experiences.', 'dim')]
    case 'about':
      ctx.close(); scrollToId('about'); return []
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
      ctx.close()
      emit(EVENTS.openProject, { index: idx })
      return [line(`opening node ${String(idx + 1).padStart(2, '0')} — ${projects[idx].title}`)]
    }
    case 'goto': {
      const id = SECTIONS[arg]
      if (!id) return [line(`goto: unknown section "${arg}". try: ${[...new Set(Object.values(SECTIONS))].join(', ')}`, 'err')]
      ctx.close(); scrollToId(id); return []
    }
    case 'stack':
    case 'skills':
      return [line(STACK.join('  ·  '))]
    case 'services':
      return SERVICES.map((s, i) => line(`  ${i + 1}. ${s}`))
    case 'launch':
    case 'start': {
      const p = products.find((x) => x.id === arg || `${x.word1}${x.word2}`.toLowerCase() === arg)
      if (!p) return [line(`usage: launch <${products.map((x) => x.id).join('|')}>`, 'err')]
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
    const hits = Object.keys(COMMANDS).filter((k) => k.startsWith(parts[0].toLowerCase()))
    return hits.length === 1 ? `${hits[0]} ` : null
  }
  const [cmd, partial] = [parts[0].toLowerCase(), (parts[1] || '').toLowerCase()]
  const pool = cmd === 'goto' ? Object.keys(SECTIONS)
    : cmd === 'theme' ? ['light', 'dark', 'toggle']
    : cmd === 'ls' ? ['projects', 'products']
    : cmd === 'open' ? [...projects.map((p) => p.id), ...products.map((p) => p.id)]
    : cmd === 'launch' ? products.map((p) => p.id)
    : []
  const hits = pool.filter((k) => k.startsWith(partial))
  return hits.length === 1 ? `${cmd} ${hits[0]}` : null
}

const BOOT = [
  line('portfolio-os 1.0 — mesh online, 30 nodes linked', 'dim'),
  line('type help to see what you can do. esc to close.', 'dim'),
]

export default function Terminal() {
  const [open, setOpen] = useState(false)
  const [lines, setLines] = useState(BOOT)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState([])
  const [cursor, setCursor] = useState(-1)
  const inputRef = useRef(null)
  const scrollRef = useRef(null)
  const returnFocus = useRef(null)
  const reduced = prefersReducedMotion()

  const show = useCallback(() => {
    returnFocus.current = document.activeElement
    setOpen(true)
  }, [])
  const close = useCallback(() => {
    // Restart Lenis now, not in the effect: `goto`/`about` call scrollTo right after
    // close(), and Lenis ignores scrollTo while stopped.
    window.__lenis?.start?.()
    setOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus?.({ preventScroll: true }))
  }, [])

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
      window.__lenis?.stop?.()
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      window.__lenis?.start?.()
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const submit = (e) => {
    e.preventDefault()
    const input = value
    const echo = line(`$ ${input}`, 'cmd')
    const ctx = { close, clear: () => setLines([]), history }
    const out = run(input, ctx)
    if (input.trim().toLowerCase() !== 'clear') setLines((l) => [...l, echo, ...out])
    if (input.trim()) setHistory((h) => [...h, input.trim()])
    setValue('')
    setCursor(-1)
  }

  const onInputKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close() }
    if (e.key === 'Tab') {
      e.preventDefault()
      const c = complete(value)
      if (c) setValue(c)
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="terminal"
          className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-3 md:p-8 bg-[#F5F3EC]/50 dark:bg-[#0A0F1E]/60 backdrop-blur-sm"
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
            className="w-full max-w-[760px] h-[min(460px,70vh)] flex flex-col bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-ink rounded-xl shadow-[10px_10px_0_0_var(--color-ink)] dark:shadow-[10px_10px_0_0_rgba(255,255,255,0.18)] overflow-hidden font-mono"
            initial={reduced ? false : { y: 24, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={reduced ? undefined : { y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            onClick={() => inputRef.current?.focus()}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-ink bg-ink text-canvas">
              <span className="text-xs tracking-[0.18em] uppercase">ismail@portfolio: ~</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); close() }}
                className="text-xs tracking-[0.18em] uppercase px-2 min-h-[32px] hover:opacity-70"
                aria-label="Close terminal"
              >
                esc ✕
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 text-[13px] md:text-sm leading-relaxed" data-lenis-prevent>
              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`whitespace-pre-wrap break-words ${
                    l.tone === 'cmd' ? 'text-ink font-semibold mt-2'
                      : l.tone === 'dim' ? 'text-muted'
                      : l.tone === 'err' ? 'text-[#B3261E] dark:text-[#FF8A80]'
                      : 'text-ink/90'
                  }`}
                >
                  {l.text || ' '}
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t-2 border-ink">
              <label htmlFor="term-input" className="text-ink font-semibold" aria-label="Command">$</label>
              <input
                id="term-input"
                ref={inputRef}
                value={value}
                onChange={(e) => { setValue(e.target.value); setCursor(-1) }}
                onKeyDown={onInputKey}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="flex-1 bg-transparent outline-none text-ink text-sm caret-ink placeholder:text-muted"
                placeholder="type help"
              />
              <span className="hidden md:inline text-[11px] text-muted">tab ↹ · ↑↓</span>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

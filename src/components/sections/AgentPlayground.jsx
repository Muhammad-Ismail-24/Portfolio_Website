import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EVENTS, on, prefersReducedMotion, scrollToId } from '../../utils/bus'
import SplitHeading from '../ui/SplitHeading'

/* ════════════════════════════════════════════════════════════════════════════
   AgentPlayground — pick a task, watch a small team of agents work it.
   Scripted (no live AI calls): an orchestrator hands work to a planner,
   researcher, builder and critic; messages travel the graph as packets, the
   log streams, and the result lands in the output node.
   ════════════════════════════════════════════════════════════════════════════ */

const AGENTS = {
  orchestrator: { x: 280, y: 62, r: 32, label: 'Orchestrator' },
  planner: { x: 82, y: 196, r: 25, label: 'Planner' },
  researcher: { x: 212, y: 244, r: 25, label: 'Researcher' },
  builder: { x: 348, y: 244, r: 25, label: 'Builder' },
  critic: { x: 478, y: 196, r: 25, label: 'Critic' },
  output: { x: 280, y: 352, r: 22, label: 'Output' },
}

const EDGES = [
  ['orchestrator', 'planner'], ['orchestrator', 'researcher'], ['orchestrator', 'builder'], ['orchestrator', 'critic'],
  ['planner', 'researcher'], ['researcher', 'builder'], ['builder', 'critic'], ['planner', 'builder'],
  ['critic', 'output'],
]
const edgeKey = (a, b) => [a, b].sort().join('|')

const TASKS = [
  {
    label: 'Plan a 3-day trip',
    steps: [
      ['orchestrator', 'planner', 'Split the trip into 3 days. Budget and drive time are hard limits.'],
      ['planner', 'researcher', 'Need routes, viewpoints and places to stay for each day.'],
      ['researcher', 'planner', 'Shortlist ready: stays, viewpoints, drive time per leg.'],
      ['planner', 'builder', 'Draft a day-by-day itinerary from the shortlist.'],
      ['builder', 'critic', 'Itinerary v1 ready for review.'],
      ['critic', 'builder', 'Day 2 is overpacked. Move one stop to day 3.'],
      ['builder', 'critic', 'v2: rebalanced, every day under 4 hours of driving.'],
      ['critic', 'output', 'Approved.'],
    ],
    result: {
      title: '3-day itinerary',
      points: ['Day 1 · arrive, settle in, sunset viewpoint', 'Day 2 · lake + valley walk, early night', 'Day 3 · short hike, drive back with a delay buffer'],
    },
  },
  {
    label: 'Triage a bug report',
    steps: [
      ['orchestrator', 'researcher', 'Reproduce: "checkout button does nothing on mobile".'],
      ['researcher', 'orchestrator', 'Reproduced on narrow screens. A sticky footer covers the button.'],
      ['orchestrator', 'planner', 'Scope a fix and a regression check.'],
      ['planner', 'builder', 'Fix the stacking order; add a mobile viewport test.'],
      ['builder', 'critic', 'Patch + test ready.'],
      ['critic', 'builder', 'The test misses landscape mode.'],
      ['builder', 'critic', 'Added a landscape case. All green.'],
      ['critic', 'output', 'Ship it.'],
    ],
    result: {
      title: 'Bug triaged',
      points: ['Root cause · footer overlaps the button on small screens', 'Fix · stacking order corrected', 'Tests · portrait + landscape viewport checks'],
    },
  },
  {
    label: 'Audit data deletions',
    steps: [
      ['orchestrator', 'planner', 'Check every deletion request was honoured in every store.'],
      ['planner', 'researcher', 'Map every place user data lives: DB, backups, analytics, logs.'],
      ['researcher', 'planner', '4 stores mapped. 2 keep copies of user IDs.'],
      ['planner', 'builder', 'Write a check per store. Flag anything still present.'],
      ['builder', 'critic', 'Checks ran. 3 records still in analytics.'],
      ['critic', 'builder', 'Make sure those aren\'t anonymised aggregates.'],
      ['builder', 'critic', 'Confirmed: raw IDs. Flagged for purge.'],
      ['critic', 'output', 'Report ready.'],
    ],
    result: {
      title: 'Audit report',
      points: ['4 stores checked', 'Analytics still holds 3 raw records', 'Next · purge job, then re-run the audit'],
    },
  },
]

const STEP_MS = 1350

export default function AgentPlayground() {
  const sectionRef = useRef(null)
  const logRef = useRef(null)
  const timers = useRef([])
  const autoRan = useRef(false)
  const [task, setTask] = useState(0)
  const [status, setStatus] = useState('idle') // idle | running | done
  const [step, setStep] = useState(-1)
  const [log, setLog] = useState([])
  const reduced = prefersReducedMotion()
  const stepMs = reduced ? 300 : STEP_MS

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const start = useCallback((t = task) => {
    clearTimers()
    const steps = TASKS[t].steps
    setTask(t)
    setStatus('running')
    setStep(-1)
    setLog([{ id: 'start', from: 'you', to: 'orchestrator', text: `Task: ${TASKS[t].label.toLowerCase()}.` }])
    steps.forEach((s, i) => {
      timers.current.push(setTimeout(() => setStep(i), 400 + i * stepMs))
      timers.current.push(setTimeout(() => {
        setLog((l) => [...l, { id: `${t}-${i}`, from: s[0], to: s[1], text: s[2] }])
      }, 400 + i * stepMs + stepMs * 0.55))
    })
    timers.current.push(setTimeout(() => { setStatus('done'); setStep(steps.length) }, 400 + steps.length * stepMs + 200))
  }, [task, stepMs])

  const skip = () => {
    clearTimers()
    const steps = TASKS[task].steps
    setLog([{ id: 'start', from: 'you', to: 'orchestrator', text: `Task: ${TASKS[task].label.toLowerCase()}.` }, ...steps.map((s, i) => ({ id: `${task}-${i}`, from: s[0], to: s[1], text: s[2] }))])
    setStep(steps.length)
    setStatus('done')
  }

  useEffect(() => () => clearTimers(), [])

  // First time it scrolls into view, run task 1 on its own
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio > 0.45 && !autoRan.current) {
        autoRan.current = true
        if (!reduced) start(0)
      }
    }, { threshold: [0, 0.45] })
    io.observe(el)
    return () => io.disconnect()
  }, [start, reduced])

  // Terminal: `agents 2`
  useEffect(() => on(EVENTS.runAgents, ({ task: t }) => {
    autoRan.current = true
    scrollToId('playground')
    setTimeout(() => start(t != null && TASKS[t] ? t : task), 700)
  }), [start, task])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [log, reduced])

  const steps = TASKS[task].steps
  const current = status === 'running' && step >= 0 && step < steps.length ? steps[step] : null
  const visited = new Set()
  const usedEdges = new Set()
  steps.slice(0, Math.max(0, Math.min(step, steps.length))).forEach(([a, b]) => { visited.add(a); visited.add(b); usedEdges.add(edgeKey(a, b)) })
  if (status === 'done') visited.add('output')

  return (
    <section
      id="playground"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 md:px-16 lg:px-24"
    >
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted mb-3">Simulated multi-agent run</p>
      <SplitHeading solid="Agent" hollow="Playground." className="text-[11vw] md:text-[8vw] lg:text-[6vw]" />
      <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#555555] dark:text-[#A0ABC0]">
        Pick a task and watch a small team of agents plan, research, build and review it. It&apos;s scripted for the demo,
        no live AI calls, but it&apos;s the shape of the systems I build.
      </p>

      {/* controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Choose a task" className="flex flex-wrap gap-2">
          {TASKS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={task === i}
              onClick={() => start(i)}
              className={`px-4 min-h-[44px] border-2 border-ink text-sm font-semibold transition-colors ${
                task === i ? 'bg-ink text-canvas' : 'text-ink hover:bg-ink/[0.06]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className="hidden md:block w-px h-8 bg-ink/25 mx-1" aria-hidden="true" />
        {status === 'running' ? (
          <button type="button" onClick={skip} className="px-5 min-h-[44px] font-mono text-xs tracking-[0.18em] uppercase text-ink underline underline-offset-4">
            Skip to result
          </button>
        ) : (
          <button type="button" onClick={() => start(task)} className="inline-flex items-center gap-2 px-5 min-h-[44px] bg-ink text-canvas border-2 border-ink text-sm font-semibold hover:opacity-80 transition-opacity">
            {status === 'done' ? 'Run again' : 'Run'} <span aria-hidden="true">▶</span>
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 lg:gap-8 items-stretch">
        {/* graph */}
        <div className="relative border-2 border-ink rounded-xl bg-[#F4EFE6] dark:bg-[#080A17] shadow-[8px_8px_0_0_var(--color-ink)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.18)] p-3 md:p-5">
          <div className="flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase text-muted px-1">
            <span>graph</span>
            <span className="inline-flex items-center gap-2">
              <span className={`ap-status-dot ${status}`} aria-hidden="true" />
              {status === 'running' ? `step ${Math.min(step + 1, steps.length)} / ${steps.length}` : status === 'done' ? 'complete' : 'ready'}
            </span>
          </div>
          <svg viewBox="0 0 560 400" className="w-full h-auto mt-1" role="img" aria-label={`Agent graph${current ? `: ${AGENTS[current[0]].label} messaging ${AGENTS[current[1]].label}` : ''}`}>
            {EDGES.map(([a, b]) => {
              const A = AGENTS[a]
              const B = AGENTS[b]
              const k = edgeKey(a, b)
              const live = current && edgeKey(current[0], current[1]) === k
              return (
                <line
                  key={k}
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  className={`ap-edge ${live ? 'is-live' : usedEdges.has(k) ? 'is-used' : ''} ${k === edgeKey('critic', 'output') && status === 'done' ? 'is-used' : ''}`}
                />
              )
            })}

            {/* the packet for the current message */}
            {current && !reduced && (
              <motion.rect
                key={`${task}-${step}`}
                width="10" height="10" rx="1"
                className="ap-packet"
                initial={{ x: AGENTS[current[0]].x - 5, y: AGENTS[current[0]].y - 5 }}
                animate={{ x: AGENTS[current[1]].x - 5, y: AGENTS[current[1]].y - 5 }}
                transition={{ duration: stepMs / 1000 * 0.55, ease: [0.65, 0, 0.35, 1] }}
              />
            )}

            {Object.entries(AGENTS).map(([id, a]) => {
              const isSender = current && current[0] === id
              const isReceiver = current && current[1] === id
              const isOut = id === 'output' && status === 'done'
              const lit = isSender || isReceiver || isOut
              return (
                <g key={id} className={`ap-node ${lit ? 'is-lit' : ''} ${visited.has(id) ? 'is-visited' : ''}`} transform={`translate(${a.x} ${a.y})`}>
                  {lit && !reduced && <circle r={a.r} className="ap-ping" />}
                  <circle r={a.r + 7} className="ap-halo" />
                  <circle r={a.r} className="ap-body" />
                  <AgentIcon id={id} />
                  <text y={a.r + 22} textAnchor="middle" className="ap-label">{a.label}</text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* log + result */}
        <div className="flex flex-col gap-6 min-h-[420px]">
          <div className="flex-1 flex flex-col border-2 border-ink rounded-xl overflow-hidden bg-[#F4EFE6] dark:bg-[#080A17]">
            <div className="px-4 py-2.5 border-b-2 border-ink bg-ink text-canvas font-mono text-[11px] tracking-[0.18em] uppercase flex justify-between">
              <span>message log</span>
              <span>{log.length ? `${log.length - 1} msgs` : ''}</span>
            </div>
            <ol ref={logRef} className="flex-1 max-h-[300px] lg:max-h-none overflow-y-auto px-4 py-3 font-mono text-[13px] leading-relaxed space-y-2.5" data-lenis-prevent aria-live="polite">
              {!log.length && <li className="text-muted">Press Run to start.</li>}
              {log.map((m) => (
                <motion.li
                  key={m.id}
                  initial={reduced ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="text-ink font-semibold">{label(m.from)}</span>
                  <span className="text-muted"> → </span>
                  <span className="text-ink font-semibold">{label(m.to)}</span>
                  <span className="block text-[#555555] dark:text-[#A0ABC0]">{m.text}</span>
                </motion.li>
              ))}
            </ol>
          </div>

          <AnimatePresence mode="wait">
            {status === 'done' && (
              <motion.div
                key={`result-${task}`}
                className="border-2 border-ink rounded-xl p-5 bg-ink text-canvas"
                initial={reduced ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              >
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase opacity-70">Output</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{TASKS[task].result.title}</p>
                <ul className="mt-3 space-y-1.5 text-sm font-medium">
                  {TASKS[task].result.points.map((p) => (
                    <li key={p} className="flex gap-2"><span aria-hidden="true">■</span><span>{p}</span></li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

const label = (id) => (id === 'you' ? 'You' : AGENTS[id]?.label ?? id)

/* Tiny line icons drawn in each agent node */
function AgentIcon({ id }) {
  const common = { className: 'ap-icon', fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (id) {
    case 'orchestrator':
      return (
        <g {...common} transform="translate(-11 -11)">
          <circle cx="11" cy="11" r="3" /><circle cx="3" cy="3" r="2" /><circle cx="19" cy="3" r="2" /><circle cx="3" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
          <path d="M5 5l4 4M17 5l-4 4M5 17l4-4M17 17l-4-4" />
        </g>
      )
    case 'planner':
      return <g {...common} transform="translate(-9 -9)"><path d="M2 4h14M2 9h10M2 14h12" /></g>
    case 'researcher':
      return <g {...common} transform="translate(-9 -9)"><circle cx="7.5" cy="7.5" r="5.5" /><path d="M12 12l5 5" /></g>
    case 'builder':
      return <g {...common} transform="translate(-10 -8)"><path d="M6 2L1 8l5 6M14 2l5 6-5 6" /></g>
    case 'critic':
      return <g {...common} transform="translate(-9 -8)"><path d="M1 8l5 5L17 2" /></g>
    case 'output':
      return <g {...common} transform="translate(-7 -7)"><rect x="1" y="1" width="12" height="12" /></g>
    default:
      return null
  }
}

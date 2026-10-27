import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { projects } from '../../data/projects'
import { scrollToY } from '../../utils/bus'
import ProjectMedia from '../ui/ProjectMedia'

/* ─────────────────────────────────────────────
   ProjectCards — the "Cards" view of the Featured Projects section.

   Sticky stacking cards. Every card is a block in normal flow with
   position: sticky, so each later card scrolls up and stacks over the one
   before it. There are no wheel listeners or timers: the page scrolls exactly
   as smoothly as the rest of the site (Lenis).

   Depth: each card reads framer-motion's useScroll against the card that
   covers it, and scales to 0.92 / dims to 0.6 as that card arrives. The dim
   is a card-coloured veil, not element opacity, so covered cards never show
   through the ones on top. (Both are off under reduced motion.)
   ───────────────────────────────────────────── */

const TOP = 120    // where the first card sticks
const STEP = 28    // each later card sticks this much lower, so the edges peek out
const GAP = 64     // scroll distance between one card and the next
const stuckTop = (i) => TOP + i * STEP

const pad2 = (n) => String(n).padStart(2, '0')

export default function ProjectCards({ onOpenInNetwork }) {
  const reduced = useReducedMotion()
  const n = projects.length
  const deckRef = useRef(null)
  const cardRefs = useMemo(() => projects.map(() => ({ current: null })), [])
  const [active, setActive] = useState(0)

  // the current card = the last one that has reached its sticky position
  const { scrollY } = useScroll()
  const updateActive = () => {
    let a = 0
    cardRefs.forEach((r, i) => {
      if (r.current && r.current.getBoundingClientRect().top <= stuckTop(i) + 4) a = i
    })
    setActive((cur) => (cur === a ? cur : a))
  }
  useMotionValueEvent(scrollY, 'change', updateActive)
  useLayoutEffect(updateActive, []) // eslint-disable-line react-hooks/exhaustive-deps

  // scroll so card i sits at its sticky position
  const goTo = (i) => {
    const deckTop = deckRef.current.getBoundingClientRect().top + window.scrollY
    let y = deckTop
    for (let j = 0; j < i; j++) y += (cardRefs[j].current?.offsetHeight ?? 0) + GAP
    scrollToY(y - stuckTop(i))
  }

  return (
    <div ref={deckRef} className="relative mx-auto w-full max-w-[880px] mt-10">
      {/* progress rail */}
      <nav aria-label="Project progress" className="hidden md:block absolute top-0 bottom-0 -left-[58px] pointer-events-none">
        <ol className="sticky pointer-events-auto m-0 p-0 list-none" style={{ top: TOP }}>
          {projects.map((p, i) => (
            <li key={p.id} className={`border-l-2 transition-colors duration-300 ${i <= active ? 'border-ink' : 'border-ink/20'}`}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${p.title}`}
                aria-current={i === active ? 'step' : undefined}
                className={`ml-2.5 my-1 h-8 min-w-[34px] px-1.5 flex items-center justify-center font-mono text-[11px] tracking-[0.12em] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  i === active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'
                }`}
              >
                {pad2(i + 1)}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <ol aria-label="Featured projects" className="m-0 p-0 list-none flex flex-col" style={{ gap: GAP }}>
        {projects.map((project, i) => (
          <Card
            key={project.id}
            project={project}
            index={i}
            total={n}
            cardRef={cardRefs[i]}
            nextRef={cardRefs[i + 1]}
            reduced={reduced}
            onOpenInNetwork={onOpenInNetwork}
          />
        ))}
        {/* keeps the last card stacked for a moment before the deck scrolls away */}
        <li aria-hidden="true" style={{ height: '30vh' }} />
      </ol>
    </div>
  )
}

function Card({ project, index, total, cardRef, nextRef, reduced, onOpenInNetwork }) {
  const [h, setH] = useState(0)
  const top = stuckTop(index)

  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(() => setH(el.offsetHeight))
    ro.observe(el)
    setH(el.offsetHeight)
    return () => ro.disconnect()
  }, [cardRef])

  // "own progress": 0 when the next card's top reaches this card's bottom,
  // 1 when it has covered it down to the next sticky step
  const offset = useMemo(() => [`start ${top + h}px`, `start ${top + STEP}px`], [top, h])
  const { scrollYProgress } = useScroll(nextRef ? { target: nextRef, offset } : {})
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduced || !nextRef ? 1 : 0.92])
  const veil = useTransform(scrollYProgress, [0, 1], [0, reduced || !nextRef ? 0 : 0.4])

  return (
    <motion.li
      ref={(el) => { cardRef.current = el }}
      className="sticky bg-[var(--card-bg)] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-2xl shadow-2xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 flex flex-col md:flex-row gap-5 md:gap-6"
      style={{ top, scale, transformOrigin: '50% 0%' }}
    >
      <motion.div aria-hidden="true" className="absolute -inset-[2px] z-10 rounded-2xl pointer-events-none bg-[var(--card-bg)]" style={{ opacity: veil }} />

      {/* Image */}
      <div
        className="pn-preview relative w-full md:w-[45%] shrink-0 aspect-[16/10] rounded-xl overflow-hidden border border-black/10 dark:border-white/10"
      >
        <ProjectMedia project={project} />
      </div>

      {/* Text */}
      <div className="flex flex-col flex-1 min-w-0">
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
          {pad2(index + 1)} / {pad2(total)}
        </p>
        <h3 className="mt-1 text-3xl font-black text-ink tracking-tight">{project.title}</h3>
        <p className="mt-3 text-sm font-medium text-muted leading-relaxed">{project.description}</p>

        <div className="mt-auto pt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => onOpenInNetwork?.(index)}
            className="min-h-[44px] pr-2 font-mono text-[11px] tracking-[0.16em] uppercase text-ink/70 hover:text-ink transition-colors"
          >
            View in network ↗
          </button>
          {project.demo && (
            <a
              href={project.demo}
              className="shrink-0 whitespace-nowrap px-5 sm:px-6 py-2.5 bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-bold text-sm rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
            >
              Video Demo →
            </a>
          )}
        </div>
      </div>
    </motion.li>
  )
}

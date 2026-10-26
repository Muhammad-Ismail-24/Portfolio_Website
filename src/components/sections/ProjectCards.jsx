import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { projects } from '../../data/projects'

/* ─────────────────────────────────────────────
   ProjectCards — the original right-stacked card deck, as the
   "Cards" view of the Featured Projects section.

   Same look as before. Navigation no longer hijacks the vertical mouse
   wheel (which trapped page scrolling); instead:
     • click a card behind the front one to bring it forward
     • drag / swipe the front card left or right
     • ← / → keys while the deck is focused, or the arrow buttons
     • horizontal trackpad swipes still flip cards
   ───────────────────────────────────────────── */

const getStackAnimation = (offset) => {
  if (offset === 0) return { x: 0, scale: 1, zIndex: 40, opacity: 1 }
  if (offset === 1) return { x: 60, scale: 0.95, zIndex: 30, opacity: 1 }
  if (offset === 2) return { x: 120, scale: 0.9, zIndex: 20, opacity: 1 }
  return { x: 150, scale: 0.8, zIndex: 10, opacity: 0 }
}

export default function ProjectCards({ onOpenInNetwork }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const deckRef = useRef(null)
  const n = projects.length

  const next = useCallback(() => setActiveIndex((p) => (p + 1) % n), [n])
  const prev = useCallback(() => setActiveIndex((p) => (p - 1 + n) % n), [n])

  // Horizontal trackpad swipes only — vertical wheel scrolls the page as normal
  useEffect(() => {
    const el = deckRef.current
    if (!el) return
    let throttled = false
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return
      e.preventDefault()
      if (throttled) return
      throttled = true
      setTimeout(() => { throttled = false }, 450)
      if (e.deltaX > 0) next()
      else prev()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [next, prev])

  return (
    <div className="flex flex-col items-center">
      <div
        ref={deckRef}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured projects"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); next() }
          if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
        }}
        className="relative w-full max-w-5xl h-[50vh] min-h-[420px] max-h-[500px] mt-10 mx-auto flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-8 focus-visible:ring-offset-canvas rounded-2xl"
        style={{ perspective: '1000px' }}
      >
        {projects.map((project, index) => {
          let offset = index - activeIndex
          if (offset < 0) offset += n
          const anim = getStackAnimation(offset)
          const isFront = offset === 0

          return (
            <motion.div
              key={project.id}
              animate={{ x: anim.x, scale: anim.scale, opacity: anim.opacity }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ zIndex: anim.zIndex }}
              drag={isFront ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70 || info.velocity.x < -400) next()
                else if (info.offset.x > 70 || info.velocity.x > 400) prev()
              }}
              aria-hidden={!isFront}
              className={`absolute w-[85%] max-w-[550px] lg:max-w-[650px] h-full bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-2xl shadow-2xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 flex flex-col ${isFront ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
              onClick={() => { if (!isFront) setActiveIndex(index) }}
            >
              {/* Image Block */}
              <div className="w-full h-[180px] lg:h-[200px] shrink-0 mb-4 bg-[#0A0A0A] rounded-xl overflow-hidden border border-black/10 dark:border-white/10 pointer-events-none">
                <img
                  src={project.image}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              </div>

              {/* Text Layout */}
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted">
                {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </p>
              <h3 className="mt-1 text-3xl font-black text-[#0A0A0A] dark:text-white tracking-tight">
                {project.title}
              </h3>
              <p className="mt-3 text-sm font-medium text-[#555555] dark:text-[#94A3B8] leading-relaxed max-w-2xl line-clamp-3">
                {project.description}
              </p>

              {/* Bottom row */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  tabIndex={isFront ? 0 : -1}
                  onClick={(e) => { e.stopPropagation(); onOpenInNetwork?.(index) }}
                  className="min-h-[44px] pr-2 font-mono text-[11px] tracking-[0.16em] uppercase text-ink/70 hover:text-ink transition-colors"
                >
                  <span className="sm:hidden">Network ↗</span>
                  <span className="hidden sm:inline">View in network ↗</span>
                </button>
                <a
                  href={project.demo}
                  tabIndex={isFront ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 whitespace-nowrap px-5 sm:px-6 py-2.5 bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-bold text-sm rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  Video Demo →
                </a>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Controls: arrows + dot indicators */}
      <div className="flex items-center gap-5 mt-8">
        <button
          type="button"
          onClick={prev}
          aria-label="Previous project"
          className="w-11 h-11 rounded-full border border-ink/40 text-ink flex items-center justify-center hover:bg-ink hover:text-canvas transition-colors"
        >
          ←
        </button>
        <div className="flex gap-2">
          {projects.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show ${p.title}`}
              aria-current={i === activeIndex}
              className="w-6 h-11 flex items-center justify-center"
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full border border-[#0A0A0A] dark:border-white transition-colors ${
                  i === activeIndex ? 'bg-[#0A0A0A] dark:bg-white' : 'bg-transparent'
                }`}
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          aria-label="Next project"
          className="w-11 h-11 rounded-full border border-ink/40 text-ink flex items-center justify-center hover:bg-ink hover:text-canvas transition-colors"
        >
          →
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {projects[activeIndex].title}, project {activeIndex + 1} of {n}
      </p>
    </div>
  )
}

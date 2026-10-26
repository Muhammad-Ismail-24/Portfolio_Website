import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import SplitHeading from '../ui/SplitHeading'
import { projects } from '../../data/projects'
import { products } from '../../data/products'
import { services, servicesIntro, workSteps } from '../../data/services'
import { EVENTS, emit, scrollToId } from '../../utils/bus'

/* ════════════════════════════════════════════════════════════════════════════
   What I offer. — four offerings in ruled columns (no boxes), each with a small
   line-art drawing that animates gently on hover/focus, and a "See it in →"
   link to the project or app that shows it. Under it, a "How I work" line that
   draws in with scroll, and the closing "Start a project →" button.
   Copy lives in src/data/services.js.
   ════════════════════════════════════════════════════════════════════════════ */

const style = (i) => ({ '--i': i })

/* ── Line-art (viewBox 120×80, drawn in the site's 2px stroke) ───────────── */
const ART = {
  // a node graph; the nodes light up in turn
  agents: (
    <>
      <path className="st" d="M60 40L18 16M60 40L102 16M60 40L18 64M60 40L102 64M18 16L18 64M102 16L102 64" />
      {[[18, 16], [60, 40], [102, 16], [102, 64], [18, 64]].map(([x, y], i) => (
        <circle key={i} className="svc-node" cx={x} cy={y} r="7" style={style(i)} />
      ))}
    </>
  ),
  // a browser frame whose content blocks fill in
  web: (
    <>
      <rect className="st" x="4" y="6" width="112" height="68" rx="3" />
      <path className="st" d="M4 20H116" />
      <circle className="fl" cx="13" cy="13" r="2" /><circle className="fl" cx="21" cy="13" r="2" /><circle className="fl" cx="29" cy="13" r="2" />
      <rect className="svc-block" x="12" y="28" width="38" height="38" style={style(0)} />
      <rect className="svc-block" x="58" y="28" width="50" height="14" style={style(1)} />
      <rect className="svc-block" x="58" y="50" width="50" height="16" style={style(2)} />
    </>
  ),
  // a pipeline with a packet moving along it
  automation: (
    <>
      <path className="st" d="M20 40H38M58 40H70M90 40H102" />
      {[6, 38, 70, 102].map((x) => <rect key={x} className="st" x={x} y="30" width="20" height="20" rx="2" />)}
      <rect className="fl svc-packet" x="9" y="37" width="6" height="6" />
    </>
  ),
  // a page layout whose sections slide into place
  sites: (
    <>
      <rect className="st svc-slide" x="6" y="6" width="108" height="12" rx="2" style={style(0)} />
      <rect className="st svc-slide" x="6" y="25" width="108" height="26" rx="2" style={style(1)} />
      <rect className="st svc-slide" x="6" y="58" width="50" height="16" rx="2" style={style(2)} />
      <rect className="st svc-slide" x="64" y="58" width="50" height="16" rx="2" style={style(3)} />
    </>
  ),
}

/** The project or product behind a proofId, plus how to open it. */
function resolveProof(service) {
  if (service.proofSelf || !service.proofId) {
    return { label: 'this site', open: () => scrollToId('top') }
  }
  const pi = projects.findIndex((p) => p.id === service.proofId)
  if (pi >= 0) return { label: projects[pi].title, open: () => emit(EVENTS.openProject, { index: pi }) }
  const pr = products.find((p) => p.id === service.proofId)
  if (pr) return { label: `${pr.word1}${pr.word2}`, open: () => emit(EVENTS.launchApp, { id: pr.id }) }
  return null
}

export default function Services() {
  return (
    <section id="services" className="relative z-10 w-full pt-28 pb-20 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-7xl mx-auto">
        <SplitHeading solid="What I" hollow="offer." className="text-[11vw] md:text-[8vw] lg:text-[6.5vw]" />
        <p className="mt-5 max-w-3xl text-lg lg:text-xl font-medium text-muted leading-snug">{servicesIntro}</p>

        <ol className="mt-14 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 m-0 p-0 list-none">
          {services.map((s, i) => {
            const proof = resolveProof(s)
            return (
              <li key={s.id} className="svc-col">
                <p className="font-mono text-5xl xl:text-6xl font-bold tracking-tighter text-ink leading-none">{String(i + 1).padStart(2, '0')}</p>
                <svg className="svc-art mt-6 w-[120px] h-[80px] text-ink" viewBox="0 0 120 80" aria-hidden="true">{ART[s.art]}</svg>
                <h3 className="mt-6 text-2xl font-black tracking-tight leading-[1.05] text-ink">{s.title}</h3>
                <p className="mt-3 text-sm font-medium text-muted leading-relaxed">{s.description}</p>

                <p className="mt-6 font-mono text-[11px] tracking-[0.18em] uppercase text-muted">What you get</p>
                <ul className="mt-3 m-0 p-0 list-none flex flex-col gap-2">
                  {s.deliverables.map((d) => (
                    <li key={d} className="flex gap-3 text-sm font-medium text-ink leading-snug"><span className="svc-sq" aria-hidden="true" />{d}</li>
                  ))}
                </ul>

                <p className="mt-6 font-mono text-xs text-muted leading-relaxed">{s.tools.join(' · ')}</p>

                {proof && (
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={proof.open}
                      className="ct-ulink min-h-[44px] pb-0.5 text-left font-mono text-xs tracking-[0.12em] uppercase text-ink outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
                    >
                      See it in → {proof.label}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>

        <HowIWork />

        <div className="mt-16 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToId('contact', { onComplete: () => document.getElementById('contact-name')?.focus({ preventScroll: true }) })}
            className="inline-flex items-center gap-2 px-8 min-h-[48px] bg-ink text-canvas border-2 border-ink font-semibold tracking-wide hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
          >
            Start a project <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── How I work: four nodes on one ink line that draws in with scroll ─────── */
function HowIWork() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'end 0.7'] })
  const draw = useTransform(scrollYProgress, [0, 1], [reduced ? 1 : 0, 1])
  const n = workSteps.length

  return (
    <div className="mt-24">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted mb-8">How I work</p>
      <div ref={ref} className="relative">
        {/* the line: vertical on phones, horizontal from md up */}
        <span aria-hidden="true" className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-ink/15 md:hidden" />
        <motion.span aria-hidden="true" className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-ink md:hidden origin-top" style={{ scaleY: draw }} />
        <span aria-hidden="true" className="absolute top-[7px] left-2 right-2 h-[2px] bg-ink/15 hidden md:block" />
        <motion.span aria-hidden="true" className="absolute top-[7px] left-2 right-2 h-[2px] bg-ink hidden md:block origin-left" style={{ scaleX: draw }} />

        <ol className="relative m-0 p-0 list-none grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          {workSteps.map((step, i) => (
            <Step key={step.title} step={step} index={i} total={n} draw={draw} />
          ))}
        </ol>
      </div>
    </div>
  )
}

function Step({ step, index, total, draw }) {
  // the node fills once the line has reached it
  const from = (index / (total - 1)) * 0.94
  const fill = useTransform(draw, [from, from + 0.06], [0, 1])
  return (
    <li className="relative pl-10 md:pl-0 md:pt-10">
      <span className="hw-node absolute left-0 top-0" aria-hidden="true">
        <motion.span className="absolute inset-[2px] bg-ink" style={{ opacity: fill }} />
      </span>
      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">{String(index + 1).padStart(2, '0')}</p>
      <h4 className="mt-1 text-xl font-black tracking-tight text-ink">{step.title}</h4>
      <p className="mt-2 text-sm font-medium text-muted leading-relaxed max-w-[26ch]">{step.line}</p>
    </li>
  )
}

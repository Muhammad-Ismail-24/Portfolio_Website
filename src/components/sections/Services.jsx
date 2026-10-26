import SplitHeading from '../ui/SplitHeading'
import { services, servicesIntro } from '../../data/services'
import { scrollToId } from '../../utils/bus'

/* ════════════════════════════════════════════════════════════════════════════
   What I offer. — four offerings in ruled columns (no boxes): number, a small
   line-art drawing that animates gently on hover/focus, the title and one line.
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

export default function Services() {
  return (
    <section id="services" className="relative z-10 w-full min-h-[100svh] flex flex-col justify-center pt-24 pb-12 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-7xl mx-auto">
        <SplitHeading solid="What I" hollow="offer." className="text-[11vw] md:text-[8vw] lg:text-[6.5vw]" />
        <p className="mt-5 max-w-3xl text-lg lg:text-xl font-medium text-muted leading-snug">{servicesIntro}</p>

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 m-0 p-0 list-none">
          {services.map((s, i) => (
            <li key={s.id} className="svc-col">
              <p className="font-mono text-xl font-bold tracking-tight text-ink leading-none">{String(i + 1).padStart(2, '0')}</p>
              <svg className="svc-art mt-5 w-[64px] h-[43px] text-ink" viewBox="0 0 120 80" aria-hidden="true">{ART[s.art]}</svg>
              <h3 className="mt-5 text-2xl font-black tracking-tight leading-[1.05] text-ink">{s.title}</h3>
              <p className="mt-2 text-sm font-medium text-muted leading-relaxed">{s.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => scrollToId('contact')}
            className="inline-flex items-center gap-2 px-8 min-h-[48px] bg-ink text-canvas border-2 border-ink font-semibold tracking-wide hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
          >
            Start a project <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

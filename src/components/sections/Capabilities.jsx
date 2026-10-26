import SplitHeading from '../ui/SplitHeading'
import { skills } from '../../data/skills'

/* ════════════════════════════════════════════════════════════════════════════
   Core Capabilities. — bordered cards on a dotted grid, joined by short ink
   wires. Desktop: Languages down the left, AI Agents across the top right,
   three cards under it. Tablet stacks Languages / AI Agents / three-up; phones
   stack every card. Copy lives in src/data/skills.js; layout, wires and hover
   live in features.css (.cap-*).

   Each wire is a span inside the card it points INTO, sized to the grid gap
   and pushed out past that card's border, so it follows the card at any width
   and its rings paint over the card it comes FROM (earlier in the DOM).
   ════════════════════════════════════════════════════════════════════════════ */

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// "built with LangGraph and RAG" → ['built with ', <b>LangGraph</b>, ' and ', <b>RAG</b>]
function emphasise(text, highlight = []) {
  if (!highlight.length) return text
  const re = new RegExp(`(?<![\\w])(${highlight.map(escape).join('|')})(?![\\w])`)
  return text.split(re).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part))
}

function List({ group, className = '' }) {
  return (
    <p className={`cap-list ${className}`}>
      {group.items.map((item, i) => (
        <span key={item}>{i > 0 && ' / '}{emphasise(item, group.highlight)}</span>
      ))}
    </p>
  )
}

/* ── Line icons (24×24, ink) ─────────────────────────────────────────────── */
const ICONS = {
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" /><circle cx="4.5" cy="5" r="2" /><circle cx="19.5" cy="5" r="2" /><circle cx="4.5" cy="19" r="2" /><circle cx="19.5" cy="19" r="2" />
      <path d="M6.1 6.4l3.6 3.4M17.9 6.4l-3.6 3.4M6.1 17.6l3.6-3.4M17.9 17.6l-3.6-3.4" />
    </svg>
  ),
  frontend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="2.5" y="4" width="19" height="16" rx="1.5" /><path d="M2.5 8h19" /><rect x="5.5" y="11" width="6" height="6" /><path d="M14 12h4.5M14 15h3" />
    </svg>
  ),
  backend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.5" />
      <path d="M4.5 5.5v6.5c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V5.5M4.5 12v6.5c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5V12" />
    </svg>
  ),
  pipelines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="1.5" y="9" width="5" height="6" rx="1" /><rect x="9.5" y="9" width="5" height="6" rx="1" /><rect x="17.5" y="9" width="5" height="6" rx="1" />
      <path d="M6.5 12h3M14.5 12h3" /><circle cx="4" cy="12" r="0.8" fill="currentColor" />
    </svg>
  ),
}

const Icon = ({ name, className }) => <span className={`cap-icon ${className}`} aria-hidden="true">{ICONS[name]}</span>

function SmallCard({ name, wires }) {
  const group = skills[name]
  return (
    <article className={`cap-card cap-small cap-${name}`}>
      {wires}
      <span className="cap-wire cap-wire-v" aria-hidden="true" />
      <div className="cap-small-head">
        <h3 className="cap-h cap-small-title">{group.title}</h3>
        <Icon name={name} className="cap-icon-sm" />
      </div>
      <List group={group} />
    </article>
  )
}

export default function Capabilities() {
  const { languages, tools, ai } = skills
  return (
    <section id="stack" className="cap-section relative z-10 w-full min-h-[100svh] flex flex-col justify-center pt-24 pb-14 px-6 md:px-10">
      <SplitHeading solid="Core" hollow="Capabilities." className="justify-center text-center text-[clamp(48px,6vw,80px)]" />

      <div className="cap-grid">
        <article className="cap-card cap-languages">
          <h3 className="cap-h cap-lang-title">{languages.title}</h3>
          <ul className="cap-lang-list">
            {languages.items.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <div className="cap-tools">
            <h3 className="cap-h cap-tools-title">{tools.title}</h3>
            <List group={tools} />
          </div>
        </article>

        <article className="cap-card cap-ai">
          <span className="cap-wire cap-wire-in" aria-hidden="true" />
          <Icon name="ai" className="cap-icon-lg" />
          <div className="cap-ai-body">
            <h3 className="cap-h cap-ai-title">{ai.title}</h3>
            <p className="cap-list cap-ai-text">{emphasise(ai.text, ai.highlight)}</p>
          </div>
        </article>

        <SmallCard name="frontend" wires={<span className="cap-wire cap-wire-h cap-wire-side" aria-hidden="true" />} />
        <SmallCard name="backend" />
        <SmallCard name="pipelines" />
      </div>
    </section>
  )
}

import { useMemo, useState } from 'react'
import SplitHeading from '../ui/SplitHeading'
import { buildStackGrid } from '../../data/stackGrid'
import { EVENTS, emit } from '../../utils/bus'

/* ════════════════════════════════════════════════════════════════════════════
   Built with. — a skills × projects grid, generated from projects.js (`tags`)
   and products.js (`stack`). Columns are every project (P) and product (A);
   rows are the technologies they use, grouped by category (data/skills.js).
   Click a project header to open it in the network; a product header launches
   its portfolio-os window.
   ════════════════════════════════════════════════════════════════════════════ */

// a soft ink wash that also paints over the sticky (opaque) first column
const WASH = '[background-image:linear-gradient(rgb(var(--ink-rgb)/0.07),rgb(var(--ink-rgb)/0.07))]'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export default function Stack() {
  const grid = useMemo(buildStackGrid, [])
  const { columns, groups } = grid
  const [hc, setHc] = useState(null) // hovered / focused column index

  const open = (col) => {
    if (col.kind === 'project') emit(EVENTS.openProject, { index: col.index })
    else emit(EVENTS.launchApp, { id: col.id })
  }

  const colWash = (c) => (hc === c ? WASH : '')
  const hovered = hc !== null ? columns[hc] : null

  return (
    <section id="stack" className="relative z-10 w-full pt-28 pb-20 px-6 md:px-16 lg:px-24">
      <div className="w-full max-w-6xl mx-auto">
        <SplitHeading solid="Built" hollow="with." className="text-[11vw] md:text-[8vw] lg:text-[6.5vw]" />
        <p className="mt-5 text-lg lg:text-xl font-medium text-muted leading-snug">Every skill here links to something I&apos;ve actually shipped.</p>

        <div className="mt-10 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs md:text-sm text-muted">
          <p>{plural(grid.techCount, 'technology', 'technologies')} across {plural(grid.usedColumns, 'project', 'projects')}.</p>
          <p aria-hidden="true" className="min-h-[1.25em] text-ink">
            {hovered && <>{hovered.name} <span className="text-muted">· {hovered.kind === 'project' ? 'Project' : 'App'} · click to {hovered.kind === 'project' ? 'open' : 'launch'}</span></>}
          </p>
        </div>

        <div className="mt-3 border-2 border-ink bg-[var(--card-bg)] overflow-x-auto no-scrollbar">
          <table
            className="w-full border-collapse"
            style={{ minWidth: 200 + columns.length * 84 }}
            onMouseLeave={() => setHc(null)}
            onMouseOver={(e) => {
              const c = e.target.closest('[data-col]')
              setHc(c ? Number(c.dataset.col) : null)
            }}
          >
            <caption className="sr-only">Technologies used by each project (P) and app (A)</caption>
            <thead>
              <tr>
                <td className="sticky left-0 z-20 w-[200px] bg-[var(--card-bg)] border-b-2 border-ink" />
                {columns.map((col, c) => (
                  <th key={col.key} scope="col" data-col={c} className={`border-b-2 border-ink p-0 align-bottom ${colWash(c)}`}>
                    <button
                      type="button"
                      onClick={() => open(col)}
                      onFocus={() => setHc(c)}
                      onBlur={() => setHc(null)}
                      aria-label={`${col.name} — ${col.kind === 'project' ? 'project, open in the network' : 'app, launch in portfolio-os'}`}
                      className="flex flex-col items-center justify-end gap-1 w-full h-full min-h-[64px] px-1 py-3 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink hover:text-ink"
                    >
                      <span className="font-mono text-[10px] font-bold tracking-[0.1em] border border-ink px-1 leading-[14px] text-ink">{col.kind === 'project' ? 'P' : 'A'}</span>
                      <span className="text-xs font-semibold text-ink leading-tight text-center">{col.short}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            {groups.map((g) => (
              <tbody key={g.category}>
                <tr>
                  <th
                    scope="rowgroup"
                    colSpan={columns.length + 1}
                    className="sticky left-0 text-left px-4 pt-5 pb-2 font-mono text-[11px] font-semibold tracking-[0.2em] uppercase text-muted"
                  >
                    {g.category}
                  </th>
                </tr>
                {g.rows.map((row) => (
                  <tr key={row.tech} className="group/row">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 w-[200px] bg-[var(--card-bg)] text-left px-4 py-2.5 border-t border-ink/15 group-hover/row:[background-image:linear-gradient(rgb(var(--ink-rgb)/0.07),rgb(var(--ink-rgb)/0.07))]"
                    >
                      <span className="block text-sm font-semibold text-ink leading-tight">{row.tech}</span>
                      <span className="block font-mono text-[10px] tracking-[0.12em] uppercase text-muted">used in {row.count}</span>
                    </th>
                    {columns.map((col, c) => {
                      const used = row.uses.has(col.key)
                      return (
                        <td
                          key={col.key}
                          data-col={c}
                          className={`text-center border-t border-ink/15 group-hover/row:[background-image:linear-gradient(rgb(var(--ink-rgb)/0.07),rgb(var(--ink-rgb)/0.07))] ${colWash(c)}`}
                        >
                          {used
                            ? <span className="inline-block w-3 h-3 bg-ink align-middle" role="img" aria-label="Used" />
                            : <span className="inline-block w-1 h-1 rounded-full bg-ink/20 align-middle" role="img" aria-label="Not used" />}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
        <p className="mt-3 font-mono text-[11px] tracking-[0.12em] uppercase text-muted">Generated from my project data.</p>
      </div>
    </section>
  )
}

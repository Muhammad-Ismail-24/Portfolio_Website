import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { journey, GITHUB_USER, shortHash } from '../../data/journey'
import { cache } from '../../utils/bus'
import SplitHeading from '../ui/SplitHeading'

/* ════════════════════════════════════════════════════════════════════════════
   Journey — "Commit History."
   Left:  your story as `git log --graph` (data in src/data/journey.js).
          Hover / focus / click a commit and the `git show` panel below
          prints its details.
   Right: live from GitHub — a contribution grid, recently pushed repos and
          recent activity, fetched from public APIs (cached per session).
   ════════════════════════════════════════════════════════════════════════════ */

const RH = 52        // row height (px)
const LANE = 22      // lane spacing (px)
const GX = 16        // x of lane 0

/* ── Build the graph: lanes, rows, paths ─────────────────────────────────── */
function buildGraph(commits) {
  const rows = commits.map((c, i) => ({ ...c, idx: i, hash: shortHash(`${c.date}|${c.message}`) })).reverse() // newest first
  const n = rows.length
  // lane allocation in chronological order, reusing lanes freed by merges
  const lane = { main: 0 }
  const free = []
  let next = 1
  const chron = [...rows].reverse()
  chron.forEach((c) => {
    if (c.branch !== 'main' && lane[c.branch] === undefined) lane[c.branch] = free.length ? free.shift() : next++
    if (c.branch === 'main' && c.merges && lane[c.merges] !== undefined) free.push(lane[c.merges])
  })
  const lanes = Math.max(1, ...Object.values(lane).map((l) => l + 1))
  const x = (b) => GX + lane[b] * LANE
  const y = (r) => r * RH + RH / 2

  const mainRows = rows.map((c, r) => (c.branch === 'main' ? r : -1)).filter((r) => r >= 0)
  const paths = []
  if (mainRows.length) paths.push({ d: `M ${x('main')} ${y(Math.min(...mainRows))} V ${y(Math.max(...mainRows))}`, branch: 'main' })

  const branches = [...new Set(rows.map((c) => c.branch))].filter((b) => b !== 'main')
  const tips = {}
  branches.forEach((b) => {
    const rs = rows.map((c, r) => (c.branch === b ? r : -1)).filter((r) => r >= 0)
    const newest = Math.min(...rs)
    const oldest = Math.max(...rs)
    tips[b] = newest
    const fork = mainRows.filter((r) => r > oldest).sort((a, c) => a - c)[0]
    const merge = rows.findIndex((c) => c.branch === 'main' && c.merges === b)
    const xb = x(b)
    const x0 = x('main')
    let d = ''
    if (fork !== undefined) {
      const yF = y(fork)
      d += `M ${x0} ${yF} C ${x0} ${yF - RH * 0.45}, ${xb} ${yF - RH * 0.3}, ${xb} ${yF - RH * 0.75} L ${xb} ${y(newest)}`
    } else {
      d += `M ${xb} ${y(oldest)} L ${xb} ${y(newest)}`
    }
    if (merge >= 0 && merge < newest) {
      const yN = y(newest)
      const yM = y(merge)
      d += ` C ${xb} ${yN - RH * 0.45}, ${x0} ${yM + RH * 0.55}, ${x0} ${yM}`
    }
    paths.push({ d, branch: b })
  })

  return { rows, lanes, lane, x, y, paths, tips, width: GX + (lanes - 1) * LANE + 18 }
}

export default function Journey() {
  const g = useMemo(() => buildGraph(journey), [])
  const [sel, setSel] = useState(0) // row index, 0 = HEAD
  const c = g.rows[sel]

  return (
    <section id="journey" className="relative z-10 w-full min-h-screen flex flex-col justify-center pt-24 pb-16 px-6 md:px-16 lg:px-24">
      <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted mb-3">git log --graph --all</p>
      <SplitHeading solid="Commit" hollow="History." className="text-[11vw] md:text-[8vw] lg:text-[6vw]" />
      <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-[#555555] dark:text-[#A0ABC0]">
        How I got here, as a git history, next to what I&apos;m pushing right now.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-8 items-start">
        {/* ── the log ─────────────────────────── */}
        <div className="border-2 border-ink rounded-xl overflow-hidden bg-[#F4EFE6] dark:bg-[#080A17] shadow-[8px_8px_0_0_var(--color-ink)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.18)]">
          <div className="flex items-center justify-between px-4 h-10 bg-ink text-canvas font-mono text-[11px] tracking-[0.12em]">
            <span className="truncate">~/muhammad-ismail <span className="opacity-60">$</span> git log --graph</span>
            <span className="hidden sm:inline opacity-70 uppercase tracking-[0.16em]">{g.rows.length} commits</span>
          </div>

          <div className="relative py-2">
            {/* graph */}
            <svg
              className="absolute left-2 top-2 pointer-events-none overflow-visible"
              width={g.width}
              height={g.rows.length * RH}
              aria-hidden="true"
            >
              {g.paths.map((p, i) => (
                <path key={i} d={p.d} className={`jr-line ${p.branch === 'main' ? 'is-main' : ''} ${c.branch === p.branch ? 'is-sel' : ''}`} />
              ))}
              {g.rows.map((r, i) => {
                const cx = g.x(r.branch)
                const cy = g.y(i)
                const isHead = i === 0
                return (
                  <g key={r.hash} transform={`translate(${cx} ${cy})`} className={`jr-node ${sel === i ? 'is-sel' : ''}`}>
                    {isHead && <circle r="7" className="jr-head-pulse" />}
                    <circle r={r.merges ? 6.5 : 5.5} className={r.merges || isHead ? 'jr-dot is-solid' : 'jr-dot'} />
                  </g>
                )
              })}
            </svg>

            {/* rows */}
            <ol>
              {g.rows.map((r, i) => {
                const chips = []
                if (i === 0) chips.push({ t: 'HEAD → main', strong: true })
                if (r.tag) chips.push({ t: `tag: ${r.tag}` })
                if (r.branch !== 'main' && g.tips[r.branch] === i) chips.push({ t: r.branch, dashed: true })
                return (
                  <li key={r.hash}>
                    <button
                      type="button"
                      onClick={() => setSel(i)}
                      onMouseEnter={() => setSel(i)}
                      onFocus={() => setSel(i)}
                      aria-current={sel === i}
                      className={`jr-row w-full flex items-center gap-3 pr-4 text-left transition-colors ${sel === i ? 'bg-ink/[0.07]' : 'hover:bg-ink/[0.04]'}`}
                      style={{ height: RH, paddingLeft: g.width + 16 }}
                    >
                      <span className="font-mono text-xs text-muted shrink-0">{r.hash}</span>
                      <span className="flex-1 min-w-0 flex items-center gap-2">
                        {chips.map((ch) => (
                          <span
                            key={ch.t}
                            className={`hidden sm:inline-flex shrink-0 items-center h-6 px-2 font-mono text-[11px] font-semibold ${
                              ch.strong ? 'bg-ink text-canvas' : ch.dashed ? 'border border-dashed border-ink text-ink' : 'border border-ink text-ink'
                            }`}
                          >
                            {ch.t}
                          </span>
                        ))}
                        <span className="truncate text-[15px] font-medium text-ink">{r.message}</span>
                      </span>
                      <span className="hidden md:inline font-mono text-xs text-muted shrink-0">{r.date}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* git show */}
          <div className="border-t-2 border-ink px-5 py-4 font-mono text-[13px] leading-relaxed min-h-[150px]" aria-live="polite">
            <p className="text-ink"><span className="text-muted">$ git show </span>{c.hash}</p>
            <p className="mt-2 text-ink">
              <span className="font-semibold">commit {c.hash}</span>
              {sel === 0 && <span className="text-muted"> (HEAD → main{c.tag ? `, tag: ${c.tag}` : ''})</span>}
              {sel !== 0 && c.tag && <span className="text-muted"> (tag: {c.tag})</span>}
            </p>
            <p className="text-muted">Author: Muhammad Ismail · Branch: {c.branch}{c.merges ? ` · Merges: ${c.merges}` : ''}</p>
            <p className="text-muted">Date:   {c.date}</p>
            <p className="mt-3 pl-4 text-ink font-semibold">{c.message}</p>
            {c.detail && <p className="pl-4 text-[#555555] dark:text-[#A0ABC0] font-sans text-[15px] mt-1">{c.detail}</p>}
          </div>
        </div>

        {/* ── live from GitHub ─────────────────── */}
        <LiveGitHub />
      </div>
    </section>
  )
}

/* ── Live GitHub panel ───────────────────────────────────────────────────── */
const CELL = 12
const GAP = 3
const TTL = 15 * 60 * 1000

function timeAgo(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000)
  const units = [['y', 31536000], ['mo', 2592000], ['d', 86400], ['h', 3600], ['m', 60]]
  for (const [u, sec] of units) if (s >= sec) return `${Math.floor(s / sec)}${u} ago`
  return 'just now'
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

function LiveGitHub() {
  const ref = useRef(null)
  const gridRef = useRef(null)
  const [state, setState] = useState({ status: 'idle' })
  const [weeks, setWeeks] = useState(26)

  useLayoutEffect(() => {
    const el = gridRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWeeks(Math.max(12, Math.min(30, Math.floor((e.contentRect.width + GAP) / (CELL + GAP))))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // fetch once the panel is near the viewport
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let done = false
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || done) return
      done = true
      io.disconnect()
      const hit = cache.get('gh-live', TTL)
      if (hit) { setState({ status: 'ok', ...hit }); return }
      setState({ status: 'loading' })
      const [contrib, repos, events] = await Promise.allSettled([
        getJSON(`https://github-contributions-api.jogruber.de/v4/${GITHUB_USER}?y=last`),
        getJSON(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=4`),
        getJSON(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=30`),
      ])
      const data = {
        days: contrib.status === 'fulfilled' ? (contrib.value.contributions || []).map((d) => ({ date: d.date, count: d.count, level: d.level })) : null,
        total: contrib.status === 'fulfilled' ? contrib.value.total?.lastYear ?? null : null,
        repos: repos.status === 'fulfilled' ? repos.value.filter((r) => !r.fork).slice(0, 4).map((r) => ({ name: r.name, url: r.html_url, desc: r.description, lang: r.language, pushed: r.pushed_at })) : [],
        events: events.status === 'fulfilled' ? summarise(events.value) : [],
      }
      // no contribution API? approximate the grid from public events
      if (!data.days && events.status === 'fulfilled') data.days = daysFromEvents(events.value)
      const ok = data.days || data.repos.length || data.events.length
      if (ok) cache.set('gh-live', data)
      setState(ok ? { status: 'ok', ...data } : { status: 'error' })
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const grid = useMemo(() => buildCalendar(state.days, weeks), [state.days, weeks])
  const loading = state.status === 'loading' || state.status === 'idle'

  return (
    <div ref={ref} className="border-2 border-ink rounded-xl overflow-hidden bg-[#F4EFE6] dark:bg-[#080A17]">
      <div className="flex items-center justify-between gap-3 px-4 h-10 border-b-2 border-ink font-mono text-[11px] tracking-[0.16em] uppercase">
        <span className="inline-flex items-center gap-2 text-ink"><span className="pn-live-dot" aria-hidden="true" /> live from github</span>
        <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noreferrer" className="normal-case tracking-normal text-xs text-ink underline underline-offset-4 truncate">
          @{GITHUB_USER}
        </a>
      </div>

      <div className="p-4 md:p-5">
        {/* contribution grid (hidden if GitHub can't be reached, so it never reads as "no activity") */}
        <div ref={gridRef} className={`w-full ${state.status === 'error' ? 'hidden' : ''}`}>
          <div className="flex gap-[3px]" role="img" aria-label={state.total != null ? `${state.total} contributions in the last year` : 'GitHub contribution grid'}>
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((d, di) => (
                  <span
                    key={di}
                    title={d && d.date ? `${d.count} contribution${d.count === 1 ? '' : 's'} on ${d.date}` : undefined}
                    className={`gh-cell lvl-${loading ? 'x' : d ? d.level : 'none'}`}
                    style={{ width: CELL, height: CELL, animationDelay: loading ? `${(wi + di) * 30}ms` : undefined }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted">
            <span>{state.total != null ? `${state.total} contributions in the last year` : loading ? 'fetching…' : 'recent activity'}</span>
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              less {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`gh-cell lvl-${l}`} style={{ width: 9, height: 9 }} />)} more
            </span>
          </div>
        </div>

        {state.status === 'error' && (
          <p className="text-sm text-[#555555] dark:text-[#A0ABC0]">
            GitHub didn&apos;t answer just now. Everything&apos;s at{' '}
            <a className="underline underline-offset-4 text-ink" href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noreferrer">github.com/{GITHUB_USER}</a>.
          </p>
        )}

        {/* recently pushed repos */}
        {(loading || state.repos?.length > 0) && (
          <>
            <p className="mt-6 mb-2 font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Recently pushed</p>
            <ul className="border-t border-ink/25">
              {(loading ? [0, 1, 2] : state.repos).map((r, i) => (
                <li key={r.name ?? i} className="border-b border-ink/25">
                  {loading ? (
                    <div className="h-[58px] flex flex-col justify-center gap-2"><span className="gh-skel w-1/2 h-3" /><span className="gh-skel w-3/4 h-2.5" /></div>
                  ) : (
                    <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-start justify-between gap-3 py-3">
                      <span className="min-w-0">
                        <span className="block font-semibold text-ink group-hover:underline underline-offset-4 truncate">{r.name}</span>
                        {r.desc && <span className="block text-sm text-[#555555] dark:text-[#A0ABC0] truncate">{r.desc}</span>}
                      </span>
                      <span className="shrink-0 text-right font-mono text-[11px] text-muted leading-5">
                        {r.lang && <span className="block text-ink">{r.lang}</span>}
                        {timeAgo(r.pushed)}
                      </span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        {/* recent activity */}
        {!loading && state.events?.length > 0 && (
          <>
            <p className="mt-6 mb-2 font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Latest activity</p>
            <ul className="space-y-2 font-mono text-[12.5px] leading-snug">
              {state.events.map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted shrink-0 w-[58px]">{timeAgo(e.at)}</span>
                  <span className="text-ink min-w-0"><span className="font-semibold">{e.repo}</span> <span className="text-[#555555] dark:text-[#A0ABC0]">{e.text}</span></span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

function summarise(events) {
  const out = []
  for (const e of events) {
    const repo = e.repo?.name?.split('/')[1] ?? e.repo?.name
    if (e.type === 'PushEvent') {
      const msg = e.payload?.commits?.[e.payload.commits.length - 1]?.message?.split('\n')[0]
      const branch = e.payload?.ref?.replace('refs/heads/', '')
      out.push({ repo, at: e.created_at, text: msg ? `· ${msg}` : `· pushed to ${branch ?? 'a branch'}` })
    } else if (e.type === 'CreateEvent') {
      out.push({ repo, at: e.created_at, text: `· created ${e.payload?.ref_type ?? 'repo'}${e.payload?.ref ? ` ${e.payload.ref}` : ''}` })
    } else if (e.type === 'PullRequestEvent') {
      out.push({ repo, at: e.created_at, text: `· ${e.payload?.action} PR #${e.payload?.number}` })
    } else if (e.type === 'ReleaseEvent') {
      out.push({ repo, at: e.created_at, text: `· released ${e.payload?.release?.tag_name ?? ''}` })
    }
    if (out.length >= 5) break
  }
  return out
}

function daysFromEvents(events) {
  const counts = {}
  events.forEach((e) => {
    const d = e.created_at?.slice(0, 10)
    if (d) counts[d] = (counts[d] || 0) + (e.type === 'PushEvent' ? (e.payload?.size || 1) : 1)
  })
  const out = []
  const today = new Date()
  for (let i = 0; i < 7 * 30; i++) {
    const dt = new Date(today); dt.setDate(today.getDate() - i)
    const key = dt.toISOString().slice(0, 10)
    const c = counts[key] || 0
    out.push({ date: key, count: c, level: c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4 })
  }
  return out.reverse()
}

/** weeks × 7 matrix (Sun→Sat), most recent week last */
function buildCalendar(days, weeks) {
  const byDate = new Map((days || []).map((d) => [d.date, d]))
  const today = new Date()
  const end = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const start = new Date(end)
  start.setUTCDate(end.getUTCDate() - end.getUTCDay() - (weeks - 1) * 7)
  const out = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start)
      dt.setUTCDate(start.getUTCDate() + w * 7 + d)
      if (dt > end) { col.push(null); continue }
      const key = dt.toISOString().slice(0, 10)
      col.push(byDate.get(key) || { date: key, count: 0, level: 0 })
    }
    out.push(col)
  }
  return out
}


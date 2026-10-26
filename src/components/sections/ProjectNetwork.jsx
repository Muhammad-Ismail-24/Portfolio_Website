import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion'
import { projects } from '../../data/projects'
import { EVENTS, on, prefersReducedMotion, scrollToId } from '../../utils/bus'
import SplitHeading from '../ui/SplitHeading'

/* ════════════════════════════════════════════════════════════════════════════
   ProjectNetwork — the projects live inside the network.

   • Every project is a hub node: a pulsing core, a turning dashed orbit and a
     label. Small satellite nodes cluster round each hub, and a spine links
     hub 01 → 02 → … like the bridge in the background mesh.
   • Signal packets run along the strands, nodes drift on small orbits, and
     nearby nodes lean toward the cursor.
   • Click a hub: the network glides aside and zooms in on it, a wire draws out
     of the node and the project card unfolds from where the wire lands.
     ← / → hop along the spine, Esc closes.
   • "List" view shows the same projects as plain rows (also the fallback for
     anyone who'd rather not explore).
   ════════════════════════════════════════════════════════════════════════════ */

// Hub layout (0–1 of the stage) and which side each label sits on.
// Landscape and portrait variants.
const HUBS_WIDE = [
  [0.12, 0.34, 'right'], [0.32, 0.72, 'right'], [0.52, 0.27, 'right'], [0.7, 0.72, 'right'], [0.88, 0.44, 'left'],
]
const HUBS_TALL = [
  [0.26, 0.1, 'below'], [0.72, 0.27, 'below'], [0.28, 0.46, 'below'], [0.72, 0.64, 'below'], [0.3, 0.84, 'below'],
]

function mulberry32(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildGraph(w, h) {
  if (!w || !h) return null
  const tall = w < 720
  const rand = mulberry32(2611)
  const R = Math.max(54, Math.min(w, h) * (tall ? 0.15 : 0.13))
  const nodes = []
  const edges = []

  const layout = tall ? HUBS_TALL : HUBS_WIDE
  const hubs = projects.slice(0, layout.length).map((_, i) => {
    const [nx, ny, side] = layout[i]
    nodes.push({ x: nx * w, y: ny * h, kind: 'hub', hub: i, side })
    return nodes.length - 1
  })

  // Satellites round each hub
  hubs.forEach((hi, h) => {
    const count = 6
    const base = rand() * Math.PI * 2
    const mine = []
    for (let k = 0; k < count; k++) {
      const a = base + (k / count) * Math.PI * 2 + (rand() - 0.5) * 0.7
      const r = R * (0.62 + rand() * 0.45)
      nodes.push({ x: nodes[hi].x + Math.cos(a) * r, y: nodes[hi].y + Math.sin(a) * r * 0.85, kind: 'sat', hub: h })
      const si = nodes.length - 1
      mine.push(si)
      edges.push({ a: hi, b: si, kind: 'spoke', hubs: [h] })
    }
    // ring-ish links between neighbouring satellites
    for (let k = 0; k < mine.length; k++) {
      if (rand() < 0.62) edges.push({ a: mine[k], b: mine[(k + 1) % mine.length], kind: 'mesh', hubs: [h] })
    }
  })

  // The spine: 01 → 02 → … (through a midpoint node so it reads as a strand)
  for (let i = 0; i < hubs.length - 1; i++) {
    const A = nodes[hubs[i]]
    const B = nodes[hubs[i + 1]]
    nodes.push({ x: (A.x + B.x) / 2 + (rand() - 0.5) * R * 0.5, y: (A.y + B.y) / 2 + (rand() - 0.5) * R * 0.5, kind: 'bridge', hub: null })
    const mid = nodes.length - 1
    edges.push({ a: hubs[i], b: mid, kind: 'spine', hubs: [i, i + 1] })
    edges.push({ a: mid, b: hubs[i + 1], kind: 'spine', hubs: [i, i + 1] })
  }

  // Loose drifting nodes, wired to their nearest neighbours
  const freeCount = tall ? 10 : 16
  const minGap = R * 0.75
  let guard = 0
  while (nodes.filter((n) => n.kind === 'free').length < freeCount && guard++ < 600) {
    const x = (0.04 + rand() * 0.92) * w
    const y = (0.05 + rand() * 0.9) * h
    if (nodes.some((n) => Math.hypot(n.x - x, n.y - y) < minGap)) continue
    nodes.push({ x, y, kind: 'free', hub: null })
    const fi = nodes.length - 1
    const near = nodes
      .map((n, i) => ({ i, d: Math.hypot(n.x - x, n.y - y), kind: n.kind }))
      .filter((o) => o.i !== fi && o.kind !== 'hub')
      .sort((p, q) => p.d - q.d)
      .slice(0, 2)
      .filter((o) => o.d < R * 2.4)
    near.forEach((o) => edges.push({ a: fi, b: o.i, kind: 'mesh', hubs: [nodes[o.i].hub].filter((v) => v !== null) }))
  }

  // Per-node drift
  nodes.forEach((n) => {
    const amp = n.kind === 'hub' ? 5 : 7 + rand() * 7
    n.ax = amp * (0.6 + rand() * 0.4)
    n.ay = amp * (0.6 + rand() * 0.4)
    n.ph = rand() * Math.PI * 2
    n.sp = 0.25 + rand() * 0.35
  })

  return { nodes, edges, hubs, tall, R }
}

// Where the selected hub lands, how far we zoom, and where the card sits
function cameraFor(graph, w, h) {
  if (graph.tall) return { tx: w * 0.5, ty: h * 0.2, s: 1.3 }
  return { tx: w * 0.22, ty: h * 0.5, s: 1.35 }
}
function cardBox(graph, w, h) {
  if (graph.tall) return { left: w * 0.04, top: h * 0.38, width: w * 0.92 }
  const width = Math.min(520, w * 0.48)
  return { left: w - w * 0.035 - width, top: null, width }
}

const pad2 = (n) => String(n + 1).padStart(2, '0')

export default function ProjectNetwork() {
  const sectionRef = useRef(null)
  const stageRef = useRef(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState('network')
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [booted, setBooted] = useState(false)
  const [explored, setExplored] = useState(false)
  const reduced = useMemo(prefersReducedMotion, [])

  const graph = useMemo(() => buildGraph(size.w, size.h), [size.w, size.h])

  // Camera (the network glides + zooms toward the selected hub)
  const camX = useMotionValue(0)
  const camY = useMotionValue(0)
  const camS = useMotionValue(1)

  // DOM refs, written every frame by the animation loop
  const nodeEls = useRef([])
  const edgeEls = useRef([])
  const hubEls = useRef([])
  const packetEls = useRef([])
  const pointer = useRef(null)
  const inView = useRef(false)

  /* ── Measure the stage ─────────────────── */
  useLayoutEffect(() => {
    const el = stageRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) => (Math.abs(s.w - width) > 1 || Math.abs(s.h - height) > 1 ? { w: width, h: height } : s))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [view])

  /* ── Boot when scrolled into view, dim the background mesh meanwhile ── */
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        inView.current = entry.isIntersecting
        if (entry.intersectionRatio > 0.25) setBooted(true)
        document.documentElement.toggleAttribute('data-mesh-dim', entry.intersectionRatio > 0.35)
      },
      { threshold: [0, 0.25, 0.35, 0.6] },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      document.documentElement.removeAttribute('data-mesh-dim')
    }
  }, [])

  /* ── Camera moves ──────────────────────── */
  useEffect(() => {
    if (!graph) return
    const spring = reduced ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 20, mass: 0.9 }
    if (selected === null) {
      animate(camX, 0, spring)
      animate(camY, 0, spring)
      animate(camS, 1, spring)
      return
    }
    const hub = graph.nodes[graph.hubs[selected]]
    const { tx, ty, s } = cameraFor(graph, size.w, size.h)
    animate(camX, tx - hub.x * s, spring)
    animate(camY, ty - hub.y * s, spring)
    animate(camS, s, spring)
  }, [selected, graph, size.w, size.h, reduced, camX, camY, camS])

  /* ── Animation loop: drift, cursor tug, packets ───────────────── */
  useEffect(() => {
    if (!graph) return
    const { nodes, edges } = graph
    const pos = nodes.map((n) => ({ x: n.x, y: n.y, tx: 0, ty: 0 }))

    // Packets random-walk along strands
    const adj = nodes.map(() => [])
    edges.forEach((e, i) => { adj[e.a].push(i); adj[e.b].push(i) })
    const packets = Array.from({ length: graph.tall ? 7 : 11 }, (_, k) => {
      const ei = (k * 7) % edges.length
      return { e: ei, from: edges[ei].a, t: (k * 0.37) % 1, speed: 70 + ((k * 29) % 50) }
    })

    const write = () => {
      for (let i = 0; i < nodes.length; i++) {
        nodeEls.current[i]?.setAttribute('transform', `translate(${pos[i].x.toFixed(2)} ${pos[i].y.toFixed(2)})`)
      }
      for (let i = 0; i < edges.length; i++) {
        const el = edgeEls.current[i]
        if (!el) continue
        const A = pos[edges[i].a]
        const B = pos[edges[i].b]
        el.setAttribute('x1', A.x.toFixed(2)); el.setAttribute('y1', A.y.toFixed(2))
        el.setAttribute('x2', B.x.toFixed(2)); el.setAttribute('y2', B.y.toFixed(2))
      }
      graph.hubs.forEach((ni, h) => {
        const el = hubEls.current[h]
        if (el) el.style.transform = `translate(${pos[ni].x.toFixed(2)}px, ${pos[ni].y.toFixed(2)}px)`
      })
    }

    if (reduced) { write(); return }

    let raf = 0
    let last = performance.now()
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (!inView.current) { last = now; return }
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000

      // pointer in graph space (undo the camera)
      let px = null
      let py = null
      if (pointer.current) {
        const s = camS.get()
        px = (pointer.current.x - camX.get()) / s
        py = (pointer.current.y - camY.get()) / s
      }
      const R = 150
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const bx = n.x + Math.sin(t * n.sp + n.ph) * n.ax
        const by = n.y + Math.cos(t * n.sp * 0.83 + n.ph) * n.ay
        let gx = 0
        let gy = 0
        if (px !== null) {
          const dx = px - bx
          const dy = py - by
          const d = Math.hypot(dx, dy)
          if (d < R && d > 0.001) {
            const pull = Math.pow(1 - d / R, 2) * (n.kind === 'hub' ? 10 : 22)
            gx = (dx / d) * pull
            gy = (dy / d) * pull
          }
        }
        pos[i].tx += (gx - pos[i].tx) * Math.min(1, dt * 7)
        pos[i].ty += (gy - pos[i].ty) * Math.min(1, dt * 7)
        pos[i].x = bx + pos[i].tx
        pos[i].y = by + pos[i].ty
      }
      write()

      packets.forEach((p, k) => {
        const e = edges[p.e]
        const A = pos[p.from]
        const to = p.from === e.a ? e.b : e.a
        const B = pos[to]
        const len = Math.max(1, Math.hypot(B.x - A.x, B.y - A.y))
        p.t += (dt * p.speed) / len
        if (p.t >= 1) {
          // hop on: prefer strands leading toward a hub
          const options = adj[to].filter((ei) => ei !== p.e)
          const pick = options.length ? options[Math.floor(Math.random() * options.length)] : p.e
          p.e = pick
          p.from = to
          p.t = 0
          return
        }
        const el = packetEls.current[k]
        if (el) {
          el.setAttribute('cx', (A.x + (B.x - A.x) * p.t).toFixed(2))
          el.setAttribute('cy', (A.y + (B.y - A.y) * p.t).toFixed(2))
        }
      })
    }
    write()
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [graph, reduced, camX, camY, camS])

  /* ── Open / close / hop ────────────────── */
  const open = useCallback((i) => {
    setExplored(true)
    setSelected(i)
    // bring the whole stage into view so the card isn't below the fold
    const stage = stageRef.current
    if (stage) {
      const r = stage.getBoundingClientRect()
      if (r.top < 0 || r.bottom > window.innerHeight) {
        const y = window.scrollY + r.top - Math.max(16, (window.innerHeight - r.height) / 2)
        if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.9 })
        else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      }
    }
  }, [])
  const close = useCallback(() => {
    setSelected((cur) => {
      if (cur !== null) requestAnimationFrame(() => hubEls.current[cur]?.focus({ preventScroll: true }))
      return null
    })
  }, [])

  useEffect(() => {
    if (selected === null) return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea, [contenteditable="true"]')) return
      if (e.key === 'Escape') { e.preventDefault(); close() }
      if (e.key === 'ArrowRight') { e.preventDefault(); setSelected((s) => (s + 1) % projects.length) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setSelected((s) => (s - 1 + projects.length) % projects.length) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, close])

  // Terminal: `open 3`
  useEffect(() => on(EVENTS.openProject, ({ index }) => {
    if (index == null || !projects[index]) return
    setView('network')
    setBooted(true)
    scrollToId('projects')
    setTimeout(() => open(index), 650)
  }), [open])

  const active = selected ?? hovered
  const isLit = (edge) => active !== null && edge.hubs.includes(active)

  const card = graph && selected !== null ? cardBox(graph, size.w, size.h) : null
  const cam = graph && selected !== null ? cameraFor(graph, size.w, size.h) : null
  const wireEnd = card
    ? graph.tall
      ? { x: size.w / 2, y: card.top }
      : { x: card.left, y: size.h / 2 }
    : null

  return (
    <section
      id="projects"
      ref={sectionRef}
      className="relative z-10 w-full min-h-screen flex flex-col pt-24 pb-12 px-6 md:px-16 lg:px-24"
    >
      {/* ── Heading row ─────────────────────── */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted mb-3">
            Project network · {String(projects.length).padStart(2, '0')} nodes
          </p>
          <SplitHeading solid="Featured" hollow="Projects." className="text-[11vw] md:text-[8vw] lg:text-[6.5vw]" />
        </div>

        <div className="flex items-center gap-4">
          <div role="group" aria-label="Project view" className="flex border-2 border-ink">
            {['network', 'list'].map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => { setView(v); setSelected(null) }}
                className={`px-4 min-h-[44px] text-sm font-semibold tracking-wide capitalize transition-colors ${
                  view === v ? 'bg-ink text-canvas' : 'text-ink hover:bg-ink/[0.06]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'list' ? (
        <ProjectList onOpen={(i) => { setView('network'); setTimeout(() => open(i), 80) }} />
      ) : (
        <>
          <p className="mt-6 font-mono text-xs md:text-sm text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <span className="pn-live-dot" aria-hidden="true" /> Click a node to open a project
            </span>
            <span className="hidden md:inline">· ← → hop between nodes · Esc to close</span>
          </p>

          {/* ── Stage ─────────────────────────── */}
          <div
            ref={stageRef}
            className={`pn-stage relative mt-4 w-full h-[780px] md:h-[72vh] md:min-h-[580px] md:max-h-[780px] overflow-hidden border-2 border-ink rounded-xl bg-[#F4EFE6]/70 dark:bg-[#080A17]/70 backdrop-blur-[2px] ${booted ? 'is-booted' : ''} ${active !== null ? 'has-active' : ''} ${selected !== null ? 'has-selected' : ''} ${size.w < 1100 ? 'is-compact' : ''}`}
            onPointerMove={(e) => {
              const r = stageRef.current.getBoundingClientRect()
              pointer.current = { x: e.clientX - r.left, y: e.clientY - r.top }
            }}
            onPointerLeave={() => { pointer.current = null }}
            onClick={(e) => {
              if (selected !== null && !e.target.closest('.pn-card, .pn-hub')) close()
            }}
          >
            {/* corner registration marks, blueprint-style */}
            <span aria-hidden="true" className="pn-mark left-3 top-3" />
            <span aria-hidden="true" className="pn-mark right-3 top-3 rotate-90" />
            <span aria-hidden="true" className="pn-mark right-3 bottom-3 rotate-180" />
            <span aria-hidden="true" className="pn-mark left-3 bottom-3 -rotate-90" />

            {graph && (
              <motion.div
                className="absolute inset-0 origin-top-left"
                style={{ x: camX, y: camY, scale: camS }}
              >
                <svg width={size.w} height={size.h} className="absolute inset-0 overflow-visible" aria-hidden="true">
                  {/* strands */}
                  <g>
                    {graph.edges.map((e, i) => (
                      <line
                        key={i}
                        ref={(el) => (edgeEls.current[i] = el)}
                        x1={graph.nodes[e.a].x} y1={graph.nodes[e.a].y}
                        x2={graph.nodes[e.b].x} y2={graph.nodes[e.b].y}
                        pathLength="1"
                        className={`pn-edge pn-edge--${e.kind} ${isLit(e) ? 'is-lit' : ''}`}
                        style={{ '--d': `${(i % 23) * 45}ms` }}
                      />
                    ))}
                  </g>

                  {/* packets */}
                  <g>
                    {Array.from({ length: graph.tall ? 7 : 11 }, (_, k) => (
                      <circle key={k} ref={(el) => (packetEls.current[k] = el)} r="3" className="pn-packet" cx="-20" cy="-20" />
                    ))}
                  </g>

                  {/* nodes */}
                  <g>
                    {graph.nodes.map((n, i) => (
                      <g key={i} ref={(el) => (nodeEls.current[i] = el)} transform={`translate(${n.x} ${n.y})`}>
                        {n.kind === 'hub' ? (
                          <HubGlyph index={n.hub} active={active === n.hub} selected={selected === n.hub} />
                        ) : (
                          <circle
                            r={n.kind === 'bridge' ? 4.5 : n.kind === 'sat' ? 3.6 : 3}
                            className={`pn-node ${active !== null && n.hub === active ? 'is-lit' : ''}`}
                            style={{ '--d': `${300 + (i % 17) * 40}ms` }}
                          />
                        )}
                      </g>
                    ))}
                  </g>
                </svg>

                {/* real, focusable hub buttons + labels (HTML so they're accessible) */}
                {graph.hubs.map((ni, h) => {
                  const n = graph.nodes[ni]
                  const p = projects[h]
                  const flip = n.side === 'left'
                  const labelBelow = n.side === 'below'
                  return (
                    <button
                      key={p.id}
                      ref={(el) => (hubEls.current[h] = el)}
                      type="button"
                      className={`pn-hub ${active === h ? 'is-active' : ''} ${selected === h ? 'is-selected' : ''}`}
                      style={{ transform: `translate(${n.x}px, ${n.y}px)`, '--d': `${450 + h * 140}ms` }}
                      aria-label={`Open project ${pad2(h)}: ${p.title}`}
                      aria-expanded={selected === h}
                      onMouseEnter={() => setHovered(h)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(h)}
                      onBlur={() => setHovered(null)}
                      onClick={(e) => { e.stopPropagation(); selected === h ? close() : open(h) }}
                    >
                      <span className="pn-hub-hit" aria-hidden="true" />
                      <span
                        aria-hidden="true"
                        className={`pn-label ${flip ? 'is-flipped' : ''} ${labelBelow ? 'is-below' : ''}`}
                      >
                        <span className="pn-label-idx">{pad2(h)}</span>
                        <span className="pn-label-title">{p.title}</span>
                        <span className="pn-label-blurb">{p.blurb}</span>
                      </span>
                      {h === 0 && !explored && (
                        <span aria-hidden="true" className="pn-callout">Start here ↓</span>
                      )}
                    </button>
                  )
                })}
              </motion.div>
            )}

            {/* wire from the selected node to its card */}
            <AnimatePresence>
              {graph && selected !== null && cam && wireEnd && (
                <motion.svg
                  key={`wire-${selected}`}
                  className="absolute inset-0 pointer-events-none"
                  width={size.w}
                  height={size.h}
                  aria-hidden="true"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <motion.path
                    d={graph.tall
                      ? `M ${cam.tx} ${cam.ty + 26} L ${cam.tx} ${(cam.ty + wireEnd.y) / 2} L ${wireEnd.x} ${(cam.ty + wireEnd.y) / 2} L ${wireEnd.x} ${wireEnd.y}`
                      : `M ${cam.tx + 26} ${cam.ty} L ${(cam.tx + wireEnd.x) / 2} ${cam.ty} L ${(cam.tx + wireEnd.x) / 2} ${wireEnd.y} L ${wireEnd.x} ${wireEnd.y}`}
                    className="pn-wire"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : 0.25, ease: 'easeOut' }}
                  />
                  <circle cx={wireEnd.x} cy={wireEnd.y} r="5" className="pn-wire-end" />
                </motion.svg>
              )}
            </AnimatePresence>

            {/* the card unfolds from where the wire lands */}
            <AnimatePresence mode="wait">
              {graph && selected !== null && card && (
                <ProjectCard
                  key={projects[selected].id}
                  index={selected}
                  box={card}
                  tall={graph.tall}
                  reduced={reduced}
                  onClose={close}
                  onPrev={() => setSelected((s) => (s - 1 + projects.length) % projects.length)}
                  onNext={() => setSelected((s) => (s + 1) % projects.length)}
                />
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </section>
  )
}

/* ── Hub glyph (SVG) ─────────────────────── */
function HubGlyph({ index, active, selected }) {
  return (
    <g className={`pn-hubglyph ${active ? 'is-active' : ''} ${selected ? 'is-selected' : ''}`} style={{ '--d': `${450 + index * 140}ms` }}>
      <circle r="22" className="pn-pulse" style={{ animationDelay: `${index * 0.45}s` }} />
      <circle r="22" className="pn-pulse" style={{ animationDelay: `${index * 0.45 + 1.2}s` }} />
      <circle r="34" className="pn-orbit" />
      <circle r="21" className="pn-ring" />
      <circle r="7" className="pn-core" />
    </g>
  )
}

/* ── Card ────────────────────────────────── */
function ProjectCard({ index, box, tall, reduced, onClose, onPrev, onNext }) {
  const p = projects[index]
  const headRef = useRef(null)
  const [imgOk, setImgOk] = useState(true)
  const origin = tall ? '50% 0%' : '0% 50%'

  useEffect(() => {
    const t = setTimeout(() => headRef.current?.focus({ preventScroll: true }), reduced ? 0 : 380)
    return () => clearTimeout(t)
  }, [reduced])

  const words = p.title.split(' ')
  const solid = words.length > 1 ? words.slice(0, -1).join(' ') : p.title
  const hollow = words.length > 1 ? words[words.length - 1] : null

  return (
    <motion.article
      className="pn-card absolute z-20 flex flex-col overflow-y-auto overscroll-contain bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-ink rounded-xl shadow-[8px_8px_0_0_var(--color-ink)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.18)]"
      style={{
        left: box.left,
        width: box.width,
        ...(tall ? { top: box.top, bottom: 16 } : { top: '50%', y: '-50%', maxHeight: 'calc(100% - 48px)' }),
      }}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`pn-title-${p.id}`}
      data-lenis-prevent
      initial={reduced ? { opacity: 0 } : { clipPath: `circle(0% at ${origin})`, opacity: 1 }}
      animate={reduced ? { opacity: 1 } : { clipPath: `circle(150% at ${origin})`, opacity: 1 }}
      exit={reduced ? { opacity: 0 } : { clipPath: `circle(0% at ${origin})`, transition: { duration: 0.28, ease: 'easeIn' } }}
      transition={{ duration: reduced ? 0 : 0.65, delay: reduced ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b-2 border-ink">
        <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted">
          Node {pad2(index)} / {pad2(projects.length - 1)}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="w-11 h-11 -mr-2 flex items-center justify-center rounded-full border border-ink/40 text-ink hover:bg-ink hover:text-canvas transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-3.5">
        {/* preview */}
        <div className="pn-preview relative w-full aspect-[16/7] max-h-[22vh] rounded-lg overflow-hidden border border-ink/20">
          {imgOk && (
            <img src={p.image} alt={`${p.title} screenshot`} className="absolute inset-0 w-full h-full object-cover" onError={() => setImgOk(false)} />
          )}
          {!imgOk && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono text-xs tracking-[0.2em] uppercase text-muted bg-[#F4EFE6] dark:bg-[#080A17] px-3 py-1 border border-ink/30">
                Preview coming soon
              </span>
            </div>
          )}
        </div>

        <h3
          id={`pn-title-${p.id}`}
          ref={headRef}
          tabIndex={-1}
          className="outline-none text-4xl md:text-5xl font-bold tracking-tighter leading-[0.95] text-ink"
        >
          {solid}{hollow && <> <span className="text-hollow">{hollow}</span></>}
        </h3>

        <p className="text-base font-medium leading-relaxed text-[#555555] dark:text-[#A0ABC0]">{p.description}</p>

        <ul className="flex flex-wrap gap-2" aria-label="Tech">
          {p.tags.map((t) => (
            <li key={t} className="px-2.5 py-1 border border-ink text-xs font-semibold tracking-wide text-ink">{t}</li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-3 pt-1">
          <a href={p.demo} className="inline-flex items-center gap-2 px-5 min-h-[44px] bg-ink text-canvas border-2 border-ink font-semibold text-sm hover:opacity-80 transition-opacity">
            Video Demo <span aria-hidden="true">→</span>
          </a>
          <a href={p.source} className="inline-flex items-center gap-2 px-5 min-h-[44px] border-2 border-ink text-ink font-semibold text-sm hover:bg-ink hover:text-canvas transition-colors">
            Source
          </a>
        </div>

        {/* hop along the spine */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-ink/20">
          <button type="button" onClick={onPrev} className="min-h-[44px] pr-3 font-mono text-xs tracking-widest uppercase text-ink/80 hover:text-ink">
            ← Prev node
          </button>
          <button type="button" onClick={onNext} className="min-h-[44px] pl-3 font-mono text-xs tracking-widest uppercase text-ink/80 hover:text-ink">
            Next node →
          </button>
        </div>
      </div>
    </motion.article>
  )
}

/* ── List view ───────────────────────────── */
function ProjectList({ onOpen }) {
  return (
    <ol className="mt-10 w-full border-t-2 border-ink">
      {projects.map((p, i) => (
        <li key={p.id} className="grid grid-cols-1 md:grid-cols-[80px_1.1fr_1.6fr_auto] gap-x-8 gap-y-3 py-7 border-b border-ink/25">
          <span className="font-mono text-sm text-muted pt-2">{pad2(i)}</span>
          <div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-ink leading-none">{p.title}</h3>
            <ul className="flex flex-wrap gap-2 mt-4" aria-label="Tech">
              {p.tags.map((t) => (
                <li key={t} className="px-2 py-0.5 border border-ink/60 text-xs font-semibold text-ink">{t}</li>
              ))}
            </ul>
          </div>
          <p className="text-base font-medium leading-relaxed text-[#555555] dark:text-[#A0ABC0]">{p.description}</p>
          <div className="flex md:flex-col gap-3 md:items-end">
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="inline-flex items-center gap-2 px-4 min-h-[44px] border-2 border-ink text-ink text-sm font-semibold hover:bg-ink hover:text-canvas transition-colors whitespace-nowrap"
            >
              Open in network <span aria-hidden="true">↗</span>
            </button>
            <a href={p.demo} className="inline-flex items-center px-4 min-h-[44px] text-sm font-semibold text-ink underline underline-offset-4">Demo</a>
          </div>
        </li>
      ))}
    </ol>
  )
}

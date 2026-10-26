import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/* ════════════════════════════════════════════════════════════════════════════
   StaticNeuromesh — the original diagonal mesh, scaled to fit, twisting on scroll

   MESH
     • The exact 30 nodes and the exact 350-unit connection rule from the
       original SVG.
     • It is scaled up (and slightly turned) so the two hubs sit in the top-
       right and bottom-left corners of whatever screen you are on, with the
       bridge running corner to corner between them.

   SIZE
     • Orthographic camera → no perspective → rings and lines never grow or
       shrink while the mesh moves.

   MOTION
     • No rigid rotation — the mesh always stays on the diagonal. Every node
       circles clockwise on its own small orbit, so each strand swings and
       rotates by itself, and each cluster swirls clockwise as you scroll down.
     • Orbit phases form a wave along the diagonal; scrolling pushes it forward
       through the mesh (top-right → bottom-left), scrolling up reverses it.
     • At scroll 0 every node sits exactly on its original position.

   TOUCHES
     • Theme switch: the mesh powers back on node by node, a wave running
       top-right → bottom-left, each node flashing solid as it comes online.
     • Cursor: nearby nodes lean toward the pointer.
     • Click any empty spot: a new node pops in there and wires itself to its
       nearest neighbours (up to MAX_EXTRA; then the oldest one is recycled).
   ════════════════════════════════════════════════════════════════════════════ */

// ─── Framing: world unit = 1 SVG unit, "xMidYMid slice" (cover) ─────────────
const SVG_W = 1440
const SVG_H = 900

// ─── Look ───────────────────────────────────────────────────────────────────
const NODE_RADIUS = 3.5
const NODE_STROKE = 1.5
const LINE_WIDTH = 1.25
const MAX_DIST = 350      // original connection rule (in original SVG units)

const COLORS = {
  light: { stroke: '#1A1A1A', fill: '#F5F3EC' },
  dark: { stroke: '#FFFFFF', fill: '#111111' },
}

// ─── Fit — how the mesh is scaled to the screen ─────────────────────────────
const FIT_REACH = 1.1           // 1 = hub centres sit exactly ON the corners. Higher = bigger mesh
                                // (hubs pushed further off-screen). Lower = smaller.
                                // Sweet spot is ~1.0–1.2; above ~1.25 the hub clusters leave the
                                // screen and only their strands remain. Orbits scale with it too,
                                // so a bigger value also means bigger, easier-to-see rotation.
const ALIGN_TO_DIAGONAL = true  // slightly turn the mesh so it runs exactly corner to corner.
                                // false = keep the original angle.

// ─── Motion — tweak these to change the feel ────────────────────────────────
const PX_PER_TURN = 1200  // scroll pixels for one full orbit (smaller = faster)
const ORBIT_MIN = 28      // smallest orbit radius (original SVG units)
const ORBIT_MAX = 50      // largest orbit radius
const WAVE_CYCLES = 2.5   // wave crests along the diagonal (more = tighter ripple)
const DAMPING = 10        // scroll smoothing (lower = silkier, higher = snappier)
const CLOCKWISE = true    // direction each node circles as you scroll down (false = anticlockwise)
const SEED = 5664         // same seed → same motion every load. This one is picked so both hubs,
                          // the bridge and the strands all swirl clockwise at every scroll position
                          // (most seeds rock back and forth; e.g. 7 turned the top-right hub
                          // anticlockwise for the first ~150px). Changing it changes that.

// ─── Touches ────────────────────────────────────────────────────────────────
const POWER_MS = 1300       // theme switch: how long the power-on wave takes
const TUG_RADIUS_PX = 170   // cursor pull reaches this far (screen px)
const TUG_MAX_PX = 26       // strongest pull (screen px)
const MAX_EXTRA = 18        // nodes visitors can add by clicking
const EXTRA_LINKS = 4       // each added node wires to up to this many neighbours
const BIRTH_MS = 650        // pop-in time for an added node

// ─── Nodes: exact positions from the original SVG ───────────────────────────
const RAW_NODES = [
  // Top-Right Hub (first 12)
  { x: 1380, y: -20 }, { x: 1270, y: 30 }, { x: 1170, y: -40 }, { x: 1400, y: 130 },
  { x: 1300, y: 110 }, { x: 1190, y: 80 }, { x: 1090, y: 150 }, { x: 990, y: 70 },
  { x: 1340, y: 250 }, { x: 1230, y: 210 }, { x: 1120, y: 290 }, { x: 1010, y: 240 },
  // Diagonal Bridge
  { x: 930, y: 340 }, { x: 840, y: 380 }, { x: 770, y: 310 },
  { x: 690, y: 410 }, { x: 610, y: 470 }, { x: 530, y: 530 },
  // Bottom-Left Hub (last 12)
  { x: 470, y: 630 }, { x: 380, y: 670 }, { x: 300, y: 620 }, { x: 420, y: 750 },
  { x: 330, y: 740 }, { x: 240, y: 700 }, { x: 150, y: 660 }, { x: 60, y: 730 },
  { x: -30, y: 680 }, { x: 270, y: 830 }, { x: 160, y: 810 }, { x: 70, y: 870 },
]

// ─── Helpers ────────────────────────────────────────────────────────────────
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

// Raw sRGB triplet — shaders write straight to the framebuffer, so we skip
// THREE.Color (which would convert to linear space and darken everything).
function hexToVec3(hex) {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const readScroll = () =>
  typeof window === 'undefined' || prefersReducedMotion() ? 0 : window.scrollY

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOutBack = (t) => {
  const c1 = 1.9
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

// ─── Shaders ────────────────────────────────────────────────────────────────
// Strands are camera-facing quads with a constant pixel width (native WebGL
// lines are stuck at 1px). Orthographic → w is always 1, so width never varies.
const EDGE_VERT = /* glsl */ `
  uniform vec2  uRes;     // css px
  uniform float uWidth;   // css px
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec2 aCorner; // x: 0=start 1=end, y: -1/+1 side
  attribute float aAlpha; // power-on / pop-in visibility
  varying float vAcross;
  varying float vHalf;
  varying float vAlpha;

  void main() {
    vec4 cs = projectionMatrix * modelViewMatrix * vec4(aStart, 1.0);
    vec4 ce = projectionMatrix * modelViewMatrix * vec4(aEnd, 1.0);

    vec2 ss = cs.xy / cs.w * 0.5 * uRes;
    vec2 se = ce.xy / ce.w * 0.5 * uRes;
    vec2 dir = se - ss;
    float len = length(dir);
    dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);

    vec4 cur = aCorner.x < 0.5 ? cs : ce;
    float hw = 0.5 * uWidth;
    float ext = hw + 1.0; // +1px margin for anti-aliasing

    cur.xy += (nrm * aCorner.y * ext / (0.5 * uRes)) * cur.w;

    gl_Position = cur;
    vAcross = aCorner.y * ext;
    vHalf = hw;
    vAlpha = aAlpha;
  }
`

const EDGE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAcross;
  varying float vHalf;
  varying float vAlpha;

  void main() {
    float a = (1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vAcross))) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

// Nodes are point sprites drawn as analytic hollow rings.
// aLit fills a ring solid (power-on flash, newly added node).
const NODE_VERT = /* glsl */ `
  uniform float uScale;    // css px per SVG unit
  uniform float uPxRatio;  // device pixel ratio
  uniform float uRadius;   // SVG units
  uniform float uStroke;   // SVG units
  attribute float aSize;
  attribute float aVis;
  attribute float aLit;
  varying float vR;
  varying float vHs;
  varying float vSize;
  varying float vVis;
  varying float vLit;

  void main() {
    float k = uScale * uPxRatio; // device px per SVG unit
    float grow = aSize * (1.0 + 0.7 * aLit);
    vR  = uRadius * k * grow;
    vHs = 0.5 * uStroke * k;
    vSize = 2.0 * (uRadius * k * 1.9 + vHs) + 3.0;
    gl_PointSize = vSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vVis = aVis;
    vLit = aLit;
  }
`

const NODE_FRAG = /* glsl */ `
  uniform vec3 uStrokeColor;
  uniform vec3 uFillColor;
  varying float vR;
  varying float vHs;
  varying float vSize;
  varying float vVis;
  varying float vLit;

  void main() {
    if (vR < 0.05) discard;
    float d = length((gl_PointCoord - 0.5) * vSize);
    float aa = 0.75;
    float ring = 1.0 - smoothstep(vHs - aa, vHs + aa, abs(d - vR));
    float fill = 1.0 - smoothstep(vR - aa, vR + aa, d);
    float a = max(ring, fill) * vVis;
    if (a < 0.003) discard;
    vec3 col = mix(mix(uFillColor, uStrokeColor, ring), uStrokeColor, vLit);
    gl_FragColor = vec4(col, a);
  }
`

// ─── Build everything once ──────────────────────────────────────────────────
function createScene() {
  const rand = mulberry32(SEED)
  const extraRand = mulberry32(SEED + 1)
  const BASE = RAW_NODES.length
  const N_MAX = BASE + MAX_EXTRA

  // World positions (y flipped so "up" is +y)
  const wx = new Float32Array(BASE)
  const wy = new Float32Array(BASE)
  RAW_NODES.forEach((p, i) => {
    wx[i] = p.x - SVG_W / 2
    wy[i] = SVG_H / 2 - p.y
  })

  // Hub centroids → the mesh's diagonal axis (top-right hub → bottom-left hub)
  let ax = 0, ay = 0, cx = 0, cy = 0
  for (let i = 0; i < 12; i++) { ax += wx[i]; ay += wy[i] }
  for (let i = BASE - 12; i < BASE; i++) { cx += wx[i]; cy += wy[i] }
  ax /= 12; ay /= 12; cx /= 12; cy /= 12
  const mx = (ax + cx) / 2 // hub midpoint: the pivot for scaling/turning
  const my = (ay + cy) / 2
  const vx = cx - ax
  const vy = cy - ay
  const hubLen = Math.hypot(vx, vy)
  const hubAngle = Math.atan2(vy, vx)

  // Base positions centred on the hub midpoint (the group is scaled/turned about it)
  const bx = new Float32Array(N_MAX)
  const by = new Float32Array(N_MAX)
  for (let i = 0; i < BASE; i++) {
    bx[i] = wx[i] - mx
    by[i] = wy[i] - my
  }

  // Position of each node along the axis, normalised 0 → 1
  const dx = vx / hubLen
  const dy = vy / hubLen
  const along = new Float32Array(N_MAX)
  let tMin = Infinity
  let tMax = -Infinity
  for (let i = 0; i < BASE; i++) {
    along[i] = bx[i] * dx + by[i] * dy
    tMin = Math.min(tMin, along[i])
    tMax = Math.max(tMax, along[i])
  }
  const order = new Float32Array(N_MAX) // 0 = top-right end, 1 = bottom-left end
  const orderOf = (x, y) => clamp01(((x * dx + y * dy) - tMin) / (tMax - tMin))
  for (let i = 0; i < BASE; i++) order[i] = orderOf(bx[i], by[i])

  // Per-node orbit (an ellipse).  Displacement = offset(θ0 + a) − offset(θ0),
  // so it is exactly zero at scroll 0 and the mesh matches the original.
  const majX = new Float32Array(N_MAX)
  const majY = new Float32Array(N_MAX)
  const minX = new Float32Array(N_MAX)
  const minY = new Float32Array(N_MAX)
  const c0 = new Float32Array(N_MAX)
  const s0 = new Float32Array(N_MAX)
  const sense = CLOCKWISE ? -1 : 1 // world is y-up, so +1 turns anticlockwise
  const setOrbit = (i, u, r) => {
    const theta0 = -u * WAVE_CYCLES * Math.PI * 2 + (r() - 0.5) * 1.4
    const radius = ORBIT_MIN + r() * (ORBIT_MAX - ORBIT_MIN)
    const squash = 0.55 + r() * 0.45          // 0.55 = flat ellipse, 1 = circle
    const tilt = r() * Math.PI                // orientation of the ellipse
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    majX[i] = radius * ct
    majY[i] = radius * st
    minX[i] = -sense * radius * squash * st
    minY[i] = sense * radius * squash * ct
    c0[i] = Math.cos(theta0)
    s0[i] = Math.sin(theta0)
  }
  for (let i = 0; i < BASE; i++) setOrbit(i, (along[i] - tMin) / (tMax - tMin), rand)

  // Connections: the original rule, measured in original SVG units
  const basePairs = []
  for (let i = 0; i < BASE; i++) {
    for (let j = i + 1; j < BASE; j++) {
      if (Math.hypot(bx[i] - bx[j], by[i] - by[j]) < MAX_DIST) basePairs.push(i, j)
    }
  }

  // Visitor-added nodes live in slots BASE … N_MAX-1
  let extraCount = 0
  let nextSlot = 0
  const birth = new Float64Array(N_MAX).fill(-1e9)
  const extraLinks = Array.from({ length: MAX_EXTRA }, () => [])
  let pairs = basePairs.slice()
  const rebuildPairs = () => {
    pairs = basePairs.slice()
    for (let s = 0; s < extraCount; s++) extraLinks[s].forEach((j) => pairs.push(BASE + s, j))
  }

  const E_MAX = basePairs.length / 2 + MAX_EXTRA * EXTRA_LINKS

  // ── Edge geometry: 4 verts (a quad) per strand ──
  const aStart = new Float32Array(E_MAX * 4 * 3)
  const aEnd = new Float32Array(E_MAX * 4 * 3)
  const aCorner = new Float32Array(E_MAX * 4 * 2)
  const aAlpha = new Float32Array(E_MAX * 4)
  const index = new Uint32Array(E_MAX * 6)
  for (let e = 0; e < E_MAX; e++) {
    for (let v = 0; v < 4; v++) {
      aCorner[(e * 4 + v) * 2] = v >= 2 ? 1 : 0
      aCorner[(e * 4 + v) * 2 + 1] = v % 2 === 0 ? -1 : 1
    }
    const b = e * 4
    index.set([b, b + 1, b + 2, b + 2, b + 1, b + 3], e * 6)
  }
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(E_MAX * 4 * 3), 3))
  edgeGeo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3).setUsage(THREE.DynamicDrawUsage))
  edgeGeo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3).setUsage(THREE.DynamicDrawUsage))
  edgeGeo.setAttribute('aCorner', new THREE.BufferAttribute(aCorner, 2))
  edgeGeo.setAttribute('aAlpha', new THREE.BufferAttribute(aAlpha, 1).setUsage(THREE.DynamicDrawUsage))
  edgeGeo.setIndex(new THREE.BufferAttribute(index, 1))

  // ── Node geometry ──
  const nodePos = new Float32Array(N_MAX * 3)
  const aSize = new Float32Array(N_MAX)
  const aVis = new Float32Array(N_MAX)
  const aLit = new Float32Array(N_MAX)
  const nodeGeo = new THREE.BufferGeometry()
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3).setUsage(THREE.DynamicDrawUsage))
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1).setUsage(THREE.DynamicDrawUsage))
  nodeGeo.setAttribute('aVis', new THREE.BufferAttribute(aVis, 1).setUsage(THREE.DynamicDrawUsage))
  nodeGeo.setAttribute('aLit', new THREE.BufferAttribute(aLit, 1).setUsage(THREE.DynamicDrawUsage))

  // ── Materials ──
  const edgeMat = new THREE.ShaderMaterial({
    vertexShader: EDGE_VERT,
    fragmentShader: EDGE_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uWidth: { value: LINE_WIDTH },
      uColor: { value: hexToVec3(COLORS.light.stroke) },
    },
  })
  const nodeMat = new THREE.ShaderMaterial({
    vertexShader: NODE_VERT,
    fragmentShader: NODE_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uScale: { value: 1 },
      uPxRatio: { value: 1 },
      uRadius: { value: NODE_RADIUS },
      uStroke: { value: NODE_STROKE },
      uStrokeColor: { value: hexToVec3(COLORS.light.stroke) },
      uFillColor: { value: hexToVec3(COLORS.light.fill) },
    },
  })

  // Cursor tug (smoothed, in mesh units)
  const tugX = new Float32Array(N_MAX)
  const tugY = new Float32Array(N_MAX)

  /** Add a node at mesh-local (x, y); returns nothing. */
  function addNode(x, y, now) {
    const slot = nextSlot
    nextSlot = (nextSlot + 1) % MAX_EXTRA
    if (extraCount < MAX_EXTRA) extraCount++
    const i = BASE + slot
    bx[i] = x
    by[i] = y
    tugX[i] = 0
    tugY[i] = 0
    order[i] = orderOf(x, y)
    setOrbit(i, order[i], extraRand)
    birth[i] = now
    // wire to the nearest live nodes (other than itself)
    const live = BASE + extraCount
    const near = []
    for (let j = 0; j < live; j++) {
      if (j === i) continue
      const d = Math.hypot(bx[j] - x, by[j] - y)
      if (d < MAX_DIST * 1.05) near.push([d, j])
    }
    near.sort((p, q) => p[0] - q[0])
    extraLinks[slot] = near.slice(0, EXTRA_LINKS).map((p) => p[1])
    // drop links from other extras that pointed at this recycled slot
    for (let s = 0; s < extraCount; s++) if (s !== slot) extraLinks[s] = extraLinks[s].filter((j) => j !== i)
    rebuildPairs()
  }

  /**
   * Place every node + strand.
   * angle: scroll orbit angle · power: 0→1 power-on progress · now: ms
   * tug: { x, y, r, max } in mesh units, or null
   * Returns true while something is still animating.
   */
  function update(angle, power, now, tug) {
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)
    const live = BASE + extraCount
    let busy = false

    const wave = power * 1.25 - 0.12
    for (let i = 0; i < live; i++) {
      const dc = c0[i] * ca - s0[i] * sa - c0[i] // cos(θ0 + a) − cos(θ0)
      const ds = s0[i] * ca + c0[i] * sa - s0[i] // sin(θ0 + a) − sin(θ0)
      let x = bx[i] + dc * majX[i] + ds * minX[i]
      let y = by[i] + dc * majY[i] + ds * minY[i]

      // cursor tug
      let gx = 0
      let gy = 0
      if (tug) {
        const ddx = tug.x - x
        const ddy = tug.y - y
        const d = Math.hypot(ddx, ddy)
        if (d < tug.r && d > 0.001) {
          const pull = Math.pow(1 - d / tug.r, 2) * tug.max
          gx = (ddx / d) * pull
          gy = (ddy / d) * pull
        }
      }
      tugX[i] += (gx - tugX[i]) * 0.14
      tugY[i] += (gy - tugY[i]) * 0.14
      if (Math.abs(gx - tugX[i]) > 0.05 || Math.abs(gy - tugY[i]) > 0.05) busy = true
      x += tugX[i]
      y += tugY[i]

      nodePos[i * 3] = x
      nodePos[i * 3 + 1] = y
      nodePos[i * 3 + 2] = 0

      // power-on wave
      let vis = 1
      let lit = 0
      if (power < 1) {
        const ahead = wave - order[i]
        vis = clamp01(ahead / 0.05)
        lit = vis * clamp01(1 - ahead / 0.16)
        busy = true
      }
      // pop-in for added nodes
      let size = 1
      if (i >= BASE) {
        const age = now - birth[i]
        if (age < BIRTH_MS * 1.6) busy = true
        size = age < BIRTH_MS ? Math.max(0, easeOutBack(clamp01(age / BIRTH_MS))) : 1
        lit = Math.max(lit, clamp01(1 - age / (BIRTH_MS * 1.6)))
      }
      aSize[i] = size
      aVis[i] = vis
      aLit[i] = lit
    }

    const E = pairs.length / 2
    for (let e = 0; e < E; e++) {
      const i = pairs[e * 2]
      const j = pairs[e * 2 + 1]
      const i3 = i * 3
      const j3 = j * 3
      const alpha = Math.min(aVis[i], aVis[j]) * Math.min(1, aSize[i], aSize[j])
      for (let v = 0; v < 4; v++) {
        const o = (e * 4 + v) * 3
        aStart[o] = nodePos[i3]; aStart[o + 1] = nodePos[i3 + 1]; aStart[o + 2] = 0
        aEnd[o] = nodePos[j3]; aEnd[o + 1] = nodePos[j3 + 1]; aEnd[o + 2] = 0
        aAlpha[e * 4 + v] = alpha
      }
    }

    nodeGeo.setDrawRange(0, live)
    edgeGeo.setDrawRange(0, E * 6)
    nodeGeo.attributes.position.needsUpdate = true
    nodeGeo.attributes.aSize.needsUpdate = true
    nodeGeo.attributes.aVis.needsUpdate = true
    nodeGeo.attributes.aLit.needsUpdate = true
    edgeGeo.attributes.aStart.needsUpdate = true
    edgeGeo.attributes.aEnd.needsUpdate = true
    edgeGeo.attributes.aAlpha.needsUpdate = true
    return busy
  }

  update(0, 1, 0, null) // rest pose == the original mesh

  return {
    edgeGeo,
    nodeGeo,
    edgeMat,
    nodeMat,
    update,
    addNode,
    hubLen,
    hubAngle,
    dispose() {
      edgeGeo.dispose()
      nodeGeo.dispose()
      edgeMat.dispose()
      nodeMat.dispose()
    },
  }
}

// ─── Dark-mode watcher (same `dark` class the rest of the site uses) ────────
function useIsDark() {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )
  useEffect(() => {
    const root = document.documentElement
    const obs = new MutationObserver(() => setIsDark(root.classList.contains('dark')))
    obs.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return isDark
}

// Clicks on these never drop a node
const NO_NODE = 'a, button, input, textarea, select, label, summary, [role="button"], [role="dialog"], .pn-stage, #playground, [data-no-node]'

// ─── Scene ──────────────────────────────────────────────────────────────────
function NeuromeshScene() {
  const { invalidate } = useThree()
  const isDark = useIsDark()
  const scene = useMemo(createScene, [])
  const groupRef = useRef()

  // Start at the real scroll position so a reload mid-page doesn't animate in
  const target = useRef(readScroll())
  const current = useRef(target.current)
  const pointer = useRef(null)       // client px
  const pendingClicks = useRef([])   // client px
  const powerStart = useRef(-Infinity)
  const firstTheme = useRef(true)
  const fit = useRef({ W: 1, H: 1, px: 1, s: 1, turn: 0 })

  useEffect(() => () => scene.dispose(), [scene])

  // Scroll → target
  useEffect(() => {
    const read = () => {
      target.current = readScroll()
      invalidate()
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    window.addEventListener('scroll', read, { passive: true })
    mq.addEventListener?.('change', read)
    read()
    return () => {
      window.removeEventListener('scroll', read)
      mq.removeEventListener?.('change', read)
    }
  }, [invalidate])

  // Cursor + click-to-add
  useEffect(() => {
    const move = (e) => {
      if (e.pointerType === 'touch') return
      pointer.current = { x: e.clientX, y: e.clientY }
      invalidate()
    }
    const leave = () => { pointer.current = null; invalidate() }
    const click = (e) => {
      if (e.target.closest?.(NO_NODE)) return
      if (window.getSelection?.().toString()) return
      pendingClicks.current.push({ x: e.clientX, y: e.clientY })
      invalidate()
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    window.addEventListener('click', click)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      window.removeEventListener('click', click)
    }
  }, [invalidate])

  // Theme colours (+ the power-on wave on every switch after the first paint)
  useEffect(() => {
    const c = isDark ? COLORS.dark : COLORS.light
    const stroke = hexToVec3(c.stroke)
    scene.edgeMat.uniforms.uColor.value.copy(stroke)
    scene.nodeMat.uniforms.uStrokeColor.value.copy(stroke)
    scene.nodeMat.uniforms.uFillColor.value.copy(hexToVec3(c.fill))
    let t = 0
    if (firstTheme.current) firstTheme.current = false
    else if (!prefersReducedMotion()) {
      powerStart.current = performance.now()
      // brighten the whole mesh while it powers on, then settle back
      const root = document.documentElement
      root.setAttribute('data-mesh-power', '')
      t = setTimeout(() => root.removeAttribute('data-mesh-power'), POWER_MS + 250)
    }
    invalidate()
    return () => clearTimeout(t)
  }, [isDark, scene, invalidate])

  // client px → mesh-local units (undo the screen fit, the turn and the scale)
  const toLocal = (cx, cy) => {
    const { W, H, px, s, turn } = fit.current
    const wx = (cx - W / 2) / px
    const wy = (H / 2 - cy) / px
    const c = Math.cos(-turn)
    const sn = Math.sin(-turn)
    return { x: (c * wx - sn * wy) / s, y: (sn * wx + c * wy) / s }
  }

  useFrame((state, delta) => {
    let busy = false
    const now = performance.now()

    // Smooth the scroll (frame-rate independent); keep rendering until settled
    const diff = target.current - current.current
    if (Math.abs(diff) > 0.05) {
      current.current += diff * (1 - Math.exp(-Math.min(delta, 0.1) * DAMPING))
      busy = true
    } else {
      current.current = target.current
    }

    // Orthographic camera: zoom = css px per SVG unit (the SVG "slice" fit)
    const { width: W, height: H } = state.size
    const pxPerUnit = Math.max(W / SVG_W, H / SVG_H)
    const cam = state.camera
    if (cam.zoom !== pxPerUnit) {
      cam.zoom = pxPerUnit
      cam.updateProjectionMatrix()
    }

    // Fit the mesh to THIS screen: hubs toward the top-right / bottom-left corners
    const visW = W / pxPerUnit
    const visH = H / pxPerUnit
    const fitScale = (FIT_REACH * Math.hypot(visW, visH)) / scene.hubLen
    let turn = 0
    if (ALIGN_TO_DIAGONAL) {
      turn = Math.atan2(-visH, -visW) - scene.hubAngle
      turn = Math.atan2(Math.sin(turn), Math.cos(turn)) // wrap to (-π, π]
    }
    if (groupRef.current) {
      groupRef.current.scale.setScalar(fitScale)
      groupRef.current.rotation.z = turn
    }
    fit.current = { W, H, px: pxPerUnit, s: fitScale, turn }

    scene.edgeMat.uniforms.uRes.value.set(W, H)
    scene.edgeMat.uniforms.uWidth.value = LINE_WIDTH * pxPerUnit
    scene.nodeMat.uniforms.uScale.value = pxPerUnit
    scene.nodeMat.uniforms.uPxRatio.value = state.gl.getPixelRatio()

    // Visitor clicks → new nodes
    while (pendingClicks.current.length) {
      const c = pendingClicks.current.shift()
      const p = toLocal(c.x, c.y)
      scene.addNode(p.x, p.y, now)
    }

    // Cursor tug, in mesh units
    let tug = null
    if (pointer.current && !prefersReducedMotion()) {
      const unit = pxPerUnit * fitScale
      const p = toLocal(pointer.current.x, pointer.current.y)
      tug = { x: p.x, y: p.y, r: TUG_RADIUS_PX / unit, max: TUG_MAX_PX / unit }
    }

    const power = clamp01((now - powerStart.current) / POWER_MS)

    // Scroll distance → orbit angle (shared by all nodes; phases differ per node).
    // Positive = scrolling down drives the motion forward clockwise (with CLOCKWISE = true).
    if (scene.update((current.current / PX_PER_TURN) * Math.PI * 2, power, now, tug)) busy = true
    if (busy) state.invalidate()
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={scene.edgeGeo} material={scene.edgeMat} frustumCulled={false} renderOrder={1} />
      <points geometry={scene.nodeGeo} material={scene.nodeMat} frustumCulled={false} renderOrder={2} />
    </group>
  )
}

// ─── Fixed background canvas ────────────────────────────────────────────────
export default function StaticNeuromesh() {
  return (
    <div
      aria-hidden="true"
      className="neuromesh-bg fixed inset-0 z-[-10] pointer-events-none overflow-hidden opacity-[0.18] dark:opacity-[0.08]"
    >
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <NeuromeshScene />
      </Canvas>
    </div>
  )
}

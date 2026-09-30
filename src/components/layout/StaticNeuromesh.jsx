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
     • No rigid rotation. Every node circles on its own small orbit, so each
       strand swings and rotates by itself.
     • Orbit phases form a wave along the diagonal; scrolling pushes it forward
       through the mesh (top-right → bottom-left), scrolling up reverses it.
     • At scroll 0 every node sits exactly on its original position.
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
const DAMPING = 5         // scroll smoothing (lower = silkier, higher = snappier)
const CLOCKWISE = true    // direction each node circles as you scroll down (false = anticlockwise)
const SEED = 7            // same seed → same motion every load

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

// ─── Shaders ────────────────────────────────────────────────────────────────
// Strands are camera-facing quads with a constant pixel width (native WebGL
// lines are stuck at 1px). Orthographic → w is always 1, so width never varies.
const EDGE_VERT = /* glsl */ `
  uniform vec2  uRes;     // css px
  uniform float uWidth;   // css px
  attribute vec3 aStart;
  attribute vec3 aEnd;
  attribute vec2 aCorner; // x: 0=start 1=end, y: -1/+1 side
  varying float vAcross;
  varying float vHalf;

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
  }
`

const EDGE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  varying float vAcross;
  varying float vHalf;

  void main() {
    float a = 1.0 - smoothstep(vHalf - 0.5, vHalf + 0.5, abs(vAcross));
    gl_FragColor = vec4(uColor, a);
  }
`

// Nodes are point sprites drawn as analytic hollow rings.
const NODE_VERT = /* glsl */ `
  uniform float uScale;    // css px per SVG unit
  uniform float uPxRatio;  // device pixel ratio
  uniform float uRadius;   // SVG units
  uniform float uStroke;   // SVG units
  varying float vR;
  varying float vHs;
  varying float vSize;

  void main() {
    float k = uScale * uPxRatio; // device px per SVG unit
    vR  = uRadius * k;
    vHs = 0.5 * uStroke * k;
    vSize = 2.0 * (vR + vHs) + 3.0;
    gl_PointSize = vSize;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const NODE_FRAG = /* glsl */ `
  uniform vec3 uStrokeColor;
  uniform vec3 uFillColor;
  varying float vR;
  varying float vHs;
  varying float vSize;

  void main() {
    float d = length((gl_PointCoord - 0.5) * vSize);
    float aa = 0.75;
    float ring = 1.0 - smoothstep(vHs - aa, vHs + aa, abs(d - vR));
    float fill = 1.0 - smoothstep(vR - aa, vR + aa, d);
    float a = max(ring, fill);
    if (a < 0.003) discard;
    gl_FragColor = vec4(mix(uFillColor, uStrokeColor, ring), a);
  }
`

// ─── Build everything once ──────────────────────────────────────────────────
function createScene() {
  const rand = mulberry32(SEED)
  const n = RAW_NODES.length

  // World positions (y flipped so "up" is +y)
  const wx = new Float32Array(n)
  const wy = new Float32Array(n)
  RAW_NODES.forEach((p, i) => {
    wx[i] = p.x - SVG_W / 2
    wy[i] = SVG_H / 2 - p.y
  })

  // Hub centroids → the mesh's diagonal axis (top-right hub → bottom-left hub)
  let ax = 0, ay = 0, cx = 0, cy = 0
  for (let i = 0; i < 12; i++) { ax += wx[i]; ay += wy[i] }
  for (let i = n - 12; i < n; i++) { cx += wx[i]; cy += wy[i] }
  ax /= 12; ay /= 12; cx /= 12; cy /= 12
  const mx = (ax + cx) / 2 // hub midpoint: the pivot for scaling/turning
  const my = (ay + cy) / 2
  const vx = cx - ax
  const vy = cy - ay
  const hubLen = Math.hypot(vx, vy)
  const hubAngle = Math.atan2(vy, vx)

  // Base positions centred on the hub midpoint (the group is scaled/turned about it)
  const bx = new Float32Array(n)
  const by = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    bx[i] = wx[i] - mx
    by[i] = wy[i] - my
  }

  // Position of each node along the axis, normalised 0 → 1
  const dx = vx / hubLen
  const dy = vy / hubLen
  const along = new Float32Array(n)
  let tMin = Infinity
  let tMax = -Infinity
  for (let i = 0; i < n; i++) {
    along[i] = bx[i] * dx + by[i] * dy
    tMin = Math.min(tMin, along[i])
    tMax = Math.max(tMax, along[i])
  }

  // Per-node orbit (an ellipse).  Displacement = offset(θ0 + a) − offset(θ0),
  // so it is exactly zero at scroll 0 and the mesh matches the original.
  const majX = new Float32Array(n)
  const majY = new Float32Array(n)
  const minX = new Float32Array(n)
  const minY = new Float32Array(n)
  const c0 = new Float32Array(n)
  const s0 = new Float32Array(n)
  const sense = CLOCKWISE ? -1 : 1 // world is y-up, so +1 turns anticlockwise
  for (let i = 0; i < n; i++) {
    const u = (along[i] - tMin) / (tMax - tMin)
    // Phase falls along the axis → crest travels toward the bottom-left as you scroll
    const theta0 = -u * WAVE_CYCLES * Math.PI * 2 + (rand() - 0.5) * 1.4
    const radius = ORBIT_MIN + rand() * (ORBIT_MAX - ORBIT_MIN)
    const squash = 0.55 + rand() * 0.45          // 0.55 = flat ellipse, 1 = circle
    const tilt = rand() * Math.PI                // orientation of the ellipse
    const ct = Math.cos(tilt)
    const st = Math.sin(tilt)
    majX[i] = radius * ct
    majY[i] = radius * st
    minX[i] = -sense * radius * squash * st
    minY[i] = sense * radius * squash * ct
    c0[i] = Math.cos(theta0)
    s0[i] = Math.sin(theta0)
  }

  // Connections: the original rule, measured in original SVG units
  const pairs = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(bx[i] - bx[j], by[i] - by[j]) < MAX_DIST) pairs.push(i, j)
    }
  }
  const E = pairs.length / 2

  // ── Edge geometry: 4 verts (a quad) per strand ──
  const aStart = new Float32Array(E * 4 * 3)
  const aEnd = new Float32Array(E * 4 * 3)
  const aCorner = new Float32Array(E * 4 * 2)
  const index = new Uint32Array(E * 6)
  for (let e = 0; e < E; e++) {
    for (let v = 0; v < 4; v++) {
      aCorner[(e * 4 + v) * 2] = v >= 2 ? 1 : 0
      aCorner[(e * 4 + v) * 2 + 1] = v % 2 === 0 ? -1 : 1
    }
    const b = e * 4
    index.set([b, b + 1, b + 2, b + 2, b + 1, b + 3], e * 6)
  }
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(E * 4 * 3), 3))
  edgeGeo.setAttribute('aStart', new THREE.BufferAttribute(aStart, 3).setUsage(THREE.DynamicDrawUsage))
  edgeGeo.setAttribute('aEnd', new THREE.BufferAttribute(aEnd, 3).setUsage(THREE.DynamicDrawUsage))
  edgeGeo.setAttribute('aCorner', new THREE.BufferAttribute(aCorner, 2))
  edgeGeo.setIndex(new THREE.BufferAttribute(index, 1))

  // ── Node geometry ──
  const nodePos = new Float32Array(n * 3)
  const nodeGeo = new THREE.BufferGeometry()
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3).setUsage(THREE.DynamicDrawUsage))

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

  // Place every node + strand for a given scroll angle (radians)
  function update(angle) {
    const ca = Math.cos(angle)
    const sa = Math.sin(angle)

    for (let i = 0; i < n; i++) {
      const dc = c0[i] * ca - s0[i] * sa - c0[i] // cos(θ0 + a) − cos(θ0)
      const ds = s0[i] * ca + c0[i] * sa - s0[i] // sin(θ0 + a) − sin(θ0)
      nodePos[i * 3] = bx[i] + dc * majX[i] + ds * minX[i]
      nodePos[i * 3 + 1] = by[i] + dc * majY[i] + ds * minY[i]
      nodePos[i * 3 + 2] = 0
    }

    for (let e = 0; e < E; e++) {
      const i3 = pairs[e * 2] * 3
      const j3 = pairs[e * 2 + 1] * 3
      for (let v = 0; v < 4; v++) {
        const o = (e * 4 + v) * 3
        aStart[o] = nodePos[i3]; aStart[o + 1] = nodePos[i3 + 1]; aStart[o + 2] = 0
        aEnd[o] = nodePos[j3]; aEnd[o + 1] = nodePos[j3 + 1]; aEnd[o + 2] = 0
      }
    }

    nodeGeo.attributes.position.needsUpdate = true
    edgeGeo.attributes.aStart.needsUpdate = true
    edgeGeo.attributes.aEnd.needsUpdate = true
  }

  update(0) // rest pose == the original mesh

  return {
    edgeGeo,
    nodeGeo,
    edgeMat,
    nodeMat,
    update,
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

// ─── Scene ──────────────────────────────────────────────────────────────────
function NeuromeshScene() {
  const { invalidate } = useThree()
  const isDark = useIsDark()
  const scene = useMemo(createScene, [])
  const groupRef = useRef()

  // Start at the real scroll position so a reload mid-page doesn't animate in
  const target = useRef(readScroll())
  const current = useRef(target.current)

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

  // Theme colours
  useEffect(() => {
    const c = isDark ? COLORS.dark : COLORS.light
    const stroke = hexToVec3(c.stroke)
    scene.edgeMat.uniforms.uColor.value.copy(stroke)
    scene.nodeMat.uniforms.uStrokeColor.value.copy(stroke)
    scene.nodeMat.uniforms.uFillColor.value.copy(hexToVec3(c.fill))
    invalidate()
  }, [isDark, scene, invalidate])

  useFrame((state, delta) => {
    // Smooth the scroll (frame-rate independent); keep rendering until settled
    const diff = target.current - current.current
    if (Math.abs(diff) > 0.05) {
      current.current += diff * (1 - Math.exp(-Math.min(delta, 0.1) * DAMPING))
      state.invalidate()
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

    scene.edgeMat.uniforms.uRes.value.set(W, H)
    scene.edgeMat.uniforms.uWidth.value = LINE_WIDTH * pxPerUnit
    scene.nodeMat.uniforms.uScale.value = pxPerUnit
    scene.nodeMat.uniforms.uPxRatio.value = state.gl.getPixelRatio()

    // Scroll distance → orbit angle (shared by all nodes; phases differ per node)
    scene.update((current.current / PX_PER_TURN) * Math.PI * 2)
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
      className="fixed inset-0 z-[-10] pointer-events-none overflow-hidden opacity-[0.18] dark:opacity-[0.08]"
    >
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], zoom: 1, near: 0.1, far: 100 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
      >
        <NeuromeshScene />
      </Canvas>
    </div>
  )
}

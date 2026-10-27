import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

// Entrance timeline (ms from the section reaching 35% in view)
const T = { frame: 700, photo: 700, caption: 1100, buttons: 1400 };
const CAPTION = 'Muhammad Ismail';

// Rough outline length of each glyph in px: fill it on a canvas and count edge pixels.
// Only paces the pen; the line swaps back to the CSS hollow text when it finishes.
function glyphOutlines(chars, font, size) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const w = Math.ceil(size * 1.6), h = Math.ceil(size * 1.6);
  canvas.width = w; canvas.height = h;
  return chars.map((ch) => {
    if (!ch.trim()) return 0;
    ctx.clearRect(0, 0, w, h);
    ctx.font = font;
    ctx.fillText(ch, size * 0.3, size * 1.2);
    const d = ctx.getImageData(0, 0, w, h).data;
    const inside = (x, y) => d[(y * w + x) * 4 + 3] > 127;
    let edge = 0;
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++)
        if (inside(x, y) && (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1))) edge++;
    return Math.ceil(edge * 1.25) + 4;
  });
}

// "Learning Fast.": an SVG <text> that traces its outline letter by letter, overlaid on the
// real (transparent) line so the layout never moves; ends as the CSS .text-hollow line.
function OutlineLine({ text, play, reduced }) {
  const wrapRef = useRef(null);
  const markRef = useRef(null);
  const textRef = useRef(null);
  const [m, setM] = useState(null);
  const [done, setDone] = useState(false);
  const chars = [...text];
  const last = chars.length - 1 - [...chars].reverse().findIndex((c) => c.trim());

  const measure = useCallback(() => {
    const wrap = wrapRef.current, mark = markRef.current, t = textRef.current;
    if (!wrap || !mark || !t) return;
    const cs = getComputedStyle(wrap);
    const size = parseFloat(cs.fontSize);
    const bb = t.getBBox();
    const pad = Math.ceil(size * 0.15);
    const box = wrap.getBoundingClientRect();
    const base = mark.getBoundingClientRect().top - box.top;
    // Pin every letter to where the real line puts it (tspans would otherwise lose kerning).
    const node = mark.parentNode.firstChild, range = document.createRange();
    const xs = chars.map((_, i) => {
      range.setStart(node, i); range.setEnd(node, i + 1);
      return range.getBoundingClientRect().left - box.left;
    });
    setM({
      x: bb.x - pad, y: bb.y - pad, w: bb.width + pad * 2, h: bb.height + pad * 2, base, xs,
      lens: glyphOutlines(chars, `${cs.fontWeight} ${size}px ${cs.fontFamily}`, size),
    });
  }, [text]);

  useLayoutEffect(() => {
    if (reduced || done) return;
    let alive = true;
    document.fonts.ready.then(() => alive && measure());
    const ro = new ResizeObserver(() => document.fonts.ready.then(() => alive && measure()));
    ro.observe(wrapRef.current);
    return () => { alive = false; ro.disconnect(); };
  }, [reduced, done, measure]);

  const svgOn = !reduced && !done;
  return (
    <span ref={wrapRef} className="relative block">
      <span className={svgOn && m ? 'text-transparent' : 'text-hollow'}>
        {text}
        <span ref={markRef} className="inline-block w-0 h-0" />
      </span>
      {svgOn && (
        <svg
          aria-hidden="true"
          className="absolute pointer-events-none overflow-visible"
          style={m ? { left: m.x, top: m.base + m.y, width: m.w, height: m.h } : { left: 0, top: 0, width: 0, height: 0, visibility: 'hidden' }}
          viewBox={m ? `${m.x} ${m.y} ${m.w} ${m.h}` : undefined}
        >
          <text ref={textRef} x="0" y="0" className="about-outline">
            {m ? chars.map((ch, i) => (
              <motion.tspan
                key={i}
                x={m.xs[i]}
                style={{ strokeDasharray: `${m.lens[i]} 100000` }}
                initial={{ strokeDashoffset: m.lens[i] }}
                animate={{ strokeDashoffset: play ? 0 : m.lens[i] }}
                transition={play ? { duration: 0.9, delay: i * 0.045, ease: 'easeInOut' } : { duration: 0 }}
                onAnimationComplete={play && i === last ? () => setDone(true) : undefined}
              >
                {ch}
              </motion.tspan>
            )) : text}
          </text>
        </svg>
      )}
    </span>
  );
}

// Mono caption that types itself out, then a blinking block cursor that fades away.
function TypedCaption({ play, reduced }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState('idle'); // idle → typing → blink → gone

  useEffect(() => {
    if (!play) return;
    let id;
    const start = setTimeout(() => {
      setPhase('typing');
      let i = 0;
      id = setInterval(() => {
        setN(++i);
        if (i >= CAPTION.length) { clearInterval(id); setPhase('blink'); }
      }, 55);
    }, T.caption);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [play]);

  useEffect(() => {
    if (phase !== 'blink' && phase !== 'fade') return;
    const id = setTimeout(() => setPhase(phase === 'blink' ? 'fade' : 'gone'), phase === 'blink' ? 2500 : 300);
    return () => clearTimeout(id);
  }, [phase]);

  // The real caption keeps its width (and stays readable to screen readers); the typed copy sits on top.
  const animating = !reduced && phase !== 'gone';
  return (
    <p className="relative mt-3 text-sm font-mono text-[#555555] dark:text-[#A0A0A0]">
      <span className={animating ? 'text-transparent' : ''}>{CAPTION}</span>
      {animating && (
        <span aria-hidden="true" className="absolute left-0 top-0 whitespace-nowrap">
          {CAPTION.slice(0, n)}
          {phase !== 'idle' && <span className={`about-caret text-ink is-${phase}`}>█</span>}
        </span>
      )}
    </p>
  );
}

export default function About() {
  const scrollToSection = useSmoothScroll();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  const play = inView && !reduced;
  const [frameDone, setFrameDone] = useState(false);
  const frameFinal = reduced || frameDone;

  const drop = (delay) => ({
    initial: reduced ? false : { opacity: 0, y: -24 },
    animate: reduced || play ? { opacity: 1, y: 0 } : { opacity: 0, y: -24 },
    transition: {
      y: { type: 'spring', stiffness: 420, damping: 22, delay },
      opacity: { duration: 0.25, ease: 'easeOut', delay },
    },
  });

  return (
    <section ref={sectionRef} id="about" className="relative z-10 w-full min-h-[100svh] flex items-center overflow-x-clip px-6 md:px-16 lg:px-24 pt-24 pb-16 lg:py-20">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center lg:items-stretch">

        {/* Left Column: Typography & Buttons */}
        <div>
          <h2 className="text-[clamp(40px,12.5vw,64px)] md:text-[10vw] lg:text-[6vw] leading-[0.9] font-black tracking-tighter m-0">
            <span className="block text-[#0A0A0A] dark:text-white">Building Real.</span>
            <OutlineLine text="Learning Fast." play={play} reduced={reduced} />
          </h2>

          <p className="mt-6 md:mt-8 text-[17px] md:text-xl font-medium text-[#555555] dark:text-[#A0A0A0] max-w-xl leading-relaxed">
            Driven by a strong foundation in Computer Science, I focus on crafting scalable, robust applications using modern technologies. My expertise spans full-stack development, system architecture, and algorithmic problem-solving, always prioritizing clean, efficient code and continuous learning.
          </p>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 sm:gap-4 mt-8 md:mt-10">
            <motion.div className="grid" {...drop(T.buttons / 1000)}>
              <button onClick={(e) => scrollToSection(e, 'portfolio')} className="min-h-[52px] px-8 py-3 rounded-none bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-semibold tracking-wide border-2 border-[#0A0A0A] dark:border-white hover:opacity-80 transition-opacity">
                View My Work &rarr;
              </button>
            </motion.div>
            <motion.div className="grid" {...drop(T.buttons / 1000 + 0.1)}>
              <button onClick={(e) => scrollToSection(e, 'contact')} className="min-h-[52px] px-8 py-3 rounded-none bg-transparent text-[#0A0A0A] dark:text-white font-semibold tracking-wide border-2 border-[#0A0A0A] dark:border-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] transition-colors">
                Let's Connect
              </button>
            </motion.div>
          </div>
        </div>

        {/* Right Column: photo in a frame that draws itself.
            On lg the frame is exactly as tall as the text column; the caption hangs below it. */}
        <div>
          <div className="w-fit mx-auto lg:ml-auto lg:mr-0 lg:relative lg:h-full">
            <div className={`relative p-2 border-2 ${frameFinal ? 'border-[#0A0A0A] dark:border-white/40' : 'border-transparent'} w-fit mx-auto lg:ml-auto lg:mr-0 lg:h-full`}>
              {!frameFinal && (
                // Covers the border box; a 4px stroke centred on its edge leaves the inner 2px visible.
                <svg aria-hidden="true" className="absolute -top-[2px] -left-[2px] w-[calc(100%+4px)] h-[calc(100%+4px)] overflow-hidden pointer-events-none text-[#0A0A0A] dark:text-white/40">
                  <motion.rect
                    width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: play ? 1 : 0 }}
                    transition={play ? { duration: T.frame / 1000, ease: 'easeInOut' } : { duration: 0 }}
                    onAnimationComplete={play ? () => setFrameDone(true) : undefined}
                  />
                </svg>
              )}
              <motion.div
                className="lg:relative lg:h-full lg:w-[min(28vw,420px)]"
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={reduced || play ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: T.photo / 1000 }}
              >
                <img
                  src="/assets/profile.jpeg"
                  alt="Muhammad Ismail"
                  className="w-[min(78vw,340px)] sm:w-[400px] aspect-[3/4] lg:w-full lg:h-full lg:aspect-auto lg:absolute lg:inset-0 object-cover object-top grayscale-0 hover:grayscale transition-all duration-500"
                />
              </motion.div>
            </div>
            <div className="lg:absolute lg:top-full lg:left-0 lg:w-full">
              <TypedCaption play={play} reduced={reduced} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

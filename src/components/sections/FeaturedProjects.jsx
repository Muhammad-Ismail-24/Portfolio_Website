import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */
const projects = [
  {
    title: 'SFML Game Engine',
    description:
      'A lightweight 2D game engine built on top of SFML with an entity-component system, sprite batching, and a built-in level editor. Supports tilemaps, physics collisions, and particle effects out of the box.',
    image: '/assets/projects/sfml-engine.png',
    demoLink: '#',
  },
  {
    title: 'NeuraChat',
    description:
      'A real-time chat application powered by WebSockets and a custom NLP pipeline that auto-summarises conversations, extracts action items, and provides sentiment analysis on the fly.',
    image: '/assets/projects/neurachat.png',
    demoLink: '#',
  },
  {
    title: 'CloudForge CLI',
    description:
      'A developer-first CLI tool for provisioning and tearing down cloud infrastructure across AWS, GCP, and Azure with a single declarative YAML config. Includes drift detection and cost estimation.',
    image: '/assets/projects/cloudforge.png',
    demoLink: '#',
  },
  {
    title: 'PixelBoard',
    description:
      'A collaborative, real-time pixel art canvas inspired by r/place. Supports up to 10 000 concurrent users via CRDTs, with a replay timeline that lets you scrub through the entire canvas history.',
    image: '/assets/projects/pixelboard.png',
    demoLink: '#',
  },
  {
    title: 'MedVault',
    description:
      'A HIPAA-compliant medical records vault with end-to-end encryption, role-based access control, and an AI-assisted search that surfaces relevant patient history across millions of documents.',
    image: '/assets/projects/medvault.png',
    demoLink: '#',
  },
];

/* ─────────────────────────────────────────────
   ANIMATION HELPERS
   ───────────────────────────────────────────── */
const getStackAnimation = (offset) => {
  if (offset === 0) return { x: 0, scale: 1, zIndex: 40, opacity: 1 };
  if (offset === 1) return { x: 60, scale: 0.95, zIndex: 30, opacity: 1 };
  if (offset === 2) return { x: 120, scale: 0.9, zIndex: 20, opacity: 1 };
  return { x: 150, scale: 0.8, zIndex: 10, opacity: 0 };
};

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function FeaturedProjects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  /* ── Infinite scroll interception ────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isThrottled = false;

    const handleWheel = (e) => {
      const isScrollingDown = e.deltaY > 30 || e.deltaX > 30;
      const isScrollingUp = e.deltaY < -30 || e.deltaX < -30;

      if (isScrollingDown) {
        e.preventDefault();
        if (!isThrottled) {
          setActiveIndex((prev) => (prev + 1) % projects.length);
          isThrottled = true;
          setTimeout(() => { isThrottled = false; }, 400);
        }
      } else if (isScrollingUp) {
        e.preventDefault();
        if (!isThrottled) {
          setActiveIndex((prev) => (prev - 1 + projects.length) % projects.length);
          isThrottled = true;
          setTimeout(() => { isThrottled = false; }, 400);
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [projects.length]);

  /* ── Render ─────────────────────────────── */
  return (
    <section className="relative w-full min-h-screen py-16 flex flex-col items-center pt-20 pb-10 z-10">
      {/* ── Heading ─────────────────────────── */}
      <div className="flex flex-row flex-wrap justify-center gap-x-4 px-4">
        <span className="text-[10vw] lg:text-[8vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">
          Featured
        </span>
        <span className="text-[10vw] lg:text-[8vw] font-black tracking-tighter text-hollow leading-none">
          Projects.
        </span>
      </div>

      {/* ── Right-Stacked Carousel ──────────── */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl h-[50vh] min-h-[420px] max-h-[500px] mt-2 mx-auto flex items-center justify-center"
        style={{ perspective: '1000px' }}
      >
        {projects.map((project, index) => {
          let offset = index - activeIndex;
          if (offset < 0) offset += projects.length;
          const anim = getStackAnimation(offset);

          return (
            <motion.div
              key={project.title}
              animate={{
                x: anim.x,
                scale: anim.scale,
                opacity: anim.opacity,
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              style={{ zIndex: anim.zIndex }}
              className="absolute w-[85%] max-w-[550px] lg:max-w-[650px] h-full bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-2xl shadow-2xl dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 flex flex-col cursor-pointer"
              onClick={() => setActiveIndex(index)}
            >
              {/* Image Block */}
              <div className="w-full h-[180px] lg:h-[200px] shrink-0 mb-4 bg-[#0A0A0A] rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Text Layout */}
              <h3 className="text-3xl font-black text-[#0A0A0A] dark:text-white tracking-tight">
                {project.title}
              </h3>
              <p className="mt-3 text-sm font-medium text-[#555555] dark:text-[#94A3B8] leading-relaxed max-w-2xl line-clamp-3">
                {project.description}
              </p>

              {/* Pill Button */}
              <a
                href={project.demoLink}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-4 right-4 px-6 py-2.5 bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-bold text-sm rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
              >
                Video Demo →
              </a>
            </motion.div>
          );
        })}
      </div>

      {/* ── Dot Indicators ──────────────────── */}
      <div className="flex gap-2 mt-8">
        {projects.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2.5 h-2.5 rounded-full border border-[#0A0A0A] dark:border-white transition-colors ${
              i === activeIndex
                ? 'bg-[#0A0A0A] dark:bg-white'
                : 'bg-transparent'
            }`}
          />
        ))}
      </div>
    </section>
  );
}

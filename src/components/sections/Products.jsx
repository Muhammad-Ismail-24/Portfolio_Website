import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */
const products = [
  {
    word1: 'Drive',
    word2: 'Fetch',
    subtitle: 'Intelligent File Retrieval',
    description:
      'A blazing-fast cloud-storage aggregator that unifies Google Drive, Dropbox, and OneDrive under a single search interface. Leverages NLP-based intent parsing to surface the right file in under 200 ms.',
    image: '/assets/products/drivefetch.png',
  },
  {
    word1: 'Shi',
    word2: 'fa',
    subtitle: 'AI-Powered Health Assistant',
    description:
      'An end-to-end telemedicine platform that pairs patients with specialists via real-time symptom triage powered by a fine-tuned LLM. Supports multilingual voice input and HIPAA-compliant data handling.',
    image: '/assets/products/shifa.png',
  },
  {
    word1: 'Git',
    word2: 'Sync',
    subtitle: 'Repository Orchestration',
    description:
      'A developer tool that keeps mono-repos, forks, and upstream mirrors perfectly synchronised. Runs conflict-free rebases on a cron and delivers Slack/Discord notifications when human intervention is required.',
    image: '/assets/products/gitsync.png',
  },
];

/* ─────────────────────────────────────────────
   COMPONENT
   ───────────────────────────────────────────── */
export default function Products() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const carouselRef = useRef(null);
  const isThrottledRef = useRef(false);

  /* ── Scroll interception (throttled, infinite loop) ────── */
  const handleWheel = useCallback(
    (e) => {
      const dx = e.deltaX;
      const dy = e.deltaY;

      const isScrollingDown = dx > 0 || dy > 50;
      const isScrollingUp = dx < 0 || dy < -50;

      if (isScrollingDown) {
        e.preventDefault();
        if (!isThrottledRef.current) {
          setActiveIndex((prev) => (prev + 1) % products.length);
          isThrottledRef.current = true;
          setTimeout(() => { isThrottledRef.current = false; }, 400);
        }
      } else if (isScrollingUp) {
        e.preventDefault();
        if (!isThrottledRef.current) {
          setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
          isThrottledRef.current = true;
          setTimeout(() => { isThrottledRef.current = false; }, 400);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* ── Offset-driven animation values ────── */
  const getCardAnimation = (offset) => {
    const abs = Math.abs(offset);
    if (abs === 0) return { scale: 1, rotate: 0, zIndex: 30, y: 0, x: 0, opacity: 1 };
    if (abs === 1)
      return { scale: 0.9, rotate: offset * 8, zIndex: 20, y: 20, x: offset * 100, opacity: 0.85 };
    return { scale: 0.8, rotate: offset * 12, zIndex: 10, y: 40, x: offset * 180, opacity: 0.6 };
  };

  const activeProduct = products[activeIndex];

  /* ── Render ─────────────────────────────── */
  return (
    <section
      ref={carouselRef}
      className="min-h-screen relative flex flex-col items-center justify-center pt-24 z-10"
    >
      {/* ── Heading ─────────────────────────── */}
      <h2 className="text-[10vw] lg:text-[8vw] leading-none font-black tracking-tighter text-[#0A0A0A] dark:text-white select-none">
        Produc<span className="text-hollow">ts.</span>
      </h2>

      {/* ── Fanned Card Carousel ────────────── */}
      <div className="relative w-full flex items-center justify-center mt-16" style={{ height: 440 }}>
        {products.map((product, index) => {
          let offset = index - activeIndex;
          const half = Math.floor(products.length / 2);
          // Wrap the offsets for a circular fanned layout
          if (offset > half) offset -= products.length;
          if (offset < -half) offset += products.length;
          const anim = getCardAnimation(offset);

          return (
            <motion.div
              key={product.word1 + product.word2}
              animate={{
                scale: anim.scale,
                rotate: anim.rotate,
                y: anim.y,
                x: anim.x,
                opacity: anim.opacity,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              style={{ zIndex: anim.zIndex }}
              className="w-[300px] h-[400px] absolute bg-[#F5F3EC] dark:bg-[#0A0F1E] border border-[#0A0A0A] dark:border-white/30 rounded-xl overflow-hidden cursor-pointer shadow-xl"
              onClick={() => {
                if (offset === 0) {
                  setIsModalOpen(true);
                } else {
                  setActiveIndex(index);
                }
              }}
            >
              {/* Card inner content */}
              <div className="h-[55%] w-full bg-[#E8E4D9] dark:bg-[#111827] flex items-center justify-center">
                <img
                  src={product.image}
                  alt={`${product.word1}${product.word2}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="p-5">
                <h3 className="text-xl font-black text-[#0A0A0A] dark:text-white leading-tight">
                  {product.word1}
                  <span className="text-hollow">{product.word2}</span>
                </h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#888888] dark:text-[#666666]">
                  {product.subtitle}
                </p>
                <p className="mt-3 text-sm text-[#555555] dark:text-[#A0A0A0] line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Dot Indicators ──────────────────── */}
      <div className="flex gap-2 mt-8">
        {products.map((_, i) => (
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

      {/* ── Expanded Modal ──────────────────── */}
      <AnimatePresence>
        {isModalOpen && activeProduct && (
          <motion.div
            key="product-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-6"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              key="product-card"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="w-full max-w-5xl bg-[#F5F3EC] dark:bg-[#07090F] border border-[#0A0A0A] dark:border-white/30 rounded-2xl flex flex-col lg:flex-row overflow-y-auto max-h-[90vh] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full border border-[#0A0A0A] dark:border-white/40 text-[#0A0A0A] dark:text-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] transition-colors text-lg font-semibold"
              >
                ✕
              </button>

              {/* Left Column — Image */}
              <div className="w-full lg:w-1/2 p-6 lg:p-12 flex items-center justify-center bg-[#E8E4D9] dark:bg-[#111827]">
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-[#0A0A0A]/10 dark:border-white/10 shadow-lg">
                  <img
                    src={activeProduct.image}
                    alt={`${activeProduct.word1}${activeProduct.word2}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Right Column — Content */}
              <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-center">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  <span className="font-black text-5xl md:text-6xl text-[#0A0A0A] dark:text-white">
                    {activeProduct.word1}
                  </span>
                  <span className="font-black text-5xl md:text-6xl text-hollow">
                    {activeProduct.word2}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-[#888888] dark:text-[#666666]">
                  {activeProduct.subtitle}
                </p>

                <p className="mt-6 text-lg text-[#555555] dark:text-[#A0A0A0] leading-relaxed">
                  {activeProduct.description}
                </p>

                <div className="mt-10 flex gap-4 flex-wrap">
                  <button className="px-6 py-3 border border-[#0A0A0A] dark:border-white bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-semibold rounded-md hover:opacity-80 transition-opacity">
                    Live Deployment →
                  </button>
                  <button className="px-6 py-3 border border-[#0A0A0A] dark:border-white text-[#0A0A0A] dark:text-white font-semibold rounded-md hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] transition-colors">
                    Video Demo
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const services = [
  {
    title: "Multi-Agent AI Systems",
    description: "Architecting autonomous LLM workflows using LangGraph and vector retrieval to orchestrate complex, collaborative problem-solving and autonomous B2B pipelines."
  },
  {
    title: "Full-Stack Web Applications",
    description: "Building scalable, high-performance web applications using modern frameworks like React, Node.js, and FastAPI with robust database management."
  },
  {
    title: "Autonomous Automations",
    description: "Designing end-to-end automation scripts and CI/CD pipelines to streamline data ingestion, ETL processes, and repetitive corporate workflows."
  },
  {
    title: "Corporate & Portfolio Sites",
    description: "Crafting premium, responsive, and highly interactive digital experiences with Framer Motion, Three.js, and pixel-perfect Tailwind CSS styling."
  }
];

const Services = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-6 md:px-16 lg:px-24 z-10">

      {/* Heading */}
      <div className="flex flex-row flex-wrap justify-center gap-x-4 mb-16">
        <h2 className="text-[9vw] lg:text-[6vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">What do I</h2>
        <h2 className="text-[9vw] lg:text-[6vw] font-black tracking-tighter text-hollow leading-none">Offer?</h2>
      </div>

      {/* Accordion List Layout */}
      <div className="w-full max-w-5xl flex flex-col border-t border-[#0A0A0A]/20 dark:border-white/20">
        {services.map((service, index) => (
          <div
            key={index}
            className="w-full flex flex-col py-6 lg:py-8 border-b border-[#0A0A0A]/20 dark:border-white/20 cursor-pointer group"
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
          >
            {/* Row Header */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-6 lg:gap-8">
                {/* Left Icon: Solid if active, Hollow if inactive */}
                <div className="w-4 h-4 lg:w-5 lg:h-5 rounded-full border-[1.5px] border-[#0A0A0A] dark:border-white flex items-center justify-center shrink-0">
                  {activeIndex === index && <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-[#0A0A0A] dark:bg-white rounded-full"></div>}
                </div>
                {/* Title */}
                <h3 className="text-3xl lg:text-5xl font-normal antialiased text-[#0A0A0A] dark:text-white tracking-wide">
                  {service.title}
                </h3>
              </div>
              {/* Right Icon: Circle with Arrow */}
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-[#0A0A0A]/30 dark:border-white/30 flex items-center justify-center shrink-0 group-hover:bg-[#0A0A0A]/5 dark:group-hover:bg-white/5 transition-colors">
                <motion.svg 
                  animate={{ rotate: activeIndex === index ? 0 : -45 }} 
                  className="w-5 h-5 lg:w-6 lg:h-6 text-[#0A0A0A] dark:text-white" 
                  fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"
                >
                  {activeIndex === index ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /> // Down Arrow
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /> // Right Arrow (Rotated by Framer)
                  )}
                </motion.svg>
              </div>
            </div>

            {/* Animated Dropdown Content */}
            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="text-base lg:text-xl font-medium text-[#555555] dark:text-[#94A3B8] leading-relaxed mt-6 pl-10 lg:pl-14 max-w-4xl">
                    {service.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;

import { motion } from 'framer-motion';

export default function About() {
  return (
    <section className="relative z-10 w-full min-h-[100vh] flex items-center px-6 md:px-16 lg:px-24">
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
        
        {/* Left Column: Typography & Buttons */}
        <div>
          <h2 className="text-[10vw] lg:text-[6vw] leading-[0.9] font-black tracking-tighter text-[#0A0A0A] dark:text-white m-0">
            Building Real.
          </h2>
          <h2 className="text-[10vw] lg:text-[6vw] leading-[0.9] font-black tracking-tighter text-hollow m-0">
            Learning Fast.
          </h2>
          
          <p className="mt-8 text-lg md:text-xl font-medium text-[#555555] dark:text-[#A0A0A0] max-w-xl leading-relaxed">
            Driven by a strong foundation in Computer Science, I focus on crafting scalable, robust applications using modern technologies. My expertise spans full-stack development, system architecture, and algorithmic problem-solving, always prioritizing clean, efficient code and continuous learning.
          </p>

          <div className="flex flex-wrap gap-4 mt-10">
            <button className="px-8 py-3 rounded-none bg-[#0A0A0A] dark:bg-white text-white dark:text-[#0A0A0A] font-semibold tracking-wide border-2 border-[#0A0A0A] dark:border-white hover:opacity-80 transition-opacity">
              View My Work &rarr;
            </button>
            <button className="px-8 py-3 rounded-none bg-transparent text-[#0A0A0A] dark:text-white font-semibold tracking-wide border-2 border-[#0A0A0A] dark:border-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] transition-colors">
              Let's Connect
            </button>
          </div>
        </div>

        {/* Right Column: The Scroll-Animated Image */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <div className="w-fit mx-auto lg:ml-auto lg:mr-0">
            <div className="relative p-2 border-2 border-[#0A0A0A] dark:border-white/40 w-fit mx-auto lg:ml-auto lg:mr-0">
              <img 
                src="/assets/profile.jpeg" 
                alt="Muhammad Ismail" 
                className="w-[300px] md:w-[400px] aspect-square object-cover grayscale-0 hover:grayscale transition-all duration-500" 
              />
            </div>
            <p className="mt-3 text-sm font-mono text-[#555555] dark:text-[#A0A0A0]">
              Muhammad Ismail
            </p>
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}

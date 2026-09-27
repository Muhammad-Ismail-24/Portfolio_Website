export default function Capabilities() {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center pt-16 pb-6 px-6 md:px-16 lg:px-24 z-10 overflow-hidden">
      {/* Header */}
      <div className="flex flex-row flex-wrap justify-center gap-x-4 mb-4">
        <span className="text-[9vw] lg:text-[5.5vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">
          Core
        </span>
        <span className="text-[9vw] lg:text-[5.5vw] font-black tracking-tighter text-hollow leading-none">
          Capabilities.
        </span>
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 w-full max-w-6xl">
        {/* Card 1: Tech Stack */}
        <div className="col-span-1 row-span-2 bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_0px_#0A0A0A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1">
          <h3 className="text-4xl font-black text-[#0A0A0A] dark:text-white mb-3 tracking-tight">
            Tech Stack
          </h3>
          <p className="text-lg lg:text-xl font-medium text-[#555555] dark:text-[#94A3B8] leading-snug">
            C++ / Python / Java / JavaScript / React / Node.js / FastAPI / Git
          </p>
          <div className="mt-auto pt-2">
            <div className="w-full max-w-[220px] aspect-[5/3] grid grid-cols-5 grid-rows-3 border-t border-l border-[#0A0A0A] dark:border-white/20">
              {[...Array(15)].map((_, i) => (
                <div key={i} className="border-b border-r border-[#0A0A0A] dark:border-white/20 flex items-center justify-center">
                  {(i === 6 || i === 8) && (
                    <div className="w-3 h-3 border-2 border-[#0A0A0A] dark:border-white bg-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Multi-Agent AI Architecture */}
        <div className="col-span-1 lg:col-span-2 row-span-1 bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_0px_#0A0A0A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6 items-start">
            <svg className="w-16 h-16 shrink-0 text-[#0A0A0A] dark:text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M6.5 7.5l4 3M17.5 7.5l-4 3M6.5 16.5l4-3M17.5 16.5l-4-3M12 9v2M12 15v-2"/>
            </svg>
            <div>
              <h3 className="text-xl lg:text-2xl font-black text-[#0A0A0A] dark:text-white mb-1 tracking-tight">
                Multi-Agent AI Architecture
              </h3>
              <p className="text-sm font-medium text-[#555555] dark:text-[#94A3B8] leading-snug">
                Orchestrating autonomous AI agents for complex, collaborative tasks with efficient consensus algorithms. Designed for scalability, fault tolerance, and dynamic problem solving using advanced vector retrieval and LangGraph.
              </p>
            </div>
          </div>
        </div>

        {/* Card 3: Full-Stack Web */}
        <div className="col-span-1 row-span-1 bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_0px_#0A0A0A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1">
          <h3 className="text-3xl font-black text-[#0A0A0A] dark:text-white mb-2 tracking-tight">
            Full-Stack Web
          </h3>
          <p className="text-sm font-medium text-[#555555] dark:text-[#94A3B8] leading-snug">
            Frontend & Backend <br/> RESTful APIs & CORS <br/> Database Management
          </p>
        </div>

        {/* Card 4: Autonomous Pipelines */}
        <div className="col-span-1 row-span-1 bg-[#F4EFE6] dark:bg-[#080A17] border-2 border-[#0A0A0A] dark:border-[#2A2A34] rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[8px_8px_0px_0px_#0A0A0A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1">
          <h3 className="text-3xl font-black text-[#0A0A0A] dark:text-white mb-2 tracking-tight">
            Autonomous Pipelines
          </h3>
          <p className="text-sm font-medium text-[#555555] dark:text-[#94A3B8] leading-snug">
            Workflow Orchestration <br/> ETL & Data Ingestion <br/> CI/CD Integration
          </p>
          <svg className="absolute bottom-6 right-6 w-10 h-10 text-[#0A0A0A] dark:text-white/80 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>
      </div>
    </section>
  );
}

import React from 'react';

const contactLinks = [
  {
    name: 'Email',
    href: '#',
    icon: (
      <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    )
  },
  {
    name: 'LinkedIn',
    href: '#',
    icon: (
      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )
  },
  {
    name: 'GitHub',
    href: '#',
    icon: (
      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )
  }
];

const Contact = () => {
  return (
    <section className="relative w-full h-screen flex flex-col justify-center pt-16 pb-8 px-6 md:px-16 lg:px-24 z-10 overflow-hidden">
      {/* Heading */}
      <div className="flex flex-row flex-wrap items-center gap-x-4 mb-10 lg:mb-14">
        <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-[#0A0A0A] dark:text-white leading-none">Get in</span>
        <span className="text-[10vw] lg:text-[7vw] font-black tracking-tighter text-hollow leading-none">Touch.</span>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 w-full max-w-7xl mx-auto">
        
        {/* Left Column: Text & Status Indicator */}
        <div className="flex flex-col">
          <p className="text-lg lg:text-xl font-medium text-[#555555] dark:text-[#94A3B8] leading-snug max-w-lg">
            Whether you need to integrate autonomous multi-agent pipelines or engineer a robust full-stack application, I'm ready to discuss how my expertise can bring your technical vision to life.
          </p>
          <div className="flex items-center gap-3 mt-6 lg:mt-8">
            <div className="relative flex h-4 w-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>
            <span className="text-lg font-medium text-[#0A0A0A] dark:text-white">Available for Roles</span>
          </div>
        </div>

        {/* Right Column: Contact Links List */}
        <div className="flex flex-col w-full border-t border-[#0A0A0A]/20 dark:border-white/20">
          {contactLinks.map((link, index) => (
            <a 
              key={index} 
              href={link.href} 
              className="group flex items-center justify-between w-full py-4 lg:py-5 border-b border-[#0A0A0A]/20 dark:border-white/20 hover:bg-[#0A0A0A]/5 dark:hover:bg-white/5 transition-colors px-4 -mx-4 rounded-lg"
            >
              <div className="flex items-center gap-6">
                {/* Left Icon */}
                <div className="w-8 h-8 lg:w-10 lg:h-10 text-[#0A0A0A] dark:text-white flex items-center justify-center">
                   {link.icon}
                </div>
                <span className="text-xl lg:text-2xl font-normal antialiased text-[#0A0A0A] dark:text-white tracking-wide">
                  {link.name}
                </span>
              </div>
              
              {/* Right Icon: Circle with Up-Right Arrow */}
              <div className="w-10 h-10 rounded-full border border-[#0A0A0A]/30 dark:border-white/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 lg:w-6 lg:h-6 text-[#0A0A0A] dark:text-white" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                </svg>
              </div>
            </a>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Contact;

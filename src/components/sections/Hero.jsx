/**
 * Hero — Section 1: Full-viewport hero with brutalist typography.
 *
 * Architecture:
 * - Massive 12vw Title Case name with hollow stroke on "Ismail"
 * - "Explore Work" CTA button with thick border and hover inversion
 * - Tagline absolutely anchored to bottom-right
 */
export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24">
      {/* Massive Typography - Flush Left */}
      <div className="flex flex-col mt-20">
        <h1 className="text-[12vw] leading-[0.85] font-black tracking-tighter text-[#0A0A0A] dark:text-white m-0 p-0">
          Muhammad
        </h1>
        <h1 className="text-[12vw] leading-[0.85] font-black tracking-tighter text-hollow m-0 p-0">
          Ismail
        </h1>

        {/* Explore Work Button */}
        <div className="mt-12">
          <button className="px-7 py-3 rounded-md border-2 border-[#0A0A0A] dark:border-white text-[#0A0A0A] dark:text-white text-sm font-semibold tracking-wide flex items-center gap-2 hover:bg-[#0A0A0A] hover:text-[#F5F3EC] transition-all duration-300">
            Explore Work <span className="text-lg leading-none">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Tagline - Absolutely Positioned to Bottom Right */}
      <div className="absolute bottom-16 right-6 md:right-16 lg:right-24 text-right">
        <p className="text-xl md:text-2xl font-medium text-[#555555] dark:text-[#A0ABC0] leading-snug">
          Architecting Multi-Agent AI.<br />
          Shipping Robust Full-Stack<br />
          Experiences.
        </p>
      </div>
    </section>
  )
}

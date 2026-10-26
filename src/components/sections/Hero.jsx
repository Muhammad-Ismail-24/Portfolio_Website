/**
 * Hero — Section 1: Full-viewport hero with brutalist typography.
 *
 * - Massive 12vw name with hollow stroke on "Ismail"
 * - The hollow letters fill with ink under a cursor spotlight (touch: under
 *   your finger). On load a slow sweep shows that it's alive.
 * - "Explore Work" CTA, tagline anchored bottom-right (phones: in the flow
 *   between the name and the button)
 */
import { useEffect, useRef } from 'react'
import { useSmoothScroll } from '../../hooks/useSmoothScroll'
import { prefersReducedMotion } from '../../utils/bus'

export default function Hero() {
  const scrollToSection = useSmoothScroll()
  const sectionRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const name = nameRef.current
    if (!section || !name) return
    const reduced = prefersReducedMotion()
    let sweepRaf = 0
    let userTookOver = false

    const setSpot = (x, y, r) => {
      name.style.setProperty('--spot-x', `${x}px`)
      name.style.setProperty('--spot-y', `${y}px`)
      if (r !== undefined) name.style.setProperty('--spot-r', r)
    }

    const move = (e) => {
      userTookOver = true
      cancelAnimationFrame(sweepRaf)
      const r = name.getBoundingClientRect()
      setSpot(e.clientX - r.left, e.clientY - r.top, 'var(--spot-size)')
    }
    const leave = () => name.style.setProperty('--spot-r', '0px')

    section.addEventListener('pointermove', move, { passive: true })
    section.addEventListener('pointerdown', move, { passive: true })
    section.addEventListener('pointerleave', leave)

    // Opening sweep: the spotlight glides once across the outlined name
    if (!reduced) {
      const start = performance.now() + 700
      const dur = 2300
      const step = (now) => {
        if (userTookOver) return
        const r = name.getBoundingClientRect()
        const t = (now - start) / dur
        if (t < 0) { sweepRaf = requestAnimationFrame(step); return }
        if (t > 1) { leave(); return }
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        setSpot(-0.15 * r.width + e * 1.3 * r.width, r.height * (0.55 + Math.sin(t * Math.PI) * 0.1), 'var(--spot-size)')
        sweepRaf = requestAnimationFrame(step)
      }
      sweepRaf = requestAnimationFrame(step)
    }

    return () => {
      cancelAnimationFrame(sweepRaf)
      section.removeEventListener('pointermove', move)
      section.removeEventListener('pointerdown', move)
      section.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <section id="top" ref={sectionRef} className="relative w-full min-h-[100svh] md:h-screen flex flex-col justify-center px-6 md:px-16 lg:px-24 pt-24 pb-12 md:py-0">
      {/* Massive Typography - Flush Left (phones: name fills the width) */}
      <div className="flex flex-col mt-0">
        <h1 className="m-0 p-0 text-[clamp(48px,16.4vw,96px)] md:text-[12vw] leading-[0.85] font-black tracking-tighter text-[#0A0A0A] dark:text-white">
          <span className="block">Muhammad</span>
          <span ref={nameRef} className="spotlight-name block w-fit">
            <span className="text-hollow">Ismail</span>
            <span className="spotlight-fill" aria-hidden="true">Ismail</span>
          </span>
        </h1>

        {/* phones: the tagline sits in the flow, between the name and the button */}
        <p className="md:hidden mt-8 text-[19px] font-medium text-[#555555] dark:text-[#A0ABC0] leading-snug">
          Architecting Multi-Agent AI.<br />
          Shipping Robust Full-Stack Experiences.
        </p>

        {/* Explore Work Button */}
        <div className="mt-10 md:mt-12">
          <button onClick={(e) => scrollToSection(e, 'portfolio')} className="min-h-[52px] md:min-h-0 px-7 py-3 rounded-md border-2 border-[#0A0A0A] dark:border-white text-[#0A0A0A] dark:text-white text-sm font-semibold tracking-wide flex items-center gap-2 hover:bg-[#0A0A0A] hover:text-[#F5F3EC] dark:hover:bg-white dark:hover:text-[#0A0F1E] transition-all duration-300">
            Explore Work <span className="text-lg leading-none">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Tagline - Absolutely Positioned to Bottom Right */}
      <div className="hidden md:block absolute bottom-16 right-16 lg:right-24 text-right">
        <p className="text-xl md:text-2xl font-medium text-[#555555] dark:text-[#A0ABC0] leading-snug">
          Architecting Multi-Agent AI.<br />
          Shipping Robust Full-Stack<br />
          Experiences.
        </p>
      </div>
    </section>
  )
}

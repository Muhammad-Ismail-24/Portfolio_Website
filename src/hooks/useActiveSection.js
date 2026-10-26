import { useEffect, useState } from 'react'

/**
 * The id of the section under the reading line (40% down the viewport), or
 * null above the first one. Ids must be listed in page order.
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(null)
  const key = ids.join(',')

  useEffect(() => {
    const list = key.split(',')
    let raf = 0
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.4
      let current = null
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [key])

  return active
}

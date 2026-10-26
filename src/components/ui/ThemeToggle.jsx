import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../../hooks/useTheme'

/** Sun/moon button that flips the site theme. */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-ink/70 hover:text-ink hover:bg-ink/[0.06] dark:hover:bg-white/[0.08] transition-colors duration-200 ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? 'sun' : 'moon'}
          className="block"
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {isDark ? (
              /* sun: shown in dark mode → go light */
              <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>
            ) : (
              /* moon: shown in light mode → go dark */
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            )}
          </svg>
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

import { useTheme } from '../../hooks/useTheme'

/**
 * Navbar — Frosted glass navigation pill.
 *
 * Fixed at top-center of viewport with rounded pill shape,
 * backdrop-blur frosted glass effect, and theme toggle button.
 */
export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()

  const links = ['Portfolio', 'About', 'Stack', 'Services', 'Contact']

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className="
          flex items-center gap-1
          px-2 py-2
          rounded-full
          border border-[var(--color-nav-border)]
          bg-[var(--color-nav-bg)]
          backdrop-blur-md
          shadow-lg shadow-black/[0.03]
          dark:shadow-black/[0.2]
          dark:bg-[#162032]/70 dark:border-white/10 dark:text-white
        "
      >
        {links.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className={`
              px-4 py-2 text-sm font-medium
              rounded-full
              text-ink/80 hover:text-ink
              transition-all duration-200
              whitespace-nowrap
              ${link === 'Portfolio' 
                ? 'bg-ink/[0.06] dark:bg-white/5' 
                : 'hover:bg-ink/[0.06] dark:hover:bg-white/[0.08]'
              }
            `}
          >
            {link}
          </a>
        ))}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="
            ml-1 p-2.5
            rounded-full
            text-ink/70 hover:text-ink
            hover:bg-ink/[0.06] dark:hover:bg-white/[0.08]
            transition-all duration-200
          "
        >
          {isDark ? (
            /* Sun icon (shown in dark mode → click to go light) */
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="M4.93 4.93l1.41 1.41" />
              <path d="M17.66 17.66l1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="M6.34 17.66l-1.41 1.41" />
              <path d="M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            /* Moon icon (shown in light mode → click to go dark) */
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}

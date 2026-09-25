/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: 'var(--color-canvas)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        'nav-bg': 'var(--color-nav-bg)',
        'nav-border': 'var(--color-nav-border)',
      },
      fontSize: {
        'hero': ['clamp(4.5rem, 12vw, 14rem)', { lineHeight: '0.9', letterSpacing: '-0.03em', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
}

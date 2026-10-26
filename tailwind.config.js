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
        // rgb channels so opacity modifiers (text-ink/80, bg-ink/[0.06]) work
        canvas: 'rgb(var(--canvas-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb) / <alpha-value>)',
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

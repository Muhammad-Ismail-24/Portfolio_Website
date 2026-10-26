import { useSyncExternalStore } from 'react'

/**
 * Light/dark theme as one shared store, so the navbar toggle, the hidden
 * terminal (`theme dark`) and anything else stay in sync.
 * Persists to localStorage and applies the `dark` class to <html>.
 */
const listeners = new Set()

function readInitial() {
  if (typeof window === 'undefined') return false
  try {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
  } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

let isDarkState = readInitial()
apply(isDarkState)

function apply(dark) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
  // the phone browser's address bar follows the site theme
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0A0F1E' : '#F4EFE6'))
  try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch { /* storage blocked */ }
}

export function setTheme(dark) {
  if (dark === isDarkState) return
  isDarkState = dark
  apply(dark)
  listeners.forEach((l) => l())
}

export const getIsDark = () => isDarkState

function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getIsDark, () => false)
  return { isDark, toggleTheme: () => setTheme(!isDarkState), setTheme }
}

import { useEffect, useState } from 'react'

// Light / dark theme. The choice is a per-device convenience, so it lives in localStorage;
// index.html applies it before the first paint to avoid a flash.

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'officer-prep-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

const resolve = (p: ThemePref) => (p === 'system' ? (media().matches ? 'dark' : 'light') : p)

function apply(p: ThemePref) {
  const theme = resolve(p)
  document.documentElement.dataset.theme = theme
  // Phone status bar / installed-app title bar follow the theme too.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000')
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)

  useEffect(() => {
    apply(pref)
    try {
      if (pref === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, pref)
    } catch { /* storage unavailable — the choice lasts for this visit */ }
    if (pref !== 'system') return
    const m = media()
    const on = () => apply('system')
    m.addEventListener('change', on)
    window.addEventListener('focus', on) // also catch OS switches made while the app was in the background
    return () => { m.removeEventListener('change', on); window.removeEventListener('focus', on) }
  }, [pref])

  return { pref, setPref }
}

/** Current resolved theme, read straight from <html> (cheap enough for animation frames). */
export const isLight = () => document.documentElement.dataset.theme === 'light'

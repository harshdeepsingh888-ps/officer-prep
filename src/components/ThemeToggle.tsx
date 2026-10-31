import type { ReactNode } from 'react'
import { useTheme, type ThemePref } from '../lib/theme'

const icon = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>
)

const OPTIONS: { id: ThemePref; label: string; svg: ReactNode }[] = [
  { id: 'system', label: 'Match system', svg: icon(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>) },
  { id: 'light', label: 'Light', svg: icon(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>) },
  { id: 'dark', label: 'Dark', svg: icon(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />) },
]

export function ThemeToggle() {
  const { pref, setPref } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="flex shrink-0 items-center gap-0.5 rounded-full bg-fg/[0.06] p-1">
      {OPTIONS.map(o => (
        <button key={o.id} role="radio" aria-checked={pref === o.id} aria-label={o.label} title={o.label} onClick={() => setPref(o.id)}
          className={`flex size-7 items-center justify-center rounded-full pointer-coarse:size-9 transition-colors ${pref === o.id ? 'bg-fg/[0.12] text-fg' : 'text-ink-500 hover:text-fg'}`}>
          {o.svg}
        </button>
      ))}
    </div>
  )
}

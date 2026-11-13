import { MonitorIcon, MoonIcon, SunIcon, type Icon } from '@phosphor-icons/react'
import { useTheme, type ThemePref } from '../lib/theme'
import { focusRing } from './ui'

const OPTIONS: { id: ThemePref; label: string; Glyph: Icon }[] = [
  { id: 'system', label: 'Match system', Glyph: MonitorIcon },
  { id: 'light', label: 'Light', Glyph: SunIcon },
  { id: 'dark', label: 'Dark', Glyph: MoonIcon },
]

export function ThemeToggle() {
  const { pref, setPref } = useTheme()
  return (
    <div role="radiogroup" aria-label="Theme" className="flex shrink-0 items-center gap-1 rounded-full bg-fg/[0.06] p-1">
      {OPTIONS.map(({ id, label, Glyph }) => (
        <button key={id} role="radio" aria-checked={pref === id} aria-label={label} title={label} onClick={() => setPref(id)}
          className={`flex size-8 items-center justify-center rounded-full transition-colors duration-300 ease-soft pointer-coarse:size-9 ${focusRing} ${pref === id ? 'bg-fg/[0.12] text-fg' : 'text-ink-400 hover:text-fg'}`}>
          <Glyph className="size-4" weight={pref === id ? 'fill' : 'regular'} aria-hidden />
        </button>
      ))}
    </div>
  )
}

import type { ButtonHTMLAttributes, ReactNode } from 'react'

// Elements float on the black canvas: no boxes, borders or shadows.
// Sections are marked by an amber uppercase label and whitespace.

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`py-2 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3 pointer-coarse:[&>a]:-my-3 pointer-coarse:[&>a]:py-3">
          {title && <h2 className="label text-saffron-400">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'subtle'; size?: 'sm' | 'md' | 'lg' }

/** primary = the violet pill, one per view. subtle = quiet filled pill. ghost/danger = bare text. */
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: BtnProps) {
  const v = {
    primary: 'bg-iris-500 text-white hover:bg-iris-400 disabled:bg-ink-800 disabled:text-ink-500',
    subtle: 'bg-fg/[0.07] text-ink-100 hover:bg-fg/[0.13] disabled:opacity-40',
    ghost: 'text-ink-400 hover:text-fg disabled:opacity-40',
    danger: 'text-ember-300 hover:text-ember-200 disabled:opacity-40',
  }[variant]
  // On touch screens every button is at least 40px tall, so it can be hit with a thumb.
  const s = { sm: 'px-3 py-1.5 text-[11px] pointer-coarse:min-h-10 pointer-coarse:px-4', md: 'px-4 py-2.5 pointer-coarse:min-h-11', lg: 'px-6 py-3.5' }[size]
  return <button className={`label inline-flex items-center justify-center gap-1.5 rounded-full transition-colors disabled:cursor-not-allowed ${v} ${s} ${className}`} {...rest} />
}

export function Badge({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'iris' | 'saffron' | 'ember' | 'verdant' }) {
  const t = {
    ink: 'bg-fg/[0.07] text-ink-300',
    iris: 'bg-iris-500/15 text-iris-300',
    saffron: 'bg-saffron-400/[0.12] text-saffron-300',
    ember: 'bg-ember-500/15 text-ember-300',
    verdant: 'bg-verdant-500/20 text-verdant-300',
  }[tone]
  return <span className={`tracking-label inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase ${t}`}>{children}</span>
}

export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-fg/[0.08] ${className}`}>
      <div className="h-full rounded-full bg-iris-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="-mx-5 mb-8 flex gap-7 overflow-x-auto px-5 sm:mb-10 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`label flex shrink-0 items-center gap-2 py-1 transition-colors pointer-coarse:py-3 ${value === t.id ? 'text-fg' : 'text-ink-500 hover:text-ink-200'}`}>
          <span className={`size-1.5 rounded-full ${value === t.id ? 'bg-iris-500' : 'bg-transparent'}`} />
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Oversized headline on the left, light lead copy on the right. */
export function PageHeader({ title, subtitle, action, eyebrow }: { title: string; subtitle?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-10 grid gap-5 pt-2 sm:mb-14 sm:gap-6 sm:pt-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
      <h1 className="text-[clamp(2.75rem,6vw,4.875rem)] font-normal leading-none tracking-display text-fg">{title}</h1>
      {(subtitle || action || eyebrow) && (
        <div className="lg:pb-2">
          {eyebrow && <div className="label mb-3 text-saffron-400">{eyebrow}</div>}
          {subtitle && <p className="max-w-[520px] text-lead font-extralight leading-relaxed text-ink-300">{subtitle}</p>}
          {action && <div className="mt-5">{action}</div>}
        </div>
      )}
    </header>
  )
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="label text-[11px] text-ink-500">{label}</div>
      <div className="mt-2 text-[42px] font-normal leading-none tracking-display tabular-nums text-fg">{value}</div>
      {hint && <div className="mt-2 text-xs font-light text-ink-500">{hint}</div>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="py-6 text-sm font-light text-ink-500">{children}</div>
}

export function TimerBar({ remaining, total, label }: { remaining: number; total: number; label?: string }) {
  const low = remaining <= Math.max(5, total * 0.15)
  return (
    <div className="flex items-center gap-4">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/[0.08]">
        <div className={`h-full transition-[width] duration-200 ${low ? 'bg-saffron-400' : 'bg-iris-500'}`} style={{ width: `${(remaining / total) * 100}%` }} />
      </div>
      <span className={`min-w-14 text-right text-sm tabular-nums ${low ? 'text-saffron-400' : 'text-ink-300'}`}>
        {label ?? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
      </span>
    </div>
  )
}

/** Reading-comprehension / cloze passage shown above a question. */
export function Passage({ text, collapsible = false }: { text: string; collapsible?: boolean }) {
  if (collapsible) {
    return (
      <details className="mb-3 rounded-3xl bg-fg/[0.04] px-5 py-3 text-sm">
        <summary className="label cursor-pointer text-[11px] text-ink-400">Passage</summary>
        <div className="mt-3 whitespace-pre-wrap leading-relaxed text-ink-200">{text}</div>
      </details>
    )
  }
  return <div className="mt-6 max-h-80 overflow-auto whitespace-pre-wrap rounded-3xl bg-fg/[0.04] px-6 py-5 text-[15px] leading-relaxed text-ink-200">{text}</div>
}

/** Field look without size — combine with your own width, padding and text size. */
export const inputBase = 'rounded-3xl bg-fg/[0.06] text-fg placeholder:text-ink-600 outline-none ring-1 ring-transparent transition focus:ring-iris-500'
export const inputCls = `${inputBase} w-full px-4 py-2.5 text-sm`
export const labelCls = 'label mb-2 block text-[11px] text-ink-500'

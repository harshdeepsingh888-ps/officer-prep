import { Children, type ButtonHTMLAttributes, type ReactNode } from 'react'

// The app's shared pieces, in the landing page's look: flat rounded tiles, named text styles, one saffron
// accent for the main action, the spacing table (4, 8, 12, 16, 24, 32…) and the soft deceleration curve.

/** Focus ring for anything clickable: visible on keyboard focus, never on a mouse click. */
export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas'

/** A titled tile. 24px corners, 24px padding on phones and 32px from small screens up. */
export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-3xl bg-surface p-6 sm:p-8 ${className}`}>
      {(title || action) && (
        <div className="mb-6 flex items-center justify-between gap-3 pointer-coarse:[&>a]:-my-3 pointer-coarse:[&>a]:py-3">
          {title && <h2 className="title-2 text-fg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

/** "Planner →" style link in a tile's header. */
export function TileLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={`shrink-0 rounded-lg caption-1 text-ink-400 transition-colors duration-300 ease-soft hover:text-fg ${focusRing}`}>
      {children} <span aria-hidden>→</span>
    </a>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'subtle'; size?: 'sm' | 'md' | 'lg' }

/** primary = the saffron button, one per view. subtle = quiet filled button. ghost/danger = bare text. */
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: BtnProps) {
  const v = {
    primary: 'bg-accent-500 text-on-accent hover:bg-accent-400 disabled:bg-surface-3 disabled:text-ink-500',
    subtle: 'bg-fg/[0.07] text-fg hover:bg-fg/[0.12] disabled:opacity-40',
    ghost: 'text-ink-300 hover:text-fg disabled:opacity-40',
    danger: 'text-ember-300 hover:text-ember-200 disabled:opacity-40',
  }[variant]
  // Main buttons: 8px by 12px. On touch screens every button is at least 40px tall, so it can be hit with a thumb.
  const s = {
    sm: 'px-3 py-1 button-sm pointer-coarse:min-h-10',
    md: 'px-3 py-2 button-md pointer-coarse:min-h-11',
    lg: 'px-4 py-3 button-md',
  }[size]
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg transition-[background-color,color,transform] duration-300 ease-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${focusRing} ${v} ${s} ${className}`} {...rest} />
  )
}

/** A pill for picking one value (an exam, a filter). The chosen one is filled saffron, as on the landing page. */
export function Chip({ active, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button type="button" aria-pressed={active} {...rest}
      className={`shrink-0 rounded-full px-3 py-1 title-4 transition-colors duration-300 ease-soft pointer-coarse:min-h-9 ${focusRing} ${active ? 'bg-accent-500 text-on-accent' : 'bg-fg/[0.07] text-ink-300 hover:bg-fg/[0.12] hover:text-fg'} ${className}`} />
  )
}

/** A row of numbers, each in its own tile: two to a row on phones, four from large screens (or as `className` says). */
export function StatGrid({ children, className = 'lg:grid-cols-4' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`grid grid-cols-2 gap-4 ${className}`}>
      {Children.toArray(children).map((c, i) => <div key={i} className="min-w-0 rounded-3xl bg-surface p-4 sm:p-6">{c}</div>)}
    </section>
  )
}

/** A small status mark. Sentence case: the first letter is raised, the rest stays as written. */
export function Badge({ children, tone = 'ink' }: { children: ReactNode; tone?: 'ink' | 'accent' | 'saffron' | 'ember' | 'verdant' }) {
  const t = {
    ink: 'bg-fg/[0.07] text-ink-300',
    accent: 'bg-accent-500/15 text-accent-300',
    saffron: 'bg-saffron-400/[0.12] text-saffron-300',
    ember: 'bg-ember-500/15 text-ember-300',
    verdant: 'bg-verdant-500/20 text-verdant-300',
  }[tone]
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 caption-4 first-letter:uppercase ${t}`}>{children}</span>
}

export function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-fg/[0.08] ${className}`}>
      <div className="h-full origin-left rounded-full bg-accent-500 transition-[width] duration-500 ease-soft" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

/** Section switcher: a row of pills; the current one is filled. */
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string }[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:mb-12 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} aria-pressed={value === t.id}
          className={`shrink-0 rounded-full px-4 py-2 title-4 transition-colors duration-300 ease-soft pointer-coarse:min-h-10 ${focusRing} ${value === t.id ? 'bg-fg text-canvas' : 'text-ink-400 hover:bg-fg/[0.06] hover:text-fg'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Page title with the hero gradient, then a short line on what the page is for (both capped at 680px). */
export function PageHeader({ title, subtitle, action, eyebrow }: { title: string; subtitle?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-12 pt-4 sm:mb-16 sm:pt-8">
      {eyebrow && <div className="mb-4 title-4 text-accent-300">{eyebrow}</div>}
      <h1 className="max-w-[680px] heading-3 hero-text sm:heading-2">{title}</h1>
      {subtitle && <p className="mt-4 max-w-[680px] body-3 text-ink-300">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </header>
  )
}

/** A number with its label. The label keeps the `label` class: tests and older pages find stats by it. */
export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="label text-ink-400">{label}</div>
      <div className="mt-2 heading-3 tabular-nums text-fg">{value}</div>
      {hint && <div className="mt-2 caption-5 text-ink-500">{hint}</div>}
    </div>
  )
}

/** What a list says before there is anything in it. */
export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line px-6 py-8 text-center body-6 text-ink-400">{children}</div>
}

export function TimerBar({ remaining, total, label }: { remaining: number; total: number; label?: string }) {
  const low = remaining <= Math.max(5, total * 0.15)
  return (
    <div className="flex items-center gap-4">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-fg/[0.08]">
        <div className={`h-full transition-[width] duration-200 ${low ? 'bg-ember-500' : 'bg-accent-500'}`} style={{ width: `${(remaining / total) * 100}%` }} />
      </div>
      <span className={`min-w-14 text-right title-4 tabular-nums ${low ? 'text-ember-300' : 'text-ink-300'}`}>
        {label ?? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
      </span>
    </div>
  )
}

/** Reading-comprehension / cloze passage shown above a question. */
export function Passage({ text, collapsible = false }: { text: string; collapsible?: boolean }) {
  if (collapsible) {
    return (
      <details className="mb-3 rounded-2xl bg-surface-2 px-6 py-3 body-6">
        <summary className="cursor-pointer title-4 text-ink-300">Passage</summary>
        <div className="mt-3 whitespace-pre-wrap text-ink-200">{text}</div>
      </details>
    )
  }
  return <div className="mt-6 max-h-80 overflow-auto whitespace-pre-wrap rounded-2xl bg-surface-2 px-6 py-6 body-3 text-ink-200">{text}</div>
}

/** Field look without size — combine with your own width, padding and text size. */
export const inputBase = 'rounded-lg bg-surface-2 text-fg placeholder:text-ink-500 outline-none ring-1 ring-line transition-shadow duration-300 ease-soft focus:ring-2 focus:ring-accent-300'
export const inputCls = `${inputBase} w-full px-3 py-2 body-6`
export const labelCls = 'mb-2 block caption-1 text-ink-400'

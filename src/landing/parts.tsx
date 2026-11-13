import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { ArrowRightIcon } from '@phosphor-icons/react'
import { APP_HREF, CTA, DISCLAIMER } from './content'

// Building blocks shared by the landing, legal and 404 pages.

export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

/** The brand mark: an upward chevron in saffron. */
export function Logo({ className = 'size-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`text-saffron ${className}`} aria-hidden>
      <path d="M12 2.5 21.5 20 12 14.8 2.5 20Z" fill="currentColor" />
    </svg>
  )
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2'

/** The one primary action: opens the app. 8px by 12px padding, Button-md, as the skill sets for main buttons. */
export function PrimaryCta({ size = 'md', className = '', onDark = true }: { size?: 'md' | 'sm'; className?: string; onDark?: boolean }) {
  return (
    <a href={asset(APP_HREF)}
      className={`group inline-flex items-center gap-2 rounded-lg bg-saffron px-3 py-2 text-ink transition-[background-color,transform] duration-300 ease-soft hover:bg-saffron-hover active:scale-[0.98] ${focusRing} ${onDark ? 'focus-visible:ring-offset-night' : 'focus-visible:ring-offset-paper'} ${size === 'sm' ? 'button-sm' : 'button-md'} ${className}`}>
      {CTA}
      <ArrowRightIcon weight="bold" className="size-4 transition-transform duration-300 ease-soft group-hover:translate-x-0.5" aria-hidden />
    </a>
  )
}

/** A quiet secondary link, styled as a button. */
export function SecondaryLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href}
      className={`inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 button-md text-white transition-[background-color,transform] duration-300 ease-soft hover:bg-white/10 active:scale-[0.98] ${focusRing} focus-visible:ring-offset-night ${className}`}>
      {children}
    </a>
  )
}

/** Rises 32px and fades in once, the first time it scrolls into view. Reduced motion: a plain fade. */
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { rootMargin: '0px 0px -10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-soft motion-reduce:translate-y-0 ${shown ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} ${className}`}>
      {children}
    </div>
  )
}

/** A screenshot that shows a layout-shaped skeleton until it loads. */
function Shot({ src, alt, eager = false, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-night-2 ${loaded ? '' : 'animate-pulse'} ${className}`}>
      <img src={asset(src)} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)}
        className={`size-full object-cover object-top transition-opacity duration-500 ease-soft ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  )
}

/** A phone with a real screenshot of the app. Frame 32px corners, 8px bezel, so the screen takes 24px (32 − 8). */
export function Phone({ src, alt, eager, className = '', style }: { src: string; alt: string; eager?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div className={`rounded-4xl border border-white/10 bg-night-3 p-2 ${className}`} style={style}>
      <Shot src={src} alt={alt} eager={eager} className="aspect-[390/844] rounded-3xl" />
    </div>
  )
}

/** A laptop with a real screenshot. Lid 16px corners, 8px bezel, so the screen takes 8px (16 − 8). */
export function Laptop({ src, alt, eager, className = '' }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-2xl border border-white/10 bg-night-3 p-2">
        <Shot src={src} alt={alt} eager={eager} className="aspect-[16/10] rounded-lg" />
      </div>
      <div className="mx-auto h-3 w-[112%] -translate-x-[5.4%] rounded-xl border border-white/10 bg-night-4" aria-hidden />
    </div>
  )
}

/**
 * The tagline, lit up one word at a time as the section scrolls past: words start at 30% opacity and turn full in
 * reading order as scrolling progresses. One scroll listener, throttled through requestAnimationFrame and attached
 * only while the section is near the screen. Reduced motion: every word at full opacity from the start.
 */
export function TaglineReveal({ lines, className = '' }: { lines: readonly string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const words = lines.map(l => l.split(' '))
  const total = words.reduce((n, w) => n + w.length, 0)
  const [lit, setLit] = useState(() => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches ? total : 0))

  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      frame = 0
      const r = el.getBoundingClientRect(), vh = innerHeight
      // From the paragraph's top reaching 80% of the screen to its bottom reaching 45%.
      const progress = (vh * 0.8 - r.top) / (vh * 0.35 + r.height)
      setLit(Math.max(0, Math.min(total, Math.round(progress * total))))
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); update() } else removeEventListener('scroll', onScroll)
    }, { rootMargin: '25% 0px 25% 0px' })
    io.observe(el)
    return () => { io.disconnect(); removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [total])

  let i = 0
  return (
    <p ref={ref} className={className}>
      <span className="sr-only">{lines.join(' ')}</span>
      {words.map((line, l) => (
        <span key={l} className="block" aria-hidden>
          {line.map((w, k) => {
            const on = i++ < lit
            return <span key={k} className={`transition-opacity duration-500 ease-soft ${on ? 'opacity-100' : 'opacity-30'}`}>{w}{k < line.length - 1 ? ' ' : ''}</span>
          })}
        </span>
      ))}
    </p>
  )
}

const LINKS = [{ id: 'features', label: 'Features' }, { id: 'how', label: 'How it works' }, { id: 'faq', label: 'FAQ' }]

/** Marks the nav link of the section you are reading. */
function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const els = ids.map(id => document.getElementById(id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
    }, { rootMargin: '-45% 0px -50% 0px' })
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [ids])
  return active
}

/** A compact bar floating off the top edge; on phones, a full-height menu whose links arrive one after another. */
export function Nav({ links = true }: { links?: boolean }) {
  const [open, setOpen] = useState(false)
  const [entered, setEntered] = useState(false)
  const active = useScrollSpy(links ? ['top', ...LINKS.map(l => l.id)] : [])

  useEffect(() => {
    if (!open) { setEntered(false); return }
    const raf = requestAnimationFrame(() => setEntered(true))
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  const bar = 'absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-white transition-transform duration-500 ease-soft'
  return (
    <>
      <a href="#main" className="sr-only rounded-lg bg-saffron px-3 py-2 button-sm text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Skip to content</a>
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav aria-label="Main" className="flex items-center gap-6 rounded-full border border-white/10 bg-night-1/70 py-2 pl-4 pr-2 backdrop-blur-xl">
          <a href={links ? '#top' : asset('')} className={`flex items-center gap-2 rounded-lg title-4 text-white ${focusRing} focus-visible:ring-offset-night`}>
            <Logo className="size-5" /><span className="whitespace-nowrap">Officer Prep</span>
          </a>
          {links && (
            <ul className="hidden items-center gap-6 md:flex">
              {LINKS.map(l => (
                <li key={l.id}>
                  <a href={`#${l.id}`} aria-current={active === l.id ? 'true' : undefined}
                    className={`rounded-lg caption-1 transition-colors duration-300 ease-soft ${focusRing} focus-visible:ring-offset-night ${active === l.id ? 'text-white' : 'text-mist hover:text-white'}`}>{l.label}</a>
                </li>
              ))}
            </ul>
          )}
          <span className="hidden md:block"><PrimaryCta size="sm" /></span>
          <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
            className={`relative size-10 rounded-full transition-colors duration-300 ease-soft hover:bg-white/10 active:scale-[0.98] md:hidden ${focusRing} focus-visible:ring-offset-night`}>
            <span className={`${bar} ${open ? 'translate-y-0 rotate-45' : '-translate-y-1'}`} />
            <span className={`${bar} ${open ? 'translate-y-0 -rotate-45' : 'translate-y-1'}`} />
          </button>
        </nav>
      </header>
      {open && (
        <div id="mobile-menu" className="fixed inset-0 z-40 flex flex-col bg-night/90 px-6 pb-12 pt-24 backdrop-blur-2xl md:hidden">
          <ul className="flex flex-col gap-2">
            {[...(links ? LINKS.map(l => ({ href: `#${l.id}`, label: l.label })) : [{ href: asset(''), label: 'Home' }])].map((l, k) => (
              <li key={l.href} style={{ transitionDelay: `${Math.min(k * 60, 400)}ms` }}
                className={`transition-[opacity,transform] duration-500 ease-soft motion-reduce:translate-y-0 ${entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                <a href={l.href} onClick={() => setOpen(false)} className={`block rounded-lg py-2 heading-4 text-white ${focusRing} focus-visible:ring-offset-night`}>{l.label}</a>
              </li>
            ))}
          </ul>
          <div style={{ transitionDelay: `${Math.min(LINKS.length * 60, 400)}ms` }}
            className={`mt-8 transition-[opacity,transform] duration-500 ease-soft motion-reduce:translate-y-0 ${entered ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
            <PrimaryCta />
          </div>
        </div>
      )}
    </>
  )
}

export function Footer() {
  return (
    <footer className="bg-night px-4 pb-12 pt-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <a href={asset('')} className={`inline-flex items-center gap-2 rounded-lg title-3 text-white ${focusRing} focus-visible:ring-offset-night`}><Logo className="size-5" />Officer Prep</a>
            <p className="mt-3 body-6 text-mist">A free study app for CDS, AFCAT, CAPF, Coast Guard and CSE aspirants.</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-3 caption-1">
            <li><a href={asset(APP_HREF)} className={`rounded-lg text-mist transition-colors duration-300 ease-soft hover:text-white ${focusRing} focus-visible:ring-offset-night`}>Open the app</a></li>
            <li><a href={asset('legal.html#privacy')} className={`rounded-lg text-mist transition-colors duration-300 ease-soft hover:text-white ${focusRing} focus-visible:ring-offset-night`}>Privacy</a></li>
            <li><a href={asset('legal.html#terms')} className={`rounded-lg text-mist transition-colors duration-300 ease-soft hover:text-white ${focusRing} focus-visible:ring-offset-night`}>Terms</a></li>
          </ul>
        </div>
        <p className="mt-12 max-w-3xl caption-5 text-smoke">{DISCLAIMER}</p>
        <p className="mt-3 caption-5 text-smoke">© {new Date().getFullYear()} Officer Prep</p>
      </div>
    </footer>
  )
}

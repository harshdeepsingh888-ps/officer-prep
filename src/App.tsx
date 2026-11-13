import { useEffect, useRef, useState } from 'react'
import { useRoute } from './lib/hooks'
import { DriveProvider } from './lib/DriveProvider'
import { Logo } from './components/Particles'
import { ThemeToggle } from './components/ThemeToggle'
import { InstallButton, UpdateToast } from './components/AppUpdates'
import { Icon } from './components/icons'
import { focusRing } from './components/ui'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Exams from './pages/Exams'
import Study from './pages/Study'
import Planner from './pages/Planner'
import Practice from './pages/Practice'
import Revise from './pages/Revise'
import Progress from './pages/Progress'
import News from './pages/News'
import SSB from './pages/SSB'
import Writing from './pages/Writing'
import Library from './pages/Library'

const NAV = [
  { id: '', label: 'Today' },
  { id: 'study', label: 'Study' },
  { id: 'exams', label: 'Exams' },
  { id: 'planner', label: 'Planner' },
  { id: 'practice', label: 'Practice' },
  { id: 'revise', label: 'Revise' },
  { id: 'progress', label: 'Progress' },
  { id: 'news', label: 'News' },
  { id: 'ssb', label: 'SSB' },
  { id: 'writing', label: 'Writing' },
  { id: 'documents', label: 'Documents' },
  { id: 'library', label: 'Library' },
]

// Phones get a bottom tab bar with the daily pages; the rest sit under "More".
const TABS = ['', 'study', 'practice', 'revise']

export default function App() {
  const route = useRoute()
  const page = route[0] === 'syllabus' ? 'study' : (route[0] ?? '')
  const tabletNav = useRef<HTMLElement>(null)

  // Tablets: the nav row may scroll sideways, so bring the current page's link into view.
  useEffect(() => {
    const nav = tabletNav.current
    const el = nav?.querySelector<HTMLElement>('[aria-current=page]')
    if (nav && el) nav.scrollTo({ left: el.offsetLeft - nav.clientWidth / 2 + el.offsetWidth / 2 })
  }, [page])

  const view = (() => {
    switch (page) {
      case 'exams': return <Exams />
      case 'study': return <Study sub={route[1]} />
      case 'syllabus': return <Study /> // old links
      case 'planner': return <Planner />
      case 'practice': return <Practice sub={route[1]} arg={route[2]} />
      case 'revise': return <Revise sub={route[1]} />
      case 'progress': return <Progress />
      case 'news': return <News sub={route[1]} />
      case 'ssb': return <SSB sub={route[1]} />
      case 'writing': return <Writing />
      case 'documents': return <Documents />
      case 'library': return <Library />
      default: return <Dashboard />
    }
  })()

  const navLinks = NAV.map(n => {
    const active = page === n.id
    return (
      <a key={n.id} href={`#/${n.id}`} aria-current={active ? 'page' : undefined}
        className={`shrink-0 rounded-full px-3 py-2 title-4 transition-colors duration-300 ease-soft ${focusRing} ${active ? 'bg-fg/[0.1] text-fg' : 'text-ink-400 hover:text-fg'}`}>
        {n.label}
      </a>
    )
  })

  return (
    <DriveProvider>
      {/* Hash routing: an #main link would change the page, so the skip link moves focus instead. */}
      <button type="button" onClick={() => document.getElementById('main')?.focus()}
        className="sr-only rounded-lg bg-accent-500 px-3 py-2 button-sm text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">
        Skip to content
      </button>
      <div className="mx-auto min-h-screen w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* A floating bar like the landing page's: translucent over a blur, so the page stays faintly visible behind it. */}
        <header className="py-4 md:sticky md:top-0 md:z-40">
          <div className="flex items-center gap-4 rounded-full border border-line bg-canvas/70 p-2 pl-4 backdrop-blur-xl">
            <a href="#/" className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg title-3 text-fg ${focusRing}`}>
              <Logo />
              <span className="md:hidden xl:inline">Officer Prep</span>
            </a>
            <nav ref={tabletNav} aria-label="Pages" className="hidden min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">{navLinks}</nav>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <InstallButton />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="pb-[calc(8rem+env(safe-area-inset-bottom))] pt-4 outline-none md:pb-24 md:pt-8">{view}</main>
      </div>
      <BottomBar page={page} />
      <UpdateToast />
    </DriveProvider>
  )
}

function BottomBar({ page }: { page: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [page])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const more = NAV.filter(n => !TABS.includes(n.id))
  const inMore = more.some(n => n.id === page)
  const tab = (active: boolean, label: string, icon: string) => (
    <>
      <Icon name={icon} className={`size-6 transition-colors duration-300 ease-soft ${active ? 'text-accent-300' : 'text-ink-400'}`} filled={active} />
      <span className={active ? 'text-fg' : 'text-ink-400'}>{label}</span>
    </>
  )
  const tabCls = `flex h-14 flex-col items-center justify-center gap-1 rounded-2xl caption-4 transition-colors duration-300 ease-soft ${focusRing}`

  return (
    <div className="md:hidden">
      {open && <div className="fixed inset-0 z-30 bg-canvas/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />}
      {/* Floats above the bottom edge: 24px corners, 8px inside, so the tabs inside take 16px corners. */}
      <nav aria-label="Main" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] right-[max(1rem,env(safe-area-inset-right))] z-40 rounded-3xl border border-line bg-canvas/80 p-2 backdrop-blur-xl">
        {open && (
          <div id="more-pages" className="grid grid-cols-2 gap-2 pb-2">
            {more.map((n, k) => (
              <a key={n.id} href={`#/${n.id}`} onClick={() => setOpen(false)} aria-current={page === n.id ? 'page' : undefined}
                style={{ animationDelay: `${Math.min(k * 60, 400)}ms` }}
                className={`flex animate-[rise_500ms_var(--ease-soft)_both] items-center gap-3 rounded-2xl px-4 py-3 title-4 ${focusRing} ${page === n.id ? 'bg-fg/[0.1] text-fg' : 'bg-fg/[0.04] text-ink-200'}`}>
                <Icon name={n.id} className={`size-5 ${page === n.id ? 'text-accent-300' : 'text-ink-400'}`} />
                {n.label}
              </a>
            ))}
          </div>
        )}
        <div className="grid grid-cols-5">
          {NAV.filter(n => TABS.includes(n.id)).map(n => (
            <a key={n.id} href={`#/${n.id}`} aria-current={page === n.id ? 'page' : undefined} className={`${tabCls} ${page === n.id ? 'bg-fg/[0.08]' : ''}`}>{tab(page === n.id, n.label, n.id || 'today')}</a>
          ))}
          <button className={`${tabCls} ${open || inMore ? 'bg-fg/[0.08]' : ''}`} aria-expanded={open} aria-controls="more-pages" onClick={() => setOpen(o => !o)}>
            {tab(open || inMore, inMore && !open ? NAV.find(n => n.id === page)!.label : 'More', inMore && !open ? page : 'more')}
          </button>
        </div>
      </nav>
    </div>
  )
}

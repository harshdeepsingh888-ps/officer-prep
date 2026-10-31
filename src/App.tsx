import { useEffect, useRef, useState } from 'react'
import { useRoute } from './lib/hooks'
import { DriveProvider } from './lib/DriveProvider'
import { AmbientField, Logo } from './components/Particles'
import { ThemeToggle } from './components/ThemeToggle'
import { InstallButton, UpdateToast } from './components/AppUpdates'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Exams from './pages/Exams'
import Study from './pages/Study'
import Planner from './pages/Planner'
import Practice from './pages/Practice'
import Revise from './pages/Revise'
import Progress from './pages/Progress'
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
      case 'practice': return <Practice sub={route[1]} />
      case 'revise': return <Revise sub={route[1]} />
      case 'progress': return <Progress />
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
        className={`label flex shrink-0 items-center gap-2 py-2 transition-colors ${active ? 'text-fg' : 'text-ink-400 hover:text-fg'}`}>
        <span className={`size-1.5 rounded-full ${active ? 'bg-iris-500' : 'bg-transparent'}`} />
        {n.label}
      </a>
    )
  })

  return (
    <DriveProvider>
      <AmbientField />
      <div className="relative mx-auto min-h-screen w-full max-w-[1280px] px-5 sm:px-8 lg:px-10">
        <header className="py-6">
          <div className="flex items-center justify-between gap-6">
            <a href="#/" className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
              <Logo />
              <span className="text-[15px] font-medium tracking-tight text-fg">Officer Prep</span>
            </a>
            <div className="flex items-center gap-2">
              <InstallButton />
              <ThemeToggle />
            </div>
          </div>
          <nav ref={tabletNav} className="relative -mx-8 mt-3 hidden gap-4 overflow-x-auto px-8 [scrollbar-width:none] md:flex lg:-mx-10 lg:justify-between lg:px-10 [&::-webkit-scrollbar]:hidden">{navLinks}</nav>
        </header>
        <main className="pb-[calc(7rem+env(safe-area-inset-bottom))] pt-2 md:pb-28 md:pt-4">{view}</main>
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
  const tab = (active: boolean, label: string) => (
    <>
      <span className={`size-1.5 rounded-full ${active ? 'bg-iris-500' : 'bg-transparent'}`} />
      <span className={active ? 'text-fg' : 'text-ink-400'}>{label}</span>
    </>
  )
  const tabCls = 'label flex h-14 flex-col items-center justify-center gap-1.5 text-[11px]'

  return (
    <div className="md:hidden">
      {open && <div className="fixed inset-0 z-30 bg-canvas/70 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-fg/[0.06] bg-canvas/90 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur-md">
        {open && (
          <div id="more-pages" className="grid grid-cols-2 gap-2 px-4 pb-2 pt-4">
            {more.map(n => (
              <a key={n.id} href={`#/${n.id}`} onClick={() => setOpen(false)} aria-current={page === n.id ? 'page' : undefined}
                className={`label flex items-center gap-2.5 rounded-3xl px-4 py-3.5 ${page === n.id ? 'bg-fg/[0.08] text-fg' : 'bg-fg/[0.04] text-ink-300'}`}>
                <span className={`size-1.5 rounded-full ${page === n.id ? 'bg-iris-500' : 'bg-transparent'}`} />
                {n.label}
              </a>
            ))}
          </div>
        )}
        <div className="grid grid-cols-5">
          {NAV.filter(n => TABS.includes(n.id)).map(n => (
            <a key={n.id} href={`#/${n.id}`} aria-current={page === n.id ? 'page' : undefined} className={tabCls}>{tab(page === n.id, n.label)}</a>
          ))}
          <button className={tabCls} aria-expanded={open} aria-controls="more-pages" onClick={() => setOpen(o => !o)}>
            {tab(open || inMore, inMore && !open ? NAV.find(n => n.id === page)!.label : 'More')}
          </button>
        </div>
      </nav>
    </div>
  )
}

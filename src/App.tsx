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
  { id: 'ssb', label: 'SSB' },
  { id: 'writing', label: 'Writing' },
  { id: 'documents', label: 'Documents' },
  { id: 'library', label: 'Library' },
]

export default function App() {
  const route = useRoute()
  const page = route[0] ?? ''

  const view = (() => {
    switch (page) {
      case 'exams': return <Exams />
      case 'study': return <Study sub={route[1]} />
      case 'syllabus': return <Study /> // old links
      case 'planner': return <Planner />
      case 'practice': return <Practice sub={route[1]} />
      case 'revise': return <Revise sub={route[1]} />
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
            <nav className="hidden gap-6 xl:flex">{navLinks}</nav>
            <div className="flex items-center gap-2">
              <InstallButton />
              <ThemeToggle />
            </div>
          </div>
          <nav className="-mx-5 mt-3 flex gap-5 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:px-8 xl:hidden [&::-webkit-scrollbar]:hidden">{navLinks}</nav>
        </header>
        <main className="pb-28 pt-4">{view}</main>
      </div>
      <UpdateToast />
    </DriveProvider>
  )
}

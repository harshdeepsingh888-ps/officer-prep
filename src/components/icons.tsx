import {
  ArrowsClockwiseIcon, BookOpenIcon, BooksIcon, BroadcastIcon, CalendarDotsIcon, ChartLineUpIcon, CompassIcon,
  DotsThreeIcon, FolderSimpleIcon, PencilSimpleLineIcon, ShieldCheckIcon, StarIcon, TargetIcon, type Icon as PhosphorIcon,
} from '@phosphor-icons/react'

// Page icons from Phosphor (the landing page's icon set), with military motifs where they fit:
// a compass for Today, a target for Practice, a radio mast for News, a star for SSB.

const ICONS: Record<string, PhosphorIcon> = {
  today: CompassIcon,
  study: BookOpenIcon,
  exams: ShieldCheckIcon,
  planner: CalendarDotsIcon,
  practice: TargetIcon,
  revise: ArrowsClockwiseIcon,
  progress: ChartLineUpIcon,
  news: BroadcastIcon,
  ssb: StarIcon,
  writing: PencilSimpleLineIcon,
  documents: FolderSimpleIcon,
  library: BooksIcon,
  more: DotsThreeIcon,
}

export function Icon({ name, className = 'size-5', filled = false }: { name: string; className?: string; filled?: boolean }) {
  const Glyph = ICONS[name] ?? DotsThreeIcon
  return <Glyph className={className} weight={filled ? 'fill' : 'regular'} aria-hidden />
}

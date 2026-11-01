import type { ReactNode } from 'react'

// Line icons drawn for the app (24 × 24, 1.6 stroke, round ends), with military motifs where they fit:
// a compass for Today, a target for Practice, chevrons for Progress, a radio mast for News, a star for SSB.

const PATHS: Record<string, ReactNode> = {
  today: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5 13.4 13.4 8.5 15.5 10.6 10.6Z" /></>,
  study: <><path d="M3 6.5c2.6-1.5 5.6-1.5 9 0 3.4-1.5 6.4-1.5 9 0V19c-2.6-1.5-5.6-1.5-9 0-3.4-1.5-6.4-1.5-9 0Z" /><path d="M12 6.5V19" /></>,
  exams: <><path d="M12 3 4.5 6v5.5c0 4.4 3.2 8.1 7.5 9.5 4.3-1.4 7.5-5.1 7.5-9.5V6Z" /><path d="m9 12 2.2 2.2L15.5 10" /></>,
  planner: <><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" /></>,
  practice: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></>,
  revise: <><path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" /><path d="M18 3.5v3.6h-3.6M6 20.5v-3.6h3.6" /></>,
  progress: <><path d="m5 9.5 7-4 7 4M5 14.5l7-4 7 4M5 19.5l7-4 7 4" /></>,
  news: <><circle cx="12" cy="10" r="1.6" /><path d="M8.6 6.6a4.8 4.8 0 0 0 0 6.8M15.4 6.6a4.8 4.8 0 0 1 0 6.8M5.7 3.7a8.9 8.9 0 0 0 0 12.6M18.3 3.7a8.9 8.9 0 0 1 0 12.6M12 11.6V21M9 21h6" /></>,
  ssb: <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" />,
  writing: <><path d="M4 20h4L19.2 8.8a2.8 2.8 0 0 0-4-4L4 16Z" /><path d="m13.5 6.5 4 4" /></>,
  documents: <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />,
  library: <><path d="M4.5 4.5h3v15h-3zM9.5 4.5h3v15h-3z" /><path d="m14.6 5.4 2.9-.8 3.8 14.5-2.9.8Z" /></>,
  more: <><circle cx="6" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="18" cy="12" r="1.3" /></>,
}

export function Icon({ name, className = 'size-5', filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {PATHS[name] ?? PATHS.more}
    </svg>
  )
}

import { useEffect, useRef, useState } from 'react'

/** Wall-clock countdown — stays accurate even if the tab is throttled. */
export function useCountdown(onExpire?: () => void) {
  const cb = useRef(onExpire)
  useEffect(() => { cb.current = onExpire })
  const [endAt, setEndAt] = useState<number | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    if (endAt === null) return
    const id = setInterval(() => {
      if (Date.now() >= endAt) {
        setEndAt(null)
        cb.current?.()
      } else tick(x => x + 1)
    }, 200)
    return () => clearInterval(id)
  }, [endAt])

  const remaining = endAt === null ? 0 : Math.max(0, Math.ceil((endAt - Date.now()) / 1000))
  return {
    remaining,
    running: endAt !== null,
    start: (seconds: number) => setEndAt(Date.now() + seconds * 1000),
    stop: () => setEndAt(null),
  }
}

/** Minimal hash router: "#/ssb/wat" → ["ssb", "wat"]. */
export function useRoute(): string[] {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(s => {
    try { return decodeURIComponent(s) } catch { return s } // ids with spaces arrive encoded
  })
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const on = () => { setRoute(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

export const go = (path: string) => { window.location.hash = '/' + path }

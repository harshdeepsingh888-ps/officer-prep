import { useEffect, useState } from 'react'

// "Install app" support. Chrome, Edge and Android fire `beforeinstallprompt` early — often before React
// mounts — so the event is captured at module load (imported from main.tsx). iPhone uses Share → Add to Home Screen.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

let deferred: InstallEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault() // show our own button instead of the browser's mini-bar
  deferred = e as InstallEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  notify()
})

export const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export function useInstall() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const l = () => rerender(x => x + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])
  return {
    canInstall: deferred !== null,
    install: async () => {
      if (!deferred) return
      await deferred.prompt()
      await deferred.userChoice
      deferred = null
      notify()
    },
  }
}

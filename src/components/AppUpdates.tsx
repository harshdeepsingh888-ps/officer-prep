import { useRegisterSW } from 'virtual:pwa-register/react'
import { useInstall } from '../lib/install'
import { Button } from './ui'

const HOUR = 60 * 60 * 1000
const OFFLINE_SEEN = 'officer-prep-offline-ready-seen'
const seenOffline = () => { try { return localStorage.getItem(OFFLINE_SEEN) === '1' } catch { return false } }

/** "New version ready" / "Ready to work offline" toast. Checks for updates hourly while the app is open. */
export function UpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => { if (navigator.onLine) reg.update() }, HOUR)
    },
  })
  if (offlineReady && seenOffline()) setOfflineReady(false) // say it once, not on every visit
  if (!needRefresh && !offlineReady) return null

  const update = async () => {
    await updateServiceWorker(true)
    // If the new version had already taken over, no "controlling" event follows — reload to pick it up.
    setTimeout(() => window.location.reload(), 1200)
  }
  const dismiss = () => {
    if (offlineReady) { try { localStorage.setItem(OFFLINE_SEEN, '1') } catch { /* ignore */ } }
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-3xl bg-ink-900 px-5 py-4 text-sm text-ink-100 ring-1 ring-fg/15 sm:left-auto sm:right-6 sm:mx-0">
      <span className="flex-1">
        {needRefresh ? 'A new version of Officer Prep is ready.' : 'Officer Prep is ready to work offline.'}
      </span>
      {needRefresh && <Button size="sm" onClick={update}>Update now</Button>}
      <Button variant="ghost" size="sm" onClick={dismiss}>{needRefresh ? 'Later' : 'OK'}</Button>
    </div>
  )
}

/** Small "Install" pill for the header, shown only when the browser offers installation. */
export function InstallButton() {
  const { canInstall, install } = useInstall()
  if (!canInstall) return null
  return (
    <button onClick={install} className="label shrink-0 rounded-full bg-fg/[0.06] px-3 py-1.5 text-[11px] text-ink-200 transition-colors hover:text-fg">
      ↓ Install app
    </button>
  )
}

import { activeNotices, useContent } from '../content'
import { useSetting } from '../lib/db'
import { todayISO } from '../lib/util'
import { focusRing } from './ui'

/** Notices published from the admin panel (a new notification, a changed date…). Each can be dismissed on this device. */
export function Notices() {
  const content = useContent()
  const [dismissed, setDismissed] = useSetting<string[]>('dismissedNotices', [])
  const shown = activeNotices(content, todayISO()).filter(n => !dismissed.includes(n.id))
  if (!shown.length) return null
  return (
    <section aria-label="Notices" className="space-y-2">
      {shown.map(n => (
        <div key={n.id} className={`flex items-start gap-4 rounded-3xl px-6 py-4 ${n.tone === 'important' ? 'bg-saffron-400/[0.12]' : 'bg-surface'}`}>
          <span aria-hidden className={`mt-2 size-2 shrink-0 rounded-full ${n.tone === 'important' ? 'bg-saffron-400' : 'bg-accent-500'}`} />
          <div className="min-w-0 flex-1 body-5 text-ink-100">
            {n.text}
            {n.link && (
              <a href={n.link} target={n.link.startsWith('#') ? undefined : '_blank'} rel="noreferrer" className={`ml-2 rounded text-saffron-400 hover:underline ${focusRing}`}>
                {n.link.startsWith('#') ? 'Open →' : 'Read more ↗'}
              </a>
            )}
          </div>
          <button onClick={() => setDismissed([...dismissed, n.id])} aria-label="Dismiss notice"
            className={`-my-1 shrink-0 rounded-lg px-2 py-1 caption-4 text-ink-400 hover:text-fg pointer-coarse:min-h-10 ${focusRing}`}>Dismiss</button>
        </div>
      ))}
    </section>
  )
}

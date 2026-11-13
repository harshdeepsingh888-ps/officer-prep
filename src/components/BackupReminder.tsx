import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LAST_BACKUP_KEY, db, hasProgress } from '../lib/db'
import { useDrive } from '../lib/DriveProvider'
import { CloudArrowUpIcon } from '@phosphor-icons/react'
import { Button } from './ui'

const WEEK = 7 * 86_400_000
const SNOOZE_KEY = 'officer-prep-backup-snooze'

/** A nudge on the dashboard when there's progress and no backup in the last week. */
export function BackupReminder() {
  const drive = useDrive()
  const [snoozed, setSnoozed] = useState(() => { try { return sessionStorage.getItem(SNOOZE_KEY) === '1' } catch { return false } })
  const d = useLiveQuery(async () => ({
    progress: await hasProgress(),
    last: ((await db.settings.get(LAST_BACKUP_KEY))?.value as number | undefined) ?? null,
    auto: ((await db.settings.get('driveAutoBackup'))?.value as boolean | undefined) ?? true,
  }), [])
  if (!d || snoozed || !d.progress) return null
  if (d.last && Date.now() - d.last < WEEK) return null
  if (drive.status === 'ready' && d.auto) return null // Drive is backing up automatically

  const days = d.last ? Math.floor((Date.now() - d.last) / 86_400_000) : null
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-accent-500/30 bg-accent-500/[0.08] p-4 sm:px-6">
      <CloudArrowUpIcon className="size-6 shrink-0 text-accent-300" aria-hidden />
      <div className="min-w-60 flex-1 body-6">
        <span className="body-5 text-fg">{days === null ? 'Your progress has never been backed up.' : `Last backup was ${days} days ago.`}</span>
        <span className="ml-1 text-ink-300">It lives only in this browser. Clearing browser data or losing the device would erase it.</span>
      </div>
      <a href="#/library" tabIndex={-1}><Button size="sm">Back up now</Button></a>
      <Button variant="ghost" size="sm" onClick={() => { try { sessionStorage.setItem(SNOOZE_KEY, '1') } catch { /* ignore */ } setSnoozed(true) }}>Later</Button>
    </div>
  )
}

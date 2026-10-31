import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { LAST_BACKUP_KEY, db, exportAll, importAll, markBackedUp, protectStorage, storageStatus } from '../lib/db'
import { useDrive } from '../lib/DriveProvider'
import { isInstalled } from '../lib/install'
import { downloadText, fmtBytes, fmtDateTime, todayISO } from '../lib/util'
import { Badge, Button, Card } from './ui'

/** Storage health, offline status and backups for this device. */
export function DeviceCard() {
  const [status, setStatus] = useState<Awaited<ReturnType<typeof storageStatus>>>()
  const [tick, refresh] = useState(0)
  useEffect(() => { storageStatus().then(setStatus) }, [tick])
  const lastBackup = useLiveQuery(async () => ((await db.settings.get(LAST_BACKUP_KEY))?.value as number | undefined) ?? null, [])
  const drive = useDrive()
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const offline = !!navigator.serviceWorker?.controller

  const exportFile = async () => {
    downloadText(`officer-prep-backup-${todayISO()}.json`, await exportAll())
    await markBackedUp()
    setMsg('Backup file downloaded. Keep it somewhere safe (Drive, email, pen drive).')
  }

  const restore = async (f: File) => {
    if (!confirm('Replace the progress on this device with this backup?')) return
    try {
      await importAll(await f.text())
      setMsg('Backup restored.')
    } catch (e) {
      setMsg(`Restore failed: ${(e as Error).message}`)
    }
  }

  const protect = async () => {
    const ok = await protectStorage()
    setMsg(ok ? 'Storage is now protected.' : 'The browser declined for now. Installing the app (or using it regularly) usually lets it protect storage.')
    refresh(x => x + 1)
  }

  const days = lastBackup ? Math.floor((Date.now() - lastBackup) / 86_400_000) : null
  const rows: { label: string; value: ReactNode; action?: ReactNode }[] = [
    {
      label: 'Storage protection',
      value: status?.persisted ? <Badge tone="verdant">protected</Badge> : <Badge tone="saffron">not protected</Badge>,
      action: status && !status.persisted && status.supported ? <Button variant="subtle" size="sm" onClick={protect}>Protect my data</Button> : null,
    },
    { label: 'Space used', value: status ? fmtBytes(status.usage) : '…' },
    { label: 'App version', value: <span className="text-ink-300">built {fmtDateTime(Date.parse(__BUILD_TIME__))}</span> },
    { label: 'Works offline', value: offline ? <Badge tone="verdant">yes</Badge> : <span className="text-ink-400">after the first full load</span> },
    { label: 'Installed as an app', value: isInstalled() ? <Badge tone="verdant">yes</Badge> : <span className="text-ink-400">no — use the Install button, or Share → Add to Home Screen on iPhone</span> },
    {
      label: 'Last backup',
      value: lastBackup ? <span className={days! > 7 ? 'text-saffron-400' : 'text-ink-200'}>{fmtDateTime(lastBackup)}{days! > 0 ? ` · ${days} day${days === 1 ? '' : 's'} ago` : ''}</span> : <span className="text-saffron-400">never</span>,
    },
    {
      label: 'Google Drive sync',
      value: drive.status === 'ready' ? <Badge tone="verdant">connected</Badge> : <span className="text-ink-400">{drive.status === 'unconfigured' ? 'not set up' : 'not connected'}</span>,
      action: <a href="#/documents" className="text-sm text-saffron-400 hover:underline">Documents →</a>,
    },
  ]

  return (
    <Card title="This device & backups">
      <p className="mb-5 text-sm text-ink-400">
        Your progress lives in this browser on this device. Protect it, and keep a backup. Drive backs up automatically once connected; otherwise export a file every week or so.
      </p>
      <dl className="divide-y divide-fg/[0.06]">
        {rows.map(r => (
          <div key={r.label} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
            <dt className="w-44 shrink-0 text-ink-400">{r.label}</dt>
            <dd className="min-w-0 flex-1 text-ink-200">{r.value}</dd>
            {r.action}
          </div>
        ))}
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={exportFile}>Export backup file</Button>
        <Button variant="subtle" onClick={() => fileRef.current?.click()}>Restore from file…</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = '' }} />
      </div>
      {msg && <p className="mt-3 text-sm text-verdant-300">{msg}</p>}
      <p className="mt-3 text-xs font-light text-ink-500">Backups include everything except practice pictures for TAT/PPDT.</p>
    </Card>
  )
}

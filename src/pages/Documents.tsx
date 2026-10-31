import { useRef, useState } from 'react'
import { EXAMS, examById } from '../data/exams'
import { useDrive } from '../lib/DriveProvider'
import { folderUrl, type DocKind, type DocTags, type DriveDoc } from '../lib/drive'
import { fmtBytes, fmtDateTime } from '../lib/util'
import { Badge, Button, Card, Empty, PageHeader, Progress, inputBase, inputCls, labelCls } from '../components/ui'

export const DOC_KINDS: { id: DocKind; label: string }[] = [
  { id: 'paper', label: 'Past paper' },
  { id: 'notes', label: 'Notes' },
  { id: 'book', label: 'Book' },
  { id: 'key', label: 'Answer key' },
  { id: 'other', label: 'Other' },
]
const kindLabel = (k?: string) => DOC_KINDS.find(x => x.id === k)?.label ?? 'Other'

export default function Documents() {
  const drive = useDrive()
  const [editSetup, setEditSetup] = useState(false)

  return (
    <div className="space-y-14">
      <PageHeader title="Documents" subtitle="Keep past papers, notes and books in your Google Drive. Open them on any device, and sync your progress between phone and laptop." />

      {drive.error && (
        <div className="flex items-start gap-3 rounded-3xl bg-ember-500/10 px-5 py-4 text-sm text-ember-200">
          <span className="flex-1">{drive.error}</span>
          <button onClick={drive.clearError} className="text-ember-300 hover:text-ember-100" aria-label="Dismiss">✕</button>
        </div>
      )}

      {drive.status === 'loading' ? null
        : drive.status === 'unconfigured' || editSetup ? <SetupCard onDone={() => setEditSetup(false)} canCancel={drive.status !== 'unconfigured'} />
        : drive.status !== 'ready' ? <ConnectCard onEditSetup={() => setEditSetup(true)} />
        : (
          <>
            <AccountBar />
            <AddDocs />
            <DocList />
            <SyncCard />
          </>
        )}
    </div>
  )
}

function SetupCard({ onDone, canCancel }: { onDone: () => void; canCancel: boolean }) {
  const drive = useDrive()
  const [c, setC] = useState(drive.config)
  const [copied, setCopied] = useState(false)
  const origin = window.location.origin
  const validId = /\.apps\.googleusercontent\.com$/.test(c.clientId.trim())

  return (
    <Card title="Set up Google Drive">
      <p className="text-sm text-ink-300">
        A one-time setup: about 10 minutes, free. You create your own small Google Cloud project, so the app works with your Drive directly and there's no server in between.
      </p>
      <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-ink-300">
        <li>In <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">Google Cloud Console ↗</a>, create a project and enable <b>Google Drive API</b> and <b>Google Picker API</b>.</li>
        <li>Set up the consent screen: External, add yourself as a test user, and add the scopes <code className="text-xs">drive.file</code> and <code className="text-xs">drive.appdata</code>.</li>
        <li>
          Create an OAuth client ID (Web application) and add this authorized JavaScript origin:{' '}
          <code className="rounded-full bg-ink-950 px-1.5 py-0.5 text-xs text-iris-300">{origin}</code>{' '}
          <button className="px-1 text-xs text-saffron-400 hover:underline pointer-coarse:px-2" onClick={() => { navigator.clipboard.writeText(origin); setCopied(true) }}>{copied ? 'copied ✓' : 'copy'}</button>
        </li>
        <li>Create an API key restricted to the Picker API, and copy the project number.</li>
      </ol>
      <p className="mt-2 text-xs text-ink-500">Full step-by-step guide: <code>docs/google-drive-setup.md</code> in the project folder.</p>

      <div className="mt-4 grid gap-3">
        <div>
          <label className={labelCls}>OAuth Client ID (required)</label>
          <input className={inputCls} value={c.clientId} onChange={e => setC({ ...c, clientId: e.target.value })} placeholder="1234567890-abc….apps.googleusercontent.com" />
          {c.clientId.trim() && !validId && <p className="mt-1 text-xs text-saffron-400">A client ID ends with .apps.googleusercontent.com</p>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>API key (for "Pick from Drive")</label>
            <input className={inputCls} value={c.apiKey} onChange={e => setC({ ...c, apiKey: e.target.value })} placeholder="AIza…" />
          </div>
          <div>
            <label className={labelCls}>Project number (for "Pick from Drive")</label>
            <input className={inputCls} inputMode="numeric" value={c.appId} onChange={e => setC({ ...c, appId: e.target.value.replace(/\D/g, '') })} placeholder="1234567890" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={!validId} onClick={async () => { await drive.saveConfig(c); onDone() }}>Save</Button>
        {canCancel && <Button variant="ghost" onClick={onDone}>Cancel</Button>}
      </div>
    </Card>
  )
}

function ConnectCard({ onEditSetup }: { onEditSetup: () => void }) {
  const drive = useDrive()
  const connecting = drive.status === 'connecting'
  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-64 flex-1">
          <div className="text-[42px] font-normal leading-none tracking-display text-fg">Connect Google Drive</div>
          <ul className="mt-2 space-y-1 text-sm text-ink-400">
            <li>• Uploads go to an <b className="text-ink-200">Officer Prep</b> folder in your Drive</li>
            <li>• The app sees only files it uploaded or that you pick, never the rest of your Drive</li>
            <li>• Progress backups go to a hidden app folder, for phone ↔ laptop sync</li>
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <Button size="lg" disabled={connecting} onClick={drive.connect}>{connecting ? 'Waiting for Google…' : 'Connect Google Drive'}</Button>
          <Button variant="ghost" size="sm" onClick={onEditSetup}>Edit setup</Button>
        </div>
      </div>
    </Card>
  )
}

function AccountBar() {
  const { user, quota, folderId, refresh, disconnect } = useDrive()
  const usage = Number(quota?.usage ?? 0)
  const limit = Number(quota?.limit ?? 0)
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        {user?.photoLink
          ? <img src={user.photoLink} referrerPolicy="no-referrer" alt="" className="size-9 rounded-full" />
          : <span className="flex size-9 items-center justify-center rounded-full bg-iris-900 font-semibold text-iris-300">{user?.displayName?.[0] ?? '?'}</span>}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink-100">{user?.displayName}</div>
          <div className="truncate text-xs text-ink-500">{user?.emailAddress}</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {folderId && <a href={folderUrl(folderId)} target="_blank" rel="noreferrer"><Button variant="subtle" size="sm">Open folder in Drive ↗</Button></a>}
          <Button variant="ghost" size="sm" onClick={refresh}>Refresh</Button>
          <Button variant="ghost" size="sm" onClick={disconnect}>Disconnect</Button>
        </div>
      </div>
      {limit > 0 && (
        <div className="mt-3">
          <Progress value={(usage / limit) * 100} />
          <div className="mt-1 text-xs text-ink-500">{fmtBytes(usage)} of {fmtBytes(limit)} used (shared with Gmail and Photos)</div>
        </div>
      )}
    </Card>
  )
}

function TagFields({ tags, onChange }: { tags: DocTags; onChange: (t: DocTags) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <div>
        <label className={labelCls}>Type</label>
        <select className={inputCls} value={tags.kind} onChange={e => onChange({ ...tags, kind: e.target.value as DocKind })}>
          {DOC_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Exam</label>
        <select className={inputCls} value={tags.exam ?? ''} onChange={e => onChange({ ...tags, exam: e.target.value || undefined })}>
          <option value="">General</option>
          {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Subject (optional)</label>
        <input className={inputCls} value={tags.subject ?? ''} onChange={e => onChange({ ...tags, subject: e.target.value || undefined })} placeholder="e.g. Polity" />
      </div>
    </div>
  )
}

type QueueItem = { key: string; name: string; pct: number; error?: string; done?: boolean }

function AddDocs() {
  const drive = useDrive()
  const [tags, setTags] = useState<DocTags>({ kind: 'notes' })
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [drag, setDrag] = useState(false)
  const [note, setNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadAll = async (files: File[]) => {
    if (!files.length) return
    const items = files.map((f, i) => ({ key: `${Date.now()}-${i}-${f.name}`, name: f.name, pct: 0 }))
    setQueue(q => [...items, ...q])
    const patch = (key: string, p: Partial<QueueItem>) => setQueue(q => q.map(it => (it.key === key ? { ...it, ...p } : it)))
    const t = { ...tags, subject: tags.subject?.trim() || undefined }
    for (const [i, f] of files.entries()) {
      try {
        await drive.upload(f, t, pct => patch(items[i].key, { pct }))
        patch(items[i].key, { pct: 100, done: true })
      } catch (e) {
        patch(items[i].key, { error: (e as Error).message })
      }
    }
  }

  const pick = async () => {
    setNote('')
    const n = await drive.pick({ ...tags, subject: tags.subject?.trim() || undefined })
    if (n) setNote(`Added ${n} file${n === 1 ? '' : 's'} from your Drive.`)
  }

  return (
    <Card title="Add documents">
      <TagFields tags={tags} onChange={setTags} />
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); uploadAll([...e.dataTransfer.files]) }}
        className={`mt-6 rounded-3xl border border-dashed p-8 text-center transition-colors ${drag ? 'border-iris-400 bg-iris-500/10' : 'border-fg/15'}`}>
        <div className="text-sm text-ink-300">Drop PDFs, images or notes here</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button onClick={() => fileRef.current?.click()}>Upload from this device</Button>
          <Button variant="subtle" disabled={!drive.canPick} onClick={pick} title={drive.canPick ? '' : 'Add an API key and project number in setup to enable this'}>Pick from Drive</Button>
        </div>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={e => { uploadAll([...(e.target.files ?? [])]); e.target.value = '' }} />
        <p className="mt-3 text-xs text-ink-500">Uploads go to the Officer Prep folder. Pick from Drive adds files you already have without moving them.</p>
      </div>
      {note && <p className="mt-2 text-sm text-iris-300">{note}</p>}
      {queue.length > 0 && (
        <div className="mt-3">
          <ul className="space-y-2">
            {queue.map(it => (
              <li key={it.key} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="truncate">{it.name}</span>
                  <span className={`shrink-0 text-xs ${it.error ? 'text-ember-400' : it.done ? 'text-iris-300' : 'text-ink-400'}`}>{it.error ? 'failed' : it.done ? 'uploaded ✓' : `${it.pct}%`}</span>
                </div>
                {!it.done && !it.error && <Progress value={it.pct} className="mt-1 h-1.5" />}
                {it.error && <div className="text-xs text-ember-400">{it.error}</div>}
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setQueue(q => q.filter(i => !i.done && !i.error))}>Clear finished</Button>
        </div>
      )}
    </Card>
  )
}

function DocList() {
  const drive = useDrive()
  const [kind, setKind] = useState<DocKind | 'all'>('all')
  const [exam, setExam] = useState('')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const needle = q.trim().toLowerCase()
  const shown = drive.docs.filter(d =>
    (kind === 'all' || (d.appProperties?.kind ?? 'other') === kind) &&
    (!exam || d.appProperties?.exam === exam) &&
    (!needle || d.name.toLowerCase().includes(needle) || (d.appProperties?.subject ?? '').toLowerCase().includes(needle)))

  const remove = (d: DriveDoc) => {
    const uploaded = d.appProperties?.origin === 'upload'
    if (confirm(uploaded ? `Move "${d.name}" to Drive's trash? You can restore it from there for 30 days.` : `Remove "${d.name}" from Officer Prep? The file stays in your Drive.`)) drive.remove(d)
  }

  return (
    <Card title={`My documents (${drive.docs.length})`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[{ id: 'all' as const, label: 'All' }, ...DOC_KINDS].map(k => (
          <button key={k.id} onClick={() => setKind(k.id)} className={`rounded-full px-3 py-1 text-xs ${kind === k.id ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300'}`}>{k.label}</button>
        ))}
        <select className={`${inputBase} w-auto px-3 py-1.5 text-xs`} value={exam} onChange={e => setExam(e.target.value)}>
          <option value="">All exams</option>
          {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
        </select>
        <input className={`${inputBase} w-full px-4 py-1.5 text-xs sm:ml-auto sm:w-56`} placeholder="Search name or subject" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {shown.length === 0 ? <Empty>{drive.docs.length ? 'Nothing matches these filters.' : 'No documents yet. Upload some above.'}</Empty> : (
        <ul className="divide-y divide-fg/[0.06]">
          {shown.map(d => {
            const p = d.appProperties ?? {}
            return (
              <li key={d.id} className="py-2.5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {d.iconLink ? <img src={d.iconLink} alt="" className="size-4" /> : <span>📄</span>}
                  <a href={d.webViewLink} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-ink-100 hover:text-fg">{d.name}</a>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone="verdant">{kindLabel(p.kind)}</Badge>
                    {p.exam && <Badge tone="iris">{examById(p.exam)?.short ?? p.exam}</Badge>}
                    {p.subject && <Badge>{p.subject}</Badge>}
                    {p.origin === 'picked' && <Badge tone="saffron">linked</Badge>}
                  </span>
                  <span className="w-36 text-right text-xs text-ink-500">{d.size ? `${fmtBytes(Number(d.size))} · ` : ''}{fmtDateTime(Date.parse(d.modifiedTime))}</span>
                  <span className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(editing === d.id ? null : d.id)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => remove(d)}>Remove</Button>
                  </span>
                </div>
                {editing === d.id && <TagEditor doc={d} onClose={() => setEditing(null)} />}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function TagEditor({ doc, onClose }: { doc: DriveDoc; onClose: () => void }) {
  const drive = useDrive()
  const p = doc.appProperties ?? {}
  const [tags, setTags] = useState<DocTags>({ kind: (p.kind as DocKind) ?? 'other', exam: p.exam || undefined, subject: p.subject || undefined, paperId: p.paperId || undefined })
  return (
    <div className="mt-2 rounded-3xl bg-fg/[0.04] p-3">
      <TagFields tags={tags} onChange={setTags} />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={async () => { await drive.retag(doc, { ...tags, subject: tags.subject?.trim() || undefined }); onClose() }}>Save tags</Button>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  )
}

function SyncCard() {
  const drive = useDrive()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const last = drive.backup ? fmtDateTime(Date.parse(drive.backup.modifiedTime)) : null

  const run = async (fn: () => Promise<boolean | undefined>, ok: string) => {
    setBusy(true)
    setMsg('')
    if (await fn()) setMsg(ok)
    setBusy(false)
  }

  return (
    <Card title="Sync progress between devices">
      <p className="text-sm text-ink-400">
        This backs up your tasks, syllabus progress, test history, SSB responses and writing to a hidden app folder in your Drive.
        On your other device, connect the same Google account and press <b className="text-ink-200">Restore</b>. Practice pictures aren't included.
      </p>
      <div className="mt-3 text-sm">Last Drive backup: <span className="text-ink-200">{last ?? 'none yet'}</span>{drive.backup?.size && <span className="text-ink-500"> · {fmtBytes(Number(drive.backup.size))}</span>}</div>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 size-4 accent-iris-500" checked={drive.autoBackup} onChange={e => drive.setAutoBackup(e.target.checked)} />
        <span>
          <span className="text-ink-100">Back up automatically</span>
          <span className="block font-light text-ink-500">When the app opens (if the last backup is over 12 hours old) and when you switch away from it, at most once an hour. It never overwrites a newer backup from another device.</span>
        </span>
      </label>
      {drive.remoteNewer && (
        <div className="mt-4 rounded-3xl bg-saffron-400/[0.08] px-5 py-4 text-sm">
          <span className="text-ink-100">Your Drive has a newer backup ({last}) from another device.</span>
          <span className="ml-1 font-light text-ink-400">Automatic backup is paused on this device so it doesn't overwrite it. Restore it to pick up where you left off, or press "Back up now" to keep this device's data instead.</span>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={busy} onClick={() => run(drive.backupNow, 'Backed up to Drive ✓')}>Back up now</Button>
        <Button variant="subtle" disabled={busy || !drive.backup}
          onClick={() => { if (confirm(`Replace the progress on this device with the Drive backup from ${last}?`)) run(drive.restore, 'Restored from Drive ✓') }}>
          Restore from Drive
        </Button>
      </div>
      {msg && <p className="mt-2 text-sm text-iris-300">{msg}</p>}
    </Card>
  )
}

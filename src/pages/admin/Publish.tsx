import { useEffect, useMemo, useState } from 'react'
import { checkPack, describeChanges, mergePacks, type Change } from '../../content/pack'
import { refreshContent } from '../../content/store'
import { CONTENT_DIR } from '../../content/types'
import { gitHub, type GitHub } from '../../admin/github'
import {
  addLog, basePackOf, discardDraft, exportDraft, getBlob, getToken, importDraft, pruneBlobs, saveConnection, saveToken, setDraft,
  tokenRemembered, useConnection, useLog, type Connection, type DraftRow,
} from '../../admin/state'
import { loadRemote, publish } from '../../admin/sync'
import { downloadText, fmtDateTime } from '../../lib/util'
import { Badge, Button, Card, Empty, inputCls } from '../../components/ui'
import { Field, Flash, plural, useFlash } from './shared'

type Account = { login: string; canPush: boolean }

export function PublishAdmin({ row, changes }: { row: DraftRow; changes: Change[] }) {
  const conn = useConnection()
  const [token, setToken] = useState(getToken)
  const [account, setAccount] = useState<Account | null>(null)
  // Keyed on the repository's name: the connection row is re-read whenever the draft changes.
  const repoKey = conn ? `${conn.owner}/${conn.repo}/${conn.branch}` : ''
  const gh = useMemo(() => (conn && token && account?.canPush ? gitHub(token, conn) : null), [repoKey, token, account]) // eslint-disable-line react-hooks/exhaustive-deps

  if (conn === undefined) return null
  return (
    <div className="space-y-4">
      <Connect conn={conn} token={token} account={account} onConnected={(t, a) => { setToken(t); setAccount(a) }} onSignOut={() => { saveToken('', false); setToken(''); setAccount(null) }} />
      <Review row={row} changes={changes} gh={gh} />
      {gh && conn && <History gh={gh} conn={conn} />}
      <DraftFiles />
    </div>
  )
}

// ── 1. Connect ─────────────────────────────────────────────────────

function Connect({ conn, token, account, onConnected, onSignOut }: {
  conn: Connection | null; token: string; account: Account | null
  onConnected: (token: string, a: Account) => void; onSignOut: () => void
}) {
  const [form, setForm] = useState<Connection>(conn ?? { owner: '', repo: '', branch: 'main' })
  const [typed, setTyped] = useState(token)
  const [remember, setRemember] = useState(tokenRemembered() || !token)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const connect = async (c = form, t = typed) => {
    if (!c.owner.trim() || !c.repo.trim() || !t.trim()) { setError('Fill in the owner, repository and token.'); return }
    setBusy(true)
    setError('')
    try {
      const info = await gitHub(t.trim(), c).check()
      await gitHub(t.trim(), c).head() // the branch exists
      await saveConnection(c)
      saveToken(t.trim(), remember)
      onConnected(t.trim(), info)
      if (!info.canPush) setError(`Signed in as ${info.login}, but this account can't push to ${c.owner}/${c.repo}.`)
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  // A remembered token connects by itself when the tab opens.
  useEffect(() => { if (token && conn && !account) void connect(conn, token) }, []) // once

  if (account) return (
    <Card title="GitHub">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={account.canPush ? 'verdant' : 'ember'}>{account.canPush ? 'can publish' : 'read only'}</Badge>
        <span className="body-6 text-ink-200">Signed in as <span className="text-fg">{account.login}</span> · {form.owner}/{form.repo} · branch {form.branch}</span>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onSignOut}>Sign out</Button>
      </div>
      <Flash msg={error} tone="error" />
    </Card>
  )

  return (
    <Card title="Connect to GitHub">
      <p className="mb-4 body-6 text-ink-400">
        Publishing commits the content to the app's repository; the existing deploy then rebuilds the site. Only an account with write access to the repository can publish:
        that is what keeps the panel safe even though anyone can open this page.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Owner"><input className={inputCls} value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} placeholder="github-user" /></Field>
        <Field label="Repository"><input className={inputCls} value={form.repo} onChange={e => setForm({ ...form, repo: e.target.value })} placeholder="officer-prep" /></Field>
        <Field label="Branch"><input className={inputCls} value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} /></Field>
      </div>
      <Field label="Access token" className="mt-4" hint={<>
        Make a <a className="text-saffron-400 hover:underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">fine-grained token ↗</a>:
        repository access <i>Only select repositories</i> → this one; permissions <i>Contents: Read and write</i> (and <i>Actions: Read</i> to see build status). Give it an expiry.
        It is sent only to api.github.com.
      </>}>
        <input type="password" autoComplete="off" className={inputCls} value={typed} onChange={e => setTyped(e.target.value)} placeholder="github_pat_…" />
      </Field>
      <label className="mt-3 flex items-center gap-2 body-6 text-ink-300">
        <input type="checkbox" className="accent-accent-500" checked={remember} onChange={e => setRemember(e.target.checked)} />
        Remember on this device (otherwise until this tab closes). Never in backups.
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button disabled={busy} onClick={() => connect()}>{busy ? 'Connecting…' : 'Connect'}</Button>
        <Flash msg={error} tone="error" />
      </div>
    </Card>
  )
}

// ── 2. Review and publish ───────────────────────────────────────────

function Review({ row, changes, gh }: { row: DraftRow; changes: Change[]; gh: GitHub | null }) {
  const [message, setMessage] = useState('')
  const [step, setStep] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState<{ commit: string; summary: string; merged: boolean } | null>(null)
  const [flash, setFlash] = useFlash()
  const issues = useMemo(() => checkPack(row.pack), [row.pack])
  const blocking = issues.filter(i => !i.warn)
  const pendingPictures = useMemo(() => {
    const live = new Set(basePackOf(row).pictures.map(p => p.id))
    return row.pack.pictures.filter(p => !live.has(p.id)).length
  }, [row])

  const go = async () => {
    if (!gh) return
    setError('')
    setDone(null)
    try {
      const r = await publish(gh, { base: row.base, draft: row.pack, blob: getBlob, message, onStep: setStep })
      await setDraft(r.pack, r.base)
      if (r.kind === 'published') {
        await addLog({ at: Date.now(), commit: r.commit, summary: r.summary, merged: r.merged })
        setDone({ commit: r.commit, summary: r.summary, merged: r.merged })
        setMessage('')
      } else setFlash(r.merged ? 'Nothing new to publish: your changes were already live. The draft now includes what others published.' : 'Nothing to publish: the draft matches the site.')
      await pruneBlobs({ ...row, pack: r.pack, base: r.base })
    } catch (e) {
      setError((e as Error).message)
    }
    setStep('')
  }

  /** Brings in what is published now, keeping this draft's changes on top. */
  const pull = async () => {
    if (!gh) return
    setError('')
    setStep('Loading the published content…')
    try {
      const remote = await loadRemote(gh)
      const merged = mergePacks(basePackOf(row), row.pack, remote.pack)
      await setDraft(merged, { commit: remote.commit, files: remote.files, at: Date.now() })
      setFlash(remote.issues.length ? `Loaded, skipping ${plural(remote.issues.length, 'entry', 'entries')} that failed the checks.` : changes.length ? 'Loaded the latest content; your unpublished changes are kept on top.' : 'Loaded the latest content.')
    } catch (e) {
      setError((e as Error).message)
    }
    setStep('')
  }

  const commitUrl = (sha: string) => gh ? `https://github.com/${gh.repo.owner}/${gh.repo.repo}/commit/${sha}` : '#'
  return (
    <Card title="Review & publish">
      <p className="-mt-3 mb-4 caption-5 text-ink-500">
        {row.base.commit ? `Draft based on the published version ${row.base.commit.slice(0, 7)}, loaded ${fmtDateTime(row.base.at)}.` : 'Draft based on the content this device last downloaded.'}
      </p>
      {changes.length === 0 ? <p className="body-6 text-ink-400">No unpublished changes. The draft matches what this device last saw published.</p> : (
        <ul className="divide-y divide-line">
          {changes.map(c => (
            <li key={c.area} className="flex flex-wrap items-center gap-2 py-2 body-6">
              <span className="min-w-0 flex-1 text-ink-200">{c.area}</span>
              {c.added > 0 && <Badge tone="verdant">+{c.added} added</Badge>}
              {c.changed > 0 && <Badge tone="accent">{c.changed} edited</Badge>}
              {c.removed > 0 && <Badge tone="ember">−{c.removed} removed</Badge>}
            </li>
          ))}
        </ul>
      )}
      {pendingPictures > 0 && <p className="mt-3 caption-5 text-ink-500">{plural(pendingPictures, 'picture')} will be uploaded.</p>}
      {issues.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-2xl bg-surface-2 px-4 py-3 body-6">
          {issues.slice(0, 8).map((i, k) => <li key={k} className={i.warn ? 'text-saffron-300' : 'text-ember-300'}>{i.area}{i.id ? ` (${i.id})` : ''}: {i.text}</li>)}
          {issues.length > 8 && <li className="text-ink-400">…and {issues.length - 8} more</li>}
        </ul>
      )}

      <Field label="What changed (commit message, optional)" className="mt-6">
        <input className={inputCls} value={message} onChange={e => setMessage(e.target.value)} placeholder={changes.length ? `Content: ${describeChanges(changes)}` : 'Content update'} />
      </Field>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button size="lg" disabled={!gh || !!step || changes.length === 0 || blocking.length > 0} onClick={go}>{step ? 'Publishing…' : 'Publish to the site'}</Button>
        <Button variant="subtle" disabled={!gh || !!step} onClick={pull}>Load latest from GitHub</Button>
        <Button variant="ghost" disabled={!!step || changes.length === 0} onClick={() => { if (confirm('Throw away every unpublished change in the draft?')) discardDraft() }}>Discard changes</Button>
      </div>
      {!gh && <p className="mt-3 caption-5 text-ink-500">Connect to GitHub above to publish. You can edit and preview the draft without connecting.</p>}
      <div className="mt-3 space-y-2">
        {step && <p role="status" className="body-6 text-ink-300">{step}</p>}
        <Flash msg={error} tone="error" />
        <Flash msg={flash} />
        {done && (
          <div role="status" className="rounded-2xl bg-verdant-500/10 px-4 py-3 body-6 text-verdant-200">
            Published ✓ <a className="font-mono underline" href={commitUrl(done.commit)} target="_blank" rel="noreferrer">{done.commit.slice(0, 7)}</a> · {done.summary}.
            {done.merged && ' Changes someone else published in the meantime were kept.'}
            <div className="mt-1 text-ink-300">The site rebuilds in about two minutes; then every device picks it up the next time the app opens.</div>
          </div>
        )}
      </div>
    </Card>
  )
}

// ── History and build status ─────────────────────────────────────────

function History({ gh, conn }: { gh: GitHub; conn: Connection }) {
  const log = useLog()
  const [commits, setCommits] = useState<Awaited<ReturnType<GitHub['history']>> | null>(null)
  const [runs, setRuns] = useState<Awaited<ReturnType<GitHub['runs']>>>(null)
  const [error, setError] = useState('')
  const load = async () => {
    setError('')
    try {
      const [c, r] = await Promise.all([gh.history(CONTENT_DIR), gh.runs()])
      setCommits(c)
      setRuns(r)
    } catch (e) { setError((e as Error).message) }
  }
  useEffect(() => { void load() }, [gh, log.length])
  const run = runs?.[0]
  const live = run && run.status === 'completed' && run.conclusion === 'success'

  return (
    <Card title="History" action={<Button variant="ghost" size="sm" onClick={async () => { await load(); await refreshContent() }}>Refresh</Button>}>
      {run && (
        <div className="mb-4 flex flex-wrap items-center gap-2 body-6">
          <span className="text-ink-400">Latest deploy:</span>
          <Badge tone={live ? 'verdant' : run.conclusion === 'failure' ? 'ember' : 'saffron'}>{run.status === 'completed' ? run.conclusion ?? 'done' : run.status.replace('_', ' ')}</Badge>
          <span className="caption-5 text-ink-500">{fmtDateTime(Date.parse(run.at))} · {run.sha.slice(0, 7)}</span>
          <a className="caption-4 text-saffron-400 hover:underline" href={run.url} target="_blank" rel="noreferrer">Details ↗</a>
        </div>
      )}
      {runs === null && commits && <p className="mb-4 caption-5 text-ink-500">Give the token <i>Actions: Read</i> to see whether the site has finished rebuilding.</p>}
      <Flash msg={error} tone="error" />
      {commits === null ? <p className="body-6 text-ink-400">Loading…</p> : commits.length === 0 ? <Empty>Nothing published yet.</Empty> : (
        <ul className="divide-y divide-line">
          {commits.map(c => (
            <li key={c.sha} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2 body-6">
              <a className="font-mono caption-4 text-saffron-400 hover:underline" href={`https://github.com/${conn.owner}/${conn.repo}/commit/${c.sha}`} target="_blank" rel="noreferrer">{c.sha.slice(0, 7)}</a>
              <span className="min-w-0 flex-1 text-ink-200">{c.message}</span>
              <span className="caption-5 text-ink-500">{c.author} · {fmtDateTime(Date.parse(c.at))}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 caption-5 text-ink-500">To undo a publish, revert its commit on GitHub; the site rebuilds the same way.</p>
    </Card>
  )
}

// ── Draft files ──────────────────────────────────────────────────

function DraftFiles() {
  const [msg, setMsg] = useFlash()
  const [error, setError] = useState('')
  const exp = async () => {
    downloadText(`officer-prep-content-draft-${new Date().toISOString().slice(0, 10)}.json`, await exportDraft())
    setMsg('Draft saved as a file.')
  }
  const imp = async (f: File) => {
    setError('')
    if (!confirm('Replace the draft on this device with this file?')) return
    try {
      const r = await importDraft(await f.text())
      setMsg(`Draft loaded${r.pictures ? ` with ${plural(r.pictures, 'picture')}` : ''}.${r.issues.length ? ` ${plural(r.issues.length, 'entry', 'entries')} failed the checks and were left out.` : ''}`)
      if (r.missing) setError(`${plural(r.missing, 'picture')} in the file had no image and can't be published; remove them in Pictures.`)
    } catch (e) { setError((e as Error).message) }
  }
  return (
    <Card title="Draft file">
      <p className="mb-4 body-6 text-ink-400">Move a draft to another device, or keep a copy before a big change. The file holds the content and any pictures not yet published.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="subtle" onClick={exp}>Save draft as a file</Button>
        <label className="cursor-pointer rounded-lg bg-fg/[0.07] px-3 py-2 button-md text-fg hover:bg-fg/[0.12] pointer-coarse:min-h-11">
          Load a draft file…
          <input type="file" accept="application/json,.json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) imp(f); e.target.value = '' }} />
        </label>
        <Flash msg={msg} />
        <Flash msg={error} tone="error" />
      </div>
    </Card>
  )
}

import { useState } from 'react'
import { EXAMS, type Exam, type ExamDate } from '../../data/exams'
import { examDateProblem, newId, noticeProblem } from '../../content/pack'
import type { Notice } from '../../content/types'
import { updateDraft, type DraftRow } from '../../admin/state'
import { fmtDate, todayISO } from '../../lib/util'
import { Badge, Button, Card, Chip, Empty, inputCls } from '../../components/ui'
import { Field, Flash, useFlash } from './shared'

export function SiteAdmin({ row }: { row: DraftRow }) {
  return (
    <div className="space-y-4">
      <Notices row={row} />
      <Card title="Exam dates">
        <p className="mb-6 body-6 text-ink-400">
          When a notification changes a date, update it here: countdowns, the study plan and the Exams page follow. Students' own dates still win on their devices.
        </p>
        <div className="space-y-6">{EXAMS.map(e => <ExamDates key={`${e.id}-${row.base.at}`} exam={e} row={row} />)}</div>
      </Card>
    </div>
  )
}

// ── Notices ─────────────────────────────────────────────────────

function Notices({ row }: { row: DraftRow }) {
  const [editing, setEditing] = useState<Notice | 'new' | null>(null)
  const today = todayISO()
  const save = async (n: Notice) => {
    await updateDraft(p => ({ ...p, notices: p.notices.some(x => x.id === n.id) ? p.notices.map(x => (x.id === n.id ? n : x)) : [n, ...p.notices] }))
    setEditing(null)
  }
  const remove = (n: Notice) => { if (confirm('Delete this notice?')) updateDraft(p => ({ ...p, notices: p.notices.filter(x => x.id !== n.id) })) }

  return (
    <>
      {editing && <NoticeForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />}
      <Card title="Notices on the Today page" action={!editing && <Button onClick={() => setEditing('new')}>Add notice</Button>}>
        <p className="mb-4 body-6 text-ink-400">A line at the top of Today: a new notification, a changed date, new content. Each student can dismiss it; it stops showing after its end date.</p>
        {row.pack.notices.length === 0 ? <Empty>No notices.</Empty> : (
          <ul className="divide-y divide-line">
            {row.pack.notices.map(n => (
              <li key={n.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="body-6 text-ink-100">{n.text}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge tone={n.tone === 'important' ? 'saffron' : 'ink'}>{n.tone}</Badge>
                    {n.until && n.until < today ? <Badge tone="ember">ended</Badge> : n.until ? <span className="caption-5 text-ink-500">until {fmtDate(n.until)}</span> : null}
                    {n.link && <span className="caption-5 text-ink-500">{n.link}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(n)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => remove(n)}>Delete</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  )
}

function NoticeForm({ initial, onSave, onCancel }: { initial?: Notice; onSave: (n: Notice) => void; onCancel: () => void }) {
  const [n, setN] = useState<Notice>(() => initial ?? { id: newId('notice'), text: '', tone: 'info' })
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<Notice>) => setN(x => ({ ...x, ...patch }))
  const final: Notice = { ...n, text: n.text.trim(), link: n.link?.trim() || undefined, until: n.until || undefined }
  const problem = noticeProblem(final)
  return (
    <Card title={initial ? 'Edit notice' : 'New notice'}>
      <div className="space-y-4">
        <Field label="Text" hint={`${n.text.length}/500`}>
          <textarea className={`${inputCls} h-20`} value={n.text} maxLength={500} onChange={e => set({ text: e.target.value })} placeholder="CDS (I) 2027 notification is out: apply by 30 December." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Link (optional)" hint="https://… or an app page such as #/exams"><input className={inputCls} value={n.link ?? ''} onChange={e => set({ link: e.target.value })} /></Field>
          <Field label="Show until (optional)"><input type="date" className={inputCls} value={n.until ?? ''} onChange={e => set({ until: e.target.value })} /></Field>
          <Field label="Tone">
            <div className="flex gap-2">
              <Chip active={n.tone === 'info'} onClick={() => set({ tone: 'info' })}>Info</Chip>
              <Chip active={n.tone === 'important'} onClick={() => set({ tone: 'important' })}>Important</Chip>
            </div>
          </Field>
        </div>
        {tried && problem && <p className="body-6 text-ember-300">Can't save yet: {problem}.</p>}
        <div className="flex gap-2">
          <Button onClick={() => { setTried(true); if (!problem) onSave(final) }}>{initial ? 'Save changes' : 'Add notice'}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </div>
    </Card>
  )
}

// ── Exam dates ──────────────────────────────────────────────────

function ExamDates({ exam, row }: { exam: Exam; row: DraftRow }) {
  const override = row.pack.examDates[exam.id]
  const [rows, setRows] = useState<ExamDate[] | null>(null) // null: not editing
  const [flash, setFlash] = useFlash()
  const current = override ?? exam.dates
  const problems = rows?.map(examDateProblem) ?? []

  const save = async () => {
    if (!rows || problems.some(Boolean)) return
    await updateDraft(p => ({ ...p, examDates: { ...p.examDates, [exam.id]: rows } }))
    setRows(null)
    setFlash('Dates saved to the draft.')
  }
  const reset = async () => {
    await updateDraft(p => { const d = { ...p.examDates }; delete d[exam.id]; return { ...p, examDates: d } })
    setRows(null)
  }
  const edit = (i: number, patch: Partial<ExamDate>) => setRows(r => r!.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  return (
    <div className="rounded-3xl bg-surface-2 p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="title-2 text-fg">{exam.short}</h3>
        <Badge tone={override ? 'accent' : 'ink'}>{override ? 'published dates' : 'built-in dates'}</Badge>
        <div className="ml-auto flex gap-1">
          {!rows && <Button variant="ghost" size="sm" onClick={() => setRows(structuredClone(current))}>Change</Button>}
          {!rows && override && <Button variant="ghost" size="sm" onClick={reset}>Use built-in dates</Button>}
        </div>
      </div>
      {!rows ? (
        <ul className="space-y-1 body-6">
          {current.map((d, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <span className="text-ink-200">{d.label}</span>
              <span className="tabular-nums text-ink-400">{d.date ? fmtDate(d.date) : 'TBA'}</span>
              <Badge tone={d.status === 'official' ? 'verdant' : 'saffron'}>{d.status}</Badge>
              {d.note && <span className="caption-5 text-ink-500">{d.note}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          {rows.map((d, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_9rem_minmax(0,1fr)_auto] sm:items-start">
              <input className={inputCls} value={d.label} onChange={e => edit(i, { label: e.target.value })} placeholder="CDS (I) 2027" aria-label="Label" />
              <input type="date" className={inputCls} value={d.date ?? ''} onChange={e => edit(i, { date: e.target.value || null })} aria-label="Date (blank: to be announced)" />
              <select className={inputCls} value={d.status} onChange={e => edit(i, { status: e.target.value as ExamDate['status'] })} aria-label="Status">
                <option value="official">official</option>
                <option value="tentative">tentative</option>
              </select>
              <input className={inputCls} value={d.note ?? ''} onChange={e => edit(i, { note: e.target.value || undefined })} placeholder="Note (optional)" aria-label="Note" />
              <Button variant="danger" size="sm" onClick={() => setRows(r => r!.filter((_, j) => j !== i))} aria-label="Remove date">×</Button>
              {problems[i] && <p className="caption-5 text-ember-300 sm:col-span-5">{problems[i]}</p>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setRows(r => [...r!, { label: `${exam.short} `, date: null, status: 'tentative' }])}>+ Add date</Button>
            <Button size="sm" disabled={problems.some(Boolean) || rows.length === 0} onClick={save}>Save dates</Button>
            <Button variant="ghost" size="sm" onClick={() => setRows(null)}>Cancel</Button>
          </div>
          <p className="caption-5 text-ink-500">Leave the date blank for "to be announced". The countdown uses the first date that is still ahead.</p>
        </div>
      )}
      <Flash msg={flash} />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { EXAMS, examById, type ExamId } from '../../data/exams'
import { OFFICIAL_PAPERS } from '../../data/sources'
import { allPapers } from '../../content'
import { newId, paperProblem } from '../../content/pack'
import type { PubPaper } from '../../content/types'
import { answerKeyColumns, parseAnswerKey } from '../../lib/paste'
import { updateDraft, type DraftRow } from '../../admin/state'
import { Badge, Button, Card, Empty, inputCls } from '../../components/ui'
import { Field, Flash, plural, useFlash } from './shared'

export function PapersAdmin({ row }: { row: DraftRow }) {
  const [editing, setEditing] = useState<PubPaper | 'new' | null>(null)
  const papers = row.pack.papers

  const save = async (p: PubPaper) => {
    await updateDraft(c => ({ ...c, papers: c.papers.some(x => x.id === p.id) ? c.papers.map(x => (x.id === p.id ? p : x)) : [...c.papers, p] }))
    setEditing(null)
  }
  const remove = (p: PubPaper) => {
    if (!confirm(`Delete ${p.sitting} — ${p.paper}? Its answer key goes too.`)) return
    updateDraft(c => {
      const keys = { ...c.paperKeys }
      delete keys[p.id]
      return { ...c, papers: c.papers.filter(x => x.id !== p.id), paperKeys: keys }
    })
  }

  return (
    <div className="space-y-4">
      {editing && <PaperForm key={editing === 'new' ? 'new' : editing.id} initial={editing === 'new' ? undefined : editing} onSave={save} onCancel={() => setEditing(null)} />}
      <Card title="Past papers" action={!editing && <Button onClick={() => setEditing('new')}>Add paper</Button>}>
        <p className="mb-4 body-6 text-ink-400">
          Papers appear under Practice → Past papers with a timed OMR sheet, and in the Library. Link to the official PDF ({OFFICIAL_PAPERS.length} UPSC papers are built in).
          For AFCAT and CGCAT there are no official papers: label memory-based ones as such in the paper name.
        </p>
        {papers.length === 0 ? <Empty>No papers added yet.</Empty> : (
          <ul className="divide-y divide-line">
            {papers.map(p => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="body-5 text-ink-100">{p.sitting} — {p.paper}</div>
                  <div className="caption-5 text-ink-500">{examById(p.exam)?.short} · {p.questions} Qs · {p.marks} marks · {p.minutes} min{row.pack.paperKeys[p.id] ? ' · key added' : ''}</div>
                </div>
                <a href={p.url} target="_blank" rel="noreferrer" className="caption-4 text-saffron-400 hover:underline">PDF ↗</a>
                <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => remove(p)}>Delete</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <AnswerKeys row={row} />
    </div>
  )
}

function PaperForm({ initial, onSave, onCancel }: { initial?: PubPaper; onSave: (p: PubPaper) => void; onCancel: () => void }) {
  const [p, setP] = useState<PubPaper>(() => initial ?? { id: newId('pp'), exam: 'cds', sitting: '', paper: '', url: 'https://', questions: 120, marks: 100, minutes: 120 })
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<PubPaper>) => setP(x => ({ ...x, ...patch }))
  // Number fields keep what is typed (even empty) and are checked on save.
  const num = (v: string) => (v === '' ? NaN : Number(v))
  const final = { ...p, size: p.size?.trim() || undefined }
  const problem = paperProblem(final)

  return (
    <Card title={initial ? 'Edit paper' : 'New paper'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Exam">
          <select className={inputCls} value={p.exam} onChange={e => set({ exam: e.target.value as ExamId })}>
            {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
          </select>
        </Field>
        <Field label="Sitting" hint='As students know it, with the year: "CDS (I) 2023".'><input className={inputCls} value={p.sitting} onChange={e => set({ sitting: e.target.value })} /></Field>
        <Field label="Paper" hint='"General Knowledge", "Paper I — General Ability & Intelligence"'><input className={inputCls} value={p.paper} onChange={e => set({ paper: e.target.value })} /></Field>
        <Field label="PDF link" hint="The official page or PDF (https://…)"><input className={inputCls} value={p.url} onChange={e => set({ url: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2 sm:grid-cols-4">
          <Field label="Questions"><input type="number" min={1} className={inputCls} value={Number.isNaN(p.questions) ? '' : p.questions} onChange={e => set({ questions: num(e.target.value) })} /></Field>
          <Field label="Marks"><input type="number" min={1} className={inputCls} value={Number.isNaN(p.marks) ? '' : p.marks} onChange={e => set({ marks: num(e.target.value) })} /></Field>
          <Field label="Minutes"><input type="number" min={1} className={inputCls} value={Number.isNaN(p.minutes) ? '' : p.minutes} onChange={e => set({ minutes: num(e.target.value) })} /></Field>
          <Field label="PDF size"><input className={inputCls} value={p.size ?? ''} onChange={e => set({ size: e.target.value })} placeholder="12 MB" /></Field>
        </div>
      </div>
      {tried && problem && <p className="mt-4 body-6 text-ember-300">Can't save yet: {problem}.</p>}
      <div className="mt-4 flex gap-2">
        <Button onClick={() => { setTried(true); if (!problem) onSave(final) }}>{initial ? 'Save changes' : 'Add paper'}</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  )
}

/** Official answer keys: students' OMR sheets are scored with them automatically. */
function AnswerKeys({ row }: { row: DraftRow }) {
  const papers = allPapers(row.pack)
  const [id, setId] = useState(papers[0]?.id ?? '')
  const [raw, setRaw] = useState('')
  const [series, setSeries] = useState(0)
  const [flash, setFlash] = useFlash()
  const paper = papers.find(p => p.id === id)
  const columns = answerKeyColumns(raw)

  const letters = useMemo(() => {
    if (!paper || !raw.trim()) return null
    const key = parseAnswerKey(raw, series)
    const missing: number[] = []
    let s = ''
    for (let n = 1; n <= paper.questions; n++) {
      const v = key.get(n)
      if (v === undefined) missing.push(n)
      else s += v === null ? 'X' : 'ABCD'[v]
    }
    return { s, missing, extra: [...key.keys()].filter(n => n > paper.questions).length }
  }, [paper, raw, series])

  const save = async () => {
    if (!paper || !letters || letters.missing.length) return
    await updateDraft(c => ({ ...c, paperKeys: { ...c.paperKeys, [paper.id]: letters.s } }))
    setRaw('')
    setFlash(`Key saved for ${paper.sitting} — ${paper.paper}.`)
  }
  const remove = (pid: string) => updateDraft(c => { const k = { ...c.paperKeys }; delete k[pid]; return { ...c, paperKeys: k } })
  const withKeys = papers.filter(p => row.pack.paperKeys[p.id])

  return (
    <Card title="Answer keys">
      <p className="mb-4 body-6 text-ink-400">
        With a key published, a student's OMR sheet is scored as soon as they submit (they can still edit the key). Use the official key: UPSC publishes them after the final result.
      </p>
      <div className="space-y-4">
        <Field label="Paper">
          <select className={inputCls} value={id} onChange={e => { setId(e.target.value); setRaw('') }}>
            {EXAMS.filter(e => papers.some(p => p.exam === e.id)).map(e => (
              <optgroup key={e.id} label={e.short}>
                {papers.filter(p => p.exam === e.id).map(p => <option key={p.id} value={p.id}>{p.sitting} — {p.paper}{row.pack.paperKeys[p.id] ? ' ✓' : ''}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Field label="Key" hint='"1 B 2 C", "1-(b)", a table with a column per booklet series, or a string of letters. Dropped questions: "Dropped" or X.'>
            <textarea className={`${inputCls} h-32 font-mono`} value={raw} onChange={e => setRaw(e.target.value)} placeholder={row.pack.paperKeys[id] ?? ''} />
          </Field>
          {columns > 1 && (
            <Field label="Booklet series">
              <select className={inputCls} value={series} onChange={e => setSeries(Number(e.target.value))}>
                {Array.from({ length: columns }, (_, i) => <option key={i} value={i}>Series {'ABCD'[i] ?? i + 1}</option>)}
              </select>
            </Field>
          )}
        </div>
        {letters && paper && (
          <div className="rounded-2xl bg-surface-2 px-4 py-3 body-6">
            {letters.missing.length
              ? <span className="text-saffron-300">{paper.questions - letters.missing.length} of {paper.questions} answers found. Missing: {letters.missing.slice(0, 12).join(', ')}{letters.missing.length > 12 ? '…' : ''}</span>
              : <span className="text-verdant-300">All {paper.questions} answers found{letters.s.includes('X') ? `, ${[...letters.s].filter(c => c === 'X').length} dropped` : ''}.</span>}
            {letters.extra > 0 && <span className="ml-2 text-ink-400">({letters.extra} beyond question {paper.questions} ignored)</span>}
            <div className="mt-2 break-all font-mono caption-5 text-ink-400">{letters.s}</div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={!letters || letters.missing.length > 0} onClick={save}>Save key</Button>
          <Flash msg={flash} />
        </div>
      </div>
      {withKeys.length > 0 && (
        <ul className="mt-6 divide-y divide-line">
          {withKeys.map(p => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
              <span className="min-w-0 flex-1 body-6 text-ink-200">{p.sitting} — {p.paper}</span>
              <Badge tone="verdant">{plural(row.pack.paperKeys[p.id].length, 'answer')}</Badge>
              <Button variant="danger" size="sm" onClick={() => remove(p.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

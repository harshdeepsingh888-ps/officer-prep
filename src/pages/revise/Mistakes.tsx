import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Mistake, type MistakeReason } from '../../lib/db'
import { REASONS, addManualMistake, deleteMistake, openQuiz, setMistakeStatus } from '../../lib/learning'
import { fmtDateTime } from '../../lib/util'
import { Badge, Button, Card, Empty, Stat, inputBase, inputCls, labelCls } from '../../components/ui'

const SUBJECTS = ['English', 'General Knowledge', 'Mathematics', 'Reasoning', 'Other']
const SOURCE_LABEL = { quiz: 'Quiz', paper: 'Past paper', manual: 'Added by you' } as const

export default function Mistakes() {
  const mistakes = useLiveQuery(() => db.mistakes.orderBy('createdAt').reverse().toArray(), []) ?? []
  const cards = useLiveQuery(() => db.cards.where('deck').equals('Mistakes').toArray(), []) ?? []
  const [status, setStatus] = useState<'active' | 'mastered' | 'all'>('active')
  const [subject, setSubject] = useState('')
  const [reason, setReason] = useState('')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)

  const due = new Map(cards.map(c => [c.mistakeId, c.due]))
  const active = mistakes.filter(m => m.status === 'active')
  const practisable = active.filter(m => m.question).length
  const reasonCounts = REASONS.map(r => ({ ...r, n: mistakes.filter(m => m.reason === r.id).length })).sort((a, b) => b.n - a.n)
  const needle = q.trim().toLowerCase()
  const shown = mistakes.filter(m =>
    (status === 'all' || m.status === status) &&
    (!subject || m.subject === subject) &&
    (!reason || (reason === 'none' ? !m.reason : m.reason === reason)) &&
    (!needle || [m.question?.text, m.prompt, m.topic, m.note].some(s => s?.toLowerCase().includes(needle))))

  return (
    <div className="space-y-14">
      <section className="grid grid-cols-2 gap-x-14 gap-y-10 lg:grid-cols-4">
        <Stat label="Active" value={active.length} hint="still being revised" />
        <Stat label="Mastered" value={mistakes.length - active.length} hint={`reviewed until a 3-week interval`} />
        <Stat label="Due today" value={cards.filter(c => c.status === 'active' && c.due <= Date.now()).length} />
        <Stat label="Most common reason" value={reasonCounts[0]?.n ? <span className="text-2xl">{reasonCounts[0].label}</span> : '—'} hint={reasonCounts[0]?.n ? `${reasonCounts[0].n} mistakes` : 'tag your mistakes to see this'} />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!practisable} onClick={() => openQuiz({ source: 'mistakes' })}>Practise my mistakes · {practisable}</Button>
        <Button variant="subtle" onClick={() => setAdding(!adding)}>{adding ? 'Close' : 'Add a mistake'}</Button>
      </div>

      {adding && <AddMistake onDone={() => setAdding(false)} />}

      <Card title={`Notebook (${shown.length})`}>
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(['active', 'mastered', 'all'] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300'}`}>{s}</button>
          ))}
          <select className={`${inputBase} w-auto px-3 py-1.5 text-xs`} value={subject} onChange={e => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={`${inputBase} w-auto px-3 py-1.5 text-xs`} value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Any reason</option>
            <option value="none">Not tagged</option>
            {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <input className={`${inputBase} w-full px-4 py-1.5 text-xs sm:ml-auto sm:w-56`} placeholder="Search" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {shown.length === 0
          ? <Empty>{mistakes.length ? 'Nothing matches these filters.' : 'No mistakes yet. Wrong answers in quizzes are saved here automatically.'}</Empty>
          : <ul className="divide-y divide-fg/[0.06]">{shown.map(m => <MistakeRow key={m.id} m={m} due={due.get(m.id)} />)}</ul>}
      </Card>
    </div>
  )
}

function MistakeRow({ m, due }: { m: Mistake; due?: number }) {
  const [note, setNote] = useState(m.note ?? '')
  const q = m.question
  const dueLabel = m.status === 'mastered' ? 'mastered' : !due ? '' : due <= Date.now() ? 'due now' : `next ${fmtDateTime(due)}`
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <Badge tone={m.source === 'quiz' ? 'iris' : m.source === 'paper' ? 'verdant' : 'ink'}>{SOURCE_LABEL[m.source]}</Badge>
        <span>{m.subject} · {m.topic}</span>
        {m.count > 1 && <Badge tone="ember">wrong {m.count}×</Badge>}
        <span className="ml-auto">{dueLabel}</span>
      </div>
      <div className="mt-2 text-ink-100">{q ? q.text : m.prompt}</div>
      <div className="mt-1 text-sm">
        {q ? (
          <>
            {m.yourAnswer !== null && m.yourAnswer !== undefined && <span className="mr-4 text-ember-300">You: {'ABCD'[m.yourAnswer]}. {q.options[m.yourAnswer]}</span>}
            <span className="text-verdant-300">Answer: {'ABCD'[q.answer]}. {q.options[q.answer]}</span>
          </>
        ) : <span className="text-verdant-300">{m.answerText}</span>}
        {m.paperUrl && <a href={m.paperUrl} target="_blank" rel="noreferrer" className="ml-3 text-saffron-400 hover:underline">Open paper ↗</a>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className={`${inputBase} w-auto px-3 py-1.5 text-xs`} value={m.reason ?? ''} onChange={e => db.mistakes.update(m.id, { reason: (e.target.value || undefined) as MistakeReason | undefined })}>
          <option value="">Why did I get it wrong?</option>
          {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <input className={`${inputBase} min-w-48 flex-1 px-4 py-1.5 text-xs`} placeholder="Note to self — the trick, the rule, the trap" value={note}
          onChange={e => setNote(e.target.value)} onBlur={() => note !== (m.note ?? '') && db.mistakes.update(m.id, { note: note.trim() || undefined })} />
        {q && <Button variant="ghost" size="sm" onClick={() => openQuiz({ subject: m.subject, topic: m.topic })}>Practise topic</Button>}
        <Button variant="ghost" size="sm" onClick={() => setMistakeStatus(m.id, m.status === 'active' ? 'mastered' : 'active')}>{m.status === 'active' ? 'Mark mastered' : 'Revise again'}</Button>
        <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this mistake and its revision card?')) deleteMistake(m.id) }}>Delete</Button>
      </div>
    </li>
  )
}

function AddMistake({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ subject: 'General Knowledge', topic: '', prompt: '', answerText: '', reason: '' as MistakeReason | '', note: '' })
  const valid = f.prompt.trim() && f.answerText.trim()
  return (
    <Card title="Add a mistake from anywhere">
      <p className="mb-5 text-sm text-ink-400">A coaching test, a newspaper quiz or a Telegram poll: write down what you got wrong and the right answer. It joins your revision cycle from tomorrow.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelCls}>Subject</label><select className={inputCls} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></div>
        <div><label className={labelCls}>Topic</label><input className={inputCls} value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} placeholder="e.g. Modern history" /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Question / what you got wrong</label><textarea className={`${inputCls} h-20`} value={f.prompt} onChange={e => setF({ ...f, prompt: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className={labelCls}>Correct answer / key point</label><input className={inputCls} value={f.answerText} onChange={e => setF({ ...f, answerText: e.target.value })} /></div>
        <div><label className={labelCls}>Reason</label><select className={inputCls} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value as MistakeReason | '' })}><option value="">—</option>{REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        <div><label className={labelCls}>Note</label><input className={inputCls} value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></div>
      </div>
      <Button className="mt-5" disabled={!valid} onClick={async () => {
        await addManualMistake({ subject: f.subject, topic: f.topic.trim() || 'General', prompt: f.prompt.trim(), answerText: f.answerText.trim(), reason: f.reason || undefined, note: f.note.trim() || undefined })
        onDone()
      }}>Save mistake</Button>
    </Card>
  )
}

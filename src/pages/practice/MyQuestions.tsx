import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, type ExamId } from '../../data/exams'
import { DIFFICULTY_LABEL, difficultyOf, parseQuestionImport, type Difficulty, type Question } from '../../data/questions'
import { db } from '../../lib/db'
import { parsePastedMCQs } from '../../lib/paste'
import { downloadText, todayISO } from '../../lib/util'
import { Badge, Button, Card, Empty, inputBase, inputCls, labelCls } from '../../components/ui'

const SUBJECTS: Question['subject'][] = ['English', 'General Knowledge', 'Mathematics', 'Reasoning']
const SAMPLE_CSV = 'text,optionA,optionB,optionC,optionD,answer,subject,topic,explanation,difficulty\n"Exercise Malabar is held between India and —",Japan only,"US, Japan and Australia",France,Russia,B,General Knowledge,Defence,,easy'
const SAMPLE_PASTE = `📌 Q1. Exercise Garuda is conducted between India and which country?
a) USA  b) France  c) Russia  d) Japan
✅ Ans: b
Explanation: Garuda is the India–France air exercise.

Q2. Who was the first Chief of Defence Staff of India?
(a) Gen M M Naravane
(b) Gen Bipin Rawat ✅
(c) Gen Anil Chauhan
(d) Adm Karambir Singh`

function TagFields({ subject, setSubject, topic, setTopic, difficulty, setDifficulty }: {
  subject: Question['subject']; setSubject: (s: Question['subject']) => void; topic: string; setTopic: (t: string) => void
  difficulty: Difficulty; setDifficulty: (d: Difficulty) => void
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Subject</label>
        <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value as Question['subject'])}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      <div><label className={labelCls}>Topic</label><input className={inputCls} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Defence" /></div>
      <div>
        <label className={labelCls}>Difficulty</label>
        <select className={inputCls} value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as Difficulty)}>
          {([1, 2, 3] as Difficulty[]).map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
        </select>
      </div>
    </>
  )
}

function ExamChecks({ exams, setExams }: { exams: ExamId[]; setExams: (e: ExamId[]) => void }) {
  return (
    <div className="flex flex-wrap gap-4 text-sm">
      {EXAMS.map(e => (
        <label key={e.id} className="flex items-center gap-1.5 pointer-coarse:py-2">
          <input type="checkbox" className="accent-iris-500" checked={exams.includes(e.id)} onChange={ev => setExams(ev.target.checked ? [...exams, e.id] : exams.filter(x => x !== e.id))} />{e.short}
        </label>
      ))}
    </div>
  )
}

export default function MyQuestions() {
  const qs = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const [msg, setMsg] = useState('')

  return (
    <div className="space-y-16">
      <PasteImport onDone={setMsg} />
      <AddQuestion onDone={setMsg} />
      <BulkImport onDone={setMsg} />
      {msg && <p className="text-sm text-verdant-300">{msg}</p>}

      <Card title={`My bank (${qs.length})`} action={qs.length > 0 && <Button variant="ghost" size="sm" onClick={() => downloadText(`my-questions-${todayISO()}.json`, JSON.stringify(qs.map(q => { const c = { ...q }; delete c.id; return c }), null, 1))}>Export JSON</Button>}>
        {qs.length === 0 ? <Empty>No questions yet.</Empty> : (
          <ul className="divide-y divide-fg/[0.06]">
            {qs.map(q => (
              <li key={q.id} className="flex items-start gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="text-ink-100">{q.text}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span>{q.subject} · {q.topic} · Ans {'ABCD'[q.answer]}. {q.options[q.answer]}</span>
                    <Badge>{DIFFICULTY_LABEL[difficultyOf(q)]}</Badge>
                    {q.source && <span>· {q.source}</span>}
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => db.questions.delete(q.id!)}>✕</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function PasteImport({ onDone }: { onDone: (m: string) => void }) {
  const [raw, setRaw] = useState('')
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [source, setSource] = useState('Telegram')
  const [exams, setExams] = useState<ExamId[]>(EXAMS.map(e => e.id))
  const { items, skipped } = parsePastedMCQs(raw)
  const first = items[0]

  const save = async () => {
    await db.questions.bulkAdd(items.map(it => ({ ...it, subject, topic: topic.trim() || 'General', difficulty, source: source.trim() || undefined, exams })))
    onDone(`Added ${items.length} pasted question${items.length === 1 ? '' : 's'} to your bank.`)
    setRaw('')
  }

  return (
    <Card title="Paste from Telegram, PDFs or notes">
      <p className="mb-5 text-sm text-ink-400">
        Copy a quiz post and paste it here. The app picks out each question, its options (a–d, on one line or several) and the answer (an "Ans:" line or a ✅ after the right option). Emoji and numbering are ignored. Everything stays on this device.
      </p>
      <textarea className={`${inputBase} h-44 w-full px-4 py-3 font-mono text-xs`} value={raw} onChange={e => setRaw(e.target.value)} placeholder={SAMPLE_PASTE} />
      {raw.trim() && (
        <div className="mt-3 text-sm">
          <span className={items.length ? 'text-verdant-300' : 'text-saffron-400'}>{items.length} question{items.length === 1 ? '' : 's'} recognised</span>
          {skipped > 0 && <span className="text-ink-500"> · {skipped} skipped (no answer or fewer than 2 options found)</span>}
          {first && (
            <div className="mt-3 rounded-3xl bg-fg/[0.04] px-5 py-4">
              <div className="text-ink-100">{first.text}</div>
              <div className="mt-1 text-xs text-ink-400">{first.options.map((o, j) => <span key={j} className={`mr-3 ${j === first.answer ? 'text-verdant-300' : ''}`}>{'ABCD'[j]}. {o}</span>)}</div>
              {first.explanation && <div className="mt-1 text-xs text-ink-500">💡 {first.explanation}</div>}
            </div>
          )}
        </div>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <TagFields {...{ subject, setSubject, topic, setTopic, difficulty, setDifficulty }} />
        <div><label className={labelCls}>Source</label><input className={inputCls} value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Telegram — channel name" /></div>
      </div>
      <div className="mt-4"><ExamChecks exams={exams} setExams={setExams} /></div>
      <div className="mt-5 flex gap-2">
        <Button disabled={!items.length || !exams.length} onClick={save}>Add {items.length || ''} questions</Button>
        {!raw && <Button variant="ghost" onClick={() => setRaw(SAMPLE_PASTE)}>Try a sample</Button>}
      </div>
    </Card>
  )
}

function AddQuestion({ onDone }: { onDone: (m: string) => void }) {
  const [text, setText] = useState('')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [explanation, setExplanation] = useState('')
  const [exams, setExams] = useState<ExamId[]>(EXAMS.map(e => e.id))
  const valid = text.trim() && opts.filter(o => o.trim()).length >= 2 && opts[answer].trim() && exams.length > 0

  const add = async () => {
    await db.questions.add({ text: text.trim(), options: opts.map(o => o.trim()).filter(Boolean), answer, subject, topic: topic.trim() || 'General', difficulty, explanation: explanation.trim() || undefined, exams, source: 'My notes' })
    setText(''); setOpts(['', '', '', '']); setAnswer(0); setExplanation('')
    onDone('Question added.')
  }

  return (
    <Card title="Write a question">
      <p className="mb-4 text-sm text-ink-400">When a past-paper question beats you, write the concept back as your own question. It shows up in your tests.</p>
      <div className="space-y-3">
        <div><label className={labelCls}>Question</label><textarea className={`${inputCls} h-20`} value={text} onChange={e => setText(e.target.value)} /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {opts.map((o, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name="ans" className="accent-iris-500" checked={answer === i} onChange={() => setAnswer(i)} title="Correct answer" />
              <input className={inputCls} placeholder={`Option ${'ABCD'[i]}`} value={o} onChange={e => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <TagFields {...{ subject, setSubject, topic, setTopic, difficulty, setDifficulty }} />
          <div><label className={labelCls}>Explanation (optional)</label><input className={inputCls} value={explanation} onChange={e => setExplanation(e.target.value)} /></div>
        </div>
        <ExamChecks exams={exams} setExams={setExams} />
        <Button variant="subtle" disabled={!valid} onClick={add}>Add question</Button>
      </div>
    </Card>
  )
}

function BulkImport({ onDone }: { onDone: (m: string) => void }) {
  const [raw, setRaw] = useState('')
  const doImport = async () => {
    try {
      const parsed = parseQuestionImport(raw)
      if (!parsed.length) { onDone('No valid questions found — check the format.'); return }
      await db.questions.bulkAdd(parsed)
      setRaw('')
      onDone(`Imported ${parsed.length} question(s).`)
    } catch (e) {
      onDone(`Import failed: ${(e as Error).message}`)
    }
  }
  return (
    <Card title="Bulk import (CSV or JSON)">
      <p className="mb-3 text-sm text-ink-400">CSV columns: text, optionA–D, answer (A–D), subject, topic, explanation, difficulty (easy/medium/hard). Wrap text containing commas in quotes. JSON: an array of {'{ text, options[], answer, subject, topic, explanation, difficulty, exams[] }'}.</p>
      <textarea className={`${inputBase} h-28 w-full px-4 py-2.5 font-mono text-xs`} value={raw} onChange={e => setRaw(e.target.value)} placeholder={SAMPLE_CSV} />
      <div className="mt-3 flex gap-2">
        <Button variant="subtle" disabled={!raw.trim()} onClick={doImport}>Import</Button>
        <Button variant="ghost" onClick={() => setRaw(SAMPLE_CSV)}>Insert sample</Button>
      </div>
    </Card>
  )
}

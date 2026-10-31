import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, type ExamId } from '../../data/exams'
import { parseQuestionImport, type Question } from '../../data/questions'
import { db } from '../../lib/db'
import { downloadText, todayISO } from '../../lib/util'
import { Button, Card, Empty, inputBase, inputCls, labelCls } from '../../components/ui'

const SUBJECTS: Question['subject'][] = ['English', 'General Knowledge', 'Mathematics', 'Reasoning']
const SAMPLE_CSV = 'text,optionA,optionB,optionC,optionD,answer,subject,topic,explanation\n"Exercise Malabar is held between India and —",Japan only,"US, Japan and Australia",France,Russia,B,General Knowledge,Defence,'

export default function MyQuestions() {
  const qs = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const [text, setText] = useState('')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [explanation, setExplanation] = useState('')
  const [exams, setExams] = useState<ExamId[]>(EXAMS.map(e => e.id))
  const [importRaw, setImportRaw] = useState('')
  const [msg, setMsg] = useState('')

  const valid = text.trim() && opts.filter(o => o.trim()).length >= 2 && opts[answer].trim() && exams.length > 0

  const add = async () => {
    await db.questions.add({ text: text.trim(), options: opts.map(o => o.trim()).filter(Boolean), answer, subject, topic: topic.trim() || 'General', explanation: explanation.trim() || undefined, exams })
    setText(''); setOpts(['', '', '', '']); setAnswer(0); setExplanation('')
    setMsg('Question added.')
  }

  const doImport = async () => {
    try {
      const parsed = parseQuestionImport(importRaw)
      if (!parsed.length) { setMsg('No valid questions found — check the format.'); return }
      await db.questions.bulkAdd(parsed)
      setImportRaw('')
      setMsg(`Imported ${parsed.length} question(s).`)
    } catch (e) {
      setMsg(`Import failed: ${(e as Error).message}`)
    }
  }

  return (
    <div className="space-y-14">
      <Card title="Add a question">
        <p className="mb-3 text-xs text-ink-500">Tip: when a past-paper question beats you, write the concept back as your own question here. It will show up in quizzes.</p>
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
          <div className="grid gap-2 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value as Question['subject'])}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label className={labelCls}>Topic</label><input className={inputCls} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Polity" /></div>
            <div><label className={labelCls}>Explanation (optional)</label><input className={inputCls} value={explanation} onChange={e => setExplanation(e.target.value)} /></div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {EXAMS.map(e => (
              <label key={e.id} className="flex items-center gap-1.5">
                <input type="checkbox" className="accent-iris-500" checked={exams.includes(e.id)} onChange={ev => setExams(ev.target.checked ? [...exams, e.id] : exams.filter(x => x !== e.id))} />{e.short}
              </label>
            ))}
          </div>
          <Button disabled={!valid} onClick={add}>Add question</Button>
        </div>
      </Card>

      <Card title="Bulk import (CSV or JSON)">
        <p className="mb-2 text-xs text-ink-500">CSV columns: text, optionA–D, answer (A–D), subject, topic, explanation. Wrap text with commas in quotes. JSON: an array of {'{ text, options[], answer, subject, topic, explanation, exams[] }'}.</p>
        <textarea className={`${inputBase} h-28 w-full px-4 py-2.5 font-mono text-xs`} value={importRaw} onChange={e => setImportRaw(e.target.value)} placeholder={SAMPLE_CSV} />
        <div className="mt-2 flex gap-2">
          <Button disabled={!importRaw.trim()} onClick={doImport}>Import</Button>
          <Button variant="ghost" onClick={() => setImportRaw(SAMPLE_CSV)}>Insert sample</Button>
        </div>
      </Card>
      {msg && <p className="text-sm text-iris-300">{msg}</p>}

      <Card title={`My bank (${qs.length})`} action={qs.length > 0 && <Button variant="ghost" size="sm" onClick={() => downloadText(`my-questions-${todayISO()}.json`, JSON.stringify(qs.map(q => { const c = { ...q }; delete c.id; return c }), null, 1))}>Export JSON</Button>}>
        {qs.length === 0 ? <Empty>No questions yet.</Empty> : (
          <ul className="divide-y divide-fg/[0.06]">
            {qs.map(q => (
              <li key={q.id} className="flex items-start gap-3 py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="text-ink-100">{q.text}</div>
                  <div className="text-xs text-ink-500">{q.subject} · {q.topic} · Ans {'ABCD'[q.answer]}. {q.options[q.answer]}</div>
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

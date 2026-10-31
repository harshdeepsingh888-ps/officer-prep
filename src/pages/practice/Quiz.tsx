import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BUILTIN_QUESTIONS, type Question } from '../../data/questions'
import { EXAMS, examById, type ExamId } from '../../data/exams'
import { shuffle } from '../../data/ssb'
import { db, useSetting } from '../../lib/db'
import { useCountdown } from '../../lib/hooks'
import { fmtClock, round2 } from '../../lib/util'
import { Button, Card, Empty, Stat, TimerBar, inputCls, labelCls } from '../../components/ui'

const SUBJECTS = ['All', 'English', 'General Knowledge', 'Mathematics', 'Reasoning']
type Result = { correct: number; wrong: number; skipped: number; score: number; maxScore: number; durationSec: number }

export default function Quiz() {
  const [targets] = useSetting<string[]>('targets', [])
  const userQs = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const [examSel, setExamSel] = useState('')
  const examId = (examSel || targets[0] || 'cds') as ExamId
  const exam = examById(examId)!
  const [subject, setSubject] = useState('All')
  const [count, setCount] = useState(20)
  const [timed, setTimed] = useState(true)

  const [qs, setQs] = useState<Question[] | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [idx, setIdx] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  const pool = [...BUILTIN_QUESTIONS, ...userQs.map(u => ({ ...u, id: `u${u.id}` }))]
    .filter(q => q.exams.includes(examId) && (subject === 'All' || q.subject === subject))

  const timer = useCountdown(() => submit())

  const start = () => {
    const pick = shuffle(pool).slice(0, count)
    setQs(pick)
    setAnswers(pick.map(() => null))
    setIdx(0)
    setResult(null)
    setStartedAt(Date.now())
    if (timed) timer.start(pick.length * 60)
  }

  async function submit() {
    if (!qs || result) return
    timer.stop()
    let correct = 0, wrong = 0, skipped = 0
    const wrongTopics: string[] = []
    qs.forEach((q, i) => {
      const a = answers[i]
      if (a === null) skipped++
      else if (a === q.answer) correct++
      else { wrong++; wrongTopics.push(`${q.subject} · ${q.topic}`) }
    })
    const score = round2(correct * exam.marking.correct - wrong * exam.marking.wrong)
    const maxScore = round2(qs.length * exam.marking.correct)
    const durationSec = Math.round((Date.now() - startedAt) / 1000)
    await db.attempts.add({
      kind: 'quiz', exam: examId, title: `Quiz · ${exam.short} · ${subject === 'All' ? 'Mixed' : subject}`, at: Date.now(),
      durationSec, total: qs.length, responses: answers, correct, wrong, skipped, score, maxScore, wrongTopics,
    })
    setResult({ correct, wrong, skipped, score, maxScore, durationSec })
  }

  const running = qs !== null && result === null
  const choose = (opt: number | null) => setAnswers(a => a.map((x, i) => (i === idx ? opt : x)))

  useEffect(() => {
    if (!running || !qs) return
    const on = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const k = e.key.toLowerCase()
      const n = ['1', '2', '3', '4'].indexOf(k) >= 0 ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
      if (n >= 0 && n < qs[idx].options.length) choose(n)
      if (e.key === 'ArrowRight') setIdx(i => Math.min(qs.length - 1, i + 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  if (!qs) {
    return (
      <Card>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className={labelCls}>Exam (sets marking)</label>
            <select className={inputCls} value={examId} onChange={e => setExamSel(e.target.value)}>
              {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Questions</label>
            <select className={inputCls} value={count} onChange={e => setCount(Number(e.target.value))}>
              {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" className="size-4 accent-iris-500" checked={timed} onChange={e => setTimed(e.target.checked)} /> Timed (1 min / question)
          </label>
        </div>
        <p className="mt-3 text-sm text-ink-400">
          {pool.length} questions available · marking {exam.marking.label}.
          {pool.length < count && ' Add your own under My questions to grow the bank.'}
        </p>
        <Button className="mt-4" size="lg" disabled={pool.length === 0} onClick={start}>Start quiz</Button>
      </Card>
    )
  }

  if (result) {
    const attempted = result.correct + result.wrong
    return (
      <div className="space-y-14">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Score" value={`${result.score} / ${result.maxScore}`} hint={exam.marking.label} />
          <Stat label="Accuracy" value={`${attempted ? Math.round((result.correct / attempted) * 100) : 0}%`} hint={`${attempted} attempted`} />
          <Stat label="Right · Wrong · Skipped" value={`${result.correct} · ${result.wrong} · ${result.skipped}`} />
          <Stat label="Time" value={fmtClock(result.durationSec)} />
        </div>
        <div className="flex gap-2">
          <Button onClick={start}>New set</Button>
          <Button variant="subtle" onClick={() => setQs(null)}>Change settings</Button>
        </div>
        <Card title="Review">
          <ol className="space-y-4">
            {qs.map((q, i) => (
              <li key={q.id} className="text-sm">
                <div className="mb-1 font-medium text-ink-100">{i + 1}. {q.text}</div>
                <div className="text-xs text-ink-500">{q.subject} · {q.topic}</div>
                <ul className="mt-1 grid gap-1 sm:grid-cols-2">
                  {q.options.map((o, j) => {
                    const cls = j === q.answer ? 'bg-verdant-500/15 text-verdant-300' : j === answers[i] ? 'bg-ember-500/15 text-ember-200' : 'text-ink-400'
                    return <li key={j} className={`rounded-full px-3 py-1.5 ${cls}`}>{'ABCD'[j]}. {o}</li>
                  })}
                </ul>
                {answers[i] === null && <div className="mt-1 text-xs text-saffron-400">Skipped</div>}
                {q.explanation && <div className="mt-1 text-xs text-ink-400">💡 {q.explanation}</div>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    )
  }

  const q = qs[idx]
  const answered = answers.filter(a => a !== null).length
  return (
    <div className="space-y-14">
      <Card>
        <div className="mb-3 flex items-center justify-between text-sm text-ink-400">
          <span>Question {idx + 1} of {qs.length} · {q.subject}</span>
          <span>{answered} answered</span>
        </div>
        {timed && <TimerBar remaining={timer.remaining} total={qs.length * 60} />}
        <div className="mt-6 text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-snug tracking-tight text-fg">{q.text}</div>
        <div className="mt-8 grid gap-2.5">
          {q.options.map((o, j) => (
            <button key={j} onClick={() => choose(answers[idx] === j ? null : j)}
              className={`rounded-3xl px-5 py-4 text-left text-[15px] transition-colors ${answers[idx] === j ? 'bg-iris-500/20 text-fg ring-1 ring-iris-500' : 'bg-fg/[0.04] text-ink-200 hover:bg-fg/[0.08]'}`}>
              <span className="mr-3 text-ink-500">{'ABCD'[j]}</span>{o}
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="subtle" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>← Prev</Button>
          <Button variant="subtle" disabled={idx === qs.length - 1} onClick={() => setIdx(idx + 1)}>Next →</Button>
          <Button className="ml-auto" onClick={() => { if (confirm(`Submit with ${qs.length - answered} unanswered?`)) submit() }}>Submit</Button>
        </div>
        <p className="mt-2 text-xs text-ink-600">Keys: A–D or 1–4 to answer, ← → to move. Tap a chosen option again to clear it.</p>
      </Card>
      <Card title="Palette">
        {qs.length === 0 ? <Empty>No questions.</Empty> : (
          <div className="flex flex-wrap gap-1.5">
            {qs.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`size-8 rounded-full text-xs font-medium tabular-nums ${i === idx ? 'ring-2 ring-iris-400' : ''} ${answers[i] !== null ? 'bg-iris-500 text-white' : 'bg-fg/[0.07] text-ink-400'}`}>{i + 1}</button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

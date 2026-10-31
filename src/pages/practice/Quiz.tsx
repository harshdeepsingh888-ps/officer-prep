import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { BUILTIN_QUESTIONS, DIFFICULTY_LABEL, difficultyOf, type Difficulty, type Question } from '../../data/questions'
import { EXAMS, examById, type ExamId } from '../../data/exams'
import { shuffle } from '../../data/ssb'
import { db, useSetting, type AttemptItem, type MistakeReason } from '../../lib/db'
import { useCountdown } from '../../lib/hooks'
import { REASONS, recordQuizMistakes, type QuizPreset } from '../../lib/learning'
import { fmtClock, round2 } from '../../lib/util'
import { Badge, Button, Card, Empty, Passage, Stat, TimerBar, inputBase, inputCls, labelCls } from '../../components/ui'

const SUBJECTS = ['All', 'English', 'General Knowledge', 'Mathematics', 'Reasoning']
const RUN_KEY = 'quizRun'

/** An in-progress test — saved after every change so a reload or closed tab can resume it. */
type Run = {
  examId: ExamId
  title: string
  qs: Question[]
  answers: (number | null)[]
  marked: boolean[]
  ms: number[]
  changes: number[]
  idx: number
  startedAt: number
  deadline: number | null
}
type Result = { run: Run; items: AttemptItem[]; correct: number; wrong: number; skipped: number; score: number; maxScore: number; durationSec: number; saved: number }

export default function Quiz() {
  const [targets] = useSetting<string[]>('targets', [])
  const userQs = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const mistakeQs = useLiveQuery(async () => (await db.mistakes.where('status').equals('active').toArray()).flatMap(m => (m.question ? [m.question] : [])), []) ?? []
  const savedRun = useLiveQuery(async () => ((await db.settings.get(RUN_KEY))?.value as Run | undefined) ?? null, [])

  const [examSel, setExamSel] = useState('')
  const examId = (examSel || targets[0] || 'cds') as ExamId
  const exam = examById(examId)!
  const [source, setSource] = useState<NonNullable<QuizPreset['source']>>('all')
  const [subject, setSubject] = useState('All')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty | 0>(0)
  const [count, setCount] = useState(20)
  const [timed, setTimed] = useState(true)

  const [run, setRun] = useState<Run | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const entered = useRef(Date.now())

  // A preset from the dashboard, analytics or mistake notebook ("practise this topic").
  useEffect(() => {
    db.settings.get('quizPreset').then(row => {
      if (!row) return
      const p = row.value as QuizPreset
      if (p.exam) setExamSel(p.exam)
      if (p.source) setSource(p.source)
      setSubject(p.subject ?? 'All')
      setTopic(p.topic ?? '')
      setDifficulty((p.difficulty ?? 0) as Difficulty | 0)
      db.settings.delete('quizPreset')
    })
  }, [])

  const all: Question[] = source === 'mistakes' ? mistakeQs
    : source === 'mine' ? userQs.map(u => ({ ...u, id: `u${u.id}` }))
    : [...BUILTIN_QUESTIONS, ...userQs.map(u => ({ ...u, id: `u${u.id}` }))]
  const bySubject = all.filter(q => (source === 'mistakes' || q.exams.includes(examId)) && (subject === 'All' || q.subject === subject))
  const topics = [...new Set(bySubject.map(q => q.topic))].sort()
  const pool = bySubject.filter(q => (!topic || q.topic === topic) && (!difficulty || difficultyOf(q) === difficulty))

  // Persist the running test.
  useEffect(() => { if (run && !result) db.settings.put({ key: RUN_KEY, value: run }) }, [run, result])

  const timer = useCountdown(() => { if (run) finish(run) })

  /** Milliseconds since the current question was shown; restarts the clock. Call outside state updaters. */
  const takeTime = () => {
    const now = Date.now()
    const spent = now - entered.current
    entered.current = now
    return spent
  }
  const addTime = (r: Run, spent: number): Run => ({ ...r, ms: r.ms.map((v, i) => (i === r.idx ? v + spent : v)) })

  const begin = (r: Run) => {
    setResult(null)
    entered.current = Date.now()
    setRun(r)
    if (r.deadline) {
      const left = Math.round((r.deadline - Date.now()) / 1000)
      if (left <= 0) { finish(r); return }
      timer.start(left)
    } else timer.stop()
  }

  const start = () => {
    const qs = shuffle(pool).slice(0, count)
    const label = topic || (subject === 'All' ? 'Mixed' : subject)
    begin({
      examId, title: `Quiz · ${exam.short} · ${label}${source === 'mistakes' ? ' · my mistakes' : ''}`, qs,
      answers: qs.map(() => null), marked: qs.map(() => false), ms: qs.map(() => 0), changes: qs.map(() => 0),
      idx: 0, startedAt: Date.now(), deadline: timed ? Date.now() + qs.length * 60_000 : null,
    })
  }

  async function finish(raw: Run) {
    timer.stop()
    const r = addTime(raw, takeTime())
    const ex = examById(r.examId)!
    const items: AttemptItem[] = r.qs.map((q, i) => ({
      qid: q.id, subject: q.subject, topic: q.topic, answer: r.answers[i],
      correct: r.answers[i] === null ? null : r.answers[i] === q.answer, ms: r.ms[i], marked: r.marked[i] || undefined, changes: r.changes[i] || undefined,
    }))
    const correct = items.filter(i => i.correct === true).length
    const wrong = items.filter(i => i.correct === false).length
    const skipped = items.length - correct - wrong
    const score = round2(correct * ex.marking.correct - wrong * ex.marking.wrong)
    const maxScore = round2(items.length * ex.marking.correct)
    const durationSec = Math.round((Date.now() - r.startedAt) / 1000)
    await db.attempts.add({
      kind: 'quiz', exam: r.examId, title: r.title, at: Date.now(), durationSec, total: items.length, responses: r.answers,
      correct, wrong, skipped, score, maxScore, items,
      wrongTopics: items.filter(i => i.correct === false).map(i => `${i.subject} · ${i.topic}`),
    })
    const saved = await recordQuizMistakes(items, r.qs, r.examId)
    await db.settings.delete(RUN_KEY)
    setRun(null)
    setResult({ run: r, items, correct, wrong, skipped, score, maxScore, durationSec, saved })
  }

  const goTo = (i: number) => {
    const spent = takeTime()
    setRun(r => (r ? { ...addTime(r, spent), idx: Math.max(0, Math.min(r.qs.length - 1, i)) } : r))
  }
  const choose = (opt: number | null) => setRun(r => {
    if (!r) return r
    const prev = r.answers[r.idx]
    return {
      ...r,
      answers: r.answers.map((a, i) => (i === r.idx ? opt : a)),
      changes: r.changes.map((c, i) => (i === r.idx && prev !== null && prev !== opt ? c + 1 : c)),
    }
  })
  const toggleMark = () => setRun(r => (r ? { ...r, marked: r.marked.map((m, i) => (i === r.idx ? !m : m)) } : r))

  useEffect(() => {
    if (!run) return
    const on = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return
      const k = e.key.toLowerCase()
      const n = ['1', '2', '3', '4'].includes(k) ? Number(k) - 1 : ['a', 'b', 'c', 'd'].indexOf(k)
      if (n >= 0 && n < run.qs[run.idx].options.length) choose(n)
      else if (k === 'm') toggleMark()
      else if (e.key === 'ArrowRight') goTo(run.idx + 1)
      else if (e.key === 'ArrowLeft') goTo(run.idx - 1)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })

  // ── Setup ──
  if (!run && !result) {
    return (
      <div className="space-y-12">
        {savedRun && (
          <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-saffron-400/[0.08] px-5 py-4">
            <div className="min-w-[15rem] flex-1">
              <div className="text-ink-100">Unfinished test · {savedRun.title}</div>
              <div className="text-sm font-light text-ink-400">
                {savedRun.answers.filter(a => a !== null).length}/{savedRun.qs.length} answered
                {savedRun.deadline ? ` · ${fmtClock(Math.max(0, Math.round((savedRun.deadline - Date.now()) / 1000)))} left (the clock kept running)` : ''}
              </div>
            </div>
            <Button onClick={() => begin(savedRun)}>Resume</Button>
            <Button variant="ghost" onClick={() => db.settings.delete(RUN_KEY)}>Discard</Button>
          </div>
        )}
        <Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Exam (sets marking)</label>
              <select className={inputCls} value={examId} onChange={e => setExamSel(e.target.value)}>
                {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Questions from</label>
              <select className={inputCls} value={source} onChange={e => { setSource(e.target.value as typeof source); setTopic('') }}>
                <option value="all">Whole bank</option>
                <option value="mine">My questions only</option>
                <option value="mistakes">My mistakes ({mistakeQs.length})</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Subject</label>
              <select className={inputCls} value={subject} onChange={e => { setSubject(e.target.value); setTopic('') }}>
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Topic</label>
              <select className={inputCls} value={topic} onChange={e => setTopic(e.target.value)}>
                <option value="">All topics</option>
                {topics.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Difficulty</label>
              <select className={inputCls} value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as Difficulty | 0)}>
                <option value={0}>Any</option>
                {([1, 2, 3] as Difficulty[]).map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Questions</label>
              <select className={inputCls} value={count} onChange={e => setCount(Number(e.target.value))}>
                {[10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-2.5 text-sm sm:col-span-2">
              <input type="checkbox" className="size-4 accent-iris-500" checked={timed} onChange={e => setTimed(e.target.checked)} /> Timed (1 min / question)
            </label>
          </div>
          <p className="mt-5 text-sm text-ink-400">
            {pool.length} questions match · marking {exam.marking.label}.
            {pool.length < count && source !== 'mistakes' && ' Add or paste your own under My questions to grow the bank.'}
          </p>
          <Button className="mt-6" size="lg" disabled={pool.length === 0} onClick={start}>Start {Math.min(count, pool.length)}-question test</Button>
        </Card>
      </div>
    )
  }

  if (result) return <ResultView result={result} onAgain={start} onSettings={() => setResult(null)} />

  // ── Running ──
  const r = run!
  const q = r.qs[r.idx]
  const answered = r.answers.filter(a => a !== null).length
  const markedCount = r.marked.filter(Boolean).length
  return (
    <div className="space-y-14">
      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-400">
          <span className="flex items-center gap-2">
            Question {r.idx + 1} of {r.qs.length} · {q.subject} · {q.topic}
            <Badge>{DIFFICULTY_LABEL[difficultyOf(q)]}</Badge>
          </span>
          <span>{answered} answered{markedCount ? ` · ${markedCount} marked` : ''}</span>
        </div>
        {r.deadline && <TimerBar remaining={timer.remaining} total={r.qs.length * 60} />}
        {q.passage && <Passage text={q.passage} />}
        <div className="mt-6 text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-snug tracking-tight text-fg">{q.text}</div>
        <div className="mt-8 grid gap-2.5">
          {q.options.map((o, j) => (
            <button key={j} onClick={() => choose(r.answers[r.idx] === j ? null : j)}
              className={`rounded-3xl px-5 py-4 text-left text-[15px] transition-colors ${r.answers[r.idx] === j ? 'bg-iris-500/20 text-fg ring-1 ring-iris-500' : 'bg-fg/[0.04] text-ink-200 hover:bg-fg/[0.08]'}`}>
              <span className="mr-3 text-ink-500">{'ABCD'[j]}</span>{o}
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button variant="subtle" disabled={r.idx === 0} onClick={() => goTo(r.idx - 1)}>← Prev</Button>
          <Button variant="subtle" disabled={r.idx === r.qs.length - 1} onClick={() => goTo(r.idx + 1)}>Next →</Button>
          <Button variant={r.marked[r.idx] ? 'subtle' : 'ghost'} onClick={toggleMark}>{r.marked[r.idx] ? '★ Marked' : '☆ Mark for review'}</Button>
          <Button className="ml-auto" onClick={() => {
            const left = r.qs.length - answered
            if (confirm(`Submit now?${left ? ` ${left} unanswered.` : ''}${markedCount ? ` ${markedCount} marked for review.` : ''}`)) finish(r)
          }}>Submit</Button>
        </div>
        <p className="mt-3 text-xs text-ink-600"><span className="pointer-coarse:hidden">Keys: A–D or 1–4 answer · M mark for review · ← → move. </span>Tap a chosen option again to clear it. Your progress is saved; you can close the tab and resume.</p>
      </Card>
      <Card title="Palette">
        <div className="flex flex-wrap gap-2">
          {r.qs.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Question ${i + 1}`}
              className={`size-9 rounded-full text-xs font-medium tabular-nums transition-colors
                ${r.answers[i] !== null ? 'bg-iris-500 text-white' : 'bg-fg/[0.07] text-ink-400 hover:bg-fg/[0.12]'}
                ${r.marked[i] ? 'ring-2 ring-saffron-400' : ''}
                ${i === r.idx ? 'outline outline-2 outline-offset-2 outline-fg/40' : ''}`}>{i + 1}</button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-5 text-xs text-ink-500">
          <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-iris-500" />Answered</span>
          <span className="flex items-center gap-2"><span className="size-3 rounded-full ring-2 ring-saffron-400" />Marked for review</span>
          <span className="flex items-center gap-2"><span className="size-3 rounded-full bg-fg/[0.12]" />Not answered</span>
        </div>
      </Card>
    </div>
  )
}

function ResultView({ result, onAgain, onSettings }: { result: Result; onAgain: () => void; onSettings: () => void }) {
  const { run, items } = result
  const exam = examById(run.examId)!
  const [filter, setFilter] = useState<'all' | 'wrong' | 'skipped' | 'marked'>('all')
  const attempted = result.correct + result.wrong
  const avgSec = Math.round(items.reduce((s, i) => s + i.ms, 0) / Math.max(1, items.length) / 1000)

  const byTopic = new Map<string, { subject: string; topic: string; n: number; right: number; ms: number }>()
  items.forEach(i => {
    const k = `${i.subject}|${i.topic}`
    const t = byTopic.get(k) ?? { subject: i.subject, topic: i.topic, n: 0, right: 0, ms: 0 }
    t.n++
    if (i.correct) t.right++
    t.ms += i.ms
    byTopic.set(k, t)
  })
  const topics = [...byTopic.values()].sort((a, b) => a.right / a.n - b.right / b.n)

  const shown = run.qs.map((q, i) => ({ q, i, item: items[i] })).filter(({ item }) =>
    filter === 'all' || (filter === 'wrong' && item.correct === false) || (filter === 'skipped' && item.answer === null) || (filter === 'marked' && item.marked))

  return (
    <div className="space-y-14">
      <section className="grid grid-cols-2 gap-x-14 gap-y-10 md:grid-cols-4">
        <Stat label="Score" value={`${result.score} / ${result.maxScore}`} hint={exam.marking.label} />
        <Stat label="Accuracy" value={`${attempted ? Math.round((result.correct / attempted) * 100) : 0}%`} hint={`${attempted} attempted`} />
        <Stat label="Right · Wrong · Skipped" value={`${result.correct} · ${result.wrong} · ${result.skipped}`} />
        <Stat label="Time" value={fmtClock(result.durationSec)} hint={`${avgSec}s per question on average`} />
      </section>

      {result.saved > 0 && (
        <p className="text-lead font-extralight text-ink-300">
          {result.saved} wrong answer{result.saved === 1 ? '' : 's'} saved to your <a href="#/revise/mistakes" className="text-saffron-400 hover:underline">mistake notebook</a>.
          They come back for revision tomorrow. Tag why you got each one wrong below.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onAgain}>New set, same settings</Button>
        <Button variant="subtle" onClick={onSettings}>Change settings</Button>
      </div>

      <Card title="By topic">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-ink-500">
            <tr><th className="pb-2 font-medium">Topic</th><th className="pb-2 text-right font-medium">Right</th><th className="pb-2 text-right font-medium">Avg time</th></tr>
          </thead>
          <tbody className="divide-y divide-fg/[0.06]">
            {topics.map(t => (
              <tr key={t.subject + t.topic}>
                <td className="py-2 pr-2">{t.topic} <span className="text-xs text-ink-500">· {t.subject}</span></td>
                <td className={`py-2 text-right tabular-nums ${t.right / t.n < 0.5 ? 'text-ember-300' : 'text-ink-200'}`}>{t.right}/{t.n}</td>
                <td className="py-2 text-right tabular-nums text-ink-400">{Math.round(t.ms / t.n / 1000)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title="Review" action={
        <div className="flex gap-1">
          {(['all', 'wrong', 'skipped', 'marked'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs capitalize ${filter === f ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300'}`}>{f}</button>
          ))}
        </div>
      }>
        {shown.length === 0 ? <Empty>Nothing here.</Empty> : (
          <ol className="space-y-8">
            {shown.map(({ q, i, item }) => (
              <li key={q.id} className="text-sm">
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                  <span>{i + 1}. {q.subject} · {q.topic}</span>
                  <span>· {Math.round(item.ms / 1000)}s</span>
                  {item.marked && <Badge tone="saffron">marked</Badge>}
                  {item.changes ? <span>· changed answer {item.changes}×</span> : null}
                </div>
                {q.passage && <Passage text={q.passage} collapsible />}
                <div className="mb-2 text-[15px] text-ink-100">{q.text}</div>
                <ul className="grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, j) => {
                    const cls = j === q.answer ? 'bg-verdant-500/15 text-verdant-300' : j === item.answer ? 'bg-ember-500/15 text-ember-200' : 'text-ink-400'
                    return <li key={j} className={`rounded-full px-3 py-1.5 ${cls}`}>{'ABCD'[j]}. {o}</li>
                  })}
                </ul>
                {item.answer === null && <div className="mt-1 text-xs text-saffron-400">Skipped</div>}
                {q.explanation && <div className="mt-2 text-xs text-ink-400">💡 {q.explanation}</div>}
                {item.correct === false && <ReasonPicker qid={q.id} />}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}

function ReasonPicker({ qid }: { qid: string }) {
  const m = useLiveQuery(() => db.mistakes.get(`q:${qid}`), [qid])
  if (!m) return null
  return (
    <select className={`${inputBase} mt-2 w-auto px-3 py-1.5 text-xs`} value={m.reason ?? ''}
      onChange={e => db.mistakes.update(m.id, { reason: (e.target.value || undefined) as MistakeReason | undefined })}>
      <option value="">Why did I get it wrong?</option>
      {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
    </select>
  )
}

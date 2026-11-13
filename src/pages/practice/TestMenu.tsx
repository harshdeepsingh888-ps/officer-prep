import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, examById, type ExamId } from '../../data/exams'
import { DIFFICULTY_LABEL, type Difficulty } from '../../data/questions'
import { generatedTopics, hasGenerators } from '../../data/generators'
import { mocksFor } from '../../data/patterns'
import { db } from '../../lib/db'
import { go } from '../../lib/hooks'
import type { QuizPreset } from '../../lib/learning'
import { SECTIONAL_MAX, WEEKLY_SIZE, available, paperTerms, topicPool, type Pools, type TestSpec, type TopicSpec } from '../../lib/tests'
import { round2, weekStart } from '../../lib/util'
import { Badge, Button, Card, inputBase, inputCls, labelCls, Chip } from '../../components/ui'

const SUBJECTS = ['All', 'English', 'General Knowledge', 'Mathematics', 'Reasoning']
type Panel = 'mock' | 'sectional' | 'topic' | null

const fmtMarks = (m: { correct: number; wrong: number }) => `+${round2(m.correct)} right · −${round2(m.wrong)} wrong`

/** Practice → Tests: pick the exam, then the kind of test. */
export function TestMenu({ examId, setExam, pools, onStart }: { examId: ExamId; setExam: (id: ExamId) => void; pools: Pools; onStart: (s: TestSpec) => void }) {
  const exam = examById(examId)!
  const [panel, setPanel] = useState<Panel>(null)
  const [topic, setTopic] = useState<TopicSpec>({ mode: 'topic', exam: examId, source: 'all', subject: 'All', topic: '', difficulty: 0, count: 20, timed: true })
  const monday = new Date(weekStart() + 'T00:00:00').getTime()
  const weekly = useLiveQuery(() => db.attempts.where('at').aboveOrEqual(monday).filter(a => a.mode === 'weekly' && a.exam === examId).last(), [examId, monday])

  // A preset from the dashboard, analytics or mistake notebook ("practise this topic") opens the topic test.
  useEffect(() => {
    db.settings.get('quizPreset').then(row => {
      if (!row) return
      const p = row.value as QuizPreset
      if (p.exam) setExam(p.exam as ExamId)
      setTopic(t => ({ ...t, source: p.source ?? 'all', subject: p.subject ?? 'All', topic: p.topic ?? '', difficulty: p.difficulty ?? 0 }))
      setPanel('topic')
      db.settings.delete('quizPreset')
    })
  }, [setExam])

  const tiles: { id: string; title: string; text: string; badge?: string; act: () => void }[] = [
    { id: 'quick', title: 'Quick 10', text: '10 mixed questions in 10 minutes. Good for a short break.', act: () => onStart({ mode: 'quick', exam: examId }) },
    {
      id: 'weekly', title: 'Weekly quiz', text: `${WEEKLY_SIZE} questions from this week's topics and your mistakes, ${WEEKLY_SIZE} minutes.`,
      badge: weekly ? `done · ${weekly.correct}/${weekly.total}` : undefined, act: () => onStart({ mode: 'weekly', exam: examId }),
    },
    { id: 'sectional', title: 'Sectional test', text: 'One section of the paper at the exam’s pace and marking.', act: () => setPanel('sectional') },
    { id: 'mock', title: 'Full mock', text: `A whole ${exam.short} paper: its sections, time limit and negative marking.`, act: () => setPanel('mock') },
    { id: 'topic', title: 'Topic test', text: 'Choose the subject, topic, difficulty and number of questions.', act: () => setPanel('topic') },
    { id: 'pyq', title: 'PYQ papers', text: 'Official UPSC papers, answered on a timed OMR sheet and scored with the key.', act: () => go('practice/papers') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="test-exam" className="caption-4 text-ink-500">Practising for</label>
        <select id="test-exam" className={`${inputBase} px-4 py-2 body-6`} value={examId} onChange={e => setExam(e.target.value as ExamId)}>
          {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
        </select>
        <span className="body-6 text-ink-500">Marking: {exam.marking.label}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(t => (
          <button key={t.id} onClick={t.act} aria-pressed={panel === t.id}
            className={`flex flex-col items-start gap-2 rounded-3xl px-6 py-4 text-left transition-colors ${panel === t.id ? 'bg-accent-500/15 ring-1 ring-accent-500' : 'bg-surface-2 hover:bg-fg/[0.08]'}`}>
            <span className="flex w-full items-center justify-between gap-3">
              <span className="body-3 text-fg">{t.title}</span>
              {t.badge ? <Badge tone="verdant">{t.badge}</Badge> : <span className="text-ink-500" aria-hidden>→</span>}
            </span>
            <span className="body-6 text-ink-400">{t.text}</span>
          </button>
        ))}
      </div>

      {panel === 'mock' && <MockPanel key={examId} examId={examId} pools={pools} onStart={onStart} />}
      {panel === 'sectional' && <SectionalPanel key={examId} examId={examId} pools={pools} onStart={onStart} />}
      {panel === 'topic' && <TopicPanel spec={{ ...topic, exam: examId }} setSpec={setTopic} pools={pools} onStart={onStart} />}
    </div>
  )
}

function Chips<T extends string | number>({ items, value, onChange }: { items: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(i => (
        <Chip key={i.id} onClick={() => onChange(i.id)} aria-pressed={value === i.id} active={value === i.id}>{i.label}</Chip>
      ))}
    </div>
  )
}

function MockPanel({ examId, pools, onStart }: { examId: ExamId; pools: Pools; onStart: (s: TestSpec) => void }) {
  const mocks = mocksFor(examId)
  const [id, setId] = useState(mocks[0].id)
  const m = mocks.find(x => x.id === id) ?? mocks[0]
  const t = paperTerms(m)
  const rows = m.sections.map(s => ({ s, have: Math.min(s.questions, available(pools.bank, s.subject)) }))
  const total = rows.reduce((n, r) => n + r.have, 0)
  const minutes = Math.round((total * t.secPerQ) / 60)
  const short = total < t.questions
  return (
    <Card title="Full mock">
      {mocks.length > 1 && <div className="mb-6"><Chips items={mocks.map(x => ({ id: x.id, label: x.paper }))} value={m.id} onChange={setId} /></div>}
      <p className="body-3 text-ink-200">
        {m.paper}: {t.questions} questions in {t.minutes} minutes, {t.paper.marks} marks. Each question: {fmtMarks(t.marks)}.
      </p>
      <table className="mt-6 w-full max-w-xl body-6">
        <thead className="text-left caption-5 text-ink-500">
          <tr><th className="pb-2 font-medium">Section</th><th className="pb-2 text-right font-medium">In the paper</th><th className="pb-2 text-right font-medium">Available</th></tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(({ s, have }) => (
            <tr key={s.name}>
              <td className="py-2 pr-2 text-ink-200">{s.name}</td>
              <td className="py-2 text-right tabular-nums text-ink-400">{s.questions}</td>
              <td className={`py-2 text-right tabular-nums ${have < s.questions ? 'text-saffron-400' : 'text-ink-200'}`}>{have}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {short && (
        <p className="mt-4 max-w-xl body-6 text-ink-400">
          The bank doesn’t have enough questions for a full paper yet, so this is a <span className="text-ink-100">short mock</span>: {total} questions,
          with the time cut to {minutes} minutes so the pace matches the real exam. Paste more questions under <a href="#/practice/mine" className="text-saffron-400 hover:underline">My questions</a> to fill it out.
        </p>
      )}
      {examId === 'capf' && <p className="mt-3 body-6 text-ink-400">Paper II is descriptive. Practise it on the <a href="#/writing" className="text-saffron-400 hover:underline">Writing</a> page.</p>}
      <Button className="mt-6" size="lg" disabled={!total} onClick={() => onStart({ mode: 'mock', exam: examId, mock: m.id })}>
        Start {short ? 'short ' : ''}mock · {total} questions · {minutes} min
      </Button>
    </Card>
  )
}

function SectionalPanel({ examId, pools, onStart }: { examId: ExamId; pools: Pools; onStart: (s: TestSpec) => void }) {
  const mocks = mocksFor(examId)
  const items = mocks.flatMap(m => m.sections.map((s, i) => ({ id: `${m.id}:${i}`, mock: m, section: i, s, label: mocks.length > 1 && m.sections.length > 1 ? `${s.name} (${m.paper.replace(/^Prelims /, '')})` : s.name })))
  const [id, setId] = useState(items[0].id)
  const it = items.find(x => x.id === id) ?? items[0]
  const t = paperTerms(it.mock)
  const n = Math.min(it.s.questions, SECTIONAL_MAX, available(pools.bank, it.s.subject))
  const minutes = Math.max(1, Math.round((n * t.secPerQ) / 60))
  return (
    <Card title="Sectional test">
      <Chips items={items.map(x => ({ id: x.id, label: x.label }))} value={it.id} onChange={setId} />
      <p className="mt-6 max-w-xl body-3 text-ink-200">
        {n} questions in {minutes} minutes: the same pace as the real paper ({round2(t.secPerQ / 60)} min a question), marked {fmtMarks(t.marks)}.
      </p>
      {n < Math.min(it.s.questions, SECTIONAL_MAX) && <p className="mt-2 body-6 text-ink-400">Only {n} questions for this section in your bank so far.</p>}
      <Button className="mt-6" size="lg" disabled={!n} onClick={() => onStart({ mode: 'sectional', exam: examId, mock: it.mock.id, section: it.section })}>
        Start sectional · {n} questions · {minutes} min
      </Button>
    </Card>
  )
}

function TopicPanel({ spec, setSpec, pools, onStart }: { spec: TopicSpec; setSpec: (f: (s: TopicSpec) => TopicSpec) => void; pools: Pools; onStart: (s: TestSpec) => void }) {
  const set = (patch: Partial<TopicSpec>) => setSpec(s => ({ ...s, ...patch }))
  const generating = spec.source === 'all' || spec.source === 'generated'
  const fixedTopics = spec.source === 'generated' ? [] : topicPool({ ...spec, topic: '', difficulty: 0 }, pools).map(q => q.topic)
  const topics = [...new Set([...fixedTopics, ...(generating ? generatedTopics(spec.subject) : [])])].sort()
  const subjects = SUBJECTS.filter(s => spec.source !== 'generated' || s === 'All' || hasGenerators({ subject: s }))
  const pool = spec.source === 'generated' ? [] : topicPool(spec, pools)
  const gen = generating && hasGenerators({ subject: spec.subject, topic: spec.topic || undefined, exam: spec.exam, difficulty: spec.difficulty || undefined })
  const n = gen ? spec.count : Math.min(spec.count, pool.length)
  const exam = examById(spec.exam)!
  return (
    <Card title="Topic test">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Questions from</label>
          <select className={inputCls} value={spec.source} onChange={e => set({ source: e.target.value as TopicSpec['source'], topic: '' })}>
            <option value="all">Whole bank</option>
            <option value="mine">My questions only</option>
            <option value="mistakes">My mistakes ({pools.mistakes.length})</option>
            <option value="generated">Generated only (Maths, Reasoning)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Subject</label>
          <select className={inputCls} value={spec.subject} onChange={e => set({ subject: e.target.value, topic: '' })}>
            {subjects.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Topic</label>
          <select className={inputCls} value={spec.topic} onChange={e => set({ topic: e.target.value })}>
            <option value="">All topics</option>
            {topics.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Difficulty</label>
          <select className={inputCls} value={spec.difficulty} onChange={e => set({ difficulty: Number(e.target.value) })}>
            <option value={0}>Any</option>
            {([1, 2, 3] as Difficulty[]).map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Questions</label>
          <select className={inputCls} value={spec.count} onChange={e => set({ count: Number(e.target.value) })}>
            {[10, 20, 30, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 body-6">
          <input type="checkbox" className="size-4 accent-accent-500" checked={spec.timed} onChange={e => set({ timed: e.target.checked })} /> Timed (1 min / question)
        </label>
      </div>
      <p className="mt-4 body-6 text-ink-400">
        {spec.source === 'generated'
          ? gen ? 'Every question is generated fresh, with new numbers each time.' : 'Generated questions cover Maths and Reasoning only.'
          : `${pool.length} questions in the bank match${gen ? ', and at least half the test is freshly generated' : ''}.`}
        {' '}Marking {exam.marking.label}.
        {!gen && pool.length < spec.count && spec.source !== 'mistakes' && ' Add or paste your own under My questions to grow the bank.'}
      </p>
      <Button className="mt-6" size="lg" disabled={n === 0} onClick={() => onStart(spec)}>Start {n}-question test</Button>
    </Card>
  )
}

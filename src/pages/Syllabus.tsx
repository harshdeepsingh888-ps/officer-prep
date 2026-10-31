import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, type ExamId } from '../data/exams'
import { db, useSetting } from '../lib/db'
import { Card, PageHeader, Progress } from '../components/ui'

const STATUS = [
  { label: 'Not started', cls: 'bg-ink-800 text-ink-400' },
  { label: 'Learning', cls: 'bg-saffron-950 text-saffron-300' },
  { label: 'Revised', cls: 'bg-verdant-950 text-verdant-300' },
  { label: 'Mastered', cls: 'bg-iris-900 text-iris-300' },
]

export default function Syllabus() {
  const [targets] = useSetting<string[]>('targets', [])
  const list = targets.length ? EXAMS.filter(e => targets.includes(e.id)) : EXAMS
  const [picked, setPicked] = useState<ExamId | null>(null)
  const exam = list.find(e => e.id === picked) ?? list[0]
  const rows = useLiveQuery(() => db.topics.where('exam').equals(exam.id).toArray(), [exam.id]) ?? []
  const status = new Map(rows.map(r => [r.id, r.status]))

  const keyOf = (subject: string, topic: string) => `${exam.id}|${subject}|${topic}`
  const cycle = (subject: string, topic: string) => {
    const id = keyOf(subject, topic)
    db.topics.put({ id, exam: exam.id, subject, topic, status: ((status.get(id) ?? 0) + 1) % 4, updatedAt: Date.now() })
  }

  const total = exam.syllabus.reduce((s, x) => s + x.topics.length, 0)
  const score = exam.syllabus.reduce((s, x) => s + x.topics.reduce((a, t) => a + (status.get(keyOf(x.subject, t)) ?? 0), 0), 0)
  const pct = Math.round((score / (total * 3)) * 100)

  return (
    <div>
      <PageHeader title="Syllabus tracker" subtitle="Tap a topic to move it along: Not started → Learning → Revised → Mastered." />

      <div className="mb-4 flex flex-wrap gap-2">
        {list.map(e => (
          <button key={e.id} onClick={() => setPicked(e.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${e.id === exam.id ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>
            {e.short}
          </button>
        ))}
      </div>

      <Card className="mb-4">
        <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{exam.name}</span><span className="tabular-nums text-ink-400">{pct}%</span></div>
        <Progress value={pct} />
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {STATUS.map((s, i) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`rounded-full px-1.5 py-0.5 ${s.cls}`}>{s.label}</span>
              <span className="text-ink-500">{exam.syllabus.reduce((a, x) => a + x.topics.filter(t => (status.get(keyOf(x.subject, t)) ?? 0) === i).length, 0)}</span>
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {exam.syllabus.map(sec => {
          const done = sec.topics.reduce((a, t) => a + (status.get(keyOf(sec.subject, t)) ?? 0), 0)
          const p = Math.round((done / (sec.topics.length * 3)) * 100)
          return (
            <Card key={sec.subject} title={sec.subject} action={<span className="text-xs tabular-nums text-ink-400">{p}%</span>}>
              <Progress value={p} className="mb-3" />
              <ul className="space-y-1">
                {sec.topics.map(t => {
                  const s = status.get(keyOf(sec.subject, t)) ?? 0
                  return (
                    <li key={t}>
                      <button onClick={() => cycle(sec.subject, t)} className="flex w-full items-center justify-between gap-2 rounded-full px-2 py-1.5 text-left text-sm hover:bg-fg/[0.05]">
                        <span className={s === 3 ? 'text-ink-400' : ''}>{t}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] ${STATUS[s].cls}`}>{STATUS[s].label}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

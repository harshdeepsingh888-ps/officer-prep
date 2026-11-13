import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { examById } from '../../data/exams'
import { db, type Attempt } from '../../lib/db'
import { parseKey, scoreOMR } from '../../lib/scoring'
import { fmtClock, fmtDateTime, round2 } from '../../lib/util'
import { Badge, Button, Card, Empty, inputCls } from '../../components/ui'
import { ScoreCard } from './PastPapers'

export default function History() {
  const attempts = useLiveQuery(() => db.attempts.orderBy('at').reverse().toArray(), []) ?? []
  const [open, setOpen] = useState<number | null>(null)

  return (
    <Card title={`All attempts (${attempts.length})`}>
      {attempts.length === 0 ? <Empty>No attempts yet.</Empty> : (
        <ul className="divide-y divide-line">
          {attempts.map(a => (
            <li key={a.id} className="py-2">
              <button className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left" onClick={() => setOpen(open === a.id ? null : a.id!)}>
                <Badge tone={a.kind === 'omr' ? 'verdant' : 'ink'}>{a.kind === 'omr' ? 'Past paper' : 'Quiz'}</Badge>
                <span className="min-w-0 flex-1 truncate body-6">{a.title}</span>
                <span className="caption-5 text-ink-500">{fmtDateTime(a.at)} · {fmtClock(a.durationSec)}</span>
                <span className="w-28 text-right body-6 tabular-nums">
                  {a.score === undefined ? <Badge tone="saffron">add key</Badge> : `${round2(a.score)} / ${a.maxScore}`}
                </span>
              </button>
              {open === a.id && <Detail a={a} />}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Detail({ a }: { a: Attempt }) {
  const [raw, setRaw] = useState(a.key ?? '')
  const key = parseKey(raw)
  const exam = examById(a.exam)
  const result = a.kind === 'omr' && a.key ? scoreOMR(a.responses, a.key, a.marksPerQ ?? 1, a.negative ?? 0) : null

  const save = async () => {
    const r = scoreOMR(a.responses, key, a.marksPerQ ?? 1, a.negative ?? 0)
    await db.attempts.update(a.id!, { key, correct: r.correct, wrong: r.wrong, skipped: r.skipped, score: r.score, maxScore: r.maxScore })
  }

  return (
    <div className="mt-3 space-y-3 rounded-3xl bg-surface-2 p-3">
      {a.kind === 'omr' && (
        <>
          {result && <ScoreCard res={result} keyStr={a.key} paper={{ paperId: a.paperId ?? `attempt-${a.id}`, title: a.title, url: a.paperUrl, exam: a.exam }} />}
          <div>
            <div className="mb-1 caption-5 text-ink-400">{a.key ? 'Edit answer key' : 'Answer key'} — letters in order, X for dropped</div>
            <textarea className={`${inputCls} h-20 font-mono`} value={raw} onChange={e => setRaw(e.target.value)} />
            <div className="mt-2 flex items-center gap-2">
              <Badge tone={key.length === a.total ? 'accent' : 'saffron'}>{key.length}/{a.total}</Badge>
              <Button size="sm" disabled={key.length !== a.total} onClick={save}>Score</Button>
              {a.paperUrl && <a href={a.paperUrl} target="_blank" rel="noreferrer" className="caption-5 text-saffron-400 hover:underline">Open paper ↗</a>}
            </div>
          </div>
        </>
      )}
      {a.kind === 'quiz' && (
        <div className="body-6 text-ink-300">
          {a.correct} right · {a.wrong} wrong · {a.skipped} skipped — marking {exam?.marking.label}
          {a.wrongTopics && a.wrongTopics.length > 0 && <div className="mt-1 caption-5 text-ink-400">Missed: {[...new Set(a.wrongTopics)].join(', ')}</div>}
        </div>
      )}
      <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this attempt?')) db.attempts.delete(a.id!) }}>Delete attempt</Button>
    </div>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import type { Exam } from '../data/exams'
import { activeDays, db } from '../lib/db'
import { readiness } from '../lib/insights'
import { Progress } from './ui'

export function ReadinessPanel({ exams }: { exams: Exam[] }) {
  const d = useLiveQuery(async () => ({
    rows: await db.topics.toArray(),
    attempts: await db.attempts.toArray(),
    days: await activeDays(),
    cards: await db.cards.toArray(),
    reviews: await db.reviews.where('at').above(Date.now() - 8 * 86_400_000).toArray(),
  }), [])
  if (!d) return null

  return (
    <section>
      <h2 className="heading-5 text-fg">Readiness</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
        {exams.map(e => {
          const r = readiness(e, d)
          return (
            <div key={e.id} className="min-w-0 rounded-3xl bg-surface p-6 sm:p-8">
              <div className="title-3 text-fg">{e.short}</div>
              <div className="mt-6 heading-1 tabular-nums text-fg">
                {r.score}<span className="ml-1 title-2 text-ink-400">%</span>
              </div>
              <ul className="mt-6 space-y-4">
                {r.parts.map(p => (
                  <li key={p.label} title={p.hint}>
                    <div className="mb-2 flex justify-between gap-3 caption-4">
                      <span className="text-ink-300">{p.label} <span className="text-ink-500">· {Math.round(p.weight * 100)}%</span></span>
                      <span className="tabular-nums text-ink-300">{Math.round(p.value * 100)}%</span>
                    </div>
                    <Progress value={p.value * 100} />
                    <div className="mt-2 caption-5 text-ink-500">{p.hint}</div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="mt-4 max-w-[680px] caption-5 text-ink-500">
        An indicative score that weighs syllabus coverage, recent test accuracy, how regularly you study and how well you keep up with revision.
        It's a nudge to keep every part of your preparation moving. It does not predict marks or selection.
      </p>
    </section>
  )
}

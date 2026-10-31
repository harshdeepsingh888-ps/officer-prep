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
      <h2 className="label text-saffron-400">Readiness</h2>
      <div className="mt-8 grid gap-x-14 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {exams.map(e => {
          const r = readiness(e, d)
          return (
            <div key={e.id}>
              <div className="text-[15px] text-fg">{e.short}</div>
              <div className="mt-4 text-[clamp(4rem,7vw,4.875rem)] font-normal leading-none tracking-display tabular-nums text-fg">
                {r.score}<span className="ml-1 text-lead font-extralight tracking-normal text-ink-400">%</span>
              </div>
              <ul className="mt-5 space-y-3">
                {r.parts.map(p => (
                  <li key={p.label} title={p.hint}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-ink-300">{p.label} <span className="text-ink-600">· {Math.round(p.weight * 100)}%</span></span>
                      <span className="tabular-nums text-ink-400">{Math.round(p.value * 100)}%</span>
                    </div>
                    <Progress value={p.value * 100} />
                    <div className="mt-1 text-[11px] font-light text-ink-500">{p.hint}</div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="mt-8 max-w-[640px] text-xs font-light text-ink-500">
        An indicative score that weighs syllabus coverage, recent test accuracy, how regularly you study and how well you keep up with revision.
        It's a nudge to keep every part of your preparation moving. It does not predict marks or selection.
      </p>
    </section>
  )
}

import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../lib/db'
import { reviewsPerDay, subjectStats, topicStats, weakestTopics } from '../../lib/insights'
import { REASONS, openQuiz } from '../../lib/learning'
import { isMastered } from '../../lib/srs'
import { fmtDate, fmtDateTime, round2 } from '../../lib/util'
import { BarRows, ColumnChart } from '../../components/charts'
import { Button, Card, Empty, Stat } from '../../components/ui'
import History from './History'

export default function Analytics() {
  const attempts = useLiveQuery(() => db.attempts.orderBy('at').toArray(), []) ?? []
  const mistakes = useLiveQuery(() => db.mistakes.toArray(), []) ?? []
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? []
  const reviews = useLiveQuery(() => db.reviews.where('at').above(Date.now() - 15 * 86_400_000).toArray(), []) ?? []

  const topics = topicStats(attempts)
  const subjects = subjectStats(topics)
  const weak = weakestTopics(topics, 2, 8)
  const scored = attempts.filter(a => a.score !== undefined && a.maxScore)
  const right = scored.reduce((s, a) => s + (a.correct ?? 0), 0)
  const answered = scored.reduce((s, a) => s + (a.correct ?? 0) + (a.wrong ?? 0), 0)
  const items = attempts.flatMap(a => a.items ?? [])
  const avgSec = items.length ? Math.round(items.reduce((s, i) => s + i.ms, 0) / items.length / 1000) : null
  const trend = scored.slice(-20).map(a => {
    const pct = Math.max(0, (a.score! / a.maxScore!) * 100)
    return { key: String(a.id), value: pct, label: fmtDate(new Date(a.at).toISOString().slice(0, 10)).replace(/ \d{4}$/, ''), tip: `${a.title} · ${round2(a.score!)} / ${a.maxScore} (${Math.round(pct)}%) · ${fmtDateTime(a.at)}` }
  })
  const reasonRows = [
    ...REASONS.map(r => ({ key: r.id, label: r.label, value: mistakes.filter(m => m.reason === r.id).length })),
    { key: 'none', label: 'Not tagged yet', value: mistakes.filter(m => !m.reason).length },
  ].filter(r => r.value > 0).sort((a, b) => b.value - a.value).map(r => ({ ...r, display: String(r.value) }))
  const perDay = reviewsPerDay(reviews, 14)

  if (attempts.length === 0 && cards.length === 0) {
    return <Empty>No data yet. Take a quiz or score a past paper, and your accuracy, pace and weak topics appear here.</Empty>
  }

  return (
    <div className="space-y-16">
      <section className="grid grid-cols-2 gap-x-14 gap-y-10 lg:grid-cols-4">
        <Stat label="Tests taken" value={attempts.length} hint="quizzes & past papers" />
        <Stat label="Accuracy" value={answered ? `${Math.round((right / answered) * 100)}%` : '—'} hint={`${answered} answered in scored tests`} />
        <Stat label="Avg time per question" value={avgSec === null ? '—' : `${avgSec}s`} hint="quizzes with timing" />
        <Stat label="Mistakes mastered" value={`${mistakes.filter(m => m.status === 'mastered').length}/${mistakes.length}`} hint="from your mistake notebook" />
      </section>

      <Card title="Score trend · % of maximum, last 20 tests">
        <ColumnChart data={trend} max={100} empty="Score a quiz or a past paper to start the trend." />
      </Card>

      <div className="grid gap-x-16 gap-y-16 lg:grid-cols-2">
        <Card title="Accuracy by subject">
          <BarRows max={1} empty="Quizzes taken from now on record per-subject detail."
            rows={subjects.map(s => ({ key: s.subject, label: s.subject, value: s.acc, display: `${Math.round(s.acc * 100)}%`, tip: `${s.right} of ${s.n} right` }))} />
        </Card>
        <Card title="Why you get questions wrong">
          <BarRows empty="Tag your mistakes (concept, calculation, guess…) to see a pattern." rows={reasonRows} />
        </Card>
      </div>

      <Card title="Weakest topics">
        {weak.length === 0 ? <Empty>Answer at least two questions in a topic to see it ranked here.</Empty> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-ink-500">
              <tr>
                <th className="pb-2 font-medium">Topic</th>
                <th className="pb-2 text-right font-medium">Right</th>
                <th className="pb-2 text-right font-medium">Accuracy</th>
                <th className="hidden pb-2 text-right font-medium sm:table-cell">Avg time</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/[0.06]">
              {weak.map(t => (
                <tr key={t.subject + t.topic}>
                  <td className="py-2.5 pr-2 text-ink-100">{t.topic} <span className="text-xs text-ink-500">· {t.subject}</span></td>
                  <td className="py-2.5 text-right tabular-nums text-ink-300">{t.right}/{t.n}</td>
                  <td className={`py-2.5 text-right tabular-nums ${t.acc < 0.5 ? 'text-ember-300' : 'text-ink-200'}`}>{Math.round(t.acc * 100)}%</td>
                  <td className="hidden py-2.5 text-right tabular-nums text-ink-400 sm:table-cell">{t.avgSec}s</td>
                  <td className="py-2.5 text-right"><Button variant="ghost" size="sm" onClick={() => openQuiz({ subject: t.subject, topic: t.topic })}>Practise</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="grid gap-x-16 gap-y-16 lg:grid-cols-[2fr_1fr]">
        <Card title="Reviews per day · last 14 days">
          <ColumnChart height={120} empty="No reviews yet."
            data={perDay.map(d => ({ key: d.day, value: d.n, label: fmtDate(d.day).replace(/ \d{4}$/, ''), tip: `${fmtDate(d.day)} · ${d.n} reviews` }))} />
        </Card>
        <div className="grid grid-cols-2 gap-x-10 gap-y-10 self-start lg:grid-cols-1">
          <Stat label="Cards due now" value={cards.filter(c => c.status === 'active' && c.due <= Date.now()).length} />
          <Stat label="Cards mastered" value={`${cards.filter(isMastered).length}/${cards.length}`} hint="interval of 3 weeks or more" />
        </div>
      </div>

      <History />
    </div>
  )
}

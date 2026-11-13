import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS } from '../data/exams'
import { activityByDay, bestStreak, db, streakFrom, useSetting } from '../lib/db'
import { coverage, periodStats, subjectCoverage, subjectStats, topicStats, type PeriodStats } from '../lib/insights'
import { MODE_LABEL } from '../lib/tests'
import { addDays, fmtDate, fmtDateTime, round2, todayISO, weekStart } from '../lib/util'
import { LEVELS, levelFor } from '../lib/level'
import { ActivityCalendar, BarRows } from '../components/charts'
import { Icon } from '../components/icons'
import { Badge, Button, Card, Empty, PageHeader, Progress as Bar, Stat, StatGrid } from '../components/ui'

const dayStart = (iso: string) => new Date(iso + 'T00:00:00').getTime()
const hours = (min: number) => (min ? `${round2(min / 60)} h` : '0 h')
const accuracy = (p: PeriodStats) => (p.answered ? Math.round((p.right / p.answered) * 100) : null)

function useWide() {
  const query = '(min-width: 640px)'
  const [wide, setWide] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

/** Streaks, this week against last, syllabus covered and how tests are going. */
export default function Progress() {
  const [targets] = useSetting<string[]>('targets', [])
  const wide = useWide()
  const [copied, setCopied] = useState('')
  const d = useLiveQuery(async () => ({
    activity: await activityByDay(),
    attempts: await db.attempts.toArray(),
    sessions: await db.sessions.toArray(),
    reviews: await db.reviews.toArray(),
    rows: await db.topics.toArray(),
    tasks: await db.tasks.toArray(),
    ssb: await db.ssb.toArray(),
    writings: await db.writings.toArray(),
  }), [])
  if (!d) return null

  const days = new Set(d.activity.keys())
  const streak = streakFrom(days)
  const best = bestStreak(days)
  const lvl = levelFor(days.size)
  const today = todayISO()
  let last30 = 0
  for (let i = 0; i < 30; i++) if (days.has(addDays(today, -i))) last30++

  const monday = weekStart()
  const thisWeek = periodStats(dayStart(monday), Date.now() + 1, d)
  const lastWeek = periodStats(dayStart(addDays(monday, -7)), dayStart(monday), d)
  const weeklyDone = new Set(d.attempts.filter(a => a.mode === 'weekly' && a.week && a.week >= addDays(monday, -7 * 7)).map(a => a.week)).size

  const exams = EXAMS.filter(e => targets.includes(e.id))
  const subjects = subjectStats(topicStats(d.attempts))
  const recent = [...d.attempts].sort((a, b) => b.at - a.at).slice(0, 10)

  const compare: { label: string; now: string; before: string; change: number; unit?: string }[] = [
    { label: 'Study time', now: hours(thisWeek.studyMin), before: hours(lastWeek.studyMin), change: round2((thisWeek.studyMin - lastWeek.studyMin) / 60), unit: 'h' },
    { label: 'Tests taken', now: `${thisWeek.tests}`, before: `${lastWeek.tests}`, change: thisWeek.tests - lastWeek.tests },
    { label: 'Questions answered', now: `${thisWeek.answered}`, before: `${lastWeek.answered}`, change: thisWeek.answered - lastWeek.answered },
    {
      label: 'Accuracy', now: accuracy(thisWeek) === null ? '—' : `${accuracy(thisWeek)}%`, before: accuracy(lastWeek) === null ? '—' : `${accuracy(lastWeek)}%`,
      change: accuracy(thisWeek) !== null && accuracy(lastWeek) !== null ? accuracy(thisWeek)! - accuracy(lastWeek)! : 0, unit: ' pts',
    },
    { label: 'Cards revised', now: `${thisWeek.reviews}`, before: `${lastWeek.reviews}`, change: thisWeek.reviews - lastWeek.reviews },
    { label: 'Topics moved forward', now: `${thisWeek.topics}`, before: `${lastWeek.topics}`, change: thisWeek.topics - lastWeek.topics },
    { label: 'Tasks done', now: `${thisWeek.tasks}`, before: `${lastWeek.tasks}`, change: thisWeek.tasks - lastWeek.tasks },
    { label: 'SSB practice sets', now: `${thisWeek.ssb}`, before: `${lastWeek.ssb}`, change: thisWeek.ssb - lastWeek.ssb },
    { label: 'Essays & writing', now: `${thisWeek.writing}`, before: `${lastWeek.writing}`, change: thisWeek.writing - lastWeek.writing },
  ]

  const copyReport = async () => {
    const acc = accuracy(thisWeek)
    const text = [
      `Officer Prep · week of ${fmtDate(monday)} (so far)`,
      `Streak: ${streak} day${streak === 1 ? '' : 's'} · best ${best}`,
      `Study: ${hours(thisWeek.studyMin)} · Tests: ${thisWeek.tests} (${thisWeek.answered} answered${acc === null ? '' : `, ${acc}% right`})`,
      `Cards revised: ${thisWeek.reviews} · Topics moved forward: ${thisWeek.topics} · Tasks done: ${thisWeek.tasks}`,
      `SSB sets: ${thisWeek.ssb} · Writing: ${thisWeek.writing}`,
      ...(exams.length ? [`Syllabus: ${exams.map(e => `${e.short} ${Math.round(coverage(e, d.rows) * 100)}%`).join(' · ')}`] : []),
    ].join('\n')
    try { await navigator.clipboard.writeText(text); setCopied('Copied ✓') } catch { setCopied('Couldn’t copy') }
    setTimeout(() => setCopied(''), 2500)
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Progress" eyebrow="Your report"
        subtitle="How consistent you’ve been, this week against last, how much of the syllabus is covered and how your tests are going."
        action={<Button variant="subtle" onClick={copyReport}>{copied || 'Copy weekly report'}</Button>} />

      <section className="grid items-center gap-8 rounded-3xl bg-surface-2 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="caption-4 text-ink-500">Your level</div>
          <div className="mt-2 heading-2 sm:heading-1 text-fg">{lvl.current.name}</div>
          <p className="mt-3 body-6 text-ink-400">
            {lvl.next ? `${lvl.toNext} more study day${lvl.toNext === 1 ? '' : 's'} to ${lvl.next.name}.` : 'The highest level. Keep showing up.'} {days.size} active day{days.size === 1 ? '' : 's'} so far; any day you practise counts, and a missed day never costs you a level.
          </p>
          {lvl.next && <Bar value={lvl.progress * 100} className="mt-4 max-w-md" />}
        </div>
        <div className="flex flex-wrap gap-1" role="img" aria-label={`Level ${lvl.level + 1} of ${LEVELS.length}: ${lvl.current.name}`}>
          {LEVELS.map((r, i) => (
            <span key={r.name} title={`${r.name}: ${r.days} active days`}>
              <Icon name="ssb" filled={i <= lvl.level} className={`size-6 ${i <= lvl.level ? 'text-accent-300' : 'text-ink-700'}`} />
            </span>
          ))}
        </div>
      </section>

      <StatGrid className="lg:grid-cols-4">
        <Stat label="Current streak" value={streak} hint={streak ? 'days in a row' : 'do anything today to start one'} />
        <Stat label="Best streak" value={best} hint="days in a row" />
        <Stat label="Active days" value={last30} hint="of the last 30" />
        <Stat label="Weekly quizzes" value={`${weeklyDone}/8`} hint="of the last 8 weeks" />
      </StatGrid>

      <Card title="Activity">
        <ActivityCalendar counts={d.activity} weeks={wide ? 26 : 15} />
        <p className="mt-4 body-6 text-ink-500">Counts tests, revision cards, finished tasks, study sessions, SSB sets, essays and current-affairs notes. Hover a square for the day.</p>
      </Card>

      <Card title="This week against last">
        <div className="overflow-x-auto">
          <table className="w-full body-6">
            <thead className="text-left caption-5 text-ink-500">
              <tr>
                <th className="pb-3 font-medium" />
                <th className="pb-3 pl-3 text-right font-medium">This week<span className="hidden sm:inline"> (so far)</span></th>
                <th className="pb-3 pl-3 text-right font-medium">Last week</th>
                <th className="pb-3 pl-3 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {compare.map(r => (
                <tr key={r.label}>
                  <td className="py-2 pr-3 text-ink-200">{r.label}</td>
                  <td className="py-2 text-right tabular-nums text-fg">{r.now}</td>
                  <td className="py-2 text-right tabular-nums text-ink-400">{r.before}</td>
                  <td className={`py-2 text-right tabular-nums ${r.change > 0 ? 'text-verdant-300' : r.change < 0 ? 'text-ember-300' : 'text-ink-500'}`}>
                    {r.change > 0 ? `↑ ${r.change}${r.unit ?? ''}` : r.change < 0 ? `↓ ${-r.change}${r.unit ?? ''}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Syllabus covered" action={<a href="#/study" className="caption-4 text-ink-400 hover:text-fg">Study path →</a>}>
          {exams.length === 0 ? <Empty>Choose your target exams on the <a href="#/exams" className="text-saffron-400 hover:underline">Exams</a> page to track coverage.</Empty> : (
            <div className="space-y-10">
              {exams.map(e => (
                <div key={e.id}>
                  <div className="mb-4 flex items-baseline justify-between">
                    <span className="text-ink-100">{e.short}</span>
                    <span className="heading-5 tabular-nums text-fg">{Math.round(coverage(e, d.rows) * 100)}%</span>
                  </div>
                  <BarRows max={1} rows={subjectCoverage(e, d.rows).map(s => ({
                    key: s.subject, label: s.subject, value: s.pct, display: `${Math.round(s.pct * 100)}%`,
                    sub: `${s.done} of ${s.total} topics revised`, tip: `${s.subject}: ${s.done} of ${s.total} topics revised or mastered`,
                  }))} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Accuracy by subject" action={<a href="#/practice/analytics" className="caption-4 text-ink-400 hover:text-fg">Analytics →</a>}>
          <BarRows max={1} empty="Take a test to see accuracy by subject." rows={subjects.map(s => ({
            key: s.subject, label: s.subject, value: s.acc, display: `${Math.round(s.acc * 100)}%`,
            sub: `${s.n} answers`, tip: `${s.subject}: ${s.right} right of ${s.n}`,
          }))} />
        </Card>
      </section>

      <Card title="Recent tests" action={<a href="#/practice" className="caption-4 text-ink-400 hover:text-fg">Take a test →</a>}>
        {recent.length === 0 ? <Empty>No tests yet. Start with a Quick 10 or this week’s quiz on Practice.</Empty> : (
          <ul className="divide-y divide-line">
            {recent.map(a => {
              const pct = a.score !== undefined && a.maxScore ? Math.round((Math.max(0, a.score) / a.maxScore) * 100) : null
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <Badge tone={a.mode === 'mock' ? 'accent' : a.mode === 'weekly' ? 'verdant' : a.kind === 'omr' ? 'saffron' : 'ink'}>{a.kind === 'omr' ? 'PYQ' : MODE_LABEL[a.mode ?? 'topic']}</Badge>
                  <div className="min-w-[12rem] flex-1">
                    <div className="truncate text-ink-100">{a.title}</div>
                    <div className="caption-5 text-ink-500">{fmtDateTime(a.at)}</div>
                  </div>
                  <span className="shrink-0 tabular-nums text-fg">{a.score === undefined ? <Badge tone="saffron">needs key</Badge> : `${round2(a.score)} / ${round2(a.maxScore ?? 0)}`}</span>
                  {pct !== null && <span className="w-12 shrink-0 text-right body-6 tabular-nums text-ink-400">{pct}%</span>}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, nextDate } from '../data/exams'
import { db, useSetting, activeDays, streakFrom } from '../lib/db'
import { addDays, daysUntil, fmtDate, fmtDateTime, todayISO, round2 } from '../lib/util'
import { Badge, Button, Card, Empty, Progress, Stat, inputCls } from '../components/ui'
import { Constellation } from '../components/Particles'
import { DailyMission } from '../components/DailyMission'
import { ReadinessPanel } from '../components/ReadinessPanel'
import { BackupReminder } from '../components/BackupReminder'

export default function Dashboard() {
  const today = todayISO()
  const [targets] = useSetting<string[]>('targets', [])
  const [overrides] = useSetting<Record<string, string>>('examDates', {})
  const custom = useLiveQuery(() => db.customExams.toArray(), []) ?? []
  const tasks = useLiveQuery(() => db.tasks.where('date').equals(today).toArray(), [today]) ?? []
  const sessions = useLiveQuery(() => db.sessions.where('date').aboveOrEqual(addDays(today, -6)).toArray(), [today]) ?? []
  const weekAgo = Date.now() - 7 * 86_400_000
  const weekAttempts = useLiveQuery(() => db.attempts.where('at').above(weekAgo).count(), []) ?? 0
  const weekSSB = useLiveQuery(() => db.ssb.where('at').above(weekAgo).count(), []) ?? 0
  const streak = useLiveQuery(async () => streakFrom(await activeDays()), []) ?? 0
  const topics = useLiveQuery(() => db.topics.toArray(), []) ?? []
  const recent = useLiveQuery(() => db.attempts.orderBy('at').reverse().limit(4).toArray(), []) ?? []
  const [newTask, setNewTask] = useState('')

  const targetExams = EXAMS.filter(e => targets.includes(e.id))
  const studyHours = round2(sessions.reduce((s, x) => s + x.minutes, 0) / 60)

  const countdowns = [
    ...targetExams.map(e => ({ key: e.id, title: e.short, d: nextDate(e, overrides) })),
    ...custom.filter(c => c.date >= today).map(c => ({ key: `c${c.id}`, title: c.name, d: { label: c.name, date: c.date, status: 'official' as const, note: 'Custom' } })),
  ]
  const nearest = countdowns.filter(c => c.d?.date).sort((a, b) => a.d!.date!.localeCompare(b.d!.date!))[0]
  const doneCount = tasks.filter(t => t.done).length

  const addTask = () => {
    if (!newTask.trim()) return
    db.tasks.add({ date: today, title: newTask.trim(), done: false })
    setNewTask('')
  }

  return (
    <div className="space-y-24">
      <BackupReminder />
      <section className="grid items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <div className="relative z-10">
          <div className="label text-saffron-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1 className="mt-6 text-[clamp(3.75rem,9.5vw,7.0625rem)] font-normal leading-[0.95] tracking-display text-fg">Jai Hind.</h1>
          <p className="mt-8 max-w-[480px] text-lead font-extralight leading-relaxed text-ink-200">
            {nearest?.d?.date
              ? <><span className="text-fg">{daysUntil(nearest.d.date)} days</span> to {nearest.d.label}. </>
              : 'Pick your target exams to start the countdown. '}
            {tasks.length ? `${doneCount} of ${tasks.length} tasks done today.` : 'Plan the day, then work through the drill.'}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-7">
            {countdowns.length === 0
              ? <a href="#/exams"><Button size="lg">Choose your exams</Button></a>
              : <a href="#/revise"><Button size="lg">Start today's revision</Button></a>}
            <a href="#/planner" className="label text-ink-400 transition-colors hover:text-fg">Open planner →</a>
          </div>
        </div>
        <div className="-mx-5 h-[300px] sm:mx-0 sm:h-[420px] lg:h-[540px]">
          <Constellation />
        </div>
      </section>

      {countdowns.length > 0 && (
        <section>
          <h2 className="label text-saffron-400">Countdown</h2>
          <div className="mt-8 grid gap-x-14 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {countdowns.map(({ key, title, d }) => {
              const days = d?.date ? daysUntil(d.date) : null
              return (
                <div key={key}>
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] text-fg">{title}</span>
                    {d && <Badge tone={d.status === 'official' ? 'iris' : 'saffron'}>{d.status}</Badge>}
                  </div>
                  <div className="mt-4 text-[clamp(4rem,7vw,4.875rem)] font-normal leading-none tracking-display tabular-nums text-fg">
                    {days ?? '—'}
                    {days !== null && <span className="ml-3 text-lead font-extralight tracking-normal text-ink-400">days</span>}
                  </div>
                  <div className="mt-3 text-sm font-light text-ink-400">{d?.date ? `${d.label} · ${fmtDate(d.date)}` : d?.note ?? 'Date not announced'}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {targetExams.length > 0 && <ReadinessPanel exams={targetExams} />}

      <section className="grid grid-cols-2 gap-x-14 gap-y-12 lg:grid-cols-4">
        <Stat label="Streak" value={streak} hint="days in a row" />
        <Stat label="Study this week" value={`${studyHours}h`} hint="from Pomodoro sessions" />
        <Stat label="Tests this week" value={weekAttempts} hint="quizzes & past papers" />
        <Stat label="SSB sets this week" value={weekSSB} hint="WAT, SRT, TAT…" />
      </section>

      <section className="grid gap-x-20 gap-y-16 lg:grid-cols-2">
        <Card title="Today's tasks" action={<a href="#/planner" className="label text-[11px] text-ink-400 hover:text-fg">Planner →</a>}>
          <div className="mb-4 flex gap-2">
            <input className={inputCls} placeholder="Add a task and press Enter" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <Button variant="subtle" onClick={addTask}>Add</Button>
          </div>
          {tasks.length === 0 ? <Empty>No tasks for today yet.</Empty> : (
            <ul className="divide-y divide-fg/[0.06]">
              {tasks.map(t => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <input type="checkbox" className="size-4 accent-iris-500" checked={t.done}
                    onChange={e => db.tasks.update(t.id!, { done: e.target.checked, doneAt: e.target.checked ? Date.now() : undefined })} />
                  <span className={t.done ? 'text-ink-500 line-through' : 'text-ink-100'}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <DailyMission exams={targetExams} />

        <Card title="Syllabus coverage" action={<a href="#/study" className="label text-[11px] text-ink-400 hover:text-fg">Study path →</a>}>
          {targetExams.length === 0 ? <Empty>Choose target exams to track coverage.</Empty> : (
            <div className="space-y-6">
              {targetExams.map(e => {
                const total = e.syllabus.reduce((s, x) => s + x.topics.length, 0)
                const score = topics.filter(t => t.exam === e.id).reduce((s, t) => s + t.status, 0)
                const pct = Math.round((score / (total * 3)) * 100)
                return (
                  <div key={e.id}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-ink-100">{e.short}</span>
                      <span className="text-2xl font-normal tracking-display tabular-nums text-fg">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Recent tests" action={<a href="#/practice/analytics" className="label text-[11px] text-ink-400 hover:text-fg">Analytics →</a>}>
          {recent.length === 0 ? <Empty>No tests yet. Try a quick quiz or a past paper.</Empty> : (
            <ul className="divide-y divide-fg/[0.06]">
              {recent.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-ink-100">{a.title}</div>
                    <div className="text-xs font-light text-ink-500">{fmtDateTime(a.at)}</div>
                  </div>
                  <span className="shrink-0 tabular-nums text-fg">{a.score === undefined ? <Badge tone="saffron">needs key</Badge> : `${round2(a.score)} / ${a.maxScore}`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}

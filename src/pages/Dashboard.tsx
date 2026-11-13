import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, nextDate } from '../data/exams'
import { db, useSetting, activeDays, streakFrom } from '../lib/db'
import { addDays, daysUntil, fmtDate, fmtDateTime, todayISO, round2 } from '../lib/util'
import { Badge, Button, Card, Empty, Progress, Stat, TileLink, focusRing, inputCls } from '../components/ui'
import { Constellation } from '../components/Particles'
import { DailyMission } from '../components/DailyMission'
import { ReadinessPanel } from '../components/ReadinessPanel'
import { BackupReminder } from '../components/BackupReminder'
import { ServiceStripe } from '../components/Services'
import { levelFor } from '../lib/level'

// Today: the greeting and the day's one action, then countdowns, readiness, the week in numbers, and the day's work
// in tiles. Section headings sit on the canvas; everything you read or act on sits in a tile.

const tile = 'min-w-0 rounded-3xl bg-surface p-6 sm:p-8'
// Stat tiles sit two to a row on phones, so they take 16px padding there.
const statTile = 'min-w-0 rounded-3xl bg-surface p-4 sm:p-8'

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
  const active = useLiveQuery(() => activeDays(), [])
  const streak = active ? streakFrom(active) : 0
  const lvl = levelFor(active?.size ?? 0)
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
    <div className="space-y-12 sm:space-y-16">
      <BackupReminder />

      {/* The greeting and the day's one action; the animation sits in its own tile beside it. */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-12">
        <div className="min-w-0">
          <div className="title-4 text-accent-300">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1 className="mt-4 heading-2 hero-text sm:heading-1">Jai Hind.</h1>
          <p className="mt-6 max-w-[680px] title-2 text-ink-300">
            {nearest?.d?.date
              ? <><span className="text-fg">{daysUntil(nearest.d.date)} days</span> to {nearest.d.label}. </>
              : 'Pick your target exams to start the countdown. '}
            {tasks.length ? `${doneCount} of ${tasks.length} tasks done today.` : 'Plan the day, then work through the drill.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {countdowns.length === 0
              ? <a href="#/exams" tabIndex={-1}><Button>Choose your exams</Button></a>
              : <a href="#/revise" tabIndex={-1}><Button>Start today's revision</Button></a>}
            <a href="#/planner" className={`rounded-lg py-2 button-md text-ink-300 transition-colors duration-300 ease-soft hover:text-fg ${focusRing}`}>
              Open planner <span aria-hidden>→</span>
            </a>
          </div>
        </div>
        <div className="h-80 overflow-hidden rounded-3xl bg-surface pb-4 sm:h-96">
          <Constellation />
        </div>
      </section>

      {countdowns.length > 0 && (
        <section>
          <h2 className="heading-5 text-fg">Countdown</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
            {countdowns.map(({ key, title, d }) => {
              const days = d?.date ? daysUntil(d.date) : null
              return (
                <div key={key} className={tile}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="title-3 text-fg">{title}</span>
                    {d && <Badge tone={d.status === 'official' ? 'verdant' : 'saffron'}>{d.status}</Badge>}
                  </div>
                  <ServiceStripe exam={key} className="mt-3" />
                  <div className="mt-8 heading-1 tabular-nums text-fg">
                    {days ?? '—'}
                    {days !== null && <span className="ml-2 title-2 text-ink-400">days</span>}
                  </div>
                  <div className="mt-3 caption-2 text-ink-400">{d?.date ? `${d.label} · ${fmtDate(d.date)}` : d?.note ?? 'Date not announced'}</div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {targetExams.length > 0 && <ReadinessPanel exams={targetExams} />}

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="heading-5 text-fg">This week</h2>
          <TileLink href="#/progress">Progress report</TileLink>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className={statTile}><Stat label="Streak" value={streak} hint={`days in a row · level: ${lvl.current.name}`} /></div>
          <div className={statTile}><Stat label="Study this week" value={`${studyHours}h`} hint="from Pomodoro sessions" /></div>
          <div className={statTile}><Stat label="Tests this week" value={weekAttempts} hint="quizzes & past papers" /></div>
          <div className={statTile}><Stat label="SSB sets this week" value={weekSSB} hint="WAT, SRT, TAT…" /></div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today's tasks" action={<TileLink href="#/planner">Planner</TileLink>}>
          <div className="mb-4 flex gap-2">
            <input className={inputCls} enterKeyHint="done" placeholder="Add a task and press Enter" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
            <Button variant="subtle" onClick={addTask}>Add</Button>
          </div>
          {tasks.length === 0 ? <Empty>No tasks for today yet. Add one above, or open the planner.</Empty> : (
            <ul className="divide-y divide-line">
              {tasks.map(t => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-3 py-3">
                    <input type="checkbox" className="size-4 shrink-0 accent-accent-500 pointer-coarse:size-5" checked={t.done}
                      onChange={e => db.tasks.update(t.id!, { done: e.target.checked, doneAt: e.target.checked ? Date.now() : undefined })} />
                    <span className={`body-5 ${t.done ? 'text-ink-500 line-through' : 'text-ink-100'}`}>{t.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <DailyMission exams={targetExams} />

        <Card title="Syllabus coverage" action={<TileLink href="#/study">Study path</TileLink>}>
          {targetExams.length === 0 ? <Empty>Choose target exams to track coverage.</Empty> : (
            <div className="space-y-6">
              {targetExams.map(e => {
                const total = e.syllabus.reduce((s, x) => s + x.topics.length, 0)
                const score = topics.filter(t => t.exam === e.id).reduce((s, t) => s + t.status, 0)
                const pct = Math.round((score / (total * 3)) * 100)
                return (
                  <div key={e.id}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <span className="title-4 text-ink-100">{e.short}</span>
                      <span className="heading-6 tabular-nums text-fg">{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Recent tests" action={<TileLink href="#/practice/analytics">Analytics</TileLink>}>
          {recent.length === 0 ? <Empty>No tests yet. Try a quick quiz or a past paper.</Empty> : (
            <ul className="divide-y divide-line">
              {recent.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate body-5 text-ink-100">{a.title}</div>
                    <div className="caption-5 text-ink-500">{fmtDateTime(a.at)}</div>
                  </div>
                  <span className="shrink-0 title-4 tabular-nums text-fg">{a.score === undefined ? <Badge tone="saffron">needs key</Badge> : `${round2(a.score)} / ${a.maxScore}`}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

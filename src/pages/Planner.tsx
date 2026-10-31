import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS } from '../data/exams'
import { db } from '../lib/db'
import { useCountdown } from '../lib/hooks'
import { addDays, beep, fmtDate, todayISO } from '../lib/util'
import { Badge, Button, Card, Empty, PageHeader, TimerBar, inputBase, inputCls, labelCls } from '../components/ui'

export default function Planner() {
  const [date, setDate] = useState(todayISO())
  const tasks = useLiveQuery(() => db.tasks.where('date').equals(date).toArray(), [date]) ?? []
  const [title, setTitle] = useState('')
  const [mins, setMins] = useState('')
  const [exam, setExam] = useState('')

  const add = () => {
    if (!title.trim()) return
    db.tasks.add({ date, title: title.trim(), minutes: Number(mins) || undefined, exam: exam || undefined, done: false })
    setTitle('')
    setMins('')
  }

  const carryOver = async () => {
    const prev = await db.tasks.where('date').equals(addDays(date, -1)).filter(t => !t.done).toArray()
    await Promise.all(prev.map(t => db.tasks.update(t.id!, { date })))
  }

  const planned = tasks.reduce((s, t) => s + (t.minutes ?? 0), 0)
  const done = tasks.filter(t => t.done).length

  return (
    <div>
      <PageHeader title="Planner" subtitle="Plan the day, then focus in Pomodoro blocks. Focus time counts towards your weekly hours." />
      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[1fr_20rem]">
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="subtle" size="sm" onClick={() => setDate(addDays(date, -1))}>←</Button>
            <input type="date" className={`${inputBase} w-44 px-4 py-2.5 text-sm`} value={date} onChange={e => e.target.value && setDate(e.target.value)} />
            <Button variant="subtle" size="sm" onClick={() => setDate(addDays(date, 1))}>→</Button>
            {date !== todayISO() && <Button variant="ghost" size="sm" onClick={() => setDate(todayISO())}>Today</Button>}
            <span className="ml-auto text-sm text-ink-400">{done}/{tasks.length} done · {planned} min planned</span>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_6rem_8rem_auto] sm:items-end">
            <div><label className={labelCls}>Task</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="e.g. Trigonometry — 30 questions" /></div>
            <div><label className={labelCls}>Minutes</label><input className={inputCls} inputMode="numeric" value={mins} onChange={e => setMins(e.target.value.replace(/\D/g, ''))} placeholder="60" /></div>
            <div>
              <label className={labelCls}>Exam</label>
              <select className={inputCls} value={exam} onChange={e => setExam(e.target.value)}>
                <option value="">General</option>
                {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
              </select>
            </div>
            <Button variant="subtle" onClick={add}>Add</Button>
          </div>

          {tasks.length === 0 ? (
            <Empty>
              Nothing planned for {fmtDate(date)}.
              <div className="mt-2"><Button variant="subtle" size="sm" onClick={carryOver}>Carry over unfinished from previous day</Button></div>
            </Empty>
          ) : (
            <ul className="divide-y divide-fg/[0.06]">
              {tasks.map(t => (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <input type="checkbox" className="size-4 accent-iris-500" checked={t.done}
                    onChange={e => db.tasks.update(t.id!, { done: e.target.checked, doneAt: e.target.checked ? Date.now() : undefined })} />
                  <span className={`flex-1 ${t.done ? 'text-ink-500 line-through' : ''}`}>{t.title}</span>
                  {t.exam && <Badge tone="iris">{EXAMS.find(e => e.id === t.exam)?.short}</Badge>}
                  {t.minutes && <span className="text-xs tabular-nums text-ink-500">{t.minutes}m</span>}
                  <Button variant="danger" size="sm" onClick={() => db.tasks.delete(t.id!)}>✕</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-14">
          <Pomodoro />
          <WeekChart />
        </div>
      </div>
    </div>
  )
}

function Pomodoro() {
  const [focusMin, setFocusMin] = useState(25)
  const [breakMin, setBreakMin] = useState(5)
  const [phase, setPhase] = useState<'focus' | 'break'>('focus')
  const [label, setLabel] = useState('')
  const [paused, setPaused] = useState<number | null>(null)
  const [manual, setManual] = useState('')

  const timer = useCountdown(() => {
    beep()
    if (phase === 'focus') {
      db.sessions.add({ date: todayISO(), minutes: focusMin, label: label.trim() || 'Study', at: Date.now() })
      setPhase('break')
      timer.start(breakMin * 60)
    } else setPhase('focus')
  })

  const total = (phase === 'focus' ? focusMin : breakMin) * 60
  const remaining = timer.running ? timer.remaining : paused ?? total
  const idle = !timer.running && paused === null

  return (
    <Card title={phase === 'focus' ? 'Focus' : 'Break'}>
      <div className={`mb-5 text-center text-[78px] font-normal leading-none tracking-display tabular-nums ${phase === 'focus' ? 'text-ink-50' : 'text-verdant-300'}`}>
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
      </div>
      <TimerBar remaining={remaining} total={total} label=" " />
      {idle && phase === 'focus' && (
        <div className="mt-3 space-y-2">
          <input className={inputCls} placeholder="What are you studying?" value={label} onChange={e => setLabel(e.target.value)} />
          <div className="flex gap-1">
            {[25, 50, 90].map(m => (
              <button key={m} onClick={() => { setFocusMin(m); setBreakMin(m >= 50 ? 10 : 5) }}
                className={`flex-1 rounded-full py-1 text-xs ${focusMin === m ? 'bg-iris-900 text-iris-300' : 'bg-ink-800 text-ink-400'}`}>{m} min</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        {idle && <Button className="flex-1" onClick={() => timer.start(total)}>Start</Button>}
        {timer.running && <Button className="flex-1" variant="subtle" onClick={() => { setPaused(timer.remaining); timer.stop() }}>Pause</Button>}
        {paused !== null && <Button className="flex-1" onClick={() => { timer.start(paused); setPaused(null) }}>Resume</Button>}
        {!idle && <Button variant="ghost" onClick={() => { timer.stop(); setPaused(null); setPhase('focus') }}>Reset</Button>}
      </div>
      <div className="mt-10">
        <label className={labelCls}>Studied without the timer? Log minutes</label>
        <div className="flex gap-2">
          <input className={inputCls} inputMode="numeric" value={manual} onChange={e => setManual(e.target.value.replace(/\D/g, ''))} placeholder="45" />
          <Button variant="subtle" disabled={!manual} onClick={() => { db.sessions.add({ date: todayISO(), minutes: Number(manual), label: label.trim() || 'Study', at: Date.now() }); setManual('') }}>Log</Button>
        </div>
      </div>
    </Card>
  )
}

function WeekChart() {
  const today = todayISO()
  const start = addDays(today, -6)
  const sessions = useLiveQuery(() => db.sessions.where('date').aboveOrEqual(start).toArray(), [start]) ?? []
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const mins = days.map(d => sessions.filter(s => s.date === d).reduce((a, s) => a + s.minutes, 0))
  const max = Math.max(60, ...mins)
  const total = mins.reduce((a, b) => a + b, 0)

  return (
    <Card title="Last 7 days" action={<span className="text-xs tabular-nums text-ink-400">{(total / 60).toFixed(1)} h</span>}>
      <div className="flex h-32 items-end gap-2">
        {days.map((d, i) => (
          <div key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${mins[i]} min`}>
            <span className="text-[10px] tabular-nums text-ink-500">{mins[i] ? Math.round(mins[i] / 6) / 10 : ''}</span>
            <div className={`w-full rounded-t ${d === today ? 'bg-iris-400' : 'bg-iris-700'}`} style={{ height: `${(mins[i] / max) * 75}%`, minHeight: mins[i] ? 3 : 0 }} />
            <span className="text-[10px] text-ink-500">{new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

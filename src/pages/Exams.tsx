import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS } from '../data/exams'
import { db, updateSetting, useSetting } from '../lib/db'
import { daysUntil, fmtDate } from '../lib/util'
import { Badge, Button, Card, PageHeader, inputCls, labelCls } from '../components/ui'

export default function Exams() {
  const [targets] = useSetting<string[]>('targets', [])
  const [overrides] = useSetting<Record<string, string>>('examDates', {})
  const custom = useLiveQuery(() => db.customExams.toArray(), []) ?? []
  const [cName, setCName] = useState('')
  const [cDate, setCDate] = useState('')

  const toggle = (id: string) => updateSetting<string[]>('targets', [], t => (t.includes(id) ? t.filter(x => x !== id) : [...t, id]))
  const setOverride = (id: string, date: string) => updateSetting<Record<string, string>>('examDates', {}, o => {
    const next = { ...o }
    if (date) next[id] = date
    else delete next[id]
    return next
  })

  return (
    <div>
      <PageHeader title="Exams" subtitle={<>Mark your targets. <Badge tone="iris">official</Badge> dates are from the UPSC Annual Calendar 2027; <Badge tone="saffron">tentative</Badge> ones are estimates — confirm with each notification.</>} />

      <div className="space-y-14">
        {EXAMS.map(e => {
          const isTarget = targets.includes(e.id)
          return (
            <Card key={e.id} className={isTarget ? 'border-iris-700' : ''}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[42px] font-normal leading-none tracking-display text-fg">{e.short}</h2>
                    <Badge>{e.body}</Badge>
                    <Badge tone="verdant">{e.personality === 'ssb' ? 'SSB / board' : 'Interview'}</Badge>
                  </div>
                  <div className="text-sm text-ink-400">{e.name}</div>
                </div>
                <Button variant={isTarget ? 'primary' : 'subtle'} onClick={() => toggle(e.id)}>{isTarget ? '✓ Target' : 'Add as target'}</Button>
              </div>

              <div className="mt-8 grid gap-10 md:grid-cols-2">
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-ink-500">
                        <tr><th className="pb-1 font-medium">Paper</th><th className="pb-1 text-right font-medium">Qs</th><th className="pb-1 text-right font-medium">Marks</th><th className="pb-1 text-right font-medium">Time</th></tr>
                      </thead>
                      <tbody className="divide-y divide-fg/[0.06]">
                        {e.papers.map(p => (
                          <tr key={p.name}>
                            <td className="py-1.5 pr-2">{p.name}{p.note && <div className="text-xs text-ink-500">{p.note}</div>}</td>
                            <td className="py-1.5 text-right tabular-nums">{p.questions ?? '—'}</td>
                            <td className="py-1.5 text-right tabular-nums">{p.marks}</td>
                            <td className="py-1.5 text-right tabular-nums">{p.minutes} min</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-ink-400">Negative marking: {e.marking.label}</p>
                  <div className="mt-3 text-sm">
                    <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Selection</div>
                    <ol className="mt-1 list-inside list-decimal space-y-0.5 text-ink-300">{e.selection.map(s => <li key={s}>{s}</li>)}</ol>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div><span className="text-ink-500">Age: </span>{e.age}</div>
                  <div><span className="text-ink-500">Education: </span>{e.education}</div>
                  <div><span className="text-ink-500">Held: </span>{e.frequency}</div>
                  <div className="rounded-3xl bg-fg/[0.04] p-3">
                    {e.dates.map(d => (
                      <div key={d.label} className="flex flex-wrap items-center justify-between gap-2 py-0.5">
                        <span>{d.label}</span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums text-ink-300">{d.date ? `${fmtDate(d.date)} · ${daysUntil(d.date)}d` : 'TBA'}</span>
                          <Badge tone={d.status === 'official' ? 'iris' : 'saffron'}>{d.status}</Badge>
                        </span>
                        {d.note && <div className="w-full text-xs text-ink-500">{d.note}</div>}
                      </div>
                    ))}
                    <div className="mt-2 flex items-end gap-2">
                      <div className="flex-1">
                        <label className={labelCls}>My exam date (overrides countdown)</label>
                        <input type="date" className={inputCls} value={overrides[e.id] ?? ''} onChange={ev => setOverride(e.id, ev.target.value)} />
                      </div>
                      {overrides[e.id] && <Button variant="ghost" onClick={() => setOverride(e.id, '')}>Clear</Button>}
                    </div>
                  </div>
                  <a href={e.officialUrl} target="_blank" rel="noreferrer" className="inline-block text-saffron-400 hover:underline">Official site ↗</a>
                </div>
              </div>
            </Card>
          )
        })}

        <Card title="Other exams (State PCS, TA, etc.)">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1"><label className={labelCls}>Name</label><input className={inputCls} value={cName} onChange={e => setCName(e.target.value)} placeholder="e.g. UPPSC Prelims 2027" /></div>
            <div><label className={labelCls}>Date</label><input type="date" className={inputCls} value={cDate} onChange={e => setCDate(e.target.value)} /></div>
            <Button disabled={!cName.trim() || !cDate} onClick={() => { db.customExams.add({ name: cName.trim(), date: cDate }); setCName(''); setCDate('') }}>Add</Button>
          </div>
          {custom.length > 0 && (
            <ul className="mt-3 divide-y divide-fg/[0.06] text-sm">
              {custom.map(c => (
                <li key={c.id} className="flex items-center justify-between py-2">
                  <span>{c.name} <span className="text-ink-500">· {fmtDate(c.date)} · {daysUntil(c.date)}d</span></span>
                  <Button variant="danger" size="sm" onClick={() => db.customExams.delete(c.id!)}>Remove</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}

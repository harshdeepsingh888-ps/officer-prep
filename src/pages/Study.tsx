import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, nextDate, type ExamId } from '../data/exams'
import { guideById, guideRows, guideStatus, tracksFor, uncoveredTopics, type Guide } from '../data/study'
import { db, useSetting } from '../lib/db'
import { addDays, daysUntil, fmtDate, todayISO } from '../lib/util'
import { Badge, Card, Empty, PageHeader, Progress } from '../components/ui'
import TopicPage from './study/TopicPage'
import { STATUS } from './study/status'

const FINAL_DAYS = 21 // the last three weeks are for full papers and revision

export default function Study({ sub }: { sub?: string }) {
  const g = sub ? guideById(sub) : undefined
  if (g) return <TopicPage guide={g} />
  return <StudyPath />
}

function StudyPath() {
  const [targets] = useSetting<string[]>('targets', [])
  const [overrides] = useSetting<Record<string, string>>('examDates', {})
  const list = targets.length ? EXAMS.filter(e => targets.includes(e.id)) : EXAMS
  const [picked, setPicked] = useSetting<ExamId | null>('studyExam', null)
  const exam = list.find(e => e.id === picked) ?? list[0]
  const rowsArr = useLiveQuery(() => db.topics.toArray(), []) ?? []
  const rows = new Map(rowsArr.map(r => [r.id, r]))
  const tracks = tracksFor(exam.id)
  const statusOf = (gd: Guide) => guideStatus(gd, exam.id, rows)

  // Spread the remaining topics of each track evenly up to three weeks before the exam.
  const d = nextDate(exam, overrides)
  const daysLeft = d?.date ? daysUntil(d.date) : null
  const span = daysLeft === null ? 90 : Math.max(7, daysLeft - FINAL_DAYS)
  const targetFor = (track: Guide[], gd: Guide) => {
    const remaining = track.filter(x => statusOf(x) < 2)
    const i = remaining.indexOf(gd)
    return i < 0 ? null : addDays(todayISO(), Math.round(((i + 1) * span) / remaining.length))
  }

  const all = tracks.flatMap(t => t.guides)
  const done = all.reduce((s, x) => s + statusOf(x), 0)
  const pct = all.length ? Math.round((done / (all.length * 3)) * 100) : 0
  const extra = uncoveredTopics(exam.id, exam.syllabus)

  const cycle = (key: { id: string; subject: string; topic: string }, current: number) =>
    db.topics.put({ id: key.id, exam: exam.id, subject: key.subject, topic: key.topic, status: (current + 1) % 4, updatedAt: Date.now() })

  return (
    <div className="space-y-16">
      <PageHeader title="Study" eyebrow="Your path through the syllabus"
        subtitle="Every topic has what the exam asks, where to read it, short notes and practice questions. Work one topic from each track at a time, and mark it as you go." />

      <div className="flex flex-wrap items-center gap-2">
        {list.map(e => (
          <button key={e.id} onClick={() => setPicked(e.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${e.id === exam.id ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>{e.short}</button>
        ))}
        {!targets.length && <a href="#/exams" className="ml-2 text-sm text-saffron-400 hover:underline">Pick your target exams →</a>}
      </div>

      <section className="grid gap-x-14 gap-y-10 md:grid-cols-[1fr_2fr]">
        <div>
          <div className="label text-[11px] text-ink-500">{exam.short} syllabus covered</div>
          <div className="mt-2 text-[clamp(4rem,7vw,4.875rem)] font-normal leading-none tracking-display tabular-nums text-fg">{pct}<span className="ml-1 text-lead font-extralight tracking-normal text-ink-400">%</span></div>
          <Progress value={pct} className="mt-4" />
          <p className="mt-3 text-sm font-light text-ink-500">
            {daysLeft !== null ? <>{daysLeft} days to {d!.label}. Topics are spread to finish by {fmtDate(addDays(todayISO(), span))}; the last three weeks are for full past papers.</> : 'Set an exam date on the Exams page to get target dates.'}
          </p>
        </div>
        <div>
          <div className="label text-[11px] text-ink-500">Next up</div>
          <div className="mt-4 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {tracks.map(t => {
              const next = t.guides.find(x => statusOf(x) < 2)
              return (
                <a key={t.track} href={next ? `#/study/${next.id}` : undefined} className="group block">
                  <div className="text-xs text-ink-500">{t.track}</div>
                  {next ? (
                    <>
                      <div className="mt-1 text-[27px] font-normal leading-tight tracking-tight text-fg transition-colors group-hover:text-iris-300">{next.topic}</div>
                      <div className="mt-1 line-clamp-2 text-sm font-light text-ink-400">{next.summary}</div>
                    </>
                  ) : <div className="mt-1 text-[27px] font-normal tracking-tight text-verdant-300">All revised ✓</div>}
                </a>
              )
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-x-16 gap-y-16 lg:grid-cols-2">
        {tracks.map(t => (
          <Card key={t.track} title={`${t.track} · ${t.guides.length} topics`}>
            <div className="space-y-10">
              {t.sections.map(sec => {
                const sum = sec.guides.reduce((n, gd) => n + statusOf(gd), 0)
                const revised = sec.guides.filter(gd => statusOf(gd) >= 2).length
                return (
                  <section key={sec.name}>
                    <div className="mb-2 flex items-baseline justify-between gap-3">
                      <h3 className="text-[15px] text-fg">{sec.name}</h3>
                      <span className="shrink-0 text-xs tabular-nums text-ink-500">{revised} of {sec.guides.length} revised</span>
                    </div>
                    <Progress value={(sum / (sec.guides.length * 3)) * 100} className="mb-1" />
                    <ol className="divide-y divide-fg/[0.06]">
                      {sec.guides.map(gd => {
                        const s = statusOf(gd)
                        const target = targetFor(t.guides, gd)
                        return (
                          <li key={gd.id} className="flex items-center gap-3 py-3">
                            <span className="w-5 shrink-0 text-right text-xs tabular-nums text-ink-600">{t.guides.indexOf(gd) + 1}</span>
                            <a href={`#/study/${gd.id}`} className="min-w-0 flex-1">
                              <span className={`block truncate ${s >= 2 ? 'text-ink-400' : 'text-ink-100 hover:text-fg'}`}>{gd.topic}</span>
                              <span className="flex flex-wrap items-center gap-x-2 text-xs font-light text-ink-500">
                                {gd.notes.length ? <span>notes</span> : <span>reading list</span>}
                                {gd.questions.length > 0 && <span>· {gd.questions.length} questions</span>}
                                {target && <span>· by {fmtDate(target).replace(/ \d{4}$/, '')}</span>}
                              </span>
                            </a>
                            <button onClick={() => db.topics.bulkPut(guideRows(gd, (s + 1) % 4))} title="Change status"
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-xs ${STATUS[s].cls}`}>{STATUS[s].label}</button>
                          </li>
                        )
                      })}
                    </ol>
                  </section>
                )
              })}
            </div>
          </Card>
        ))}
      </div>

      {extra.length > 0 && (
        <Card title={`Other ${exam.short} topics · study material coming in later batches`}>
          <p className="mb-4 text-sm text-ink-400">These are still on the syllabus. Track them here; reading lists and notes for them will follow.</p>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {extra.map(x => {
              const id = `${exam.id}|${x.subject}|${x.topic}`
              const s = rows.get(id)?.status ?? 0
              return (
                <li key={id} className="flex items-center justify-between gap-3 border-b border-fg/[0.06] py-2.5 text-sm">
                  <span className="min-w-0 truncate text-ink-200">{x.topic} <span className="text-xs text-ink-500">· {x.subject}</span></span>
                  <button onClick={() => cycle({ id, ...x }, s)} className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-xs ${STATUS[s].cls}`}>{STATUS[s].label}</button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {tracks.length === 0 && <Empty>No study material for {exam.short} yet.</Empty>}
      <p className="text-xs font-light text-ink-500">
        <Badge>Final 3 weeks</Badge> <span className="ml-2">Switch to full official papers on the OMR sheet (Practice → Past papers) and daily revision of your mistake notebook.</span>
      </p>
    </div>
  )
}

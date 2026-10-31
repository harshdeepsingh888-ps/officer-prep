import { Fragment, type ReactNode } from 'react'
import { hasGenerators } from '../../data/generators'
import { useLiveQuery } from 'dexie-react-hooks'
import { examById, type ExamId } from '../../data/exams'
import { guideRows, guideStatus, type Guide, type NoteBlock } from '../../data/study'
import { db, useSetting } from '../../lib/db'
import { openQuiz } from '../../lib/learning'
import { Badge, Button, Card, Empty } from '../../components/ui'
import { STATUS } from './status'

/** Renders *emphasis* inside note text. */
function rich(text: string): ReactNode {
  return text.split(/(\*[^*]+\*)/).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2
      ? <strong key={i} className="font-medium text-fg">{part.slice(1, -1)}</strong>
      : <Fragment key={i}>{part}</Fragment>)
}

function Block({ b }: { b: NoteBlock }) {
  return (
    <div>
      <h3 className="mb-3 text-[21px] font-normal tracking-tight text-fg">{b.h}</h3>
      {b.kind === 'points' && (
        <ul className="space-y-2">
          {b.points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-200">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-iris-500" />
              <span>{rich(p)}</span>
            </li>
          ))}
        </ul>
      )}
      {b.kind === 'table' && (
        <dl className="divide-y divide-fg/[0.06]">
          {b.rows.map(([a, c], i) => (
            <div key={i} className="grid gap-1 py-2.5 text-[15px] sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-6">
              <dt className="text-ink-100">{a}</dt>
              <dd className="text-ink-300">{rich(c)}</dd>
            </div>
          ))}
        </dl>
      )}
      {b.kind === 'example' && (
        <div className="rounded-3xl bg-fg/[0.04] px-6 py-5 text-[15px]">
          <div className="text-ink-100">{b.q}</div>
          <div className="mt-2 text-verdant-300">→ {b.a}</div>
        </div>
      )}
    </div>
  )
}

export default function TopicPage({ guide: g }: { guide: Guide }) {
  const [targets] = useSetting<string[]>('targets', [])
  const [studyExam] = useSetting<ExamId | null>('studyExam', null)
  // The exam to practise under: the one you're studying for if this topic is in it, else one that tests it.
  const exam = ([studyExam, ...targets].find(t => t && g.exams.includes(t as ExamId)) ?? g.exams[0]) as ExamId
  const rowsArr = useLiveQuery(() => db.topics.toArray(), []) ?? []
  const status = guideStatus(g, exam, new Map(rowsArr.map(r => [r.id, r])))
  const mistakes = useLiveQuery(() => db.mistakes.filter(m => m.topic === g.topic && m.status === 'active').count(), [g.topic]) ?? 0

  return (
    <div className="space-y-14">
      <a href="#/study" className="label text-[11px] text-ink-400 hover:text-fg">← Study path</a>

      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
        <div>
          <div className="label text-saffron-400">{g.track} · {g.subject}</div>
          <h1 className="mt-4 text-[clamp(2.5rem,5.5vw,4.5rem)] font-normal leading-none tracking-display text-fg">{g.topic}</h1>
          <div className="mt-5 flex flex-wrap gap-1.5">{g.exams.map(e => <Badge key={e}>{examById(e)?.short}</Badge>)}</div>
        </div>
        <div>
          <p className="max-w-[520px] text-lead font-extralight leading-relaxed text-ink-300">{g.summary}</p>
          <div className="mt-5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Status">
            {STATUS.map((s, i) => (
              <button key={s.label} role="radio" aria-checked={status === i} onClick={() => db.topics.bulkPut(guideRows(g, i))}
                className={`rounded-full px-3 py-1 text-xs transition-colors ${status === i ? s.cls + ' ring-1 ring-fg/20' : 'bg-fg/[0.04] text-ink-500 hover:text-fg'}`}>{s.label}</button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-12">
          {g.notes.length ? g.notes.map((b, i) => <Block key={i} b={b} />) : (
            <Empty>Notes for this topic arrive in the next content batch. Start with the reading list: it tells you exactly what to read.</Empty>
          )}
          {g.traps.length > 0 && (
            <div>
              <h3 className="mb-3 text-[21px] font-normal tracking-tight text-fg">Common traps</h3>
              <ul className="space-y-2">
                {g.traps.map((t, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink-200">
                    <span className="mt-0.5 shrink-0 text-ember-400">!</span><span>{rich(t)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-12">
          <Card title="Practise">
            {g.questions.length > 0 ? (
              <>
                <p className="mb-4 text-sm text-ink-400">
                  {g.questions.length} questions on this topic, from easy to exam level{hasGenerators({ subject: g.subject, topic: g.topic }) ? ', plus endless freshly generated ones with new numbers every time' : ''}. Wrong answers go to your mistake notebook automatically.
                </p>
                <Button size="lg" onClick={() => openQuiz({ subject: g.subject, topic: g.topic, exam })}>Practise {g.topic}</Button>
              </>
            ) : (
              <>
                <p className="mb-4 text-sm text-ink-400">No fixed question set for this topic: it changes too often. Practise the whole subject, and quiz yourself from your <a href="#/news/notes" className="text-saffron-400 hover:underline">current-affairs notes</a>.</p>
                <Button variant="subtle" onClick={() => openQuiz({ subject: g.subject, exam })}>Practise {g.subject}</Button>
              </>
            )}
            {mistakes > 0 && <a href="#/revise/mistakes" className="mt-4 block text-sm text-saffron-400 hover:underline">{mistakes} active mistake{mistakes === 1 ? '' : 's'} on this topic →</a>}
          </Card>

          <Card title="Where to read">
            <ul className="space-y-5">
              {g.read.map(r => (
                <li key={r.title}>
                  <div className="flex items-start gap-2">
                    {r.url
                      ? <a href={r.url} target={r.url.startsWith('#') ? undefined : '_blank'} rel="noreferrer" className="text-ink-100 hover:text-saffron-400">{r.title}{r.url.startsWith('#') ? ' →' : ' ↗'}</a>
                      : <span className="text-ink-100">{r.title}</span>}
                    {r.free && <Badge tone="verdant">free</Badge>}
                  </div>
                  {r.detail && <div className="mt-0.5 text-sm font-light text-ink-500">{r.detail}</div>}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="How to study this topic">
            <ol className="list-inside list-decimal space-y-2 text-sm text-ink-300">
              <li>Read the notes here, then the reading list for depth.</li>
              <li>Mark the topic <span className="text-saffron-300">Learning</span>.</li>
              <li>Practise the questions; tag every mistake with a reason.</li>
              <li>Revise your mistakes over the next days (Revise tab); mark <span className="text-verdant-300">Revised</span>.</li>
              <li>After a past paper confirms it, mark <span className="text-iris-300">Mastered</span>.</li>
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  )
}

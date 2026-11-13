import { useLiveQuery } from 'dexie-react-hooks'
import type { Exam } from '../data/exams'
import { guideStatus, tracksFor } from '../data/study'
import { db } from '../lib/db'
import { topicStats, weakestTopics } from '../lib/insights'
import { openQuiz, reviewQueue } from '../lib/learning'
import { startOfDay } from '../lib/srs'
import { todayISO } from '../lib/util'
import { CheckIcon } from '@phosphor-icons/react'
import { Card, Progress, focusRing } from './ui'

const SSB_OF_THE_DAY = [
  { id: 'lecturette', test: 'Lecturette', name: 'Lecturette' }, // Sunday
  { id: 'wat', test: 'WAT', name: 'Word Association Test' },
  { id: 'srt', test: 'SRT', name: 'Situation Reaction Test' },
  { id: 'tat', test: 'TAT', name: 'Thematic Apperception Test' },
  { id: 'ppdt', test: 'PPDT', name: 'Picture Perception & Description' },
  { id: 'sd', test: 'SD', name: 'Self Description' },
  { id: 'wat', test: 'WAT', name: 'Word Association Test' },
]

type Item = { id: string; label: string; detail: string; done: boolean; href?: string; onClick?: () => void }

/** Today's plan, built from what is due, what is weak and what hasn't been started. */
export function DailyMission({ exams }: { exams: Exam[] }) {
  const d = useLiveQuery(async () => {
    const now = Date.now()
    const sod = startOfDay(now)
    const attempts = await db.attempts.where('at').above(now - 30 * 86_400_000).toArray()
    const newLimit = ((await db.settings.get('newPerDay'))?.value as number | undefined) ?? 20
    return {
      cards: await db.cards.count(),
      due: (await reviewQueue(newLimit, now)).length, // the size of today's session, not every card that is technically due
      reviewedToday: await db.reviews.where('at').aboveOrEqual(sod).count(),
      attempts,
      todays: attempts.filter(a => a.at >= sod),
      rows: await db.topics.toArray(),
      ssbToday: (await db.ssb.where('at').aboveOrEqual(sod).toArray()).map(r => r.test as string),
      writingToday: await db.writings.where('at').aboveOrEqual(sod).count(),
      tasks: await db.tasks.where('date').equals(todayISO()).toArray(),
    }
  }, [])
  if (!d) return null

  const items: Item[] = []

  // 1. Revision first — it is what makes the rest stick.
  if (d.cards === 0) {
    items.push({ id: 'deck', label: 'Add a flashcard deck', detail: 'Ranks, exercises, polity, vocabulary or formulas', done: false, href: '#/revise/cards' })
  } else {
    items.push({
      id: 'revise', label: "Clear today's revision", href: '#/revise',
      detail: d.due ? `${d.due} cards due` : `${d.reviewedToday} reviewed today`, done: d.due === 0 && d.reviewedToday > 0,
    })
  }

  // 2. The weakest topic of the last 30 days, or a mixed test if there's no data yet.
  const weak = weakestTopics(topicStats(d.attempts), 3, 1)[0]
  const quizzedToday = (topic?: string) => d.todays.some(a => a.kind === 'quiz' && (!topic || a.items?.some(i => i.topic === topic)))
  if (weak) {
    items.push({
      id: 'weak', label: `Practise ${weak.topic}`, detail: `${weak.subject} · ${Math.round(weak.acc * 100)}% accuracy so far`,
      done: quizzedToday(weak.topic), onClick: () => openQuiz({ subject: weak.subject, topic: weak.topic }),
    })
  } else {
    items.push({ id: 'test', label: 'Take a 20-question test', detail: 'Mixed subjects, timed', done: d.todays.length > 0, href: '#/practice' })
  }

  // 3. Today's study topic — the next one on the study path; tracks (Maths, English, GK…) take turns by day.
  const exam = exams[0]
  if (exam) {
    const rows = new Map(d.rows.map(r => [r.id, r]))
    const tracks = tracksFor(exam.id)
    const start = new Date().getDate()
    for (let i = 0; i < tracks.length; i++) {
      const t = tracks[(start + i) % tracks.length]
      const next = t.guides.find(g => guideStatus(g, exam.id, rows) < 2)
      if (!next) continue
      const touched = (rows.get(`study|${next.id}`)?.updatedAt ?? 0) >= startOfDay(Date.now())
      items.push({ id: 'study', label: `Study: ${next.topic}`, detail: `${exam.short} · ${t.track} · ${next.notes.length ? 'notes and practice' : 'reading list'}`, done: touched, href: `#/study/${next.id}` })
      break
    }
  }

  // 4. SSB test of the day — or an essay for interview-only exams.
  if (exams.some(e => e.personality === 'ssb')) {
    const t = SSB_OF_THE_DAY[new Date().getDay()]
    items.push({ id: 'ssb', label: `SSB: ${t.test}`, detail: t.name, done: d.ssbToday.includes(t.test), href: `#/ssb/${t.id}` })
  } else if (exams.length) {
    items.push({ id: 'essay', label: 'Write one essay or précis', detail: 'CAPF Paper II / CSE Mains practice', done: d.writingToday > 0, href: '#/writing' })
  }

  // 5. Whatever you planned yourself.
  if (d.tasks.length) {
    const done = d.tasks.filter(t => t.done).length
    items.push({ id: 'tasks', label: 'Finish your planned tasks', detail: `${done} of ${d.tasks.length} done`, done: done === d.tasks.length, href: '#/planner' })
  }

  const done = items.filter(i => i.done).length
  return (
    <Card title="Daily mission" action={<span className="caption-1 tabular-nums text-ink-400">{done}/{items.length} done</span>}>
      <Progress value={(done / items.length) * 100} className="mb-4" />
      <ul className="divide-y divide-line">
        {items.map(i => {
          const body = (
            <>
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${i.done ? 'bg-verdant-500 text-white' : 'ring-1 ring-fg/20'}`}>
                {i.done && <CheckIcon weight="bold" className="size-3" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block body-5 ${i.done ? 'text-ink-500 line-through' : 'text-ink-100 group-hover:text-fg'}`}>{i.label}</span>
                <span className="block truncate caption-5 text-ink-500">{i.detail}</span>
              </span>
              <span aria-hidden className="shrink-0 text-ink-500 transition-[color,transform] duration-300 ease-soft group-hover:translate-x-1 group-hover:text-accent-300">→</span>
            </>
          )
          return (
            <li key={i.id}>
              {i.onClick
                ? <button className={`group flex w-full items-center gap-3 rounded-lg py-3 text-left ${focusRing}`} onClick={i.onClick}>{body}</button>
                : <a href={i.href} className={`group flex items-center gap-3 rounded-lg py-3 ${focusRing}`}>{body}</a>}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

import type { Exam } from '../data/exams'
import type { Attempt, Card, Review, TopicProgress } from './db'
import { addDays, isoOf, todayISO } from './util'
import { startOfDay } from './srs'

// Numbers derived from your attempts, syllabus and revision history.

export type TopicStat = { subject: string; topic: string; n: number; right: number; ms: number; acc: number; avgSec: number }

/** Accuracy and pace per topic, from quiz attempts that recorded per-question detail. */
export function topicStats(attempts: Attempt[], since = 0): TopicStat[] {
  const map = new Map<string, TopicStat>()
  for (const a of attempts) {
    if (a.at < since) continue
    for (const i of a.items ?? []) {
      if (i.correct === null) continue
      const k = `${i.subject}|${i.topic}`
      const t = map.get(k) ?? { subject: i.subject, topic: i.topic, n: 0, right: 0, ms: 0, acc: 0, avgSec: 0 }
      t.n++
      if (i.correct) t.right++
      t.ms += i.ms
      map.set(k, t)
    }
  }
  return [...map.values()].map(t => ({ ...t, acc: t.right / t.n, avgSec: Math.round(t.ms / t.n / 1000) }))
}

export function subjectStats(topics: TopicStat[]) {
  const map = new Map<string, { subject: string; n: number; right: number }>()
  for (const t of topics) {
    const s = map.get(t.subject) ?? { subject: t.subject, n: 0, right: 0 }
    s.n += t.n
    s.right += t.right
    map.set(t.subject, s)
  }
  return [...map.values()].map(s => ({ ...s, acc: s.right / s.n })).sort((a, b) => a.acc - b.acc)
}

/** Lowest accuracy first; a topic needs a few answers before it counts. */
export const weakestTopics = (stats: TopicStat[], minAnswers = 3, k = 5) =>
  stats.filter(t => t.n >= minAnswers).sort((a, b) => a.acc - b.acc || b.n - a.n).slice(0, k)

export function coverage(exam: Exam, rows: TopicProgress[]) {
  const total = exam.syllabus.reduce((s, x) => s + x.topics.length, 0)
  const score = rows.filter(r => r.exam === exam.id).reduce((s, r) => s + r.status, 0)
  return total ? score / (total * 3) : 0
}

export type Readiness = { score: number; parts: { label: string; value: number; weight: number; hint: string }[]; hasTests: boolean }

/**
 * An indicative readiness score — a nudge to keep every part of preparation moving.
 * It is not a prediction of selection or of an exam score.
 */
export function readiness(exam: Exam, d: { rows: TopicProgress[]; attempts: Attempt[]; days: Set<string>; cards: Card[]; reviews: Review[] }): Readiness {
  const now = Date.now()
  const month = now - 30 * 86_400_000
  const recent = d.attempts.filter(a => a.exam === exam.id && a.at >= month && a.correct !== undefined)
  const right = recent.reduce((s, a) => s + (a.correct ?? 0), 0)
  const answered = recent.reduce((s, a) => s + (a.correct ?? 0) + (a.wrong ?? 0), 0)
  const accuracy = answered ? right / answered : 0

  let active = 0
  for (let i = 0; i < 14; i++) if (d.days.has(addDays(todayISO(), -i))) active++
  const consistency = active / 14

  const live = d.cards.filter(c => c.status === 'active')
  const overdue = live.filter(c => c.due < startOfDay(now)).length
  const reviewedWeek = d.reviews.some(r => r.at >= now - 7 * 86_400_000)
  const revision = live.length ? (1 - overdue / live.length) * (reviewedWeek ? 1 : 0.5) : 0

  const cov = coverage(exam, d.rows)
  const parts = [
    { label: 'Syllabus covered', value: cov, weight: 0.35, hint: 'topics revised or mastered' },
    { label: 'Test accuracy', value: accuracy, weight: 0.35, hint: answered ? `last 30 days · ${answered} answers` : 'no tests in the last 30 days' },
    { label: 'Consistency', value: consistency, weight: 0.15, hint: `${active} of the last 14 days` },
    { label: 'Revision', value: revision, weight: 0.15, hint: live.length ? `${overdue} overdue of ${live.length} cards` : 'no revision cards yet' },
  ]
  return { score: Math.round(100 * parts.reduce((s, p) => s + p.value * p.weight, 0)), parts, hasTests: answered > 0 }
}

/** Reviews per day for the last `days` days (oldest first). */
export function reviewsPerDay(reviews: Review[], days = 14) {
  const counts = new Map<string, number>()
  for (const r of reviews) { const k = isoOf(new Date(r.at)); counts.set(k, (counts.get(k) ?? 0) + 1) }
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(todayISO(), i - days + 1)
    return { day, n: counts.get(day) ?? 0 }
  })
}

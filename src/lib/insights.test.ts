import { afterEach, describe, expect, it, vi } from 'vitest'
import { examById } from '../data/exams'
import type { Attempt, AttemptItem, Card, Review, TopicProgress } from './db'
import { coverage, periodStats, readiness, reviewsPerDay, subjectCoverage, subjectStats, topicStats, weakestTopics } from './insights'
import { addDays, todayISO } from './util'

afterEach(() => { vi.useRealTimers() })

const item = (topic: string, correct: boolean | null, ms = 30_000, subject = 'General Knowledge'): AttemptItem =>
  ({ qid: Math.random().toString(), subject, topic, answer: 0, correct, ms })
const attempt = (items: AttemptItem[], at = Date.now(), over: Partial<Attempt> = {}): Attempt =>
  ({ kind: 'quiz', exam: 'cds', title: 't', at, durationSec: 60, total: items.length, responses: [], items, ...over })

describe('topic and subject stats', () => {
  const attempts = [
    attempt([item('Polity', true), item('Polity', false), item('Polity', true), item('Polity', null)]),
    attempt([item('Defence', false, 60_000), item('Defence', false), item('Defence', true)]),
    attempt([item('Algebra', true, 10_000, 'Mathematics')]),
  ]
  const stats = topicStats(attempts)

  it('counts answered questions only and averages pace', () => {
    const polity = stats.find(s => s.topic === 'Polity')!
    expect(polity).toMatchObject({ n: 3, right: 2, avgSec: 30 })
    expect(polity.acc).toBeCloseTo(2 / 3)
    expect(stats.find(s => s.topic === 'Defence')!.avgSec).toBe(40)
  })

  it('ignores attempts before `since`', () => {
    expect(topicStats([attempt([item('Old', true)], 1000)], 5000)).toEqual([])
  })

  it('weakest topics need enough answers and come lowest-accuracy first', () => {
    expect(weakestTopics(stats, 3).map(t => t.topic)).toEqual(['Defence', 'Polity'])
  })

  it('subject stats add their topics up, weakest first', () => {
    const subjects = subjectStats(stats)
    expect(subjects[0]).toMatchObject({ subject: 'General Knowledge', n: 6, right: 3 })
    expect(subjects[1]).toMatchObject({ subject: 'Mathematics', acc: 1 })
  })
})

describe('syllabus coverage', () => {
  const cds = examById('cds')!
  const row = (subject: string, topic: string, status: number): TopicProgress =>
    ({ id: `cds|${subject}|${topic}`, exam: 'cds', subject, topic, status, updatedAt: 0 })

  it('is 0 with nothing done and 1 with everything mastered', () => {
    expect(coverage(cds, [])).toBe(0)
    const all = cds.syllabus.flatMap(s => s.topics.map(t => row(s.subject, t, 3)))
    expect(coverage(cds, all)).toBe(1)
    expect(subjectCoverage(cds, all).every(s => s.pct === 1 && s.done === s.total)).toBe(true)
  })

  it('counts revised and mastered topics as done, per subject', () => {
    const s = cds.syllabus[0]
    const rows = [row(s.subject, s.topics[0], 2), row(s.subject, s.topics[1], 1), { ...row(s.subject, s.topics[2], 3), exam: 'afcat' as const }]
    const first = subjectCoverage(cds, rows)[0]
    expect(first.done).toBe(1)
    expect(first.pct).toBeCloseTo(3 / (s.topics.length * 3))
  })
})

describe('periodStats', () => {
  it('counts what happened in the window and nothing outside it', () => {
    const from = new Date('2026-11-02T00:00:00+05:30').getTime(), to = from + 7 * 86_400_000
    const inside = from + 1000, outside = from - 1000
    const s = periodStats(from, to, {
      attempts: [attempt([], inside, { correct: 8, wrong: 2 }), attempt([], outside, { correct: 5, wrong: 0 })],
      sessions: [{ date: '2026-11-02', minutes: 30, label: '', at: inside }, { date: '2026-11-01', minutes: 99, label: '', at: outside }],
      reviews: [{ cardId: 'a', at: inside, grade: 2, interval: 1, wasNew: true }],
      rows: [{ id: 'a', exam: 'cds', subject: '', topic: '', status: 1, updatedAt: inside }, { id: 'b', exam: 'cds', subject: '', topic: '', status: 1, updatedAt: inside }],
      tasks: [{ date: '2026-11-02', title: 't', done: true, doneAt: inside }, { date: '2026-11-02', title: 'u', done: false }],
      ssb: [{ test: 'WAT', at: inside, items: [], olqs: [] }],
      writings: [{ kind: 'Essay', topic: '', text: '', words: 0, minutes: 0, at: outside }],
    })
    expect(s).toEqual({ studyMin: 30, tests: 1, answered: 10, right: 8, reviews: 1, topics: 1, tasks: 1, ssb: 1, writing: 0 })
  })
})

describe('readiness', () => {
  it('is a 0–100 score whose weights add up to 1', () => {
    const cds = examById('cds')!
    const empty = readiness(cds, { rows: [], attempts: [], days: new Set(), cards: [], reviews: [] })
    expect(empty.score).toBe(0)
    expect(empty.hasTests).toBe(false)
    expect(empty.parts.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1)

    const days = new Set(Array.from({ length: 14 }, (_, i) => addDays(todayISO(), -i)))
    const card: Card = { id: 'c', kind: 'flash', deck: 'd', front: '', back: '', due: Date.now() + 86_400_000, interval: 3, ease: 2.5, reps: 2, lapses: 0, createdAt: 0, status: 'active' }
    const review: Review = { cardId: 'c', at: Date.now(), grade: 2, interval: 3, wasNew: false }
    const rows = cds.syllabus.flatMap(s => s.topics.map(t => ({ id: `cds|${s.subject}|${t}`, exam: 'cds' as const, subject: s.subject, topic: t, status: 3, updatedAt: 0 })))
    const full = readiness(cds, { rows, attempts: [attempt([], Date.now(), { correct: 10, wrong: 0 })], days, cards: [card], reviews: [review] })
    expect(full.score).toBe(100)
    expect(full.hasTests).toBe(true)
  })
})

describe('reviewsPerDay', () => {
  it('gives one bar per day, oldest first, today last', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-10T12:00:00+05:30'))
    const at = (iso: string) => new Date(`${iso}T09:00:00+05:30`).getTime()
    const r = (iso: string): Review => ({ cardId: 'a', at: at(iso), grade: 2, interval: 1, wasNew: false })
    const out = reviewsPerDay([r('2026-11-10'), r('2026-11-10'), r('2026-11-04'), r('2026-10-01')], 7)
    expect(out.map(d => d.day)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'])
    expect(out.map(d => d.n)).toEqual([1, 0, 0, 0, 0, 0, 2])
  })
})

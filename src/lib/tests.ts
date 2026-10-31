import { examById, type ExamId } from '../data/exams'
import { mockById, type MockPaper } from '../data/patterns'
import { difficultyOf, type Question } from '../data/questions'
import { shuffle } from '../data/ssb'
import type { Attempt, TopicProgress } from './db'
import { topicStats, weakestTopics } from './insights'
import { fmtDate, weekStart } from './util'

// The kinds of test on Practice → Tests, and how each one picks its questions, time and marking.

export type TestMode = 'quick' | 'topic' | 'sectional' | 'mock' | 'weekly'
export const MODE_LABEL: Record<TestMode, string> = { quick: 'Quick 10', topic: 'Topic test', sectional: 'Sectional', mock: 'Mock', weekly: 'Weekly quiz' }

export type TopicSpec = {
  mode: 'topic'; exam: ExamId; source: 'all' | 'mine' | 'mistakes'; subject: string; topic: string; difficulty: number; count: number; timed: boolean
}
/** What a test was built from, so "New set" can build another one like it. */
export type TestSpec =
  | TopicSpec
  | { mode: 'quick'; exam: ExamId }
  | { mode: 'sectional'; exam: ExamId; mock: string; section: number }
  | { mode: 'mock'; exam: ExamId; mock: string }
  | { mode: 'weekly'; exam: ExamId }

/** An in-progress test — saved after every change so a reload or closed tab can resume it. */
export type Run = {
  examId: ExamId
  title: string
  qs: Question[]
  answers: (number | null)[]
  marked: boolean[]
  ms: number[]
  changes: number[]
  idx: number
  startedAt: number
  deadline: number | null
  seconds?: number | null // total time allowed (older saved runs: 1 min per question)
  mode?: TestMode
  marks?: { correct: number; wrong: number } // per question; default is the exam's marking
  spec?: TestSpec
  week?: string // weekly quiz: Monday of its week
  note?: string // shown on the result, e.g. "short mock"
}

export function newRun(examId: ExamId, title: string, qs: Question[], seconds: number | null, extra: Partial<Run> = {}): Run {
  const now = Date.now()
  return {
    examId, title, qs, answers: qs.map(() => null), marked: qs.map(() => false), ms: qs.map(() => 0), changes: qs.map(() => 0),
    idx: 0, startedAt: now, deadline: seconds ? now + seconds * 1000 : null, seconds, ...extra,
  }
}

/** Time, size and per-question marks of a paper, from the exam catalogue. */
export function paperTerms(m: MockPaper) {
  const exam = examById(m.exam)!
  const paper = exam.papers.find(p => p.name === m.paper)!
  const questions = m.sections.reduce((s, x) => s + x.questions, 0)
  const per = paper.marks / questions
  return {
    exam, paper, questions, minutes: paper.minutes, secPerQ: (paper.minutes * 60) / questions,
    marks: { correct: per, wrong: per * (exam.marking.wrong / exam.marking.correct) },
  }
}

/** Questions of a subject, the ones tagged for this exam first, then the rest of the subject. */
function draw(bank: Question[], exam: ExamId, subject: Question['subject'], n: number) {
  const fit = bank.filter(q => q.subject === subject)
  return [...shuffle(fit.filter(q => q.exams.includes(exam))), ...shuffle(fit.filter(q => !q.exams.includes(exam)))].slice(0, n)
}
export const available = (bank: Question[], subject: Question['subject']) => bank.filter(q => q.subject === subject).length

/** Where questions come from: the whole bank (built-in + yours), only yours, or your active mistakes. */
export type Pools = { bank: Question[]; mine: Question[]; mistakes: Question[] }

export function topicPool(s: TopicSpec, pools: Pools) {
  const from = s.source === 'mistakes' ? pools.mistakes : s.source === 'mine' ? pools.mine : pools.bank
  return from.filter(q => (s.source === 'mistakes' || q.exams.includes(s.exam)) && (s.subject === 'All' || q.subject === s.subject)
    && (!s.topic || q.topic === s.topic) && (!s.difficulty || difficultyOf(q) === s.difficulty))
}

export function buildTopic(s: TopicSpec, pools: Pools): Run {
  const qs = shuffle(topicPool(s, pools)).slice(0, s.count)
  const label = s.topic || (s.subject === 'All' ? 'Mixed' : s.subject)
  return newRun(s.exam, `Topic test · ${examById(s.exam)!.short} · ${label}${s.source === 'mistakes' ? ' · my mistakes' : ''}`, qs,
    s.timed ? qs.length * 60 : null, { mode: 'topic', spec: s })
}

export function buildQuick(exam: ExamId, bank: Question[]): Run {
  const qs = shuffle(bank.filter(q => q.exams.includes(exam))).slice(0, 10)
  return newRun(exam, `Quick 10 · ${examById(exam)!.short}`, qs, qs.length * 60, { mode: 'quick', spec: { mode: 'quick', exam } })
}

export function buildMock(mockId: string, bank: Question[]): Run {
  const m = mockById(mockId)!
  const t = paperTerms(m)
  const qs = m.sections.flatMap(s => draw(bank, m.exam, s.subject, s.questions))
  const short = qs.length < t.questions
  return newRun(m.exam, `Mock · ${t.exam.short}${m.paper === t.exam.short ? '' : ` · ${m.paper}`}`, qs, Math.round(qs.length * t.secPerQ), {
    mode: 'mock', marks: t.marks, spec: { mode: 'mock', exam: m.exam, mock: m.id },
    note: short ? `Short mock: the bank has ${qs.length} of the ${t.questions} questions this paper needs, so the time was cut to keep the exam's pace. Add questions under My questions to make it full length.` : undefined,
  })
}

export const SECTIONAL_MAX = 30

export function buildSectional(mockId: string, section: number, bank: Question[]): Run {
  const m = mockById(mockId)!
  const t = paperTerms(m)
  const s = m.sections[section]
  const qs = draw(bank, m.exam, s.subject, Math.min(s.questions, SECTIONAL_MAX))
  return newRun(m.exam, `Sectional · ${t.exam.short} · ${s.name}`, qs, Math.round(qs.length * t.secPerQ), {
    mode: 'sectional', marks: t.marks, spec: { mode: 'sectional', exam: m.exam, mock: m.id, section },
  })
}

export const WEEKLY_SIZE = 20

/**
 * This week's quiz: questions from topics you studied or were tested on in the last 7 days, a few of
 * your active mistakes, then your weakest topics, then anything for the exam to fill it up.
 */
export function buildWeekly(exam: ExamId, bank: Question[], ctx: { attempts: Attempt[]; rows: TopicProgress[]; mistakes: Question[] }): Run {
  const since = Date.now() - 7 * 86_400_000
  const touched = new Set<string>()
  for (const a of ctx.attempts) if (a.at >= since) for (const i of a.items ?? []) touched.add(i.topic.toLowerCase())
  for (const r of ctx.rows) if (r.updatedAt >= since && r.status > 0) touched.add(r.topic.toLowerCase())
  const weak = new Set(weakestTopics(topicStats(ctx.attempts), 3, 5).map(t => t.topic))

  const picked = new Set<string>()
  const take = (qs: Question[], n: number) => {
    const out: Question[] = []
    for (const q of shuffle(qs)) {
      if (out.length >= n) break
      if (!picked.has(q.id)) { picked.add(q.id); out.push(q) }
    }
    return out
  }
  const forExam = bank.filter(q => q.exams.includes(exam))
  const mistakes = take(ctx.mistakes, 6)
  const studied = take(forExam.filter(q => touched.has(q.topic.toLowerCase())), WEEKLY_SIZE - picked.size)
  const weakQs = take(forExam.filter(q => weak.has(q.topic)), WEEKLY_SIZE - picked.size)
  const rest = take(forExam, WEEKLY_SIZE - picked.size)
  const qs = shuffle([...mistakes, ...studied, ...weakQs, ...rest])

  const week = weekStart()
  const parts = [
    studied.length && `${studied.length} from topics you worked on this week`,
    mistakes.length && `${mistakes.length} from your mistake notebook`,
    weakQs.length && `${weakQs.length} from your weakest topics`,
    rest.length && `${rest.length} mixed`,
  ].filter(Boolean)
  return newRun(exam, `Weekly quiz · ${examById(exam)!.short} · week of ${fmtDate(week).replace(/ \d{4}$/, '')}`, qs, qs.length * 60, {
    mode: 'weekly', week, spec: { mode: 'weekly', exam }, note: parts.length ? `This quiz: ${parts.join(', ')}.` : undefined,
  })
}

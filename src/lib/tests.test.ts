import { describe, expect, it } from 'vitest'
import { EXAMS } from '../data/exams'
import { MOCKS } from '../data/patterns'
import { BUILTIN_QUESTIONS, difficultyOf, type Question } from '../data/questions'
import type { Attempt } from './db'
import { SECTIONAL_MAX, WEEKLY_SIZE, available, buildMock, buildQuick, buildSectional, buildTopic, buildWeekly, newRun, paperTerms, topicPool, type Pools, type TopicSpec } from './tests'
import { weekStart } from './util'

const bank = BUILTIN_QUESTIONS
const pools: Pools = { bank, mine: [], mistakes: [] }
const ids = (qs: Question[]) => qs.map(q => q.id)
const unique = (qs: Question[]) => new Set(ids(qs)).size === qs.length
const topic = (over: Partial<TopicSpec>): TopicSpec =>
  ({ mode: 'topic', exam: 'cds', source: 'all', subject: 'All', topic: '', difficulty: 0, count: 20, timed: true, ...over })

describe('newRun', () => {
  it('starts blank with a deadline when timed', () => {
    const r = newRun('cds', 'T', bank.slice(0, 3), 180)
    expect(r).toMatchObject({ answers: [null, null, null], marked: [false, false, false], ms: [0, 0, 0], changes: [0, 0, 0], idx: 0, seconds: 180 })
    expect(r.deadline! - r.startedAt).toBe(180_000)
    expect(newRun('cds', 'T', [], null).deadline).toBeNull()
  })
})

describe.each(MOCKS.map(m => [m.id, m] as const))('mock %s', (_, m) => {
  const t = paperTerms(m)

  it('is full length, in the paper\'s sections, with no repeats', () => {
    const run = buildMock(m.id, bank)
    expect(run.qs).toHaveLength(t.questions)
    expect(run.note).toBeUndefined()
    expect(unique(run.qs)).toBe(true)
    for (const s of m.sections) {
      const need = m.sections.filter(x => x.subject === s.subject).reduce((n, x) => n + x.questions, 0)
      expect(run.qs.filter(q => q.subject === s.subject)).toHaveLength(need)
    }
  })

  it('uses the exam\'s time and marking', () => {
    const run = buildMock(m.id, bank)
    expect(run.seconds).toBe(t.minutes * 60)
    expect(run.marks!.correct * t.questions).toBeCloseTo(t.paper.marks, 6)
    expect(run.marks!.wrong / run.marks!.correct).toBeCloseTo(t.exam.marking.wrong / t.exam.marking.correct, 6)
    expect(run.spec).toEqual({ mode: 'mock', exam: m.exam, mock: m.id })
  })

  it('sectionals are capped and keep the paper\'s pace', () => {
    m.sections.forEach((s, i) => {
      const run = buildSectional(m.id, i, bank)
      expect(run.qs).toHaveLength(Math.min(s.questions, SECTIONAL_MAX))
      expect(run.qs.every(q => q.subject === s.subject)).toBe(true)
      expect(run.seconds).toBe(Math.round(run.qs.length * t.secPerQ))
    })
  })

  it('short mock when the bank is thin: time cut to keep the pace, and a note says so', () => {
    const thin = bank.filter(q => q.subject === 'English' || q.subject === 'General Knowledge').slice(0, 10)
    const run = buildMock(m.id, thin)
    if (run.qs.length < t.questions) {
      expect(run.note).toMatch(/Short mock/)
      expect(run.seconds).toBe(Math.round(run.qs.length * t.secPerQ))
    }
  })
})

describe('Quick 10', () => {
  it.each(EXAMS.map(e => e.id))('%s: ten unique questions for the exam', exam => {
    const run = buildQuick(exam, bank)
    expect(run.qs).toHaveLength(10)
    expect(unique(run.qs)).toBe(true)
    expect(run.qs.every(q => q.exams.includes(exam))).toBe(true)
    expect(run.seconds).toBe(600)
  })
})

describe('topic tests', () => {
  it('filters the bank by exam, subject, topic and difficulty', () => {
    const spec = topic({ subject: 'General Knowledge', difficulty: 1 })
    const pool = topicPool(spec, pools)
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every(q => q.exams.includes('cds') && q.subject === 'General Knowledge' && difficultyOf(q) === 1)).toBe(true)
  })

  it('GK has no generators: questions come from the bank only, never more than asked', () => {
    const run = buildTopic(topic({ subject: 'General Knowledge', count: 15 }), pools)
    expect(run.qs).toHaveLength(15)
    expect(run.qs.every(q => q.source !== 'Generated')).toBe(true)
  })

  it('Maths from the whole bank: at least half freshly generated', () => {
    const run = buildTopic(topic({ subject: 'Mathematics', count: 20 }), pools)
    expect(run.qs).toHaveLength(20)
    expect(run.qs.filter(q => q.source === 'Generated').length).toBeGreaterThanOrEqual(10)
    expect(unique(run.qs)).toBe(true)
  })

  it('"Generated only" is all generated; "My questions" and "My mistakes" use only those pools', () => {
    expect(buildTopic(topic({ subject: 'Reasoning', exam: 'afcat', source: 'generated', count: 12 }), pools).qs.every(q => q.source === 'Generated')).toBe(true)
    const mine = bank.slice(0, 5).map((q, i) => ({ ...q, id: `u${i}` }))
    expect(ids(buildTopic(topic({ source: 'mine', count: 20 }), { ...pools, mine }).qs).sort()).toEqual(ids(mine.filter(q => q.exams.includes('cds'))).sort())
    // Mistakes are kept whatever exam they came from.
    const mistakes = [{ ...bank[0], exams: ['afcat' as const] }]
    expect(ids(buildTopic(topic({ source: 'mistakes' }), { ...pools, mistakes }).qs)).toEqual([bank[0].id])
  })

  it('untimed tests have no deadline; timed ones a minute per question', () => {
    expect(buildTopic(topic({ subject: 'English', timed: false, count: 5 }), pools).deadline).toBeNull()
    expect(buildTopic(topic({ subject: 'English', count: 5 }), pools).seconds).toBe(300)
  })

  it('available() is unlimited where questions are generated', () => {
    expect(available(bank, 'Mathematics')).toBe(Infinity)
    expect(available(bank, 'English')).toBe(bank.filter(q => q.subject === 'English').length)
  })
})

describe('weekly quiz', () => {
  it('has 20 unique questions, starting with your mistakes', () => {
    // Copies with their own ids, so the general top-up can't also draw one of them (it may in the app, harmlessly).
    const mistakes = bank.filter(q => q.subject === 'English').slice(0, 8).map(q => ({ ...q, id: `m-${q.id}` }))
    const run = buildWeekly('cds', bank, { attempts: [], rows: [], mistakes })
    expect(run.qs).toHaveLength(WEEKLY_SIZE)
    expect(unique(run.qs)).toBe(true)
    expect(run.qs.filter(q => mistakes.includes(q))).toHaveLength(6)
    expect(run.week).toBe(weekStart())
    expect(run.note).toMatch(/6 from your mistake notebook/)
  })

  it('draws on topics answered this week', () => {
    const gk = bank.filter(q => q.subject === 'General Knowledge' && q.exams.includes('cds'))
    const topicName = gk[0].topic
    const attempt: Attempt = {
      kind: 'quiz', exam: 'cds', title: 't', at: Date.now() - 3_600_000, durationSec: 60, total: 1, responses: [0],
      items: [{ qid: gk[0].id, subject: 'General Knowledge', topic: topicName, answer: 0, correct: true, ms: 1000 }],
    }
    const run = buildWeekly('cds', bank, { attempts: [attempt], rows: [], mistakes: [] })
    const inTopic = Math.min(WEEKLY_SIZE, gk.filter(q => q.topic === topicName).length)
    expect(run.qs.filter(q => q.topic === topicName).length).toBeGreaterThanOrEqual(inTopic)
  })
})

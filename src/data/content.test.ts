import { describe, expect, it } from 'vitest'
import { STARTER_DECKS } from './decks'
import { EXAMS, examById, nextDate, subjectForPaper, type ExamId } from './exams'
import { generatedTopics } from './generators'
import { MOCKS } from './patterns'
import { BUILTIN_QUESTIONS, type Question } from './questions'
import { DESCRIPTIVE_PAPERS, OFFICIAL_LINKS, OFFICIAL_PAPERS } from './sources'
import { ESSAY_TOPICS, EMPTY_PROFILE, GD_TOPICS, LECTURETTE_TOPICS, OLQS, SRT_SITUATIONS, TAT_SCENES, WAT_WORDS, interviewQuestions } from './ssb'
import { GUIDES, SECTIONS, guideRows, guideStatus, tracksFor, uncoveredTopics } from './study'

// Integrity of everything built in: a broken question or a guide that points nowhere fails here, not in a test.

const EXAM_IDS = EXAMS.map(e => e.id)
const SUBJECTS: Question['subject'][] = ['English', 'General Knowledge', 'Mathematics', 'Reasoning']
const dupes = <T,>(xs: T[]) => xs.filter((x, i) => xs.indexOf(x) !== i)
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

describe('built-in question bank', () => {
  it('has unique ids', () => {
    expect(dupes(BUILTIN_QUESTIONS.map(q => q.id))).toEqual([])
  })

  it.each(BUILTIN_QUESTIONS.map(q => [q.id, q] as const))('%s is well formed', (_, q) => {
    expect(q.text.trim()).not.toBe('')
    expect(q.options.length).toBeGreaterThanOrEqual(2)
    expect(q.options.length).toBeLessThanOrEqual(5)
    expect(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length).toBe(true)
    expect(q.options.every(o => o.trim() !== '')).toBe(true)
    expect(dupes(q.options.map(norm))).toEqual([])
    expect(SUBJECTS).toContain(q.subject)
    expect(q.topic.trim()).not.toBe('')
    expect(q.exams.length).toBeGreaterThan(0)
    expect(q.exams.every(e => EXAM_IDS.includes(e))).toBe(true)
    expect([undefined, 1, 2, 3]).toContain(q.difficulty)
    for (const s of [q.text, ...q.options, q.explanation ?? '', q.passage ?? '']) expect(s).not.toMatch(/\bundefined\b|\bNaN\b|\[object /)
  })

  it('covers every subject for every exam that tests it', () => {
    for (const s of SUBJECTS) expect(BUILTIN_QUESTIONS.filter(q => q.subject === s).length).toBeGreaterThan(20)
  })
})

describe('exam catalogue', () => {
  it.each(EXAMS.map(e => [e.id, e] as const))('%s has sane papers, dates and syllabus', (_, e) => {
    expect(e.papers.length).toBeGreaterThan(0)
    for (const p of e.papers) {
      expect(p.marks).toBeGreaterThan(0)
      expect(p.minutes).toBeGreaterThan(0)
      if (p.questions !== undefined) expect(p.questions).toBeGreaterThan(0)
    }
    expect(e.marking.correct).toBeGreaterThan(0)
    expect(e.marking.wrong).toBeGreaterThanOrEqual(0)
    for (const d of e.dates) if (d.date) expect(d.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(e.syllabus.flatMap(s => s.topics).length).toBeGreaterThan(0)
    for (const s of e.syllabus) expect(dupes(s.topics)).toEqual([])
    expect(e.officialUrl).toMatch(/^https:\/\//)
  })

  it('nextDate prefers your own date, then the next upcoming one', () => {
    const cds = examById('cds')!
    expect(nextDate(cds, { cds: '2027-01-05' })).toMatchObject({ date: '2027-01-05', note: 'Your date' })
    const next = nextDate(cds, {})
    if (next?.date) expect(next.date >= new Date().toISOString().slice(0, 10)).toBe(true)
  })
})

describe('mock patterns', () => {
  it.each(MOCKS.map(m => [m.id, m] as const))('%s matches its paper in the catalogue', (_, m) => {
    const paper = examById(m.exam)?.papers.find(p => p.name === m.paper)
    expect(paper, `paper "${m.paper}" missing from ${m.exam}`).toBeDefined()
    const total = m.sections.reduce((s, x) => s + x.questions, 0)
    if (paper?.questions) expect(total).toBe(paper.questions)
    expect(m.sections.every(s => SUBJECTS.includes(s.subject) && s.questions > 0)).toBe(true)
  })

  it('has unique ids and a mock for every exam', () => {
    expect(dupes(MOCKS.map(m => m.id))).toEqual([])
    for (const id of EXAM_IDS) expect(MOCKS.some(m => m.exam === id)).toBe(true)
  })
})

describe('official papers and links', () => {
  it('papers have unique ids, real exams and UPSC links', () => {
    expect(dupes(OFFICIAL_PAPERS.map(p => p.id))).toEqual([])
    for (const p of OFFICIAL_PAPERS) {
      expect(EXAM_IDS).toContain(p.exam)
      expect(p.url).toMatch(/^https:\/\/www\.upsc\.gov\.in\/.+\.pdf$/)
      expect(p.questions).toBeGreaterThan(0)
      expect(p.marks).toBeGreaterThan(0)
      expect(p.minutes).toBeGreaterThan(0)
      // The paper's size matches the exam catalogue's paper of that name.
      const cat = examById(p.exam)!.papers.find(x => x.name === p.paper || x.name === `Prelims ${p.paper}`)
      expect(cat, `${p.id}: "${p.paper}" not in the ${p.exam} catalogue`).toBeDefined()
      expect([p.questions, p.marks, p.minutes], p.id).toEqual([cat!.questions, cat!.marks, cat!.minutes])
    }
  })

  it('a paper maps to its own syllabus subject (wrong OMR answers default to it)', () => {
    const subject = (id: string) => {
      const p = OFFICIAL_PAPERS.find(x => x.id === id)!
      return subjectForPaper(p.exam, `${p.sitting} — ${p.paper}`)
    }
    const byPaper = (exam: string, paper: string) => OFFICIAL_PAPERS.find(p => p.exam === exam && p.paper === paper)!.id
    expect(subject(byPaper('cds', 'English'))).toBe('English')
    expect(subject(byPaper('cds', 'General Knowledge'))).toBe('General Knowledge')
    expect(subject(byPaper('cds', 'Elementary Mathematics'))).toBe('Elementary Mathematics')
    expect(subject(byPaper('capf', 'Paper I — General Ability & Intelligence'))).toBe('Paper I')
    expect(subjectForPaper('capf', 'CAPF 2026 — Paper II — GS, Essay & Comprehension')).toBe('Paper II')
    expect(subject(byPaper('cse', 'GS Paper II (CSAT)'))).toBe('CSAT')
    expect(subject(byPaper('cse', 'GS Paper I'))).toBe('Prelims GS')
    // Every paper lands on a subject its exam actually has.
    for (const p of OFFICIAL_PAPERS) {
      expect(examById(p.exam)!.syllabus.map(s => s.subject), p.id).toContain(subjectForPaper(p.exam, `${p.sitting} — ${p.paper}`))
    }
    expect(subjectForPaper('nope', 'anything')).toBeUndefined()
  })

  it('links are https and not duplicated', () => {
    const urls = [...OFFICIAL_LINKS.map(l => l.url), ...DESCRIPTIVE_PAPERS.map(d => (d as { url?: string }).url).filter(Boolean)]
    for (const u of urls) expect(u).toMatch(/^https:\/\//)
    expect(dupes(OFFICIAL_LINKS.map(l => l.url))).toEqual([])
  })
})

describe('study guides', () => {
  it('have unique ids and topics', () => {
    expect(dupes(GUIDES.map(g => g.id))).toEqual([])
    expect(dupes(GUIDES.map(g => g.topic))).toEqual([])
  })

  it('every guide sits in exactly one section of its own track, and every section id is a guide', () => {
    const placed = Object.entries(SECTIONS).flatMap(([track, ss]) => ss.flatMap(s => s.ids.map(id => ({ track, id }))))
    expect(dupes(placed.map(p => p.id))).toEqual([])
    for (const p of placed) expect(GUIDES.find(g => g.id === p.id)?.track, p.id).toBe(p.track)
    for (const g of GUIDES) expect(placed.some(p => p.id === g.id), `${g.id} has no section`).toBe(true)
  })

  it.each(GUIDES.map(g => [g.id, g] as const))('%s points at real syllabus topics and has content', (_, g) => {
    expect(g.exams.length).toBeGreaterThan(0)
    expect(g.summary.trim()).not.toBe('')
    expect(g.read.length).toBeGreaterThan(0)
    for (const r of g.read) if (r.url) expect(r.url).toMatch(/^(https:\/\/|#\/)/)
    for (const s of g.syllabus) {
      const subject = examById(s.exam)?.syllabus.find(x => x.subject === s.subject)
      expect(subject?.topics, `${s.exam} · ${s.subject} · ${s.topic}`).toContain(s.topic)
    }
    for (const q of g.questions) expect([q.subject, q.topic]).toEqual([g.subject, g.topic])
    for (const b of g.notes) {
      if (b.kind === 'points') expect(b.points.length).toBeGreaterThan(0)
      if (b.kind === 'table') expect(b.rows.every(r => r.length === 2 && r[0] && r[1])).toBe(true)
    }
  })

  it('every generated topic is a study-guide topic, so "Practise this topic" finds it', () => {
    const topics = new Set(GUIDES.map(g => g.topic))
    for (const t of generatedTopics('All')) expect(topics, t).toContain(t)
  })

  it('tracksFor lists each exam\'s guides once, grouped into sections', () => {
    for (const exam of EXAM_IDS) {
      const ids = tracksFor(exam).flatMap(t => t.guides.map(g => g.id))
      expect(dupes(ids)).toEqual([])
      expect(new Set(ids)).toEqual(new Set(GUIDES.filter(g => g.exams.includes(exam)).map(g => g.id)))
    }
  })

  it('guide status mirrors onto syllabus rows and reads back as the best of them', () => {
    const g = GUIDES.find(x => x.syllabus.length > 0)!
    const rows = guideRows(g, 2)
    expect(rows).toHaveLength(g.syllabus.length + 1)
    const exam = g.syllabus[0].exam as ExamId
    expect(guideStatus(g, exam, new Map(rows.map(r => [r.id, r])))).toBe(2)
    expect(guideStatus(g, exam, new Map())).toBe(0)
  })

  it('uncoveredTopics lists only syllabus topics no guide covers', () => {
    for (const e of EXAMS) {
      const left = uncoveredTopics(e.id, e.syllabus)
      for (const t of left) expect(GUIDES.some(g => g.syllabus.some(s => s.exam === e.id && s.subject === t.subject && s.topic === t.topic))).toBe(false)
    }
  })
})

describe('flashcard decks and SSB material', () => {
  it('decks have unique ids and names, and complete cards', () => {
    expect(dupes(STARTER_DECKS.map(d => d.id))).toEqual([])
    expect(dupes(STARTER_DECKS.map(d => d.name))).toEqual([])
    for (const d of STARTER_DECKS) {
      expect(d.cards.length).toBeGreaterThan(0)
      expect(d.cards.every(([f, b]) => f.trim() && b.trim())).toBe(true)
      expect(dupes(d.cards.map(([f]) => norm(f)))).toEqual([])
    }
  })

  it('SSB lists are filled and free of repeats', () => {
    for (const list of [WAT_WORDS, SRT_SITUATIONS, LECTURETTE_TOPICS, GD_TOPICS, ESSAY_TOPICS, OLQS] as string[][]) {
      expect(list.length).toBeGreaterThan(0)
      expect(dupes(list.map(norm))).toEqual([])
    }
    expect(TAT_SCENES.length).toBeGreaterThan(0)
  })

  it('interview questions come out even for an empty profile, and grow with details', () => {
    const base = interviewQuestions(EMPTY_PROFILE)
    expect(base.length).toBeGreaterThan(0)
    const more = interviewQuestions({ ...EMPTY_PROFILE, hometown: 'Amritsar', hobbies: 'chess, running', sports: 'football' })
    expect(more.length).toBeGreaterThan(base.length)
    expect(more.every(q => q.q.trim() && !/undefined/.test(q.q))).toBe(true)
  })
})

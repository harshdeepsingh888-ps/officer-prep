import type { ExamId } from '../exams'
import type { TopicProgress } from '../../lib/db'
import { ENGLISH } from './english'
import { MATHS } from './maths'
import { GK_GUIDES } from './gk'
import type { Guide, Track } from './types'

export type { Guide, NoteBlock, ReadItem, Track } from './types'

export const GUIDES: Guide[] = [...ENGLISH, ...MATHS, ...GK_GUIDES]
export const GUIDE_QUESTIONS = GUIDES.flatMap(g => g.questions)
export const guideById = (id: string) => GUIDES.find(g => g.id === id)

const TRACK_ORDER: Track[] = ['Maths', 'English', 'GK', 'Reasoning']

/** Sections inside each track, in study order. Every guide belongs to one section. */
export const SECTIONS: Record<Track, { name: string; ids: string[] }[]> = {
  Maths: [
    { name: 'Arithmetic', ids: ['math-number', 'math-hcf', 'math-percent', 'math-ratio', 'math-average', 'math-profit', 'math-interest', 'math-work', 'math-tsd'] },
    { name: 'Algebra', ids: ['math-algebra', 'math-log'] },
    { name: 'Trigonometry', ids: ['math-trig', 'math-heights'] },
    { name: 'Geometry & mensuration', ids: ['math-geometry', 'math-mensuration'] },
    { name: 'Statistics', ids: ['math-stats'] },
  ],
  English: [
    { name: 'Grammar', ids: ['eng-errors', 'eng-improve', 'eng-blanks'] },
    { name: 'Vocabulary', ids: ['eng-vocab', 'eng-idioms'] },
    { name: 'Comprehension', ids: ['eng-rc', 'eng-cloze'] },
    { name: 'Sentence arrangement', ids: ['eng-ordering'] },
  ],
  GK: [
    { name: 'History & culture', ids: ['gk-ancient', 'gk-modern', 'gk-art'] },
    { name: 'Geography & environment', ids: ['gk-physical-geo', 'gk-indian-geo', 'gk-world-geo', 'gk-environment'] },
    { name: 'Polity & economy', ids: ['gk-polity', 'gk-economy'] },
    { name: 'Science', ids: ['gk-physics', 'gk-chemistry', 'gk-biology'] },
    { name: 'Defence, sports & current affairs', ids: ['gk-defence', 'gk-sports', 'gk-current'] },
  ],
  Reasoning: [
    { name: 'Verbal reasoning', ids: ['rsn-verbal', 'rsn-series'] },
    { name: 'Non-verbal & military aptitude', ids: ['rsn-spatial'] },
  ],
}

export type Section = { name: string; guides: Guide[] }

/** The study path for an exam: one list per track, grouped into sections, in study order. */
export function tracksFor(exam: ExamId): { track: Track; sections: Section[]; guides: Guide[] }[] {
  return TRACK_ORDER.map(track => {
    const mine = GUIDES.filter(g => g.track === track && g.exams.includes(exam))
    const placed = new Set(SECTIONS[track].flatMap(s => s.ids))
    const sections = [
      ...SECTIONS[track].map(s => ({ name: s.name, guides: s.ids.flatMap(id => mine.filter(g => g.id === id)) })),
      { name: 'Other topics', guides: mine.filter(g => !placed.has(g.id)) },
    ].filter(s => s.guides.length > 0)
    return { track, sections, guides: sections.flatMap(s => s.guides) }
  }).filter(t => t.guides.length > 0)
}

export const guideKey = (g: Guide) => `study|${g.id}`

/** A guide's status: its own record, or the best of the syllabus entries it covers for this exam. */
export function guideStatus(g: Guide, exam: ExamId, rows: Map<string, TopicProgress>) {
  const own = rows.get(guideKey(g))?.status ?? 0
  const mapped = g.syllabus.filter(s => s.exam === exam).map(s => rows.get(`${s.exam}|${s.subject}|${s.topic}`)?.status ?? 0)
  return Math.max(own, ...mapped)
}

/** Writes the guide's status and mirrors it onto every syllabus entry it covers (all exams). */
export function guideRows(g: Guide, status: number): TopicProgress[] {
  const now = Date.now()
  return [
    { id: guideKey(g), exam: 'study' as ExamId, subject: g.subject, topic: g.topic, status, updatedAt: now },
    ...g.syllabus.map(s => ({ id: `${s.exam}|${s.subject}|${s.topic}`, exam: s.exam, subject: s.subject, topic: s.topic, status, updatedAt: now })),
  ]
}

/** Syllabus topics of an exam that no guide covers yet (still tracked, without study material). */
export function uncoveredTopics(exam: ExamId, syllabus: { subject: string; topics: string[] }[]) {
  const covered = new Set(GUIDES.flatMap(g => g.syllabus.filter(s => s.exam === exam).map(s => `${s.subject}|${s.topic}`)))
  return syllabus.flatMap(s => s.topics.filter(t => !covered.has(`${s.subject}|${t}`)).map(t => ({ subject: s.subject, topic: t })))
}

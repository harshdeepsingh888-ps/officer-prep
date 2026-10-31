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

/** The study path for an exam: one ordered list per track. */
export function tracksFor(exam: ExamId): { track: Track; guides: Guide[] }[] {
  return TRACK_ORDER
    .map(track => ({ track, guides: GUIDES.filter(g => g.track === track && g.exams.includes(exam)) }))
    .filter(t => t.guides.length > 0)
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

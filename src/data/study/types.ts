import type { ExamId } from '../exams'
import type { Difficulty, Question } from '../questions'

// Study guides: one per syllabus topic (or a group of closely related topics).
// Content is original — notes are concise summaries; the reading list points to the full source.

export type Track = 'English' | 'Maths' | 'GK' | 'Reasoning'
export type SyllabusKey = { exam: ExamId; subject: string; topic: string }
export type ReadItem = { title: string; detail?: string; url?: string; free?: boolean }
export type NoteBlock =
  | { kind: 'points'; h: string; points: string[] }
  | { kind: 'table'; h: string; rows: [string, string][] }
  | { kind: 'example'; h: string; q: string; a: string }

export type Guide = {
  id: string
  track: Track
  subject: Question['subject']
  topic: string // also the quiz topic, so "Practise" filters to exactly these questions
  exams: ExamId[]
  syllabus: SyllabusKey[] // syllabus entries this guide covers, per exam
  summary: string // what the exam asks
  read: ReadItem[]
  notes: NoteBlock[]
  traps: string[]
  questions: Question[]
}

/** [text, options, answerIndex, explanation?, difficulty?, passage?] */
export type QSpec = [string, string[], number, string?, Difficulty?, string?]

/** Turns compact question specs into bank questions that belong to the guide (its exams, subject and topic). */
export function guideQuestions(g: Pick<Guide, 'id' | 'exams' | 'subject' | 'topic'>, specs: QSpec[]): Question[] {
  return specs.map(([text, options, answer, explanation, difficulty, passage], i) => ({
    id: `${g.id}-${i + 1}`, exams: g.exams, subject: g.subject, topic: g.topic,
    text, options, answer, explanation, difficulty: difficulty ?? 2, passage, source: 'Officer Prep',
  }))
}

export function guide(g: Omit<Guide, 'notes' | 'traps' | 'questions'> & { notes?: NoteBlock[]; traps?: string[]; questions?: QSpec[] }): Guide {
  return { ...g, notes: g.notes ?? [], traps: g.traps ?? [], questions: guideQuestions(g, g.questions ?? []) }
}

export const k = (exam: ExamId, subject: string, topic: string): SyllabusKey => ({ exam, subject, topic })
export const pts = (h: string, ...points: string[]): NoteBlock => ({ kind: 'points', h, points })
export const tbl = (h: string, rows: [string, string][]): NoteBlock => ({ kind: 'table', h, rows })
export const ex = (h: string, q: string, a: string): NoteBlock => ({ kind: 'example', h, q, a })

// Reading-list entries used across many topics.
export const PYQ: ReadItem = { title: 'UPSC previous papers', detail: 'Practice → Past papers. Solve the questions on this topic first: they show the level and style.', url: '#/practice/papers', free: true }
export const NCERT: ReadItem = { title: 'NCERT textbooks', detail: 'Free PDFs at ncert.nic.in. NCERT is rolling out new editions, so chapter names may differ: find the chapter that covers this topic.', url: 'https://ncert.nic.in/textbook.php', free: true }
export const PIB: ReadItem = { title: 'PIB press releases', detail: 'Official government source for current affairs; filter by ministry (Defence, External Affairs…).', url: 'https://pib.gov.in', free: true }
export const AFCAT_MOCK: ReadItem = { title: 'AFCAT official mock test', detail: 'Inside the candidate login on afcat.cdac.in when a cycle is open', url: 'https://afcat.cdac.in', free: true }

import Dexie, { type EntityTable } from 'dexie'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ExamId } from '../data/exams'
import type { Question } from '../data/questions'
import { isoOf, todayISO, addDays } from './util'

// Everything is stored locally in the browser (IndexedDB). Use Library → Backup to export.

export type Setting = { key: string; value: unknown }
export type TopicProgress = { id: string; exam: ExamId; subject: string; topic: string; status: number; updatedAt: number }
export type Task = { id?: number; date: string; title: string; minutes?: number; exam?: string; done: boolean; doneAt?: number }
export type StudySession = { id?: number; date: string; minutes: number; label: string; at: number }
export type UserQuestion = Omit<Question, 'id'> & { id?: number }
export type Attempt = {
  id?: number
  kind: 'quiz' | 'omr'
  exam: ExamId
  title: string
  at: number
  durationSec: number
  total: number
  responses: (number | null)[]
  key?: string
  correct?: number
  wrong?: number
  skipped?: number
  score?: number
  maxScore?: number
  wrongTopics?: string[]
  paperUrl?: string
  paperId?: string
  marksPerQ?: number
  negative?: number
  /** Per-question detail (quizzes from v2 on) — the basis for topic analytics. */
  items?: AttemptItem[]
  /** Which kind of test (quizzes from v3 on; older quizzes count as topic tests). */
  mode?: 'quick' | 'topic' | 'sectional' | 'mock' | 'weekly'
  /** Weekly quiz: Monday (local ISO date) of its week. */
  week?: string
}
export type AttemptItem = {
  qid: string
  subject: string
  topic: string
  answer: number | null
  correct: boolean | null
  ms: number
  marked?: boolean
  changes?: number
}

export type MistakeReason = 'concept' | 'calculation' | 'guess' | 'misread' | 'time'
export type Mistake = {
  id: string // q:<questionId> | p:<paperId>:<qno> | n:<timestamp>
  source: 'quiz' | 'paper' | 'manual'
  exam?: string
  subject: string
  topic: string
  question?: Question // snapshot, so it can be re-attempted
  yourAnswer?: number | null
  prompt?: string // paper / manual: what to revisit
  answerText?: string // paper / manual: the correct answer or key point
  paperUrl?: string
  reason?: MistakeReason
  note?: string
  count: number
  createdAt: number
  lastWrongAt: number
  status: 'active' | 'mastered'
}

/** A spaced-revision card — either a flashcard or a mistake to re-attempt. */
export type Card = {
  id: string // f:<deck>:<n> | c:<mistakeId>
  kind: 'flash' | 'mistake'
  deck: string
  front: string
  back: string
  mistakeId?: string
  due: number
  interval: number // days
  ease: number
  reps: number
  lapses: number
  createdAt: number
  status: 'active' | 'suspended'
}
export type Grade = 0 | 1 | 2 | 3 // again, hard, good, easy
export type Review = { id?: number; cardId: string; at: number; grade: Grade; interval: number; wasNew: boolean }
export type SSBTest = 'WAT' | 'SRT' | 'TAT' | 'PPDT' | 'SD' | 'Lecturette'
export type SSBResponse = { id?: number; test: SSBTest; at: number; items: { prompt: string; response: string }[]; olqs: string[]; note?: string }
export type Writing = { id?: number; kind: string; topic: string; text: string; words: number; minutes: number; at: number }
export type SSBImage = { id?: number; blob: Blob; name: string; at: number }
export type CustomLink = { id?: number; title: string; url: string; group: string }
export type CustomExam = { id?: number; name: string; date: string }

class PrepDB extends Dexie {
  settings!: EntityTable<Setting, 'key'>
  topics!: EntityTable<TopicProgress, 'id'>
  tasks!: EntityTable<Task, 'id'>
  sessions!: EntityTable<StudySession, 'id'>
  questions!: EntityTable<UserQuestion, 'id'>
  attempts!: EntityTable<Attempt, 'id'>
  ssb!: EntityTable<SSBResponse, 'id'>
  writings!: EntityTable<Writing, 'id'>
  images!: EntityTable<SSBImage, 'id'>
  links!: EntityTable<CustomLink, 'id'>
  customExams!: EntityTable<CustomExam, 'id'>
  mistakes!: EntityTable<Mistake, 'id'>
  cards!: EntityTable<Card, 'id'>
  reviews!: EntityTable<Review, 'id'>

  constructor() {
    super('officer-prep')
    this.version(1).stores({
      settings: 'key',
      topics: 'id, exam',
      tasks: '++id, date',
      sessions: '++id, date',
      questions: '++id, subject',
      attempts: '++id, at, exam',
      ssb: '++id, at, test',
      writings: '++id, at',
      images: '++id',
      links: '++id',
      customExams: '++id',
    })
    // v2: learning loop — mistake notebook, spaced-revision cards and their review log.
    this.version(2).stores({
      mistakes: 'id, createdAt, status',
      cards: 'id, due, deck, status',
      reviews: '++id, at, cardId',
    })
  }
}

export const db = new PrepDB()

export function useSetting<T>(key: string, fallback: T): [T, (v: T) => void] {
  const row = useLiveQuery(() => db.settings.get(key), [key])
  const value = row === undefined ? fallback : (row.value as T)
  return [value, (v: T) => { db.settings.put({ key, value: v }) }]
}

/** Read-modify-write a setting atomically, so quick successive changes don't overwrite each other. */
export function updateSetting<T>(key: string, fallback: T, fn: (v: T) => T) {
  return db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get(key)
    await db.settings.put({ key, value: fn(row === undefined ? fallback : (row.value as T)) })
  })
}

/** How much was done on each day (local ISO date → tasks, sessions, tests, reviews, SSB sets and essays). */
export async function activityByDay(): Promise<Map<string, number>> {
  const days = new Map<string, number>()
  const add = (day: string) => days.set(day, (days.get(day) ?? 0) + 1)
  const toDay = (ms: number) => isoOf(new Date(ms))
  ;(await db.tasks.toArray()).forEach(t => t.done && t.doneAt && add(toDay(t.doneAt)))
  ;(await db.sessions.toArray()).forEach(s => add(s.date))
  ;(await db.attempts.toArray()).forEach(a => add(toDay(a.at)))
  ;(await db.ssb.toArray()).forEach(r => add(toDay(r.at)))
  ;(await db.writings.toArray()).forEach(w => add(toDay(w.at)))
  ;(await db.reviews.toArray()).forEach(r => add(toDay(r.at)))
  return days
}

/** Days (local ISO) on which anything was practised. */
export const activeDays = async () => new Set((await activityByDay()).keys())

export function streakFrom(days: Set<string>) {
  let d = todayISO()
  if (!days.has(d)) d = addDays(d, -1) // today not done yet doesn't break the streak
  let n = 0
  while (days.has(d)) { n++; d = addDays(d, -1) }
  return n
}

/** Longest run of consecutive active days ever. */
export function bestStreak(days: Set<string>) {
  let best = 0
  for (const d of days) {
    if (days.has(addDays(d, -1))) continue // not the first day of a run
    let n = 1
    while (days.has(addDays(d, n))) n++
    best = Math.max(best, n)
  }
  return best
}

// ── Backups & storage health ──────────────────────────────────────
export const LAST_BACKUP_KEY = 'lastBackupAt'
export const markBackedUp = () => db.settings.put({ key: LAST_BACKUP_KEY, value: Date.now() })

/** True once there is progress worth protecting. */
export async function hasProgress() {
  const counts = await Promise.all([db.attempts.count(), db.tasks.count(), db.cards.count(), db.ssb.count(), db.writings.count(), db.topics.count(), db.questions.count()])
  return counts.some(n => n > 0)
}

/** Whether the browser will keep this site's data even when the device runs low on space. */
export async function storageStatus() {
  const s = navigator.storage
  const [persisted, estimate] = await Promise.all([s?.persisted?.() ?? Promise.resolve(false), s?.estimate?.() ?? Promise.resolve({ usage: 0, quota: 0 })])
  return { persisted, usage: estimate.usage ?? 0, quota: estimate.quota ?? 0, supported: !!s?.persist }
}
export const protectStorage = () => navigator.storage?.persist?.() ?? Promise.resolve(false)

const TABLES = ['settings', 'topics', 'tasks', 'sessions', 'questions', 'attempts', 'ssb', 'writings', 'links', 'customExams', 'mistakes', 'cards', 'reviews'] as const

export async function exportAll() {
  const out: Record<string, unknown[]> = {}
  for (const t of TABLES) out[t] = await db.table(t).toArray()
  return JSON.stringify({ app: 'officer-prep', version: 1, exportedAt: new Date().toISOString(), data: out }, null, 1)
}

/** Replaces this device's progress with the backup (practice pictures are kept). */
export async function importAll(json: string) {
  const parsed = JSON.parse(json)
  if (parsed?.app !== 'officer-prep') throw new Error('Not an Officer Prep backup file')
  await db.transaction('rw', TABLES.map(t => db.table(t)), async () => {
    for (const t of TABLES) {
      if (!Array.isArray(parsed.data?.[t])) continue
      await db.table(t).clear()
      await db.table(t).bulkPut(parsed.data[t])
    }
  })
}

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
  marksPerQ?: number
  negative?: number
}
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

/** Days (local ISO) on which anything was practised, newest first. */
export async function activeDays(): Promise<Set<string>> {
  const days = new Set<string>()
  const toDay = (ms: number) => isoOf(new Date(ms))
  ;(await db.tasks.toArray()).forEach(t => t.done && t.doneAt && days.add(toDay(t.doneAt)))
  ;(await db.sessions.toArray()).forEach(s => days.add(s.date))
  ;(await db.attempts.toArray()).forEach(a => days.add(toDay(a.at)))
  ;(await db.ssb.toArray()).forEach(r => days.add(toDay(r.at)))
  ;(await db.writings.toArray()).forEach(w => days.add(toDay(w.at)))
  return days
}

export function streakFrom(days: Set<string>) {
  let d = todayISO()
  if (!days.has(d)) d = addDays(d, -1) // today not done yet doesn't break the streak
  let n = 0
  while (days.has(d)) { n++; d = addDays(d, -1) }
  return n
}

const TABLES = ['settings', 'topics', 'tasks', 'sessions', 'questions', 'attempts', 'ssb', 'writings', 'links', 'customExams'] as const

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

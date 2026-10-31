import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activeDays, activityByDay, bestStreak, db, exportAll, hasProgress, importAll, streakFrom, updateSetting } from './db'
import { addDays, todayISO } from './util'

beforeEach(async () => { await Promise.all(db.tables.map(t => t.clear())) })
afterEach(() => { vi.useRealTimers() })

const days = (...offsets: number[]) => new Set(offsets.map(o => addDays(todayISO(), -o)))

describe('streaks', () => {
  it('counts back from today, or from yesterday if today is not done yet', () => {
    expect(streakFrom(days(0, 1, 2, 4))).toBe(3)
    expect(streakFrom(days(1, 2))).toBe(2)
    expect(streakFrom(days(2, 3))).toBe(0)
    expect(streakFrom(new Set())).toBe(0)
  })

  it('finds the longest run ever, across month ends', () => {
    expect(bestStreak(new Set(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-05', '2026-02-06']))).toBe(3)
    expect(bestStreak(new Set())).toBe(0)
  })
})

describe('activity', () => {
  it('counts each kind of work on the local day it happened', async () => {
    const at = new Date('2026-11-03T00:30:00+05:30').getTime() // just after midnight IST, still 2 Nov in UTC
    await db.attempts.add({ kind: 'quiz', exam: 'cds', title: 't', at, durationSec: 1, total: 1, responses: [] })
    await db.reviews.add({ cardId: 'a', at, grade: 2, interval: 1, wasNew: true })
    await db.tasks.bulkAdd([{ date: '2026-11-03', title: 'done', done: true, doneAt: at }, { date: '2026-11-03', title: 'open', done: false }])
    await db.sessions.add({ date: '2026-11-01', minutes: 20, label: '', at })
    await db.notes.add({ date: '2026-11-03', category: 'Defence', title: 'n', text: '', at })
    const map = await activityByDay()
    expect(map.get('2026-11-03')).toBe(4)
    expect(map.get('2026-11-01')).toBe(1)
    expect(map.has('2026-11-02')).toBe(false)
    expect(await activeDays()).toEqual(new Set(['2026-11-03', '2026-11-01']))
  })
})

describe('settings', () => {
  it('updateSetting applies quick successive changes without losing any', async () => {
    await Promise.all(Array.from({ length: 10 }, () => updateSetting<number>('n', 0, v => v + 1)))
    expect((await db.settings.get('n'))?.value).toBe(10)
  })
})

describe('backup', () => {
  it('a fresh device has no progress; one question is progress', async () => {
    expect(await hasProgress()).toBe(false)
    await db.questions.add({ exams: ['cds'], subject: 'English', topic: 't', text: 'q', options: ['a', 'b'], answer: 0 })
    expect(await hasProgress()).toBe(true)
  })

  it('export then import restores every table exactly', async () => {
    await db.settings.put({ key: 'targets', value: ['cds'] })
    await db.questions.add({ exams: ['cds'], subject: 'English', topic: 't', text: 'q', options: ['a', 'b'], answer: 1 })
    await db.cards.put({ id: 'f:x:0', kind: 'flash', deck: 'x', front: 'f', back: 'b', due: 1, interval: 0, ease: 2.5, reps: 0, lapses: 0, createdAt: 1, status: 'active' })
    await db.notes.add({ date: '2026-11-01', category: 'Polity', title: 'n', text: 't', at: 5 })
    const json = await exportAll()
    const before = await Promise.all(db.tables.map(t => t.toArray()))

    await Promise.all(db.tables.map(t => t.clear()))
    await db.tasks.add({ date: '2026-01-01', title: 'stale', done: false })
    await importAll(json)
    const after = await Promise.all(db.tables.map(t => t.toArray()))
    expect(after).toEqual(before)
    expect(JSON.parse(json)).toMatchObject({ app: 'officer-prep', version: 1 })
  })

  it('refuses a file that is not an Officer Prep backup, and changes nothing', async () => {
    await db.tasks.add({ date: '2026-01-01', title: 'keep', done: false })
    await expect(importAll(JSON.stringify({ app: 'other', data: { tasks: [] } }))).rejects.toThrow(/Not an Officer Prep backup/)
    await expect(importAll('not json')).rejects.toThrow()
    expect(await db.tasks.count()).toBe(1)
  })

  it('leaves tables that a backup does not mention untouched', async () => {
    await db.tasks.add({ date: '2026-01-01', title: 'keep', done: false })
    await importAll(JSON.stringify({ app: 'officer-prep', version: 1, data: { settings: [{ key: 'a', value: 1 }] } }))
    expect(await db.tasks.count()).toBe(1)
    expect(await db.settings.get('a')).toEqual({ key: 'a', value: 1 })
  })
})

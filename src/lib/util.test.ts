import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDays, daysUntil, fmtBytes, fmtClock, isoOf, round2, todayISO, weekStart, wordCount } from './util'
import { levelFor, LEVELS } from './level'

afterEach(() => { vi.useRealTimers() })

describe('dates', () => {
  it('uses the local date, not UTC (00:30 IST is still the same day)', () => {
    expect(isoOf(new Date('2026-11-03T00:30:00+05:30'))).toBe('2026-11-03')
  })

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('weeks start on Monday', () => {
    expect(weekStart('2026-11-02')).toBe('2026-11-02') // Monday
    expect(weekStart('2026-11-08')).toBe('2026-11-02') // Sunday
    expect(weekStart('2026-11-01')).toBe('2026-10-26') // Sunday before
  })

  it('counts whole days until a date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T23:59:00+05:30'))
    expect(todayISO()).toBe('2026-11-02')
    expect(daysUntil('2026-11-02')).toBe(0)
    expect(daysUntil('2026-11-12')).toBe(10)
    expect(daysUntil('2026-10-31')).toBe(-2)
  })
})

describe('formatting', () => {
  it('formats clocks, word counts, rounding and sizes', () => {
    expect(fmtClock(0)).toBe('0:00')
    expect(fmtClock(605)).toBe('10:05')
    expect(wordCount('  ')).toBe(0)
    expect(wordCount(' Duty,  honour\ncourage ')).toBe(3)
    expect(round2(1 / 3)).toBe(0.33)
    expect(fmtBytes(512)).toBe('512 B')
    expect(fmtBytes(2048)).toBe('2 KB')
    expect(fmtBytes(5.5 * 1024 ** 2)).toBe('5.5 MB')
    expect(fmtBytes(3 * 1024 ** 3)).toBe('3.0 GB')
  })
})

describe('levelFor', () => {
  it('starts as Rookie and moves up on the day the threshold is reached', () => {
    expect(levelFor(0)).toMatchObject({ level: 0, toNext: 7 })
    expect(levelFor(6).current.name).toBe('Rookie')
    expect(levelFor(7).current.name).toBe('Learner')
    expect(levelFor(21)).toMatchObject({ current: { name: 'Striver' }, toNext: 24, progress: 0 })
  })

  it('tops out at Legend with full progress', () => {
    const top = levelFor(10_000)
    expect(top.current.name).toBe('Legend')
    expect(top.next).toBeUndefined()
    expect(top).toMatchObject({ toNext: 0, progress: 1 })
  })

  it('has strictly increasing thresholds and unique titles', () => {
    expect(LEVELS.every((r, i) => i === 0 || r.days > LEVELS[i - 1].days)).toBe(true)
    expect(new Set(LEVELS.map(l => l.name)).size).toBe(LEVELS.length)
  })

  it('uses no military rank as a level title', () => {
    const ranks = /cadet|lieutenant|captain|major|colonel|brigadier|general|admiral|commodore|commander|marshal|officer|sepoy|havildar|subedar/i
    expect(LEVELS.filter(l => ranks.test(l.name))).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import type { Card } from './db'
import { MASTERED_DAYS, freshSchedule, isMastered, isNew, preview, schedule, startOfDay, tomorrow } from './srs'

const NOW = new Date('2026-11-02T15:30:00+05:30').getTime()
const DAY = 86_400_000
const card = (over: Partial<Card> = {}): Card =>
  ({ id: 'c', kind: 'flash', deck: 'd', front: 'f', back: 'b', createdAt: 0, ...freshSchedule(NOW), ...over })
/** Due at 4 am local time, `days` days after NOW's date. */
const morning = (days: number) => startOfDay(NOW) + days * DAY + 4 * 3_600_000

describe('schedule', () => {
  it('sends a forgotten card back in ten minutes and lowers its ease', () => {
    const next = schedule(card({ reps: 3, interval: 10, ease: 2.5 }), 0, NOW)
    expect(next).toEqual({ due: NOW + 10 * 60_000, interval: 0, ease: 2.3, reps: 0, lapses: 1 })
  })

  it('never lets ease fall below 1.3', () => {
    expect(schedule(card({ ease: 1.35 }), 0, NOW).ease).toBe(1.3)
    expect(schedule(card({ ease: 1.3, reps: 2, interval: 5 }), 1, NOW).ease).toBe(1.3)
  })

  it('first review: 1 day, or 4 days for Easy, due early next morning', () => {
    expect(schedule(card(), 2, NOW)).toMatchObject({ interval: 1, reps: 1, due: morning(1) })
    expect(schedule(card(), 3, NOW)).toMatchObject({ interval: 4, due: morning(4) })
  })

  it('second review: 2 / 3 / 6 days for Hard / Good / Easy', () => {
    const c = card({ reps: 1, interval: 1 })
    expect([1, 2, 3].map(g => schedule(c, g as 1 | 2 | 3, NOW).interval)).toEqual([2, 3, 6])
  })

  it('later reviews grow by the ease factor and always by at least a day', () => {
    const c = card({ reps: 2, interval: 3, ease: 2.5 })
    expect(schedule(c, 2, NOW).interval).toBe(8) // 3 × 2.5 = 7.5 → 8
    expect(schedule(c, 1, NOW).interval).toBe(4) // 3 × 1.2 = 3.6 → max(4, 4)
    expect(schedule(c, 3, NOW).interval).toBe(10) // 3 × 3.25 = 9.75 → 10
    expect(schedule(card({ reps: 5, interval: 1, ease: 1.3 }), 1, NOW).interval).toBe(2)
  })
})

describe('helpers', () => {
  it('previews the next interval as a short label', () => {
    expect(preview(card(), 0)).toBe('10m')
    expect(preview(card(), 2)).toBe('1d')
    expect(preview(card({ reps: 3, interval: 10 }), 2)).toBe('4w')
    expect(preview(card({ reps: 3, interval: 40 }), 2)).toBe('3mo')
  })

  it('tomorrow is 4 am the next day', () => {
    expect(tomorrow(NOW)).toBe(morning(1))
    expect(new Date(tomorrow(NOW)).getHours()).toBe(4)
  })

  it('mastered at 21 days; new until first reviewed or lapsed', () => {
    expect(isMastered({ interval: MASTERED_DAYS })).toBe(true)
    expect(isMastered({ interval: MASTERED_DAYS - 1 })).toBe(false)
    expect(isNew({ reps: 0, lapses: 0 })).toBe(true)
    expect(isNew({ reps: 0, lapses: 1 })).toBe(false)
  })
})

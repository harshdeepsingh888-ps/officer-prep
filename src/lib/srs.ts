import type { Card, Grade } from './db'

// Spaced repetition — a compact SM-2 variant.
// Again: back in 10 minutes. Hard / Good / Easy: grow the interval by the card's ease factor.

const MIN = 60_000
const DAY = 86_400_000
/** A card whose interval has reached this many days counts as mastered. */
export const MASTERED_DAYS = 21

export const startOfDay = (ms: number) => new Date(new Date(ms).toDateString()).getTime()
/** Reviews fall due early in the morning, so a card scheduled for "tomorrow" is ready when you wake up. */
const dueAfterDays = (now: number, days: number) => startOfDay(now) + days * DAY + 4 * 3_600_000

export const freshSchedule = (due = Date.now()): Pick<Card, 'due' | 'interval' | 'ease' | 'reps' | 'lapses' | 'status'> =>
  ({ due, interval: 0, ease: 2.5, reps: 0, lapses: 0, status: 'active' })

/** First thing tomorrow — used for a mistake you have just seen the answer to. */
export const tomorrow = (now = Date.now()) => dueAfterDays(now, 1)

export function schedule(card: Card, grade: Grade, now = Date.now()): Pick<Card, 'due' | 'interval' | 'ease' | 'reps' | 'lapses'> {
  let { interval, ease, reps, lapses } = card
  if (grade === 0) {
    return { due: now + 10 * MIN, interval: 0, ease: Math.max(1.3, ease - 0.2), reps: 0, lapses: lapses + 1 }
  }
  if (reps === 0) interval = grade === 3 ? 4 : 1
  else if (reps === 1) interval = grade === 1 ? 2 : grade === 3 ? 6 : 3
  else {
    const factor = grade === 1 ? 1.2 : grade === 3 ? ease * 1.3 : ease
    interval = Math.max(interval + 1, Math.round(interval * factor))
  }
  ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0))
  return { due: dueAfterDays(now, interval), interval, ease, reps: reps + 1, lapses }
}

/** Label for a grade button, e.g. "10m", "3d", "2w". */
export function preview(card: Card, grade: Grade): string {
  if (grade === 0) return '10m'
  const d = schedule(card, grade).interval
  if (d < 14) return `${d}d`
  if (d < 60) return `${Math.round(d / 7)}w`
  return `${Math.round(d / 30)}mo`
}

export const isMastered = (c: Pick<Card, 'interval'>) => c.interval >= MASTERED_DAYS
export const isNew = (c: Pick<Card, 'reps' | 'lapses'>) => c.reps === 0 && c.lapses === 0

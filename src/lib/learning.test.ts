import { liveQuery } from 'dexie'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { STARTER_DECKS } from '../data/decks'
import { BUILTIN_QUESTIONS } from '../data/questions'
import { db, type AttemptItem, type Card } from './db'
import {
  MISTAKE_DECK, addFlashcards, addManualMistake, addPaperMistake, addStarterDeck, deleteDeck, deleteMistake,
  recordQuizMistakes, reviewCard, reviewQueue, setMistakeStatus,
} from './learning'
import { MASTERED_DAYS, freshSchedule, startOfDay } from './srs'

beforeEach(async () => { await Promise.all(db.tables.map(t => t.clear())) })

const [q1, q2] = BUILTIN_QUESTIONS
const answered = (qid: string, correct: boolean | null): AttemptItem =>
  ({ qid, subject: 'x', topic: 'y', answer: correct === null ? null : 0, correct, ms: 1000 })

describe('quiz mistakes', () => {
  it('saves only wrong answers, each with a revision card due tomorrow morning', async () => {
    const n = await recordQuizMistakes([answered(q1.id, false), answered(q2.id, true), answered('missing', false)], [q1, q2], 'cds')
    expect(n).toBe(2)
    const mistakes = await db.mistakes.toArray()
    expect(mistakes).toHaveLength(1)
    expect(mistakes[0]).toMatchObject({ id: `q:${q1.id}`, source: 'quiz', count: 1, status: 'active', question: q1 })
    const card = await db.cards.get(`c:q:${q1.id}`)
    expect(card).toMatchObject({ kind: 'mistake', deck: MISTAKE_DECK, front: q1.text, back: q1.options[q1.answer] })
    expect(card!.due).toBeGreaterThan(startOfDay(Date.now()) + 86_400_000)
  })

  it('a repeat mistake counts again, keeps your reason and sends the card back to the start', async () => {
    await recordQuizMistakes([answered(q1.id, false)], [q1], 'cds')
    await db.mistakes.update(`q:${q1.id}`, { reason: 'concept', note: 'read again' })
    await db.cards.update(`c:q:${q1.id}`, { interval: 10, reps: 4 })
    await recordQuizMistakes([answered(q1.id, false)], [q1], 'cds')
    expect(await db.mistakes.get(`q:${q1.id}`)).toMatchObject({ count: 2, reason: 'concept', note: 'read again' })
    expect(await db.cards.get(`c:q:${q1.id}`)).toMatchObject({ interval: 0, reps: 0, lapses: 1, status: 'active' })
  })

  it('paper and manual mistakes get cards too', async () => {
    await addPaperMistake({ paperId: 'p1', title: 'CDS GK', qno: 12, exam: 'cds', subject: 'GK', topic: 'Polity', correct: 'B', note: 'Art 51A' })
    expect(await db.cards.get('c:p:p1:12')).toMatchObject({ front: 'CDS GK · Q12', back: 'Answer: B — Art 51A' })
    await addManualMistake({ subject: 'GK', topic: 'Defence', prompt: 'Exercise Garuda?', answerText: 'India–France' })
    expect(await db.mistakes.count()).toBe(2)
    expect(await db.cards.count()).toBe(2)
  })

  it('mastering suspends the card; reactivating brings it due now; deleting removes both', async () => {
    await recordQuizMistakes([answered(q1.id, false)], [q1], 'cds')
    const id = `q:${q1.id}`
    await setMistakeStatus(id, 'mastered')
    expect((await db.cards.get(`c:${id}`))!.status).toBe('suspended')
    await setMistakeStatus(id, 'active')
    const card = await db.cards.get(`c:${id}`)
    expect(card!.status).toBe('active')
    expect(card!.due).toBeLessThanOrEqual(Date.now())
    await deleteMistake(id)
    expect(await db.mistakes.count()).toBe(0)
    expect(await db.cards.count()).toBe(0)
  })
})

describe('reviewing', () => {
  it('logs the review and retires a mistake once its interval reaches 21 days', async () => {
    await recordQuizMistakes([answered(q1.id, false)], [q1], 'cds')
    const card = (await db.cards.get(`c:q:${q1.id}`))!
    await reviewCard({ ...card, reps: 3, interval: 12, ease: 2.5 }, 2)
    expect((await db.cards.get(card.id))!.interval).toBeGreaterThanOrEqual(MASTERED_DAYS)
    expect((await db.mistakes.get(`q:${q1.id}`))!.status).toBe('mastered')
    expect(await db.reviews.toArray()).toMatchObject([{ cardId: card.id, grade: 2, wasNew: false }])
  })

  it('queues mistakes first, then due reviews, then a limited number of new cards', async () => {
    const now = Date.now()
    const c = (id: string, over: Partial<Card>): Card => ({ id, kind: 'flash', deck: 'd', front: id, back: '', createdAt: 0, ...freshSchedule(now - 1000), ...over })
    await db.cards.bulkPut([
      c('new1', { createdAt: 1 }), c('new2', { createdAt: 2 }), c('new3', { createdAt: 3 }),
      c('rev', { reps: 2, interval: 3 }),
      c('mis', { kind: 'mistake', mistakeId: 'm' }),
      c('later', { reps: 2, due: now + 86_400_000 }),
      c('off', { status: 'suspended' }),
    ])
    expect((await reviewQueue(2, now)).map(x => x.id)).toEqual(['mis', 'rev', 'new1', 'new2'])
    // New cards already started today count against the limit.
    await db.reviews.add({ cardId: 'x', at: now, grade: 2, interval: 1, wasNew: true })
    expect((await reviewQueue(2, now)).map(x => x.id)).toEqual(['mis', 'rev', 'new1'])
  })

  it('a live count of the queue updates when a deck is added afterwards', async () => {
    // Regression: the "Today's review · N" tab stayed blank after adding a deck until a reload.
    const counts: number[] = []
    const sub = liveQuery(async () => (await reviewQueue(20)).length).subscribe(n => counts.push(n))
    await vi.waitFor(() => expect(counts).toEqual([0]))
    await new Promise(r => setTimeout(r, 5)) // the new cards are due a moment after the query last ran
    await addStarterDeck(STARTER_DECKS[0])
    await vi.waitFor(() => expect(counts.at(-1)).toBe(Math.min(20, STARTER_DECKS[0].cards.length)))
    sub.unsubscribe()
  })
})

describe('flashcard decks', () => {
  it('adding a starter deck twice adds its cards once', async () => {
    const deck = STARTER_DECKS[0]
    expect(await addStarterDeck(deck)).toBe(deck.cards.length)
    expect(await addStarterDeck(deck)).toBe(0)
    expect(await db.cards.where('deck').equals(deck.name).count()).toBe(deck.cards.length)
  })

  it('adds your own cards and deletes a whole deck', async () => {
    await addFlashcards('Mine', [['a', '1'], ['b', '2']])
    await addFlashcards('Other', [['c', '3']])
    expect(await db.cards.where('deck').equals('Mine').count()).toBe(2)
    await deleteDeck('Mine')
    expect(await db.cards.count()).toBe(1)
  })
})

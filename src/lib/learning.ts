import type { Question } from '../data/questions'
import type { StarterDeck } from '../data/decks'
import { db, type AttemptItem, type Card, type Grade, type Mistake, type MistakeReason } from './db'
import { MASTERED_DAYS, freshSchedule, isNew, schedule, startOfDay, tomorrow } from './srs'

// The learning loop: wrong answers → mistake notebook → spaced revision → mastered.

export const REASONS: { id: MistakeReason; label: string }[] = [
  { id: 'concept', label: 'Concept gap' },
  { id: 'calculation', label: 'Calculation slip' },
  { id: 'guess', label: 'Guessed' },
  { id: 'misread', label: 'Misread the question' },
  { id: 'time', label: 'Time pressure' },
]
export const MISTAKE_DECK = 'Mistakes'

const cardIdFor = (mistakeId: string) => `c:${mistakeId}`

/** Save every wrong answer from a finished quiz; a repeat mistake sends its card back to the start. */
export async function recordQuizMistakes(items: AttemptItem[], qs: Question[], exam: string) {
  const now = Date.now()
  const wrong = items.filter(i => i.correct === false)
  await db.transaction('rw', db.mistakes, db.cards, async () => {
    for (const item of wrong) {
      const q = qs.find(x => x.id === item.qid)
      if (!q) continue
      const id = `q:${q.id}`
      const prev = await db.mistakes.get(id)
      await db.mistakes.put({
        id, source: 'quiz', exam, subject: q.subject, topic: q.topic, question: q, yourAnswer: item.answer,
        reason: prev?.reason, note: prev?.note, count: (prev?.count ?? 0) + 1,
        createdAt: prev?.createdAt ?? now, lastWrongAt: now, status: 'active',
      })
      const cid = cardIdFor(id)
      const card = await db.cards.get(cid)
      if (card) {
        await db.cards.update(cid, { due: tomorrow(now), interval: 0, reps: 0, lapses: card.lapses + 1, status: 'active' })
      } else {
        await db.cards.put({
          id: cid, kind: 'mistake', deck: MISTAKE_DECK, front: q.text, back: q.options[q.answer], mistakeId: id,
          createdAt: now, ...freshSchedule(tomorrow(now)),
        })
      }
    }
  })
  return wrong.length
}

/** A wrong answer on an official past paper (question text stays in the paper). */
export async function addPaperMistake(p: {
  paperId: string; title: string; url?: string; qno: number; exam: string; subject: string; topic: string
  correct?: string; reason?: MistakeReason; note?: string
}) {
  const now = Date.now()
  const id = `p:${p.paperId}:${p.qno}`
  const prompt = `${p.title} · Q${p.qno}`
  const answerText = [p.correct && `Answer: ${p.correct}`, p.note].filter(Boolean).join(' — ')
  await db.transaction('rw', db.mistakes, db.cards, async () => {
    const prev = await db.mistakes.get(id)
    await db.mistakes.put({
      id, source: 'paper', exam: p.exam, subject: p.subject, topic: p.topic, prompt, answerText, paperUrl: p.url,
      reason: p.reason, note: p.note, count: (prev?.count ?? 0) + 1, createdAt: prev?.createdAt ?? now, lastWrongAt: now, status: 'active',
    })
    await db.cards.put({
      id: cardIdFor(id), kind: 'mistake', deck: MISTAKE_DECK, front: prompt, back: answerText || 'Check the official key',
      mistakeId: id, createdAt: now, ...freshSchedule(tomorrow(now)),
    })
  })
}

/** Something you got wrong elsewhere — a newspaper quiz, a coaching test, a Telegram poll. */
export async function addManualMistake(m: { subject: string; topic: string; prompt: string; answerText: string; reason?: MistakeReason; note?: string }) {
  const now = Date.now()
  const id = `n:${now}`
  await db.transaction('rw', db.mistakes, db.cards, async () => {
    await db.mistakes.put({ id, source: 'manual', count: 1, createdAt: now, lastWrongAt: now, status: 'active', ...m })
    await db.cards.put({
      id: cardIdFor(id), kind: 'mistake', deck: MISTAKE_DECK, front: m.prompt, back: m.answerText, mistakeId: id,
      createdAt: now, ...freshSchedule(tomorrow(now)),
    })
  })
}

export async function setMistakeStatus(id: string, status: Mistake['status']) {
  await db.transaction('rw', db.mistakes, db.cards, async () => {
    await db.mistakes.update(id, { status })
    await db.cards.update(cardIdFor(id), { status: status === 'mastered' ? 'suspended' : 'active', ...(status === 'active' ? { due: Date.now() } : {}) })
  })
}

export async function deleteMistake(id: string) {
  await db.transaction('rw', db.mistakes, db.cards, async () => {
    await db.mistakes.delete(id)
    await db.cards.delete(cardIdFor(id))
  })
}

/** Grade a card, log the review, and retire a mistake once its interval reaches MASTERED_DAYS. */
export async function reviewCard(card: Card, grade: Grade) {
  const now = Date.now()
  const next = schedule(card, grade, now)
  await db.transaction('rw', db.cards, db.reviews, db.mistakes, async () => {
    await db.cards.update(card.id, next)
    await db.reviews.add({ cardId: card.id, at: now, grade, interval: next.interval, wasNew: isNew(card) })
    if (card.mistakeId && next.interval >= MASTERED_DAYS) await db.mistakes.update(card.mistakeId, { status: 'mastered' })
  })
  return next
}

/** Today's queue: mistakes first, then due reviews, then up to `newLimit` new flashcards. */
export async function reviewQueue(newLimit: number, now = Date.now()): Promise<Card[]> {
  // Read every active card rather than the `due <= now` range: a live query only re-runs for changes inside the range
  // it read, and a card added a moment later (due = its creation time) falls outside it, so the count would go stale.
  const due = (await db.cards.where('status').equals('active').toArray()).filter(c => c.due <= now)
  const newToday = await db.reviews.where('at').aboveOrEqual(startOfDay(now)).filter(r => r.wasNew).count()
  const isFreshFlash = (c: Card) => c.kind === 'flash' && isNew(c)
  const mistakes = due.filter(c => c.kind === 'mistake').sort((a, b) => a.due - b.due)
  const reviews = due.filter(c => c.kind === 'flash' && !isNew(c)).sort((a, b) => a.due - b.due)
  const fresh = due.filter(isFreshFlash).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)).slice(0, Math.max(0, newLimit - newToday))
  return [...mistakes, ...reviews, ...fresh]
}

// ── Jumping into a pre-filtered quiz ──────────────────────────────
export type QuizPreset = { subject?: string; topic?: string; source?: 'all' | 'mistakes' | 'mine'; difficulty?: number; exam?: string }

/** Opens Practice with the quiz set up for this topic / source. */
export async function openQuiz(preset: QuizPreset) {
  await db.settings.put({ key: 'quizPreset', value: preset })
  window.location.hash = '/practice'
}

// ── Flashcard decks ───────────────────────────────────────────────
export async function addStarterDeck(deck: StarterDeck) {
  const now = Date.now()
  const existing = new Set((await db.cards.where('deck').equals(deck.name).toArray()).map(c => c.id))
  const cards: Card[] = deck.cards
    .map(([front, back], i) => ({ id: `f:${deck.id}:${i}`, kind: 'flash' as const, deck: deck.name, front, back, createdAt: now + i, ...freshSchedule(now) }))
    .filter(c => !existing.has(c.id))
  await db.cards.bulkPut(cards)
  return cards.length
}

export async function addFlashcards(deck: string, pairs: [string, string][]) {
  const now = Date.now()
  await db.cards.bulkPut(pairs.map(([front, back], i) => ({
    id: `f:u:${now}:${i}`, kind: 'flash' as const, deck, front, back, createdAt: now + i, ...freshSchedule(now),
  })))
  return pairs.length
}

export async function deleteDeck(deck: string) {
  const ids = (await db.cards.where('deck').equals(deck).toArray()).map(c => c.id)
  await db.cards.bulkDelete(ids)
}

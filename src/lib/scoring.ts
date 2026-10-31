/** Normalise a typed answer key: keeps A–D, and X / * for dropped questions. */
export function parseKey(raw: string): string {
  return raw.toUpperCase().replace(/\*/g, 'X').replace(/[^ABCDX]/g, '')
}

export type ScoreResult = {
  correct: number
  wrong: number
  skipped: number
  dropped: number
  score: number
  maxScore: number
  wrongNums: number[]
}

/** Score OMR responses (0–3 or null) against a key string, with per-question marks and penalty. */
export function scoreOMR(responses: (number | null)[], key: string, marksPerQ: number, negative: number): ScoreResult {
  let correct = 0, wrong = 0, skipped = 0, dropped = 0
  const wrongNums: number[] = []
  responses.forEach((r, i) => {
    const k = key[i]
    if (!k || k === 'X') { dropped++; return }
    if (r === null || r === undefined) { skipped++; return }
    if ('ABCD'[r] === k) correct++
    else { wrong++; wrongNums.push(i + 1) }
  })
  const scored = responses.length - dropped
  return {
    correct, wrong, skipped, dropped, wrongNums,
    score: Math.round((correct * marksPerQ - wrong * negative) * 100) / 100,
    maxScore: Math.round(scored * marksPerQ * 100) / 100,
  }
}

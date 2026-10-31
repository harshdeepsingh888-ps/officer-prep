import { describe, expect, it } from 'vitest'
import { parseKey, scoreOMR } from './scoring'

describe('parseKey', () => {
  it('keeps answer letters and maps * to X', () => {
    expect(parseKey('1-b 2-a 3-* 4-x')).toBe('BAXX')
    expect(parseKey('badc')).toBe('BADC')
  })
})

describe('scoreOMR', () => {
  it('scores right, wrong, skipped and dropped with negative marking', () => {
    // CDS-style: 100 marks / 120 questions, a third off per wrong answer.
    const per = 100 / 120
    const r = scoreOMR([0, 1, null, 3, 2], 'ABCXA', per, per / 3)
    expect(r).toMatchObject({ correct: 2, wrong: 1, skipped: 1, dropped: 1, wrongNums: [5] })
    expect(r.score).toBeCloseTo(2 * per - per / 3, 2)
    expect(r.maxScore).toBeCloseTo(4 * per, 2)
  })

  it('treats questions past the end of a short key as dropped', () => {
    const r = scoreOMR([0, 0, 0], 'A', 2, 0.66)
    expect(r).toMatchObject({ correct: 1, dropped: 2, score: 2, maxScore: 2 })
  })

  it('never awards marks for an all-blank sheet', () => {
    expect(scoreOMR([null, null], 'AB', 2, 0.66)).toMatchObject({ score: 0, skipped: 2, maxScore: 4 })
  })
})

import { describe, expect, it } from 'vitest'
import { answerKeyColumns, parseAnswerKey, parsePaper, parsePastedCards, parsePastedMCQs } from './paste'

describe('parsePastedMCQs', () => {
  it('reads options on separate lines and an "Ans:" line', () => {
    const { items, skipped } = parsePastedMCQs(`Q1. Exercise Garuda is held with which country?
a) USA
b) France
c) Russia
d) Japan
Ans: b
Explanation: Garuda is the India–France air exercise.`)
    expect(skipped).toBe(0)
    expect(items).toEqual([{
      text: 'Exercise Garuda is held with which country?', options: ['USA', 'France', 'Russia', 'Japan'], answer: 1,
      explanation: 'Garuda is the India–France air exercise.',
    }])
  })

  it('reads inline options and a tick after the right one', () => {
    const { items } = parsePastedMCQs(`📌 2) First CDS of India?
(a) Gen Naravane (b) Gen Bipin Rawat ✅ (c) Gen Chauhan (d) Adm Singh`)
    expect(items[0].options).toEqual(['Gen Naravane', 'Gen Bipin Rawat', 'Gen Chauhan', 'Adm Singh'])
    expect(items[0].answer).toBe(1)
    expect(items[0].text).toBe('First CDS of India?')
  })

  it('splits several questions and counts the ones without an answer as skipped', () => {
    const { items, skipped } = parsePastedMCQs(`Q1. One?
a) x
b) y
Answer - (A)

Q2. Two?
a) p
b) q`)
    expect(items).toHaveLength(1)
    expect(items[0].answer).toBe(0)
    expect(skipped).toBe(1)
  })

  it('never returns an answer outside the options', () => {
    const { items } = parsePastedMCQs(`Q1. One?
a) x
b) y
Ans: d`)
    expect(items).toHaveLength(0)
  })

  it('returns nothing for empty input', () => {
    expect(parsePastedMCQs('')).toEqual({ items: [], skipped: 0 })
  })
})

describe('parsePastedCards', () => {
  it('reads separator pairs and Q/A pairs', () => {
    const { pairs, skipped } = parsePastedCards(`Army Day - 15 January
Navy Day : 4 December
Q: IAF motto?
A: Touch the sky with glory
just a line`)
    expect(pairs).toEqual([['Army Day', '15 January'], ['Navy Day', '4 December'], ['IAF motto?', 'Touch the sky with glory']])
    expect(skipped).toBe(1)
  })
})

// A cut-down bilingual UPSC paper: cover page, Hindi copies, page furniture, a statement question,
// a passage for two items, a figure question and options split from their letters.
const PAPER = `DTQ-J-ADM
DO NOT OPEN THIS TEST BOOKLET UNTIL YOU ARE ASKED TO DO SO
1. IMMEDIATELY AFTER THE COMMENCEMENT OF THE EXAMINATION, YOU SHOULD CHECK THAT THIS TEST BOOKLET DOES NOT HAVE ANY UNPRINTED PAGES
2. Please note that it is the candidate's responsibility to encode the Roll Number and Test Booklet Series Code
3. Each item is printed both in Hindi and English.
1. Consider the following statements about INS Vikrant:
1. It is India's first indigenous aircraft carrier.
2. It was commissioned in 2022.
Which of the statements given above is/are correct?
(a) 1 only
(b) 2 only
(c) Both 1 and 2
(d) Neither 1 nor 2
1. आईएनएस विक्रांत के बारे में निम्नलिखित कथनों पर विचार कीजिए :
(a) केवल 1
(b) केवल 2
(c) 1 और 2 दोनों
(d) न तो 1, न ही 2
2. Which one of the following rivers flows westward
into the Arabian Sea?
(a) Godavari (b) Krishna
(c) Narmada (d) Mahanadi
2. निम्नलिखित में से कौन-सी नदी पश्चिम की ओर बहती है?
(a) गोदावरी (b) कृष्णा
(c) नर्मदा (d) महानदी
3
SPACE FOR ROUGH WORK
3. In the figure given below, ABCD is a square. What is the area of the shaded region?
(a) 25
(b) 50
(c) 75
(d) 100
3. नीचे दी गई आकृति में
(a) 25
(b) 50
(c) 75
(d) 100
Directions for the following 2 (two) items:
Read the following passage and answer the items that follow.
The army marched at dawn across the frozen pass.
4. What did the army do at dawn?
(a)
Rest
(b)
March
(c)
Retreat
(d)
Camp
5. Where did it march?
(a) Across a river (b) Across a frozen pass (c) Through a forest (d) Along the coast
6. If x + 1/x = 3, what is x² + 1/x²?
(a)
5
(b)
7
(c)
9
(d)
11
P.T.O.`

describe('parsePaper', () => {
  const qs = parsePaper(PAPER)

  it('finds every question once, in order, skipping the cover page and the Hindi copies', () => {
    expect(qs.map(q => q.n)).toEqual([1, 2, 3, 4, 5, 6])
    expect(qs.every(q => q.options.length === 4)).toBe(true)
    expect(qs.some(q => /[ऀ-ॿ]/.test(q.text + q.options.join('')))).toBe(false)
  })

  it('keeps numbered statements inside their question, each on its own line', () => {
    expect(qs[0].text).toBe(`Consider the following statements about INS Vikrant:
1. It is India's first indigenous aircraft carrier.
2. It was commissioned in 2022.
Which of the statements given above is/are correct?`)
    expect(qs[0].options).toEqual(['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'])
  })

  it('joins wrapped question lines and reads two options per line', () => {
    expect(qs[1].text).toBe('Which one of the following rivers flows westward into the Arabian Sea?')
    expect(qs[1].options).toEqual(['Godavari', 'Krishna', 'Narmada', 'Mahanadi'])
  })

  it('flags figure questions', () => {
    expect(qs.map(q => q.figure)).toEqual([false, false, true, false, false, false])
  })

  it('attaches a "following 2 items" passage to exactly two questions', () => {
    expect(qs[3].passage).toMatch(/^Directions for the following 2 \(two\) items: .*frozen pass\.$/)
    expect(qs[4].passage).toBe(qs[3].passage)
    expect(qs[5].passage).toBeUndefined()
  })

  it('reads option values that sit on the line after their letter, numbers included', () => {
    expect(qs[3].options).toEqual(['Rest', 'March', 'Retreat', 'Camp'])
    expect(qs[5].options).toEqual(['5', '7', '9', '11'])
  })

  it('restarts the count when cover instructions were not recognised', () => {
    const out = parsePaper(`1. Candidates must write clearly.
2. All items carry equal marks.
1. Real question?
(a) w (b) x (c) y (d) z
2. Next?
(a) 1 (b) 2 (c) 3 (d) 4`)
    expect(out.map(q => [q.n, q.text])).toEqual([[1, 'Real question?'], [2, 'Next?']])
  })

  it('returns nothing for text with no questions', () => {
    expect(parsePaper('')).toEqual([])
    expect(parsePaper('Just some notes\nwith no numbers')).toEqual([])
  })
})

describe('parseAnswerKey', () => {
  const entries = (raw: string, series?: number) => [...parseAnswerKey(raw, series)]

  it('reads "1 C 2 A" pairs', () => {
    expect(entries('1 C 2 A 3 d 4 b')).toEqual([[1, 2], [2, 0], [3, 3], [4, 1]])
  })

  it('reads one answer per line in several styles, with dropped questions', () => {
    expect(entries('1-(c)\n2. a\n3) D\n4 - b\n5 Dropped\n6 X\n7 *')).toEqual([[1, 2], [2, 0], [3, 3], [4, 1], [5, null], [6, null], [7, null]])
  })

  it('reads a series table and picks the chosen column', () => {
    const table = 'Q.No. A B C D\n1 c a b d\n2 c d a b\n3 b c d a\n4 b X a c'
    expect(answerKeyColumns(table)).toBe(4)
    expect(entries(table)).toEqual([[1, 2], [2, 2], [3, 1], [4, 1]])
    expect(entries(table, 1)).toEqual([[1, 0], [2, 3], [3, 2], [4, null]])
    expect(entries(table, 9)).toEqual([[1, 3], [2, 1], [3, 0], [4, 2]]) // past the last column: the last one
  })

  it('reads a plain string of letters in order', () => {
    expect(entries('CAB DX')).toEqual([[1, 2], [2, 0], [3, 1], [4, 3], [5, null]])
  })

  it('ignores the year and paper name in a key heading', () => {
    expect(entries('Combined Defence Services Examination (II), 2026\nSeries A\n1. c  2. a')).toEqual([[1, 2], [2, 0]])
  })

  it('keeps the first answer when a number repeats', () => {
    expect(entries('1 A\n1 B\n2 C')).toEqual([[1, 0], [2, 2]])
  })

  it('is not a table for one or two rows', () => {
    expect(answerKeyColumns('1 a b\n2 c d')).toBe(0)
    expect(answerKeyColumns('')).toBe(0)
  })
})

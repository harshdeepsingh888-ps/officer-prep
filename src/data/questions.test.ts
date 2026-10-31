import { describe, expect, it } from 'vitest'
import { parseDifficulty, parseQuestionImport, splitCsvLine } from './questions'

describe('parseDifficulty', () => {
  it('maps words and numbers, defaulting to medium', () => {
    expect(['easy', 'E', '1', 'hard', 'H', '3', 'medium', '', undefined, 'whatever'].map(parseDifficulty)).toEqual([1, 1, 1, 3, 3, 3, 2, 2, 2, 2])
  })
})

describe('splitCsvLine', () => {
  it('handles quoted commas and doubled quotes', () => {
    expect(splitCsvLine('"Malabar, an exercise",US,"He said ""go""", x ')).toEqual(['Malabar, an exercise', 'US', 'He said "go"', 'x'])
  })
})

describe('parseQuestionImport (CSV)', () => {
  it('reads rows, skips the header and maps the answer letter', () => {
    const out = parseQuestionImport(`text,optionA,optionB,optionC,optionD,answer,subject,topic,explanation,difficulty
"Exercise Malabar is held between India and —",Japan only,"US, Japan and Australia",France,Russia,B,General Knowledge,Defence,,easy`)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      text: 'Exercise Malabar is held between India and —', options: ['Japan only', 'US, Japan and Australia', 'France', 'Russia'],
      answer: 1, subject: 'General Knowledge', topic: 'Defence', difficulty: 1, explanation: undefined,
    })
  })

  it('drops rows whose answer letter is missing or past the options given', () => {
    const out = parseQuestionImport(`Q one,a,b,,,C,Mathematics,Algebra
Q two,a,b,c,d,Z,Mathematics,Algebra
Q three,a,b,c,,B,Mathematics,Algebra`)
    expect(out.map(q => q.text)).toEqual(['Q three'])
  })

  it('keeps the answer on the right option when a middle column is blank', () => {
    const [q] = parseQuestionImport('Pick d,a,,c,d,D,Reasoning,Series')
    expect(q.options).toEqual(['a', 'c', 'd'])
    expect(q.options[q.answer]).toBe('d')
  })
})

describe('parseQuestionImport (JSON)', () => {
  it('reads an array with letter or index answers', () => {
    const out = parseQuestionImport(JSON.stringify([
      { text: 'One?', options: ['a', 'b'], answer: 'B', subject: 'Reasoning', topic: 'Series', exams: ['afcat'] },
      { text: 'Two?', options: ['a', 'b', 'c'], answer: 2 },
    ]))
    expect(out).toHaveLength(2)
    expect(out[0]).toMatchObject({ answer: 1, subject: 'Reasoning', exams: ['afcat'], difficulty: 2 })
    expect(out[1]).toMatchObject({ answer: 2, subject: 'General Knowledge', topic: 'General' })
    expect(out[1].exams.length).toBeGreaterThan(1)
  })

  it('drops entries with no text, too few options or an answer outside the options', () => {
    const out = parseQuestionImport(JSON.stringify([
      { options: ['a', 'b'], answer: 0 },
      { text: 'One option', options: ['a'], answer: 0 },
      { text: 'Bad index', options: ['a', 'b'], answer: 5 },
      { text: 'Bad letter', options: ['a', 'b'], answer: 'D' },
      { text: 'Fine', options: ['a', 'b'], answer: 'A' },
    ]))
    expect(out.map(q => q.text)).toEqual(['Fine'])
  })

  it('throws on broken JSON so the screen can report it', () => {
    expect(() => parseQuestionImport('[{"text": ')).toThrow()
  })

  it('returns nothing for blank input', () => {
    expect(parseQuestionImport('   ')).toEqual([])
  })
})

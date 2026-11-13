import { describe, expect, it } from 'vitest'
import { EXAMS as APP_EXAMS } from '../data/exams'
import { BUILTIN_QUESTIONS } from '../data/questions'
import { STARTER_DECKS } from '../data/decks'
import { GUIDES } from '../data/study'
import { OFFICIAL_PAPERS } from '../data/sources'
import { ASSURANCES, BENEFITS, CTA, DISCLAIMER, EXAMS, FACTS, FAQ, PROBLEMS, PROOF_LINE, SOLUTION, STEPS, TAGLINE } from './content'

// The landing page may only state facts that are true of the app.
describe('landing page facts', () => {
  it('match the app’s content', () => {
    expect(FACTS.questions).toBe(BUILTIN_QUESTIONS.length)
    expect(FACTS.papers).toBe(OFFICIAL_PAPERS.length)
    expect(FACTS.guides).toBe(GUIDES.length)
    expect(FACTS.exams).toBe(APP_EXAMS.length)
    expect(FACTS.decks).toBe(STARTER_DECKS.length)
    expect([...EXAMS]).toEqual(APP_EXAMS.map(e => e.short))
  })
})

describe('landing page copy', () => {
  const all = [CTA, DISCLAIMER, SOLUTION, ...PROOF_LINE, ...TAGLINE, ...PROBLEMS,
    ...BENEFITS.flatMap(b => [b.title, b.text]), ...STEPS.flatMap(s => [s.title, s.text]),
    ...ASSURANCES.flatMap(a => [a.title, a.text]), ...FAQ.flatMap(f => [f.q, f.a])]

  it('has no hyphens, exclamation marks or banned filler words', () => {
    for (const s of all) {
      expect(s, s).not.toMatch(/-/)
      expect(s, s).not.toMatch(/!/)
      expect(s, s).not.toMatch(/revolutioni[sz]e|supercharge|cutting edge|effortless|transform your workflow|next level|harness the power|world class/i)
    }
  })

  it('has six to twelve FAQ entries, three steps and three to five benefits', () => {
    expect(FAQ.length).toBeGreaterThanOrEqual(6)
    expect(FAQ.length).toBeLessThanOrEqual(12)
    expect(STEPS).toHaveLength(3)
    expect(BENEFITS.length).toBeGreaterThanOrEqual(3)
    expect(BENEFITS.length).toBeLessThanOrEqual(5)
  })

  it('states the tagline in at least two lines', () => {
    expect(TAGLINE.length).toBeGreaterThanOrEqual(2)
  })
})

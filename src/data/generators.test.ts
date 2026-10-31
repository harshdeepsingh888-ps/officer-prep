import { describe, expect, it } from 'vitest'
import { GENERATORS, generate, generatedTopics, hasGenerators } from './generators'

// Every template is run many times with fresh random numbers: each question must be answerable and unambiguous.
const RUNS = 400

describe.each(GENERATORS.map(g => [g.id, g] as const))('generator %s', (_, g) => {
  it(`makes ${RUNS} well-formed questions`, () => {
    for (let i = 0; i < RUNS; i++) {
      const m = g.make()
      const where = `${g.id}: ${m.text}`
      expect(m.text.trim(), where).not.toBe('')
      expect(m.explanation.trim(), where).not.toBe('')
      expect(m.options, where).toHaveLength(4)
      expect(new Set(m.options.map(o => o.trim().toLowerCase())).size, `${where} → ${m.options.join(' | ')}`).toBe(4)
      expect(Number.isInteger(m.answer) && m.answer >= 0 && m.answer < 4, where).toBe(true)
      for (const s of [m.text, m.explanation, ...m.options]) expect(s, where).not.toMatch(/undefined|NaN|Infinity|\[object |-0\b/)
      for (const o of m.options) expect(o.trim(), where).not.toBe('')
    }
  })
})

describe('generate', () => {
  it('honours subject, topic, exam and difficulty filters', () => {
    expect(generate(30, { subject: 'Reasoning' }).every(q => q.subject === 'Reasoning')).toBe(true)
    const topic = generatedTopics('Mathematics')[0]
    expect(generate(20, { topic }).every(q => q.topic === topic)).toBe(true)
    // CDS has no Reasoning paper: none of its generated questions are Reasoning.
    expect(generate(40, { exam: 'cds' }).every(q => q.subject === 'Mathematics' && q.exams.includes('cds'))).toBe(true)
    expect(generate(30, { difficulty: 3 }).every(q => q.difficulty === 3)).toBe(true)
  })

  it('returns the number asked for, with unique ids and no repeated question in a set', () => {
    const qs = generate(200, { subject: 'Mathematics' })
    expect(qs).toHaveLength(200)
    expect(new Set(qs.map(q => q.id)).size).toBe(200)
    expect(new Set(qs.map(q => q.text)).size).toBe(200)
    expect(qs.every(q => q.source === 'Generated' && q.id.startsWith('gen-'))).toBe(true)
  })

  it('cycles through templates so every kind appears', () => {
    const maths = GENERATORS.filter(g => g.subject === 'Mathematics')
    // gen-<template id>-<time>-<seq>; template ids may contain hyphens
    const ids = new Set(generate(maths.length, { subject: 'Mathematics' }).map(q => q.id.slice(4).split('-').slice(0, -2).join('-')))
    expect(ids.size).toBe(maths.length)
  })

  it('returns nothing when nothing matches, or for n ≤ 0', () => {
    expect(generate(10, { subject: 'English' })).toEqual([])
    expect(generate(0)).toEqual([])
    expect(hasGenerators({ subject: 'General Knowledge' })).toBe(false)
    expect(hasGenerators({ subject: 'Mathematics', exam: 'cse' })).toBe(true)
    expect(hasGenerators({ subject: 'Reasoning', exam: 'cds' })).toBe(false)
  })

  it('has unique template ids', () => {
    const ids = GENERATORS.map(g => g.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

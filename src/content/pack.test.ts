import { describe, expect, it } from 'vitest'
import type { Question } from '../data/questions'
import { OFFICIAL_PAPERS } from '../data/sources'
import { changesBetween, checkPack, describeChanges, emptyPack, filesToPack, mergePacks, newId, packToFiles, questionProblem } from './pack'
import type { ContentPack, PubPicture } from './types'

const q = (id: string, over: Partial<Question> = {}): Question => ({
  id, exams: ['cds'], subject: 'General Knowledge', topic: 'Polity', text: `Question ${id}?`, options: ['One', 'Two', 'Three', 'Four'], answer: 1, ...over,
})
const pic = (id: string, over: Partial<PubPicture> = {}): PubPicture => ({ id, file: `${id}.jpg`, test: 'TAT', addedAt: 1, ...over })
const pack = (over: Partial<ContentPack> = {}): ContentPack => ({ ...emptyPack(), ...over, ssb: { ...emptyPack().ssb, ...over.ssb } })

describe('content files', () => {
  it('round-trip: a pack written to files reads back the same', () => {
    const p = pack({
      questions: [q('q-1', { explanation: 'Because.', difficulty: 3, source: 'CDS (I) 2024, Q 3', passage: 'A passage.' })],
      hiddenQuestions: ['b3'],
      pictures: [pic('pic-1', { caption: 'Boy at a river', w: 1600, h: 1200 })],
      ssb: { ...emptyPack().ssb, wat: ['Ambition'], interview: [{ area: 'Motivation', q: 'Why the Army?' }] },
      notes: [{ id: 'n-1', guideId: 'gk-polity', block: { kind: 'table', h: 'Articles', rows: [['Art 14', 'Equality before law']] } }],
      papers: [{ id: 'pp-1', exam: 'cds', sitting: 'CDS (I) 2023', paper: 'English', url: 'https://upsc.gov.in/x.pdf', questions: 120, marks: 100, minutes: 120 }],
      paperKeys: { 'pp-1': 'ABCDX' },
      notices: [{ id: 'notice-1', text: 'Notification out.', link: '#/exams', until: '2027-01-31', tone: 'important' }],
      examDates: { cds: [{ label: 'CDS (I) 2027', date: '2027-04-11', status: 'official' }] },
    })
    const { pack: back, issues, unreadable } = filesToPack(packToFiles(p))
    expect(issues).toEqual([])
    expect(unreadable).toEqual([])
    expect(back).toEqual(p)
    expect(packToFiles(back)).toEqual(packToFiles(p))
  })

  it('missing files mean nothing is published', () => {
    expect(filesToPack({})).toEqual({ pack: emptyPack(), issues: [], unreadable: [] })
  })

  it('leaves out malformed entries and says why, keeping the rest', () => {
    const files = packToFiles(pack({ questions: [q('q-ok')] }))
    const bad = JSON.parse(files['questions.json'])
    bad.questions.push({ ...q('q-bad'), answer: 7 }, { ...q('q-subject'), subject: 'Maths' }, q('q-ok'))
    const { pack: p, issues } = filesToPack({ ...files, 'questions.json': JSON.stringify(bad) })
    expect(p.questions.map(x => x.id)).toEqual(['q-ok'])
    expect(issues.map(i => [i.id, i.text])).toEqual([
      ['q-bad', 'mark the correct option'],
      ['q-subject', 'subject must be one of English, General Knowledge, Mathematics, Reasoning'],
      ['q-ok', 'duplicate id'],
    ])
  })

  it('reports a file that is not JSON as unreadable', () => {
    const r = filesToPack({ 'ssb.json': '<html>', 'questions.json': packToFiles(pack({ questions: [q('q-1')] }))['questions.json'] })
    expect(r.unreadable).toEqual(['ssb.json'])
    expect(r.pack.questions).toHaveLength(1)
  })

  it('checks every kind of entry before a publish', () => {
    const p = pack({
      pictures: [pic('pic-1', { file: '../evil.sh' })],
      notes: [{ id: 'n-1', guideId: 'no-such-topic', block: { kind: 'points', h: 'H', points: ['x'] } }],
      papers: [{ ...OFFICIAL_PAPERS[0], id: OFFICIAL_PAPERS[0].id.toLowerCase().replace(/[^a-z0-9-]/g, '-') + '-x', url: 'http://insecure' }],
      paperKeys: { 'nothing-here': 'AB' },
      notices: [{ id: 'notice-1', text: '', tone: 'info' }],
      examDates: { cds: [{ label: 'CDS', date: '11/04/2027', status: 'official' }] },
    })
    const issues = checkPack(p)
    expect(issues.map(i => `${i.area}: ${i.text}`)).toEqual([
      'Pictures: invalid file name',
      'Notes: unknown study topic',
      'Papers: link must start with https://',
      'Notices: notice text is empty or over 500 characters',
      'Exam dates (cds): date must be a date or blank (to be announced)',
      'Answer keys: no paper with this id',
    ])
    expect(issues.filter(i => i.warn).map(i => i.area)).toEqual(['Answer keys'])
  })

  it('question checks catch what the form could let through', () => {
    expect(questionProblem(q('q-1'))).toBeNull()
    expect(questionProblem(q('q-1', { options: ['Same', 'same'] , answer: 0 }))).toBe('two options are the same')
    expect(questionProblem(q('q-1', { exams: [] }))).toBe('pick at least one exam')
    expect(questionProblem(q('q-1', { topic: ' ' }))).toBe('needs a topic')
  })
})

describe('changes', () => {
  it('counts additions, removals and edits per area', () => {
    const a = pack({ questions: [q('q-1'), q('q-2')], ssb: { ...emptyPack().ssb, wat: ['Snow'] } })
    const b = pack({ questions: [q('q-1', { text: 'Edited?' }), q('q-3')], ssb: { ...emptyPack().ssb, wat: ['Snow', 'Rain'] }, paperKeys: { x: 'A' } })
    expect(changesBetween(a, b)).toEqual([
      { area: 'Questions', added: 1, removed: 1, changed: 1 },
      { area: 'WAT words', added: 1, removed: 0, changed: 0 },
      { area: 'Answer keys', added: 1, removed: 0, changed: 0 },
    ])
    expect(describeChanges(changesBetween(a, b))).toBe('Questions +1 −1 ~1, WAT words +1, Answer keys +1')
    expect(changesBetween(a, a)).toEqual([])
  })
})

describe('merging two people\'s edits', () => {
  const base = pack({ questions: [q('q-1'), q('q-2'), q('q-3')], ssb: { ...emptyPack().ssb, wat: ['Snow', 'Rain'] }, paperKeys: { a: 'AB', b: 'CD' } })

  it('keeps my additions, edits and deletions on top of theirs', () => {
    const mine = pack({ ...base, questions: [q('q-1', { text: 'Mine?' }), q('q-3'), q('q-mine')], ssb: { ...base.ssb, wat: ['Snow', 'Rain', 'Wind'] }, paperKeys: { a: 'AA', b: 'CD' } })
    const theirs = pack({ ...base, questions: [q('q-1'), q('q-2'), q('q-3', { text: 'Theirs?' }), q('q-theirs')], ssb: { ...base.ssb, wat: ['Snow', 'Hail'] }, paperKeys: { a: 'AB', b: 'DD', c: 'X' } })
    const m = mergePacks(base, mine, theirs)
    expect(m.questions.map(x => `${x.id}:${x.text}`)).toEqual([
      'q-1:Mine?', // my edit
      'q-3:Theirs?', // their edit, which I didn't touch; q-2 I deleted
      'q-theirs:Question q-theirs?',
      'q-mine:Question q-mine?',
    ])
    expect(m.ssb.wat).toEqual(['Snow', 'Hail', 'Wind']) // they removed Rain, I added Wind
    expect(m.paperKeys).toEqual({ a: 'AA', b: 'DD', c: 'X' })
  })

  it('my edit survives their deletion', () => {
    const mine = pack({ ...base, questions: [q('q-1'), q('q-2', { text: 'Fixed?' }), q('q-3')] })
    const theirs = pack({ ...base, questions: [q('q-1'), q('q-3')] })
    expect(mergePacks(base, mine, theirs).questions.map(x => x.id)).toEqual(['q-1', 'q-3', 'q-2'])
  })

  it('takes an area whole when only one side changed it (so my reordering survives)', () => {
    const mine = pack({ ...base, questions: [q('q-3'), q('q-1'), q('q-2')] })
    const theirs = pack({ ...base, ssb: { ...base.ssb, gd: ['A GD topic'] } })
    const m = mergePacks(base, mine, theirs)
    expect(m.questions.map(x => x.id)).toEqual(['q-3', 'q-1', 'q-2'])
    expect(m.ssb.gd).toEqual(['A GD topic'])
  })

  it('a draft started from nothing adds to whatever is published', () => {
    const mine = pack({ pictures: [pic('pic-new')] })
    const theirs = pack({ pictures: [pic('pic-live')] })
    expect(mergePacks(emptyPack(), mine, theirs).pictures.map(p => p.id)).toEqual(['pic-live', 'pic-new'])
  })
})

describe('ids', () => {
  it('a bulk import\'s worth of ids made at once are all different and valid', () => {
    const ids = Array.from({ length: 2000 }, () => newId('q'))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => /^[a-z0-9][a-z0-9-]{0,63}$/.test(id))).toBe(true)
  })
})

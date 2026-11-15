import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EXAMS, nextDate } from '../data/exams'
import { BUILTIN_QUESTIONS } from '../data/questions'
import { OFFICIAL_PAPERS } from '../data/sources'
import { WAT_WORDS } from '../data/ssb'
import { db } from '../lib/db'
import { activeNotices, allPapers, datesOf, notesFor, paperKey, picturesFor, questionBank, ssbList } from '.'
import { emptyPack, packToFiles } from './pack'
import { getContent, hydrateContent, refreshContent, resetContentForTests, setPreview } from './store'
import { CONTENT_FILES, type ContentPack } from './types'

const pack = (over: Partial<ContentPack> = {}): ContentPack => ({ ...emptyPack(), ...over, ssb: { ...emptyPack().ssb, ...over.ssb } })
const question = { id: 'q-1', exams: ['cds' as const], subject: 'Reasoning' as const, topic: 'Series', text: 'Next: 1, 2, 4, ?', options: ['6', '8'], answer: 1 }

describe('built-in plus published', () => {
  it('question bank: hidden built-ins go, published ones join', () => {
    const c = pack({ questions: [question], hiddenQuestions: [BUILTIN_QUESTIONS[0].id] })
    const bank = questionBank(c)
    expect(bank).toHaveLength(BUILTIN_QUESTIONS.length)
    expect(bank.some(q => q.id === BUILTIN_QUESTIONS[0].id)).toBe(false)
    expect(bank.at(-1)).toBe(question)
    expect(questionBank(emptyPack())).toBe(BUILTIN_QUESTIONS)
  })

  it('SSB lists: published entries are added once, ignoring case and spacing', () => {
    const c = pack({ ssb: { ...emptyPack().ssb, wat: [WAT_WORDS[0].toUpperCase(), 'Glacier', 'glacier ', 'Avalanche'] } })
    expect(ssbList(c, 'wat')).toEqual([...WAT_WORDS, 'Glacier', 'Avalanche'])
    expect(ssbList(emptyPack(), 'srt')).toHaveLength(60)
  })

  it('pictures marked "both" go to TAT and PPDT', () => {
    const p = (id: string, test: 'TAT' | 'PPDT' | 'both') => ({ id, file: `${id}.jpg`, test, addedAt: 1 })
    const c = pack({ pictures: [p('a', 'TAT'), p('b', 'PPDT'), p('c', 'both')] })
    expect(picturesFor(c, 'TAT').map(x => x.id)).toEqual(['a', 'c'])
    expect(picturesFor(c, 'PPDT').map(x => x.id)).toEqual(['b', 'c'])
  })

  it('notes for a topic, in order', () => {
    const block = (h: string) => ({ kind: 'points' as const, h, points: ['x'] })
    const c = pack({ notes: [{ id: 'n-1', guideId: 'gk-polity', block: block('One') }, { id: 'n-2', guideId: 'gk-economy', block: block('Other') }, { id: 'n-3', guideId: 'gk-polity', block: block('Two') }] })
    expect(notesFor(c, 'gk-polity').map(b => b.h)).toEqual(['One', 'Two'])
  })

  it('papers: published ones slot in by year, newest first; keys are looked up by paper', () => {
    const old = { id: 'pp-1', exam: 'cds' as const, sitting: 'CDS (I) 2023', paper: 'English', url: 'https://x', questions: 120, marks: 100, minutes: 120 }
    const c = pack({ papers: [old], paperKeys: { 'pp-1': 'ABCD' } })
    const all = allPapers(c)
    expect(all).toHaveLength(OFFICIAL_PAPERS.length + 1)
    expect(all.at(-1)).toMatchObject({ id: 'pp-1', size: '' })
    expect(all.slice(0, 3).map(p => p.id)).toEqual(OFFICIAL_PAPERS.slice(0, 3).map(p => p.id))
    expect(paperKey(c, 'pp-1')).toBe('ABCD')
    expect(paperKey(c, undefined)).toBeUndefined()
  })

  it('exam dates: published dates replace the built-in ones, and the countdown follows them', () => {
    const cds = EXAMS.find(e => e.id === 'cds')!
    const c = pack({ examDates: { cds: [{ label: 'CDS (I) 2099', date: '2099-04-11', status: 'official' }] } })
    expect(datesOf(cds, c)).toHaveLength(1)
    expect(datesOf(cds, emptyPack())).toBe(cds.dates)
    expect(nextDate(cds, {}, datesOf(cds, c))).toMatchObject({ label: 'CDS (I) 2099' })
  })

  it('notices stop after their last day', () => {
    const c = pack({ notices: [{ id: 'a', text: 'A', tone: 'info' }, { id: 'b', text: 'B', until: '2027-01-10', tone: 'info' }] })
    expect(activeNotices(c, '2027-01-10').map(n => n.id)).toEqual(['a', 'b'])
    expect(activeNotices(c, '2027-01-11').map(n => n.id)).toEqual(['a'])
  })
})

describe('the content store', () => {
  beforeEach(async () => { resetContentForTests(); await db.published.clear() })
  afterEach(() => resetContentForTests())

  const files = (p: ContentPack) => packToFiles(p) as Record<string, string>
  const serve = (byFile: Record<string, string | number>, type = 'application/json'): typeof fetch => (async (url: string) => {
    const f = CONTENT_FILES.find(x => String(url).endsWith(`/content/${x}`))!
    const v = byFile[f] ?? 404
    return typeof v === 'number' ? new Response('', { status: v }) : new Response(v, { status: 200, headers: { 'content-type': type } })
  }) as unknown as typeof fetch

  it('downloads the published files, keeps a copy, and reads it back on the next start', async () => {
    expect(await refreshContent(serve(files(pack({ questions: [question] }))))).toBe('updated')
    expect(getContent().questions).toEqual([question])
    expect(await refreshContent(serve(files(pack({ questions: [question] }))))).toBe('unchanged')

    resetContentForTests()
    expect(getContent().questions).toEqual([])
    await hydrateContent()
    expect(getContent().questions).toEqual([question])
  })

  it('nothing published yet (404s) means empty content', async () => {
    expect(await refreshContent(serve({}))).toBe('unchanged')
    expect(getContent()).toEqual(emptyPack())
  })

  it('offline or a broken file: the copy already on the device stays', async () => {
    await refreshContent(serve(files(pack({ questions: [question] }))))
    expect(await refreshContent((async () => { throw new TypeError('offline') }) as unknown as typeof fetch)).toBe('offline')
    expect(await refreshContent(serve({ ...files(emptyPack()), 'questions.json': '{oops' }))).toBe('offline')
    expect(await refreshContent(serve({ 'questions.json': 500 }))).toBe('offline')
    expect(getContent().questions).toEqual([question])
  })

  it('a dev server\'s HTML fallback page is not mistaken for content', async () => {
    expect(await refreshContent(serve(Object.fromEntries(CONTENT_FILES.map(f => [f, '<!doctype html>'])), 'text/html'))).toBe('unchanged')
  })

  it('preview shows the draft instead of the published content', async () => {
    await refreshContent(serve(files(pack({ questions: [question] }))))
    setPreview(pack({ ssb: { ...emptyPack().ssb, gd: ['Draft topic'] } }))
    expect(getContent().questions).toEqual([])
    expect(getContent().ssb.gd).toEqual(['Draft topic'])
    setPreview(null)
    expect(getContent().questions).toEqual([question])
  })
})

import { EXAMS, type ExamDate, type ExamId } from '../data/exams'
import type { Question } from '../data/questions'
import { OFFICIAL_PAPERS } from '../data/sources'
import { GUIDES } from '../data/study'
import type { NoteBlock } from '../data/study/types'
import {
  CONTENT_FILES, SSB_LISTS, type ContentFile, type ContentFiles, type ContentPack, type InterviewQ, type Notice,
  type PubNote, type PubPaper, type PubPicture, type SSBListKey,
} from './types'

// The published content as files: serialising, reading back (dropping anything malformed, so one bad entry can
// never break the app), checking before a publish, comparing two versions, and merging two people's edits.

export const SUBJECTS: Question['subject'][] = ['English', 'General Knowledge', 'Mathematics', 'Reasoning']
const EXAM_IDS = EXAMS.map(e => e.id)
const GUIDE_IDS = new Set(GUIDES.map(g => g.id))
const BUILTIN_PAPER_IDS = new Set(OFFICIAL_PAPERS.map(p => p.id))
const ISO = /^\d{4}-\d{2}-\d{2}$/
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

export const emptyPack = (): ContentPack => ({
  questions: [], hiddenQuestions: [], pictures: [],
  ssb: { wat: [], srt: [], tat: [], lecturette: [], gd: [], essay: [], interview: [] },
  notes: [], papers: [], paperKeys: {}, notices: [], examDates: {},
})

let seq = 0
/**
 * A short unique id with a prefix: "q-m3k9x2ab07xyzw". Ids never change once made, so edits merge by id.
 * Time, then a counter (a bulk import makes a hundred in the same millisecond), then randomness (other devices).
 */
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(seq++ % 1296).toString(36).padStart(2, '0')}${Math.random().toString(36).slice(2, 6).padEnd(4, '0')}`

// ── Checks for one entry: the problem, or null when it is fine ─────────

const str = (v: unknown, max = 4000): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const optStr = (v: unknown, max = 4000) => v === undefined || (typeof v === 'string' && v.length <= max)

export function questionProblem(q: Partial<Question>): string | null {
  if (!str(q.id, 64) || !/^[\w-]+$/.test(q.id)) return 'missing or invalid id'
  if (!SUBJECTS.includes(q.subject as Question['subject'])) return `subject must be one of ${SUBJECTS.join(', ')}`
  if (!Array.isArray(q.exams) || !q.exams.length || q.exams.some(e => !EXAM_IDS.includes(e))) return 'pick at least one exam'
  if (!str(q.topic, 120)) return 'needs a topic'
  if (!str(q.text)) return 'question text is empty'
  if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6) return 'needs 2 to 6 options'
  if (q.options.some(o => !str(o, 1000))) return 'an option is empty'
  if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== q.options.length) return 'two options are the same'
  if (!Number.isInteger(q.answer) || q.answer! < 0 || q.answer! >= q.options.length) return 'mark the correct option'
  if (q.difficulty !== undefined && ![1, 2, 3].includes(q.difficulty)) return 'difficulty must be easy, medium or hard'
  if (!optStr(q.explanation) || !optStr(q.source, 200) || !optStr(q.passage, 10000)) return 'a text field is too long'
  return null
}

export function pictureProblem(p: Partial<PubPicture>): string | null {
  if (!str(p.id, 64) || !ID.test(p.id)) return 'missing or invalid id'
  if (!str(p.file, 80) || !/^[a-z0-9-]+\.(jpg|png|webp)$/.test(p.file)) return 'invalid file name'
  if (!['TAT', 'PPDT', 'both'].includes(p.test as string)) return 'test must be TAT, PPDT or both'
  if (typeof p.addedAt !== 'number') return 'missing date'
  if (!optStr(p.caption, 300)) return 'caption is too long'
  return null
}

export function blockProblem(b: Partial<NoteBlock> | undefined): string | null {
  if (!b || !str(b.h, 200)) return 'needs a heading'
  if (b.kind === 'points') return Array.isArray(b.points) && b.points.length && b.points.every(p => str(p)) ? null : 'add at least one point'
  if (b.kind === 'table') return Array.isArray(b.rows) && b.rows.length && b.rows.every(r => Array.isArray(r) && r.length === 2 && str(r[0], 500) && str(r[1])) ? null : 'every row needs a term and a meaning'
  if (b.kind === 'example') return str(b.q) && str(b.a) ? null : 'needs a question and an answer'
  return 'unknown kind of block'
}

export function noteProblem(n: Partial<PubNote>): string | null {
  if (!str(n.id, 64) || !ID.test(n.id)) return 'missing or invalid id'
  if (!n.guideId || !GUIDE_IDS.has(n.guideId)) return 'unknown study topic'
  return blockProblem(n.block)
}

export function paperProblem(p: Partial<PubPaper>): string | null {
  if (!str(p.id, 80) || !ID.test(p.id)) return 'missing or invalid id'
  if (BUILTIN_PAPER_IDS.has(p.id)) return 'id clashes with a built-in paper'
  if (!EXAM_IDS.includes(p.exam as ExamId)) return 'pick an exam'
  if (!str(p.sitting, 80)) return 'needs a sitting, e.g. "CDS (I) 2023"'
  if (!str(p.paper, 120)) return 'needs a paper name'
  if (!str(p.url, 500) || !/^https:\/\/\S+$/.test(p.url)) return 'link must start with https://'
  if (!Number.isInteger(p.questions) || p.questions! < 1 || p.questions! > 300) return 'questions must be 1 to 300'
  if (typeof p.marks !== 'number' || p.marks <= 0) return 'marks must be above 0'
  if (!Number.isInteger(p.minutes) || p.minutes! < 1 || p.minutes! > 600) return 'minutes must be 1 to 600'
  if (!optStr(p.size, 20)) return 'size is too long'
  return null
}

export const keyProblem = (k: unknown): string | null => (typeof k === 'string' && /^[ABCDX]{1,300}$/.test(k) ? null : 'key must be letters A–D (X for dropped)')

export function noticeProblem(n: Partial<Notice>): string | null {
  if (!str(n.id, 64) || !ID.test(n.id)) return 'missing or invalid id'
  if (!str(n.text, 500)) return 'notice text is empty or over 500 characters'
  if (n.link !== undefined && !/^(https:\/\/\S+|#\/\S*)$/.test(n.link)) return 'link must start with https:// or #/'
  if (n.until !== undefined && !ISO.test(n.until)) return 'end date must be a date'
  if (n.tone !== 'info' && n.tone !== 'important') return 'tone must be info or important'
  return null
}

export function examDateProblem(d: Partial<ExamDate>): string | null {
  if (!str(d.label, 80)) return 'needs a label'
  if (d.date !== null && !(typeof d.date === 'string' && ISO.test(d.date))) return 'date must be a date or blank (to be announced)'
  if (d.status !== 'official' && d.status !== 'tentative') return 'status must be official or tentative'
  if (!optStr(d.note, 200)) return 'note is too long'
  return null
}

const listItemProblem = (s: unknown) => (str(s, 600) ? null : 'empty or longer than 600 characters')
const interviewProblem = (x: Partial<InterviewQ>) => (str(x.area, 80) && str(x.q, 600) ? null : 'needs an area and a question')

// ── Normalising: fixed key order, optional fields only when set ─────────
// Two copies of the same content then serialise to the same text, so comparing files compares content.

const opt = <K extends string, V>(k: K, v: V | undefined | '') => (v === undefined || v === '' ? {} : { [k]: v } as Record<K, V>)
/** Trimmed text; tolerant of a missing field, so a malformed draft entry is reported by the checks rather than crashing them. */
const t = (s: unknown) => (typeof s === 'string' ? s.trim() : '')
const tOpt = (s: unknown) => (typeof s === 'string' ? s.trim() : undefined)
const arr = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : [])

export const cleanQuestion = (q: Question): Question => ({
  id: q.id, exams: EXAM_IDS.filter(e => arr(q.exams).includes(e)), subject: q.subject, topic: t(q.topic), text: t(q.text),
  options: arr(q.options).map(t), answer: q.answer,
  ...opt('explanation', tOpt(q.explanation)), ...opt('difficulty', q.difficulty), ...opt('source', tOpt(q.source)), ...opt('passage', tOpt(q.passage)),
})
const cleanPicture = (p: PubPicture): PubPicture => ({ id: p.id, file: p.file, test: p.test, ...opt('caption', tOpt(p.caption)), ...opt('w', p.w), ...opt('h', p.h), addedAt: p.addedAt })
const cleanBlock = (b: NoteBlock): NoteBlock =>
  b?.kind === 'points' ? { kind: 'points', h: t(b.h), points: arr(b.points).map(t) }
  : b?.kind === 'table' ? { kind: 'table', h: t(b.h), rows: arr(b.rows).map(r => [t(r?.[0]), t(r?.[1])] as [string, string]) }
  : b?.kind === 'example' ? { kind: 'example', h: t(b.h), q: t(b.q), a: t(b.a) }
  : b
const cleanNote = (n: PubNote): PubNote => ({ id: n.id, guideId: n.guideId, block: cleanBlock(n.block) })
const cleanPaper = (p: PubPaper): PubPaper => ({
  id: p.id, exam: p.exam, sitting: t(p.sitting), paper: t(p.paper), url: t(p.url),
  questions: p.questions, marks: p.marks, minutes: p.minutes, ...opt('size', tOpt(p.size)),
})
const cleanNotice = (n: Notice): Notice => ({ id: n.id, text: t(n.text), ...opt('link', tOpt(n.link)), ...opt('until', n.until || undefined), tone: n.tone })
const cleanDate = (d: ExamDate): ExamDate => ({ label: t(d.label), date: d.date, status: d.status, ...opt('note', tOpt(d.note)) })

// ── Files ───────────────────────────────────────────────────────

const json = (v: unknown) => JSON.stringify(v, null, 1) + '\n'
const sortedKeys = <T,>(r: Record<string, T>) => Object.fromEntries(Object.keys(r).sort().map(k => [k, r[k]]))

/** The pack as the six files committed to public/content/. */
export function packToFiles(p: ContentPack): ContentFiles {
  return {
    'questions.json': json({ version: 1, questions: p.questions.map(cleanQuestion), hidden: [...p.hiddenQuestions].sort() }),
    'pictures.json': json({ version: 1, pictures: p.pictures.map(cleanPicture) }),
    'ssb.json': json({ version: 1, ...Object.fromEntries(SSB_LISTS.map(k => [k, arr(p.ssb[k]).map(t)])), interview: arr(p.ssb.interview).map(x => ({ area: t(x.area), q: t(x.q) })) }),
    'notes.json': json({ version: 1, notes: p.notes.map(cleanNote) }),
    'papers.json': json({ version: 1, papers: p.papers.map(cleanPaper), keys: sortedKeys(p.paperKeys) }),
    'site.json': json({ version: 1, notices: p.notices.map(cleanNotice), examDates: Object.fromEntries(EXAM_IDS.filter(e => p.examDates[e]).map(e => [e, p.examDates[e]!.map(cleanDate)])) }),
  }
}

/** A problem in the content. `warn`: worth knowing, but it doesn't stop a publish. */
export type Issue = { area: string; id?: string; text: string; warn?: boolean }

/**
 * Reads the files back into a pack. Entries that fail their check are left out and reported, so the app always
 * gets usable content. A file that isn't valid JSON is listed in `unreadable` (and contributes nothing).
 */
export function filesToPack(files: Partial<Record<ContentFile, string>>): { pack: ContentPack; issues: Issue[]; unreadable: ContentFile[] } {
  const pack = emptyPack()
  const issues: Issue[] = []
  const unreadable: ContentFile[] = []
  const read = (f: ContentFile): Record<string, unknown> => {
    const text = files[f]
    if (!text?.trim()) return {}
    try {
      const v = JSON.parse(text)
      if (v && typeof v === 'object' && !Array.isArray(v)) return v
    } catch { /* reported below */ }
    unreadable.push(f)
    issues.push({ area: f, text: 'not a valid content file' })
    return {}
  }
  const keep = <T,>(area: string, list: unknown, check: (x: T) => string | null, idOf?: (x: T) => string): T[] => {
    if (!Array.isArray(list)) return []
    const seen = new Set<string>()
    return list.filter((x: T) => {
      const problem = x && typeof x === 'object' || typeof x === 'string' ? check(x) : 'not an entry'
      const id = idOf && x && typeof x === 'object' ? idOf(x) : undefined
      if (!problem && id !== undefined && seen.has(id)) { issues.push({ area, id, text: 'duplicate id' }); return false }
      if (problem) { issues.push({ area, id, text: problem }); return false }
      if (id !== undefined) seen.add(id)
      return true
    })
  }

  const q = read('questions.json')
  pack.questions = keep<Question>('Questions', q.questions, questionProblem, x => x.id).map(cleanQuestion)
  pack.hiddenQuestions = keep<string>('Hidden questions', q.hidden, s => (str(s, 64) ? null : 'invalid id'))

  pack.pictures = keep<PubPicture>('Pictures', read('pictures.json').pictures, pictureProblem, x => x.id).map(cleanPicture)

  const s = read('ssb.json')
  for (const k of SSB_LISTS) pack.ssb[k] = keep<string>(`SSB ${k}`, s[k], listItemProblem).map(x => x.trim())
  pack.ssb.interview = keep<InterviewQ>('Interview questions', s.interview, interviewProblem).map(x => ({ area: x.area.trim(), q: x.q.trim() }))

  pack.notes = keep<PubNote>('Notes', read('notes.json').notes, noteProblem, x => x.id).map(cleanNote)

  const p = read('papers.json')
  pack.papers = keep<PubPaper>('Papers', p.papers, paperProblem, x => x.id).map(cleanPaper)
  if (p.keys && typeof p.keys === 'object') {
    for (const [id, key] of Object.entries(p.keys as Record<string, unknown>)) {
      const problem = keyProblem(key)
      if (problem) issues.push({ area: 'Answer keys', id, text: problem })
      else pack.paperKeys[id] = key as string
    }
  }

  const site = read('site.json')
  pack.notices = keep<Notice>('Notices', site.notices, noticeProblem, x => x.id).map(cleanNotice)
  if (site.examDates && typeof site.examDates === 'object') {
    for (const [exam, dates] of Object.entries(site.examDates as Record<string, unknown>)) {
      if (!EXAM_IDS.includes(exam as ExamId)) { issues.push({ area: 'Exam dates', id: exam, text: 'unknown exam' }); continue }
      const ok = keep<ExamDate>(`Exam dates (${exam})`, dates, examDateProblem)
      if (ok.length) pack.examDates[exam as ExamId] = ok.map(cleanDate)
    }
  }
  return { pack, issues, unreadable }
}

/** Everything wrong with a pack, before it is published. An empty list means it can go out. */
export function checkPack(p: ContentPack): Issue[] {
  const { issues } = filesToPack(packToFiles(p))
  // Keys and hidden ids that point at nothing are harmless, but worth knowing about.
  const paperIds = new Set([...BUILTIN_PAPER_IDS, ...p.papers.map(x => x.id)])
  for (const id of Object.keys(p.paperKeys)) if (!paperIds.has(id)) issues.push({ area: 'Answer keys', id, text: 'no paper with this id', warn: true })
  return issues
}

// ── Comparing two versions ──────────────────────────────────────────

export type Change = { area: string; added: number; removed: number; changed: number }

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function diffById<T extends { id: string }>(area: string, a: T[], b: T[]): Change {
  const before = new Map(a.map(x => [x.id, x]))
  const after = new Map(b.map(x => [x.id, x]))
  return {
    area,
    added: b.filter(x => !before.has(x.id)).length,
    removed: a.filter(x => !after.has(x.id)).length,
    changed: b.filter(x => before.has(x.id) && !same(before.get(x.id), x)).length,
  }
}
function diffList(area: string, a: string[], b: string[]): Change {
  const before = new Set(a), after = new Set(b)
  return { area, added: b.filter(x => !before.has(x)).length, removed: a.filter(x => !after.has(x)).length, changed: 0 }
}
function diffRecord(area: string, a: Record<string, unknown>, b: Record<string, unknown>): Change {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  let added = 0, removed = 0, changed = 0
  for (const k of keys) {
    if (!(k in a)) added++
    else if (!(k in b)) removed++
    else if (!same(a[k], b[k])) changed++
  }
  return { area, added, removed, changed }
}

export const SSB_LABEL: Record<SSBListKey, string> = { wat: 'WAT words', srt: 'SRT situations', tat: 'TAT scenes', lecturette: 'Lecturette topics', gd: 'GD topics', essay: 'Essay topics' }
const interviewKey = (x: InterviewQ) => `${x.area}\u0000${x.q}`

/** What changed from `a` to `b`, area by area; areas with no change are left out. Both are normalised first. */
export function changesBetween(a: ContentPack, b: ContentPack): Change[] {
  const x = filesToPack(packToFiles(a)).pack, y = filesToPack(packToFiles(b)).pack
  return [
    diffById('Questions', x.questions, y.questions),
    diffList('Hidden built-in questions', x.hiddenQuestions, y.hiddenQuestions),
    diffById('Pictures', x.pictures, y.pictures),
    ...SSB_LISTS.map(k => diffList(SSB_LABEL[k], x.ssb[k], y.ssb[k])),
    diffList('Interview questions', x.ssb.interview.map(interviewKey), y.ssb.interview.map(interviewKey)),
    diffById('Notes', x.notes, y.notes),
    diffById('Papers', x.papers, y.papers),
    diffRecord('Answer keys', x.paperKeys, y.paperKeys),
    diffById('Notices', x.notices, y.notices),
    diffRecord('Exam dates', x.examDates, y.examDates),
  ].filter(c => c.added || c.removed || c.changed)
}

export const changeCount = (cs: Change[]) => cs.reduce((s, c) => s + c.added + c.removed + c.changed, 0)

export function describeChanges(cs: Change[]): string {
  if (!cs.length) return 'No changes'
  return cs.map(c => {
    const parts = [c.added && `+${c.added}`, c.removed && `−${c.removed}`, c.changed && `~${c.changed}`].filter(Boolean)
    return `${c.area} ${parts.join(' ')}`
  }).join(', ')
}

// ── Merging ─────────────────────────────────────────────────────────
// `base` is what this draft started from, `mine` is the draft, `theirs` is what is published now (someone else
// may have published in between). Each of my additions, edits and deletions is applied on top of theirs;
// where we both edited the same entry, mine wins. Untouched areas are taken whole from whichever side changed.

function mergeById<T extends { id: string }>(base: T[], mine: T[], theirs: T[]): T[] {
  if (same(theirs, base)) return mine
  if (same(mine, base)) return theirs
  const b = new Map(base.map(x => [x.id, x]))
  const m = new Map(mine.map(x => [x.id, x]))
  const edited = (x: T) => !b.has(x.id) || !same(b.get(x.id), x)
  const out = theirs
    .filter(t => !(b.has(t.id) && !m.has(t.id))) // I deleted it
    .map(t => (m.has(t.id) && edited(m.get(t.id)!) ? m.get(t.id)! : t))
  const have = new Set(out.map(x => x.id))
  for (const x of mine) if (!have.has(x.id) && edited(x)) out.push(x) // added by me, or edited by me and deleted by them
  return out
}

function mergeList<T>(base: T[], mine: T[], theirs: T[], key: (x: T) => string = x => String(x)): T[] {
  if (same(theirs, base)) return mine
  if (same(mine, base)) return theirs
  const b = new Set(base.map(key)), m = new Set(mine.map(key))
  const out = theirs.filter(t => !(b.has(key(t)) && !m.has(key(t))))
  const have = new Set(out.map(key))
  for (const x of mine) if (!b.has(key(x)) && !have.has(key(x))) { out.push(x); have.add(key(x)) }
  return out
}

function mergeRecord<T>(base: Partial<Record<string, T>>, mine: Partial<Record<string, T>>, theirs: Partial<Record<string, T>>): Record<string, T> {
  const out: Record<string, T> = {}
  for (const k of new Set([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)])) {
    const v = same(mine[k], base[k]) ? theirs[k] : mine[k]
    if (v !== undefined) out[k] = v
  }
  return out
}

export function mergePacks(base: ContentPack, mine: ContentPack, theirs: ContentPack): ContentPack {
  const ssb = { interview: mergeList(base.ssb.interview, mine.ssb.interview, theirs.ssb.interview, interviewKey) } as ContentPack['ssb']
  for (const k of SSB_LISTS) ssb[k] = mergeList(base.ssb[k], mine.ssb[k], theirs.ssb[k])
  return {
    questions: mergeById(base.questions, mine.questions, theirs.questions),
    hiddenQuestions: mergeList(base.hiddenQuestions, mine.hiddenQuestions, theirs.hiddenQuestions),
    pictures: mergeById(base.pictures, mine.pictures, theirs.pictures),
    ssb,
    notes: mergeById(base.notes, mine.notes, theirs.notes),
    papers: mergeById(base.papers, mine.papers, theirs.papers),
    paperKeys: mergeRecord(base.paperKeys, mine.paperKeys, theirs.paperKeys),
    notices: mergeById(base.notices, mine.notices, theirs.notices),
    examDates: mergeRecord(base.examDates, mine.examDates, theirs.examDates),
  }
}

/** The files that differ between two sets (a missing file counts as empty). */
export const changedFiles = (a: Partial<ContentFiles>, b: Partial<ContentFiles>) => CONTENT_FILES.filter(f => (a[f] ?? '') !== (b[f] ?? ''))

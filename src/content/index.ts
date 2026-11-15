import type { Exam, ExamDate } from '../data/exams'
import { BUILTIN_QUESTIONS, type Question } from '../data/questions'
import { OFFICIAL_PAPERS, type OfficialPaper } from '../data/sources'
import { ESSAY_TOPICS, GD_TOPICS, LECTURETTE_TOPICS, SRT_SITUATIONS, TAT_SCENES, WAT_WORDS } from '../data/ssb'
import type { NoteBlock } from '../data/study/types'
import type { ContentPack, Notice, PubPicture, SSBListKey } from './types'

// Built-in content plus what the owner has published, as the pages use it.

export { getContent, useContent, usePreviewing, pictureUrl } from './store'
export type { ContentPack } from './types'

/** Every question students can practise: built-in (minus any the owner hid) and published. */
export function questionBank(c: ContentPack): Question[] {
  const hidden = new Set(c.hiddenQuestions)
  const builtIn = hidden.size ? BUILTIN_QUESTIONS.filter(q => !hidden.has(q.id)) : BUILTIN_QUESTIONS
  return c.questions.length ? [...builtIn, ...c.questions] : builtIn
}

export const BUILTIN_SSB: Record<SSBListKey, string[]> = {
  wat: WAT_WORDS, srt: SRT_SITUATIONS, tat: TAT_SCENES, lecturette: LECTURETTE_TOPICS, gd: GD_TOPICS, essay: ESSAY_TOPICS,
}

/** A comparison key: the same entry in different case or spacing counts once. */
export const listKey = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** A built-in SSB list plus the published entries, each entry once. */
export function ssbList(c: ContentPack, key: SSBListKey): string[] {
  const extra = c.ssb[key]
  if (!extra.length) return BUILTIN_SSB[key]
  const seen = new Set(BUILTIN_SSB[key].map(listKey))
  return [...BUILTIN_SSB[key], ...extra.filter(s => !seen.has(listKey(s)) && seen.add(listKey(s)))]
}

/** Published pictures for a test (pictures marked "both" go to either). */
export const picturesFor = (c: ContentPack, test: 'TAT' | 'PPDT'): PubPicture[] => c.pictures.filter(p => p.test === test || p.test === 'both')

/** The published note blocks for a study guide, in order. */
export const notesFor = (c: ContentPack, guideId: string): NoteBlock[] => c.notes.filter(n => n.guideId === guideId).map(n => n.block)

const yearOf = (p: { sitting: string }) => Number(p.sitting.match(/\b(19|20)\d{2}\b/)?.[0] ?? 0)

/** Built-in and published papers, newest year first (papers of the same year keep their order). */
export function allPapers(c: ContentPack): OfficialPaper[] {
  if (!c.papers.length) return OFFICIAL_PAPERS
  const extra = c.papers.map(p => ({ ...p, size: p.size ?? '' }))
  return [...OFFICIAL_PAPERS, ...extra].map((p, i) => ({ p, i })).sort((a, b) => yearOf(b.p) - yearOf(a.p) || a.i - b.i).map(x => x.p)
}

export const paperKey = (c: ContentPack, paperId: string | undefined): string | undefined => (paperId ? c.paperKeys[paperId] : undefined)

/** An exam's dates: the published ones when the owner has set them, otherwise the built-in ones. */
export const datesOf = (exam: Exam, c: ContentPack): ExamDate[] => c.examDates[exam.id] ?? exam.dates

/** Notices still running today (an end date is the last day shown). */
export const activeNotices = (c: ContentPack, today: string): Notice[] => c.notices.filter(n => !n.until || n.until >= today)

import type { ExamDate, ExamId } from '../data/exams'
import type { Question } from '../data/questions'
import type { OfficialPaper } from '../data/sources'
import type { NoteBlock } from '../data/study/types'

// Content the site owner publishes from the admin panel (#/admin). It is committed to public/content/ in the
// repository, deployed with the site, and every device downloads it on start and keeps a copy for offline use.
// Published content adds to what is built into the app; it never replaces the built-in questions or lists
// (a built-in question can be hidden, and an exam's dates can be overridden).

export type PictureTest = 'TAT' | 'PPDT' | 'both'
/** A practice picture: the file sits in public/content/pictures/. The caption is for the owner and labels saved answers. */
export type PubPicture = { id: string; file: string; test: PictureTest; caption?: string; w?: number; h?: number; addedAt: number }
/** An extra block of notes on a study guide's topic page, shown after the built-in notes. */
export type PubNote = { id: string; guideId: string; block: NoteBlock }
export type PubPaper = Omit<OfficialPaper, 'size'> & { size?: string }
export type Notice = { id: string; text: string; link?: string; until?: string; tone: 'info' | 'important' }
export type InterviewQ = { area: string; q: string }

export const SSB_LISTS = ['wat', 'srt', 'tat', 'lecturette', 'gd', 'essay'] as const
export type SSBListKey = (typeof SSB_LISTS)[number]
export type SSBContent = Record<SSBListKey, string[]> & { interview: InterviewQ[] }

export type ContentPack = {
  questions: Question[]
  /** Built-in question ids that students no longer see (a wrong answer, a dated fact). */
  hiddenQuestions: string[]
  pictures: PubPicture[]
  ssb: SSBContent
  notes: PubNote[]
  papers: PubPaper[]
  /** Answer keys by paper id (built-in or published), as letters A–D, X for a dropped question. */
  paperKeys: Record<string, string>
  notices: Notice[]
  /** Replaces an exam's built-in dates when set. */
  examDates: Partial<Record<ExamId, ExamDate[]>>
}

export const CONTENT_FILES = ['questions.json', 'pictures.json', 'ssb.json', 'notes.json', 'papers.json', 'site.json'] as const
export type ContentFile = (typeof CONTENT_FILES)[number]
export type ContentFiles = Record<ContentFile, string>

/** Where the files live in the repository (Vite copies public/ to the site root). */
export const CONTENT_DIR = 'public/content'
export const PICTURE_DIR = 'public/content/pictures'

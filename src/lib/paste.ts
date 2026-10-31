// Forgiving parsers for content you copy from Telegram posts, PDFs or notes.

export type PastedMCQ = { text: string; options: string[]; answer: number; explanation?: string }

const OPTION = /^[(\[]?([a-dA-D])[)\].:\-]\s*(.+)$/
const INLINE_OPTIONS = /[(\[]?\b([a-dA-D])[)\]]\s*/g
const ANSWER = /^(?:ans(?:wer)?|correct(?:\s+answer)?|right\s+answer)\s*(?:is)?\s*[:.\-–]?\s*[(\[]?([a-dA-D])\b/i
const EXPLANATION = /^(?:explanation|exp|expl|solution|sol|reason)\s*[:.\-–]\s*(.+)$/i
const QUESTION_PREFIX = /^(?:q(?:ue(?:stion)?)?\s*\.?\s*\d*\s*[.):\-]?|\d+\s*[.)])\s*/i
const TICK = /\s*(✅|✔️|✔|☑️|\(correct\))\s*$/i

/** Drop leading emoji, bullets and decorations ("📌", "🔰", "➡️") but keep "(a)". */
const clean = (s: string) => s.replace(/^[^\p{L}\p{N}(\[]+/u, '').replace(/\s+/g, ' ').trim()

/**
 * Splits pasted text into multiple-choice questions. Understands the common formats:
 *   Q1. Question?      a) one  b) two      (options on one line or separate lines)
 *   Ans: b             Answer – (B)        or a ✅ after the right option
 *   Explanation: …
 */
export function parsePastedMCQs(raw: string): { items: PastedMCQ[]; skipped: number } {
  const items: PastedMCQ[] = []
  let skipped = 0
  let q: { text: string[]; options: string[]; answer: number; explanation?: string } | null = null

  const flush = () => {
    if (!q) return
    const text = q.text.join(' ').trim()
    if (text && q.options.length >= 2 && q.answer >= 0 && q.answer < q.options.length) {
      items.push({ text, options: q.options, answer: q.answer, explanation: q.explanation })
    } else if (text || q.options.length) skipped++
    q = null
  }

  let blankBefore = false
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = clean(rawLine)
    if (!line) { blankBefore = true; continue }
    const afterBlank = blankBefore
    blankBefore = false

    const ans = line.match(ANSWER)
    if (ans && q) { q.answer = 'abcd'.indexOf(ans[1].toLowerCase()); continue }

    const exp = line.match(EXPLANATION)
    if (exp && q) { q.explanation = exp[1].trim(); continue }

    const inline = [...line.matchAll(INLINE_OPTIONS)]
    if (inline.length >= 2 && inline[0].index === 0 && q) {
      // "a) X b) Y c) Z d) W" on one line
      inline.forEach((m, i) => {
        const end = i + 1 < inline.length ? inline[i + 1].index : line.length
        addOption(q!, line.slice(m.index! + m[0].length, end))
      })
      continue
    }

    const opt = line.match(OPTION)
    if (opt && q && q.text.length) { addOption(q, opt[2]); continue }

    // Anything else continues the explanation or the question text, or starts a new question.
    const startsQuestion = QUESTION_PREFIX.test(line)
    if (q && q.explanation !== undefined && !startsQuestion && !afterBlank) { q.explanation += ' ' + line; continue }
    if (q && q.options.length === 0 && !startsQuestion) { q.text.push(line); continue }
    flush()
    q = { text: [line.replace(QUESTION_PREFIX, '')], options: [], answer: -1 }
  }
  flush()
  return { items, skipped }
}

function addOption(q: { options: string[]; answer: number }, rawText: string) {
  let text = rawText.trim()
  if (TICK.test(text)) { q.answer = q.options.length; text = text.replace(TICK, '').trim() }
  if (text) q.options.push(text)
}

/**
 * Flashcards from lines like "Front - Back", "Front : Back", "Front | Back", "Front → Back",
 * or Q:/A: pairs on consecutive lines.
 */
export function parsePastedCards(raw: string): { pairs: [string, string][]; skipped: number } {
  const pairs: [string, string][] = []
  let skipped = 0
  let pendingQ: string | null = null
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = clean(rawLine)
    if (!line) continue
    const qa = line.match(/^(q|a)\s*[:.\-]\s*(.+)$/i)
    if (qa) {
      if (qa[1].toLowerCase() === 'q') pendingQ = qa[2].trim()
      else if (pendingQ) { pairs.push([pendingQ, qa[2].trim()]); pendingQ = null }
      continue
    }
    const m = line.match(/^(.+?)\s+(?:[-–—=:|→]|->|=>)\s+(.+)$/) ?? line.match(/^(.+?)\s*[:|→]\s*(.+)$/)
    if (m) pairs.push([m[1].trim(), m[2].trim()])
    else skipped++
  }
  return { pairs, skipped }
}

// ── Past papers ──────────────────────────────────────────────────

export type PaperQuestion = { n: number; text: string; options: string[]; passage?: string; figure: boolean }

const DEVANAGARI = /[\u0900-\u097F]/
// Page furniture that PDF copying drags along: rough-work boxes, "P.T.O.", bare page numbers, booklet codes (DTQ-J-ADM).
const PAGE_NOISE = /^(?:space for rough work|rough work|\[?\s*p\.\s*t\.\s*o\.?\s*\]?|\d{1,3}|\(\s*\d{1,3}\s*\))$/i
const BOOKLET_CODE = /^[A-Z0-9]+(?:-[A-Z0-9]+)+$/
const PAPER_Q = /^(\d{1,3})\s*[.)]\s*(.*)$/
const PAPER_OPTION = /^\(([a-d])\)\s*(.*)$/
const PAPER_INLINE = /\(([a-d])\)\s*/g
const DIRECTIONS = /^(?:directions?\b|passage\b|read the (?:following )?passage)/i
const FIGURE = /\b(?:figure|diagram|graph|bar chart|pie chart|shown (?:below|above)|adjoining)\b/i
// The cover page's instructions are numbered too; the last line mentioning one of these ends the cover.
const COVER = /test booklet|answer sheet|penalty|invigilator|roll number|do not open/i
const COUNT = /following\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i
const ITEM = /^(?:\d{1,2}\.|\([ivx]+\)|[A-D]\.|list\s*-?\s*i)\s/i
const ASK = /^(?:which|select|how many|choose)\b/i
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

/**
 * Splits text copied from a UPSC question paper into numbered questions with options (a)–(d).
 * The cover page is skipped, Hindi lines are dropped (bilingual papers repeat every question in Hindi), and
 * "1." statements inside a question stay in its text: only the next number after a question's options starts a
 * new one. A "Directions for the following 5 (five) items" passage is attached to those five questions.
 */
export function parsePaper(raw: string): PaperQuestion[] {
  const out: PaperQuestion[] = []
  type Open = { n: number; lines: string[]; options: string[]; passage?: string; closed: boolean }
  let q: Open | null = null
  let passage: { text: string; left: number } | undefined
  let collecting: string[] | null = null

  const lines = raw.split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim())
  const firstOption = lines.findIndex(l => PAPER_OPTION.test(l))
  let coverEnd = -1
  lines.forEach((l, i) => { if ((firstOption < 0 || i < firstOption) && COVER.test(l)) coverEnd = i })

  const flush = () => {
    if (!q) return
    // Numbered statements and list items keep their own lines, and so does the ask after them.
    const text = q.lines.reduce((t, l, i) => {
      const br = i > 0 && (ITEM.test(l) || (ASK.test(l) && q!.lines.slice(0, i).some(x => ITEM.test(x))))
      return t + (br ? '\n' : ' ') + l
    }, '').trim()
    out.push({ n: q.n, text, options: q.options.map(o => o.trim()), passage: q.passage, figure: FIGURE.test(text) })
    q = null
  }
  const addOption = (letter: string, text: string) => {
    if (!q) return
    if (q.options.length < 4 && letter === 'abcd'[q.options.length]) q.options.push(text)
    else if (q.options.length >= 4) q.closed = true // the Hindi copy's options (numbers survive the filter): ignore
  }

  for (const line of lines.slice(coverEnd + 1)) {
    if (!line || DEVANAGARI.test(line) || BOOKLET_CODE.test(line)) continue
    // A bare number is a page number, unless an option letter on the line before is waiting for its value.
    const waiting: boolean = !!q && !q.closed && q.options.length > 0 && !q.options[q.options.length - 1].trim()
    if (PAGE_NOISE.test(line) && !waiting) continue

    if (DIRECTIONS.test(line) && !collecting) { flush(); collecting = [line]; continue }

    const start: RegExpMatchArray | null = waiting ? null : line.match(PAPER_Q)
    if (start) {
      const n: number = Number(start[1])
      // Cover instructions the COVER test missed: a "1." before any question has options restarts the count.
      const restart = !out.length && q && !q.options.length && n === 1 && q.n !== 1
      if (restart) q = null
      if (!q || (n === q.n + 1 && q.options.length >= 2) || (q.options.length >= 4 && n > q.n)) {
        flush()
        if (collecting) {
          // Without a count the passage runs until the next "Directions".
          const text = collecting.join(' ')
          const count = text.match(COUNT)?.[1].toLowerCase()
          passage = { text, left: count ? (/\d/.test(count) ? Number(count) : WORDS.indexOf(count)) : Infinity }
          collecting = null
        }
        q = { n, lines: [start[2]], options: [], passage: passage && passage.left > 0 ? passage.text : undefined, closed: false }
        if (passage) passage.left--
        continue
      }
    }
    if (collecting) { collecting.push(line); continue }
    if (!q) continue

    const inline = [...line.matchAll(PAPER_INLINE)]
    if (inline.length >= 2 && inline[0].index === 0) {
      inline.forEach((m, i) => addOption(m[1], line.slice(m.index! + m[0].length, i + 1 < inline.length ? inline[i + 1].index : line.length).trim()))
      continue
    }
    const opt = line.match(PAPER_OPTION)
    if (opt) { addOption(opt[1], opt[2]); continue }

    // A wrapped line continues the last option, or the question if no option has started.
    if (q.closed) continue
    if (q.options.length) q.options[q.options.length - 1] += ' ' + line
    else q.lines.push(line)
  }
  flush()
  return out
}

const KEY_CELL = /^(?:\(?([a-d])\)?|(dropped|deleted|x|\*))$/i
const keyCell = (s: string) => {
  const m = s.match(KEY_CELL)
  return !m ? undefined : m[1] ? 'abcd'.indexOf(m[1].toLowerCase()) : null
}

/** Rows of an answer-key table: a question number followed by two or more answer cells. Trusted only when there are several. */
function keyTable(raw: string): string[][] {
  const rows = raw.split(/\r?\n/).map(l => l.trim().split(/[\s,|]+/))
    .filter(c => /^\d{1,3}[.):]?$/.test(c[0]) && c.length >= 3 && c.slice(1).every(x => keyCell(x) !== undefined))
  return rows.length >= 3 ? rows : []
}

/** How many booklet-series columns an answer-key table has; 0 when the key isn't a table. */
export const answerKeyColumns = (raw: string) => Math.max(0, ...keyTable(raw).map(c => c.length - 1))

/**
 * Answer keys as UPSC and coaching sites print them: "1 B 2 C", "1-(b)", "1. c" one per line, a table row per
 * question with one column per booklet series ("1 b c a d", pick the column with `series`), or a plain string
 * of letters ("bcadd…"). Questions marked dropped / deleted / X / * map to null (UPSC gives everyone their marks).
 */
export function parseAnswerKey(raw: string, series = 0): Map<number, number | null> {
  const key = new Map<number, number | null>()
  const put = (n: number, v: number | null | undefined) => {
    if (v !== undefined && n >= 1 && n <= 300 && !key.has(n)) key.set(n, v)
  }

  const rows = keyTable(raw)
  if (rows.length) {
    for (const c of rows) put(parseInt(c[0]), keyCell(c[1 + Math.min(series, c.length - 2)]))
    return key
  }

  // Pairs anywhere in the text: "1 B", "1-(b)", "12. c", "45 Dropped".
  const pairs = [...raw.matchAll(/(?<![\d.])(\d{1,3})\s*[).:\-–=]?\s*(?:\(\s*([a-dA-D])\s*\)|([a-dA-D])(?![a-zA-Z])|(dropped|deleted|x(?![a-zA-Z])|\*))/gi)]
  for (const m of pairs) put(Number(m[1]), m[2] ?? m[3] ? 'abcd'.indexOf((m[2] ?? m[3]).toLowerCase()) : null)
  if (key.size) return key

  // A bare string of letters, in question order; X or * for a dropped question.
  const letters = raw.split(/[\s,;|]+/).filter(t => /^[a-dA-DxX*]+$/.test(t)).join('')
  ;[...letters].forEach((ch, i) => put(i + 1, /[xX*]/.test(ch) ? null : 'abcd'.indexOf(ch.toLowerCase())))
  return key
}

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

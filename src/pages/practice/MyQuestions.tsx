import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, type ExamId } from '../../data/exams'
import { DIFFICULTY_LABEL, difficultyOf, parseQuestionImport, type Difficulty, type Question } from '../../data/questions'
import { OFFICIAL_PAPERS } from '../../data/sources'
import { db } from '../../lib/db'
import { answerKeyColumns, parseAnswerKey, parsePaper, parsePastedMCQs } from '../../lib/paste'
import { downloadText, todayISO } from '../../lib/util'
import { Badge, Button, Card, Empty, inputBase, inputCls, labelCls } from '../../components/ui'

const SUBJECTS: Question['subject'][] = ['English', 'General Knowledge', 'Mathematics', 'Reasoning']
const SAMPLE_CSV = 'text,optionA,optionB,optionC,optionD,answer,subject,topic,explanation,difficulty\n"Exercise Malabar is held between India and —",Japan only,"US, Japan and Australia",France,Russia,B,General Knowledge,Defence,,easy'
const SAMPLE_PASTE = `📌 Q1. Exercise Garuda is conducted between India and which country?
a) USA  b) France  c) Russia  d) Japan
✅ Ans: b
Explanation: Garuda is the India–France air exercise.

Q2. Who was the first Chief of Defence Staff of India?
(a) Gen M M Naravane
(b) Gen Bipin Rawat ✅
(c) Gen Anil Chauhan
(d) Adm Karambir Singh`
const SAMPLE_PAPER = `1. Consider the following statements about INS Vikrant:
1. It is India's first indigenous aircraft carrier.
2. It was commissioned in 2022.
Which of the statements given above is/are correct?
(a) 1 only
(b) 2 only
(c) Both 1 and 2
(d) Neither 1 nor 2
1. आईएनएस विक्रांत के बारे में निम्नलिखित कथनों पर विचार कीजिए :
(a) केवल 1 (b) केवल 2
(c) 1 और 2 दोनों (d) न तो 1, न ही 2
2. Which one of the following rivers flows westward into the Arabian Sea?
(a) Godavari (b) Krishna
(c) Narmada (d) Mahanadi
2. निम्नलिखित में से कौन-सी नदी पश्चिम की ओर बहकर अरब सागर में गिरती है?
(a) गोदावरी (b) कृष्णा
(c) नर्मदा (d) महानदी
3. In the figure given below, ABCD is a square of side 10 cm. What is the area of the shaded region?
(a) 25 cm² (b) 50 cm² (c) 75 cm² (d) 100 cm²`
const SAMPLE_KEY = '1 C  2 C  3 B'
const PAPER_HINT = `Open the PDF, select all (Ctrl+A), copy and paste here.
Hindi lines, the cover page and page numbers are dropped.

1. Which one of the following …
(a) …  (b) …
(c) …  (d) …`
const KEY_HINT = `1 C  2 A  3 D …
or 1-(c) per line
or a table: 1 c a b d
or CADB…`

/** The subject a paper's questions default to; mixed papers (CAPF, GS) default to GK. */
const subjectFor = (paper: string): Question['subject'] =>
  /english/i.test(paper) ? 'English' : /math/i.test(paper) ? 'Mathematics' : /csat/i.test(paper) ? 'Reasoning' : 'General Knowledge'

function TagFields({ subject, setSubject, topic, setTopic, difficulty, setDifficulty }: {
  subject: Question['subject']; setSubject: (s: Question['subject']) => void; topic: string; setTopic: (t: string) => void
  difficulty: Difficulty; setDifficulty: (d: Difficulty) => void
}) {
  return (
    <>
      <div>
        <label className={labelCls}>Subject</label>
        <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value as Question['subject'])}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      <div><label className={labelCls}>Topic</label><input className={inputCls} value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Defence" /></div>
      <div>
        <label className={labelCls}>Difficulty</label>
        <select className={inputCls} value={difficulty} onChange={e => setDifficulty(Number(e.target.value) as Difficulty)}>
          {([1, 2, 3] as Difficulty[]).map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d]}</option>)}
        </select>
      </div>
    </>
  )
}

function ExamChecks({ exams, setExams }: { exams: ExamId[]; setExams: (e: ExamId[]) => void }) {
  return (
    <div className="flex flex-wrap gap-4 body-6">
      {EXAMS.map(e => (
        <label key={e.id} className="flex items-center gap-1 pointer-coarse:py-2">
          <input type="checkbox" className="accent-accent-500" checked={exams.includes(e.id)} onChange={ev => setExams(ev.target.checked ? [...exams, e.id] : exams.filter(x => x !== e.id))} />{e.short}
        </label>
      ))}
    </div>
  )
}

export default function MyQuestions({ paperId }: { paperId?: string }) {
  const qs = useLiveQuery(() => db.questions.toArray(), []) ?? []
  const [msg, setMsg] = useState('')

  return (
    <div className="space-y-4">
      <PaperImport key={paperId} paperId={paperId} have={qs} onDone={setMsg} />
      <PasteImport onDone={setMsg} />
      <AddQuestion onDone={setMsg} />
      <BulkImport onDone={setMsg} />
      {msg && <p className="body-6 text-verdant-300">{msg}</p>}

      <Card title={`My bank (${qs.length})`} action={qs.length > 0 && <Button variant="ghost" size="sm" onClick={() => downloadText(`my-questions-${todayISO()}.json`, JSON.stringify(qs.map(q => { const c = { ...q }; delete c.id; return c }), null, 1))}>Export JSON</Button>}>
        {qs.length === 0 ? <Empty>No questions yet.</Empty> : (
          <ul className="divide-y divide-line">
            {qs.map(q => (
              <li key={q.id} className="flex items-start gap-3 py-3 body-6">
                <div className="min-w-0 flex-1">
                  <div className="text-ink-100">{q.text}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 caption-5 text-ink-500">
                    <span>{q.subject} · {q.topic} · Ans {'ABCD'[q.answer]}. {q.options[q.answer]}</span>
                    <Badge>{DIFFICULTY_LABEL[difficultyOf(q)]}</Badge>
                    {q.source && <span>· {q.source}</span>}
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => db.questions.delete(q.id!)}>✕</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/** A UPSC paper's text plus its answer key, turned into questions in your bank. */
function PaperImport({ paperId, have, onDone }: { paperId?: string; have: { source?: string }[]; onDone: (m: string) => void }) {
  const initial = OFFICIAL_PAPERS.find(p => p.id === paperId)
  const [id, setId] = useState(initial?.id ?? OFFICIAL_PAPERS[0].id)
  const paper = OFFICIAL_PAPERS.find(p => p.id === id)
  const [other, setOther] = useState('')
  const [subject, setSubject] = useState<Question['subject']>(subjectFor((initial ?? OFFICIAL_PAPERS[0]).paper))
  const [topic, setTopic] = useState(`PYQ · ${(initial ?? OFFICIAL_PAPERS[0]).sitting}`)
  const [difficulty, setDifficulty] = useState<Difficulty>(3)
  const [exams, setExams] = useState<ExamId[]>([(initial ?? OFFICIAL_PAPERS[0]).exam])
  const [raw, setRaw] = useState('')
  const [keyRaw, setKeyRaw] = useState('')
  const [series, setSeries] = useState(0)
  const [picked, setPicked] = useState<Map<number, boolean>>(new Map())

  const choose = (next: string) => {
    setId(next)
    const p = OFFICIAL_PAPERS.find(x => x.id === next)
    if (p) { setSubject(subjectFor(p.paper)); setTopic(`PYQ · ${p.sitting}`); setExams([p.exam]) }
    else { setTopic('PYQ'); setExams(EXAMS.map(e => e.id)) }
  }

  const label = paper ? `${paper.sitting} — ${paper.paper}` : other.trim()
  const questions = useMemo(() => parsePaper(raw), [raw])
  const columns = useMemo(() => answerKeyColumns(keyRaw), [keyRaw])
  const key = useMemo(() => parseAnswerKey(keyRaw, series), [keyRaw, series])
  const sources = new Set(have.map(q => q.source))

  const rows = questions.map(q => {
    const answer = key.get(q.n)
    const source = `${label} · Q${q.n}`
    const dup = sources.has(source)
    const usable = typeof answer === 'number' && answer < q.options.length && q.options.length >= 2 && !!q.text
    // Figure questions are left out by default: the figure doesn't copy.
    return { ...q, answer, source, dup, usable, on: usable && (picked.get(q.n) ?? (!q.figure && !dup)) }
  })
  const chosen = rows.filter(r => r.on)
  const nums = new Set(questions.map(q => q.n))
  const first = Math.min(...nums), last = Math.max(...nums)
  const missing = questions.length ? Array.from({ length: last - first + 1 }, (_, i) => first + i).filter(n => !nums.has(n)) : []
  const figures = rows.filter(r => r.figure).length

  const save = async () => {
    await db.questions.bulkAdd(chosen.map(r => ({
      text: r.text, options: r.options, answer: r.answer as number, passage: r.passage,
      subject, topic: topic.trim() || 'PYQ', difficulty, exams, source: r.source,
    })))
    onDone(`Added ${chosen.length} question${chosen.length === 1 ? '' : 's'} from ${label}.`)
    setRaw(''); setKeyRaw(''); setPicked(new Map())
  }

  return (
    <Card title="Import a past paper">
      <p className="mb-4 body-6 text-ink-400">
        Turn a UPSC paper into practice questions in your bank: paste the paper's text and its official answer key, check the preview, and add.
        The questions then turn up in your topic tests and mocks. Everything stays on this device, for your own practice.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0">
          <label className={labelCls}>Paper</label>
          <select className={inputCls} value={id} onChange={e => choose(e.target.value)}>
            {EXAMS.filter(e => OFFICIAL_PAPERS.some(p => p.exam === e.id)).map(e => (
              <optgroup key={e.id} label={e.short}>
                {OFFICIAL_PAPERS.filter(p => p.exam === e.id).map(p => <option key={p.id} value={p.id}>{p.sitting} — {p.paper}</option>)}
              </optgroup>
            ))}
            <option value="">Another paper…</option>
          </select>
        </div>
        {paper ? (
          <div className="flex flex-wrap items-end gap-x-4 gap-y-1 pb-2 body-6">
            <a href={paper.url} target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">Open the paper ↗</a>
            <a href="https://www.upsc.gov.in/examinations/answer-key/archives" target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">UPSC answer keys ↗</a>
          </div>
        ) : (
          <div><label className={labelCls}>Paper name</label><input className={inputCls} value={other} onChange={e => setOther(e.target.value)} placeholder="e.g. AFCAT 2/2025" /></div>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div>
          <label className={labelCls}>Question paper text</label>
          <textarea className={`${inputBase} h-56 w-full px-4 py-3 font-mono caption-5`} value={raw} onChange={e => { setRaw(e.target.value); setPicked(new Map()) }} placeholder={PAPER_HINT} />
        </div>
        <div>
          <label className={labelCls}>Answer key</label>
          <textarea className={`${inputBase} h-56 w-full px-4 py-3 font-mono caption-5`} value={keyRaw} onChange={e => { setKeyRaw(e.target.value); setPicked(new Map()) }} placeholder={KEY_HINT} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 caption-5 text-ink-500">
        <span>The key must be for your PDF's booklet series (the letter on its cover). X marks a dropped question.</span>
        {columns >= 2 && (
          <label className="flex items-center gap-2">
            <span>Series column</span>
            <select className={`${inputBase} px-3 py-1 caption-5`} value={series} onChange={e => setSeries(Number(e.target.value))}>
              {Array.from({ length: columns }, (_, i) => <option key={i} value={i}>{'ABCD'[i] ?? i + 1}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="mt-1 caption-5 text-ink-500">Nothing selects in the PDF? It's a scan: copy its text with an OCR tool such as Google Lens or the Windows Snipping Tool's text actions.</p>

      {raw.trim() && (
        <div className="mt-6">
          <div className="flex flex-wrap gap-x-4 gap-y-1 body-6">
            <span className={questions.length ? 'text-verdant-300' : 'text-saffron-400'}>
              {questions.length ? `${questions.length} questions found (Q${first}–Q${last})` : 'No numbered questions with (a)–(d) options found'}
            </span>
            {keyRaw.trim() && <span className="text-ink-400">{key.size} answers in the key</span>}
            {missing.length > 0 && <span className="text-saffron-400">Missing: Q{missing.slice(0, 8).join(', Q')}{missing.length > 8 ? ` and ${missing.length - 8} more` : ''}</span>}
          </div>
          {figures > 0 && <p className="mt-1 caption-5 text-ink-500">{figures} question{figures === 1 ? ' has' : 's have'} a figure and {figures === 1 ? 'is' : 'are'} left out, since figures don't copy. Tick one if its text is enough.</p>}
          {questions.length > 0 && !keyRaw.trim() && <p className="mt-1 caption-5 text-ink-500">Paste the answer key to choose the questions to add.</p>}
          {questions.length > 0 && (
            <ul className="mt-4 max-h-[32rem] divide-y divide-line overflow-auto rounded-3xl bg-surface-2 px-4">
              {rows.map((r, i) => (
                <li key={i}>
                  <label className={`flex gap-3 py-3 body-6 ${r.usable ? 'cursor-pointer' : ''}`}>
                    <input type="checkbox" className="mt-1 shrink-0 accent-accent-500 pointer-coarse:size-5" disabled={!r.usable} checked={r.on}
                      onChange={e => setPicked(new Map(picked).set(r.n, e.target.checked))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-mono caption-5 tabular-nums text-ink-500">Q{r.n}</span>
                        {keyRaw.trim() && r.answer === undefined && <Badge tone="saffron">not in key</Badge>}
                        {r.answer === null && <Badge>dropped</Badge>}
                        {r.options.length < 4 && <Badge tone="saffron">{r.options.length} option{r.options.length === 1 ? '' : 's'}</Badge>}
                        {r.figure && <Badge tone="ember">figure</Badge>}
                        {r.passage && <Badge tone="accent">passage</Badge>}
                        {r.dup && <Badge>already added</Badge>}
                      </div>
                      <div className={`mt-1 line-clamp-4 whitespace-pre-line ${r.on ? 'text-ink-100' : 'text-ink-400'}`}>{r.text || 'No question text'}</div>
                      <div className="mt-1 caption-5 text-ink-400">
                        {r.options.map((o, j) => <span key={j} className={`mr-3 ${j === r.answer ? 'text-verdant-300' : ''}`}>({'abcd'[j]}) {o}</span>)}
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <TagFields {...{ subject, setSubject, topic, setTopic, difficulty, setDifficulty }} />
      </div>
      <div className="mt-4"><ExamChecks exams={exams} setExams={setExams} /></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!chosen.length || !exams.length || !label} onClick={save}>Add {chosen.length || ''} questions</Button>
        {!raw && <Button variant="ghost" onClick={() => { setRaw(SAMPLE_PAPER); setKeyRaw(SAMPLE_KEY) }}>Try a sample</Button>}
        {raw && <Button variant="ghost" onClick={() => { setRaw(''); setKeyRaw(''); setPicked(new Map()) }}>Clear</Button>}
      </div>
    </Card>
  )
}

function PasteImport({ onDone }: { onDone: (m: string) => void }) {
  const [raw, setRaw] = useState('')
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [source, setSource] = useState('Telegram')
  const [exams, setExams] = useState<ExamId[]>(EXAMS.map(e => e.id))
  const { items, skipped } = parsePastedMCQs(raw)
  const first = items[0]

  const save = async () => {
    await db.questions.bulkAdd(items.map(it => ({ ...it, subject, topic: topic.trim() || 'General', difficulty, source: source.trim() || undefined, exams })))
    onDone(`Added ${items.length} pasted question${items.length === 1 ? '' : 's'} to your bank.`)
    setRaw('')
  }

  return (
    <Card title="Paste from Telegram, PDFs or notes">
      <p className="mb-4 body-6 text-ink-400">
        Copy a quiz post and paste it here. The app picks out each question, its options (a–d, on one line or several) and the answer (an "Ans:" line or a ✅ after the right option). Emoji and numbering are ignored. Everything stays on this device.
      </p>
      <textarea className={`${inputBase} h-44 w-full px-4 py-3 font-mono caption-5`} value={raw} onChange={e => setRaw(e.target.value)} placeholder={SAMPLE_PASTE} />
      {raw.trim() && (
        <div className="mt-3 body-6">
          <span className={items.length ? 'text-verdant-300' : 'text-saffron-400'}>{items.length} question{items.length === 1 ? '' : 's'} recognised</span>
          {skipped > 0 && <span className="text-ink-500"> · {skipped} skipped (no answer or fewer than 2 options found)</span>}
          {first && (
            <div className="mt-3 rounded-3xl bg-surface-2 px-4 py-4">
              <div className="text-ink-100">{first.text}</div>
              <div className="mt-1 caption-5 text-ink-400">{first.options.map((o, j) => <span key={j} className={`mr-3 ${j === first.answer ? 'text-verdant-300' : ''}`}>{'ABCD'[j]}. {o}</span>)}</div>
              {first.explanation && <div className="mt-1 caption-5 text-ink-500">💡 {first.explanation}</div>}
            </div>
          )}
        </div>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <TagFields {...{ subject, setSubject, topic, setTopic, difficulty, setDifficulty }} />
        <div><label className={labelCls}>Source</label><input className={inputCls} value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Telegram — channel name" /></div>
      </div>
      <div className="mt-4"><ExamChecks exams={exams} setExams={setExams} /></div>
      <div className="mt-4 flex gap-2">
        <Button disabled={!items.length || !exams.length} onClick={save}>Add {items.length || ''} questions</Button>
        {!raw && <Button variant="ghost" onClick={() => setRaw(SAMPLE_PASTE)}>Try a sample</Button>}
      </div>
    </Card>
  )
}

function AddQuestion({ onDone }: { onDone: (m: string) => void }) {
  const [text, setText] = useState('')
  const [opts, setOpts] = useState(['', '', '', ''])
  const [answer, setAnswer] = useState(0)
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [explanation, setExplanation] = useState('')
  const [exams, setExams] = useState<ExamId[]>(EXAMS.map(e => e.id))
  const valid = text.trim() && opts.filter(o => o.trim()).length >= 2 && opts[answer].trim() && exams.length > 0

  const add = async () => {
    await db.questions.add({ text: text.trim(), options: opts.map(o => o.trim()).filter(Boolean), answer, subject, topic: topic.trim() || 'General', difficulty, explanation: explanation.trim() || undefined, exams, source: 'My notes' })
    setText(''); setOpts(['', '', '', '']); setAnswer(0); setExplanation('')
    onDone('Question added.')
  }

  return (
    <Card title="Write a question">
      <p className="mb-4 body-6 text-ink-400">When a past-paper question beats you, write the concept back as your own question. It shows up in your tests.</p>
      <div className="space-y-3">
        <div><label className={labelCls}>Question</label><textarea className={`${inputCls} h-20`} value={text} onChange={e => setText(e.target.value)} /></div>
        <div className="grid gap-2 sm:grid-cols-2">
          {opts.map((o, i) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name="ans" className="accent-accent-500" checked={answer === i} onChange={() => setAnswer(i)} title="Correct answer" />
              <input className={inputCls} placeholder={`Option ${'ABCD'[i]}`} value={o} onChange={e => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))} />
            </label>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <TagFields {...{ subject, setSubject, topic, setTopic, difficulty, setDifficulty }} />
          <div><label className={labelCls}>Explanation (optional)</label><input className={inputCls} value={explanation} onChange={e => setExplanation(e.target.value)} /></div>
        </div>
        <ExamChecks exams={exams} setExams={setExams} />
        <Button variant="subtle" disabled={!valid} onClick={add}>Add question</Button>
      </div>
    </Card>
  )
}

function BulkImport({ onDone }: { onDone: (m: string) => void }) {
  const [raw, setRaw] = useState('')
  const doImport = async () => {
    try {
      const parsed = parseQuestionImport(raw)
      if (!parsed.length) { onDone('No valid questions found — check the format.'); return }
      await db.questions.bulkAdd(parsed)
      setRaw('')
      onDone(`Imported ${parsed.length} question(s).`)
    } catch (e) {
      onDone(`Import failed: ${(e as Error).message}`)
    }
  }
  return (
    <Card title="Bulk import (CSV or JSON)">
      <p className="mb-3 body-6 text-ink-400">CSV columns: text, optionA–D, answer (A–D), subject, topic, explanation, difficulty (easy/medium/hard). Wrap text containing commas in quotes. JSON: an array of {'{ text, options[], answer, subject, topic, explanation, difficulty, exams[] }'}.</p>
      <textarea className={`${inputBase} h-28 w-full px-4 py-2 font-mono caption-5`} value={raw} onChange={e => setRaw(e.target.value)} placeholder={SAMPLE_CSV} />
      <div className="mt-3 flex gap-2">
        <Button variant="subtle" disabled={!raw.trim()} onClick={doImport}>Import</Button>
        <Button variant="ghost" onClick={() => setRaw(SAMPLE_CSV)}>Insert sample</Button>
      </div>
    </Card>
  )
}

import { useMemo, useState, type ReactNode } from 'react'
import { EXAMS, examById, type ExamId } from '../../data/exams'
import { BUILTIN_QUESTIONS, DIFFICULTY_LABEL, difficultyOf, parseQuestionImport, type Difficulty, type Question } from '../../data/questions'
import { listKey } from '../../content'
import { newId, questionProblem } from '../../content/pack'
import { answerKeyColumns, parseAnswerKey, parsePaper, parsePastedMCQs } from '../../lib/paste'
import { basePackOf, updateDraft, type DraftRow } from '../../admin/state'
import { Badge, Button, Card, Chip, Empty, inputCls } from '../../components/ui'
import { ExamChips, Field, Flash, More, SubjectSelect, SUBJECTS, count, plural, topicsFor, useFlash } from './shared'

type View = 'published' | 'builtin' | 'import'
const ALL_EXAMS = EXAMS.map(e => e.id)
const PAGE = 50

export function QuestionsAdmin({ row }: { row: DraftRow }) {
  const [view, setView] = useState<View>('published')
  const [flash, setFlash] = useFlash()
  const hidden = row.pack.hiddenQuestions.length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Chip active={view === 'published'} onClick={() => setView('published')}>Published {count(row.pack.questions.length)}</Chip>
        <Chip active={view === 'import'} onClick={() => setView('import')}>Bulk import</Chip>
        <Chip active={view === 'builtin'} onClick={() => setView('builtin')}>Built-in {count(BUILTIN_QUESTIONS.length)}{hidden ? <span className="opacity-60"> · {hidden} hidden</span> : null}</Chip>
      </div>
      <Flash msg={flash} />
      {view === 'published' && <Published row={row} />}
      {view === 'import' && <BulkImport row={row} onDone={m => { setFlash(m); setView('published') }} />}
      {view === 'builtin' && <BuiltIn row={row} />}
    </div>
  )
}

// ── Published questions ──────────────────────────────────────────

const matches = (q: Question, search: string) => {
  const s = search.trim().toLowerCase()
  return !s || [q.text, q.topic, q.source ?? '', ...q.options].some(x => x.toLowerCase().includes(s))
}

function Published({ row }: { row: DraftRow }) {
  const [editing, setEditing] = useState<Question | 'new' | null>(null)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<Question['subject'] | 'all'>('all')
  const [exam, setExam] = useState<ExamId | 'all'>('all')
  const [limit, setLimit] = useState(PAGE)
  const [flash, setFlash] = useFlash()
  const qs = row.pack.questions
  const live = useMemo(() => new Set(basePackOf(row).questions.map(q => q.id)), [row.base])
  const list = qs.filter(q => (subject === 'all' || q.subject === subject) && (exam === 'all' || q.exams.includes(exam)) && matches(q, search)).reverse() // newest first

  const save = async (q: Question) => {
    await updateDraft(p => ({ ...p, questions: p.questions.some(x => x.id === q.id) ? p.questions.map(x => (x.id === q.id ? q : x)) : [...p.questions, q] }))
    setFlash(editing === 'new' ? 'Question added to the draft.' : 'Question updated.')
    setEditing(editing === 'new' ? 'new' : null) // after adding, the form stays open for the next one
  }
  const remove = async (q: Question) => {
    if (!confirm('Delete this question from the draft?')) return
    await updateDraft(p => ({ ...p, questions: p.questions.filter(x => x.id !== q.id) }))
  }

  return (
    <>
      {editing && (
        <QuestionForm key={editing === 'new' ? `new-${qs.length}` : editing.id} initial={editing === 'new' ? undefined : editing} known={qs}
          onSave={save} onCancel={() => setEditing(null)} />
      )}
      <Card title="Published questions" action={!editing && <Button onClick={() => setEditing('new')}>Add question</Button>}>
        <Flash msg={flash} />
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <input className={inputCls} placeholder="Search text, options, topic or source…" value={search} onChange={e => { setSearch(e.target.value); setLimit(PAGE) }} aria-label="Search questions" />
          <select className={inputCls} value={subject} onChange={e => setSubject(e.target.value as typeof subject)} aria-label="Subject">
            <option value="all">All subjects</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className={inputCls} value={exam} onChange={e => setExam(e.target.value as typeof exam)} aria-label="Exam">
            <option value="all">All exams</option>
            {EXAMS.map(e => <option key={e.id} value={e.id}>{e.short}</option>)}
          </select>
        </div>
        {qs.length === 0 ? <Empty>No published questions yet. Add one, or paste a whole paper under Bulk import.</Empty>
          : list.length === 0 ? <Empty>No question matches.</Empty> : (
          <ul className="divide-y divide-line">
            {list.slice(0, limit).map(q => <QuestionRow key={q.id} q={q} isNew={!live.has(q.id)} onEdit={() => setEditing(q)} onDelete={() => remove(q)} />)}
          </ul>
        )}
        <More shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
      </Card>
    </>
  )
}

function QuestionRow({ q, isNew, onEdit, onDelete, extra }: { q: Question; isNew?: boolean; onEdit?: () => void; onDelete?: () => void; extra?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start gap-3">
        <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(o => !o)} aria-expanded={open}>
          <div className={`body-6 text-ink-100 ${open ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{q.text}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {isNew && <Badge tone="saffron">not published yet</Badge>}
            <Badge>{q.subject}</Badge>
            <Badge>{q.topic}</Badge>
            <Badge>{DIFFICULTY_LABEL[difficultyOf(q)]}</Badge>
            <span className="caption-5 text-ink-500">{q.exams.map(e => examById(e)?.short).join(', ')}{q.source ? ` · ${q.source}` : ''}</span>
          </div>
        </button>
        <div className="flex shrink-0 gap-1">
          {extra}
          {onEdit && <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>}
          {onDelete && <Button variant="danger" size="sm" onClick={onDelete}>Delete</Button>}
        </div>
      </div>
      {open && (
        <div className="mt-3 rounded-2xl bg-surface-2 px-4 py-3 body-6">
          {q.passage && <div className="mb-2 line-clamp-4 whitespace-pre-wrap text-ink-400">{q.passage}</div>}
          <ol className="space-y-1">
            {q.options.map((o, i) => <li key={i} className={i === q.answer ? 'text-verdant-300' : 'text-ink-300'}>{'ABCDEF'[i]}. {o}{i === q.answer ? '  ✓' : ''}</li>)}
          </ol>
          {q.explanation && <div className="mt-2 text-ink-400">{q.explanation}</div>}
        </div>
      )}
    </li>
  )
}

/** The form for one question. Blank options are dropped on save, and the correct answer moves with them. */
function QuestionForm({ initial, known, onSave, onCancel }: { initial?: Question; known: Question[]; onSave: (q: Question) => void; onCancel: () => void }) {
  const [q, setQ] = useState<Question>(() => initial ?? {
    id: newId('q'), exams: ALL_EXAMS, subject: 'General Knowledge', topic: '', text: '', options: ['', '', '', ''], answer: -1, difficulty: 2,
  })
  const [tried, setTried] = useState(false)
  const set = (patch: Partial<Question>) => setQ(x => ({ ...x, ...patch }))
  const topics = useMemo(() => topicsFor(q.subject, known), [q.subject, known])

  const filled = q.options.map((o, i) => ({ o: o.trim(), i })).filter(x => x.o)
  const final: Question = {
    ...q,
    options: filled.map(x => x.o),
    answer: filled.findIndex(x => x.i === q.answer),
    explanation: q.explanation?.trim() || undefined, source: q.source?.trim() || undefined, passage: q.passage?.trim() || undefined,
  }
  const problem = questionProblem(final)
  const dupe = !initial && [...BUILTIN_QUESTIONS, ...known].some(x => listKey(x.text) === listKey(final.text))

  return (
    <Card title={initial ? 'Edit question' : 'New question'}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Subject"><SubjectSelect value={q.subject} onChange={subject => set({ subject })} /></Field>
          <Field label="Topic" hint="Use a study topic's name to list it on that topic page.">
            <input className={inputCls} list="admin-topics" value={q.topic} onChange={e => set({ topic: e.target.value })} placeholder="e.g. Polity" />
            <datalist id="admin-topics">{topics.map(t => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Difficulty">
            <div className="flex gap-2">
              {([1, 2, 3] as Difficulty[]).map(d => <Chip key={d} active={difficultyOf(q) === d} onClick={() => set({ difficulty: d })}>{DIFFICULTY_LABEL[d]}</Chip>)}
            </div>
          </Field>
        </div>
        <Field label="Exams it appears in"><ExamChips value={q.exams} onChange={exams => set({ exams })} /></Field>
        <Field label="Source (optional)" hint='Shown with the question, e.g. "CDS (I) 2024, Q 37" for a past-paper question.'>
          <input className={inputCls} value={q.source ?? ''} onChange={e => set({ source: e.target.value })} />
        </Field>
        <details open={!!q.passage}>
          <summary className="cursor-pointer caption-1 text-ink-400">Passage (comprehension or cloze, optional)</summary>
          <textarea className={`${inputCls} mt-2 h-28`} value={q.passage ?? ''} onChange={e => set({ passage: e.target.value })} />
        </details>
        <Field label="Question"><textarea className={`${inputCls} h-24`} value={q.text} onChange={e => set({ text: e.target.value })} /></Field>
        <fieldset>
          <legend className="mb-2 caption-1 text-ink-400">Options: tick the correct one</legend>
          <div className="space-y-2">
            {q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="correct" className="size-4 accent-accent-500" checked={q.answer === i} onChange={() => set({ answer: i })} aria-label={`Option ${'ABCDEF'[i]} is correct`} />
                <span className="w-5 caption-3 text-ink-500">{'ABCDEF'[i]}</span>
                <input className={inputCls} value={o} onChange={e => set({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })} aria-label={`Option ${'ABCDEF'[i]}`} />
                {q.options.length > 2 && (
                  <Button variant="ghost" size="sm" aria-label={`Remove option ${'ABCDEF'[i]}`}
                    onClick={() => set({ options: q.options.filter((_, j) => j !== i), answer: q.answer === i ? -1 : q.answer > i ? q.answer - 1 : q.answer })}>×</Button>
                )}
              </div>
            ))}
          </div>
          {q.options.length < 6 && <Button variant="ghost" size="sm" className="mt-2" onClick={() => set({ options: [...q.options, ''] })}>+ Add option</Button>}
        </fieldset>
        <Field label="Explanation (optional)" hint="Shown after answering. Say why the answer is right, and why a tempting wrong one isn't.">
          <textarea className={`${inputCls} h-20`} value={q.explanation ?? ''} onChange={e => set({ explanation: e.target.value })} />
        </Field>
        {tried && problem && <p className="body-6 text-ember-300">Can't save yet: {problem}.</p>}
        {dupe && <p className="body-6 text-saffron-300">A question with the same text is already in the bank.</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => { setTried(true); if (!problem) onSave(final) }}>{initial ? 'Save changes' : 'Add to draft'}</Button>
          <Button variant="ghost" onClick={onCancel}>{initial ? 'Cancel' : 'Close'}</Button>
        </div>
      </div>
    </Card>
  )
}

// ── Built-in questions: hide the ones that shouldn't be shown ─────────

function BuiltIn({ row }: { row: DraftRow }) {
  const [search, setSearch] = useState('')
  const [onlyHidden, setOnlyHidden] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const hidden = new Set(row.pack.hiddenQuestions)
  const list = BUILTIN_QUESTIONS.filter(q => (!onlyHidden || hidden.has(q.id)) && matches(q, search))
  const toggle = (id: string) => updateDraft(p => ({ ...p, hiddenQuestions: p.hiddenQuestions.includes(id) ? p.hiddenQuestions.filter(x => x !== id) : [...p.hiddenQuestions, id] }))

  return (
    <Card title="Built-in questions">
      <p className="mb-4 body-6 text-ink-400">These ship with the app. You can't edit them here, but you can hide one (a dated fact, a disputed answer) and add a corrected version as a published question.</p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className={`${inputCls} sm:max-w-md`} placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setLimit(PAGE) }} aria-label="Search built-in questions" />
        <Chip active={onlyHidden} onClick={() => setOnlyHidden(h => !h)}>Hidden only {count(hidden.size)}</Chip>
      </div>
      {list.length === 0 ? <Empty>No question matches.</Empty> : (
        <ul className="divide-y divide-line">
          {list.slice(0, limit).map(q => (
            <QuestionRow key={q.id} q={q} extra={
              <>
                {hidden.has(q.id) && <Badge tone="ember">hidden</Badge>}
                <Button variant="ghost" size="sm" onClick={() => toggle(q.id)}>{hidden.has(q.id) ? 'Show again' : 'Hide'}</Button>
              </>
            } />
          ))}
        </ul>
      )}
      <More shown={limit} total={list.length} onMore={() => setLimit(l => l + PAGE)} />
    </Card>
  )
}

// ── Bulk import ────────────────────────────────────────────────────

type Mode = 'paper' | 'mcq' | 'csv'
type Candidate = { q: Question; problem: string | null; dupe: boolean }

function BulkImport({ row, onDone }: { row: DraftRow; onDone: (message: string) => void }) {
  const [mode, setMode] = useState<Mode>('paper')
  const [subject, setSubject] = useState<Question['subject']>('General Knowledge')
  const [topic, setTopic] = useState('')
  const [exams, setExams] = useState<ExamId[]>(['cds'])
  const [difficulty, setDifficulty] = useState<Difficulty>(2)
  const [source, setSource] = useState('')
  const [raw, setRaw] = useState('')
  const [keyRaw, setKeyRaw] = useState('')
  const [series, setSeries] = useState(0)
  const topics = useMemo(() => topicsFor(subject, row.pack.questions), [subject, row.pack.questions])

  const columns = mode === 'paper' ? answerKeyColumns(keyRaw) : 0
  const parsed = useMemo(() => {
    const base = { subject, topic: topic.trim(), exams, difficulty }
    let skipped = 0
    let qs: Omit<Question, 'id'>[] = []
    if (mode === 'paper') {
      const key = parseAnswerKey(keyRaw, series)
      for (const p of parsePaper(raw)) {
        const answer = key.get(p.n)
        // Figure questions can't be shown without their figure, and dropped questions have no answer.
        if (p.figure || answer === undefined || answer === null || answer >= p.options.length) { skipped++; continue }
        qs.push({ ...base, text: p.text, options: p.options, answer, passage: p.passage, source: source.trim() ? `${source.trim()}, Q ${p.n}` : undefined })
      }
    } else if (mode === 'mcq') {
      const r = parsePastedMCQs(raw)
      skipped = r.skipped
      qs = r.items.map(x => ({ ...base, ...x, source: source.trim() || undefined }))
    } else {
      try {
        // A file's own subject, topic and exams win; the choices above fill in what it leaves out.
        qs = parseQuestionImport(raw).map(x => ({ ...x, topic: x.topic === 'General' && topic.trim() ? topic.trim() : x.topic, difficulty: x.difficulty ?? difficulty, source: x.source ?? (source.trim() || undefined) }))
      } catch { skipped = -1 }
    }
    const seen = new Set([...BUILTIN_QUESTIONS, ...row.pack.questions].map(q => listKey(q.text)))
    const out: Candidate[] = qs.map(x => {
      const q = { ...x, id: newId('q') } as Question
      const dupe = seen.has(listKey(q.text))
      seen.add(listKey(q.text))
      return { q, problem: questionProblem(q), dupe }
    })
    return { out, skipped }
  }, [mode, raw, keyRaw, series, subject, topic, exams, difficulty, source, row.pack.questions])

  const good = parsed.out.filter(c => !c.problem && !c.dupe)
  const bad = parsed.out.filter(c => c.problem)
  const dupes = parsed.out.filter(c => !c.problem && c.dupe)

  const add = async () => {
    await updateDraft(p => ({ ...p, questions: [...p.questions, ...good.map(c => c.q)] }))
    onDone(`${plural(good.length, 'question')} added to the draft.`)
  }

  return (
    <Card title="Bulk import">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Chip active={mode === 'paper'} onClick={() => setMode('paper')}>Question paper + answer key</Chip>
          <Chip active={mode === 'mcq'} onClick={() => setMode('mcq')}>Numbered questions with answers</Chip>
          <Chip active={mode === 'csv'} onClick={() => setMode('csv')}>CSV or JSON</Chip>
        </div>
        <p className="body-6 text-ink-400">
          {mode === 'paper' && <>Copy the text of a paper (UPSC PDFs: select all, copy) and paste it, then paste the official answer key. Hindi lines and the cover page are dropped; questions that need a figure, and dropped questions, are skipped.</>}
          {mode === 'mcq' && <>Questions as they appear in notes or Telegram posts: <span className="font-mono">Q1. … a) … b) … Ans: b</span>, with an optional <span className="font-mono">Explanation:</span> line.</>}
          {mode === 'csv' && <>One question per line: <span className="font-mono">text,optA,optB,optC,optD,answerLetter,subject,topic,explanation,difficulty</span>, or a JSON array of questions. Subject must be one of {SUBJECTS.join(', ')}.</>}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Subject"><SubjectSelect value={subject} onChange={setSubject} /></Field>
          <Field label="Topic">
            <input className={inputCls} list="admin-import-topics" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Polity" />
            <datalist id="admin-import-topics">{topics.map(t => <option key={t} value={t} />)}</datalist>
          </Field>
          <Field label="Difficulty">
            <div className="flex gap-2">{([1, 2, 3] as Difficulty[]).map(d => <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>{DIFFICULTY_LABEL[d]}</Chip>)}</div>
          </Field>
        </div>
        <Field label="Exams"><ExamChips value={exams} onChange={setExams} /></Field>
        <Field label="Source label (optional)" hint={mode === 'paper' ? 'Each question gets its number added: "CDS (I) 2024 GK, Q 12".' : 'Shown with each question.'}>
          <input className={inputCls} value={source} onChange={e => setSource(e.target.value)} placeholder={mode === 'paper' ? 'e.g. CDS (I) 2024 GK' : 'e.g. Officer Prep'} />
        </Field>
        <Field label={mode === 'paper' ? 'Paper text' : mode === 'mcq' ? 'Questions' : 'CSV or JSON'}>
          <textarea className={`${inputCls} h-56 font-mono`} value={raw} onChange={e => setRaw(e.target.value)} />
        </Field>
        {mode === 'paper' && (
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <Field label="Answer key" hint='Any common layout: "1 B 2 C", "1-(b)", a table with one column per booklet series, or a string of letters.'>
              <textarea className={`${inputCls} h-28 font-mono`} value={keyRaw} onChange={e => setKeyRaw(e.target.value)} />
            </Field>
            {columns > 1 && (
              <Field label="Booklet series">
                <select className={inputCls} value={series} onChange={e => setSeries(Number(e.target.value))}>
                  {Array.from({ length: columns }, (_, i) => <option key={i} value={i}>Series {'ABCD'[i] ?? i + 1}</option>)}
                </select>
              </Field>
            )}
          </div>
        )}
        {raw.trim() && (
          <div className="rounded-2xl bg-surface-2 px-4 py-3 body-6">
            {parsed.skipped === -1 ? <span className="text-ember-300">That isn't valid JSON.</span> : (
              <ul className="space-y-1">
                <li className="text-verdant-300">{plural(good.length, 'question')} ready to add</li>
                {dupes.length > 0 && <li className="text-ink-400">{plural(dupes.length, 'question')} already in the bank, skipped</li>}
                {parsed.skipped > 0 && <li className="text-ink-400">{parsed.skipped} skipped ({mode === 'paper' ? 'figure-based, dropped, or no answer in the key' : 'no answer found'})</li>}
                {bad.length > 0 && <li className="text-ember-300">{plural(bad.length, 'question')} with a problem: {bad[0].problem}{bad.length > 1 ? ', …' : ''}</li>}
              </ul>
            )}
          </div>
        )}
        {good.length > 0 && (
          <ul className="divide-y divide-line">
            {good.slice(0, 3).map(c => <QuestionRow key={c.q.id} q={c.q} />)}
            {good.length > 3 && <li className="py-2 caption-5 text-ink-500">…and {good.length - 3} more</li>}
          </ul>
        )}
        <Button disabled={!good.length} onClick={add}>Add {plural(good.length, 'question')} to the draft</Button>
      </div>
    </Card>
  )
}

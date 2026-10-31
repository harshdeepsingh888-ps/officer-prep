import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EXAMS, examById } from '../../data/exams'
import { OFFICIAL_PAPERS, type OfficialPaper } from '../../data/sources'
import { db, useSetting, type MistakeReason } from '../../lib/db'
import { useDrive } from '../../lib/DriveProvider'
import { useCountdown } from '../../lib/hooks'
import { REASONS, addPaperMistake } from '../../lib/learning'
import { parseKey, scoreOMR, type ScoreResult } from '../../lib/scoring'
import { fmtClock, round2 } from '../../lib/util'
import { Badge, Button, Card, Stat, TimerBar, inputBase, inputCls, labelCls } from '../../components/ui'

const OMR_KEY = 'omrRun'
/** An OMR sheet in progress — saved so a reload or closed tab can resume it. */
type OmrRun = { paperId: string; n: number; minutes: number; resp: (number | null)[]; startedAt: number; deadline: number }

export default function PastPapers() {
  const [targets] = useSetting<string[]>('targets', [])
  const available = EXAMS.filter(e => OFFICIAL_PAPERS.some(p => p.exam === e.id))
  const [filter, setFilter] = useState<string | null>(null)
  const active = filter ?? available.find(e => targets.includes(e.id))?.id ?? 'all'
  const [paper, setPaper] = useState<OfficialPaper | null>(null)
  const [resume, setResume] = useState<OmrRun | null>(null)
  const saved = useLiveQuery(async () => ((await db.settings.get(OMR_KEY))?.value as OmrRun | undefined) ?? null, [])
  const savedPaper = saved ? OFFICIAL_PAPERS.find(p => p.id === saved.paperId) : undefined
  const drive = useDrive()
  const copyOf = (p: OfficialPaper) => drive.docs.find(d => d.appProperties?.paperId === p.id)

  if (paper) return <OMRSheet paper={paper} resume={resume} openUrl={copyOf(paper)?.webViewLink ?? paper.url} onExit={() => { setPaper(null); setResume(null) }} />

  const list = OFFICIAL_PAPERS.filter(p => active === 'all' || p.exam === active)
  return (
    <div className="space-y-14">
      {saved && savedPaper && (
        <div className="flex flex-wrap items-center gap-4 rounded-3xl bg-saffron-400/[0.08] px-5 py-4">
          <div className="min-w-[15rem] flex-1">
            <div className="text-ink-100">Unfinished OMR · {savedPaper.sitting} — {savedPaper.paper}</div>
            <div className="text-sm font-light text-ink-400">
              {saved.resp.filter(r => r !== null).length}/{saved.n} marked · {fmtClock(Math.max(0, Math.round((saved.deadline - Date.now()) / 1000)))} left (the clock kept running)
            </div>
          </div>
          <Button onClick={() => { setResume(saved); setPaper(savedPaper) }}>Resume</Button>
          <Button variant="ghost" onClick={() => db.settings.delete(OMR_KEY)}>Discard</Button>
        </div>
      )}
      <Card>
        <p className="text-sm text-ink-300">
          Official UPSC papers, linked straight from upsc.gov.in. Open the paper on one screen (or print it), answer on the timed OMR sheet here,
          then score it with the answer key. AFCAT and CGCAT papers aren't published officially, so use Quick quiz and the official mock test on afcat.cdac.in for those.
        </p>
        <p className="mt-2 text-xs text-ink-500">
          {drive.status === 'ready'
            ? 'Downloaded a paper? Use "Save my copy" to keep it in your Google Drive, so it opens on any device.'
            : <>Connect <a href="#/documents" className="text-saffron-400 hover:underline">Google Drive</a> to keep your downloaded copies and open them on any device.</>}
        </p>
      </Card>
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', short: 'All' }, ...available].map(e => (
          <button key={e.id} onClick={() => setFilter(e.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${active === e.id ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300 hover:bg-ink-700'}`}>{e.short}</button>
        ))}
      </div>
      <Card>
        <ul className="divide-y divide-fg/[0.06]">
          {list.map(p => {
            const copy = copyOf(p)
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:gap-y-1 sm:py-2.5">
                <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
                  <div className="text-sm font-medium text-ink-100">{p.sitting} — {p.paper}</div>
                  <div className="text-xs text-ink-500">{p.questions} Qs · {p.marks} marks · {p.minutes} min · PDF {p.size}</div>
                </div>
                {copy
                  ? <a href={copy.webViewLink} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm">My Drive copy ↗</Button></a>
                  : <>
                      <a href={p.url} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm">Open paper ↗</Button></a>
                      {drive.status === 'ready' && <SaveCopy paper={p} />}
                    </>}
                <Button size="sm" onClick={() => setPaper(p)}>OMR sheet</Button>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}

/** Upload the user's downloaded copy of an official paper to their Drive, linked to this paper. */
function SaveCopy({ paper }: { paper: OfficialPaper }) {
  const drive = useDrive()
  const ref = useRef<HTMLInputElement>(null)
  const [pct, setPct] = useState<number | null>(null)
  const [err, setErr] = useState('')

  const upload = async (file: File) => {
    setErr('')
    setPct(0)
    try {
      await drive.upload(file, { kind: 'paper', exam: paper.exam, subject: `${paper.sitting} — ${paper.paper}`, paperId: paper.id }, setPct)
    } catch (e) {
      setErr((e as Error).message)
    }
    setPct(null)
  }

  return (
    <>
      <Button variant="ghost" size="sm" disabled={pct !== null} onClick={() => ref.current?.click()} title={err || 'Upload the PDF you downloaded to your Google Drive'}>
        {pct !== null ? `Saving ${pct}%` : err ? 'Retry save' : 'Save my copy'}
      </Button>
      <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
    </>
  )
}

function OMRSheet({ paper, resume, openUrl, onExit }: { paper: OfficialPaper; resume: OmrRun | null; openUrl: string; onExit: () => void }) {
  const exam = examById(paper.exam)!
  const perQ = paper.marks / paper.questions
  const negative = (perQ * exam.marking.wrong) / exam.marking.correct
  const [phase, setPhase] = useState<'setup' | 'run' | 'key' | 'done'>(resume ? 'run' : 'setup')
  const [n, setN] = useState(resume?.n ?? paper.questions)
  const [minutes, setMinutes] = useState(resume?.minutes ?? paper.minutes)
  const [resp, setResp] = useState<(number | null)[]>(resume?.resp ?? [])
  const [startedAt, setStartedAt] = useState(resume?.startedAt ?? 0)
  const [deadline, setDeadline] = useState(resume?.deadline ?? 0)
  const [attemptId, setAttemptId] = useState<number>()
  const [keyRaw, setKeyRaw] = useState('')
  const [res, setRes] = useState<ScoreResult | null>(null)
  const timer = useCountdown(() => finish())

  // Resuming: continue the clock from the saved deadline.
  useEffect(() => {
    if (!resume) return
    const left = Math.round((resume.deadline - Date.now()) / 1000)
    if (left > 0) timer.start(left)
    else finish()
  }, []) // once, on mount

  useEffect(() => {
    if (phase === 'run') db.settings.put({ key: OMR_KEY, value: { paperId: paper.id, n, minutes, resp, startedAt, deadline } satisfies OmrRun })
  }, [phase, resp, n, minutes, startedAt, deadline, paper.id])

  const begin = () => {
    const now = Date.now()
    setResp(Array(n).fill(null))
    setStartedAt(now)
    setDeadline(now + minutes * 60_000)
    timer.start(minutes * 60)
    setPhase('run')
  }

  async function finish() {
    if (phase !== 'run') return
    timer.stop()
    const id = await db.attempts.add({
      kind: 'omr', exam: paper.exam, title: `${paper.sitting} — ${paper.paper}`, at: Date.now(),
      durationSec: Math.round((Date.now() - startedAt) / 1000), total: n, responses: resp, paperUrl: paper.url, paperId: paper.id, marksPerQ: perQ, negative,
    })
    await db.settings.delete(OMR_KEY)
    setAttemptId(id)
    setPhase('key')
  }

  const key = parseKey(keyRaw)
  const scoreNow = async () => {
    const r = scoreOMR(resp, key, perQ, negative)
    await db.attempts.update(attemptId!, { key, correct: r.correct, wrong: r.wrong, skipped: r.skipped, score: r.score, maxScore: r.maxScore })
    setRes(r)
    setPhase('done')
  }

  if (phase === 'setup') {
    return (
      <Card title={`${paper.sitting} — ${paper.paper}`}>
        <ol className="list-inside list-decimal space-y-3 text-sm text-ink-300">
          <li>
            {openUrl === paper.url
              ? <>Open the official paper ({paper.size}) in another tab, window or printout: </>
              : <>Open your Drive copy of the paper in another tab, window or printout: </>}
            <a href={openUrl} target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">Open paper ↗</a>
          </li>
          <li>
            Check the settings (edit if your booklet differs):
            <div className="mt-2 flex flex-wrap gap-3">
              <div><label className={labelCls}>Questions</label><input className={`${inputBase} w-24 px-4 py-2.5 text-sm`} type="number" min={1} value={n} onChange={e => setN(Math.max(1, Number(e.target.value)))} /></div>
              <div><label className={labelCls}>Minutes</label><input className={`${inputBase} w-24 px-4 py-2.5 text-sm`} type="number" min={1} value={minutes} onChange={e => setMinutes(Math.max(1, Number(e.target.value)))} /></div>
              <div className="self-end pb-2 text-xs text-ink-500">+{round2(perQ)} per correct · −{round2(negative)} per wrong</div>
            </div>
          </li>
          <li>Start the clock and mark your answers as you would on a real OMR.</li>
        </ol>
        <div className="mt-4 flex gap-2">
          <Button size="lg" onClick={begin}>Start {minutes}-minute test</Button>
          <Button variant="ghost" onClick={onExit}>Back</Button>
        </div>
      </Card>
    )
  }

  if (phase === 'run') {
    const answered = resp.filter(r => r !== null).length
    return (
      <div className="space-y-14">
        <div className="sticky top-3 z-20 rounded-3xl bg-canvas/85 px-5 py-4 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">{paper.sitting} — {paper.paper}</span>
            <span className="text-ink-400">{answered}/{n} marked</span>
          </div>
          <TimerBar remaining={timer.remaining} total={minutes * 60} />
          <div className="mt-2 flex gap-2">
            <a href={openUrl} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm">Paper ↗</Button></a>
            <Button size="sm" className="ml-auto" onClick={() => { if (confirm(`Submit? ${n - answered} unmarked.`)) finish() }}>Submit</Button>
          </div>
        </div>
        <Card>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-x-4 gap-y-1.5 pointer-coarse:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] pointer-coarse:gap-y-2.5">
            {resp.map((r, i) => (
              <div key={i} className="flex items-center gap-1.5 pointer-coarse:gap-2">
                <span className="w-8 text-right font-mono text-xs tabular-nums text-ink-500">{i + 1}</span>
                {[0, 1, 2, 3].map(o => (
                  <button key={o} onClick={() => setResp(prev => prev.map((x, j) => (j === i ? (x === o ? null : o) : x)))}
                    className={`size-7 rounded-full border text-[11px] font-semibold pointer-coarse:size-9 pointer-coarse:text-xs ${r === o ? 'border-iris-400 bg-iris-500 text-white' : 'border-ink-600 text-ink-400 hover:border-ink-400'}`}>
                    {'ABCD'[o]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'key') {
    return (
      <Card title="Score your sheet">
        <p className="mb-3 text-sm text-ink-400">
          Answers saved. Type or paste the answer key — letters only, in order (e.g. <span className="font-mono">BADC…</span>). Numbers, spaces and dashes are ignored; use <span className="font-mono">X</span> for a dropped question.
          UPSC publishes official keys after the final result (Library → Answer keys). You can also score later from History.
        </p>
        <textarea className={`${inputCls} h-32 font-mono`} value={keyRaw} onChange={e => setKeyRaw(e.target.value)} placeholder="1-B 2-A 3-D …  or  BADC…" />
        <div className="mt-2 flex items-center gap-2">
          <Badge tone={key.length === n ? 'iris' : 'saffron'}>{key.length}/{n} answers</Badge>
          <Button className="ml-auto" disabled={key.length !== n} onClick={scoreNow}>Score</Button>
          <Button variant="ghost" onClick={onExit}>Score later</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-14">
      {res && <ScoreCard res={res} keyStr={key} paper={{ paperId: paper.id, title: `${paper.sitting} — ${paper.paper}`, url: openUrl, exam: paper.exam }} />}
      <Button onClick={onExit}>Back to papers</Button>
    </div>
  )
}

export type PaperRef = { paperId: string; title: string; url?: string; exam: string }

export function ScoreCard({ res, paper, keyStr }: { res: ScoreResult; paper?: PaperRef; keyStr?: string }) {
  const attempted = res.correct + res.wrong
  const [adding, setAdding] = useState<number | null>(null)
  const savedIds = useLiveQuery(async () => (paper ? new Set(await db.mistakes.where('id').startsWith(`p:${paper.paperId}:`).primaryKeys()) : new Set<string>()), [paper?.paperId]) ?? new Set<string>()
  const isSaved = (q: number) => savedIds.has(`p:${paper?.paperId}:${q}`)
  return (
    <div className="space-y-12">
      <div className="grid grid-cols-2 gap-x-14 gap-y-10 md:grid-cols-4">
        <Stat label="Score" value={`${res.score} / ${res.maxScore}`} />
        <Stat label="Accuracy" value={`${attempted ? Math.round((res.correct / attempted) * 100) : 0}%`} hint={`${attempted} attempted`} />
        <Stat label="Right · Wrong" value={`${res.correct} · ${res.wrong}`} />
        <Stat label="Skipped · Dropped" value={`${res.skipped} · ${res.dropped}`} />
      </div>
      {res.wrongNums.length > 0 && (
        <Card title="Wrong answers — revisit these in the paper">
          {paper && <p className="mb-4 text-sm text-ink-400">Tap a question to add it to your mistake notebook with its topic and why you missed it. It comes back for revision from tomorrow.</p>}
          <div className="flex flex-wrap gap-1.5">
            {res.wrongNums.map(q => paper ? (
              <button key={q} onClick={() => setAdding(adding === q ? null : q)}
                className={`rounded-full px-2.5 py-1 text-xs tabular-nums transition-colors ${isSaved(q) ? 'bg-verdant-500/20 text-verdant-300' : adding === q ? 'bg-ember-500 text-white' : 'bg-ember-500/15 text-ember-300 hover:bg-ember-500/25'}`}>
                Q{q}{isSaved(q) ? ' ✓' : ''}
              </button>
            ) : <span key={q} className="rounded-full bg-ember-500/15 px-2.5 py-1 text-xs tabular-nums text-ember-300">Q{q}</span>)}
          </div>
          {paper && adding !== null && <PaperMistakeForm key={adding} paper={paper} qno={adding} correct={keyStr?.[adding - 1]} onDone={() => setAdding(null)} />}
        </Card>
      )}
    </div>
  )
}

function PaperMistakeForm({ paper, qno, correct, onDone }: { paper: PaperRef; qno: number; correct?: string; onDone: () => void }) {
  const exam = examById(paper.exam)
  const subjects = exam?.syllabus ?? []
  const [subject, setSubject] = useState(subjects[0]?.subject ?? 'General Knowledge')
  const [topic, setTopic] = useState('')
  const [reason, setReason] = useState<MistakeReason | ''>('')
  const [note, setNote] = useState('')
  const topics = subjects.find(s => s.subject === subject)?.topics ?? []
  return (
    <div className="mt-5 rounded-3xl bg-fg/[0.04] p-5">
      <div className="mb-4 text-sm text-ink-200">Q{qno}{correct && correct !== 'X' ? ` · correct answer ${correct}` : ''}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className={labelCls}>Subject</label>
          <select className={inputCls} value={subject} onChange={e => { setSubject(e.target.value); setTopic('') }}>{subjects.map(s => <option key={s.subject}>{s.subject}</option>)}</select></div>
        <div><label className={labelCls}>Topic</label>
          <input className={inputCls} list={`topics-${qno}`} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Pick or type" />
          <datalist id={`topics-${qno}`}>{topics.map(t => <option key={t} value={t} />)}</datalist></div>
        <div><label className={labelCls}>Why I missed it</label>
          <select className={inputCls} value={reason} onChange={e => setReason(e.target.value as MistakeReason | '')}><option value="">—</option>{REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
        <div><label className={labelCls}>Note to self</label><input className={inputCls} value={note} onChange={e => setNote(e.target.value)} placeholder="The rule, the trap, the fact" /></div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="subtle" onClick={async () => {
          await addPaperMistake({ ...paper, qno, subject, topic: topic.trim() || 'General', correct: correct && correct !== 'X' ? correct : undefined, reason: reason || undefined, note: note.trim() || undefined })
          onDone()
        }}>Save to notebook</Button>
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  )
}

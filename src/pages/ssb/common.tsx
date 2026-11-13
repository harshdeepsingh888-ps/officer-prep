import { useEffect, useRef, useState, type ReactNode } from 'react'
import { OLQ_FACTORS, TAT_SCENES, shuffle } from '../../data/ssb'
import { db, type SSBItem, type SSBTest } from '../../lib/db'
import { Button, Card, inputCls } from '../../components/ui'

export type Pic = { kind: 'image'; blob: Blob } | { kind: 'text'; text: string } | { kind: 'blank' }

/** Your uploaded pictures if you have any, otherwise written scenes. */
export async function pickPictures(count: number, withBlank: boolean): Promise<Pic[]> {
  const imgs = await db.images.toArray()
  const n = withBlank ? count - 1 : count
  const pics: Pic[] = imgs.length
    ? shuffle(imgs).slice(0, n).map(i => ({ kind: 'image' as const, blob: i.blob }))
    : shuffle(TAT_SCENES).slice(0, n).map(text => ({ kind: 'text' as const, text }))
  return withBlank ? [...pics, { kind: 'blank' }] : pics
}

export function BlobImage({ blob, className = '' }: { blob: Blob; className?: string }) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url ? <img src={url} alt="" className={className} /> : null
}

export function PicView({ pic, blur = false }: { pic: Pic; blur?: boolean }) {
  if (pic.kind === 'image') return <BlobImage blob={pic.blob} className={`mx-auto max-h-[60vh] rounded-3xl ${blur ? 'blur-[1.5px] grayscale' : ''}`} />
  if (pic.kind === 'blank') return <div className="mx-auto flex h-64 max-w-lg items-center justify-center rounded-3xl bg-white text-ink-600 ring-1 ring-line">Blank slide — picture your own scene</div>
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-surface-2 p-8 text-center title-2 italic text-ink-200">
      “{pic.text}”
      <div className="mt-3 caption-5 not-italic text-ink-500">Written scene — add real pictures under SSB → Pictures</div>
    </div>
  )
}

/** What the checks noticed in an answer: prompts to re-read it, not marks. */
export function FlagList({ flags, className = '' }: { flags: { text: string }[]; className?: string }) {
  if (!flags.length) return null
  return (
    <ul className={`space-y-1 caption-5 text-saffron-400 ${className}`}>
      {flags.map((f, i) => <li key={i} className="flex gap-1"><span aria-hidden>⚑</span><span>{f.text}</span></li>)}
    </ul>
  )
}

/** The end of a test: your answers (with anything the checks noticed), an OLQ self-assessment, and Save. */
export function SaveSet({ test, items, onAgain, onExit, summary, itemNotes, extra }: {
  test: SSBTest; items: SSBItem[]; onAgain: () => void; onExit: () => void; summary?: string
  /** Shown under each answer: checks and self-review for that item. */
  itemNotes?: (i: number) => ReactNode
  /** Shown after the answers: patterns across the whole set. */
  extra?: ReactNode
}) {
  const [olqs, setOlqs] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const filled = items.filter(i => i.response.trim()).length

  return (
    <div className="space-y-4">
      <Card title={`${test} — review`} action={<span className="caption-5 text-ink-400">{summary ?? `${filled}/${items.length} completed`}</span>}>
        <ol className="space-y-2 body-6">
          {items.map((it, i) => (
            <li key={i} className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-3">
              <span className="font-medium text-ink-400">{i + 1}. {it.prompt}</span>
              <div className="min-w-0">
                <span className={it.response.trim() ? 'whitespace-pre-wrap text-ink-100' : 'italic text-ember-400'}>{it.response.trim() || 'not attempted'}</span>
                {itemNotes?.(i)}
              </div>
            </li>
          ))}
        </ol>
        {extra}
      </Card>
      <Card title="Self-assessment">
        <p className="mb-3 body-6 text-ink-400">Read your responses again. Which Officer Like Qualities come through? Be strict: tick a quality only if a response shows it in action, not just names it.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {OLQ_FACTORS.map(f => (
            <div key={f.factor}>
              <div className="mb-1 caption-4 text-ink-500">{f.factor}</div>
              {f.olqs.map(o => (
                <label key={o} className="flex items-center gap-2 py-0.5 body-6 pointer-coarse:py-2">
                  <input type="checkbox" className="accent-accent-500" checked={olqs.includes(o)} onChange={e => setOlqs(e.target.checked ? [...olqs, o] : olqs.filter(x => x !== o))} />{o}
                </label>
              ))}
            </div>
          ))}
        </div>
        <textarea className={`${inputCls} mt-3 h-16`} placeholder="Notes to yourself — negative responses, repeated ideas, what to improve…" value={note} onChange={e => setNote(e.target.value)} />
        <div className="mt-3 flex gap-2">
          {saved ? <span className="self-center body-6 text-accent-300">Saved ✓</span> : <Button onClick={async () => { await db.ssb.add({ test, at: Date.now(), items, olqs, note: note.trim() || undefined }); setSaved(true) }}>Save set</Button>}
          <Button variant="subtle" onClick={onAgain}>Another set</Button>
          <Button variant="ghost" onClick={onExit}>Back to tests</Button>
        </div>
      </Card>
    </div>
  )
}

export function Recorder() {
  const [rec, setRec] = useState<MediaRecorder | null>(null)
  const [url, setUrl] = useState<string>()
  const [err, setErr] = useState('')
  const chunks = useRef<Blob[]>([])

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunks.current = []
      mr.ondataavailable = e => chunks.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        setUrl(URL.createObjectURL(new Blob(chunks.current, { type: mr.mimeType })))
      }
      mr.start()
      setRec(mr)
      setErr('')
    } catch {
      setErr('Microphone not available — allow mic access to record yourself.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {rec ? <Button variant="danger" onClick={() => { rec.stop(); setRec(null) }}>■ Stop recording</Button> : <Button variant="subtle" onClick={start}>● Record myself</Button>}
        {rec && <span className="animate-pulse caption-5 text-ember-400">recording…</span>}
      </div>
      {url && <audio controls src={url} className="w-full" />}
      {err && <p className="caption-5 text-saffron-400">{err}</p>}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { OLQ_FACTORS, TAT_SCENES, shuffle } from '../../data/ssb'
import { db, type SSBTest } from '../../lib/db'
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
  if (pic.kind === 'blank') return <div className="mx-auto flex h-64 max-w-lg items-center justify-center rounded-3xl bg-white text-ink-600 ring-1 ring-fg/10">Blank slide — picture your own scene</div>
  return (
    <div className="mx-auto max-w-lg rounded-3xl bg-fg/[0.04] p-8 text-center text-lg italic text-ink-200">
      “{pic.text}”
      <div className="mt-3 text-xs not-italic text-ink-500">Written scene — add real pictures under SSB → Pictures</div>
    </div>
  )
}

export function SaveSet({ test, items, onAgain, onExit, summary }: {
  test: SSBTest; items: { prompt: string; response: string }[]; onAgain: () => void; onExit: () => void; summary?: string
}) {
  const [olqs, setOlqs] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const filled = items.filter(i => i.response.trim()).length

  return (
    <div className="space-y-14">
      <Card title={`${test} — review`} action={<span className="text-xs text-ink-400">{summary ?? `${filled}/${items.length} completed`}</span>}>
        <ol className="space-y-2 text-sm">
          {items.map((it, i) => (
            <li key={i} className="grid gap-1 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-3">
              <span className="font-medium text-ink-400">{i + 1}. {it.prompt}</span>
              <span className={it.response.trim() ? 'whitespace-pre-wrap text-ink-100' : 'italic text-ember-400'}>{it.response.trim() || 'not attempted'}</span>
            </li>
          ))}
        </ol>
      </Card>
      <Card title="Self-assessment">
        <p className="mb-3 text-sm text-ink-400">Read your responses again. Which Officer Like Qualities come through? Be strict: tick a quality only if a response shows it in action, not just names it.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {OLQ_FACTORS.map(f => (
            <div key={f.factor}>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-500">{f.factor}</div>
              {f.olqs.map(o => (
                <label key={o} className="flex items-center gap-2 py-0.5 text-sm pointer-coarse:py-2">
                  <input type="checkbox" className="accent-iris-500" checked={olqs.includes(o)} onChange={e => setOlqs(e.target.checked ? [...olqs, o] : olqs.filter(x => x !== o))} />{o}
                </label>
              ))}
            </div>
          ))}
        </div>
        <textarea className={`${inputCls} mt-3 h-16`} placeholder="Notes to yourself — negative responses, repeated ideas, what to improve…" value={note} onChange={e => setNote(e.target.value)} />
        <div className="mt-3 flex gap-2">
          {saved ? <span className="self-center text-sm text-iris-300">Saved ✓</span> : <Button onClick={async () => { await db.ssb.add({ test, at: Date.now(), items, olqs, note: note.trim() || undefined }); setSaved(true) }}>Save set</Button>}
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
        {rec && <span className="animate-pulse text-xs text-ember-400">recording…</span>}
      </div>
      {url && <audio controls src={url} className="w-full" />}
      {err && <p className="text-xs text-saffron-400">{err}</p>}
    </div>
  )
}

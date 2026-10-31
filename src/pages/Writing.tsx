import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ESSAY_TOPICS } from '../data/ssb'
import { DESCRIPTIVE_PAPERS } from '../data/sources'
import { db } from '../lib/db'
import { useCountdown } from '../lib/hooks'
import { beep, fmtDateTime, wordCount } from '../lib/util'
import { Badge, Button, Card, Empty, PageHeader, TimerBar, inputBase, inputCls, labelCls } from '../components/ui'

const KINDS = [
  { id: 'Essay', minutes: 30, words: 300 },
  { id: 'Précis', minutes: 20, words: 150 },
  { id: 'Report', minutes: 20, words: 200 },
  { id: 'Argument / counter-argument', minutes: 15, words: 150 },
  { id: 'CSE Mains essay', minutes: 90, words: 1100 },
]

export default function Writing() {
  const history = useLiveQuery(() => db.writings.orderBy('at').reverse().toArray(), []) ?? []
  const [kind, setKind] = useState(KINDS[0])
  const [topic, setTopic] = useState('')
  const [minutes, setMinutes] = useState(KINDS[0].minutes)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState<'setup' | 'write' | 'done'>('setup')
  const [startedAt, setStartedAt] = useState(0)
  const [open, setOpen] = useState<number | null>(null)
  const timer = useCountdown(() => { beep(); finish() })

  const start = () => {
    if (!topic.trim()) setTopic(ESSAY_TOPICS[Math.floor(Math.random() * ESSAY_TOPICS.length)])
    setText('')
    setStartedAt(Date.now())
    setPhase('write')
    timer.start(minutes * 60)
  }

  async function finish() {
    if (phase !== 'write') return
    timer.stop()
    await db.writings.add({ kind: kind.id, topic: topic.trim(), text, words: wordCount(text), minutes: Math.round((Date.now() - startedAt) / 60000), at: Date.now() })
    setPhase('done')
  }

  const words = wordCount(text)

  return (
    <div className="space-y-14">
      <PageHeader title="Writing practice" subtitle="Timed essays, précis and reports for CAPF Paper II and CSE Mains, with a live word count." />

      {phase === 'setup' && (
        <Card>
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
            <div>
              <label className={labelCls}>Type</label>
              <div className="flex flex-wrap gap-1">
                {KINDS.map(k => (
                  <button key={k.id} onClick={() => { setKind(k); setMinutes(k.minutes) }}
                    className={`rounded-full px-3 py-1.5 text-xs ${kind.id === k.id ? 'bg-iris-900 text-iris-300' : 'bg-ink-800 text-ink-400'}`}>{k.id}</button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Minutes</label><input type="number" min={1} className={inputCls} value={minutes} onChange={e => setMinutes(Math.max(1, Number(e.target.value)))} /></div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Topic, or paste a passage for précis (leave empty for a random topic)</label>
            <textarea className={`${inputCls} h-24`} value={topic} onChange={e => setTopic(e.target.value)} />
            <Button variant="ghost" size="sm" className="mt-1" onClick={() => setTopic(ESSAY_TOPICS[Math.floor(Math.random() * ESSAY_TOPICS.length)])}>🎲 Random topic</Button>
          </div>
          <Button size="lg" className="mt-3" onClick={start}>Start writing</Button>
          <div className="mt-10 text-sm">
            <div className="mb-1 text-xs text-ink-500">Real questions — official CAPF Paper II (UPSC):</div>
            {DESCRIPTIVE_PAPERS.map(p => (
              <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="mr-4 text-saffron-400 hover:underline">{p.sitting} ↗</a>
            ))}
          </div>
        </Card>
      )}

      {phase === 'write' && (
        <Card>
          <div className="mb-2 text-sm font-medium text-ink-200">{kind.id}: <span className="whitespace-pre-wrap font-normal text-ink-300">{topic}</span></div>
          <TimerBar remaining={timer.remaining} total={minutes * 60} />
          <textarea autoFocus className={`${inputBase} mt-3 h-[55vh] w-full px-5 py-4 font-serif text-base leading-relaxed`} value={text} onChange={e => setText(e.target.value)} />
          <div className="mt-2 flex items-center gap-3">
            <Badge tone={words >= kind.words ? 'iris' : 'ink'}>{words} / ~{kind.words} words</Badge>
            <Button className="ml-auto" onClick={finish}>Finish</Button>
          </div>
        </Card>
      )}

      {phase === 'done' && (
        <Card>
          <p className="text-sm text-ink-300">Saved — {words} words. Read it once more: is the introduction strong, are there three clear points, and does the conclusion look ahead? Underline what you would cut.</p>
          <div className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-3xl bg-fg/[0.04] p-3 font-serif text-sm text-ink-200">{text || 'Nothing written.'}</div>
          <Button className="mt-3" onClick={() => { setTopic(''); setPhase('setup') }}>Write another</Button>
        </Card>
      )}

      <Card title="Past writing">
        {history.length === 0 ? <Empty>No saved pieces yet.</Empty> : (
          <ul className="divide-y divide-fg/[0.06]">
            {history.map(w => (
              <li key={w.id} className="py-2">
                <button className="flex w-full items-center gap-3 text-left text-sm" onClick={() => setOpen(open === w.id ? null : w.id!)}>
                  <Badge>{w.kind}</Badge>
                  <span className="min-w-0 flex-1 truncate">{w.topic || 'Untitled'}</span>
                  <span className="text-xs text-ink-500">{w.words} words · {w.minutes} min · {fmtDateTime(w.at)}</span>
                </button>
                {open === w.id && (
                  <div className="mt-2 rounded-3xl bg-fg/[0.04] p-3">
                    <div className="whitespace-pre-wrap font-serif text-sm text-ink-200">{w.text}</div>
                    <Button variant="danger" size="sm" className="mt-2" onClick={() => { if (confirm('Delete?')) db.writings.delete(w.id!) }}>Delete</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

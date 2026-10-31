import { useState, type ReactNode } from 'react'
import { LECTURETTE_TOPICS, SRT_SITUATIONS, WAT_WORDS, shuffle } from '../../data/ssb'
import { useCountdown } from '../../lib/hooks'
import { beep } from '../../lib/util'
import { Button, Card, TimerBar, inputBase, inputCls, labelCls } from '../../components/ui'
import { PicView, Recorder, SaveSet, pickPictures, type Pic } from './common'

type RunnerProps = { onExit: () => void }

function Setup({ title, children, onStart, onExit }: { title: string; children: ReactNode; onStart: () => void; onExit: () => void }) {
  return (
    <Card title={title}>
      <div className="space-y-3 text-sm text-ink-300">{children}</div>
      <div className="mt-4 flex gap-2">
        <Button size="lg" onClick={onStart}>Start</Button>
        <Button variant="ghost" onClick={onExit}>Back</Button>
      </div>
    </Card>
  )
}

function CountPicker({ value, options, onChange, unit }: { value: number; options: number[]; onChange: (n: number) => void; unit: string }) {
  return (
    <div className="flex gap-1">
      {options.map(n => (
        <button key={n} onClick={() => onChange(n)} className={`rounded-full px-3 py-1 text-xs ${value === n ? 'bg-iris-900 text-iris-300' : 'bg-ink-800 text-ink-400'}`}>{n} {unit}</button>
      ))}
    </div>
  )
}

// ── WAT: 15 s per word ──────────────────────────────────────────────
export function WAT({ onExit }: RunnerProps) {
  const [count, setCount] = useState(60)
  const [words, setWords] = useState<string[]>([])
  const [i, setI] = useState(-1)
  const [resp, setResp] = useState<string[]>([])
  const [cur, setCur] = useState('')
  const timer = useCountdown(() => next())

  const start = () => {
    setWords(shuffle(WAT_WORDS).slice(0, count))
    setResp([])
    setCur('')
    setI(0)
    timer.start(15)
  }
  function next() {
    setResp(r => [...r, cur])
    setCur('')
    if (i + 1 < words.length) { setI(i + 1); timer.start(15) } else { setI(words.length); beep() }
  }

  if (i < 0) return (
    <Setup title="Word Association Test" onStart={start} onExit={onExit}>
      <p>A word appears for 15 seconds. Write the first meaningful sentence it brings to mind. The next word comes up automatically.</p>
      <p className="text-ink-500">Aim for short, positive, action-oriented sentences. Avoid preaching ("one should…") and repeating ideas.</p>
      <CountPicker value={count} options={[20, 40, 60]} onChange={setCount} unit="words" />
    </Setup>
  )
  if (i >= words.length) return <SaveSet test="WAT" items={words.map((w, k) => ({ prompt: w, response: resp[k] ?? '' }))} onAgain={() => setI(-1)} onExit={onExit} />

  return (
    <Card>
      <div className="mb-2 text-sm text-ink-400">Word {i + 1} of {words.length}</div>
      <TimerBar remaining={timer.remaining} total={15} label={`${timer.remaining}s`} />
      <div className="my-16 text-center text-[clamp(3rem,8vw,6rem)] font-normal leading-none tracking-display text-fg">{words[i]}</div>
      <input key={i} autoFocus className={`${inputBase} w-full px-5 py-3 text-lg`} value={cur} onChange={e => setCur(e.target.value)} placeholder="Your sentence…" />
    </Card>
  )
}

// ── SRT: 30 s per situation, one booklet ────────────────────────────
export function SRT({ onExit }: RunnerProps) {
  const [count, setCount] = useState(60)
  const [sits, setSits] = useState<string[]>([])
  const [resp, setResp] = useState<string[]>([])
  const [phase, setPhase] = useState<'setup' | 'run' | 'done'>('setup')
  const timer = useCountdown(() => { beep(); setPhase('done') })

  const start = () => {
    const s = shuffle(SRT_SITUATIONS).slice(0, count)
    setSits(s)
    setResp(s.map(() => ''))
    setPhase('run')
    timer.start(count * 30)
  }

  if (phase === 'setup') return (
    <Setup title="Situation Reaction Test" onStart={start} onExit={onExit}>
      <p>You get a booklet of situations and 30 seconds per situation on average. Write what you would actually do, briefly and practically.</p>
      <p className="text-ink-500">Complete as many as you can. Show action and a result, not just a feeling.</p>
      <CountPicker value={count} options={[15, 30, 60]} onChange={setCount} unit="situations" />
    </Setup>
  )
  if (phase === 'done') return <SaveSet test="SRT" items={sits.map((s, k) => ({ prompt: s, response: resp[k] }))} onAgain={() => setPhase('setup')} onExit={onExit} />

  return (
    <div className="space-y-3">
      <div className="sticky top-3 z-20 rounded-3xl bg-canvas/85 px-5 py-4 backdrop-blur-md">
        <TimerBar remaining={timer.remaining} total={count * 30} />
        <div className="mt-2 flex justify-between text-xs text-ink-400">
          <span>{resp.filter(r => r.trim()).length}/{sits.length} answered</span>
          <button className="text-saffron-400 hover:underline" onClick={() => { timer.stop(); setPhase('done') }}>Finish early</button>
        </div>
      </div>
      <Card>
        <ol className="space-y-3">
          {sits.map((s, k) => (
            <li key={k} className="text-sm">
              <div className="mb-1 text-ink-200">{k + 1}. {s}</div>
              <textarea rows={2} className={inputCls} value={resp[k]} onChange={e => setResp(r => r.map((x, j) => (j === k ? e.target.value : x)))} />
            </li>
          ))}
        </ol>
      </Card>
    </div>
  )
}

// ── TAT: 30 s view + 4 min story per picture ───────────────────────
export function TAT({ onExit }: RunnerProps) {
  const [count, setCount] = useState(12)
  const [pics, setPics] = useState<Pic[]>([])
  const [idx, setIdx] = useState(-1)
  const [stage, setStage] = useState<'view' | 'write'>('view')
  const [stories, setStories] = useState<string[]>([])
  const timer = useCountdown(() => advance())

  const start = async () => {
    const p = await pickPictures(count, true)
    setPics(p)
    setStories(p.map(() => ''))
    setIdx(0)
    setStage('view')
    timer.start(30)
  }
  function advance() {
    beep(660)
    if (stage === 'view') { setStage('write'); timer.start(240) }
    else if (idx + 1 < pics.length) { setIdx(idx + 1); setStage('view'); timer.start(30) }
    else setIdx(pics.length)
  }

  if (idx < 0) return (
    <Setup title="Thematic Apperception Test" onStart={start} onExit={onExit}>
      <p>Each picture is shown for 30 seconds, then hidden. You get 4 minutes to write a story: what led up to it, what is happening, and how it ends. The last slide is blank.</p>
      <p className="text-ink-500">Give the story a hero (close to your age and sex), a clear problem, practical actions and a positive outcome.</p>
      <CountPicker value={count} options={[4, 8, 12]} onChange={setCount} unit="pictures" />
    </Setup>
  )
  if (idx >= pics.length) return (
    <SaveSet test="TAT" onAgain={() => setIdx(-1)} onExit={onExit}
      items={pics.map((p, k) => ({ prompt: p.kind === 'text' ? p.text : p.kind === 'blank' ? 'Blank slide' : `Picture ${k + 1}`, response: stories[k] }))} />
  )

  return (
    <Card>
      <div className="mb-2 flex justify-between text-sm text-ink-400">
        <span>Picture {idx + 1} of {pics.length} · {stage === 'view' ? 'Observe' : 'Write your story'}</span>
        {stage === 'write' && <span>{stories[idx].trim().split(/\s+/).filter(Boolean).length} words</span>}
      </div>
      <TimerBar remaining={timer.remaining} total={stage === 'view' ? 30 : 240} />
      <div className="mt-4">
        {stage === 'view' ? <PicView pic={pics[idx]} /> : (
          <textarea autoFocus className={`${inputCls} h-72`} value={stories[idx]} onChange={e => setStories(s => s.map((x, j) => (j === idx ? e.target.value : x)))} placeholder="What led to this, what is happening, how does it end?" />
        )}
      </div>
    </Card>
  )
}

// ── PPDT: 30 s hazy picture → 1 min details → 3 min story → 1 min narration ─
export function PPDT({ onExit }: RunnerProps) {
  const [pic, setPic] = useState<Pic | null>(null)
  const [stage, setStage] = useState<'setup' | 'view' | 'details' | 'story' | 'narrate' | 'done'>('setup')
  const [details, setDetails] = useState({ characters: '', gender: '', age: '', mood: '', action: '' })
  const [story, setStory] = useState('')
  const TIMES = { view: 30, details: 60, story: 180, narrate: 60 }
  const timer = useCountdown(() => {
    beep(660)
    if (stage === 'view') { setStage('details'); timer.start(TIMES.details) }
    else if (stage === 'details') { setStage('story'); timer.start(TIMES.story) }
    else if (stage === 'story') setStage('narrate')
    // narration time-up keeps the stage open so the recording can be played back
  })

  const start = async () => {
    setPic((await pickPictures(1, false))[0])
    setDetails({ characters: '', gender: '', age: '', mood: '', action: '' })
    setStory('')
    setStage('view')
    timer.start(TIMES.view)
  }

  if (stage === 'setup') return (
    <Setup title="Picture Perception & Description Test" onStart={start} onExit={onExit}>
      <p>A hazy picture is shown for 30 seconds. In 1 minute, note the characters (number, gender, age, mood) and the main action. Then write a story in 3 minutes. Finally, practise narrating it aloud in 1 minute.</p>
      <p className="text-ink-500">PPDT is the screening test on Day 1 of SSB and in the Coast Guard PSB.</p>
    </Setup>
  )
  if (stage === 'done') {
    const d = details
    return <SaveSet test="PPDT" onAgain={() => setStage('setup')} onExit={onExit}
      items={[
        { prompt: 'Picture', response: pic?.kind === 'text' ? pic.text : 'Uploaded picture' },
        { prompt: 'Characters', response: `${d.characters} · ${d.gender} · age ${d.age} · mood ${d.mood}`.replace(/^ · | · $/g, '') },
        { prompt: 'Action', response: d.action },
        { prompt: 'Story', response: story },
      ]} summary={`${story.trim().split(/\s+/).filter(Boolean).length} words`} />
  }

  const label = { view: 'Observe the picture', details: 'Record the characters', story: 'Write your story', narrate: 'Narrate aloud' }[stage]
  return (
    <Card>
      <div className="mb-2 text-sm text-ink-400">{label}</div>
      {stage !== 'narrate' || timer.running ? <TimerBar remaining={timer.remaining} total={TIMES[stage]} /> : null}
      <div className="mt-4">
        {stage === 'view' && pic && <PicView pic={pic} blur />}
        {stage === 'details' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {(['characters', 'gender', 'age', 'mood'] as const).map(k => (
              <div key={k}><label className={labelCls}>{k === 'characters' ? 'Number of characters' : k[0].toUpperCase() + k.slice(1)}</label>
                <input autoFocus={k === 'characters'} className={inputCls} value={details[k]} onChange={e => setDetails({ ...details, [k]: e.target.value })} placeholder={{ characters: '3', gender: 'M, M, F', age: '25, 30, 22', mood: '+, 0, +' }[k]} /></div>
            ))}
            <div className="sm:col-span-2"><label className={labelCls}>Main action</label><input className={inputCls} value={details.action} onChange={e => setDetails({ ...details, action: e.target.value })} /></div>
          </div>
        )}
        {stage === 'story' && <textarea autoFocus className={`${inputCls} h-64`} value={story} onChange={e => setStory(e.target.value)} placeholder="Write your story…" />}
        {stage === 'narrate' && (
          <div className="space-y-3">
            <div className="whitespace-pre-wrap rounded-3xl bg-fg/[0.04] p-3 text-sm text-ink-300">{story || 'No story written.'}</div>
            <p className="text-sm text-ink-400">Narrate your story aloud in 1 minute: clear, confident and at a steady pace. Then discuss it as you would in the group.</p>
            <div className="flex flex-wrap gap-2">
              {!timer.running && <Button onClick={() => timer.start(TIMES.narrate)}>Start 1-minute narration</Button>}
              <Button variant="subtle" onClick={() => { timer.stop(); setStage('done') }}>Finish</Button>
            </div>
            <Recorder />
          </div>
        )}
      </div>
    </Card>
  )
}

// ── SD: 15 minutes, five paragraphs ─────────────────────────────────
const SD_PARTS = [
  'What do your parents think of you?',
  'What do your teachers / employers think of you?',
  'What do your friends and colleagues think of you?',
  'What do you think of yourself?',
  'What qualities would you like to develop?',
]
export function SD({ onExit }: RunnerProps) {
  const [phase, setPhase] = useState<'setup' | 'run' | 'done'>('setup')
  const [text, setText] = useState(SD_PARTS.map(() => ''))
  const timer = useCountdown(() => { beep(); setPhase('done') })

  if (phase === 'setup') return (
    <Setup title="Self Description" onStart={() => { setText(SD_PARTS.map(() => '')); setPhase('run'); timer.start(900) }} onExit={onExit}>
      <p>Five short paragraphs in 15 minutes. Be honest and specific, and use examples. The board compares this with your PIQ, your psych tests and how you come across in the interview.</p>
    </Setup>
  )
  if (phase === 'done') return <SaveSet test="SD" items={SD_PARTS.map((p, k) => ({ prompt: p, response: text[k] }))} onAgain={() => setPhase('setup')} onExit={onExit} />

  return (
    <div className="space-y-3">
      <div className="sticky top-3 z-20 rounded-3xl bg-canvas/85 px-5 py-4 backdrop-blur-md">
        <TimerBar remaining={timer.remaining} total={900} />
        <button className="mt-2 text-xs text-saffron-400 hover:underline" onClick={() => { timer.stop(); setPhase('done') }}>Finish early</button>
      </div>
      <Card>
        <div className="space-y-6">
          {SD_PARTS.map((p, k) => (
            <div key={p}>
              <label className="mb-1 block text-sm font-medium text-ink-200">{k + 1}. {p}</label>
              <textarea rows={4} className={inputCls} value={text[k]} onChange={e => setText(t => t.map((x, j) => (j === k ? e.target.value : x)))} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Lecturette: choose 1 of 4 topics, 3 min prep, 3 min talk ──────────
export function Lecturette({ onExit }: RunnerProps) {
  const [options, setOptions] = useState<string[]>([])
  const [topic, setTopic] = useState('')
  const [stage, setStage] = useState<'setup' | 'choose' | 'prep' | 'speak' | 'done'>('setup')
  const [notes, setNotes] = useState('')
  const [spoken, setSpoken] = useState(false)
  const timer = useCountdown(() => {
    beep(660)
    if (stage === 'prep') { setStage('speak'); timer.start(180) }
    else setSpoken(true) // stay on screen so the recording can be played back
  })

  if (stage === 'setup') return (
    <Setup title="Lecturette" onStart={() => { setOptions(shuffle(LECTURETTE_TOPICS).slice(0, 4)); setNotes(''); setStage('choose') }} onExit={onExit}>
      <p>Pick one of four topics. You get 3 minutes to prepare, then speak for 3 minutes. Record yourself and play it back: check your pace, filler words and structure (introduction, three points, conclusion).</p>
    </Setup>
  )
  if (stage === 'choose') return (
    <Card title="Choose your topic">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(t => <Button key={t} variant="subtle" size="lg" onClick={() => { setTopic(t); setSpoken(false); setStage('prep'); timer.start(180) }}>{t}</Button>)}
      </div>
    </Card>
  )
  if (stage === 'done') return <SaveSet test="Lecturette" items={[{ prompt: topic, response: notes }]} onAgain={() => setStage('setup')} onExit={onExit} summary="notes saved" />

  return (
    <Card title={topic}>
      <div className="mb-3 text-sm text-ink-400">{stage === 'prep' ? 'Prepare your points' : spoken ? 'Time up — play back your recording' : 'Speak now — 3 minutes'}</div>
      {timer.running && <TimerBar remaining={timer.remaining} total={180} />}
      <textarea className={`${inputCls} mt-4 h-48`} value={notes} onChange={e => setNotes(e.target.value)} placeholder={'Intro —\n1.\n2.\n3.\nConclusion —'} readOnly={stage === 'speak'} />
      <div className="mt-3 flex flex-wrap items-start gap-3">
        {stage === 'prep' && <Button variant="subtle" onClick={() => { setStage('speak'); timer.start(180) }}>Start speaking now</Button>}
        {stage === 'speak' && <Button variant="subtle" onClick={() => { timer.stop(); setStage('done') }}>Finish</Button>}
        {stage === 'speak' && <div className="min-w-64 flex-1"><Recorder /></div>}
      </div>
    </Card>
  )
}

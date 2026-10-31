import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { EMPTY_PROFILE, GD_TOPICS, OLQ_FACTORS, interviewQuestions, type InterviewProfile } from '../data/ssb'
import { db, useSetting, type SSBTest } from '../lib/db'
import { go } from '../lib/hooks'
import { fmtDateTime } from '../lib/util'
import { Badge, Button, Card, Empty, PageHeader, Progress, Tabs, inputCls, labelCls } from '../components/ui'
import { BlobImage } from './ssb/common'
import { Lecturette, PPDT, SD, SRT, TAT, WAT } from './ssb/Runners'

const RUNNERS = { wat: WAT, srt: SRT, tat: TAT, ppdt: PPDT, sd: SD, lecturette: Lecturette }
type Tab = 'tests' | 'responses' | 'olq' | 'interview' | 'pictures'

const TESTS = [
  { id: 'ppdt', name: 'PPDT', full: 'Picture Perception & Description', format: '30 s view · 1 min details · 3 min story', where: 'SSB Day 1, ICG PSB' },
  { id: 'tat', name: 'TAT', full: 'Thematic Apperception Test', format: '12 pictures · 30 s + 4 min each', where: 'Psychology' },
  { id: 'wat', name: 'WAT', full: 'Word Association Test', format: '60 words · 15 s each', where: 'Psychology' },
  { id: 'srt', name: 'SRT', full: 'Situation Reaction Test', format: '60 situations · 30 min', where: 'Psychology' },
  { id: 'sd', name: 'SD', full: 'Self Description', format: '5 paragraphs · 15 min', where: 'Psychology' },
  { id: 'lecturette', name: 'Lecturette', full: 'Lecturette', format: '1 of 4 topics · 3 min prep + 3 min talk', where: 'GTO' },
]

export default function SSB({ sub }: { sub?: string }) {
  const Runner = sub && sub in RUNNERS ? RUNNERS[sub as keyof typeof RUNNERS] : null
  if (Runner) return (
    <div>
      <PageHeader title={TESTS.find(t => t.id === sub)?.full ?? 'SSB'} />
      <Runner onExit={() => go('ssb')} />
    </div>
  )

  const tab: Tab = sub === 'responses' || sub === 'olq' || sub === 'interview' || sub === 'pictures' ? sub : 'tests'
  return (
    <div>
      <PageHeader title="SSB & Interview" subtitle="Psych tests on the real timings, OLQ self-assessment, and interview prep built from your own PIQ / DAF details." />
      <Tabs<Tab> value={tab} onChange={t => go(t === 'tests' ? 'ssb' : `ssb/${t}`)} tabs={[
        { id: 'tests', label: 'Tests' }, { id: 'responses', label: 'My responses' }, { id: 'olq', label: 'OLQs' },
        { id: 'interview', label: 'Interview' }, { id: 'pictures', label: 'Pictures' },
      ]} />
      {tab === 'tests' && <TestsTab />}
      {tab === 'responses' && <Responses />}
      {tab === 'olq' && <OLQTab />}
      {tab === 'interview' && <Interview />}
      {tab === 'pictures' && <Pictures />}
    </div>
  )
}

function TestsTab() {
  const [gd, setGd] = useState<string | null>(null)
  return (
    <div className="space-y-14">
      <div className="grid gap-x-14 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {TESTS.map(t => (
          <a key={t.id} href={`#/ssb/${t.id}`} className="group block">
            <Badge>{t.where}</Badge>
            <div className="mt-4 text-[42px] font-normal leading-none tracking-display text-fg transition-colors group-hover:text-iris-300">{t.name}</div>
            <div className="mt-3 text-ink-300">{t.full}</div>
            <div className="mt-1 text-sm font-light text-ink-500">{t.format}</div>
            <div className="label mt-4 text-[11px] text-ink-500 transition-colors group-hover:text-saffron-400">Start →</div>
          </a>
        ))}
      </div>
      <Card title="Group discussion topic">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="subtle" onClick={() => setGd(GD_TOPICS[Math.floor(Math.random() * GD_TOPICS.length)])}>Draw a topic</Button>
          {gd && <span className="text-ink-100">{gd}</span>}
        </div>
        <p className="mt-2 text-xs text-ink-500">Practise with friends: 15–20 minutes. Open with facts, build on others' points, and help the group reach a conclusion.</p>
      </Card>
      <Card>
        <p className="text-sm text-ink-400">
          <span className="font-medium text-ink-200">CAPF and CSE</span> end with an interview / personality test, not SSB psych tests. Use the Interview tab, and the Writing page for CAPF Paper II.
          <span className="font-medium text-ink-200"> Coast Guard</span> has a PSB (cognitive test + PP&DT) followed by an FSB with psych tests, group tasks and an interview.
        </p>
      </Card>
    </div>
  )
}

function Responses() {
  const [filter, setFilter] = useState<SSBTest | 'all'>('all')
  const [open, setOpen] = useState<number | null>(null)
  const rows = useLiveQuery(() => db.ssb.orderBy('at').reverse().toArray(), []) ?? []
  const shown = rows.filter(r => filter === 'all' || r.test === filter)
  const tests: (SSBTest | 'all')[] = ['all', 'WAT', 'SRT', 'TAT', 'PPDT', 'SD', 'Lecturette']

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tests.map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1 text-sm ${filter === t ? 'bg-iris-500 text-white' : 'bg-ink-800 text-ink-300'}`}>
            {t === 'all' ? 'All' : t} <span className="opacity-60">{t === 'all' ? rows.length : rows.filter(r => r.test === t).length}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? <Empty>No saved sets yet. Complete a test and press Save set.</Empty> : (
        <Card>
          <ul className="divide-y divide-fg/[0.06]">
            {shown.map(r => {
              const done = r.items.filter(i => i.response.trim()).length
              return (
                <li key={r.id} className="py-2.5">
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id!)}>
                    <Badge tone="iris">{r.test}</Badge>
                    <span className="flex-1 text-sm">{fmtDateTime(r.at)}</span>
                    <span className="text-xs text-ink-500">{done}/{r.items.length} done · {r.olqs.length} OLQs</span>
                  </button>
                  {open === r.id && (
                    <div className="mt-3 space-y-2 rounded-3xl bg-fg/[0.04] p-3 text-sm">
                      {r.items.map((it, k) => (
                        <div key={k} className="grid gap-1 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-3">
                          <span className="text-ink-400">{it.prompt}</span>
                          <span className="whitespace-pre-wrap text-ink-100">{it.response || '—'}</span>
                        </div>
                      ))}
                      {r.olqs.length > 0 && <div className="flex flex-wrap gap-1 pt-2">{r.olqs.map(o => <Badge key={o} tone="iris">{o}</Badge>)}</div>}
                      {r.note && <div className="pt-1 text-ink-400">📝 {r.note}</div>}
                      <Button variant="danger" size="sm" onClick={() => { if (confirm('Delete this set?')) db.ssb.delete(r.id!) }}>Delete</Button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}

function OLQTab() {
  const rows = useLiveQuery(() => db.ssb.toArray(), []) ?? []
  const counts = new Map<string, number>()
  rows.forEach(r => r.olqs.forEach(o => counts.set(o, (counts.get(o) ?? 0) + 1)))
  const max = Math.max(1, ...counts.values())

  return (
    <div className="space-y-14">
      <Card>
        <p className="text-sm text-ink-400">
          The board assesses 15 Officer Like Qualities, in four groups. The bars count how often you ticked each one when reviewing your own sets.
          Short bars point to qualities your responses rarely show; work them into your actions and stories.
        </p>
      </Card>
      <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
        {OLQ_FACTORS.map(f => (
          <Card key={f.factor} title={f.factor}>
            <div className="space-y-2.5">
              {f.olqs.map(o => (
                <div key={o}>
                  <div className="mb-1 flex justify-between text-sm"><span>{o}</span><span className="tabular-nums text-ink-500">{counts.get(o) ?? 0}</span></div>
                  <Progress value={((counts.get(o) ?? 0) / max) * 100} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const PROFILE_FIELDS: { key: keyof InterviewProfile; label: string; placeholder: string }[] = [
  { key: 'name', label: 'Name', placeholder: '' },
  { key: 'hometown', label: 'Hometown / district', placeholder: 'e.g. Ludhiana' },
  { key: 'state', label: 'State', placeholder: 'e.g. Punjab' },
  { key: 'degree', label: 'Degree / branch', placeholder: 'e.g. B.Tech Computer Science' },
  { key: 'college', label: 'College', placeholder: '' },
  { key: 'hobbies', label: 'Hobbies (comma-separated)', placeholder: 'reading, sketching' },
  { key: 'sports', label: 'Sports (comma-separated)', placeholder: 'football, athletics' },
  { key: 'achievements', label: 'Achievements (comma-separated)', placeholder: 'college fest coordinator' },
  { key: 'ncc', label: 'NCC (certificate / wing)', placeholder: 'e.g. B certificate, Army wing' },
  { key: 'fatherJob', label: "Father's occupation", placeholder: '' },
  { key: 'attempts', label: 'Previous SSB / interview attempts', placeholder: '0' },
  { key: 'entry', label: 'Entry / service applied for', placeholder: 'e.g. CDS – IMA' },
]

function Interview() {
  const [profile, setProfile] = useSetting<InterviewProfile>('profile', EMPTY_PROFILE)
  const [draft, setDraft] = useState<InterviewProfile | null>(null)
  const p = draft ?? profile
  const questions = interviewQuestions(profile)
  const areas = [...new Set(questions.map(q => q.area))]

  return (
    <div className="grid gap-x-16 gap-y-14 lg:grid-cols-[22rem_1fr]">
      <Card title="Your PIQ / DAF details">
        <div className="space-y-2">
          {PROFILE_FIELDS.map(f => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input className={inputCls} placeholder={f.placeholder} value={p[f.key]} onChange={e => setDraft({ ...p, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
        <Button className="mt-3" disabled={!draft} onClick={() => { if (draft) setProfile(draft); setDraft(null) }}>Save & generate</Button>
        <p className="mt-2 text-xs text-ink-500">Stored only on this device.</p>
      </Card>
      <Card title={`Likely questions (${questions.length})`}>
        <p className="mb-3 text-sm text-ink-400">Answer each one aloud, ideally while recording, or with a friend acting as the interviewing officer. Every claim in your PIQ needs a real example behind it.</p>
        <div className="space-y-6">
          {areas.map(a => (
            <div key={a}>
              <div className="mb-1 text-xs font-medium uppercase tracking-wide text-iris-400">{a}</div>
              <ul className="list-inside list-disc space-y-1 text-sm text-ink-200">
                {questions.filter(q => q.area === a).map(q => <li key={q.q}>{q.q}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function Pictures() {
  const images = useLiveQuery(() => db.images.toArray(), []) ?? []
  const fileRef = useRef<HTMLInputElement>(null)

  const add = async (files: FileList) => {
    await db.images.bulkAdd([...files].filter(f => f.type.startsWith('image/')).map(f => ({ blob: f, name: f.name, at: Date.now() })))
  }

  return (
    <div className="space-y-14">
      <Card>
        <p className="text-sm text-ink-400">
          Add practice pictures for TAT and PPDT: scans from your SSB practice books, photos you take, or images you're allowed to use. They stay in this browser.
          Until you add some, the tests use written scene descriptions.
        </p>
        <Button className="mt-3" onClick={() => fileRef.current?.click()}>Add pictures…</Button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) add(e.target.files); e.target.value = '' }} />
      </Card>
      {images.length === 0 ? <Empty>No pictures yet.</Empty> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map(img => (
            <div key={img.id} className="group relative overflow-hidden rounded-3xl">
              <BlobImage blob={img.blob} className="aspect-[4/3] w-full object-cover" />
              <button onClick={() => db.images.delete(img.id!)} className="absolute right-1 top-1 rounded-full bg-ink-950/80 px-2 py-0.5 text-xs text-ember-300 opacity-0 group-hover:opacity-100">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

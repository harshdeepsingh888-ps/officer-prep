import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type NewsNote } from '../lib/db'
import { go } from '../lib/hooks'
import { addFlashcards } from '../lib/learning'
import { addDays, fmtDate, fmtDateTime, isoOf, todayISO, weekStart } from '../lib/util'
import { Badge, Button, Card, Empty, PageHeader, Tabs, inputCls, labelCls } from '../components/ui'

// Current affairs: headlines fetched twice a day by the deploy workflow (scripts/fetch-news.mjs),
// your own notes, and a weekly recap of them.

export const NEWS_CATEGORIES = [
  { id: 'national', label: 'National' },
  { id: 'international', label: 'International' },
  { id: 'defence', label: 'Defence' },
  { id: 'economy', label: 'Economy' },
  { id: 'science', label: 'Science & tech' },
  { id: 'environment', label: 'Environment' },
  { id: 'sports', label: 'Sports' },
  { id: 'appointments', label: 'Appointments & awards' },
  { id: 'static', label: 'Static GK' }, // notes only
]
const labelOf = (id: string) => NEWS_CATEGORIES.find(c => c.id === id)?.label ?? id
const CARD_DECK = 'Current affairs'

type Headline = { title: string; summary: string; link: string; source: string; category: string; score?: number; published: string }
type Feed = { generatedAt: string; sources: string[]; items: Headline[] }
type Tab = 'today' | 'notes' | 'recap'

const OFFICIAL = [
  { title: 'PIB press releases', detail: 'Official releases from every ministry; filter by Ministry of Defence or External Affairs', url: 'https://pib.gov.in' },
  { title: 'Ministry of Defence', detail: 'Inductions, exercises, appointments and agreements', url: 'https://www.mod.gov.in' },
  { title: 'Ministry of External Affairs', detail: 'Visits, agreements and joint statements', url: 'https://www.mea.gov.in' },
  { title: 'ISRO', detail: 'Launches and missions', url: 'https://www.isro.gov.in' },
]

export default function News({ sub }: { sub?: string }) {
  const tab: Tab = sub === 'notes' || sub === 'recap' ? sub : 'today'
  const [draft, setDraft] = useState<Partial<NewsNote> | null>(null)
  const count = useLiveQuery(() => db.notes.count(), []) ?? 0
  const write = (d: Partial<NewsNote>) => { setDraft(d); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div>
      <PageHeader title="Current affairs" eyebrow="Daily"
        subtitle="Exam-relevant headlines twice a day, sorted by category, each linking to the full story. Note what matters in your own words: notes can become revision cards and add up to a weekly recap." />
      <Tabs<Tab> value={tab} onChange={t => go(t === 'today' ? 'news' : `news/${t}`)}
        tabs={[{ id: 'today', label: 'Headlines' }, { id: 'notes', label: `My notes${count ? ` · ${count}` : ''}` }, { id: 'recap', label: 'Weekly recap' }]} />
      {draft && <NoteForm key={draft.id ?? draft.link ?? 'new'} draft={draft} onDone={() => setDraft(null)} />}
      {tab === 'today' && <Headlines onNote={write} />}
      {tab === 'notes' && <Notes onWrite={write} />}
      {tab === 'recap' && <Recap />}
    </div>
  )
}

function Chips({ items, value, onChange }: { items: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
      {items.map(i => (
        <button key={i.id} onClick={() => onChange(i.id)} aria-pressed={value === i.id}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors ${value === i.id ? 'bg-iris-500 text-white' : 'bg-fg/[0.07] text-ink-300 hover:bg-fg/[0.12]'}`}>{i.label}</button>
      ))}
    </div>
  )
}

const dayLabel = (iso: string) => (iso === todayISO() ? 'Today' : iso === addDays(todayISO(), -1) ? 'Yesterday' : fmtDate(iso))

function Headlines({ onNote }: { onNote: (d: Partial<NewsNote>) => void }) {
  const [feed, setFeed] = useState<Feed | 'error' | null>(null)
  const [cat, setCat] = useState('all')
  const [days, setDays] = useState(2)
  const noted = new Set(useLiveQuery(() => db.notes.toArray(), [])?.map(n => n.link) ?? [])

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}news/latest.json`, { cache: 'no-cache' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((f: Feed) => setFeed(f))
      .catch(() => setFeed('error'))
  }, [])

  if (feed === null) return <Empty>Loading headlines…</Empty>
  const official = (
    <Card title="Official sources">
      <p className="mb-4 text-sm font-light text-ink-400">Read these in your browser; they don’t allow apps to collect their releases automatically.</p>
      <ul className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        {OFFICIAL.map(o => (
          <li key={o.url}>
            <a href={o.url} target="_blank" rel="noreferrer" className="text-saffron-400 hover:underline">{o.title} ↗</a>
            <div className="text-xs text-ink-500">{o.detail}</div>
          </li>
        ))}
      </ul>
    </Card>
  )
  if (feed === 'error' || !feed.items.length) {
    return (
      <div className="space-y-14">
        <Empty>Headlines aren’t available right now. They’re refreshed twice a day (7 am and 7 pm); open this page once while online to keep a copy for offline use.</Empty>
        {official}
      </div>
    )
  }

  const counts = new Map<string, number>()
  feed.items.forEach(i => counts.set(i.category, (counts.get(i.category) ?? 0) + 1))
  const chips = [{ id: 'all', label: `All · ${feed.items.length}` }, ...NEWS_CATEGORIES.filter(c => counts.get(c.id)).map(c => ({ id: c.id, label: `${c.label} · ${counts.get(c.id)}` }))]
  const shown = feed.items.filter(i => cat === 'all' || i.category === cat)
  const byDay = new Map<string, Headline[]>()
  for (const i of shown) {
    const d = isoOf(new Date(i.published))
    byDay.set(d, [...(byDay.get(d) ?? []), i])
  }
  const dayList = [...byDay.keys()].sort().reverse()

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Chips items={chips} value={cat} onChange={c => { setCat(c); setDays(2) }} />
        <p className="text-xs font-light text-ink-500">Updated {fmtDateTime(Date.parse(feed.generatedAt))} · from {feed.sources.join(' and ')} · tap a headline to read it on their site.</p>
      </div>
      {dayList.slice(0, days).map(day => (
        <section key={day}>
          <h2 className="label mb-2 text-saffron-400">{dayLabel(day)}</h2>
          <ul className="divide-y divide-fg/[0.06]">
            {byDay.get(day)!.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.published.localeCompare(a.published)).map(h => (
              <li key={h.link} className="flex flex-wrap items-start gap-x-4 gap-y-2 py-4">
                <div className="min-w-[15rem] flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    {cat === 'all' && <Badge tone={h.category === 'defence' ? 'iris' : 'ink'}>{labelOf(h.category)}</Badge>}
                    <span>{h.source} · {new Date(h.published).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span>
                  </div>
                  <a href={h.link} target="_blank" rel="noreferrer" className="text-[17px] leading-snug text-ink-100 hover:text-fg">{h.title} <span className="text-ink-500">↗</span></a>
                  {h.summary && <p className="mt-1 line-clamp-2 text-sm font-light text-ink-400">{h.summary}</p>}
                </div>
                {noted.has(h.link)
                  ? <Badge tone="verdant">noted</Badge>
                  : <Button variant="subtle" size="sm" onClick={() => onNote({ title: h.title, link: h.link, source: h.source, category: h.category, date: isoOf(new Date(h.published)) })}>+ Note</Button>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {days < dayList.length && <Button variant="subtle" onClick={() => setDays(d => d + 2)}>Show earlier days</Button>}
      {official}
    </div>
  )
}

function NoteForm({ draft, onDone }: { draft: Partial<NewsNote>; onDone: () => void }) {
  const [n, setN] = useState({ date: todayISO(), category: 'national', title: '', text: '', link: '', source: '', ...draft })
  const [card, setCard] = useState({ make: false, front: '', back: '' })
  const set = (patch: Partial<typeof n>) => setN(x => ({ ...x, ...patch }))
  const makeCard = card.make && card.front.trim() !== '' && card.back.trim() !== ''

  const save = async () => {
    const note: NewsNote = {
      ...n, title: n.title.trim(), text: n.text.trim(), link: n.link?.trim() || undefined, source: n.source?.trim() || undefined,
      carded: n.carded || makeCard, at: n.at ?? Date.now(),
    }
    if (n.id) await db.notes.put(note)
    else await db.notes.add(note)
    if (makeCard) await addFlashcards(CARD_DECK, [[card.front.trim(), card.back.trim()]])
    onDone()
  }

  return (
    <div className="mb-14 rounded-3xl bg-fg/[0.04] px-6 py-6">
      <h2 className="label mb-5 text-saffron-400">{n.id ? 'Edit note' : draft.link ? 'Note this headline' : 'New note'}</h2>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label className={labelCls} htmlFor="note-date">Date</label>
          <input id="note-date" type="date" className={inputCls} value={n.date} onChange={e => set({ date: e.target.value })} />
        </div>
        <div>
          <label className={labelCls} htmlFor="note-cat">Category</label>
          <select id="note-cat" className={inputCls} value={n.category} onChange={e => set({ category: e.target.value })}>
            {NEWS_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="note-title">Headline</label>
          <input id="note-title" className={inputCls} value={n.title} onChange={e => set({ title: e.target.value })} placeholder="What happened, in one line" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="note-text">Key points</label>
          <textarea id="note-text" rows={4} className={inputCls} value={n.text} onChange={e => set({ text: e.target.value })}
            placeholder="Who, where, numbers and names, and why it matters for the exam (e.g. the static GK behind it)" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="note-link">Link (optional)</label>
          <input id="note-link" className={inputCls} value={n.link ?? ''} onChange={e => set({ link: e.target.value })} placeholder="https://…" />
        </div>
      </div>
      <label className="mt-5 flex items-center gap-2 text-sm text-ink-200">
        <input type="checkbox" className="size-4 accent-iris-500 pointer-coarse:size-5" checked={card.make} onChange={e => setCard(c => ({ ...c, make: e.target.checked }))} />
        Also make a revision card (it joins your daily review in the “{CARD_DECK}” deck)
      </label>
      {card.make && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="card-q">Question</label>
            <input id="card-q" className={inputCls} value={card.front} onChange={e => setCard(c => ({ ...c, front: e.target.value }))} placeholder="e.g. Which satellite did ISRO launch to restore NavIC?" />
          </div>
          <div>
            <label className={labelCls} htmlFor="card-a">Answer</label>
            <input id="card-a" className={inputCls} value={card.back} onChange={e => setCard(c => ({ ...c, back: e.target.value }))} placeholder="e.g. NVS-03" />
          </div>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button disabled={!n.title.trim() || (card.make && !makeCard)} onClick={save}>Save note</Button>
        <Button variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  )
}

function NoteItem({ n, onEdit }: { n: NewsNote; onEdit: () => void }) {
  return (
    <li className="py-4">
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span>{fmtDate(n.date)}</span>
        <Badge tone={n.category === 'defence' ? 'iris' : 'ink'}>{labelOf(n.category)}</Badge>
        {n.carded && <Badge tone="verdant">card</Badge>}
      </div>
      {n.link
        ? <a href={n.link} target="_blank" rel="noreferrer" className="text-[17px] leading-snug text-ink-100 hover:text-fg">{n.title} <span className="text-ink-500">↗</span></a>
        : <div className="text-[17px] leading-snug text-ink-100">{n.title}</div>}
      {n.text && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-300">{n.text}</p>}
      <div className="mt-2 flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => { if (confirm(`Delete the note “${n.title}”?`)) db.notes.delete(n.id!) }}>Delete</Button>
      </div>
    </li>
  )
}

function Notes({ onWrite }: { onWrite: (d: Partial<NewsNote>) => void }) {
  const notes = useLiveQuery(() => db.notes.orderBy('date').reverse().toArray(), []) ?? []
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  const shown = notes.filter(n => (cat === 'all' || n.category === cat) && words.every(w => `${n.title} ${n.text}`.toLowerCase().includes(w)))
  const byMonth = new Map<string, NewsNote[]>()
  for (const n of shown) byMonth.set(n.date.slice(0, 7), [...(byMonth.get(n.date.slice(0, 7)) ?? []), n])

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => onWrite({})}>+ New note</Button>
        <input className={`${inputCls} max-w-xs`} value={q} onChange={e => setQ(e.target.value)} placeholder="Search notes" aria-label="Search notes" />
      </div>
      <Chips items={[{ id: 'all', label: 'All' }, ...NEWS_CATEGORIES]} value={cat} onChange={setCat} />
      {notes.length === 0 ? <Empty>No notes yet. Tap “+ Note” on a headline, or write one yourself — including static GK you come across.</Empty>
        : shown.length === 0 ? <Empty>No notes match.</Empty> : (
          [...byMonth.entries()].map(([month, list]) => (
            <section key={month}>
              <h2 className="label mb-2 text-saffron-400">{new Date(month + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {list.length}</h2>
              <ul className="divide-y divide-fg/[0.06]">{list.map(n => <NoteItem key={n.id} n={n} onEdit={() => onWrite(n)} />)}</ul>
            </section>
          ))
        )}
    </div>
  )
}

function Recap() {
  const [period, setPeriod] = useState('this')
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? []
  const cards = useLiveQuery(() => db.cards.where('deck').equals(CARD_DECK).count(), []) ?? 0
  const [copied, setCopied] = useState('')

  const monday = weekStart()
  const today = todayISO()
  const range = period === 'last' ? { from: addDays(monday, -7), to: addDays(monday, -1), label: `week of ${fmtDate(addDays(monday, -7))}` }
    : period === 'month' ? { from: today.slice(0, 8) + '01', to: today, label: new Date(today).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) }
    : { from: monday, to: today, label: `week of ${fmtDate(monday)}` }
  const inRange = notes.filter(n => n.date >= range.from && n.date <= range.to).sort((a, b) => a.date.localeCompare(b.date))
  const groups = NEWS_CATEGORIES.map(c => ({ ...c, notes: inRange.filter(n => n.category === c.id) })).filter(g => g.notes.length)

  const copy = async () => {
    const text = [`Current affairs · ${range.label}`, ...groups.flatMap(g => ['', g.label.toUpperCase(), ...g.notes.map(n => `• ${n.title}${n.text ? ` — ${n.text.replace(/\s+/g, ' ')}` : ''}`)])].join('\n')
    try { await navigator.clipboard.writeText(text); setCopied('Copied ✓') } catch { setCopied('Couldn’t copy') }
    setTimeout(() => setCopied(''), 2500)
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Chips items={[{ id: 'this', label: 'This week' }, { id: 'last', label: 'Last week' }, { id: 'month', label: 'This month' }]} value={period} onChange={setPeriod} />
        <div className="flex flex-wrap gap-2">
          <Button variant="subtle" disabled={!inRange.length} onClick={copy}>{copied || 'Copy recap'}</Button>
          <Button variant="subtle" disabled={!cards} onClick={() => go('revise')}>Revise cards · {cards}</Button>
        </div>
      </div>
      {groups.length === 0 ? <Empty>No notes for the {range.label}. Notes you add on the Headlines or My notes tabs collect here, grouped by category.</Empty> : (
        <div className="grid gap-x-16 gap-y-12 lg:grid-cols-2">
          {groups.map(g => (
            <Card key={g.id} title={`${g.label} · ${g.notes.length}`}>
              <ul className="space-y-4">
                {g.notes.map(n => (
                  <li key={n.id}>
                    <div className="text-ink-100">{n.title}</div>
                    {n.text && <p className="mt-0.5 whitespace-pre-wrap text-sm font-light text-ink-400">{n.text}</p>}
                    <div className="mt-0.5 text-xs text-ink-600">{fmtDate(n.date)}</div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      <p className="max-w-2xl text-sm font-light text-ink-500">
        Want an MCQ quiz on the week? Paste current-affairs quiz posts from the channels you follow into <a href="#/practice/mine" className="text-saffron-400 hover:underline">My questions</a> with the topic “Current affairs”, then take a topic test on it.
      </p>
    </div>
  )
}

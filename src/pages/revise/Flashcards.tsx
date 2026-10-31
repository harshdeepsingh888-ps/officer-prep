import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { STARTER_DECKS } from '../../data/decks'
import { db } from '../../lib/db'
import { MISTAKE_DECK, addFlashcards, addStarterDeck, deleteDeck } from '../../lib/learning'
import { parsePastedCards } from '../../lib/paste'
import { isMastered, isNew } from '../../lib/srs'
import { fmtDateTime } from '../../lib/util'
import { Badge, Button, Card, Empty, inputBase, inputCls, labelCls } from '../../components/ui'

export default function Flashcards() {
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? []
  const [browse, setBrowse] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const decks = [...new Set(cards.filter(c => c.deck !== MISTAKE_DECK).map(c => c.deck))].sort()
  const starterNames = new Set(STARTER_DECKS.map(d => d.name))
  const statsFor = (deck: string) => {
    const cs = cards.filter(c => c.deck === deck)
    return { total: cs.length, due: cs.filter(c => c.status === 'active' && c.due <= Date.now() && !isNew(c)).length, fresh: cs.filter(isNew).length, mastered: cs.filter(isMastered).length }
  }

  return (
    <div className="space-y-16">
      <Card title="Starter decks">
        <p className="mb-6 text-sm text-ink-400">Facts that come up again and again in defence GK, polity, English and maths. Add a deck and its cards join your daily review a few at a time.</p>
        <ul className="divide-y divide-fg/[0.06]">
          {STARTER_DECKS.map(d => {
            const added = cards.some(c => c.deck === d.name)
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4">
                <div className="min-w-0 flex-1">
                  <div className="text-ink-100">{d.name} <span className="text-sm text-ink-500">· {d.cards.length} cards</span></div>
                  <div className="text-sm font-light text-ink-500">{d.description}</div>
                </div>
                {added
                  ? <Badge tone="verdant">added</Badge>
                  : <Button variant="subtle" size="sm" onClick={async () => setMsg(`Added ${await addStarterDeck(d)} cards from ${d.name}.`)}>Add deck</Button>}
              </li>
            )
          })}
        </ul>
        {msg && <p className="mt-3 text-sm text-verdant-300">{msg}</p>}
      </Card>

      <Card title="My decks">
        {decks.length === 0 ? <Empty>No decks yet: add a starter deck above or create your own below.</Empty> : (
          <ul className="divide-y divide-fg/[0.06]">
            {decks.map(d => {
              const s = statsFor(d)
              return (
                <li key={d} className="py-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <button className="min-w-0 flex-1 text-left text-ink-100 hover:text-fg" onClick={() => setBrowse(browse === d ? null : d)}>{d}</button>
                    <span className="text-xs text-ink-500">{s.total} cards · {s.due} due · {s.fresh} new · {s.mastered} mastered</span>
                    <Button variant="ghost" size="sm" onClick={() => setBrowse(browse === d ? null : d)}>{browse === d ? 'Hide' : 'Browse'}</Button>
                    <Button variant="danger" size="sm" onClick={() => { if (confirm(`Delete the deck "${d}" and its ${s.total} cards?`)) deleteDeck(d) }}>Delete</Button>
                  </div>
                  {browse === d && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {cards.filter(c => c.deck === d).sort((a, b) => a.createdAt - b.createdAt).map(c => (
                        <li key={c.id} className="flex items-baseline gap-3 rounded-3xl bg-fg/[0.03] px-4 py-2">
                          <span className="min-w-0 flex-1 text-ink-100">{c.front}</span>
                          <span className="min-w-0 flex-1 text-ink-400">{c.back}</span>
                          <span className="shrink-0 text-xs text-ink-600">{isNew(c) ? 'new' : fmtDateTime(c.due)}</span>
                          <button className="shrink-0 text-xs text-ember-300 hover:text-ember-200" onClick={() => db.cards.delete(c.id)} aria-label="Delete card">✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
        <AddCard decks={decks.filter(d => !starterNames.has(d))} />
        <PasteCards decks={decks.filter(d => !starterNames.has(d))} />
      </div>
    </div>
  )
}

function DeckField({ value, onChange, decks }: { value: string; onChange: (v: string) => void; decks: string[] }) {
  return (
    <div>
      <label className={labelCls}>Deck</label>
      <input className={inputCls} list="deck-names" value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. Current affairs — Nov" />
      <datalist id="deck-names">{decks.map(d => <option key={d} value={d} />)}</datalist>
    </div>
  )
}

function AddCard({ decks }: { decks: string[] }) {
  const [deck, setDeck] = useState(decks[0] ?? 'My cards')
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [n, setN] = useState(0)
  const add = async () => {
    await addFlashcards(deck.trim() || 'My cards', [[front.trim(), back.trim()]])
    setFront('')
    setBack('')
    setN(n + 1)
  }
  return (
    <Card title="Add a card">
      <div className="space-y-3">
        <DeckField value={deck} onChange={setDeck} decks={decks} />
        <div><label className={labelCls}>Front (question)</label><input className={inputCls} value={front} onChange={e => setFront(e.target.value)} /></div>
        <div><label className={labelCls}>Back (answer)</label><input className={inputCls} value={back} onChange={e => setBack(e.target.value)} onKeyDown={e => e.key === 'Enter' && front.trim() && back.trim() && add()} /></div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button variant="subtle" disabled={!front.trim() || !back.trim()} onClick={add}>Add card</Button>
        {n > 0 && <span className="text-sm text-verdant-300">{n} added</span>}
      </div>
    </Card>
  )
}

function PasteCards({ decks }: { decks: string[] }) {
  const [deck, setDeck] = useState(decks[0] ?? 'Current affairs')
  const [raw, setRaw] = useState('')
  const [msg, setMsg] = useState('')
  const parsed = parsePastedCards(raw)
  return (
    <Card title="Paste many (Telegram, notes)">
      <p className="mb-4 text-sm text-ink-400">
        One card per line: <span className="text-ink-200">Front - Back</span>, <span className="text-ink-200">Front : Back</span> or <span className="text-ink-200">Front | Back</span>, or Q:/A: pairs on consecutive lines. Emoji and bullets are ignored.
      </p>
      <div className="space-y-3">
        <DeckField value={deck} onChange={setDeck} decks={decks} />
        <textarea className={`${inputBase} h-36 w-full px-4 py-3 font-mono text-xs`} value={raw} onChange={e => { setRaw(e.target.value); setMsg('') }}
          placeholder={'📌 Exercise Garuda - India & France (Air Force)\nQ: Who is the Chief of the Air Staff?\nA: …'} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="subtle" disabled={!parsed.pairs.length} onClick={async () => { setMsg(`Added ${await addFlashcards(deck.trim() || 'Pasted', parsed.pairs)} cards.`); setRaw('') }}>
          Add {parsed.pairs.length || ''} cards
        </Button>
        {raw && <span className="text-xs text-ink-500">{parsed.pairs.length} recognised{parsed.skipped ? ` · ${parsed.skipped} lines skipped` : ''}</span>}
        {msg && <span className="text-sm text-verdant-300">{msg}</span>}
      </div>
    </Card>
  )
}
